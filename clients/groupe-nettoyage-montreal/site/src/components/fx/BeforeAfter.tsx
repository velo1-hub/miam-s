"use client";
import { useState } from "react";
/** Draggable before/after comparison. Pass two image URLs; falls back to tinted panels when images are missing. */
export function BeforeAfter({ before, after, labels = ["Avant", "Après"] }: { before?: string; after?: string; labels?: [string, string] }) {
  const [v, setV] = useState(55);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-900 select-none">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `${after ? `url(${after}),` : ""} linear-gradient(135deg,#eef3f8,#d8e3ee)` }} />
      <div className="absolute inset-y-0 left-0 bg-cover bg-center" style={{ width: `${v}%`, backgroundImage: `${before ? `url(${before}),` : ""} linear-gradient(135deg,#8a7a6a,#5d5148)`, backgroundSize: `${10000 / v}% auto` }} />
      <div className="absolute inset-y-0 w-0.5 bg-white shadow-soft" style={{ left: `${v}%` }} aria-hidden><span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-900 shadow-soft">⇔</span></div>
      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{labels[0]}</span>
      <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy-950">{labels[1]}</span>
      <input type="range" min={0} max={100} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label={`${labels[0]} / ${labels[1]}`} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}
