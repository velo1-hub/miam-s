"use client";

import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ViewTransition } from "react";
import { SpinScrub } from "@/components/car360/spin-scrub";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { favorites } from "@/lib/favorites/store";
import { formatKm, formatPrice, type Locale } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/use-now";
import { isNewArrival, type VehicleCardData } from "@/lib/vehicles/card";
import { vehicleTitle } from "@/lib/vehicles/types";

interface Props {
  vehicle: VehicleCardData;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Vehicle card — brief §7: glass-lite, radius 28, 4:3 cover, hover scrub on desktop, badges
 * top-left, heart top-right, price tabular with « taxes en sus ». No payment estimate (§14).
 */
export function VehicleCard({ vehicle: v, className, priority, sizes = "(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw" }: Props) {
  const t = useTranslations("card");
  const tb = useTranslations("badges");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const favs = favorites.useList();
  const isFav = favs.includes(v.id);
  const now = useNow();
  const title = vehicleTitle(v);
  const sold = v.status === "sold";
  const alt = `${title}${v.trim ? ` ${v.trim}` : ""}${v.exteriorColor ? `, ${v.exteriorColor}` : ""}`;

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = favorites.toggle(v.id);
    if (added) track("favorite_added", { vehicleId: v.id });
  };

  const cover = v.cover ? (
    <Image
      src={v.cover.src}
      alt={alt}
      width={v.cover.width}
      height={v.cover.height}
      sizes={sizes}
      priority={priority}
      placeholder={v.cover.lqip ? "blur" : "empty"}
      blurDataURL={v.cover.lqip}
      quality={75}
      className={cn("h-full w-full object-cover transition-transform duration-[450ms] ease-out", sold && "opacity-50")}
    />
  ) : (
    <div className="studio-bg h-full w-full" aria-hidden />
  );

  return (
    <article
      className={cn("glass-lite glass-hover group relative flex flex-col overflow-hidden rounded-card", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <Link href={{ pathname: "/inventory/[slug]", params: { slug: v.slug } }} className="relative block aspect-[4/3] overflow-hidden bg-studio-bottom">
        <ViewTransition name={`vehicle-cover-${v.id}`}>
          <div className="h-full w-full">
            {v.spin && !sold ? (
              <SpinScrub spin={v.spin} alt={alt}>
                {cover}
              </SpinScrub>
            ) : (
              cover
            )}
          </div>
        </ViewTransition>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5" aria-hidden>
          {sold ? (
            <Badge variant="sold">{tb("sold")}</Badge>
          ) : (
            <>
              {v.condition === "new" && <Badge variant="new">{tb("new")}</Badge>}
              {v.condition === "certified" && <Badge variant="certified">{tb("certified")}</Badge>}
              {v.status === "pending" && <Badge variant="pending">{tb("pending")}</Badge>}
              {now && isNewArrival(v.publishedAt, now.getTime()) && v.status === "available" && <Badge variant="newArrival">{tb("newArrival")}</Badge>}
              {v.previousPriceCad && v.previousPriceCad > v.priceCad && <Badge variant="priceDrop">{tb("priceDrop")}</Badge>}
            </>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={toggleFav}
        aria-pressed={isFav}
        aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
        className="press absolute right-3 top-3 z-10 inline-flex size-tap items-center justify-center rounded-pill glass-1 text-text"
      >
        <Heart className={cn("size-5 transition-colors", isFav && "fill-red-text text-red-text")} strokeWidth={1.5} aria-hidden />
      </button>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="text-[17px] font-semibold leading-snug text-text">
          <Link href={{ pathname: "/inventory/[slug]", params: { slug: v.slug } }} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        <p className="text-small text-text-2">
          {v.trim ? `${v.trim} · ` : ""}
          <span className="tabular">{formatKm(v.odometerKm, locale)}</span>
        </p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="tabular text-[24px] font-semibold leading-none text-text" data-price={v.priceCad}>{formatPrice(v.priceCad, locale)}</span>
          <span className="text-caption text-text-3">{tc("taxesExtra")}</span>
        </p>
      </div>
    </article>
  );
}
