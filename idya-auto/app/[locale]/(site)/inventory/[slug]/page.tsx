import { Check, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssistantVehicle } from "@/components/assistant/assistant-context";
import { FinalCtaButton } from "@/components/home/final-cta-button";
import { ForYouRail } from "@/components/home/for-you-rail";
import { Reveal } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancingCalculator } from "@/components/vehicle/calculator";
import { MediaStage } from "@/components/vehicle/media-stage";
import { KeySpecs, SpecTable } from "@/components/vehicle/specs";
import { SummaryPanel } from "@/components/vehicle/summary-panel";
import { VehicleRail } from "@/components/vehicle/vehicle-rail";
import VehicleLoading from "./loading";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/server";
import { env } from "@/lib/env";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import { vehicleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings";
import { vehicles } from "@/lib/vehicles";
import { toCardData } from "@/lib/vehicles/card";
import { FEATURE_GROUPS, vehicleFullTitle, type FeatureKey } from "@/lib/vehicles/types";

type Params = Promise<{ locale: string; slug: string }>;

/** Unknown slugs wait for the full render so the first request answers 404, not a fallback shell (brief §8.7). */
export const ensureStatic = "navigation";

/** Static generation of every published vehicle in both locales (brief §19); new slugs render on demand. */
export async function generateStaticParams() {
  const slugs = await vehicles.publishedSlugs();
  return (["fr", "en"] as const).flatMap((locale) => slugs.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await params).locale as Locale;
  const v = await vehicles.getBySlug(slug);
  if (!v) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  const settings = await getSettings();
  const title = vehicleFullTitle(v);
  const price = formatPrice(v.priceCad, locale);
  return {
    title: { absolute: t("vehicleTitle", { title, price, city: settings.business.city }) },
    description: t("vehicleDescription", { title, km: formatKm(v.odometerKm, locale), price }),
    alternates: {
      canonical: `/${locale}/${locale === "fr" ? "inventaire" : "inventory"}/${v.slug}`,
      languages: { "fr-CA": `/fr/inventaire/${v.slug}`, "en-CA": `/en/inventory/${v.slug}`, "x-default": `/fr/inventaire/${v.slug}` },
    },
    openGraph: { type: "website", title, description: `${price} · ${formatKm(v.odometerKm, locale)}` },
  };
}

async function Similar({ slug }: { slug: string }) {
  const t = await getTranslations("vehicle");
  const v = await vehicles.getBySlug(slug);
  if (!v) return null;
  const similar = await vehicles.similar(v, 6);
  if (similar.length === 0) return null;
  return (
    <section className="mt-20" aria-labelledby="similar">
      <h2 id="similar" className="mb-8 text-h2">{t("similarTitle")}</h2>
      <VehicleRail vehicles={similar.map(toCardData)} />
    </section>
  );
}

export default async function VehiclePage({ params }: { params: Params }) {
  // Resolved before the shell streams so an unknown or expired slug answers with a real 404 status
  // (brief §8.7). The lookup is cached under the `vehicles` tag, so this costs no extra query.
  const { slug } = await params;
  if (!(await vehicles.getBySlug(slug))) notFound();
  return (
    <Suspense fallback={<VehicleLoading />}>
      <VehicleContent params={params} />
    </Suspense>
  );
}

async function VehicleContent({ params }: { params: Params }) {
  const { slug } = await params;
  await resolveLocale(params.then((p) => ({ locale: p.locale })));
  const locale = (await getLocale()) as Locale;
  const v = await vehicles.getBySlug(slug);
  if (!v) notFound();
  const [t, te, tf, settings] = await Promise.all([getTranslations("vehicle"), getTranslations("enums"), getTranslations("features"), getSettings()]);
  const title = vehicleFullTitle(v);
  const description = locale === "fr" ? v.descriptionFr : (v.descriptionEn ?? v.descriptionFr);
  const groups = (Object.keys(FEATURE_GROUPS) as (keyof typeof FEATURE_GROUPS)[])
    .map((g) => ({ g, keys: FEATURE_GROUPS[g].filter((k: FeatureKey) => v.features.includes(k)) }))
    .filter((x) => x.keys.length > 0);
  const wc = v.warrantyClass;
  const warranty = wc ? settings.warranty[wc][locale] : null;
  const jsonLd = [vehicleJsonLd(v, locale, settings, env.siteUrl), breadcrumbJsonLd(v, locale, env.siteUrl)];

  return (
    <article className="container-content pb-28 pt-28 md:pt-36">
      <AssistantVehicle id={v.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-small text-text-2">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/inventory" className="hover:text-text">{t("breadcrumbInventory")}</Link></li>
          <li aria-hidden>›</li>
          <li><Link href={{ pathname: "/inventory", query: { make: v.make } }} className="hover:text-text">{v.make}</Link></li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-text">{v.model}</li>
        </ol>
      </nav>

      {v.status === "sold" && (
        <div className="glass-1 mb-6 rounded-card-sm px-5 py-4 text-small">
          <p className="font-semibold text-red-text">{t("soldBanner")}</p>
          <p className="text-text-2">{t("soldBody")}</p>
        </div>
      )}
      {v.status === "pending" && <p className="glass-1 mb-6 rounded-card-sm px-5 py-4 text-small text-text-2">{t("pendingBanner")}</p>}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        <div className="min-w-0">
          <MediaStage vehicleId={v.id} title={title} spin={v.spin} media={v.media} locale={locale} demo={v.demo} />
        </div>
        <SummaryPanel vehicle={{ ...toCardData(v), stockNumber: v.stockNumber }} phone={settings.business.phone} />
      </div>

      <div className="mt-12 lg:max-w-[calc(100%-432px)]">
        <KeySpecs v={v} />

        <Reveal as="section" className="mt-14">
          <h2 className="mb-4 text-h3">{t("sections.overview")}</h2>
          <p className="max-w-[72ch] whitespace-pre-line text-body text-text-2">{description}</p>
        </Reveal>

        {groups.length > 0 && (
          <Reveal as="section" className="mt-14">
            <h2 className="mb-6 text-h3">{t("sections.features")}</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {groups.map(({ g, keys }) => (
                <div key={g}>
                  <h3 className="eyebrow mb-3">{tf(`groups.${g}`)}</h3>
                  <ul className="flex flex-col gap-2">
                    {keys.map((k) => (
                      <li key={k} className="flex items-center gap-2.5 text-small text-text">
                        <Check className="size-4 text-success" strokeWidth={1.5} aria-hidden />
                        {tf(k)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal as="section" className="mt-14">
          <h2 className="mb-6 text-h3">{t("sections.specs")}</h2>
          <SpecTable v={v} />
        </Reveal>

        {(v.carfaxUrl || v.accidentFree !== null || v.ownersCount) && (
          <Reveal as="section" className="mt-14">
            <h2 className="mb-4 text-h3">{t("sections.history")}</h2>
            <ul className="flex flex-col gap-2 text-small text-text">
              {v.accidentFree !== null && <li className="flex items-center gap-2.5"><Check className="size-4 text-success" strokeWidth={1.5} aria-hidden />{v.accidentFree ? t("history.accidentFree") : t("history.accidents")}</li>}
              {v.ownersCount ? <li>{t("history.owners", { count: v.ownersCount })}</li> : null}
              {v.carfaxUrl && (
                <li>
                  <a href={v.carfaxUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                    {t("history.carfax")} <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        )}

        <Reveal as="section" className="mt-14">
          <h2 className="mb-4 text-h3">{t("sections.warranty")}</h2>
          <div className="flex flex-col gap-4 text-small text-text-2">
            {v.condition === "new" && !v.warrantyClass && <p>{t("warranty.newVehicle")}</p>}
            {(v.manufacturerWarrantyFr || v.manufacturerWarrantyEn) && (
              <div>
                <h3 className="mb-1 font-medium text-text">{t("warranty.manufacturer")}</h3>
                <p>{locale === "fr" ? v.manufacturerWarrantyFr : (v.manufacturerWarrantyEn ?? v.manufacturerWarrantyFr)}</p>
              </div>
            )}
            {warranty && wc && (
              <div>
                <h3 className="mb-1 font-medium text-text">{t("warranty.legal")} · {te(`warrantyClass.${wc}`)}</h3>
                <p>{warranty}</p>
                <p className="mt-1 text-caption text-text-3">{t("warranty.legalNote")}</p>
              </div>
            )}
          </div>
        </Reveal>

        {v.status !== "sold" && (
          <Reveal as="section" className="mt-14" >
            <h2 className="sr-only">{t("sections.financing")}</h2>
            <FinancingCalculator priceCad={v.priceCad} finance={settings.finance} variant="full" />
          </Reveal>
        )}
      </div>

      <Suspense fallback={<Skeleton className="mt-20 h-[420px] rounded-card" />}>
        <Similar slug={v.slug} />
      </Suspense>
      <ForYouRail exclude={[v.id]} />
      {v.status !== "sold" && (
        <div className="mt-20 text-center">
          <FinalCtaButton label={t("bookTestDrive")} vehicleId={v.id} />
        </div>
      )}
    </article>
  );
}
