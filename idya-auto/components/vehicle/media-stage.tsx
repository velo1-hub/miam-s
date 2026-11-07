"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, ViewTransition } from "react";
import { Car360 } from "@/components/car360/car360";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils/cn";
import type { SpinSet, VehicleMedia } from "@/lib/vehicles/types";

type Tab = "spin" | "interior" | "photos";

interface Props {
  vehicleId: string;
  title: string;
  spin: SpinSet | null;
  media: VehicleMedia[];
  locale: "fr" | "en";
  demo: boolean;
}

/** Media stage — brief §8.2: segmented control 360° | Intérieur | Photos; default 360°. */
export function MediaStage({ vehicleId, title, spin, media, locale, demo }: Props) {
  const t = useTranslations("vehicle");
  const interior = media.filter((m) => m.kind === "interior");
  const photos = media.filter((m) => m.kind === "gallery");
  const tabs: { value: Tab; label: string }[] = [];
  if (spin) tabs.push({ value: "spin", label: t("mediaSpin") });
  if (interior.length) tabs.push({ value: "interior", label: t("mediaInterior") });
  if (photos.length) tabs.push({ value: "photos", label: t("mediaPhotos") });
  const [tab, setTab] = useState<Tab>(tabs[0]?.value ?? "photos");
  const [index, setIndex] = useState(0);
  const list = tab === "interior" ? interior : photos;
  const change = (v: Tab) => {
    setTab(v);
    setIndex(0);
    if (v !== "spin") track("gallery_opened", { tab: v });
  };

  return (
    <div className="flex flex-col gap-4">
      <ViewTransition name={`vehicle-cover-${vehicleId}`}>
        <div className="relative">
          {tab === "spin" && spin ? (
            <Car360 spin={spin} title={title} eager onShowPhotos={photos.length ? () => change("photos") : undefined} />
          ) : list[index] ? (
            <figure className="relative overflow-hidden rounded-hero bg-studio-bottom">
              <Image
                src={list[index].src}
                alt={locale === "fr" ? list[index].altFr : list[index].altEn}
                width={list[index].width}
                height={list[index].height}
                sizes="(min-width: 1280px) 820px, 100vw"
                placeholder={list[index].lqip ? "blur" : "empty"}
                blurDataURL={list[index].lqip}
                priority
                className="aspect-video w-full object-cover md:aspect-video"
              />
            </figure>
          ) : null}
          {demo && <p className="absolute left-4 bottom-4 rounded-pill bg-bg/60 px-3 py-1 text-caption text-text-3 backdrop-blur-sm">{t("demoNotice")}</p>}
        </div>
      </ViewTransition>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tabs.length > 1 && <SegmentedControl label={t("mediaStage")} options={tabs} value={tab} onChange={change} />}
        {tab !== "spin" && list.length > 1 && (
          <ul className="hide-scrollbar flex gap-2 overflow-x-auto" aria-label={t("mediaPhotos")}>
            {list.map((m, i) => (
              <li key={m.src}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  aria-label={locale === "fr" ? m.altFr : m.altEn}
                  className={cn("relative block h-14 w-20 overflow-hidden rounded-chip border", i === index ? "border-text" : "border-line opacity-70 hover:opacity-100")}
                >
                  <Image src={m.src} alt="" width={160} height={90} sizes="80px" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
