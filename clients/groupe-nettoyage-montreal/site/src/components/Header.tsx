"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";
import { I } from "./Icons";
import { Logo } from "./Logo";
import { altPath } from "@/i18n/alt";

export function Header({ locale }: { locale: Locale }) {
  const d = t(locale); const [open, setOpen] = useState(false); const pathname = usePathname();
  const nav = [
    { label: d.nav.services, href: pagePath(locale, "services") },
    { label: d.nav.pricing, href: pagePath(locale, "pricing") },
    { label: d.nav.zones, href: pagePath(locale, "zones") },
    { label: d.nav.method, href: pagePath(locale, "method") },
    { label: d.nav.about, href: pagePath(locale, "about") },
    { label: d.nav.blog, href: pagePath(locale, "blog") },
  ];
  const other: Locale = locale === "fr" ? "en" : "fr";
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href={locale === "fr" ? "/" : "/en"} className="flex items-center gap-2.5" aria-label={BIZ.name}><Logo /><span className="hidden text-[15px] font-semibold tracking-tight text-navy-950 sm:block">Groupe Nettoyage <span className="text-amber-600">Montréal</span></span></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principale">
          {nav.map((n) => <Link key={n.href} href={n.href} className={`rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors hover:bg-sand-100 ${pathname === n.href ? "text-navy-950" : "text-ink-600"}`}>{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${BIZ.phone}`} className="hidden items-center gap-2 rounded-full px-3 py-2 text-[14px] font-semibold text-navy-900 hover:bg-sand-100 md:flex"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a>
          <Link href={altPath(pathname, other)} hrefLang={other === "fr" ? "fr-CA" : "en-CA"} className="rounded-full border border-line px-3 py-2 text-[13px] font-semibold text-ink-600 hover:border-navy-900 hover:text-navy-900" aria-label={other === "fr" ? "Version française" : "English version"}>{other.toUpperCase()}</Link>
          <Link href={pagePath(locale, "quote")} className="btn btn-primary hidden !py-2.5 sm:inline-flex">{d.nav.quote}</Link>
          <button className="rounded-full p-2 text-navy-900 hover:bg-sand-100 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <I.x /> : <I.menu />}</button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white lg:hidden">
          <nav className="container-x flex flex-col py-3" aria-label="Mobile">
            {nav.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[16px] font-medium text-ink-700 hover:bg-sand-100">{n.label}</Link>)}
            <Link href={pagePath(locale, "contact")} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[16px] font-medium text-ink-700 hover:bg-sand-100">{d.nav.contact}</Link>
            <Link href={pagePath(locale, "careers")} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[16px] font-medium text-ink-700 hover:bg-sand-100">{d.nav.careers}</Link>
            <div className="mt-2 flex gap-2 px-3 pb-2"><Link href={pagePath(locale, "quote")} onClick={() => setOpen(false)} className="btn btn-primary flex-1">{d.nav.quote}</Link><a href={`tel:${BIZ.phone}`} className="btn btn-ghost flex-1"><I.phone width={18} height={18} />{d.nav.call}</a></div>
          </nav>
        </div>
      )}
    </header>
  );
}
