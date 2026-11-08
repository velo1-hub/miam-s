"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/ui/field";
import { alertSchema, contactSchema, financingSchema, humanSchema, questionSchema, sellCarSchema, tradeInSchema } from "@/lib/leads/schemas";
import { LeadFormShell, useErrorText } from "./form-shell";

interface Common {
  phone: string;
  context?: Record<string, string>;
  onSuccess?: () => void;
}

type Q = z.input<typeof questionSchema>;
export function QuestionForm({ phone, context = {}, onSuccess }: Common) {
  const t = useTranslations("forms");
  const err = useErrorText();
  const locale = useLocale();
  const form = useForm<Q>({ resolver: zodResolver(questionSchema), defaultValues: { name: "", email: "", phone: "", message: "", vehicleId: context.vehicleId ?? "", vehicle: context.vehicle ?? "", consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  return (
    <LeadFormShell kind="question" phone={phone} values={() => form.getValues()} valid={() => form.trigger()} consentText={t("consent")} successTitle={t("successTitle")} successBody={t("successBody")} onSuccess={onSuccess}>
      {context.vehicle && <p className="text-small text-text-2">{t("vehicle")} : <span className="text-text">{context.vehicle}</span></p>}
      <TextField label={t("name")} autoComplete="name" error={err(e.name?.message)} {...form.register("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("email")} type="email" autoComplete="email" inputMode="email" error={err(e.email?.message)} {...form.register("email")} />
        <TextField label={t("phone")} type="tel" autoComplete="tel" inputMode="tel" error={err(e.phone?.message)} {...form.register("phone")} />
      </div>
      <TextArea label={t("message")} rows={4} error={err(e.message?.message)} {...form.register("message")} />
      <CheckboxField label={t("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

type C = z.input<typeof contactSchema>;
export function ContactForm({ phone, onSuccess }: Common) {
  const t = useTranslations("forms");
  const tc = useTranslations("common");
  const err = useErrorText();
  const locale = useLocale();
  const form = useForm<C>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", phone: "", subject: "general", message: "", consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  return (
    <LeadFormShell kind="contact" phone={phone} values={() => form.getValues()} valid={() => form.trigger()} consentText={t("consent")} successTitle={t("successTitle")} successBody={t("successBody")} onSuccess={onSuccess}>
      <TextField label={t("name")} autoComplete="name" error={err(e.name?.message)} {...form.register("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("email")} type="email" autoComplete="email" error={err(e.email?.message)} {...form.register("email")} />
        <TextField label={`${t("phone")} (${tc("optional")})`} type="tel" autoComplete="tel" error={err(e.phone?.message)} {...form.register("phone")} />
      </div>
      <SelectField label={t("subject")} {...form.register("subject")}>
        {(["general", "vehicle", "service", "other"] as const).map((s) => <option key={s} value={s}>{t(`contact.subjects.${s}`)}</option>)}
      </SelectField>
      <TextArea label={t("message")} rows={5} error={err(e.message?.message)} {...form.register("message")} />
      <CheckboxField label={t("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

type F = z.input<typeof financingSchema>;
export function FinancingForm({ phone, context = {}, onSuccess }: Common) {
  const t = useTranslations("forms");
  const tf = useTranslations("forms.financing");
  const err = useErrorText();
  const locale = useLocale();
  const form = useForm<F>({ resolver: zodResolver(financingSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", employment: "employed", income: "4000_6000", desiredVehicle: context.vehicle ?? "", desiredPayment: "300_500", vehicleId: context.vehicleId ?? "", consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  return (
    <LeadFormShell kind="financing" light phone={phone} values={() => form.getValues()} valid={() => form.trigger()} consentText={tf("consent")} successTitle={tf("successTitle")} successBody={tf("successBody")} onSuccess={onSuccess}>
      <p className="text-small text-text-2">{tf("intro")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("firstName")} autoComplete="given-name" error={err(e.firstName?.message)} {...form.register("firstName")} />
        <TextField label={t("lastName")} autoComplete="family-name" error={err(e.lastName?.message)} {...form.register("lastName")} />
        <TextField label={t("email")} type="email" autoComplete="email" error={err(e.email?.message)} {...form.register("email")} />
        <TextField label={t("phone")} type="tel" autoComplete="tel" error={err(e.phone?.message)} {...form.register("phone")} />
        <SelectField label={tf("employment")} {...form.register("employment")}>
          {(["employed", "self_employed", "retired", "student", "other"] as const).map((k) => <option key={k} value={k}>{tf(`employmentOptions.${k}`)}</option>)}
        </SelectField>
        <SelectField label={tf("income")} {...form.register("income")}>
          {(["lt2000", "2000_4000", "4000_6000", "gt6000"] as const).map((k) => <option key={k} value={k}>{tf(`incomeOptions.${k}`)}</option>)}
        </SelectField>
        <TextField label={tf("desiredVehicle")} error={err(e.desiredVehicle?.message)} {...form.register("desiredVehicle")} />
        <SelectField label={tf("desiredPayment")} {...form.register("desiredPayment")}>
          {(["lt300", "300_500", "500_700", "gt700"] as const).map((k) => <option key={k} value={k}>{tf(`paymentOptions.${k}`)}</option>)}
        </SelectField>
      </div>
      <CheckboxField label={tf("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

type TI = z.input<typeof tradeInSchema>;
export function TradeInForm({ phone, onSuccess }: Common) {
  const t = useTranslations("forms");
  const tt = useTranslations("forms.tradeIn");
  const tc = useTranslations("common");
  const err = useErrorText();
  const locale = useLocale();
  const [photos, setPhotos] = useState<File[]>([]);
  const form = useForm<TI>({ resolver: zodResolver(tradeInSchema), defaultValues: { vin: "", make: "", model: "", trim: "", km: undefined, condition: 3, accidents: "no", balance: "no", firstName: "", lastName: "", email: "", phone: "", photoCount: 0, consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  const scale = tt.raw("conditionScale") as string[];
  return (
    <LeadFormShell kind="trade_in" light phone={phone} values={() => ({ ...form.getValues(), photoCount: photos.length, photos })} valid={() => form.trigger()} consentText={tt("consent")} successTitle={tt("successTitle")} successBody={tt("successBody")} onSuccess={onSuccess}>
      <p className="text-small text-text-2">{tt("intro")}</p>
      <TextField label={tt("vin")} autoCapitalize="characters" maxLength={17} error={err(e.vin?.message)} {...form.register("vin")} />
      <p className="text-caption text-text-3">{tt("orDescribe")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={tt("year")} inputMode="numeric" error={err(e.year?.message)} {...form.register("year")} />
        <TextField label={tt("make")} error={err(e.make?.message)} {...form.register("make")} />
        <TextField label={tt("model")} error={err(e.model?.message)} {...form.register("model")} />
        <TextField label={`${tt("trim")} (${tc("optional")})`} {...form.register("trim")} />
        <TextField label={`${tt("km")} (km)`} inputMode="numeric" error={err(e.km?.message)} {...form.register("km")} />
        <SelectField label={tt("condition")} {...form.register("condition")}>
          {scale.map((s, i) => <option key={s} value={i + 1}>{i + 1} — {s}</option>)}
        </SelectField>
        <SelectField label={tt("accidents")} {...form.register("accidents")}>
          <option value="no">{tc("no")}</option>
          <option value="yes">{tc("yes")}</option>
        </SelectField>
        <SelectField label={tt("balance")} {...form.register("balance")}>
          <option value="no">{tc("no")}</option>
          <option value="yes">{tc("yes")}</option>
        </SelectField>
      </div>
      <PhotoPicker photos={photos} onChange={setPhotos} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("firstName")} autoComplete="given-name" error={err(e.firstName?.message)} {...form.register("firstName")} />
        <TextField label={t("lastName")} autoComplete="family-name" error={err(e.lastName?.message)} {...form.register("lastName")} />
        <TextField label={t("email")} type="email" autoComplete="email" error={err(e.email?.message)} {...form.register("email")} />
        <TextField label={t("phone")} type="tel" autoComplete="tel" error={err(e.phone?.message)} {...form.register("phone")} />
      </div>
      <CheckboxField label={tt("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

const MAX_PHOTOS = 8;

/** Up to eight photos for an appraisal (trade-in or direct sale). Labels live under forms.tradeIn. */
function PhotoPicker({ photos, onChange }: { photos: File[]; onChange: (next: File[]) => void }) {
  const tt = useTranslations("forms.tradeIn");
  const add = (files: FileList | null) => {
    if (!files) return;
    onChange([...photos, ...Array.from(files)].slice(0, MAX_PHOTOS));
  };
  return (
    <div>
      <p className="mb-2 text-small text-text">{tt("photos")}</p>
      <p className="mb-3 text-caption text-text-3">{tt("photosHint")}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((f, i) => (
          <span key={`${f.name}-${i}`} className="glass-1 inline-flex h-9 max-w-[200px] items-center gap-2 rounded-chip pl-3 pr-1 text-caption">
            <span className="truncate">{f.name}</span>
            <button type="button" aria-label={tt("removePhoto")} onClick={() => onChange(photos.filter((_, j) => j !== i))} className="inline-flex size-7 items-center justify-center rounded-[6px] hover:bg-white/10"><X className="size-3.5" strokeWidth={1.5} aria-hidden /></button>
          </span>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="press inline-flex h-9 cursor-pointer items-center gap-2 rounded-chip border border-dashed border-line-strong px-3 text-caption text-text-2 hover:text-text">
            <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden />
            {tt("addPhotos")}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(ev) => add(ev.target.files)} />
          </label>
        )}
      </div>
    </div>
  );
}

type SC = z.input<typeof sellCarSchema>;
/**
 * « Vendre mon auto » — the owner describes the vehicle and states the price they want. No-red zone
 * (price context, brief §3.0): the submit is the Light button.
 */
export function SellCarForm({ phone, onSuccess }: Common) {
  const t = useTranslations("forms");
  const tt = useTranslations("forms.tradeIn");
  const ts = useTranslations("forms.sellCar");
  const tc = useTranslations("common");
  const err = useErrorText();
  const locale = useLocale();
  const [photos, setPhotos] = useState<File[]>([]);
  const form = useForm<SC>({
    resolver: zodResolver(sellCarSchema),
    defaultValues: { vin: "", make: "", model: "", trim: "", color: "", condition: 3, accidents: "no", balance: "no", flexibility: "negotiable", timeline: "month", message: "", owner: false as unknown as true, firstName: "", lastName: "", email: "", phone: "", photoCount: 0, consent: false as unknown as true, locale: locale as "fr" | "en" },
  });
  const e = form.formState.errors;
  const scale = tt.raw("conditionScale") as string[];
  return (
    <LeadFormShell kind="sell_car" light phone={phone} values={() => ({ ...form.getValues(), photoCount: photos.length, photos })} valid={() => form.trigger()} consentText={ts("consent")} successTitle={ts("successTitle")} successBody={ts("successBody")} onSuccess={onSuccess}>
      <p className="text-small text-text-2">{ts("intro")}</p>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-small font-semibold text-text">{ts("vehicleSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={tt("year")} inputMode="numeric" error={err(e.year?.message)} {...form.register("year")} />
          <TextField label={tt("make")} error={err(e.make?.message)} {...form.register("make")} />
          <TextField label={tt("model")} error={err(e.model?.message)} {...form.register("model")} />
          <TextField label={`${tt("trim")} (${tc("optional")})`} {...form.register("trim")} />
          <TextField label={`${tt("km")} (km)`} inputMode="numeric" error={err(e.km?.message)} {...form.register("km")} />
          <TextField label={`${ts("color")} (${tc("optional")})`} {...form.register("color")} />
        </div>
        <TextField label={`${tt("vin")} (${tc("optional")})`} autoCapitalize="characters" maxLength={17} error={err(e.vin?.message)} {...form.register("vin")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={tt("condition")} className="sm:col-span-2" {...form.register("condition")}>
            {scale.map((s, i) => <option key={s} value={i + 1}>{i + 1} — {s}</option>)}
          </SelectField>
          <SelectField label={tt("accidents")} {...form.register("accidents")}>
            <option value="no">{tc("no")}</option>
            <option value="yes">{tc("yes")}</option>
          </SelectField>
          <SelectField label={tt("balance")} {...form.register("balance")}>
            <option value="no">{tc("no")}</option>
            <option value="yes">{tc("yes")}</option>
          </SelectField>
        </div>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-small font-semibold text-text">{ts("priceSection")}</legend>
        <TextField label={ts("askingPrice")} inputMode="numeric" className="tabular" hint={ts("askingPriceHint")} error={err(e.askingPrice?.message)} {...form.register("askingPrice")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={ts("flexibility")} {...form.register("flexibility")}>
            <option value="negotiable">{ts("flexibilityNegotiable")}</option>
            <option value="firm">{ts("flexibilityFirm")}</option>
          </SelectField>
          <SelectField label={ts("timeline")} {...form.register("timeline")}>
            <option value="asap">{ts("timelineAsap")}</option>
            <option value="month">{ts("timelineMonth")}</option>
            <option value="exploring">{ts("timelineExploring")}</option>
          </SelectField>
        </div>
        <TextArea label={`${ts("comments")} (${tc("optional")})`} rows={3} {...form.register("message")} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-small font-semibold text-text">{ts("contactSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("firstName")} autoComplete="given-name" error={err(e.firstName?.message)} {...form.register("firstName")} />
          <TextField label={t("lastName")} autoComplete="family-name" error={err(e.lastName?.message)} {...form.register("lastName")} />
          <TextField label={t("email")} type="email" autoComplete="email" error={err(e.email?.message)} {...form.register("email")} />
          <TextField label={t("phone")} type="tel" autoComplete="tel" error={err(e.phone?.message)} {...form.register("phone")} />
        </div>
      </fieldset>

      <CheckboxField label={ts("owner")} error={err(e.owner?.message)} {...form.register("owner")} />
      <CheckboxField label={ts("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

type A = z.input<typeof alertSchema>;
export function AlertForm({ phone, context = {}, onSuccess }: Common) {
  const t = useTranslations("forms");
  const ta = useTranslations("forms.alert");
  const err = useErrorText();
  const locale = useLocale();
  const form = useForm<A>({ resolver: zodResolver(alertSchema), defaultValues: { email: "", filters: context.filters ?? "{}", consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  return (
    <LeadFormShell kind="inventory_alert" phone={phone} values={() => form.getValues()} valid={() => form.trigger()} consentText={ta("consent")} successTitle={ta("successTitle")} successBody={ta("successBody")} onSuccess={onSuccess}>
      <p className="text-small text-text-2">{ta("body")}</p>
      <TextField label={t("email")} type="email" autoComplete="email" error={err(e.email?.message)} {...form.register("email")} />
      <CheckboxField label={ta("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}

type H = z.input<typeof humanSchema>;
export function HumanForm({ phone, context = {}, onSuccess }: Common) {
  const t = useTranslations("forms");
  const ta = useTranslations("assistant");
  const err = useErrorText();
  const locale = useLocale();
  const form = useForm<H>({ resolver: zodResolver(humanSchema), defaultValues: { name: "", email: "", phone: "", message: context.message ?? "", chatSessionId: context.chatSessionId ?? "", consent: false as unknown as true, locale: locale as "fr" | "en" } });
  const e = form.formState.errors;
  return (
    <LeadFormShell kind="human" phone={phone} values={() => form.getValues()} valid={() => form.trigger()} consentText={t("consent")} successTitle={ta("handoffTitle")} successBody={ta("handoffBody")} onSuccess={onSuccess}>
      <TextField label={t("name")} autoComplete="name" error={err(e.name?.message)} {...form.register("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("email")} type="email" error={err(e.email?.message)} {...form.register("email")} />
        <TextField label={t("phone")} type="tel" error={err(e.phone?.message)} {...form.register("phone")} />
      </div>
      <TextArea label={t("message")} rows={3} {...form.register("message")} />
      <CheckboxField label={t("consent")} error={err(e.consent?.message)} {...form.register("consent")} />
    </LeadFormShell>
  );
}
