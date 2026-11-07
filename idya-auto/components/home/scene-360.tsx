"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Car360 } from "@/components/car360/car360";
import { ArrowLink } from "@/components/ui/arrow-link";
import { m, useReducedMotion } from "@/components/ui/motion";
import { cn } from "@/lib/utils/cn";
import type { SpinSet } from "@/lib/vehicles/types";

interface Props {
  spin: SpinSet;
  title: string;
  slug: string;
}

/**
 * Signature 360° scene — brief §6.3. A 300 vh section with a sticky stage; native scroll drives
 * the frame (Phase 0 decision C1: Motion useScroll + position: sticky instead of GSAP + Lenis).
 * Callouts fade in at 25 / 50 / 75 % progress. Reduced motion: static drag viewer, all callouts visible.
 */
export function Scene360({ spin, title, slug }: Props) {
  const t = useTranslations("home");
  const callouts = t.raw("sceneCallouts") as string[];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Quantize to the frame grid so React only re-renders when the drawn frame changes
    const q = Math.round(v * spin.frameCount) / spin.frameCount;
    setProgress((p) => (p === q ? p : q));
  });
  const step = (i: number) => (reduced ? true : progress >= (i + 1) * 0.25 - 0.02);

  return (
    <section ref={ref} className={cn("relative", reduced ? "h-auto" : "h-[300vh]")} aria-label={t("sceneHeadline")}>
      <div className={cn("flex flex-col justify-center", reduced ? "section-y" : "sticky top-0 h-svh")}>
        <div className="container-content grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="order-2 lg:order-1">
            <p className="eyebrow mb-3">{t("sceneEyebrow")}</p>
            <h2 className="text-h2">{t("sceneHeadline")}</h2>
            <ul className="mt-8 flex flex-col gap-4">
              {callouts.map((c, i) => (
                <m.li
                  key={c}
                  className="flex items-center gap-3 text-body-lg text-text"
                  initial={false}
                  animate={{ opacity: step(i) ? 1 : 0.5, x: step(i) ? 0 : -8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span aria-hidden className={cn("size-1.5 rounded-pill transition-colors", step(i) ? "bg-red" : "bg-text-3")} />
                  {c}
                </m.li>
              ))}
            </ul>
            <div className="mt-8">
              <ArrowLink href={{ pathname: "/inventory/[slug]", params: { slug } }}>{t("sceneLink")}</ArrowLink>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Car360 spin={spin} title={title} mode={reduced ? "drag" : "scroll"} progress={progress} minimal eager={!reduced} />
          </div>
        </div>
      </div>
    </section>
  );
}
