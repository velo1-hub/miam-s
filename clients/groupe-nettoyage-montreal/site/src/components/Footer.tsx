import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";
import { SERVICES } from "@/content/services";
import { ZONES } from "@/content/zones";
import { Logo } from "./Logo";
import { I } from "./Icons";

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale); const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-navy-950 text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3"><Logo light /><span className="text-lg font-semibold">Groupe Nettoyage Montréal</span></div>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">{d.footer.tagline}</p>
          <ul className="mt-5 space-y-2 text-[14px] text-white/80">
            <li className="flex items-center gap-2"><I.shield width={18} height={18} className="text-amber-400" />{locale === "fr" ? "Assurés · employés déclarés CNESST" : "Insured · CNESST-registered employees"}</li>
            <li className="flex items-center gap-2"><I.leaf width={18} height={18} className="text-amber-400" />{locale === "fr" ? "Produits certifiés écologiques" : "Certified eco-friendly products"}</li>
            <li className="flex items-center gap-2"><I.camera width={18} height={18} className="text-amber-400" />{locale === "fr" ? "Rapport photo à chaque visite" : "Photo report every visit"}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50">{d.footer.services}</h3>
          <ul className="mt-4 space-y-2.5 text-[14px]">{SERVICES.map((s) => <li key={s.id}><Link className="text-white/85 hover:text-amber-400" href={pagePath(locale, "services", s.slug[locale])}>{s.name[locale]}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50">{d.footer.zones}</h3>
          <ul className="mt-4 space-y-2.5 text-[14px]">{ZONES.map((z) => <li key={z.id}><Link className="text-white/85 hover:text-amber-400" href={pagePath(locale, "zones", z.slug[locale])}>{z.name[locale]}</Link></li>)}</ul>
          <h3 className="mt-8 text-[13px] font-semibold uppercase tracking-wider text-white/50">{d.footer.company}</h3>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            {(["about", "method", "reviews", "work", "careers", "blog", "contact", "myBooking"] as const).map((k) => <li key={k}><Link className="text-white/85 hover:text-amber-400" href={pagePath(locale, k)}>{d.nav[k as keyof typeof d.nav]}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50">{d.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-[14px] text-white/85">
            <li><a className="flex items-center gap-2 hover:text-amber-400" href={`tel:${BIZ.phone}`}><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></li>
            <li><a className="flex items-center gap-2 hover:text-amber-400" href={`mailto:${BIZ.email}`}><I.mail width={18} height={18} />{BIZ.email}</a></li>
            <li className="flex items-start gap-2"><I.clock width={18} height={18} className="mt-0.5 shrink-0" />{d.common.hours}</li>
            <li className="flex items-start gap-2"><I.pin width={18} height={18} className="mt-0.5 shrink-0" />{d.common.serviceArea}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-[13px] text-white/60 md:flex-row md:items-center md:justify-between">
          <p>{d.footer.legal.replace("{year}", String(year))}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={pagePath(locale, "privacy")} className="hover:text-white">{d.footer.privacy}</Link>
            <Link href={pagePath(locale, "terms")} className="hover:text-white">{d.footer.terms}</Link>
            <Link href={pagePath(locale, "accessibility")} className="hover:text-white">{d.footer.accessibility}</Link>
            <Link href={locale === "fr" ? "/en" : "/"} className="hover:text-white" hrefLang={locale === "fr" ? "en-CA" : "fr-CA"}>{d.footer.lang}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
