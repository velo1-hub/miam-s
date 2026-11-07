import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Visit } from "@/components/home/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { resolveLocale } from "@/i18n/server";
import { env } from "@/lib/env";
import { dealerJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return { title: t("title"), description: t("metaDescription"), alternates: { canonical: locale === "fr" ? "/fr/a-propos" : "/en/about", languages: { "fr-CA": "/fr/a-propos", "en-CA": "/en/about" } } };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const t = await getTranslations("aboutPage");
  const settings = await getSettings();
  const values = t.raw("values") as { title: string; body: string }[];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerJsonLd(settings, env.siteUrl)) }} />
      <div className="container-content pt-32 md:pt-40">
        <div className="max-w-[760px]">
          <p className="eyebrow mb-3">{t("title")}</p>
          <h1 className="text-h1">{t("headline")}</h1>
          <p className="mt-5 text-body-lg text-text-2">{t("intro")}</p>
        </div>
        <Reveal className="mt-16">
          <h2 className="mb-8 text-h2">{t("valuesTitle")}</h2>
          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {values.map((v) => (
              <RevealItem key={v.title} className="glass-lite rounded-card p-6">
                <h3 className="text-[19px] font-semibold text-text">{v.title}</h3>
                <p className="mt-2 text-small text-text-2">{v.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
        <p className="mt-16 max-w-[72ch] text-body text-text-3">{t("teamNote")}</p>
      </div>
      <Visit settings={settings} />
    </>
  );
}
