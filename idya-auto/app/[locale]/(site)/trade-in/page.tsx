import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TradeInForm } from "@/components/forms/forms";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Reveal } from "@/components/ui/reveal";
import { resolveLocale } from "@/i18n/server";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "tradeInPage" });
  return { title: t("title"), description: t("metaDescription"), alternates: { canonical: locale === "fr" ? "/fr/echange" : "/en/trade-in", languages: { "fr-CA": "/fr/echange", "en-CA": "/en/trade-in" } } };
}

/** Trade-in — no-red zone (evaluation context, brief §3.0). */
export default async function TradeInPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const t = await getTranslations("tradeInPage");
  const tf = await getTranslations("forms.tradeIn");
  const settings = await getSettings();
  const steps = t.raw("steps") as string[];
  return (
    <div className="no-red container-content pb-24 pt-32 md:pt-40">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-3">{t("title")}</p>
          <h1 className="text-h1">{t("headline")}</h1>
          <p className="mt-5 text-body-lg text-text-2">{t("intro")}</p>
          <h2 className="mt-12 text-h3">{t("stepsTitle")}</h2>
          <ol className="mt-5 flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4 text-body text-text-2">
                <span className="tabular shrink-0 font-semibold text-text">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-12 rounded-card-sm border border-line p-5">
            <p className="text-small text-text-2">{t("sellNote")}</p>
            <ArrowLink href="/sell-my-car" className="mt-3 text-small">{t("sellLink")}</ArrowLink>
          </div>
        </div>
        <Reveal className="glass-lite rounded-card p-6 md:p-10">
          <h2 className="mb-6 text-h3">{tf("title")}</h2>
          <TradeInForm phone={settings.business.phone} />
        </Reveal>
      </div>
    </div>
  );
}
