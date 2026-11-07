import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/legal-page";
import { resolveLocale } from "@/i18n/server";
import { termsSections } from "@/lib/legal/content";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("termsTitle"), alternates: { canonical: locale === "fr" ? "/fr/conditions" : "/en/terms", languages: { "fr-CA": "/fr/conditions", "en-CA": "/en/terms" } } };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("legal");
  const settings = await getSettings();
  return <LegalPage title={t("termsTitle")} updated={t("updated", { date: "2026-11-07" })} validate={t("validate")} sections={termsSections(settings, locale)} />;
}
