"use client";

import { DUR, EASE_OUT, m, useReducedMotion } from "@/components/ui/motion";

/** Headline lines rise and unblur in sequence over dur-hero (brief §6.1). */
export function HeroCopy({ eyebrow, headline, subline }: { eyebrow: string; headline: string; subline: string }) {
  const reduced = useReducedMotion();
  const anim = (delay: number) =>
    reduced
      ? {}
      : {
          // Starts partially visible so the headline is painted (and counted as LCP) before the reveal ends.
          initial: { opacity: 0.35, y: 28, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: DUR.hero, ease: EASE_OUT, delay },
        };
  return (
    <>
      <m.p className="eyebrow mb-5" {...anim(0)}>
        {eyebrow}
      </m.p>
      <m.h1 className="text-display-xl text-text" {...anim(0.1)}>
        {headline}
      </m.h1>
      <m.p className="mt-6 max-w-[560px] text-body-lg text-text-2" {...anim(0.3)}>
        {subline}
      </m.p>
    </>
  );
}
