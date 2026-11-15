"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { dict } from "@/content/ui";
import { href } from "@/lib/routes";
import type { Lang } from "@/lib/site";
import { OPEN_EVENT, readConsent, writeConsent } from "@/lib/consent";

export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {label}
    </button>
  );
}

export function CookieBanner({ lang }: { lang: Lang }) {
  const t = dict(lang).cookies;
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [maps, setMaps] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const c = readConsent();
    if (!c) setOpen(true);
    else {
      setAnalytics(c.analytics);
      setMaps(c.maps);
    }
    const onOpen = () => {
      const cur = readConsent();
      setAnalytics(cur?.analytics ?? false);
      setMaps(cur?.maps ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) document.documentElement.setAttribute("data-cookie-open", "");
    else document.documentElement.removeAttribute("data-cookie-open");
  }, [open]);

  if (!open) return null;

  const done = (a: boolean, m: boolean) => {
    writeConsent({ analytics: a, maps: m });
    setOpen(false);
  };

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-3 z-[60] rounded-3xl border border-line bg-white p-5 shadow-[0_20px_60px_-25px_rgba(42,42,92,.45)] sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-md sm:p-6"
    >
      <h2 id={titleId} className="font-display text-lg font-semibold">{t.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t.text}{" "}
        <Link href={href("privacy", lang) + "#temoins"} className="font-medium text-navy underline underline-offset-4">{t.learn}</Link>
      </p>

      {custom && (
        <fieldset className="mt-4 space-y-3 rounded-2xl border border-line p-4">
          <legend className="sr-only">{t.customize}</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-navy" />
            <span><strong className="block text-ink">{t.necessary}</strong><span className="text-muted">{t.necessaryDesc}</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
            <span><strong className="block text-ink">{t.analytics}</strong><span className="text-muted">{t.analyticsDesc}</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={maps} onChange={(e) => setMaps(e.target.checked)} className="mt-1 h-4 w-4 accent-navy" />
            <span><strong className="block text-ink">{t.maps}</strong><span className="text-muted">{t.mapsDesc}</span></span>
          </label>
        </fieldset>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => done(false, false)} className="btn-secondary min-h-11 px-4">{t.refuse}</button>
        <button type="button" onClick={() => done(true, true)} className="btn-secondary min-h-11 px-4">{t.accept}</button>
        {custom ? (
          <button type="button" onClick={() => done(analytics, maps)} className="btn-primary col-span-2 min-h-11">{t.save}</button>
        ) : (
          <button type="button" onClick={() => setCustom(true)} className="col-span-2 min-h-11 text-sm font-semibold text-navy underline underline-offset-4">{t.customize}</button>
        )}
      </div>
    </section>
  );
}
