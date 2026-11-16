import Link from "next/link";
import { concernsFor } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, routes, type RouteKey } from "@/lib/routes";
import { portalHref, portalOn, type Lang } from "@/lib/site";
import { LogoMark } from "./Logo";
import { Icon } from "./Icon";
import { CloseOnNav } from "./CloseOnNav";
import { HeaderScroll } from "./HeaderScroll";
import { NavBar, type NavItem } from "./NavBar";
import { toolsText } from "@/content/tools";

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
  const fr = lang === "fr";
  const tt = toolsText[lang];
  const concernItems = (aud: "individuals" | "businesses") =>
    concernsFor(aud).map((c) => ({ href: href(c.key, lang), label: c[lang].label, text: c[lang].teaser, icon: c.icon }));
  const fly: Partial<Record<RouteKey, NavItem["fly"]>> = {
    individuals: {
      kicker: t.doors.me,
      title: t.nav.individuals,
      text: fr ? "Impôts, lettres de l'impôt, travail autonome, grands changements de vie : des réponses claires, puis un CPA pour s'en occuper." : "Taxes, letters from the tax authorities, self-employment, big life changes: clear answers, then a CPA to handle it.",
      groups: [
        { title: fr ? "Vos préoccupations" : "Your concerns", items: concernItems("individuals") },
        { title: fr ? "Outils gratuits" : "Free tools", items: [
          { href: href("tools", lang) + "#documents", label: tt.checklist.h2, icon: "receipt" },
          { href: href("calendar", lang), label: t.nav.calendar, icon: "calendar" },
        ] },
      ],
      cta: { href: href("individuals", lang), label: fr ? "Tout pour les particuliers" : "Everything for individuals" },
    },
    businesses: {
      kicker: t.doors.business,
      title: t.nav.businesses,
      text: fr ? "Démarrage, taxes, états financiers, plusieurs sociétés : un CPA auditeur qui voit l'ensemble de votre situation." : "Start-up, sales tax, financial statements, multiple companies: a CPA auditor who sees your whole picture.",
      groups: [
        { title: fr ? "Vos préoccupations" : "Your concerns", items: concernItems("businesses") },
        { title: fr ? "Outils gratuits" : "Free tools", items: [
          { href: href("tools", lang) + "#calculatrice", label: tt.calc.h2, icon: "percent" },
          { href: href("tools", lang) + "#seuil", label: tt.threshold.h2, icon: "chart" },
        ] },
      ],
      cta: { href: href("businesses", lang), label: fr ? "Tout pour les entreprises" : "Everything for businesses" },
    },
    tools: {
      kicker: fr ? "Gratuit · Sans inscription" : "Free · No sign-up",
      title: t.nav.tools,
      text: tt.intro,
      groups: [{ title: fr ? "Nos outils" : "Our tools", items: [
        { href: href("tools", lang) + "#documents", label: tt.checklist.h2, text: tt.checklist.intro, icon: "receipt" },
        { href: href("tools", lang) + "#calculatrice", label: tt.calc.h2, text: tt.calc.intro, icon: "percent" },
        { href: href("tools", lang) + "#seuil", label: tt.threshold.h2, text: tt.threshold.intro, icon: "chart" },
        { href: href("calendar", lang), label: t.nav.calendar, text: fr ? "Les échéances des 12 prochains mois, à ajouter à votre agenda." : "Deadlines for the next 12 months, to add to your calendar.", icon: "calendar" },
      ] }],
    },
    about: {
      kicker: "Othmani CPA",
      title: t.nav.about,
      text: fr ? "Un cabinet de quartier à Saint-Léonard, dirigé par un CPA auditeur, membre de l'Ordre des CPA du Québec." : "A neighbourhood firm in Saint-Léonard, led by a CPA auditor, member of the Ordre des CPA du Québec.",
      groups: [{ title: fr ? "Le cabinet" : "The firm", items: [
        { href: href("about", lang), label: "Zouhaier Othmani", text: fr ? "CPA auditeur, fondateur" : "CPA auditor, founder", icon: "badge" },
        { href: href("about", lang) + "#equipe", label: fr ? "L'équipe" : "The team", text: fr ? "Les personnes derrière votre dossier" : "The people behind your file", icon: "user" },
        { href: href("contact", lang), label: t.nav.contact, text: fr ? "8065, boul. Viau, suite 204, Saint-Léonard" : "8065 Viau Blvd., Suite 204, Saint-Léonard", icon: "pin" },
        { href: href("privacy", lang), label: t.footer.privacy, text: fr ? "Vos renseignements et la Loi 25" : "Your information and Law 25", icon: "shield" },
      ] }],
    },
  };
  const navItems: NavItem[] = links.map(([k, label]) => ({ key: k, href: href(k, lang), label, current: isCurrent(k), fly: fly[k] }));

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

          <div className="hidden lg:block">
            <NavBar items={navItems} label={t.nav.mainNav} />
          </div>

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
