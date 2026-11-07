"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let timer: number | null = null;
let current = 0;

function subscribe(l: () => void) {
  listeners.add(l);
  if (timer === null) {
    current = Date.now();
    timer = window.setInterval(() => {
      current = Date.now();
      listeners.forEach((fn) => fn());
    }, 60_000);
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Current time, updated every minute, null during SSR/prerender so the server output stays
 * time-independent (Cache Components). Use for "open now" badges and relative labels.
 */
export function useNow(): Date | null {
  const ts = useSyncExternalStore(subscribe, () => (current === 0 ? (current = Date.now()) : current), () => 0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  if (!hydrated || ts === 0) return null;
  return new Date(ts);
}
