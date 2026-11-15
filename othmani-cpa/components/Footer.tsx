import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, type RouteKey } from "@/lib/routes";
import { site, type Lang } from "@/lib/site";
import { Logo } from "./Logo";
import { AddressLines, EmailLink, PhoneLink } from "./ContactInfo";
import { CookieSettingsButton } from "./CookieBanner";

export function Footer({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const firm: [RouteKey, string][] = [
    ["individuals", t.nav.individuals],
    ["businesses", t.nav.businesses],
    ["calendar", t.nav.calendar],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  const linkCls = "text-white/85 hover:text-white hover:underline underline-offset-4";
  return (
    <footer className="on-dark bg-navy-950 text-white">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">{t.footer.tagline}</p>
          <address className="mt-6 space-y-2 text-sm leading-relaxed not-italic text-white/85">
            <p><AddressLines lang={lang} /></p>
            <p><PhoneLink lang={lang} className={linkCls} /></p>
            <p><EmailLink lang={lang} className={linkCls} /></p>
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
      <div className="border-t border-white/10">
        <div className="container-site space-y-3 py-6 text-sm text-white/75">
          <p>{t.footer.served}</p>
          <p>{t.footer.order} · {t.footer.public}</p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {site.name} {t.footer.rights}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href={href("privacy", lang)} className={linkCls}>{t.footer.privacy}</Link>
              <CookieSettingsButton label={t.footer.cookies} className={`${linkCls} cursor-pointer`} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
