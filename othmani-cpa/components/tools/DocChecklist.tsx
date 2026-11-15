"use client";
import { useEffect, useMemo, useState } from "react";
import { baseDocs, situations, toolsText } from "@/content/tools";
import { portalHref, type Lang } from "@/lib/site";
import { Icon } from "../Icon";

const KEY = "ocpa-checklist";

/** Liste de documents personnalisée. Les choix restent dans le navigateur (localStorage). */
export function DocChecklist({ lang, preset = [] }: { lang: Lang; preset?: string[] }) {
  const t = toolsText[lang].checklist;
  const [picked, setPicked] = useState<string[]>(preset.length ? preset : ["employee"]);
  const [done, setDone] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (Array.isArray(v.picked) && v.picked.length) setPicked(v.picked);
        if (Array.isArray(v.done)) setDone(v.done);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ picked, done })); } catch {}
  }, [picked, done]);

  const groups = useMemo(
    () => [
      { id: "base", title: t.base, docs: baseDocs },
      ...situations.filter((s) => picked.includes(s.id)).map((s) => ({ id: s.id, title: s[lang], docs: s.docs })),
    ],
    [picked, lang, t.base],
  );
  const all = groups.flatMap((g) => g.docs.map((d) => `${g.id}:${d.fr}`));
  const count = all.filter((k) => done.includes(k)).length;
  const pct = all.length ? Math.round((count / all.length) * 100) : 0;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleDoc = (k: string) => setDone((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  const copy = async () => {
    const text = groups.map((g) => `${g.title}\n${g.docs.map((d) => `☐ ${d[lang]}`).join("\n")}`).join("\n\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="print-area grid gap-6 lg:grid-cols-[18rem_1fr]">
      <fieldset className="glass h-fit rounded-[1.5rem] p-5 print:hidden">
        <legend className="sr-only">{t.pick}</legend>
        <p className="mb-3 font-display font-semibold text-navy" aria-hidden="true">{t.pick}</p>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {situations.map((s) => {
            const on = picked.includes(s.id);
            return (
              <label key={s.id} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${on ? "border-navy bg-navy text-white" : "border-navy/15 bg-white/70 text-ink hover:border-navy/40"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="sr-only" />
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-sky bg-sky text-navy" : "border-navy/30"}`} aria-hidden="true">
                  {on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
                </span>
                {s[lang]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="glass rounded-[1.5rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold text-navy">{t.list}</p>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={copy} className="btn min-h-10 border border-navy/15 bg-white/80 px-4 text-sm text-navy hover:border-navy">
              <Icon name={copied ? "check" : "receipt"} className="h-4 w-4" /> {copied ? t.copied : t.copy}
            </button>
            <button type="button" onClick={() => window.print()} className="btn min-h-10 bg-navy px-4 text-sm text-white hover:bg-navy-700">
              {t.print}
            </button>
          </div>
        </div>
        <div className="mt-4" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress(count, all.length)}>
            <div className="h-full rounded-full bg-gradient-to-r from-sky to-navy transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">{t.progress(count, all.length)}</p>
        </div>
        <div className="mt-6 space-y-6">
          {groups.map((g) => (
            <section key={g.id}>
              <h3 className="mb-2 text-sm font-semibold tracking-wide text-navy uppercase">{g.title}</h3>
              <ul className="space-y-1.5">
                {g.docs.map((d) => {
                  const k = `${g.id}:${d.fr}`;
                  const on = done.includes(k);
                  return (
                    <li key={k}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/70">
                        <input type="checkbox" checked={on} onChange={() => toggleDoc(k)} className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />
                        <span className={`leading-relaxed ${on ? "text-muted line-through decoration-sky decoration-2" : "text-ink"}`}>{d[lang]}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="text-sm text-muted">{t.saved}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDone([])} className="text-sm font-semibold text-navy underline underline-offset-4">{t.reset}</button>
            <a href={portalHref(lang)} className="text-sm font-semibold text-navy underline underline-offset-4">{t.next}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
