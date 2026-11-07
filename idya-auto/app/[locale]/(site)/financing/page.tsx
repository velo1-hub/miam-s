import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FinancingForm } from "@/components/forms/forms";
import { Reveal } from "@/components/ui/reveal";
import { FinancingCalculator } from "@/components/vehicle/calculator";
import { resolveLocale } from "@/i18n/server";
import { getSettings } from "@/lib/settings";
import { vehicles } from "@/lib/vehicles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "financingPage" });
  return { title: t("title"), description: t("metaDescription"), alternates: { canonical: locale === "fr" ? "/fr/financement" : "/en/financing", languages: { "fr-CA": "/fr/financement", "en-CA": "/en/financing" } } };
}

/** Financing — brief §4, §14: strictly a no-red zone (Light buttons, white focus). */
export default async function FinancingPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const t = await getTranslations("financingPage");
  const settings = await getSettings();
  const featured = await vehicles.featured();
  const steps = t.raw("steps") as string[];
  const faq = t.raw("faq") as { q: string; a: string }[];
  return (
    <div className="no-red container-content pb-24 pt-32 md:pt-40">
      <div className="max-w-[760px]">
        <p className="eyebrow mb-3">{t("title")}</p>
        <h1 className="text-h1">{t("headline")}</h1>
        <p className="mt-5 text-body-lg text-text-2">{t("intro")}</p>
      </div>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <FinancingCalculator priceCad={featured?.priceCad ?? 29_995} finance={settings.finance} variant="full" hideCta />
        </Reveal>
        <div className="flex flex-col gap-12">
          <Reveal>
            <h2 className="text-h3">{t("howTitle")}</h2>
            <ol className="mt-5 flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-4 text-body text-text-2">
                  <span className="tabular shrink-0 font-semibold text-text">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-h3">{t("faqTitle")}</h2>
            <dl className="mt-5 flex flex-col gap-5">
              {faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium text-text">{f.q}</dt>
                  <dd className="mt-1 text-small text-text-2">{f.a}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
      <Reveal className="glass-lite mt-20 rounded-card p-6 md:p-10">
        <FinancingFormBlock phone={settings.business.phone} />
      </Reveal>
    </div>
  );
}

async function FinancingFormBlock({ phone }: { phone: string }) {
  const t = await getTranslations("forms.financing");
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <h2 className="text-h2">{t("title")}</h2>
        <p className="mt-3 text-body text-text-2">{t("intro")}</p>
      </div>
      <FinancingForm phone={phone} />
    </div>
  );
}
