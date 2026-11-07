"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics/track";

interface BookingState {
  open: boolean;
  vehicleId: string | null;
}

interface BookingContextValue {
  openBooking: (vehicleId?: string | null) => void;
  closeBooking: () => void;
  state: BookingState;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// The dialog (slots, forms, Zod) is only loaded when first opened — it is not on the critical path.
const BookingDialog = dynamic(() => import("./booking-dialog").then((m) => m.BookingDialog), { ssr: false });

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>({ open: false, vehicleId: null });
  const [mounted, setMounted] = useState(false);
  const openBooking = useCallback((vehicleId?: string | null) => {
    track("booking_started", vehicleId ? { vehicleId } : undefined);
    setMounted(true);
    setState({ open: true, vehicleId: vehicleId ?? null });
  }, []);
  const closeBooking = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const value = useMemo(() => ({ openBooking, closeBooking, state }), [openBooking, closeBooking, state]);
  return (
    <BookingContext.Provider value={value}>
      {children}
      {mounted ? <BookingDialog open={state.open} vehicleId={state.vehicleId} onOpenChange={(o) => (o ? null : closeBooking())} /> : null}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
