"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type LeadDialogType = "question" | "financing" | "trade_in" | "contact" | "inventory_alert" | "human";

export interface LeadDialogState {
  open: boolean;
  type: LeadDialogType;
  context: Record<string, string>;
}

interface Value {
  openLead: (type: LeadDialogType, context?: Record<string, string>) => void;
  closeLead: () => void;
  state: LeadDialogState;
}

const Ctx = createContext<Value | null>(null);
const LeadDialog = dynamic(() => import("./lead-dialog").then((m) => m.LeadDialog), { ssr: false });

export function LeadDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LeadDialogState>({ open: false, type: "question", context: {} });
  const [mounted, setMounted] = useState(false);
  const openLead = useCallback((type: LeadDialogType, context: Record<string, string> = {}) => {
    setMounted(true);
    setState({ open: true, type, context });
  }, []);
  const closeLead = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const value = useMemo(() => ({ openLead, closeLead, state }), [openLead, closeLead, state]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted ? <LeadDialog state={state} onOpenChange={(o) => (o ? null : closeLead())} /> : null}
    </Ctx.Provider>
  );
}

export function useLeadDialog(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLeadDialog must be used within LeadDialogProvider");
  return v;
}
