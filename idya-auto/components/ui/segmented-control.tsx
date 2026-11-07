"use client";

import { useId } from "react";
import { m, SPRING, useReducedMotion } from "./motion";
import { cn } from "@/lib/utils/cn";

interface Option<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "md" | "sm";
  className?: string;
}

/** Segmented control — brief §3.8: glass-1 track, sliding white pill indicator with spring. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = "md", className }: Props<T>) {
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className={cn("glass-1 inline-flex max-w-full rounded-pill p-1", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-w-0 flex-1 rounded-pill text-center font-medium leading-tight transition-colors disabled:opacity-40 sm:flex-none sm:whitespace-nowrap",
              size === "md" ? "min-h-9 px-3 text-small sm:px-4" : "min-h-8 px-2 text-caption sm:px-3",
              selected ? "text-bg" : "text-text-2 hover:text-text",
            )}
          >
            {selected ? (
              <m.span
                layoutId={`${id}-indicator`}
                transition={reduced ? { duration: 0 } : SPRING}
                className="absolute inset-0 rounded-pill bg-text"
                aria-hidden
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
