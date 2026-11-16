import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, type RouteKey } from "@/lib/routes";
import { hasEmail, hasPhone, portalHref, portalOn, site, type Lang } from "@/lib/site";
import { Logo } from "./Logo";
import { AddressLines, EmailLink, PhoneLink } from "./ContactInfo";
import { CookieSettingsButton } from "./CookieBanner";

export function Footer({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const fr = lang === "fr";
  const firm: [RouteKey, string][] = [
    ["individuals", t.nav.individuals],
    ["businesses", t.nav.businesses],
    ["calendar", t.nav.calendar],
    ["tools", t.nav.tools],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  const linkCls = "text-white/85 hover:text-white hover:underline underline-offset-4";
  return (
    <footer className="on-dark mesh-dark relative overflow-hidden text-white">
      <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-sky/20 blur-3xl" aria-hidden="true" />
      <div className="container-site relative pt-16">
        <div className="glass-dark flex flex-col gap-6 rounded-[1.75rem] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="font-display text-2xl font-semibold text-white">{t.pro.footerCtaTitle}</p>
            <p className="mt-1 text-white/80">{t.pro.footerCtaText}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={href("contact", lang)} className="btn-light">{t.cta.talk}</Link>
            {portalOn() && <a href={portalHref(lang)} className="btn-ghost-light">{t.cta.portal}</a>}
          </div>
        </div>
      </div>
      <div className="container-site relative grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">{t.footer.tagline}</p>
          <address className="mt-6 space-y-2 text-sm leading-relaxed not-italic text-white/85">
            <p><AddressLines lang={lang} /></p>
            {hasPhone() && <p><PhoneLink lang={lang} className={linkCls} /></p>}
            {hasEmail() && <p><EmailLink lang={lang} className={linkCls} /></p>}
          </address>
        </div>
        <nav aria-label={t.footer.nav} className="md:col-span-2">
          <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-sky uppercase">{t.footer.nav}</h2>
          <ul className="space-y-2.5 text-sm">
            {firm.map(([k, l]) => (<li key={k}><Link href={href(k, lang)} className={linkCls}>{l}</Link></li>))}
          </ul>
        </nav>
        <nav aria-label={t.footer.concernsMe} className="md:col-span-3">
          <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-sky uppercase">{t.footer.concernsMe}</h2>
          <ul className="space-y-2.5 text-sm">
            {concernsFor("individuals").map((c) => (<li key={c.key}><Link href={href(c.key, lang)} className={linkCls}>{c[lang].label}</Link></li>))}
          </ul>
        </nav>
        <nav aria-label={t.footer.concernsBiz} className="md:col-span-3">
          <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-sky uppercase">{t.footer.concernsBiz}</h2>
          <ul className="space-y-2.5 text-sm">
            {concernsFor("businesses").map((c) => (<li key={c.key}><Link href={href(c.key, lang)} className={linkCls}>{c[lang].label}</Link></li>))}
          </ul>
        </nav>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-site grid gap-8 py-10 text-sm text-white/75 md:grid-cols-3">
          <div>
            <p className="mb-2 font-display text-xs font-semibold tracking-[0.14em] text-sky uppercase">{fr ? "Heures" : "Hours"}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {site.hoursLabel[lang].map(([d, h]) => (<div key={d} className="contents"><dt>{d}</dt><dd className="text-white/90">{h}</dd></div>))}
            </dl>
          </div>
          <div>
            <p className="mb-2 font-display text-xs font-semibold tracking-[0.14em] text-sky uppercase">{fr ? "Secteurs desservis" : "Areas served"}</p>
            <p className="leading-relaxed">{t.footer.served}</p>
          </div>
          <div>
            <p className="mb-2 font-display text-xs font-semibold tracking-[0.14em] text-sky uppercase">{fr ? "Encadrement professionnel" : "Professional oversight"}</p>
            <p className="leading-relaxed">
              {fr
                ? "Zouhaier Othmani est CPA auditeur, membre de l'Ordre des comptables professionnels agréés du Québec et soumis à son code de déontologie. "
                : "Zouhaier Othmani is a CPA auditor, a member of the Ordre des comptables professionnels agréés du Québec and bound by its code of ethics. "}
              {t.footer.public}
            </p>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-site space-y-4 py-6 text-[0.8rem] leading-relaxed text-white/65">
          <p>
            {fr
              ? "Les renseignements publiés sur ce site sont fournis à titre d'information générale. Ils ne constituent pas un avis comptable, fiscal ou juridique et ne remplacent pas une consultation adaptée à votre situation. Les règles fiscales changent : vérifiez avec un professionnel avant de prendre une décision."
              : "The information on this site is provided for general information purposes. It does not constitute accounting, tax or legal advice and does not replace advice tailored to your situation. Tax rules change: check with a professional before making a decision."}
          </p>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {site.name} {t.footer.rights}{" "}
              {fr ? "Les textes, images et outils de ce site sont protégés par le droit d'auteur ; toute reproduction sans autorisation écrite est interdite." : "The text, images and tools on this site are protected by copyright; any reproduction without written permission is prohibited."}
            </p>
            <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-2">
              <Link href={href("privacy", lang)} className={linkCls}>{t.footer.privacy}</Link>
              <CookieSettingsButton label={t.footer.cookies} className={`${linkCls} cursor-pointer`} />
              <a href="/sitemap.xml" className={linkCls}>{fr ? "Plan du site" : "Sitemap"}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
