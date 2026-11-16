import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, routes, type RouteKey } from "@/lib/routes";
import { portalHref, portalOn, type Lang } from "@/lib/site";
import { LogoMark } from "./Logo";
import { Icon } from "./Icon";
import { CloseOnNav } from "./CloseOnNav";
import { HeaderScroll } from "./HeaderScroll";

/**
 * En-tête inspiré des sites Apple : une seule barre fine (52 px), vitrée,
 * petits liens centrés, sous-menus en panneau pleine largeur.
 */
export function Header({ lang, routeKey }: { lang: Lang; routeKey: RouteKey; overlay?: boolean }) {
  const t = dict(lang);
  const other: Lang = lang === "fr" ? "en" : "fr";
  const links: [RouteKey, string][] = [
    ["individuals", t.nav.individuals],
    ["businesses", t.nav.businesses],
    ["calendar", t.nav.calendar],
    ["tools", t.nav.tools],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  const isCurrent = (k: RouteKey) => k === routeKey;

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="relative">
        {/* Calque vitré séparé : un backdrop-filter sur le parent casserait le menu mobile en position fixe */}
        <div className="header-glass absolute inset-0 -z-10 border-b border-black/[0.06] bg-white/75 backdrop-blur-2xl backdrop-saturate-[1.8]" aria-hidden="true" />
        <div className="container-site flex h-[3.25rem] items-center justify-between gap-6">
          <Link href={href("home", lang)} aria-label={lang === "fr" ? "Othmani CPA, accueil" : "Othmani CPA, home"} className="flex shrink-0 items-center gap-2 rounded-lg">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-[0.95rem] font-semibold tracking-tight text-navy">Othmani CPA</span>
          </Link>

          <nav aria-label={t.nav.mainNav} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map(([k, label]) => {
                const sub = k === "individuals" || k === "businesses" ? concernsFor(k) : null;
                return (
                  <li key={k} className="group">
                    <Link
                      href={href(k, lang)}
                      aria-current={isCurrent(k) ? "page" : undefined}
                      className={`flex h-[3.25rem] items-center px-3 text-[0.8rem] tracking-[0.01em] transition-colors ${
                        isCurrent(k) ? "font-semibold text-navy" : "text-ink/75 hover:text-ink"
                      }`}
                    >
                      {label}
                    </Link>
                    {sub && (
                      /* Panneau pleine largeur, comme sur apple.com : visible au survol et au focus clavier */
                      <div className="invisible absolute inset-x-0 top-full opacity-0 transition-[opacity,visibility] delay-100 duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                        <div className="border-b border-black/[0.06] bg-[#fbfcfe] shadow-[0_30px_60px_-40px_rgba(23,23,58,.35)]">
                          <div className="container-site grid gap-10 py-10 md:grid-cols-[14rem_1fr]">
                            <div>
                              <p className="text-xs font-medium text-muted">{k === "individuals" ? t.doors.me : t.doors.business}</p>
                              <Link href={href(k, lang)} className="mt-2 block font-display text-2xl font-semibold text-navy hover:underline underline-offset-4">
                                {label}
                              </Link>
                            </div>
                            <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                              {sub.map((c) => (
                                <li key={c.key}>
                                  <Link href={href(c.key, lang)} className="group/item block">
                                    <span className="flex items-center gap-2 font-display text-lg font-semibold text-ink group-hover/item:text-navy">
                                      {c[lang].label}
                                      <Icon name="arrow" className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                                    </span>
                                    <span className="mt-1 block max-w-sm text-sm leading-snug text-muted">{c[lang].teaser}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <a
              href={routes[routeKey][other]}
              hrefLang={other === "fr" ? "fr-CA" : "en-CA"}
              lang={other}
              aria-label={t.nav.langSwitchLabel}
              className="hidden h-8 items-center rounded-full px-2.5 text-[0.8rem] text-ink/75 hover:text-ink sm:inline-flex"
            >
              {other === "fr" ? "FR" : "EN"}
            </a>
            <Link href={href("contact", lang)} className="hidden h-8 items-center rounded-full bg-navy px-4 text-[0.8rem] font-medium text-white transition-colors hover:bg-navy-700 sm:inline-flex">
              {t.cta.talk}
            </Link>

            {/* Menu mobile plein écran : fonctionne sans JavaScript (<details>) et au clavier */}
            <details id="mobile-menu" className="group lg:hidden">
              <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink" aria-label={t.nav.menu}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path className="origin-center transition-transform group-open:translate-y-[3px] group-open:rotate-45" d="M5 9h14" />
                  <path className="origin-center transition-transform group-open:-translate-y-[3px] group-open:-rotate-45" d="M5 15h14" />
                </svg>
              </summary>
              <div className="fixed inset-x-0 top-[3.25rem] bottom-0 z-50 overflow-y-auto bg-white/95 backdrop-blur-2xl">
                <nav aria-label={t.nav.mainNav} className="container-site py-6">
                  <ul>
                    {links.map(([k, label]) => (
                      <li key={k}>
                        <Link href={href(k, lang)} aria-current={isCurrent(k) ? "page" : undefined} className="block py-2.5 font-display text-[1.75rem] font-semibold tracking-tight text-ink hover:text-navy">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 grid gap-3 border-t border-line pt-6">
                    <Link href={href("contact", lang)} className="btn-primary w-full">{t.cta.talk}</Link>
                    {portalOn() && <a href={portalHref(lang)} className="btn-secondary w-full">{t.cta.portal}</a>}
                    <a href={routes[routeKey][other]} hrefLang={other === "fr" ? "fr-CA" : "en-CA"} lang={other} className="py-2 text-center text-sm font-medium text-navy">
                      {t.nav.langSwitch}
                    </a>
                  </div>
                </nav>
              </div>
            </details>
            <CloseOnNav targetId="mobile-menu" />
            <HeaderScroll />
          </div>
        </div>
      </div>
    </header>
  );
}
