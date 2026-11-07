import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Next.js 16: proxy.ts replaces middleware.ts. Localized routing for the public site only. */
export default createMiddleware(routing);

export const config = {
  // Everything except admin, API, Next internals, dev gallery and static files.
  matcher: ["/((?!admin|api|dev|_next|_vercel|demo|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};
