"use client";
import { useEffect, useState } from "react";
import { formatDate, upcoming } from "@/lib/dates";
import type { Lang } from "@/lib/site";

/** Prochaine échéance fiscale (recalculée dans le navigateur). */
export function NextDeadline({ lang, buildDate, light = false }: { lang: Lang; buildDate: string; light?: boolean }) {
  const [today, setToday] = useState(buildDate);
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);
  const d = upcoming(today)[0];
  if (!d) return null;
  return (
    <div className="flex items-center gap-4">
      <time dateTime={d.date} className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${light ? "bg-navy text-white" : "bg-white text-navy"}`}>
        <span className="font-display text-xl leading-none font-semibold">{formatDate(d.date, lang, { day: "numeric" })}</span>
        <span className="mt-0.5 text-[0.65rem] font-semibold uppercase">{formatDate(d.date, lang, { month: "short" }).replace(".", "")}</span>
      </time>
      <div>
        <p className={`text-xs font-semibold tracking-wide uppercase ${light ? "text-navy/80" : "text-sky"}`}>{lang === "fr" ? "Prochaine échéance" : "Next deadline"}</p>
        <p className={`mt-0.5 font-display font-semibold leading-snug ${light ? "text-ink" : "text-white"}`}>{d[lang].title}</p>
      </div>
    </div>
  );
}
