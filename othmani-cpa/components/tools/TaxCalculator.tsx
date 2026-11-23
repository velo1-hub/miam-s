"use client";
import { useId, useState } from "react";
import { toolsText } from "@/content/tools";
import type { Lang } from "@/lib/site";

const GST = 0.05, QST = 0.09975;
const round = (n: number) => Math.round(n * 100) / 100;

export function parseAmount(v: string) {
  const n = parseFloat(v.replace(/\s/g, "").replace(/\$/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(n);

/** Calculatrice TPS/TVQ : ajouter ou retirer les taxes. */
export function TaxCalculator({ lang }: { lang: Lang }) {
  const t = toolsText[lang].calc;
  const id = useId();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [raw, setRaw] = useState("100");
  const amount = parseAmount(raw);
  const base = mode === "add" ? amount : amount / (1 + GST + QST);
  const gst = round(base * GST), qst = round(base * QST);
  const before = round(base);
  const total = mode === "add" ? round(before + gst + qst) : round(amount);

  return (
    <div className="glass rounded-[1.5rem] p-5 sm:p-7">
      <div role="radiogroup" aria-label={t.h2} className="grid grid-cols-2 gap-1 rounded-full bg-navy/5 p-1">
        {(["add", "remove"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`min-h-11 rounded-full text-sm font-semibold transition-colors ${mode === m ? "bg-navy text-white" : "text-navy hover:bg-white/70"}`}>
            {m === "add" ? t.add : t.remove}
          </button>
        ))}
      </div>
      <label htmlFor={id} className="label mt-5">{mode === "add" ? t.amountAdd : t.amountRemove}</label>
      <div className="relative">
        <input id={id} inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} className="field pr-10 font-display text-2xl font-semibold text-navy" autoComplete="off" />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xl text-muted" aria-hidden="true">$</span>
      </div>
      <dl className="mt-5 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white/70" aria-live="polite">
        {[[t.before, before], [t.gst, gst], [t.qst, qst]].map(([k, v]) => (
          <div key={k as string} className="flex justify-between px-4 py-3 text-ink"><dt>{k}</dt><dd className="font-medium tabular-nums">{money(v as number, lang)}</dd></div>
        ))}
        <div className="flex justify-between px-4 py-3.5 font-display text-lg font-semibold text-navy"><dt>{t.total}</dt><dd className="tabular-nums">{money(total, lang)}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">{t.note}</p>
    </div>
  );
}
