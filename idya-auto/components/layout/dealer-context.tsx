"use client";

import { createContext, useContext, type ReactNode } from "react";

interface DealerInfo {
  phone: string;
  displayName: string;
  assistantName: string;
  chatRetentionDays: number;
}

const Ctx = createContext<DealerInfo>({ phone: "", displayName: "Idya Auto", assistantName: "Assistant Idya", chatRetentionDays: 90 });

/** Minimal dealership facts for client components (phone for error copy, names for the assistant). */
export function DealerProvider({ value, children }: { value: DealerInfo; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDealer() {
  return useContext(Ctx);
}
export function useDealerPhone() {
  return useContext(Ctx).phone;
}
