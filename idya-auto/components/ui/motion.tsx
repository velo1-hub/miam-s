"use client";

import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/** Loads only the DOM animation feature set so Motion stays small in the initial bundle (brief §19). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export { m, AnimatePresence, useReducedMotion } from "motion/react";

/** Motion tokens — brief §3.7 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;
export const DUR = { fast: 0.15, base: 0.25, reveal: 0.45, hero: 0.8 } as const;
