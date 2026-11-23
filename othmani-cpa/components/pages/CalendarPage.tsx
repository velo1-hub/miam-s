import { pagesText } from "@/content/pages";
import { dict } from "@/content/ui";
import { buildDate } from "@/lib/dates";
import type { Lang } from "@/lib/site";
import { CtaBand, PageHeader } from "../blocks";
import { DeadlineList } from "../DeadlineList";
import { ReminderForm } from "../forms";
import { Icon } from "../Icon";
import { Shell } from "../Shell";

export function CalendarPage({ lang }: { lang: Lang }) {
  const p = pagesText.calendar[lang];
  const t = dict(lang);
  return (
    <Shell lang={lang} routeKey="calendar">
      <PageHeader lang={lang} crumbs={[{ name: t.nav.calendar, key: "calendar" }]} title={p.h1} intro={<p>{p.intro}</p>} />
      <div className="mesh"><div className="container-site grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <section aria-labelledby="cal-upcoming">
            <h2 id="cal-upcoming" className="h2 mb-8">{p.upcoming}</h2>
            <DeadlineList lang={lang} buildDate={buildDate()} limit={12} variant="rows" />
            <p className="mt-4 text-sm leading-relaxed text-muted">{p.note}</p>
          </section>
          <section aria-labelledby="cal-rules" className="mt-16">
            <h2 id="cal-rules" className="h2 mb-8">{p.rulesH2}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {p.rules.map(([k, v]) => (
                <div key={k} className="glass reveal rounded-[1.5rem] p-6">
                  <dt className="font-display text-lg font-semibold text-navy">{k}</dt>
                  <dd className="mt-2 leading-relaxed text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="cal-remind">
          <div className="on-dark mesh-dark relative overflow-hidden rounded-[1.75rem] p-7 text-white">
            <h2 id="cal-remind" className="flex items-center gap-3 text-2xl font-semibold text-white"><Icon name="bell" /> {t.dates.remind}</h2>
            <p className="mt-2 mb-6 text-white/85">{t.dates.remindHelp}</p>
            <ReminderForm lang={lang} dark />
          </div>
        </aside>
      </div></div>
      <CtaBand lang={lang} />
    </Shell>
  );
}
