"use client";
import { useEffect, useRef, useState } from "react";
/** Muted looping background video for a card: plays only while visible, respects reduced motion, poster layered underneath. */
type Src = { webm?: string; mp4: string; poster: string };
export function InlineVideo({ webm, mp4, poster, portraitAlt, className = "", position = "center" }: { webm?: string; mp4: string; poster: string; portraitAlt?: Src; className?: string; position?: string }) {
  const wrap = useRef<HTMLDivElement>(null); const [portrait, setPortrait] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)"); const on = () => setPortrait(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  if (portrait && portraitAlt) { webm = portraitAlt.webm; mp4 = portraitAlt.mp4; poster = portraitAlt.poster; }
  const html = `<video class="absolute inset-0 h-full w-full object-cover" style="object-position:${position}" muted autoplay playsinline loop preload="metadata" poster="${poster}" aria-hidden="true" disablepictureinpicture>${webm ? `<source src="${webm}" type="video/webm">` : ""}<source src="${mp4}" type="video/mp4"></video>`;
  useEffect(() => {
    const v = wrap.current?.querySelector("video"); if (!v) return; v.muted = true; v.defaultMuted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.pause(); return; }
    const tryPlay = () => { const r = v.play(); if (r && typeof r.catch === "function") r.catch(() => {}); };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.2 });
    io.observe(v); const kick = () => { if (v.paused) tryPlay(); }; window.addEventListener("pointerdown", kick, { once: true, passive: true }); window.addEventListener("touchstart", kick, { once: true, passive: true });
    return () => { io.disconnect(); window.removeEventListener("pointerdown", kick); window.removeEventListener("touchstart", kick); };
  }, [html]);
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${poster})`, backgroundPosition: position }} />
      <div ref={wrap} key={html} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
