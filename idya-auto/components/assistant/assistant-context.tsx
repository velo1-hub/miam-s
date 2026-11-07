"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics/track";
import { favorites } from "@/lib/favorites/store";
import { viewHistory } from "@/lib/history/store";

export interface AssistantPageContext {
  locale: "fr" | "en";
  page: string | null;
  vehicleId: string | null;
  filters: Record<string, string> | null;
  favorites: string[];
}

interface Value {
  open: boolean;
  setOpen: (o: boolean) => void;
  sessionId: string;
  resetSession: () => void;
  context: AssistantPageContext;
  setVehicleId: (id: string | null) => void;
  nudge: boolean;
  dismissNudge: () => void;
}

const Ctx = createContext<Value | null>(null);
const SESSION_KEY = "idya:assistant-session";
const NUDGE_KEY = "idya:assistant-nudge-dismissed";
const NUDGE_SHOWN_KEY = "idya:assistant-nudge-shown";

const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function AssistantProvider({ locale, children }: { locale: "fr" | "en"; children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpenState] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const favs = favorites.useList();
  const viewed = viewHistory.useList();

  // Vehicle on screen (set by <AssistantVehicle> on vehicle pages)
  useEffect(() => {
    const read = () => setVehicleId(document.documentElement.dataset.vehicleId ?? null);
    const id = requestAnimationFrame(read);
    window.addEventListener("idya:vehicle", read);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("idya:vehicle", read);
    };
  }, [pathname]);

  // Session id persists while the visitor navigates (sessionStorage) — brief §27.1
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const existing = sessionStorage.getItem(SESSION_KEY);
        if (existing) setSessionId(existing);
        else {
          const fresh = newId();
          sessionStorage.setItem(SESSION_KEY, fresh);
          setSessionId(fresh);
        }
      } catch {
        setSessionId(newId());
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const resetSession = useCallback(() => {
    const fresh = newId();
    try {
      sessionStorage.setItem(SESSION_KEY, fresh);
    } catch {
      /* ignore */
    }
    setSessionId(fresh);
  }, []);

  const setOpen = useCallback((o: boolean) => {
    setOpenState(o);
    if (o) {
      track("assistant_opened");
      setNudge(false);
    }
  }, []);

  // Proactive nudge: once per session, after 25 s on a vehicle page or 3 vehicles viewed; silenced 7 days after dismissal
  useEffect(() => {
    if (open) return;
    let timer: number | undefined;
    const check = () => {
      try {
        const dismissed = Number(localStorage.getItem(NUDGE_KEY) ?? 0);
        if (Date.now() - dismissed < 7 * 86_400_000) return;
        if (sessionStorage.getItem(NUDGE_SHOWN_KEY)) return;
        sessionStorage.setItem(NUDGE_SHOWN_KEY, "1");
        setNudge(true);
      } catch {
        /* ignore */
      }
    };
    if (viewed.length >= 3) timer = window.setTimeout(check, 1500);
    else if (vehicleId) timer = window.setTimeout(check, 25_000);
    return () => window.clearTimeout(timer);
  }, [vehicleId, viewed.length, open]);

  const dismissNudge = useCallback(() => {
    setNudge(false);
    try {
      localStorage.setItem(NUDGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  const filters = useMemo(() => {
    const o: Record<string, string> = {};
    search.forEach((v, k) => {
      if (k !== "page") o[k] = v;
    });
    return Object.keys(o).length ? o : null;
  }, [search]);

  const context = useMemo<AssistantPageContext>(() => ({ locale, page: pathname, vehicleId, filters, favorites: favs }), [locale, pathname, vehicleId, filters, favs]);
  const value = useMemo<Value>(() => ({ open, setOpen, sessionId, resetSession, context, setVehicleId, nudge, dismissNudge }), [open, setOpen, sessionId, resetSession, context, nudge, dismissNudge]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAssistant must be used within AssistantProvider");
  return v;
}

/** Vehicle on screen, published by the vehicle page through a DOM attribute so the provider can read it anywhere in the tree. */
export function AssistantVehicle({ id }: { id: string }) {
  useEffect(() => {
    document.documentElement.dataset.vehicleId = id;
    window.dispatchEvent(new Event("idya:vehicle"));
    return () => {
      delete document.documentElement.dataset.vehicleId;
      window.dispatchEvent(new Event("idya:vehicle"));
    };
  }, [id]);
  return null;
}
