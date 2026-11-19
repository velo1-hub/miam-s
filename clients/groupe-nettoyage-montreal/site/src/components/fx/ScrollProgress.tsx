"use client";
import { useEffect, useState } from "react";
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => { const on = () => { const h = document.documentElement; setP(h.scrollHeight > h.clientHeight ? h.scrollTop / (h.scrollHeight - h.clientHeight) : 0); }; on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  return <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-amber-500" style={{ transform: `scaleX(${p})` }} />;
}
