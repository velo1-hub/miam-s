"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const KEY = "idya:consent-notice";

/**
 * Consent notice — brief §17.5: essential cookies only by default, cookieless analytics, so this is
 * an informational notice with a single acknowledgement (no non-essential cookies to opt into yet).
 * If GA4 or any tracking is ever added, this becomes an opt-in with separate choices.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setShow(!localStorage.getItem(KEY));
      } catch {
        setShow(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  if (!show) return null;
  const accept = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return (
    <div role="region" aria-label={t("title")} className="glass-2 fixed bottom-[calc(20px+env(safe-area-inset-bottom))] inset-x-[var(--gutter)] z-40 rounded-card-sm sm:right-auto sm:max-w-[420px] p-4 text-small lg:bottom-6">
      <p className="font-semibold text-text">{t("title")}</p>
      <p className="mt-1 text-text-2">{t("body")}</p>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="light" size="sm" onClick={accept}>{t("accept")}</Button>
        <Link href="/privacy" className="text-text-2 underline-offset-2 hover:text-text hover:underline">{t("learnMore")}</Link>
      </div>
    </div>
  );
}
