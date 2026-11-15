"use client";
import { useEffect, useState } from "react";
import type { Deadline } from "@/content/deadlines";
import { formatDate, upcoming } from "@/lib/dates";
import { dict } from "@/content/ui";
import type { Lang } from "@/lib/site";

/**
 * Liste des prochaines échéances. Le HTML statique contient les dates calculées au moment
 * de la génération ; le navigateur les recalcule ensuite selon la date du jour.
 */
export function DeadlineList({ lang, buildDate, limit = 3, audience, variant = "cards" }: { lang: Lang; buildDate: string; limit?: number; audience?: Deadline["audience"]; variant?: "cards" | "rows" }) {
  const t = dict(lang).dates;
  const [today, setToday] = useState(buildDate);
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);
  const items = upcoming(today, audience).slice(0, limit);
  const aud = (a: Deadline["audience"]) => (a === "both" ? t.both : a === "individuals" ? t.individuals : t.businesses);

  if (variant === "rows") {
    return (
      <ol className="glass divide-y divide-navy/10 overflow-hidden rounded-[1.5rem]">
        {items.map((d) => (
          <li key={d.date + d.fr.title} className="grid gap-2 p-5 sm:grid-cols-[11rem_1fr] sm:gap-6 sm:p-6">
            <time dateTime={d.date} className="font-display text-lg font-semibold text-navy">{formatDate(d.date, lang)}</time>
            <div>
              <h3 className="font-display text-lg font-semibold">{d[lang].title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{d[lang].detail}</p>
              <p className="mt-2 text-xs font-semibold tracking-wide text-navy/80 uppercase">{aud(d.audience)}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((d, i) => (
        <li key={d.date + d.fr.title} className="glass reveal flex flex-col rounded-[1.5rem] p-6" data-delay={String(i + 1)}>
          <time dateTime={d.date} className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold text-navy">{formatDate(d.date, lang, { day: "numeric" })}</span>
            <span className="font-display text-lg font-medium text-navy">{formatDate(d.date, lang, { month: "long", year: "numeric" })}</span>
          </time>
          <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{d[lang].title}</h3>
          <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{d[lang].detail}</p>
          <p className="mt-4 inline-flex w-fit rounded-full border border-navy/10 bg-white/70 px-3 py-1 text-xs font-semibold text-navy">{aud(d.audience)}</p>
        </li>
      ))}
    </ol>
  );
}
