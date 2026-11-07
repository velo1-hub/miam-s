import { useLocale, useTranslations } from "next-intl";
import { formatHoursLabel, weekdayName } from "@/lib/format/date";
import type { Locale } from "@/lib/format/number";
import type { Settings, Weekday } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";

export function HoursTable({ hours, className }: { hours: Settings["hours"]; className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("footer");
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-small", className)}>
      {order.map((d) => {
        const h = hours[d];
        return (
          <div key={d} className="contents">
            <dt className="capitalize text-text-2">{weekdayName(d, locale)}</dt>
            <dd className="tabular text-text">
              {h.open && h.close ? `${formatHoursLabel(h.open, locale)} – ${formatHoursLabel(h.close, locale)}` : t("closed")}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
