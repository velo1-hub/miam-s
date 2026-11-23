import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages statiques (accueil régénéré toutes les heures pour les actualités) + routes /api (formulaires, Clara).
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  async headers() {
    const sb = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${sb ? ` ${sb} ${sb.replace(/^https/, "wss")}` : ""}`,
      "frame-src https://www.openstreetmap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "manifest-src 'self'",
      "worker-src 'self'",
    ].join("; ");
    const base = [
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: csp },
    ];
    const priv = [{ key: "Cache-Control", value: "no-store" }];
    return [
      { source: "/(.*)", headers: base },
      { source: "/gestion/:path*", headers: priv },
      { source: "/espace-client/:path*", headers: priv },
      { source: "/en/client-portal/:path*", headers: priv },
      { source: "/api/:path*", headers: priv },
    ];
  },
};

export default nextConfig;
