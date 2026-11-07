import { cn } from "@/lib/utils/cn";

/**
 * Brand mark — brief §3.9, rebuilt from the official storefront logo supplied by the client:
 * a red roofline swoosh above a bold italic wordmark, « IDYA » in white and « AUTO » in red.
 * The swoosh is a vector tracing of the photo; the client's SVG file replaces the paths below.
 * Logo-sync (§3.2): `--red` is sampled from this logo, see docs/decisions.md.
 */
export function Swoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 44" className={className} aria-hidden fill="currentColor">
      <path d="M0 37C34 24 70 9 114 5c33-3 62 5 86 22l-3 3C173 16 146 10 115 11 73 13 38 27 3 40z" />
      <path d="M56 34c30-10 68-15 112-8l-2 3c-42-5-78-1-108 9z" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-start leading-none", className)}>
      <Swoosh className={cn("h-[9px] w-auto text-red", compact ? "w-[46px]" : "w-[84px]")} />
      <span className="mt-[3px] flex items-baseline gap-[0.16em] text-[17px] font-extrabold italic tracking-[-0.01em]">
        <span className="text-text">IDYA</span>
        {/* red-text, not --red: the logo red is 4.2:1 on --bg and the wordmark is 17 px (brief §3.2) */}
        {compact ? <span className="sr-only">Auto</span> : <span className="text-red-text">AUTO</span>}
      </span>
    </span>
  );
}
