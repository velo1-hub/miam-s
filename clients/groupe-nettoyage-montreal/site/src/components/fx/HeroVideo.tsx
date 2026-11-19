"use client";
import { useEffect, useRef, useState } from "react";

type Src = { webm?: string; mp4: string };
/**
 * Autoplaying, muted, looping background video, always opaque, with the poster layered underneath so a blocked autoplay still shows the still frame.
 * The <video> markup is injected as raw HTML so the `muted`, `autoplay` and `playsinline`
 * attributes exist at parse time: React omits `muted` from server HTML, and Safari / iOS
 * refuse to autoplay a video that was not muted when the page loaded.
 */
export function HeroVideo({ desktop, mobile, poster, posterMobile }: { desktop: Src; mobile?: Src; poster: string; posterMobile?: string }) {
  const wrap = useRef<HTMLDivElement>(null); const [portrait, setPortrait] = useState<boolean | null>(null);
  useEffect(() => { const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)"); const on = () => setPortrait(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  const src = portrait && mobile ? mobile : desktop; const p = portrait && posterMobile ? posterMobile : poster;
  const html = `<video class="hero-video absolute inset-0 h-full w-full object-cover" muted autoplay playsinline loop preload="metadata" poster="${p}" aria-hidden="true" disablepictureinpicture>${src.webm ? `<source src="${src.webm}" type="video/webm">` : ""}<source src="${src.mp4}" type="video/mp4"></video>`;

  useEffect(() => {
    const v = wrap.current?.querySelector("video"); if (!v) return;
    v.muted = true; v.defaultMuted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.pause(); return; }
    const mark = () => { if (!v.paused && !v.ended) v.dataset.playing = "true"; };
    const onPlaying = () => mark(); v.addEventListener("playing", onPlaying); v.addEventListener("timeupdate", onPlaying);
    mark(); // autoplay may already have started before this effect ran
    const tryPlay = () => { const r = v.play(); if (r && typeof r.catch === "function") r.then(mark).catch(() => {}); };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.1 });
    io.observe(v);
    const kick = () => { if (v.paused) tryPlay(); };
    window.addEventListener("touchstart", kick, { once: true, passive: true }); window.addEventListener("scroll", kick, { once: true, passive: true }); window.addEventListener("pointerdown", kick, { once: true, passive: true });
    return () => { io.disconnect(); v.removeEventListener("playing", onPlaying); v.removeEventListener("timeupdate", onPlaying); window.removeEventListener("touchstart", kick); window.removeEventListener("scroll", kick); window.removeEventListener("pointerdown", kick); };
  }, [html]);

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${p})` }} aria-hidden />
      <div ref={wrap} key={html} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
