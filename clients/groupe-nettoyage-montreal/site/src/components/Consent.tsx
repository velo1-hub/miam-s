"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";

type Choice = { analytics: boolean; at: string };
const KEY = "gnm-consent-v1";
export function readConsent(): Choice | null { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as Choice) : null; } catch { return null; } }

export function Consent({ locale }: { locale: Locale }) {
  const d = t(locale); const [choice, setChoice] = useState<Choice | null | undefined>(undefined); const [custom, setCustom] = useState(false); const [analytics, setAnalytics] = useState(false);
  useEffect(() => { setChoice(readConsent()); }, []);
  const save = (a: boolean) => { const c = { analytics: a, at: new Date().toISOString() }; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} setChoice(c); setCustom(false); };
  const gtm = BIZ.gtmId && choice?.analytics ? (
    <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${BIZ.gtmId}');`}</Script>
  ) : null;
  if (choice === undefined || choice) return gtm;
  return (
    <div role="dialog" aria-labelledby="consent-title" aria-live="polite" id="gnm-consent" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-white p-5 shadow-soft sm:bottom-5 sm:inset-x-auto sm:left-5 sm:mx-0">
      <h2 id="consent-title" className="text-[15px] font-semibold text-navy-950">{d.consent.title}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{d.consent.body} <Link href={pagePath(locale, "privacy")} className="underline">{d.consent.policy}</Link></p>
      {custom && <label className="mt-3 flex items-center gap-2 text-[14px] text-ink-700"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4 accent-navy-900" />{d.consent.analytics}</label>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-dark !py-2 text-[14px]" onClick={() => save(true)}>{d.consent.accept}</button>
        <button className="btn btn-ghost !py-2 text-[14px]" onClick={() => save(false)}>{d.consent.reject}</button>
        {custom ? <button className="btn btn-ghost !py-2 text-[14px]" onClick={() => save(analytics)}>{d.consent.save}</button> : <button className="btn !py-2 text-[14px] text-ink-600 hover:text-navy-900" onClick={() => setCustom(true)}>{d.consent.customize}</button>}
      </div>
    </div>
  );
}
