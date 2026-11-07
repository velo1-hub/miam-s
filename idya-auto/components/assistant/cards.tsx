"use client";

import { CalendarPlus, CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { submitBooking, submitLead, type ActionResult } from "@/app/actions/leads";
import { toFormData } from "@/components/forms/form-shell";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import type { FinancingDisclosure } from "@/lib/finance/disclosure";
import { formatDateLong, formatTime } from "@/lib/format/date";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { vehicleTitle } from "@/lib/vehicles/types";

const money = (n: number, locale: Locale) => new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol" }).format(n);

/** Mini vehicle cards inside the chat (photo, price, km, « Voir ») — brief §27.1 rich cards. */
export function VehicleMiniCards({ cards }: { cards: VehicleCardData[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("card");
  const tc = useTranslations("common");
  if (!cards.length) return null;
  return (
    <ul className="hide-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1">
      {cards.map((v) => (
        <li key={v.id} className="w-[200px] shrink-0 snap-start">
          <Link href={{ pathname: "/inventory/[slug]", params: { slug: v.slug } }} className="glass-lite block overflow-hidden rounded-card-sm hover:bg-white/[0.06]">
            <div className="relative aspect-[4/3] bg-studio-bottom">{v.cover && <Image src={v.cover.src} alt="" width={400} height={300} sizes="200px" className="h-full w-full object-cover" />}</div>
            <div className="p-3">
              <p className="truncate text-small font-semibold text-text">{vehicleTitle(v)}</p>
              <p className="truncate text-caption text-text-2">{v.trim ? `${v.trim} · ` : ""}{formatKm(v.odometerKm, locale)}</p>
              <p className="mt-1 tabular text-small font-semibold text-text">{formatPrice(v.priceCad, locale)} <span className="text-caption font-normal text-text-3">{tc("taxesExtra")}</span></p>
              <span className="mt-1 inline-block text-caption text-text-2 underline-offset-2 hover:underline">{t("view")} →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CompareMini({ cards }: { cards: (VehicleCardData & { features?: string[] })[] }) {
  const locale = useLocale() as Locale;
  const te = useTranslations("enums");
  const ts = useTranslations("vehicle.specs");
  if (!cards.length) return null;
  const rows: [string, (v: VehicleCardData) => string][] = [
    [ts("km"), (v) => formatKm(v.odometerKm, locale)],
    [ts("year"), (v) => String(v.year)],
    [ts("fuel"), (v) => (v.fuelType ? te(`fuel.${v.fuelType}`) : "—")],
    [ts("drivetrain"), (v) => (v.drivetrain ? te(`drivetrain.${v.drivetrain}`) : "—")],
    [ts("seats"), (v) => (v.seats ? String(v.seats) : "—")],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-caption tabular">
        <thead>
          <tr>
            <th />
            {cards.map((v) => (
              <th key={v.id} className="px-2 pb-1 text-left font-semibold text-text">
                <Link href={{ pathname: "/inventory/[slug]", params: { slug: v.slug } }} className="hover:underline">{vehicleTitle(v)}</Link>
                <div className="font-normal text-text-2">{formatPrice(v.priceCad, locale)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, f]) => (
            <tr key={k} className="border-t border-line">
              <th scope="row" className="py-1 pr-2 text-left font-normal text-text-2">{k}</th>
              {cards.map((v) => <td key={v.id} className="px-2 py-1 text-text">{f(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Payment estimate block — every mandatory mention of brief §14, compact. */
export function PaymentBlock({ d, disclaimer }: { d: FinancingDisclosure; disclaimer: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("calculator");
  const te = useTranslations("enums");
  return (
    <div className="no-red rounded-card-sm border border-line bg-bg p-3 text-caption">
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-text-3">{t("creditRate")}</p><p className="tabular text-[20px] font-semibold text-text">{d.creditRatePct.toFixed(2)} %</p></div>
        <div><p className="text-text-3">{t("payment")} · {te(`frequencyPer.${d.frequency}`)}</p><p className="tabular text-[20px] font-semibold text-text">{money(d.payment, locale)}</p></div>
      </div>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 tabular">
        <dt className="text-text-2">{t("cashPrice")}</dt><dd className="text-right text-text">{money(d.cashPrice, locale)}</dd>
        <dt className="text-text-2">{t("taxes")}</dt><dd className="text-right text-text">{money(d.taxes.total, locale)}</dd>
        <dt className="text-text-2">{d.downPayment > 0 ? t("downAmount", { amount: money(d.downPayment, locale) }) : t("noDown")}</dt><dd />
        {d.creditFeesTotal > 0 && (<><dt className="text-text-2">{t("creditFees")}</dt><dd className="text-right text-text">{money(d.creditFeesTotal, locale)}</dd></>)}
        <dt className="text-text-2">{t("amountFinanced")}</dt><dd className="text-right text-text">{money(d.amountFinanced, locale)}</dd>
        <dt className="text-text-2">{t("paymentCount", { count: d.paymentCount })}</dt><dd className="text-right text-text">{t("months", { count: d.termMonths })}</dd>
        <dt className="text-text-2">{t("costOfCredit")}</dt><dd className="text-right text-text">{money(d.costOfCredit, locale)}</dd>
        <dt className="font-medium text-text">{t("totalObligation")}</dt><dd className="text-right font-semibold text-text">{money(d.totalObligation, locale)}</dd>
      </dl>
      <details className="mt-2">
        <summary className="cursor-pointer text-text-2">{t("exampleTable")}</summary>
        <table className="mt-1 w-full tabular">
          <tbody>
            {d.exampleTable.map((r) => (
              <tr key={r.termMonths} className="border-t border-line"><td className="py-0.5 text-text-2">{t("months", { count: r.termMonths })}</td><td className="py-0.5 text-right text-text">{money(r.payment, locale)}</td><td className="py-0.5 text-right text-text-2">{money(r.costOfCredit, locale)}</td><td className="py-0.5 text-right text-text">{money(r.totalObligation, locale)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="mt-2 text-text-3">{disclaimer}</p>
    </div>
  );
}

export function DealerCard({ info }: { info: { displayName: string; address: string; phone: string; phoneTel: string; directionsUrl: string; openNow: boolean; hours: { day: string; open: string }[] } }) {
  const tc = useTranslations("common");
  return (
    <div className="glass-lite rounded-card-sm p-3 text-caption">
      <p className="flex items-center gap-1.5 text-small font-semibold text-text"><MapPin className="size-4 text-titanium" strokeWidth={1.5} aria-hidden />{info.displayName}</p>
      <p className="text-text-2">{info.address}</p>
      <a href={`tel:${info.phoneTel}`} onClick={() => track("phone_clicked")} className="mt-1 inline-flex items-center gap-1.5 text-text hover:underline"><Phone className="size-3.5" strokeWidth={1.5} aria-hidden />{info.phone}</a>
      <p className="mt-1.5 flex items-center gap-1.5 text-text-2"><span className={`size-1.5 rounded-pill ${info.openNow ? "bg-success" : "bg-text-3"}`} aria-hidden />{info.openNow ? tc("openNow") : tc("closedNow")}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 capitalize">
        {info.hours.map((h) => (<div key={h.day} className="contents"><dt className="text-text-2">{h.day}</dt><dd className="tabular text-text">{h.open}</dd></div>))}
      </dl>
      <a href={info.directionsUrl} target="_blank" rel="noreferrer" onClick={() => track("directions_clicked")} className="mt-2 inline-block text-text underline-offset-2 hover:underline">{tc("directions")} →</a>
    </div>
  );
}

export function SlotPicker({ days, onPick }: { days: { day: string; weekday: string; slots: { startsAt: string; label: string }[] }[]; onPick: (startsAt: string, label: string) => void }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  if (!days.length) return <p className="text-caption text-text-3">{t("noSlots")}</p>;
  return (
    <div className="flex flex-col gap-2">
      {days.map((d) => (
        <div key={d.day}>
          <p className="mb-1 text-caption capitalize text-text-2"><Clock className="mr-1 inline size-3.5" strokeWidth={1.5} aria-hidden />{formatDateLong(`${d.day}T12:00:00`, locale)}</p>
          <div className="flex flex-wrap gap-1.5">
            {d.slots.slice(0, 8).map((s) => (
              <button key={s.startsAt} type="button" onClick={() => onPick(s.startsAt, `${formatDateLong(s.startsAt, locale)} ${formatTime(s.startsAt, locale)}`)} className="press h-8 rounded-pill border border-line px-3 text-caption tabular text-text hover:border-line-strong">{formatTime(s.startsAt, locale)}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Booking confirmation card: the booking exists only after « Confirmer » (brief §27.1). */
export function BookingConfirmCard({ booking }: { booking: { vehicleId: string; startsAt: string; firstName: string; lastName: string; email: string; phone: string; vehicleTitle: string } }) {
  const t = useTranslations("booking");
  const ta = useTranslations("assistant");
  const locale = useLocale() as Locale;
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [result, setResult] = useState<Extract<ActionResult, { ok: true }> | null>(null);
  const confirm = async () => {
    setState("pending");
    const fd = toFormData({ ...booking, preferredLanguage: locale, preferredContact: "email", licence: true, consent }, { consentText: t("consent"), locale });
    const res = await submitBooking(fd);
    if (res.ok) {
      setResult(res);
      setState("done");
      track("booking_completed", { source: "assistant" });
    } else setState("error");
  };
  if (state === "done")
    return (
      <div className="glass-lite rounded-card-sm p-3 text-caption" role="status">
        <p className="flex items-center gap-1.5 text-small font-semibold text-text"><CheckCircle2 className="size-4 text-success" strokeWidth={1.5} aria-hidden />{t("successTitle")}</p>
        <p className="mt-1 text-text-2">{t("successBody", { date: formatDateLong(booking.startsAt, locale), time: formatTime(booking.startsAt, locale) })}</p>
        {result?.bookingId && <a href={`/api/ics/${result.bookingId}`} download className="mt-2 inline-flex items-center gap-1.5 text-text underline-offset-2 hover:underline"><CalendarPlus className="size-3.5" strokeWidth={1.5} aria-hidden />{t("addToCalendar")}</a>}
      </div>
    );
  return (
    <div className="no-red glass-lite rounded-card-sm p-3 text-caption">
      <p className="text-small font-semibold text-text">{ta("bookingPrepared")}</p>
      <p className="mt-1 text-text">{booking.vehicleTitle}</p>
      <p className="text-text-2">{formatDateLong(booking.startsAt, locale)} · {formatTime(booking.startsAt, locale)}</p>
      <p className="text-text-2">{booking.firstName} {booking.lastName} · {booking.email} · {booking.phone}</p>
      <div className="mt-2"><CheckboxField label={t("consent")} checked={consent} onChange={(e) => setConsent(e.target.checked)} /></div>
      {state === "error" && <p className="mt-1 text-danger">{t("errorSlot")}</p>}
      <Button variant="primary" size="sm" className="mt-2" disabled={!consent || state === "pending"} onClick={confirm}>{ta("confirmBooking")}</Button>
    </div>
  );
}

export function LeadConfirmCard({ lead }: { lead: { type: "question" | "trade_in" | "financing"; name: string; email?: string; phone?: string; message: string; vehicleId?: string } }) {
  const t = useTranslations("forms");
  const ta = useTranslations("assistant");
  const locale = useLocale() as Locale;
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const confirm = async () => {
    setState("pending");
    const kind = lead.type === "question" ? "question" : lead.type === "trade_in" ? "human" : "human";
    const fd = toFormData({ name: lead.name, email: lead.email ?? "", phone: lead.phone ?? "", message: `[${lead.type}] ${lead.message}`, vehicleId: lead.vehicleId ?? "", consent }, { consentText: t("consent"), locale });
    const res = await submitLead(kind, fd);
    setState(res.ok ? "done" : "error");
    if (res.ok) track("lead_submitted", { type: lead.type, source: "assistant" });
  };
  if (state === "done") return <p className="glass-lite rounded-card-sm p-3 text-caption text-text" role="status"><CheckCircle2 className="mr-1 inline size-4 text-success" strokeWidth={1.5} aria-hidden />{t("successTitle")} {t("successBody")}</p>;
  return (
    <div className="no-red glass-lite rounded-card-sm p-3 text-caption">
      <p className="text-small font-semibold text-text">{ta("leadPrepared")}</p>
      <p className="mt-1 text-text">{lead.name}{lead.email ? ` · ${lead.email}` : ""}{lead.phone ? ` · ${lead.phone}` : ""}</p>
      <p className="text-text-2">{lead.message}</p>
      <div className="mt-2"><CheckboxField label={t("consent")} checked={consent} onChange={(e) => setConsent(e.target.checked)} /></div>
      {state === "error" && <p className="mt-1 text-danger">{t("errors.required")}</p>}
      <Button variant="light" size="sm" className="mt-2" disabled={!consent || state === "pending"} onClick={confirm}>{t("submit")}</Button>
    </div>
  );
}
