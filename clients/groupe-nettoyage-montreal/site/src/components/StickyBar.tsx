"use client";
import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";
import { I } from "./Icons";
export function StickyBar({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-3 gap-2 px-3 py-2">
        <a href={`tel:${BIZ.phone}`} className="btn btn-ghost whitespace-nowrap !px-2 text-[12.5px]"><I.phone width={18} height={18} />{d.nav.call}</a>
        <a href={`sms:${BIZ.phone}`} className="btn btn-ghost whitespace-nowrap !px-2 text-[12.5px]"><I.chat width={18} height={18} />{d.nav.text}</a>
        <Link href={pagePath(locale, "book")} className="btn btn-primary whitespace-nowrap !px-2 text-[12.5px]">{d.nav.book}</Link>
      </div>
    </div>
  );
}
