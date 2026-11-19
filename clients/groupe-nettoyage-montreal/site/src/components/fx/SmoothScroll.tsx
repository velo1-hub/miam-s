"use client";
import { useEffect } from "react";
import Lenis from "lenis";
/** Lenis smooth scrolling (same stack as the reference site). Disabled for reduced-motion users. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = 0; const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
  return null;
}
