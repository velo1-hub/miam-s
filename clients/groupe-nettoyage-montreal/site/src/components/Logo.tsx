export function Logo({ size = 36, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={light ? "#ffffff" : "#0b2341"} />
      <path d="M13 26.5 21 34l14.5-16" fill="none" stroke={light ? "#0b2341" : "#e9a84c"} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="13" r="3" fill={light ? "#0b2341" : "#e9a84c"} />
    </svg>
  );
}
