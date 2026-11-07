"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./icon-button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  closeLabel: string;
  /** Render as a bottom sheet (mobile) or centered dialog (desktop). "auto" switches at md. */
  mode?: "dialog" | "sheet" | "auto";
  className?: string;
  hideTitle?: boolean;
}

/**
 * Dialog / Sheet — brief §3.8. glass-3, radius 28, max-width 560, backdrop rgba(0,0,0,0.6).
 * Sheet variant: top radius 28, drag handle 36×4. Radix traps focus and closes on Escape.
 */
export function Dialog({ open, onOpenChange, title, description, children, closeLabel, mode = "auto", className, hideTitle }: DialogProps) {
  const sheet = mode === "sheet";
  const auto = mode === "auto";
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[fade-in_250ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_150ms_var(--ease-out)]" />
        <RadixDialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            "glass-3 fixed z-50 flex flex-col text-text outline-none",
            "data-[state=open]:animate-[dialog-in_250ms_var(--ease-out)] data-[state=closed]:animate-[dialog-out_150ms_var(--ease-out)]",
            (sheet || auto) && "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-card pb-[env(safe-area-inset-bottom)]",
            auto && "md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:max-h-[90dvh]",
            !sheet && !auto && "left-1/2 top-1/2 w-[calc(100%-40px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-card max-h-[90dvh]",
            className,
          )}
        >
          {(sheet || auto) && <div aria-hidden className={cn("mx-auto mt-3 h-1 w-9 shrink-0 rounded-pill bg-white/30", auto && "md:hidden")} />}
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <RadixDialog.Title className={cn("text-h3", hideTitle && "sr-only")}>{title}</RadixDialog.Title>
              {description ? <RadixDialog.Description className="mt-1 text-small text-text-2">{description}</RadixDialog.Description> : null}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label={closeLabel} variant="ghost" className="-mr-2 -mt-1">
                <X strokeWidth={1.5} />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
