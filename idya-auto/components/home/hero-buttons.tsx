"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { Button } from "@/components/ui/button";
import { DUR, EASE_OUT, m, useReducedMotion } from "@/components/ui/motion";

export function HeroButtons({ children }: { children: ReactNode }) {
  const t = useTranslations("home");
  const { openBooking } = useBooking();
  const reduced = useReducedMotion();
  return (
    <m.div
      className="mt-8 flex flex-wrap gap-3"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.hero, ease: EASE_OUT, delay: 0.45 }}
    >
      {children}
      <Button variant="secondary" size="lg" onClick={() => openBooking()}>
        {t("ctaTestDrive")}
      </Button>
    </m.div>
  );
}
