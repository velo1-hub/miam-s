/** Typed access to environment flags. Server-only values must never be read in client code. */
export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  demoMode: process.env.DEMO_MODE !== "false", // demo is the default until the real backend is wired
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasSupabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  hasAnthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  hasResend: Boolean(process.env.RESEND_API_KEY),
  hasTurnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  plausibleDomain: process.env.PLAUSIBLE_DOMAIN,
  aiDailyBudgetUsd: Number(process.env.AI_DAILY_BUDGET_USD ?? "15"),
  mapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
} as const;
