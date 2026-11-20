"use client";
import { useEffect } from "react";

/** Ajoute data-scrolled à l'en-tête dès que la page défile (effet verre dépoli). */
export function HeaderScroll() {
  useEffect(() => {
    const h = document.querySelector<HTMLElement>(".site-header");
    if (!h) return;
    const on = () => h.toggleAttribute("data-scrolled", window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return null;
}
