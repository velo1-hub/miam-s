"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { toolsText } from "@/content/tools";
import { href } from "@/lib/routes";
import type { Lang } from "@/lib/site";
import { Icon } from "../Icon";
import { money, parseAmount } from "./TaxCalculator";

/** Vérifie le seuil de 30 000 $ (petit fournisseur) sur quatre trimestres. */
export function ThresholdCheck({ lang }: { lang: Lang }) {
  const t = toolsText[lang].threshold;
  const id = useId();
  const [q, setQ] = useState(["", "", "", ""]);
  const total = q.reduce((s, v) => s + parseAmount(v), 0);
  const filled = q.some((v) => v.trim() !== "");
  const over = total > 30000;
  const pct = Math.min(100, (total / 30000) * 100);

  return (
    <div className="glass rounded-[1.5rem] p-5 sm:p-7">
      <div className="grid grid-cols-2 gap-3">
        {q.map((v, i) => (
          <div key={i}>
            <label htmlFor={`${id}-${i}`} className="label">{t.q(i + 1)}</label>
            <input id={`${id}-${i}`} inputMode="decimal" value={v} placeholder="0" autoComplete="off"
              onChange={(e) => setQ((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} className="field tabular-nums" />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-navy/10 bg-white/70 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">{t.total}</span>
          <span className="font-display text-2xl font-semibold text-navy tabular-nums">{money(total, lang)}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy/10" aria-hidden="true">
          <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-navy" : "bg-gradient-to-r from-sky to-navy/70"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden="true"><span>0 $</span><span>30 000 $</span></div>
      </div>
      <p role="status" aria-live="polite" className={`mt-4 flex gap-3 rounded-2xl p-4 text-[0.95rem] leading-relaxed ${!filled ? "bg-navy/5 text-muted" : over ? "bg-navy text-white" : "bg-sky-50 text-navy"}`}>
        <Icon name={over ? "bell" : "check"} className="mt-0.5 h-5 w-5 shrink-0" />
        {!filled ? t.empty : over ? t.over : t.under(money(30000 - total, lang))}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted">{t.note}</p>
      <Link href={href("contact", lang)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
        {t.cta} <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
