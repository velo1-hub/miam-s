import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sur Vercel : pages statiques régénérées toutes les heures (actualités). `NEXT_EXPORT=1` produit un export 100 % statique dans out/.
  ...(process.env.NEXT_EXPORT === "1" ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { globalNotFound: true },
};

export default nextConfig;
