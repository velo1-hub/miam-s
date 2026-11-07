import { NextResponse } from "next/server";
import sharp, { type Sharp } from "sharp";
import { z } from "zod";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/supabase/server";
import { IMAGE_FORMATS, SPIN_SIZES, SPIN_WIDTHS, type ImageFormat, type SpinSize } from "@/lib/vehicles/types";

/**
 * Image pipeline — brief §10.2 steps 3–6, ONE frame per request (the admin client drives frames
 * with concurrency 4 and shows per-frame progress, step 2).
 *
 *   originals/vehicles/{vehicleId}/{kind}/{nn}.jpg   (private bucket, resumable upload)
 *     → auto-orient, strip metadata (GPS included)
 *     → optional Photoroom background removal, composited on the studio backdrop with a soft shadow
 *     → shared crop box (computed by the admin from the union of every frame's bbox, step 4)
 *     → sm 960 / md 1600 / lg 2400 / xl 3200 × avif q50 / webp q75
 *   vehicles/vehicles/{vehicleId}/{kind}/v{version}/{size}/{nn}.{avif|webp}   (public, immutable)
 *
 * Function duration — Node runtime. `cacheComponents` is on, so this file exports no route segment
 * config (`runtime`, `maxDuration`). Encoding 8 outputs of a 3000 px frame takes 20–60 s on a
 * Vercel function: size it in vercel.json instead —
 *   { "functions": { "app/api/media/process/route.ts": { "maxDuration": 120, "memory": 3009 } } }
 *
 * Never throws raw errors to the client: every failure maps to `{ ok: false, error }`.
 */

const PHOTOROOM_ENDPOINT = "https://sdk.photoroom.com/v1/segment";
const PHOTOROOM_TIMEOUT_MS = 45_000;
const BACKDROP_TOP = "#17171B";
const BACKDROP_BOTTOM = "#08080A";
const ALPHA_THRESHOLD = 16; // 0–255: pixels above count as "car" for the bounding box
const LQIP_WIDTH = 32;
const CACHE_CONTROL = "31536000"; // one year — paths are versioned (step 6)

const bodySchema = z.object({
  vehicleId: z.uuid(),
  version: z.number().int().min(1).max(999),
  frame: z.number().int().min(1).max(999),
  total: z.number().int().min(1).max(999),
  kind: z.enum(["spin", "interior", "gallery"]),
  removeBackground: z.boolean().optional(),
  crop: z
    .object({
      left: z.number().int().min(0),
      top: z.number().int().min(0),
      width: z.number().int().min(16),
      height: z.number().int().min(16),
    })
    .optional(),
});
type Body = z.infer<typeof bodySchema>;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Output {
  size: SpinSize;
  format: ImageFormat;
  bytes: number;
}

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });
const fail = (error: string, status: number) => json({ ok: false, error }, status);
const frameName = (frame: number) => String(frame).padStart(2, "0");

export async function POST(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return fail("unauthorized", 401);

  let body: Body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return fail("bad_request", 400);
  }
  if (body.frame > body.total) return fail("bad_request", 400);

  try {
    const db = createAdminClient();
    const nn = frameName(body.frame);
    const original = await downloadOriginal(db, `vehicles/${body.vehicleId}/${body.kind}/${nn}.jpg`);
    if (!original) return fail("original_not_found", 404);

    const prepared = await prepareFrame(original, body.removeBackground === true);
    if (!prepared) return fail("processing_failed", 500);

    const framed = body.crop ? await cropFrame(prepared.image, body.crop) : prepared.image;
    const base = sharp(framed);
    const { width = 0, height = 0 } = await base.metadata();

    const prefix = `vehicles/${body.vehicleId}/${body.kind}/v${body.version}`;
    const outputs = await encodeAndUpload(db, base, prefix, nn);
    if (outputs.length === 0) return fail("upload_failed", 502);

    const lqip = await makeLqip(base);
    return json({
      ok: true,
      frame: body.frame,
      bytes: outputs.reduce((sum, o) => sum + o.bytes, 0),
      outputs,
      width,
      height,
      lqip,
      bbox: prepared.bbox ?? undefined,
      backgroundRemoved: prepared.backgroundRemoved,
    });
  } catch (error) {
    console.error("[media/process] frame failed", error);
    return fail("processing_failed", 500);
  }
}

// ---------------------------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------------------------

async function downloadOriginal(db: AdminClient, path: string): Promise<Buffer | null> {
  const { data, error } = await db.storage.from("originals").download(path);
  if (error || !data) {
    if (error) console.warn(`[media/process] download ${path}: ${error.message}`);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

async function upload(db: AdminClient, path: string, buf: Buffer, format: ImageFormat): Promise<boolean> {
  const { error } = await db.storage.from("vehicles").upload(path, buf, {
    contentType: `image/${format}`,
    cacheControl: CACHE_CONTROL,
    upsert: true,
  });
  if (error) console.error(`[media/process] upload ${path}: ${error.message}`);
  return !error;
}

// ---------------------------------------------------------------------------------------------
// Pipeline steps
// ---------------------------------------------------------------------------------------------

/**
 * Step 3: orient from EXIF and drop every metadata block (sharp strips metadata unless asked to
 * keep it), then optionally cut the car out and set it on the studio backdrop.
 */
async function prepareFrame(original: Buffer, removeBackground: boolean): Promise<{ image: Buffer; bbox: Box | null; backgroundRemoved: boolean } | null> {
  const oriented = await sharp(original).autoOrient().png({ compressionLevel: 1 }).toBuffer();
  const apiKey = process.env.PHOTOROOM_API_KEY;
  if (!removeBackground || !apiKey) return { image: oriented, bbox: null, backgroundRemoved: false };

  const cutout = await photoroomCutout(oriented, apiKey);
  if (!cutout) {
    // Photoroom unavailable: deliver the frame as is and let the admin see the warning (C9).
    console.warn("[media/process] background removal skipped (Photoroom unavailable)");
    return { image: oriented, bbox: null, backgroundRemoved: false };
  }
  const bbox = await alphaBoundingBox(cutout);
  const image = await compositeOnBackdrop(cutout, bbox);
  return { image, bbox, backgroundRemoved: true };
}

/** Photoroom segmentation: multipart `image_file`, returns a PNG with alpha (brief §10.2 step 3). */
async function photoroomCutout(png: Buffer, apiKey: string): Promise<Buffer | null> {
  try {
    const jpeg = await sharp(png).jpeg({ quality: 92 }).toBuffer();
    const form = new FormData();
    form.append("image_file", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "frame.jpg");
    form.append("format", "png");
    form.append("size", "full");
    const res = await fetch(PHOTOROOM_ENDPOINT, {
      method: "POST",
      headers: { "x-api-key": apiKey, accept: "image/png" },
      body: form,
      signal: AbortSignal.timeout(PHOTOROOM_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[media/process] Photoroom ${res.status}`);
      return null;
    }
    const out = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(out).metadata();
    return meta.hasAlpha ? out : null;
  } catch (error) {
    console.warn("[media/process] Photoroom request failed", error);
    return null;
  }
}

/** Bounding box of the opaque pixels — the admin unions these across frames into the shared crop (step 4). */
async function alphaBoundingBox(png: Buffer): Promise<Box | null> {
  const { data, info } = await sharp(png).ensureAlpha().extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    const rowStart = y * info.width;
    for (let x = 0; x < info.width; x++) {
      if (data[rowStart + x] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Studio backdrop (vertical gradient) with a soft elliptical floor shadow under the car. */
function backdropSvg(width: number, height: number, bbox: Box | null): Buffer {
  const shadow = bbox
    ? `<ellipse cx="${(bbox.left + bbox.width / 2).toFixed(1)}" cy="${(bbox.top + bbox.height).toFixed(1)}" rx="${(bbox.width * 0.52).toFixed(1)}" ry="${Math.max(8, bbox.height * 0.09).toFixed(1)}" fill="url(#shadow)"/>`
    : "";
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs>` +
      `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BACKDROP_TOP}"/><stop offset="1" stop-color="${BACKDROP_BOTTOM}"/></linearGradient>` +
      `<radialGradient id="shadow"><stop offset="0" stop-color="#000" stop-opacity="0.7"/><stop offset="0.55" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
      `</defs>` +
      `<rect width="${width}" height="${height}" fill="url(#bg)"/>${shadow}</svg>`,
  );
}

async function compositeOnBackdrop(cutout: Buffer, bbox: Box | null): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(cutout).metadata();
  return sharp(backdropSvg(width, height, bbox))
    .composite([{ input: cutout, left: 0, top: 0 }])
    .png({ compressionLevel: 1 })
    .toBuffer();
}

/** Step 4: apply the shared crop box, clamped to the frame so a slightly-off box never throws. */
async function cropFrame(image: Buffer, crop: Box): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(image).metadata();
  const left = Math.min(crop.left, Math.max(0, width - 1));
  const top = Math.min(crop.top, Math.max(0, height - 1));
  const region = { left, top, width: Math.max(1, Math.min(crop.width, width - left)), height: Math.max(1, Math.min(crop.height, height - top)) };
  return sharp(image).extract(region).png({ compressionLevel: 1 }).toBuffer();
}

/** Steps 5–6: every size × format, uploaded with an immutable cache policy. Encodes run one at a time (CPU-bound), uploads in parallel. */
async function encodeAndUpload(db: AdminClient, base: Sharp, prefix: string, nn: string): Promise<Output[]> {
  const uploads: Promise<Output | null>[] = [];
  for (const size of SPIN_SIZES) {
    for (const format of IMAGE_FORMATS) {
      const pipeline = base.clone().resize({ width: SPIN_WIDTHS[size], withoutEnlargement: true });
      const buf = format === "avif" ? await pipeline.avif({ quality: 50, effort: 4 }).toBuffer() : await pipeline.webp({ quality: 75, effort: 4 }).toBuffer();
      const path = `${prefix}/${size}/${nn}.${format}`;
      uploads.push(upload(db, path, buf, format).then((ok) => (ok ? { size, format, bytes: buf.length } : null)));
    }
  }
  const results = await Promise.all(uploads);
  return results.filter((o): o is Output => o !== null);
}

/** Step 5: 32 px WebP placeholder as a data URI (the admin keeps the cover frame's). */
async function makeLqip(base: Sharp): Promise<string> {
  const buf = await base.clone().resize({ width: LQIP_WIDTH }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}
