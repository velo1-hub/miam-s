import { SERVICES } from "@/content/services";
import { ZONES } from "@/content/zones";
import { POSTS } from "@/content/posts";
import { pageSlugs, href, type Locale, type PageKey } from "./config";

/** Given the current public pathname, return the equivalent path in the other locale. */
export function altPath(pathname: string, to: Locale): string {
  const from: Locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
  if (from === to) return pathname;
  const rel = from === "en" ? pathname.replace(/^\/en/, "") || "/" : pathname;
  const parts = rel.split("/").filter(Boolean);
  if (parts.length === 0) return href(to, "/");
  const key = (Object.keys(pageSlugs) as PageKey[]).find((k) => pageSlugs[k][from] === parts[0]);
  if (!key) return href(to, "/");
  const first = pageSlugs[key][to];
  if (parts.length === 1) return href(to, `/${first}`);
  const sub = parts[1];
  const table = key === "services" ? SERVICES : key === "zones" ? ZONES : key === "blog" ? POSTS : null;
  const hit = table?.find((x) => x.slug[from] === sub);
  return href(to, `/${first}/${hit ? hit.slug[to] : sub}`);
}
