"use client";

import { GitCompareArrows, Heart, Phone, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { useLeadDialog } from "@/components/forms/lead-dialog-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useToast } from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { compare, COMPARE_MAX } from "@/lib/compare/store";
import { favorites } from "@/lib/favorites/store";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import { formatPhone } from "@/lib/format/phone";
import { viewHistory } from "@/lib/history/store";
import { cn } from "@/lib/utils/cn";
import type { VehicleCardData } from "@/lib/vehicles/card";
import { vehicleTitle } from "@/lib/vehicles/types";

interface Props {
  vehicle: VehicleCardData & { stockNumber: string };
  phone: string;
}

/**
 * Summary panel — brief §8.3. Sticky glass-2 on desktop. The primary (red) button is the single
 * red action; the mobile sticky bar (§5.2) appears only when this button leaves the viewport (C3).
 */
export function SummaryPanel({ vehicle: v, phone }: Props) {
  const t = useTranslations("vehicle");
  const tb = useTranslations("badges");
  const tc = useTranslations("common");
  const te = useTranslations("enums");
  const locale = useLocale() as Locale;
  const { openBooking } = useBooking();
  const { openLead } = useLeadDialog();
  const toast = useToast();
  const favs = favorites.useList();
  const cmp = compare.useList();
  const isFav = favs.includes(v.id);
  const inCompare = cmp.includes(v.id);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const title = vehicleTitle(v);
  const sold = v.status === "sold";

  useEffect(() => {
    viewHistory.touch(v.id);
    track("vehicle_viewed", { vehicleId: v.id });
  }, [v.id]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const share = async () => {
    const url = window.location.href;
    const text = t("shareTitle", { title, price: formatPrice(v.priceCad, locale) });
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast({ title: tc("linkCopied") });
  };

  const toggleCompare = () => {
    if (inCompare) compare.remove(v.id);
    else {
      if (cmp.length >= COMPARE_MAX) compare.remove(cmp[cmp.length - 1]);
      compare.add(v.id);
      track("compare_added", { vehicleId: v.id });
    }
  };

  return (
    <>
      <div className="glass-2 rounded-card p-6 md:p-8 lg:sticky lg:top-24">
        <div className="flex flex-wrap gap-2">
          {sold ? <Badge variant="sold">{tb("sold")}</Badge> : v.status === "pending" ? <Badge variant="pending">{tb("pending")}</Badge> : null}
          <Badge variant={v.condition === "new" ? "new" : v.condition === "certified" ? "certified" : "neutral"}>{te(`condition.${v.condition}`)}</Badge>
        </div>
        <h1 className="mt-4 text-h2">{title}</h1>
        <p className="mt-1 text-body text-text-2">
          {v.trim ? `${v.trim} · ` : ""}
          <span className="tabular">{formatKm(v.odometerKm, locale)}</span>
          <span className="text-text-3"> · {t("stock", { stock: v.stockNumber })}</span>
        </p>
        <div className="mt-6">
          {v.previousPriceCad && v.previousPriceCad > v.priceCad && (
            <p className="tabular text-small text-text-3 line-through">{t("previousPrice", { price: formatPrice(v.previousPriceCad, locale) })}</p>
          )}
          <p className="tabular text-price-xl text-text">{formatPrice(v.priceCad, locale)}</p>
          <p className="mt-1 text-small text-text-2">{tc("taxesExtra")}</p>
          <p className="mt-2 text-caption text-text-3">{tc("allInPrice")}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {!sold && (
            <Button ref={ctaRef} variant="primary" size="lg" className="w-full" onClick={() => openBooking(v.id)}>
              {t("bookTestDrive")}
            </Button>
          )}
          <Button variant="secondary" size="lg" className="w-full" onClick={() => openLead("question", { vehicleId: v.id, vehicle: `${title} (${v.stockNumber})` })}>
            {t("askQuestion")}
          </Button>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Link href="/trade-in" className="text-small text-text underline-offset-4 hover:underline">{t("valueTradeIn")}</Link>
            <a href={`tel:${phone}`} onClick={() => track("phone_clicked")} className="inline-flex items-center gap-1.5 text-small text-text underline-offset-4 hover:underline">
              <Phone className="size-4" strokeWidth={1.5} aria-hidden />
              {formatPhone(phone)}
            </a>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-5">
          <IconButton label={isFav ? tc("close") : tc("share")} onClick={() => { const added = favorites.toggle(v.id); if (added) track("favorite_added", { vehicleId: v.id }); }} aria-pressed={isFav} title={undefined}>
            <Heart className={cn(isFav && "fill-red-text text-red-text")} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={tc("share")} onClick={share}>
            <Share2 strokeWidth={1.5} />
          </IconButton>
          <Button variant={inCompare ? "light" : "secondary"} size="md" onClick={toggleCompare} aria-pressed={inCompare}>
            <GitCompareArrows strokeWidth={1.5} aria-hidden />
            {inCompare ? t("compareAdded") : t("compare")}
          </Button>
        </div>
      </div>

      {/* Sticky mobile bar — brief §5.2, only once the panel CTA has scrolled away */}
      {!sold && (
        <div
          className={cn(
            "glass-2 fixed inset-x-0 bottom-0 z-30 flex h-[calc(var(--spacing-sticky-bar)+env(safe-area-inset-bottom))] items-center justify-between gap-4 px-[var(--gutter)] pb-[env(safe-area-inset-bottom)] transition-transform duration-[250ms] ease-out lg:hidden",
            ctaVisible && "translate-y-full",
          )}
          aria-hidden={ctaVisible}
        >
          <div>
            <p className="tabular text-[20px] font-semibold leading-none text-text">{formatPrice(v.priceCad, locale)}</p>
            <p className="text-caption text-text-3">{tc("taxesExtra")}</p>
          </div>
          <Button variant="primary" size="md" onClick={() => openBooking(v.id)} tabIndex={ctaVisible ? -1 : 0}>
            {t("bookTestDrive")}
          </Button>
        </div>
      )}
    </>
  );
}
