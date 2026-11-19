"use client";
import { useEffect, useRef, useState } from "react";
/** Autoplaying, muted, looping background video with a poster, portrait source on phones, paused when off-screen or reduced-motion. */
export function HeroVideo({ desktop, mobile, poster, posterMobile }: { desktop: { webm?: string; mp4: string }; mobile?: { webm?: string; mp4: string }; poster: string; posterMobile?: string }) {
  const ref = useRef<HTMLVideoElement>(null); const [playing, setPlaying] = useState(false); const [portrait, setPortrait] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)"); const on = () => setPortrait(mq.matches); on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onPlaying = () => setPlaying(true); v.addEventListener("playing", onPlaying);
    const tryPlay = () => v.play().then(() => setPlaying(true)).catch(() => {});
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.1 });
    io.observe(v);
    const kick = () => { if (v.paused) tryPlay(); }; window.addEventListener("touchstart", kick, { once: true, passive: true }); window.addEventListener("scroll", kick, { once: true, passive: true });
    return () => { io.disconnect(); v.removeEventListener("playing", onPlaying); window.removeEventListener("touchstart", kick); window.removeEventListener("scroll", kick); };
  }, [portrait]);
  const src = portrait && mobile ? mobile : desktop; const p = portrait && posterMobile ? posterMobile : poster;
  return (
    <>
      {/* Poster always visible underneath: covers browsers that block autoplay (Low Power Mode, data saver) and the first frames while the video loads. */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${p})` }} aria-hidden />
      <video key={src.mp4} ref={ref} className="hero-video absolute inset-0 h-full w-full object-cover" data-playing={playing} muted playsInline loop autoPlay preload="auto" poster={p} aria-hidden>
        {src.webm && <source src={src.webm} type="video/webm" />}<source src={src.mp4} type="video/mp4" />
      </video>
    </>
  );
}
