"use client";
import { useEffect, useState } from "react";
import { dict } from "@/content/ui";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";
import { site, type Lang } from "@/lib/site";
import { Icon } from "./Icon";

/** Carte chargée seulement après un clic ou un consentement « Cartes » (Loi 25). */
export function MapEmbed({ lang }: { lang: Lang }) {
  const t = dict(lang).contact;
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (readConsent()?.maps) setShow(true);
    const on = (e: Event) => setShow(Boolean((e as CustomEvent).detail?.maps));
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);
  const { lat, lng } = site.geo;
  const d = 0.006;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}&layer=mapnik&marker=${lat}%2C${lng}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`)}`;

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
      <div className="relative aspect-[4/3] bg-sky-50 sm:aspect-[16/10]">
        {show ? (
          <iframe title={t.mapTitle} src={osm} className="absolute inset-0 h-full w-full" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            {/* Plan stylisé, sans appel externe */}
            <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="400" height="250" fill="#f2fafc" />
              <g stroke="#dbeef4" strokeWidth="14" fill="none" strokeLinecap="round">
                <path d="M-10 70 L410 40" /><path d="M-10 190 L410 165" /><path d="M120 -10 L150 260" /><path d="M290 -10 L305 260" />
              </g>
              <g stroke="#c6e6ef" strokeWidth="5" fill="none"><path d="M-10 125 L410 102" /><path d="M210 -10 L228 260" /></g>
            </svg>
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white"><Icon name="pin" className="h-7 w-7" /></span>
            <button type="button" onClick={() => { writeConsent({ maps: true }); setShow(true); }} className="btn-secondary relative">{t.map}</button>
            <p className="relative max-w-xs text-xs text-muted">{t.mapNote}</p>
          </div>
        )}
      </div>
      <a href={directions} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border-t border-line bg-white px-5 py-4 font-semibold text-navy hover:bg-sky-50">
        {t.directions} <Icon name="arrow" className="h-5 w-5" />
      </a>
    </div>
  );
}
