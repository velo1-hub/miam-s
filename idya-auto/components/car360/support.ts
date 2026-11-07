"use client";

let avifPromise: Promise<boolean> | null = null;

/** Feature-detects AVIF decoding once per session (brief §9). */
export function supportsAvif(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!avifPromise) {
    avifPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0);
      img.onerror = () => resolve(false);
      img.src =
        "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
    });
  }
  return avifPromise;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 0, n/2, n/4, 3n/4, n/8, … — coarse rotation works after ~4 frames (brief §9). */
export function bisectionOrder(n: number): number[] {
  const out: number[] = [0];
  const seen = new Set<number>([0]);
  let step = n;
  while (step > 1) {
    step = step / 2;
    for (let i = step; i < n; i += step * 2) {
      const idx = Math.round(i) % n;
      if (!seen.has(idx)) {
        seen.add(idx);
        out.push(idx);
      }
    }
  }
  for (let i = 0; i < n; i++) if (!seen.has(i)) out.push(i);
  return out;
}

export const normalizeFrame = (f: number, n: number) => ((Math.round(f) % n) + n) % n;
