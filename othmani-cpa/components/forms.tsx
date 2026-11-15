"use client";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { dict } from "@/content/ui";
import { href } from "@/lib/routes";
import { site, type Lang } from "@/lib/site";

type Status = "idle" | "sending" | "ok" | "error" | "off";

async function submit(e: FormEvent<HTMLFormElement>, setStatus: (s: Status) => void) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!site.formEndpoint) { setStatus("off"); return; }
  setStatus("sending");
  try {
    const res = await fetch(site.formEndpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    setStatus("ok");
  } catch {
    setStatus("error");
  }
}

function StatusMsg({ status, lang }: { status: Status; lang: Lang }) {
  const t = dict(lang).contact;
  const text = status === "ok" ? t.ok : status === "error" ? t.error : status === "off" ? t.notConfigured : "";
  return (
    <p role="status" aria-live="polite" className={text ? `mt-4 rounded-2xl px-4 py-3 text-sm ${status === "ok" ? "bg-sky-50 text-navy" : "bg-[#fff4e5] text-[#6b3d00]"}` : "sr-only"}>
      {text}
    </p>
  );
}

/** Formulaire de contact court. Fonctionne sans JavaScript si un point de réception est configuré. */
export function ContactForm({ lang }: { lang: Lang }) {
  const t = dict(lang).contact;
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const req = <span className="text-[#a3261f]" aria-hidden="true"> *</span>;
  return (
    <form action={site.formEndpoint || undefined} method="post" onSubmit={(e) => submit(e, setStatus)} className="space-y-5" noValidate={false}>
      <input type="hidden" name="_subject" value={lang === "fr" ? "Nouveau message du site" : "New website message"} />
      <input type="hidden" name="langue" value={lang} />
      {/* Piège à robots : laissé vide par les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px]"><label>Site web<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-n`} className="label">{t.name}{req}</label>
          <input id={`${id}-n`} name="nom" required autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor={`${id}-e`} className="label">{t.email}{req}</label>
          <input id={`${id}-e`} name="courriel" type="email" required autoComplete="email" className="field" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-p`} className="label">{t.phone}</label>
          <input id={`${id}-p`} name="telephone" type="tel" autoComplete="tel" className="field" />
        </div>
        <fieldset>
          <legend className="label">{t.for}</legend>
          <div className="flex gap-2">
            {[["moi", t.forMe], ["entreprise", t.forBiz]].map(([v, l], i) => (
              <label key={v} className="flex min-h-12 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-[#8a8ea3] px-3 text-sm has-[:checked]:border-navy has-[:checked]:bg-sky-50">
                <input type="radio" name="pour" value={v} defaultChecked={i === 0} className="h-4 w-4 accent-navy" /> {l}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div>
        <label htmlFor={`${id}-m`} className="label">{t.message}{req}</label>
        <textarea id={`${id}-m`} name="message" required rows={4} aria-describedby={`${id}-mh`} className="field resize-y" maxLength={2000} />
        <p id={`${id}-mh`} className="mt-1.5 text-sm text-muted">{t.messageHelp}</p>
      </div>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink">
        <input type="checkbox" name="consentement" value="oui" required className="mt-1 h-5 w-5 shrink-0 accent-navy" />
        <span>
          {t.consent} <Link href={href("privacy", lang)} className="font-medium text-navy underline underline-offset-4">{t.privacyLink}</Link>.{req}
        </span>
      </label>
      <button type="submit" disabled={status === "sending"} className="btn-primary w-full sm:w-auto">
        {status === "sending" ? t.sending : t.submit}
      </button>
      <StatusMsg status={status} lang={lang} />
    </form>
  );
}

/** Inscription aux rappels fiscaux (consentement explicite, Loi 25 et LCAP). */
export function ReminderForm({ lang, dark = false }: { lang: Lang; dark?: boolean }) {
  const t = dict(lang).dates;
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  return (
    <form action={site.formEndpoint || undefined} method="post" onSubmit={(e) => submit(e, setStatus)}>
      <input type="hidden" name="_subject" value={lang === "fr" ? "Inscription aux rappels fiscaux" : "Tax reminder sign-up"} />
      <input type="hidden" name="type" value="rappel" />
      <input type="hidden" name="langue" value={lang} />
      <div aria-hidden="true" className="absolute -left-[9999px]"><label>Site web<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label></div>
      <label htmlFor={`${id}-e`} className={`label ${dark ? "text-white" : ""}`}>{t.email}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id={`${id}-e`} name="courriel" type="email" required autoComplete="email" className="field flex-1" />
        <button type="submit" disabled={status === "sending"} className={dark ? "btn-light" : "btn-primary"}>{t.submit}</button>
      </div>
      <label className={`mt-3 flex items-start gap-3 text-sm leading-relaxed ${dark ? "text-white/90" : "text-muted"}`}>
        <input type="checkbox" name="consentement" value="oui" required className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />
        <span>{t.consent}</span>
      </label>
      <StatusMsg status={status} lang={lang} />
    </form>
  );
}
