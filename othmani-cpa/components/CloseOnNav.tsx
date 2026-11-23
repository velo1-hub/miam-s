"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Referme le menu (<details>) : après une navigation, avec Échap, ou par un clic sur le voile. */
export function CloseOnNav({ targetId }: { targetId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLDetailsElement | null;
    if (el) el.open = false;
  }, [pathname, targetId]);
  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLDetailsElement | null;
    if (!el) return;
    const close = () => { el.open = false; el.querySelector("summary")?.focus(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && el.open) close(); };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-close-menu]") || (el.open && t.closest(".menu-panel a"))) el.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [targetId]);
  return null;
}
