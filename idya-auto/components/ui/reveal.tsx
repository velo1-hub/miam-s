"use client";

import type { ReactNode } from "react";
import { DUR, EASE_OUT, m, useReducedMotion } from "./motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}

/** Section reveal — brief §3.7: opacity 0→1, y 24→0, blur 8→0, at 15 % visibility, once. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = m[as];
  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: DUR.reveal, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}

/** Staggers direct children by 60 ms (brief §3.7). */
export function RevealGroup({ children, className, as = "div" }: Omit<RevealProps, "delay">) {
  const reduced = useReducedMotion();
  const Tag = m[as];
  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className, as = "div" }: Omit<RevealProps, "delay">) {
  const Tag = m[as];
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: DUR.reveal, ease: EASE_OUT } },
      }}
    >
      {children}
    </Tag>
  );
}
