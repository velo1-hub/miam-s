"use client";
import { useEffect, useRef } from "react";
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0; const h = document.documentElement;
    const paint = () => { raf = 0; const max = h.scrollHeight - h.clientHeight; if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`; };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div ref={bar} aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-amber-500 will-change-transform" style={{ transform: "scaleX(0)" }} />;
}
