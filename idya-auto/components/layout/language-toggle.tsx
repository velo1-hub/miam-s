"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils/cn";

/** FR | EN toggle that keeps the visitor on the equivalent page (brief §4). */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname() as AppPathname;
  const params = useParams();
  const router = useRouter();
  const target = locale === "fr" ? "en" : "fr";

  const switchLocale = () => {
    track("language_switched", { to: target });
    // next-intl resolves the localized pathname; dynamic params are carried over.
    router.replace(
      // @ts-expect-error -- params are only present on dynamic routes; next-intl validates at runtime
      { pathname, params },
      { locale: target },
    );
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={cn("press inline-flex h-9 items-center gap-1 rounded-pill px-2 text-small font-medium text-text-2", className)}
    >
      <span className={cn(locale === "fr" && "text-text")}>FR</span>
      <span aria-hidden className="text-text-3">|</span>
      <span className={cn(locale === "en" && "text-text")}>EN</span>
      <span className="sr-only">, {t("languageToggle")}</span>
    </button>
  );
}
