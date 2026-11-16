"use client";
import { useEffect, useRef, useState } from "react";

/** Compteur animé quand il entre à l'écran. Le HTML statique contient déjà la valeur finale. */
export function CountUp({ to, lang, suffix = "" }: { to: number; lang: "fr" | "en"; suffix?: string }) {
  const [v, setV] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA").format(n);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setV(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), dur = 1600;
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return (
    <span ref={ref} aria-label={`${fmt(to)}${suffix}`}>
      <span aria-hidden="true">{fmt(v)}{suffix}</span>
    </span>
  );
}
