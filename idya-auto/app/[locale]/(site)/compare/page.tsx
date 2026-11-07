import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CompareTable } from "@/components/vehicle/compare-table";
import { resolveLocale } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "comparePage" });
  return { title: t("title"), description: t("metaDescription"), robots: { index: false } };
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const t = await getTranslations("comparePage");
  return (
    <div className="container-content pb-24 pt-32 md:pt-40">
      <h1 className="text-h1">{t("headline")}</h1>
      <p className="mt-3 text-body-lg text-text-2">{t("intro")}</p>
      <div className="mt-10">
        <CompareTable />
      </div>
    </div>
  );
}
