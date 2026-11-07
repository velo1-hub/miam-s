"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store with cross-tab sync, used for favorites, compare and viewing
 * history (brief §1: no customer accounts; §27.3: on-device only, no consent needed).
 */
export function createLocalListStore(key: string, max: number) {
  let cache: string[] | null = null;
  const listeners = new Set<() => void>();
  const EMPTY: string[] = [];

  const read = (): string[] => {
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (next: string[]) => {
    cache = next.slice(0, max);
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* private mode or quota: in-memory only */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    useList: () => useSyncExternalStore(subscribe, read, () => EMPTY),
    get: () => (typeof window === "undefined" ? EMPTY : read()),
    has: (id: string) => read().includes(id),
    add: (id: string) => {
      const cur = read();
      if (!cur.includes(id)) write([id, ...cur]);
    },
    remove: (id: string) => write(read().filter((x) => x !== id)),
    toggle: (id: string) => {
      const cur = read();
      if (cur.includes(id)) write(cur.filter((x) => x !== id));
      else write([id, ...cur]);
      return !cur.includes(id);
    },
    /** Moves id to the front (most recent first), keeping at most `max`. */
    touch: (id: string) => write([id, ...read().filter((x) => x !== id)]),
    clear: () => write([]),
  };
}
