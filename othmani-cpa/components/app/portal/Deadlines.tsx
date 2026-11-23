"use client";
import type { Lang } from "@/lib/site";
import { formatDate, upcoming as upcomingDeadlines } from "@/lib/dates";
import { site } from "@/lib/site";
import { fmtDate, type Appointment, type Dossier } from "../shared";
import { Ico } from "./icons";
import type { T } from "./text";
import { Box, Eyebrow, Tile } from "./ui";
import { audienceOf, downloadFile, icsDay, isClosed, todayMtl, type Go } from "./util";

const clock = (iso: string, lang: Lang) => new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Montreal" }).format(new Date(iso));
const dayMtl = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal" }).format(new Date(iso));

/**
 * « Mes échéances » : d'abord ce qui est propre au client (échéance du dossier, rendez-vous confirmés),
 * puis les dates officielles générales qui visent son type de dossier.
 * `compact` : version d'accueil (2 dates officielles, sans détail).
 */
export function Deadlines({ d, appts, compact = false, lang, t, go }: { d: Dossier; appts: Appointment[] | null; compact?: boolean; lang: Lang; t: T; go?: Go }) {
  const today = todayMtl();
  const official = upcomingDeadlines(today, audienceOf(d.kind)).slice(0, compact ? 2 : 5);
  const due = d.due_date && !isClosed(d) ? d.due_date : null;
  const confirmed = (appts ?? [])
    .filter((a) => a.status === "confirme" && a.confirmed_at && a.dossier_id === d.id && dayMtl(a.confirmed_at) >= today)
    .sort((a, b) => String(a.confirmed_at).localeCompare(String(b.confirmed_at)));
  const own = Boolean(due) || confirmed.length > 0;
  const addIcs = (x: (typeof official)[number]) =>
    downloadFile(icsDay(x.date, x[lang].title, `${x[lang].detail} — ${site.name}`, x.audience), "text/calendar;charset=utf-8", `${x.date}-othmani-cpa.ics`);
  const row = "flex items-start gap-3 py-3";

  return (
    <Box>
      <div className="flex items-center justify-between gap-3">
        {compact ? <Eyebrow>{t.dlTitle}</Eyebrow> : <h2 className="font-display text-lg font-semibold text-ink">{t.dlTitle}</h2>}
        {compact && go && (
          <button type="button" onClick={() => go("appt")} aria-label={t.dlAllAria} className="-my-2 -mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-sm font-semibold text-[#175f77]">
            {t.dlAll}<Ico name="chevron" className="h-4 w-4" strokeWidth={2.2} />
          </button>
        )}
      </div>

      {own && (
        <ul className="mt-1 divide-y divide-line">
          {due && (
            <li className={row}>
              <Tile icon="folder" tone="amber" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{formatDate(due, lang)}</p>
                <p className="text-sm break-words text-muted">{t.dlFile}</p>
              </div>
            </li>
          )}
          {confirmed.map((a) => (
            <li key={a.id} className={row}>
              <Tile icon="calendar" tone="green" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{fmtDate(a.confirmed_at as string, lang)} {t.dlAt} {clock(a.confirmed_at as string, lang)}</p>
                <p className="text-sm break-words text-muted">{t.dlAppt} · {t.modes[a.mode] ?? t.modes.bureau}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!compact && <Eyebrow className={own ? "mt-3 border-t border-line pt-4" : "mt-3"}>{t.dlOfficial}</Eyebrow>}
      {official.length === 0 ? (!compact || !own) && <p className="mt-2 text-[0.95rem] text-muted">{compact ? t.dlNone : t.dlEmpty}</p> : (
        <ul className={`divide-y divide-line ${compact && own ? "border-t border-line" : compact ? "mt-1" : ""}`}>
          {official.map((x) => (
            <li key={`${x.date}-${x.audience}-${x.fr.title}`} className={row}>
              <Tile icon="calendar" tone="sky" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{formatDate(x.date, lang)}</p>
                <p className="break-words text-ink">{x[lang].title}</p>
                {!compact && <p className="mt-0.5 text-sm leading-relaxed break-words text-muted">{x[lang].detail}</p>}
                <button type="button" onClick={() => addIcs(x)} aria-label={`${t.dlAdd} : ${x[lang].title}`} className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-navy underline underline-offset-4">
                  <Ico name="download" className="h-4 w-4" strokeWidth={2} />{t.dlAdd}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 border-t border-line pt-3 text-sm leading-relaxed text-muted">{t.dlNote}</p>
    </Box>
  );
}
