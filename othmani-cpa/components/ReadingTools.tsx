"use client";
import { useEffect, useState } from "react";

/** Barre de progression de lecture (en haut de l'écran). */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(Math.min(1, Math.max(0, total > 0 ? -r.top / total : 1)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [targetId]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-1 print:hidden" aria-hidden="true">
      <div className="h-full origin-left bg-gradient-to-r from-sky to-navy transition-transform duration-150" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Met en évidence la section en cours dans le sommaire. */
export function TocSpy({ ids }: { ids: string[] }) {
  useEffect(() => {
    const links = new Map(ids.map((id) => [id, document.querySelector<HTMLAnchorElement>(`[data-toc="${id}"]`)]));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a?.removeAttribute("aria-current"));
        links.get(e.target.id)?.setAttribute("aria-current", "true");
      }),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return null;
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg>
      {label}
    </button>
  );
}
