"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { computeFinancing } from "@/lib/finance/disclosure";
import { FREQUENCIES, type PaymentFrequency } from "@/lib/finance/payment";
import { formatPrice, type Locale } from "@/lib/format/number";
import type { FinanceDefaults } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  priceCad: number;
  finance: FinanceDefaults;
  variant?: "compact" | "full";
  className?: string;
  /** Hide the CTA (e.g. on the financing page where the form is below) */
  hideCta?: boolean;
}

const money = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);

/**
 * Québec-compliant financing calculator — brief §14. Strictly a no-red zone: inputs, Light button,
 * white focus. The credit rate is displayed before and as prominently as the payment, with every
 * mandatory mention together in one block, plus the example table of credit charges.
 */
export function FinancingCalculator({ priceCad, finance, variant = "full", className, hideCta }: Props) {
  const t = useTranslations("calculator");
  const te = useTranslations("enums");
  const locale = useLocale() as Locale;
  const id = useId();
  const [down, setDown] = useState(0);
  const [tradeIn, setTradeIn] = useState(0);
  const [term, setTerm] = useState(finance.defaultTerm);
  const [frequency, setFrequency] = useState<PaymentFrequency>("biweekly");
  const [rate, setRate] = useState(finance.defaultRatePct);
  const [touched, setTouched] = useState(false);

  const d = useMemo(
    () =>
      computeFinancing({
        priceCad,
        downPaymentCad: down,
        tradeInCad: tradeIn,
        termMonths: term,
        frequency,
        annualRatePct: rate,
        creditFees: finance.creditFees,
        gstPct: finance.gstPct,
        qstPct: finance.qstPct,
      }),
    [priceCad, down, tradeIn, term, frequency, rate, finance],
  );

  useEffect(() => {
    if (touched) track("calculator_used", { term, frequency });
  }, [touched, term, frequency]);

  const num = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0);
  const field = "no-red h-input w-full rounded-input border border-line bg-surface px-4 pt-4 text-body text-text outline-none transition-colors focus:border-text tabular";
  const label = "pointer-events-none absolute left-4 top-2.5 text-caption text-text-3";

  return (
    <div className={cn("no-red rounded-card border border-line bg-surface p-6 md:p-8", className)} onChange={() => setTouched(true)}>
      <h3 className="text-h3">{t("title")}</h3>

      <div className={cn("mt-6 grid gap-4", variant === "full" ? "md:grid-cols-2" : "")}>
        <div className="relative">
          <input id={`${id}-price`} value={formatPrice(priceCad, locale)} readOnly className={cn(field, "text-text-2")} />
          <label htmlFor={`${id}-price`} className={label}>{t("price")}</label>
        </div>
        <div className="relative">
          <input id={`${id}-rate`} inputMode="decimal" value={rate} onChange={(e) => setRate(Math.min(39.99, num(e.target.value)))} className={field} aria-describedby={`${id}-rate-hint`} />
          <label htmlFor={`${id}-rate`} className={label}>{t("rate")} (%)</label>
        </div>
        <div className="relative">
          <input id={`${id}-down`} inputMode="numeric" value={down || ""} onChange={(e) => setDown(num(e.target.value))} placeholder="0" className={field} />
          <label htmlFor={`${id}-down`} className={label}>{t("down")}</label>
        </div>
        <div className="relative">
          <input id={`${id}-trade`} inputMode="numeric" value={tradeIn || ""} onChange={(e) => setTradeIn(num(e.target.value))} placeholder="0" className={field} />
          <label htmlFor={`${id}-trade`} className={label}>{t("tradeIn")}</label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-caption text-text-3">{t("term")}</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("term")}>
            {finance.terms.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={term === m}
                onClick={() => { setTerm(m); setTouched(true); }}
                className={cn("press h-9 rounded-pill px-3.5 text-small font-medium", term === m ? "bg-text text-bg" : "border border-line text-text-2 hover:text-text")}
              >
                {t("months", { count: m })}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-caption text-text-3">{t("frequency")}</p>
          <SegmentedControl
            label={t("frequency")}
            size="sm"
            value={frequency}
            onChange={(v) => { setFrequency(v); setTouched(true); }}
            options={FREQUENCIES.map((f) => ({ value: f, label: te(`frequency.${f}`) }))}
          />
        </div>
      </div>

      {/* Mandatory disclosure block — order matters: rate before and as prominent as the payment */}
      <div className="mt-8 rounded-card-sm border border-line-strong bg-bg p-5" aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-caption text-text-3">{t("creditRate")}</p>
            <p className="tabular text-price-xl text-text">{d.creditRatePct.toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</p>
          </div>
          <div>
            <p className="text-caption text-text-3">{t("payment")} · {te(`frequencyPer.${frequency}`)}</p>
            <p className="tabular text-price-xl text-text">{money(d.payment, locale)}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-x-6 gap-y-1.5 text-small sm:grid-cols-2">
          <Row k={t("cashPrice")} v={money(d.cashPrice, locale)} />
          <Row k={t("taxes")} v={money(d.taxes.total, locale)} />
          <Row k={d.downPayment > 0 ? t("downAmount", { amount: money(d.downPayment, locale) }) : t("noDown")} v={d.tradeIn > 0 ? `${t("tradeIn")} ${money(d.tradeIn, locale)}` : ""} />
          {d.creditFeesTotal > 0 && <Row k={t("creditFees")} v={money(d.creditFeesTotal, locale)} />}
          <Row k={t("amountFinanced")} v={money(d.amountFinanced, locale)} />
          <Row k={t("paymentCount", { count: d.paymentCount })} v={`${d.termMonths} ${t("months", { count: d.termMonths }).replace(/^\d+\s/, "")}`} />
          <Row k={t("costOfCredit")} v={money(d.costOfCredit, locale)} />
          <Row k={t("totalObligation")} v={money(d.totalObligation, locale)} strong />
        </dl>
        <p id={`${id}-rate-hint`} className="mt-4 text-caption text-text-3">{t("taxNote", { gst: finance.gstPct, qst: finance.qstPct })}</p>
      </div>

      {variant === "full" ? (
        <ExampleTable d={d} locale={locale} />
      ) : (
        <details className="mt-4 text-small">
          <summary className="cursor-pointer text-text-2 hover:text-text">{t("exampleTable")}</summary>
          <ExampleTable d={d} locale={locale} compact />
        </details>
      )}

      <p className="mt-4 text-caption text-text-3">{locale === "fr" ? finance.disclaimerFr : finance.disclaimerEn}</p>
      {!hideCta && (
        <Button asChild variant="light" size="md" className="mt-5">
          <Link href="/financing">{t("cta")}</Link>
        </Button>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:contents">
      <dt className={cn("text-text-2", strong && "text-text")}>{k}</dt>
      <dd className={cn("tabular text-right text-text sm:border-b sm:border-line sm:py-1.5", strong && "font-semibold")}>{v}</dd>
    </div>
  );
}

function ExampleTable({ d, locale, compact }: { d: ReturnType<typeof computeFinancing>; locale: Locale; compact?: boolean }) {
  const t = useTranslations("calculator");
  return (
    <div className={cn("overflow-x-auto", compact ? "mt-3" : "mt-6")}>
      {!compact && <p className="mb-2 text-caption text-text-3">{t("exampleTable")}</p>}
      <table className="w-full text-small tabular">
        <thead>
          <tr className="text-left text-caption text-text-3">
            <th className="py-1.5 font-medium">{t("exampleTerm")}</th>
            <th className="py-1.5 font-medium">{t("examplePayment")}</th>
            <th className="py-1.5 font-medium">{t("exampleCost")}</th>
            <th className="py-1.5 font-medium">{t("exampleTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {d.exampleTable.map((r) => (
            <tr key={r.termMonths} className={cn("border-t border-line", r.termMonths === d.termMonths && "text-text")}>
              <td className="py-1.5">{t("months", { count: r.termMonths })}</td>
              <td className="py-1.5">{money(r.payment, locale)}</td>
              <td className="py-1.5">{money(r.costOfCredit, locale)}</td>
              <td className="py-1.5">{money(r.totalObligation, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
