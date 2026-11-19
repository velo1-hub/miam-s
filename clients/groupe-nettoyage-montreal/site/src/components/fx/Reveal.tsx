"use client";
import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";
/** Fade-and-rise once when entering the viewport. Shown immediately without JS (noscript style in layout) and for reduced-motion users. */
export function Reveal({ children, index = 0, className = "", as: Tag = "div" }: { children: ReactNode; index?: number; className?: string; as?: ElementType }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.dataset.shown = "true"; return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { el.dataset.shown = "true"; io.disconnect(); } }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  const T = Tag as ElementType;
  return <T ref={ref} className={`reveal ${className}`} style={{ "--d": `${index * 90}ms` } as CSSProperties}>{children}</T>;
}
