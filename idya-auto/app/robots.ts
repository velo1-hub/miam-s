import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** robots.txt — admin disallowed (brief §15); demo previews are not indexed at all (§17.7 / §28). */
export default function robots(): MetadataRoute.Robots {
  if (env.demoMode) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dev/"] }, sitemap: `${env.siteUrl}/sitemap.xml` };
}
