import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { abs } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return Object.entries(routes).flatMap(([key, r]) =>
    (["fr", "en"] as const).map((lang) => ({
      url: abs(r[lang]),
      lastModified: now,
      changeFrequency: key === "calendar" ? ("monthly" as const) : ("yearly" as const),
      priority: key === "home" ? 1 : key === "privacy" ? 0.3 : 0.8,
      alternates: { languages: { "fr-CA": abs(r.fr), "en-CA": abs(r.en), "x-default": abs(r.fr) } },
    })),
  );
}
