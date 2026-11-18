import { NextResponse, type NextRequest } from "next/server";

// French is the default locale and lives at the root (no prefix).
// English lives under /en. Internally every page is served from /[locale]/...
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/fr/, "") || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/fr${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|admin|images|icons|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|.*\\..*).*)"],
};
