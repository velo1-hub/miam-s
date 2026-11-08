"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import type { ActionResult, FormKind } from "@/app/actions/leads";
import { submitLead } from "@/app/actions/leads";
import { formatPhone } from "@/lib/format/phone";
import { Honeypot, Turnstile } from "./turnstile";

export interface SubmitState {
  pending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/** Translates Zod/action error keys into copy (forms.errors.*). */
export function useErrorText() {
  const t = useTranslations("forms.errors");
  return (key: string | undefined) => {
    if (!key) return undefined;
    const known = ["required", "email", "phone", "emailOrPhone", "consent", "licence", "vin", "km", "min", "max", "price", "owner", "rateLimited", "spam"] as const;
    return (known as readonly string[]).includes(key) ? t(key as (typeof known)[number]) : t("required");
  };
}

export function toFormData(values: Record<string, unknown>, extra: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") fd.set(k, v ? "true" : "");
    else if (v instanceof FileList) Array.from(v).forEach((f) => fd.append(k, f));
    else fd.set(k, String(v));
  }
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return fd;
}

/**
 * Shared chrome for every lead form: honeypot, Turnstile, purpose statement next to submit
 * (Law 25), inline server errors, and the success "peak" moment (brief §3.0 Kahneman).
 */
export function LeadFormShell({
  kind,
  children,
  values,
  consentText,
  onSuccess,
  successTitle,
  successBody,
  submitLabel,
  phone,
  valid,
  light,
}: {
  kind: FormKind;
  children: ReactNode;
  values: () => Record<string, unknown> | null;
  consentText: string;
  onSuccess?: (r: Extract<ActionResult, { ok: true }>) => void;
  successTitle: string;
  successBody: string;
  submitLabel?: string;
  phone: string;
  /** Called before submitting; return false to block (client validation) */
  valid: () => Promise<boolean>;
  /** Light button (no-red zones: financing, trade-in) — default secondary for other forms */
  light?: boolean;
}) {
  const t = useTranslations("forms");
  const locale = useLocale();
  const errText = useErrorText();
  const [token, setToken] = useState("");
  const [state, setState] = useState<SubmitState>({ pending: false, error: null, fieldErrors: {} });
  const [done, setDone] = useState<Extract<ActionResult, { ok: true }> | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await valid())) return;
    const v = values();
    if (!v) return;
    setState({ pending: true, error: null, fieldErrors: {} });
    const res = await submitLead(kind, toFormData(v, { consentText, locale, turnstileToken: token }));
    if (res.ok) {
      track("lead_submitted", { type: kind });
      setDone(res);
      onSuccess?.(res);
    } else {
      setState({ pending: false, error: res.error === "validation" ? null : (errText(res.error === "generic" ? "required" : res.error) ?? null), fieldErrors: res.fieldErrors ?? {} });
      if (res.error === "generic") setState((s) => ({ ...s, error: t("errorGeneric", { phone: formatPhone(phone) }) }));
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4 py-4" role="status">
        <CheckCircle2 className="size-10 text-success" strokeWidth={1.5} aria-hidden />
        <h3 className="text-h3">{successTitle}</h3>
        <p className="max-w-md text-body text-text-2">{successBody}</p>
        <Button asChild variant="secondary" size="md" className="mt-2">
          <Link href="/inventory">{t("submit") === "Send" ? "Browse the inventory" : "Parcourir l'inventaire"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="no-red relative flex flex-col gap-4">
      <Honeypot />
      {children}
      {state.error && (
        <p role="alert" className="text-small text-danger">
          {state.error}
        </p>
      )}
      {Object.keys(state.fieldErrors).length > 0 && !state.error && (
        <p role="alert" className="text-small text-danger">
          {Object.values(state.fieldErrors).map(errText).filter(Boolean)[0]}
        </p>
      )}
      <Turnstile onToken={setToken} />
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-text-3">{t("purpose")}</p>
        <Button type="submit" variant={light ? "light" : "secondary"} size="lg" disabled={state.pending} className="shrink-0">
          {state.pending ? t("sending") : (submitLabel ?? t("submit"))}
        </Button>
      </div>
    </form>
  );
}
