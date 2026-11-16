import type { ReactNode } from "react";
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
      <Header lang={lang} routeKey={routeKey} overlay={overlayHeader} />
      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>
      <Footer lang={lang} />
      <Clara lang={lang} />
      <CookieBanner lang={lang} />
      <Reveal />
    </>
  );
}
