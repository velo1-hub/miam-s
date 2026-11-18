import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Pilote Fiscal : l'espace client s'installe comme une application (écran d'accueil du téléphone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pilote Fiscal · Othmani CPA",
    short_name: "Pilote Fiscal",
    description: "Suivez votre dossier, déposez vos documents et écrivez à votre cabinet comptable.",
    lang: "fr-CA",
    start_url: "/espace-client/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fb",
    theme_color: "#2a2a5c",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
