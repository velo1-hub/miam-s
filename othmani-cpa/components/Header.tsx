import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, routes, type RouteKey } from "@/lib/routes";
import { hasPhone, portalHref, portalOn, site, type Lang } from "@/lib/site";
import { LogoMark } from "./Logo";
import { Icon } from "./Icon";
import { CloseOnNav } from "./CloseOnNav";
import { HeaderScroll } from "./HeaderScroll";

/**
 * En-tête flottant :
 * - en haut de page : transparent, boutons ronds brillants ;
 * - au défilement : capsule vitrée détachée des bords (voir .hdr-shell dans globals.css) ;
 * - le menu ☰ ouvre un grand panneau vitré (fonctionne sans JavaScript grâce à <details>).
 */
export function Header({ lang, routeKey, overlay = false }: { lang: Lang; routeKey: RouteKey; overlay?: boolean }) {
  const t = dict(lang);
  const fr = lang === "fr";
  const other: Lang = fr ? "en" : "fr";
  const links: [RouteKey, string][] = [
    ["individuals", t.nav.individuals],
    ["businesses", t.nav.businesses],
    ["calendar", t.nav.calendar],
    ["tools", t.nav.tools],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  const phone = hasPhone();

  return (
    <header data-dark-top={overlay ? "" : undefined} className="site-header fixed inset-x-0 top-0 z-40">
      <div className="hdr-shell">
        <div className="relative flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href={href("home", lang)} aria-label={fr ? "Othmani CPA Inc., société de comptable professionnel agréé : accueil" : "Othmani CPA Inc., société de comptable professionnel agréé: home"} className="flex shrink-0 items-center gap-2.5 rounded-xl">
            <LogoMark className="hdr-ink h-9 w-auto transition-colors sm:h-10" />
            <span className="flex flex-col leading-none">
              <span className="hdr-ink font-display text-[1.05rem] font-bold tracking-tight whitespace-nowrap text-navy transition-colors sm:text-[1.2rem]">Othmani CPA <span className="text-[0.65rem] font-medium">Inc.</span></span>
              <span className="hdr-ink-soft mt-1 text-[0.62rem] font-medium tracking-wide whitespace-nowrap text-ink/70 transition-colors hdr-tag">Société de comptable professionnel agréé</span>
            </span>
          </Link>

          {/* Liens principaux (grand écran) */}
          <nav aria-label={t.nav.mainNav} className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {links.map(([k, label]) => (
                <li key={k}>
                  <Link
                    href={href(k, lang)}
                    aria-current={k === routeKey ? "page" : undefined}
                    className="hdr-link hdr-ink relative rounded-full px-3 py-2 text-[0.92rem] font-medium whitespace-nowrap text-ink/80 transition-colors hover:text-navy aria-[current=page]:text-navy"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* Langue */}
            <a
              href={routes[routeKey][other]}
              hrefLang={other === "fr" ? "fr-CA" : "en-CA"}
              lang={other}
              aria-label={`${other === "fr" ? "FR" : "EN"} : ${t.nav.langSwitchLabel}`}
              className="gbtn h-11 w-11 text-[0.9rem] font-semibold sm:h-12 sm:w-12"
            >
              {other === "fr" ? "FR" : "EN"}
            </a>

            {/* Pastille d'appel (ou de contact tant que le numéro n'est pas configuré) */}
            {phone ? (
              <a href={`tel:${site.phone.tel}`} className="gbtn phone-pill h-11 px-1 sm:h-12" aria-label={`${t.cta.call} ${site.phone.display}`}>
                <span className="ring-ico"><Icon name="phone" className="h-[1.1rem] w-[1.1rem]" /></span>
                <span className="hdr-num text-[0.95rem] font-semibold tracking-wide whitespace-nowrap">{site.phone.display}</span>
              </a>
            ) : (
              <Link href={href("contact", lang)} aria-label={t.cta.talk} className="gbtn phone-pill h-11 px-1 sm:h-12">
                <span className="ring-ico"><Icon name="chat" className="h-[1.05rem] w-[1.05rem]" /></span>
                <span className="hdr-num text-[0.95rem] font-semibold whitespace-nowrap">{t.cta.talk}</span>
                
              </Link>
            )}

            {/* Menu */}
            <details id="mobile-menu" className="group">
              <summary className="gbtn h-11 w-11 cursor-pointer sm:h-12 sm:w-12" aria-label={t.nav.menu}>
                <svg viewBox="0 0 24 24" className="h-[1.35rem] w-[1.35rem]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                  <path className="origin-center transition-transform duration-300 group-open:translate-y-[5px] group-open:rotate-45" d="M4.5 7h15" />
                  <path className="transition-opacity duration-200 group-open:opacity-0" d="M4.5 12h15" />
                  <path className="origin-center transition-transform duration-300 group-open:-translate-y-[5px] group-open:-rotate-45" d="M4.5 17h15" />
                </svg>
              </summary>

              {/* Voile flouté derrière le panneau (un clic le referme) */}
              <div data-close-menu className="fixed inset-0 -z-10 bg-navy-950/25 backdrop-blur-sm" aria-hidden="true" />

              <div className="menu-panel fixed inset-x-3 top-[5.6rem] bottom-3 overflow-y-auto rounded-[1.75rem] sm:right-[max(0.75rem,calc((100vw-76rem)/2))] sm:bottom-auto sm:left-[max(0.75rem,calc((100vw-76rem)/2))] sm:max-h-[calc(100svh-7rem)]">
                <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
                  <nav aria-label={t.nav.mainNav}>
                    <ul className="space-y-0.5">
                      {links.map(([k, label], i) => (
                        <li key={k} className="nav-in" style={{ ["--i" as string]: i }}>
                          <Link href={href(k, lang)} aria-current={k === routeKey ? "page" : undefined} className="group/l flex items-center justify-between rounded-2xl px-3 py-2.5 font-display text-[1.6rem] font-semibold tracking-tight text-ink transition-colors hover:bg-white/70 hover:text-navy aria-[current=page]:text-navy">
                            {label}
                            <Icon name="arrow" className="h-5 w-5 -translate-x-2 opacity-0 transition-all group-hover/l:translate-x-0 group-hover/l:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  {(["individuals", "businesses"] as const).map((aud, gi) => (
                    <div key={aud} className="nav-in" style={{ ["--i" as string]: gi + 3 }}>
                      <p className="mb-3 px-3 text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{aud === "individuals" ? t.doors.me : t.doors.business}</p>
                      <ul className="space-y-1">
                        {concernsFor(aud).map((c) => (
                          <li key={c.key}>
                            <Link href={href(c.key, lang)} className="flex gap-3 rounded-2xl p-3 transition-colors hover:bg-white/70">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Icon name={c.icon} className="h-[1.05rem] w-[1.05rem]" /></span>
                              <span>
                                <span className="block font-display font-semibold text-ink">{c[lang].label}</span>
                                <span className="mt-0.5 block text-sm leading-snug text-muted">{c[lang].teaser}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="nav-in flex flex-col gap-4 border-t border-white/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9" style={{ ["--i" as string]: 6 }}>
                  <p className="flex items-center gap-2 text-sm text-ink/80">
                    <Icon name="pin" className="h-4 w-4 shrink-0 text-navy" />
                    {fr ? site.address.street : site.address.streetEn}, {site.address.city} ({site.address.region}) {site.address.postalCode}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {portalOn() && <a href={portalHref(lang)} className="btn-secondary min-h-11">{t.cta.portal}</a>}
                    <Link href={href("contact", lang)} className="btn-primary min-h-11">{t.cta.talk} <Icon name="arrow" className="h-4 w-4" /></Link>
                  </div>
                </div>
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
