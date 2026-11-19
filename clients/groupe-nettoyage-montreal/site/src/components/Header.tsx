"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";
import { I } from "./Icons";
import { Logo } from "./Logo";
import { altPath } from "@/i18n/alt";

/** Floating glass pill header (dark over the hero, light once scrolled), like the reference site. */
export function Header({ locale }: { locale: Locale }) {
  const d = t(locale); const [open, setOpen] = useState(false); const [scrolled, setScrolled] = useState(false); const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/en";
  useEffect(() => { const on = () => setScrolled(window.scrollY > 40); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  const dark = isHome && !scrolled;
  const nav = [
    { label: d.nav.services, href: pagePath(locale, "services") }, { label: d.nav.pricing, href: pagePath(locale, "pricing") }, { label: d.nav.work, href: pagePath(locale, "work"), xl: true },
    { label: d.nav.zones, href: pagePath(locale, "zones") }, { label: d.nav.method, href: pagePath(locale, "method"), xl: true }, { label: d.nav.about, href: pagePath(locale, "about") }, { label: d.nav.contact, href: pagePath(locale, "contact") },
  ];
  const other: Locale = locale === "fr" ? "en" : "fr";
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className={`mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-3 rounded-full px-3 pl-4 transition-colors duration-300 sm:h-16 sm:px-4 sm:pl-5 ${dark ? "glass text-white" : "glass-light text-navy-950 shadow-soft"}`}>
        <Link href={locale === "fr" ? "/" : "/en"} className="flex min-w-0 items-center gap-2.5" aria-label={BIZ.name}><Logo light={dark} size={38} /><span className="font-display text-[12.5px] font-semibold leading-[1.15] tracking-tight sm:text-[15px] sm:leading-none"><span className="block whitespace-nowrap sm:inline">Groupe Nettoyage</span> <span className="block whitespace-nowrap text-amber-500 sm:inline">Montréal</span></span></Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principale">
          {nav.map((n) => <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[13.5px] font-medium transition-colors ${n.xl ? "hidden xl:block" : ""} ${dark ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-ink-700 hover:bg-navy-900/5"} ${pathname === n.href ? "font-semibold" : ""}`}>{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={altPath(pathname, other)} hrefLang={other === "fr" ? "fr-CA" : "en-CA"} className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold ${dark ? "bg-white/10 hover:bg-white/20" : "bg-navy-900/5 hover:bg-navy-900/10"}`} aria-label={other === "fr" ? "Version française" : "English version"}>{other.toUpperCase()}</Link>
          <a href={`tel:${BIZ.phone}`} className={`hidden items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13.5px] font-semibold md:flex ${dark ? "border-amber-400/60 text-white hover:bg-white/10" : "border-line text-navy-950 hover:border-navy-900"}`}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-navy-950"><I.phone width={13} height={13} strokeWidth={2.2} /></span>{BIZ.phoneDisplay}</a>
          <Link href={pagePath(locale, "quote")} className="btn btn-primary hidden !min-h-10 whitespace-nowrap !px-4 !py-2 !text-[14px] sm:inline-flex">{locale === "fr" ? "Soumission" : "Get a quote"}</Link>
          <button className={`flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${dark ? "bg-white/10" : "bg-navy-900/5"}`} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <I.x width={20} height={20} /> : <I.menu width={20} height={20} />}</button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="glass-light mx-auto mt-2 max-w-7xl rounded-3xl p-3 text-navy-950 shadow-lift lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {nav.map((n) => <Link key={n.href} href={n.href} className="rounded-2xl px-4 py-3 text-[16px] font-medium hover:bg-navy-900/5">{n.label}</Link>)}
            <Link href={pagePath(locale, "careers")} className="rounded-2xl px-4 py-3 text-[16px] font-medium hover:bg-navy-900/5">{d.nav.careers}</Link>
            <div className="mt-2 flex gap-2 p-1"><Link href={pagePath(locale, "quote")} className="btn btn-primary flex-1">{d.nav.quote}</Link><a href={`tel:${BIZ.phone}`} className="btn btn-ghost flex-1"><I.phone width={18} height={18} />{d.nav.call}</a></div>
          </nav>
        </div>
      )}
    </header>
  );
}
