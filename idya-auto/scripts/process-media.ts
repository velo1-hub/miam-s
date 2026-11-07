/**
 * Runs rendered (or photographed) frames through the delivery pipeline — brief §10.2, steps 4–7
 * in local form: resize to the spin sizes, encode AVIF + WebP, build the 32 px LQIP of the cover
 * frame, and write the results back into demo/seed.json (spin + gallery media).
 *
 *   pnpm tsx scripts/process-media.ts [--only v01] [--sizes sm,md] [--formats avif,webp]
 *
 * Input:  public/demo/vehicles/{id}/raw/NN.png and raw/gallery-*.png
 * Output: public/demo/vehicles/{id}/spin/v{n}/{size}/NN.{avif|webp}, gallery/NN.webp
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vehiclesDir = path.join(root, "public", "demo", "vehicles");
const seedPath = path.join(root, "demo", "seed.json");

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const only = args.includes("--only") ? flag("--only", "").split(",") : null;
const sizes = flag("--sizes", "sm,md").split(",") as ("sm" | "md" | "lg" | "xl")[];
const formats = flag("--formats", "avif,webp").split(",") as ("avif" | "webp")[];
const keepRaw = args.includes("--keep-raw");

const WIDTHS = { sm: 960, md: 1600, lg: 2400, xl: 3200 } as const;
const COVER_FRAME = 4; // front three-quarter, nose toward the headline (brief §3.0)
const GALLERY_ORDER = ["front-low", "rear", "side", "wheel"] as const;

interface SeedVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  exteriorColor: string | null;
  spin?: unknown;
  media?: unknown;
}

async function encode(input: Buffer, width: number, format: "avif" | "webp", out: string) {
  const pipeline = sharp(input).resize({ width, withoutEnlargement: true });
  const buf =
    format === "avif"
      ? await pipeline.avif({ quality: 50, effort: 4 }).toBuffer()
      : await pipeline.webp({ quality: 75, effort: 4 }).toBuffer();
  await writeFile(out, buf);
  return buf.length;
}

async function lqip(input: Buffer): Promise<string> {
  const buf = await sharp(input).resize({ width: 32 }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as { vehicles: SeedVehicle[] };
  const ids = (await readdir(vehiclesDir)).filter((id) => existsSync(path.join(vehiclesDir, id, "raw")) && (!only || only.includes(id)));
  const started = Date.now();
  for (const id of ids) {
    const v = seed.vehicles.find((x) => x.id === id);
    if (!v) continue;
    const raw = path.join(vehiclesDir, id, "raw");
    const frames = (await readdir(raw)).filter((f) => /^\d\d\.png$/.test(f)).sort();
    const version = 1;
    let bytes = 0;
    for (const size of sizes) {
      await mkdir(path.join(vehiclesDir, id, "spin", `v${version}`, size), { recursive: true });
    }
    let coverLqip = "";
    for (const f of frames) {
      const input = await readFile(path.join(raw, f));
      const nn = f.replace(".png", "");
      for (const size of sizes) {
        for (const fmt of formats) {
          bytes += await encode(input, WIDTHS[size], fmt, path.join(vehiclesDir, id, "spin", `v${version}`, size, `${nn}.${fmt}`));
        }
      }
      if (Number(nn) === COVER_FRAME + 1) coverLqip = await lqip(input);
    }
    // Gallery
    await mkdir(path.join(vehiclesDir, id, "gallery"), { recursive: true });
    const media: unknown[] = [];
    let pos = 0;
    const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`;
    const altFr: Record<string, string> = {
      "front-low": `${title}, vue avant de trois quarts en studio`,
      rear: `${title}, vue arrière de trois quarts`,
      side: `${title}, profil`,
      wheel: `${title}, détail de la roue et de l'aile`,
    };
    const altEn: Record<string, string> = {
      "front-low": `${title}, front three-quarter studio view`,
      rear: `${title}, rear three-quarter view`,
      side: `${title}, side profile`,
      wheel: `${title}, wheel and fender detail`,
    };
    for (const g of GALLERY_ORDER) {
      const file = path.join(raw, `gallery-${g}.png`);
      if (!existsSync(file)) continue;
      const input = await readFile(file);
      pos += 1;
      const nn = String(pos).padStart(2, "0");
      bytes += await encode(input, 1600, "webp", path.join(vehiclesDir, id, "gallery", `${nn}.webp`));
      media.push({
        kind: "gallery",
        position: pos,
        src: `/demo/vehicles/${id}/gallery/${nn}.webp`,
        width: 1600,
        height: 900,
        lqip: await lqip(input),
        altFr: altFr[g],
        altEn: altEn[g],
      });
    }
    v.spin = {
      frameCount: frames.length,
      coverFrame: COVER_FRAME,
      reverse: false,
      version,
      sizes,
      formats,
      baseUrl: `/demo/vehicles/${id}`,
      lqip: coverLqip,
      width: 1600,
      height: 900,
    };
    v.media = media;
    if (!keepRaw) await rm(raw, { recursive: true, force: true });
    console.log(`${id}: ${frames.length} frames × ${sizes.length} sizes × ${formats.length} formats, ${(bytes / 1_048_576).toFixed(1)} MB`);
  }
  await writeFile(seedPath, JSON.stringify(seed, null, 2) + "\n");
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
