import { ArrowRight, Car, CheckCircle2, MapPin, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { HoursStatus } from "@/components/layout/hours-status";
import { HoursTable } from "@/components/layout/hours-table";
import { FinancingCalculator } from "@/components/vehicle/calculator";
import { VehicleRail } from "@/components/vehicle/vehicle-rail";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";
import { formatPhone } from "@/lib/format/phone";
import type { Settings } from "@/lib/settings/types";
import { vehicles } from "@/lib/vehicles";
import { toCardData } from "@/lib/vehicles/card";
import type { BodyType, FacetCount } from "@/lib/vehicles/types";
import { FinalCtaButton } from "./final-cta-button";

/** Live counter strip — brief §6.2: only the inventory count, pulled from the repository. */
export async function CounterStrip() {
  const t = await getTranslations("home");
  const count = await vehicles.countPublished();
  return (
    <div className="border-y border-line bg-bg-raised">
      <div className="container-content flex flex-col items-start gap-1 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-h3 tabular text-text">{t("counter", { count })}</p>
        <p className="flex items-center gap-2 text-small text-text-3">
          <span aria-hidden className="size-1.5 rounded-pill bg-success" />
          {t("counterLive")}
        </p>
      </div>
    </div>
  );
}

export async function RecentArrivals() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const recent = await vehicles.recent(8);
  if (recent.length === 0) return null;
  return (
    <Section eyebrow={t("recentEyebrow")} title={t("recentHeadline")} action={<ArrowLink href="/inventory">{tc("viewAll")}</ArrowLink>}>
      <Reveal>
        <VehicleRail vehicles={recent.map(toCardData)} />
      </Reveal>
    </Section>
  );
}

const CATEGORY_ORDER: { key: string; bodyTypes: BodyType[] | null; fuel?: boolean }[] = [
  { key: "suv", bodyTypes: ["suv"] },
  { key: "sedan", bodyTypes: ["sedan"] },
  { key: "truck", bodyTypes: ["truck"] },
  { key: "coupe", bodyTypes: ["coupe", "convertible"] },
  { key: "electric", bodyTypes: null, fuel: true },
  { key: "minivan", bodyTypes: ["minivan", "van"] },
];

export async function Categories() {
  const t = await getTranslations("home");
  const te = await getTranslations("enums");
  const tc = await getTranslations("common");
  const counts = await vehicles.countByBodyType();
  const electric = await vehicles.list({ fuel: ["electric", "hybrid", "plug_in_hybrid"] }, "newest", 1, 1);
  const countFor = (c: (typeof CATEGORY_ORDER)[number]) =>
    c.fuel ? electric.total : (c.bodyTypes ?? []).reduce((s, b) => s + (counts.find((x: FacetCount<BodyType>) => x.value === b)?.count ?? 0), 0);
  const tiles = CATEGORY_ORDER.map((c) => ({ ...c, count: countFor(c) })).filter((c) => c.count > 0);
  if (tiles.length === 0) return null;
  return (
    <Section eyebrow={t("categoriesEyebrow")} title={t("categoriesHeadline")} raised>
      <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6" as="div">
        {tiles.map((c) => (
          <RevealItem key={c.key}>
            <Link
              href={{ pathname: "/inventory", query: c.fuel ? { fuel: "electric,hybrid,plug_in_hybrid" } : { body: (c.bodyTypes ?? []).join(",") } }}
              className="glass-lite glass-hover group flex aspect-[4/3] flex-col justify-between rounded-card p-5 transition-colors hover:bg-white/[0.06] md:aspect-square"
            >
              <Car className="size-6 text-titanium" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="text-[17px] font-semibold text-text">{c.fuel ? t("categoryElectric") : te(`bodyTypePlural.${c.bodyTypes?.[0] ?? "suv"}`)}</p>
                <p className="tabular text-small text-text-2">{tc("vehicles", { count: c.count })}</p>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

export async function WhyUs({ settings }: { settings: Settings }) {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as "fr" | "en";
  const items = settings.whyUs.filter((w) => w.enabled);
  if (items.length === 0) return null;
  return (
    <Section eyebrow={t("whyEyebrow")} title={t("whyHeadline")}>
      <RevealGroup className={`grid gap-4 md:grid-cols-2 ${items.length >= 4 ? "xl:grid-cols-4" : ""}`}>
        {items.map((w) => (
          <RevealItem key={w.key} className="glass-lite rounded-card p-6">
            <CheckCircle2 className="mb-4 size-6 text-success" strokeWidth={1.5} aria-hidden />
            <h3 className="text-[19px] font-semibold text-text">{w[locale].title}</h3>
            <p className="mt-2 text-small text-text-2">{w[locale].body}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

export async function FinancingTeaser({ settings }: { settings: Settings }) {
  const t = await getTranslations("home");
  const featured = await vehicles.featured();
  const price = featured?.priceCad ?? 29_995;
  return (
    <Section raised id="financement">
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-3">{t("financingEyebrow")}</p>
          <h2 className="text-h2">{t("financingHeadline")}</h2>
          <p className="mt-5 max-w-[520px] text-body-lg text-text-2">{t("financingBody")}</p>
          <Button asChild variant="light" size="lg" className="mt-8">
            <Link href="/financing">{t("financingCta")}</Link>
          </Button>
        </Reveal>
        <Reveal delay={0.1}>
          <FinancingCalculator priceCad={price} finance={settings.finance} variant="compact" hideCta />
        </Reveal>
      </div>
    </Section>
  );
}

export async function TradeInTeaser() {
  const t = await getTranslations("home");
  return (
    <Section>
      <Reveal className="glass-lite flex flex-col gap-6 rounded-card p-8 md:flex-row md:items-center md:justify-between md:p-12">
        <div className="max-w-[640px]">
          <p className="eyebrow mb-3">{t("tradeInEyebrow")}</p>
          <h2 className="text-h2">{t("tradeInHeadline")}</h2>
          <p className="mt-4 text-body-lg text-text-2">{t("tradeInBody")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
          <Button asChild variant="light" size="lg">
            <Link href="/trade-in">
              {t("tradeInCta")}
              <ArrowRight strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
          <ArrowLink href="/sell-my-car" className="text-small text-text-2 hover:text-text">{t("sellLink")}</ArrowLink>
        </div>
      </Reveal>
    </Section>
  );
}

export async function Visit({ settings }: { settings: Settings }) {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const b = settings.business;
  const mapQuery = encodeURIComponent(`${b.addressLine1}, ${b.city}, ${b.province} ${b.postalCode}`);
  const staticMap =
    env.mapsKey && b.lat !== null && b.lng !== null
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${b.lat},${b.lng}&zoom=14&size=640x400&scale=2&maptype=roadmap&markers=color:0xE21F26%7C${b.lat},${b.lng}&style=feature:all%7Celement:geometry%7Ccolor:0x141418&style=feature:all%7Celement:labels.text.fill%7Ccolor:0xa1a1a6&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x08080a&style=feature:road%7Celement:geometry%7Ccolor:0x1b1b20&style=feature:water%7Celement:geometry%7Ccolor:0x0e0e11&key=${env.mapsKey}`
      : null;
  return (
    <Section eyebrow={t("visitEyebrow")} title={t("visitHeadline")} raised id="visite">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="studio-bg relative min-h-[320px] overflow-hidden rounded-card border border-line">
          {staticMap ? (
            // eslint-disable-next-line @next/next/no-img-element -- third-party static map, not optimizable by next/image
            <img src={staticMap} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="size-10 text-red-text" strokeWidth={1.5} aria-hidden />
            </div>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="press absolute bottom-5 left-5 inline-flex h-btn-md items-center gap-2 rounded-pill bg-text px-5 text-[15px] font-semibold text-bg"
          >
            {tc("directions")}
            <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
          </a>
        </Reveal>
        <Reveal delay={0.1} className="glass-lite flex flex-col gap-6 rounded-card p-6 md:p-8">
          <address className="not-italic">
            <p className="text-[19px] font-semibold text-text">{b.displayName}</p>
            <p className="text-text-2">{b.addressLine1}</p>
            <p className="text-text-2">
              {b.city}, {b.province} {b.postalCode}
            </p>
          </address>
          <a href={`tel:${b.phone}`} className="inline-flex items-center gap-2 text-text hover:underline">
            <Phone className="size-4" strokeWidth={1.5} aria-hidden />
            {formatPhone(b.phone)}
          </a>
          <div>
            <HoursStatus settings={settings} className="mb-3" />
            <HoursTable hours={settings.hours} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations("home");
  return (
    <Section className="text-center">
      <Reveal>
        <h2 className="text-display">{t("finalHeadline")}</h2>
        <p className="mx-auto mt-5 max-w-[520px] text-body-lg text-text-2">{t("finalBody")}</p>
        <div className="mt-10">
          <FinalCtaButton label={t("finalCta")} />
        </div>
      </Reveal>
    </Section>
  );
}
