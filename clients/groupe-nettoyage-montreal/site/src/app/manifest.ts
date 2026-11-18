import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Groupe Nettoyage Montréal", short_name: "GNM", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#0b2341", lang: "fr-CA", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
