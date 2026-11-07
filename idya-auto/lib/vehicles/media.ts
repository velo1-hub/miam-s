import type { ImageFormat, SpinSet, SpinSize, Vehicle } from "./types";
import { SPIN_SIZES, SPIN_WIDTHS } from "./types";

export function spinFrameUrl(spin: SpinSet, size: SpinSize, format: ImageFormat, frameIndex: number): string {
  const nn = String(((frameIndex % spin.frameCount) + spin.frameCount) % spin.frameCount + 1).padStart(2, "0");
  return `${spin.baseUrl}/spin/v${spin.version}/${size}/${nn}.${format}`;
}

/** Largest available size whose width is ≤ the ideal width for the container, else the largest available. */
export function pickSpinSize(spin: SpinSet, containerWidthCssPx: number, dpr = 1): SpinSize {
  const ideal: SpinSize = containerWidthCssPx < 600 ? "sm" : containerWidthCssPx < 1200 ? "md" : "lg";
  const idealW = SPIN_WIDTHS[ideal] * Math.min(dpr, 2) * 0.5; // dpr is already accounted in ideal buckets (brief §9)
  const available = SPIN_SIZES.filter((s) => spin.sizes.includes(s));
  let best = available[0];
  for (const s of available) if (SPIN_WIDTHS[s] <= Math.max(idealW, SPIN_WIDTHS[ideal])) best = s;
  return best;
}

export function pickFormat(spin: SpinSet, avifSupported: boolean): ImageFormat {
  if (avifSupported && spin.formats.includes("avif")) return "avif";
  return spin.formats.includes("webp") ? "webp" : spin.formats[0];
}

/** Cover image for cards, OG images and the viewer poster. Prefers the spin cover frame (md/webp). */
export function coverImage(v: Pick<Vehicle, "spin" | "media">): { src: string; width: number; height: number; lqip?: string } | null {
  if (v.spin) {
    const size: SpinSize = v.spin.sizes.includes("md") ? "md" : v.spin.sizes[0];
    return {
      src: spinFrameUrl(v.spin, size, "webp", v.spin.coverFrame),
      width: SPIN_WIDTHS[size],
      height: Math.round((SPIN_WIDTHS[size] * v.spin.height) / v.spin.width),
      lqip: v.spin.lqip,
    };
  }
  const first = v.media[0];
  return first ? { src: first.src, width: first.width, height: first.height, lqip: first.lqip } : null;
}

/** 12 evenly spaced frame indices for the card hover scrub (brief §7). */
export function scrubFrames(spin: SpinSet, count = 12): number[] {
  const step = spin.frameCount / count;
  return Array.from({ length: count }, (_, i) => Math.round(i * step) % spin.frameCount);
}
