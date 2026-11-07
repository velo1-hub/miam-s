import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatPrice, type Locale } from "@/lib/format/number";
import { vehicles } from "@/lib/vehicles";
import { coverImage } from "@/lib/vehicles/media";
import { vehicleFullTitle } from "@/lib/vehicles/types";

export const alt = "Idya Auto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function coverDataUrl(src: string): Promise<string | null> {
  try {
    if (src.startsWith("/")) {
      const buf = await readFile(path.join(process.cwd(), "public", src));
      const mime = src.endsWith(".webp") ? "image/webp" : src.endsWith(".avif") ? "image/avif" : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
    const res = await fetch(src);
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${res.headers.get("content-type") ?? "image/jpeg"};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Dynamic Open Graph image per vehicle — brief §18: cover, year/make/model, price, wordmark. */
export default async function OgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const v = await vehicles.getBySlug(slug);
  const cover = v ? coverImage(v) : null;
  const img = cover ? await coverDataUrl(cover.src) : null;
  const title = v ? vehicleFullTitle(v) : "Idya Auto";
  const price = v ? formatPrice(v.priceCad, locale as Locale) : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#08080A", color: "#F5F5F7", fontFamily: "sans-serif", position: "relative" }}>
        {img ? <img src={img} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.6) 45%, rgba(8,8,10,0) 75%)" }} />
        <div style={{ position: "absolute", left: 64, bottom: 64, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, letterSpacing: 6 }}>
            <svg viewBox="0 0 200 44" width="92" height="20" fill="#E21F26">
              <path d="M0 37C34 24 70 9 114 5c33-3 62 5 86 22l-3 3C173 16 146 10 115 11 73 13 38 27 3 40z" />
              <path d="M56 34c30-10 68-15 112-8l-2 3c-42-5-78-1-108 9z" />
            </svg>
            <span style={{ fontWeight: 800, fontStyle: "italic" }}>IDYA</span>
            <span style={{ color: "rgba(245,245,247,0.68)" }}>AUTO</span>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2, maxWidth: 800, lineHeight: 1.05 }}>{title}</div>
          {price ? <div style={{ fontSize: 40, fontWeight: 600 }}>{price}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
