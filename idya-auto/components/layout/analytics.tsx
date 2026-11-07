import Script from "next/script";
import { env } from "@/lib/env";

/** Plausible — cookieless, loaded only when PLAUSIBLE_DOMAIN is set (brief §2, §21). */
export function Analytics() {
  if (!env.plausibleDomain) return null;
  return <Script defer data-domain={env.plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
}
