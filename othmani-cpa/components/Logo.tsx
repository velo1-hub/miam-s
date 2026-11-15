export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="#2a2a5c" />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M14 27.5L27.5 14" stroke="#6fc1d8" strokeWidth="3" strokeLinecap="round" />
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
