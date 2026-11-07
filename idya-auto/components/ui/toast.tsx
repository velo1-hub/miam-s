"use client";

import { Toast as RadixToast } from "radix-ui";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
}

const ToastContext = createContext<(t: Omit<ToastItem, "id">) => void>(() => undefined);

/** Toast — brief §3.8: bottom-center, glass-2, auto-dismiss 4 s, pauses on hover (Radix default). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    setItems((prev) => [...prev.slice(-2), { ...t, id: Date.now() + Math.random() }]);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider duration={4000} swipeDirection="down">
        {children}
        {items.map((t) => (
          <RadixToast.Root
            key={t.id}
            onOpenChange={(open) => !open && setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className="glass-2 rounded-card-sm px-4 py-3 text-small text-text data-[state=open]:animate-[dialog-in_250ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_150ms_var(--ease-out)] data-[swipe=end]:animate-[fade-out_150ms_var(--ease-out)]"
          >
            <RadixToast.Title className="font-medium">{t.title}</RadixToast.Title>
            {t.description ? <RadixToast.Description className="mt-0.5 text-text-2">{t.description}</RadixToast.Description> : null}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-6 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
