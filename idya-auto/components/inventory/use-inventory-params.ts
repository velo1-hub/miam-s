"use client";

import { useQueryStates } from "nuqs";
import { inventoryParsers } from "@/lib/vehicles/search-params";

/** Shared URL state hook — server-side filtering, so every change is a real navigation (shallow: false). */
export function useInventoryParams() {
  return useQueryStates(inventoryParsers, { shallow: false, history: "push", scroll: false, clearOnDefault: true });
}
