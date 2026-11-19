"use client";
import { useRef, type ReactNode, type MouseEvent } from "react";
/** Card with a cursor-following glow and gradient border on hover (CSS in globals: .spotlight). */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => { const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`); };
  return <div ref={ref} onMouseMove={onMove} className={`spotlight ${className}`}>{children}</div>;
}
