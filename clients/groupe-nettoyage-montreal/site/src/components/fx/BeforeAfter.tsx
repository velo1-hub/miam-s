"use client";
import { useState } from "react";
/** Draggable before/after comparison. Photos only: no gradients, badges or icons over the images; a thin divider and two small text labels. */
export function BeforeAfter({ before, after, labels = ["Avant", "Après"] }: { before: string; after: string; labels?: [string, string] }) {
  const [v, setV] = useState(50);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand-100 select-none">
      <img src={after} alt={labels[1]} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${v}%` }}>
        <img src={before} alt={labels[0]} className="absolute inset-y-0 left-0 h-full max-w-none object-cover" style={{ width: `${10000 / v}%` }} draggable={false} />
      </div>
      <div className="absolute inset-y-0 w-px bg-white/90" style={{ left: `${v}%` }} aria-hidden />
      <span className="absolute bottom-3 left-3 text-[12px] font-semibold uppercase tracking-wider text-white drop-shadow">{labels[0]}</span>
      <span className="absolute bottom-3 right-3 text-[12px] font-semibold uppercase tracking-wider text-white drop-shadow">{labels[1]}</span>
      <input type="range" min={2} max={98} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label={`${labels[0]} / ${labels[1]}`} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}
