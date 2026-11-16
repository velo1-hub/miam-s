/** Monogramme : un « C » ouvert (CPA) et un crochet bleu ciel (« c'est réglé »). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34347a" />
          <stop offset="1" stopColor="#1d1d48" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm-g)" />
      <path d="M27.8 13.2A10 10 0 1 0 27.8 26.8" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M16 20.4l3.2 3.2 7.6-8" fill="none" stroke="#6fc1d8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.15rem] font-semibold tracking-tight ${light ? "text-white" : "text-navy"}`}>Othmani CPA</span>
        <span className={`mt-1 text-[0.7rem] font-medium tracking-[0.12em] uppercase ${light ? "text-white/80" : "text-muted"}`}>Saint-Léonard</span>
      </span>
    </span>
  );
}
