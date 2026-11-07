import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Idya Auto",
    short_name: "Idya Auto",
    description: "Concessionnaire automobile · Québec",
    start_url: "/fr",
    display: "standalone",
    background_color: "#08080A",
    theme_color: "#08080A",
    lang: "fr-CA",
    icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }],
  };
}
