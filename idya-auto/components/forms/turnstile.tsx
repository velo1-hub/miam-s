"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { env } from "@/lib/env";

/** Invisible Cloudflare Turnstile — renders nothing when no site key is configured (demo). */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  if (!env.turnstileSiteKey) return null;
  return <TurnstileWidget siteKey={env.turnstileSiteKey} options={{ size: "invisible" }} onSuccess={onToken} onExpire={() => onToken("")} />;
}

/** Honeypot: hidden field that must stay empty (brief §13). */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
