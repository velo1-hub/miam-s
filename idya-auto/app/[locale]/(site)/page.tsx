import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { ForYouRail } from "@/components/home/for-you-rail";
import { Scene360 } from "@/components/home/scene-360";
import { Categories, CounterStrip, FinalCta, FinancingTeaser, RecentArrivals, TradeInTeaser, Visit, WhyUs } from "@/components/home/sections";
import type { HeroSources } from "@/components/home/hero-video";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLocale } from "@/i18n/server";
import { getSettings } from "@/lib/settings";
import { vehicles } from "@/lib/vehicles";
import { vehicleFullTitle } from "@/lib/vehicles/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "seo" });
  const settings = await getSettings();
  return {
    title: { absolute: t("homeTitle", { city: settings.business.city }) },
    description: t("homeDescription", { city: settings.business.city }),
    alternates: { canonical: `/${locale}`, languages: { "fr-CA": "/fr", "en-CA": "/en", "x-default": "/fr" } },
  };
}

/** Hero media: Settings override (admin upload, §11.2) → files in public/media → poster-only fallback. */
async function heroSources(settings: Awaited<ReturnType<typeof getSettings>>): Promise<HeroSources> {
  "use cache";
  const pub = (p: string) => (existsSync(path.join(process.cwd(), "public", p)) ? `/${p}` : null);
  return {
    av1: settings.hero.av1Url ?? pub("media/hero-1080.av1.mp4"),
    h264: settings.hero.h264Url ?? pub("media/hero-1080.h264.mp4"),
    mobile: settings.hero.mobileUrl ?? pub("media/hero-mobile.h264.mp4"),
    poster: settings.hero.posterUrl ?? pub("media/hero-poster.avif"),
    posterMobile: settings.hero.posterMobileUrl ?? pub("media/hero-poster-mobile.avif"),
  };
}

async function makesForSearch() {
  "use cache";
  const res = await vehicles.list({}, "newest", 1, 500);
  const map = new Map<string, Set<string>>();
  for (const v of res.items) {
    if (!map.has(v.make)) map.set(v.make, new Set());
    map.get(v.make)?.add(v.model);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([value, models]) => ({ value, models: [...models].sort() }));
}

async function FeaturedScene() {
  const featured = await vehicles.featured();
  if (!featured?.spin) return null;
  return <Scene360 spin={featured.spin} title={vehicleFullTitle(featured)} slug={featured.slug} />;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const settings = await getSettings();
  const [sources, makes] = await Promise.all([heroSources(settings), makesForSearch()]);
  return (
    <>
      <Hero settings={settings} sources={sources} makes={makes} />
      <Suspense fallback={<div className="h-20" />}>
        <CounterStrip />
      </Suspense>
      <Suspense fallback={<Skeleton className="container-content my-24 aspect-video" />}>
        <FeaturedScene />
      </Suspense>
      <Suspense fallback={<Skeleton className="container-content my-24 h-[420px]" />}>
        <RecentArrivals />
      </Suspense>
      <Suspense>
        <Categories />
      </Suspense>
      <WhyUs settings={settings} />
      <Suspense>
        <FinancingTeaser settings={settings} />
      </Suspense>
      <TradeInTeaser />
      <ForYouRail />
      <Visit settings={settings} />
      <FinalCta />
    </>
  );
}
