"use client";
import { useEffect } from "react";
import { site } from "@/lib/site";

/**
 * 1) Écrit le H1 lettre par lettre au fil du défilement (le texte complet reste dans le HTML).
 * 2) Ajoute la vidéo en boucle sur grand écran seulement.
 */
export function HeroEnhance({ titleId, trackId, mediaId }: { titleId: string; trackId: string; mediaId: string }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Vidéo : seulement sur écran ≥ 768 px, sans « économie de données », sans réduction des animations
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const media = document.getElementById(mediaId);
    if (media && (site.heroVideo.webm || site.heroVideo.mp4) && !reduce && !conn?.saveData && window.matchMedia("(min-width: 768px)").matches) {
      const v = document.createElement("video");
      Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, preload: "auto" });
      v.setAttribute("aria-hidden", "true");
      v.className = "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000";
      for (const [type, src] of [["video/webm", site.heroVideo.webm], ["video/mp4", site.heroVideo.mp4]]) {
        if (!src) continue;
        const s = document.createElement("source");
        s.src = src; s.type = type; v.appendChild(s);
      }
      v.addEventListener("playing", () => v.classList.remove("opacity-0"), { once: true });
      media.appendChild(v);
      v.play().catch(() => {});
    }

    // Titre lettre par lettre
    const h1 = document.getElementById(titleId);
    const track = document.getElementById(trackId);
    if (!h1 || !track) return;
    const text = h1.textContent ?? "";
    h1.setAttribute("aria-label", text);
    const frag = document.createDocumentFragment();
    const chars: HTMLSpanElement[] = [];
    // On garde les mots insécables pour éviter les coupures au milieu d'un mot
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "inline-block whitespace-nowrap";
      w.setAttribute("aria-hidden", "true");
      for (const c of part) {
        const s = document.createElement("span");
        s.className = "ch"; s.textContent = c; w.appendChild(s); chars.push(s);
      }
      frag.appendChild(w);
    });
    h1.textContent = "";
    h1.appendChild(frag);
    h1.classList.add("typing");
    if (reduce) { chars.forEach((c) => c.classList.add("on")); h1.classList.add("typed"); return; }

    // Petit écran : le héros n'est pas « collant », le titre s'écrit donc tout seul à l'arrivée
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      let i = 0;
      const id = setInterval(() => {
        if (i > 0) chars[i - 1].classList.remove("cur");
        if (i >= chars.length) { clearInterval(id); h1.classList.add("typed"); return; }
        chars[i].classList.add("on", "cur");
        i++;
      }, 38);
      return () => clearInterval(id);
    }

    let shown = -1;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const range = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / range));
      // Quelques lettres s'écrivent d'emblée, le reste suit le défilement et se termine à 65 %
      const n = Math.round(chars.length * Math.min(1, 0.25 + p / 0.55));
      if (n === shown) return;
      chars.forEach((c, i) => {
        c.classList.toggle("on", i < n);
        c.classList.toggle("cur", i === n - 1 && n < chars.length);
      });
      h1.classList.toggle("typed", n >= chars.length);
      shown = n;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [titleId, trackId, mediaId]);
  return null;
}
