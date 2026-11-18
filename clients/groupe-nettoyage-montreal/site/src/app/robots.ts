import type { MetadataRoute } from "next";
import { BIZ } from "@/content/business";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }], sitemap: `${BIZ.url}/sitemap.xml`, host: BIZ.url };
}
