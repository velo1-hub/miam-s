"use client";

import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { AnimatePresence, DUR, EASE_OUT, m, useReducedMotion } from "@/components/ui/motion";
import { cn } from "@/lib/utils/cn";
import { useAssistant } from "./assistant-context";

const Panel = dynamic(() => import("./panel").then((x) => x.AssistantPanel), { ssr: false });

/** Launcher — brief §27.1: 56 px glass-2, sparkle, red dot, hover label « Une question ? », nudge bubble above. */
export function AssistantLauncher() {
  const t = useTranslations("assistant");
  const { open, setOpen, nudge, dismissNudge } = useAssistant();
  const reduced = useReducedMotion();
  return (
    <>
      <div className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-[var(--gutter)] z-40 flex flex-col items-end gap-3 lg:bottom-6">
        <AnimatePresence>
          {nudge && !open && (
            <m.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: DUR.base, ease: EASE_OUT }}
              className="glass-2 flex max-w-[260px] items-center gap-2 rounded-card-sm py-2 pl-4 pr-2 text-small text-text"
              role="status"
            >
              <button type="button" onClick={() => setOpen(true)} className="text-left hover:underline">{t("nudge")}</button>
              <button type="button" onClick={dismissNudge} aria-label={t("nudgeDismiss")} className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-text-2 hover:bg-white/10 hover:text-text">
                <X className="size-4" strokeWidth={1.5} aria-hidden />
              </button>
            </m.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="assistant-panel"
          aria-label={open ? t("closeLabel") : t("openLabel")}
          title={t("launcher")}
          className={cn("press group relative inline-flex size-launcher items-center justify-center rounded-pill glass-2 text-text hover:bg-white/10", open && "lg:hidden")}
        >
          <Sparkles className="size-6" strokeWidth={1.5} aria-hidden />
          <span aria-hidden className="absolute right-3 top-3 size-2 rounded-pill bg-red" />
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-pill bg-text px-3 py-1.5 text-caption font-medium text-bg opacity-0 transition-opacity group-hover:opacity-100 lg:block">
            {t("launcher")}
          </span>
        </button>
      </div>
      {open && <Panel />}
    </>
  );
}
