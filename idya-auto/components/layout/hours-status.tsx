"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatHoursLabel, weekdayName } from "@/lib/format/date";
import type { Locale } from "@/lib/format/number";
import { openStatus } from "@/lib/hours/status";
import type { Settings } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/use-now";

/** Live « Ouvert maintenant / Fermé » in America/Toronto — brief §5.3. Re-evaluates every minute. */
export function HoursStatus({ settings, className, showNext = true }: { settings: Pick<Settings, "hours" | "closures">; className?: string; showNext?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const now = useNow();
  if (!now) {
    // Server render / before hydration: neutral placeholder keeps layout stable
    return (
      <span className={cn("inline-flex items-center gap-2 text-small", className)} aria-hidden>
        <span className="size-2 rounded-pill bg-text-3" />
        <span className="text-text-3">—</span>
      </span>
    );
  }
  const s = openStatus(settings, now);
  const todayIndex = new Date(now.toLocaleString("en-US", { timeZone: "America/Toronto" })).getDay();
  let detail: string | null = null;
  if (showNext) {
    if (s.open && s.nextChange) detail = t("closesAt", { time: formatHoursLabel(s.nextChange, locale) });
    else if (!s.open && s.nextChange && s.nextOpenDay !== null)
      detail =
        s.nextOpenDay === todayIndex
          ? t("opensAt", { time: formatHoursLabel(s.nextChange, locale) })
          : t("opensOn", { day: weekdayName(s.nextOpenDay, locale), time: formatHoursLabel(s.nextChange, locale) });
  }
  return (
    <span className={cn("inline-flex items-center gap-2 text-small", className)}>
      <span aria-hidden className={cn("size-2 rounded-pill", s.open ? "bg-success" : "bg-text-3")} />
      <span className="text-text">{s.open ? t("openNow") : t("closedNow")}</span>
      {detail ? <span className="text-text-3">· {detail}</span> : null}
    </span>
  );
}
