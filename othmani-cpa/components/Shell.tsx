import type { ReactNode } from "react";
import { dict } from "@/content/ui";
import type { RouteKey } from "@/lib/routes";
import type { Lang } from "@/lib/site";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { Clara } from "./Clara";
import { Reveal } from "./Reveal";

export function Shell({ lang, routeKey, children, overlayHeader = false }: { lang: Lang; routeKey: RouteKey; children: ReactNode; overlayHeader?: boolean }) {
  return (
    <>
      <a href="#contenu" className="sr-only z-[70] rounded-full bg-navy px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        {dict(lang).skip}
      </a>
      <Header lang={lang} routeKey={routeKey} overlay={overlayHeader} />
      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>
      <Footer lang={lang} />
      <Clara lang={lang} />
      <CookieBanner lang={lang} />
      <Reveal />
    </>
  );
}
