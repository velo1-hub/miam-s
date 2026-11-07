"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
/** Current year rendered on the client so prerendering stays time-independent (Cache Components). */
export function Year() {
  const year = useSyncExternalStore(subscribe, () => new Date().getFullYear(), () => 2026);
  return <>{year}</>;
}
