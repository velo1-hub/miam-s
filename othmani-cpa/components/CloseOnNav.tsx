"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Referme le menu mobile (<details>) après une navigation côté client. */
export function CloseOnNav({ targetId }: { targetId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLDetailsElement | null;
    if (el) el.open = false;
  }, [pathname, targetId]);
  return null;
}
