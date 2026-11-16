import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages statiques (accueil régénéré toutes les heures pour les actualités) + routes /api (formulaires, Clara).
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { globalNotFound: true },
};

export default nextConfig;
