import Link from "next/link";
import { dict } from "@/content/ui";
import { href, routes, type RouteKey } from "@/lib/routes";
import { portalHref, type Lang } from "@/lib/site";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { CloseOnNav } from "./CloseOnNav";

export function Header({ lang, routeKey, overlay = false }: { lang: Lang; routeKey: RouteKey; overlay?: boolean }) {
  const t = dict(lang);
  const other: Lang = lang === "fr" ? "en" : "fr";
  const links: [RouteKey, string][] = [
    ["individuals", t.nav.individuals],
    ["businesses", t.nav.businesses],
    ["calendar", t.nav.calendar],
    ["about", t.nav.about],
    ["contact", t.nav.contact],
  ];
  const isCurrent = (k: RouteKey) => k === routeKey;

  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md"}>
      <div className={`container-site flex h-20 items-center justify-between gap-4 ${overlay ? "on-dark" : ""}`}>
        <Link href={href("home", lang)} aria-label={lang === "fr" ? "Othmani CPA, accueil" : "Othmani CPA, home"} className="shrink-0 rounded-lg">
          <Logo light={overlay} />
        </Link>

        <nav aria-label={t.nav.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map(([k, label]) => (
              <li key={k}>
                <Link
                  href={href(k, lang)}
                  aria-current={isCurrent(k) ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors ${
                    overlay ? "text-white hover:bg-white/10" : "text-ink hover:bg-sky-50 hover:text-navy"
                  } ${isCurrent(k) ? (overlay ? "bg-white/15" : "bg-sky-50 text-navy") : ""}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={routes[routeKey][other]}
            hrefLang={other === "fr" ? "fr-CA" : "en-CA"}
            lang={other}
            aria-label={t.nav.langSwitchLabel}
            className={`hidden rounded-full px-3 py-2 text-sm font-semibold sm:inline-flex ${overlay ? "text-white hover:bg-white/10" : "text-navy hover:bg-sky-50"}`}
          >
            {other === "fr" ? "FR" : "EN"}
          </a>
          <Link href={href("contact", lang)} className={`${overlay ? "btn-light" : "btn-primary"} hidden min-h-11 px-5 sm:inline-flex`}>
            {t.cta.talk}
          </Link>

          {/* Menu mobile : fonctionne sans JavaScript (<details>) et au clavier */}
          <details id="mobile-menu" className="group relative lg:hidden">
            <summary
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border ${
                overlay ? "border-white/50 text-white" : "border-line text-navy"
              }`}
              aria-label={t.nav.menu}
            >
              <span className="group-open:hidden"><Icon name="menu" /></span>
              <span className="hidden group-open:inline"><Icon name="close" /></span>
            </summary>
            <div className="fixed inset-x-3 top-[5.25rem] z-50 rounded-3xl border border-line bg-white p-4 shadow-[0_18px_50px_-20px_rgba(42,42,92,.35)]">
              <nav aria-label={t.nav.mainNav}>
                <ul className="flex flex-col">
                  {links.map(([k, label]) => (
                    <li key={k}>
                      <Link href={href(k, lang)} aria-current={isCurrent(k) ? "page" : undefined} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-medium text-ink hover:bg-sky-50">
                        {label}
                        <Icon name="arrow" className="h-5 w-5 text-navy/50" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a href={routes[routeKey][other]} hrefLang={other === "fr" ? "fr-CA" : "en-CA"} lang={other} className="flex rounded-2xl px-4 py-3.5 text-lg font-medium text-navy hover:bg-sky-50">
                      {t.nav.langSwitch}
                    </a>
                  </li>
                </ul>
              </nav>
              <div className="mt-3 grid gap-2 border-t border-line pt-4">
                <Link href={href("contact", lang)} className="btn-primary w-full">{t.cta.talk}</Link>
                <a href={portalHref(lang)} className="btn-secondary w-full">{t.cta.portal}</a>
              </div>
            </div>
          </details>
          <CloseOnNav targetId="mobile-menu" />
        </div>
      </div>
    </header>
  );
}
