"use client";

import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchSlots, submitBooking, type ActionResult } from "@/app/actions/leads";
import { useDealer } from "@/components/layout/dealer-context";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Honeypot, Turnstile } from "@/components/forms/turnstile";
import { toFormData, useErrorText } from "@/components/forms/form-shell";
import { track } from "@/lib/analytics/track";
import type { DaySlots } from "@/lib/booking/slots";
import { formatDateLong, formatDateShort, formatTime, weekdayName } from "@/lib/format/date";
import { formatPhone } from "@/lib/format/phone";
import type { Locale } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { vehicleTitle } from "@/lib/vehicles/types";

interface Props {
  open: boolean;
  vehicleId: string | null;
  onOpenChange: (open: boolean) => void;
}

interface Details {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage: "fr" | "en";
  preferredContact: "email" | "phone" | "sms";
  licence: boolean;
}

/**
 * Test drive booking — brief §12. Three steps with a progress indicator; glass-3 dialog on
 * desktop, sheet on mobile. The booking exists only after the consent checkbox and « Confirmer ».
 */
export function BookingDialog({ open, vehicleId, onOpenChange }: Props) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const tf = useTranslations("forms");
  const locale = useLocale() as Locale;
  const dealer = useDealer();
  const err = useErrorText();
  const steps = t.raw("steps") as string[];

  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleCardData[] | null>(null);
  const [vehicle, setVehicle] = useState<VehicleCardData | null>(null);
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>({ firstName: "", lastName: "", email: "", phone: "", preferredLanguage: locale, preferredContact: "email", licence: false });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Extract<ActionResult, { ok: true }> | null>(null);

  // Load vehicles (picker) and slots when opened
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    fetch("/api/inventory?sort=newest", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { items: VehicleCardData[] }) => {
        const list = j.items.filter((v) => v.status === "available");
        setVehicles(list);
        if (vehicleId) setVehicle(list.find((v) => v.id === vehicleId) ?? null);
      })
      .catch(() => setVehicles([]));
    fetchSlots()
      .then((d) => {
        setDays(d);
        setDay((cur) => cur ?? d[0]?.day ?? null);
      })
      .catch(() => setDays([]));
    return () => ctrl.abort();
  }, [open, vehicleId]);

  const reset = () => {
    setStep(0);
    setSlot(null);
    setDone(null);
    setError(null);
    setFieldErrors({});
    setConsent(false);
  };

  const canNext = step === 0 ? Boolean(vehicle && slot) : step === 1 ? Boolean(details.firstName && details.lastName && details.email && details.phone && details.licence) : consent;

  const confirm = async () => {
    if (!vehicle || !slot) return;
    setPending(true);
    setError(null);
    const fd = toFormData({ ...details, vehicleId: vehicle.id, startsAt: slot, consent }, { consentText: t("consent"), locale, turnstileToken: token });
    const res = await submitBooking(fd);
    setPending(false);
    if (res.ok) {
      track("booking_completed", { vehicleId: vehicle.id });
      setDone(res);
    } else if (res.error === "validation") {
      setFieldErrors(res.fieldErrors ?? {});
      setStep(1);
    } else if (res.error === "slot") {
      setError(t("errorSlot"));
      setSlot(null);
      setStep(0);
      fetchSlots().then(setDays).catch(() => undefined);
    } else {
      setError(res.error === "generic" ? tf("errorGeneric", { phone: formatPhone(dealer.phone) }) : (err(res.error) ?? tc("error")));
    }
  };

  const selectedDay = days?.find((d) => d.day === day) ?? null;
  const field = "no-red";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 300);
      }}
      title={t("title")}
      description={done ? undefined : t("step", { current: step + 1, total: 3 })}
      closeLabel={tc("close")}
      className="md:max-w-[640px]"
    >
      {done && vehicle && slot ? (
        <div className="flex flex-col items-start gap-4 py-2" role="status">
          <CheckCircle2 className="size-10 text-success" strokeWidth={1.5} aria-hidden />
          <h3 className="text-h3">{t("successTitle")}</h3>
          <p className="text-body text-text-2">{t("successBody", { date: formatDateLong(slot, locale), time: formatTime(slot, locale) })}</p>
          <div className="glass-lite w-full rounded-card-sm p-4 text-small">
            <p className="font-medium text-text">{vehicleTitle(vehicle)}{vehicle.trim ? ` ${vehicle.trim}` : ""}</p>
            <p className="text-text-2">{formatDateLong(slot, locale)} · {formatTime(slot, locale)}</p>
          </div>
          <p className="text-small text-text-2">{t("successNext")}</p>
          {done.bookingId && (
            <Button asChild variant="light" size="md">
              <a href={`/api/ics/${done.bookingId}`} download>
                <CalendarPlus strokeWidth={1.5} aria-hidden />
                {t("addToCalendar")}
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progress indicator */}
          <ol className="flex items-center gap-2" aria-label={t("step", { current: step + 1, total: 3 })}>
            {steps.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2 text-caption">
                <span aria-hidden className={cn("h-1 flex-1 rounded-pill", i <= step ? "bg-text" : "bg-white/15")} />
                <span className={cn("hidden sm:inline", i === step ? "text-text" : "text-text-3")}>{s}</span>
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-caption text-text-3">{t("vehicle")}</p>
                {vehicles === null ? (
                  <Skeleton className="h-16" />
                ) : vehicle ? (
                  <div className="glass-lite flex items-center gap-3 rounded-card-sm p-3">
                    {vehicle.cover && <Image src={vehicle.cover.src} alt="" width={120} height={90} sizes="96px" className="h-16 w-24 rounded-chip object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{vehicleTitle(vehicle)}</p>
                      <p className="truncate text-small text-text-2">{vehicle.trim}</p>
                    </div>
                    {!vehicleId && <button type="button" onClick={() => setVehicle(null)} className="text-small text-text-2 underline-offset-4 hover:underline">{tc("clear")}</button>}
                  </div>
                ) : (
                  <SelectField label={t("chooseVehicle")} value="" onChange={(e) => setVehicle(vehicles.find((v) => v.id === e.target.value) ?? null)}>
                    <option value="">—</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{vehicleTitle(v)}{v.trim ? ` ${v.trim}` : ""}</option>)}
                  </SelectField>
                )}
              </div>
              <div>
                <p className="mb-2 text-caption text-text-3">{t("date")}</p>
                {days === null ? (
                  <Skeleton className="h-20" />
                ) : (
                  <ul className="hide-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1" role="radiogroup" aria-label={t("date")}>
                    {days.map((d) => (
                      <li key={d.day}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={day === d.day}
                          onClick={() => { setDay(d.day); setSlot(null); }}
                          className={cn("press flex w-[68px] flex-col items-center rounded-card-sm border py-2.5 text-small", day === d.day ? "border-text bg-text text-bg" : "border-line text-text-2 hover:text-text")}
                        >
                          <span className="text-caption capitalize">{weekdayName(d.weekday, locale, "short")}</span>
                          <span className="font-semibold tabular">{formatDateShort(`${d.day}T12:00:00`, locale).replace(/\.$/, "")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-caption text-text-3">{t("time")}</p>
                {selectedDay && selectedDay.slots.length > 0 ? (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("time")}>
                    {selectedDay.slots.map((s) => (
                      <li key={s.startsAt}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={slot === s.startsAt}
                          disabled={s.remaining <= 0}
                          onClick={() => setSlot(s.startsAt)}
                          className={cn("press h-11 w-full rounded-pill border text-small tabular disabled:cursor-not-allowed disabled:opacity-40", slot === s.startsAt ? "border-text bg-text text-bg" : "border-line text-text hover:border-line-strong")}
                        >
                          {s.remaining <= 0 ? t("full") : formatTime(s.startsAt, locale)}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-small text-text-3">{t("noSlots")}</p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={cn(field, "grid gap-4 sm:grid-cols-2")}>
              <TextField label={t("firstName")} autoComplete="given-name" value={details.firstName} onChange={(e) => setDetails({ ...details, firstName: e.target.value })} error={err(fieldErrors.firstName)} />
              <TextField label={t("lastName")} autoComplete="family-name" value={details.lastName} onChange={(e) => setDetails({ ...details, lastName: e.target.value })} error={err(fieldErrors.lastName)} />
              <TextField label={t("email")} type="email" autoComplete="email" inputMode="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} error={err(fieldErrors.email)} />
              <TextField label={t("phone")} type="tel" autoComplete="tel" inputMode="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} error={err(fieldErrors.phone)} hint={details.phone ? formatPhone(details.phone) : undefined} />
              <SelectField label={t("preferredLanguage")} value={details.preferredLanguage} onChange={(e) => setDetails({ ...details, preferredLanguage: e.target.value as "fr" | "en" })}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </SelectField>
              <SelectField label={t("preferredContact")} value={details.preferredContact} onChange={(e) => setDetails({ ...details, preferredContact: e.target.value as Details["preferredContact"] })}>
                <option value="email">{t("contactEmail")}</option>
                <option value="phone">{t("contactPhone")}</option>
                <option value="sms">{t("contactSms")}</option>
              </SelectField>
              <CheckboxField className="sm:col-span-2" label={t("licence")} checked={details.licence} onChange={(e) => setDetails({ ...details, licence: e.target.checked })} error={err(fieldErrors.licence)} />
            </div>
          )}

          {step === 2 && vehicle && slot && (
            <div className={cn(field, "flex flex-col gap-5")}>
              <div className="glass-lite rounded-card-sm p-4 text-small">
                <p className="eyebrow mb-2">{t("summary")}</p>
                <p className="font-medium text-text">{vehicleTitle(vehicle)}{vehicle.trim ? ` ${vehicle.trim}` : ""}</p>
                <p className="text-text-2">{formatDateLong(slot, locale)} · {formatTime(slot, locale)}</p>
                <p className="mt-2 text-text-2">{details.firstName} {details.lastName} · {details.email} · {formatPhone(details.phone)}</p>
              </div>
              <CheckboxField label={t("consent")} checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <p className="text-caption text-text-3">{t("consentPurpose")}</p>
              <Honeypot />
              <Turnstile onToken={setToken} />
            </div>
          )}

          {error && <p role="alert" className="text-small text-danger">{error}</p>}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <Button variant="ghost" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>
              {tc("back")}
            </Button>
            {step < 2 ? (
              <Button variant="light" size="md" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                {tc("next")}
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={confirm} disabled={!canNext || pending}>
                {pending ? tf("sending") : t("submit")}
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
