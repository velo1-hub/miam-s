/** GNM mark: a squeegee wipe revealing a clean, shining surface. Navy tile, white wipe, amber sparkle. */
export function Logo({ size = 36, light = false }: { size?: number; light?: boolean }) {
  const tile = light ? "#ffffff" : "#0f1424"; const wipe = light ? "#0f1424" : "#ffffff"; const spark = "#f0a12e";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill={tile} />
      {/* haze being wiped away (left), clean surface revealed (right) */}
      <path d="M8 31c6-10 14-14 24-13" fill="none" stroke={wipe} strokeOpacity=".28" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 37c7-11 16-16 27-15" fill="none" stroke={wipe} strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
      {/* squeegee stroke */}
      <path d="M9 26C15 15 25 10 37 11" fill="none" stroke={wipe} strokeWidth="5.4" strokeLinecap="round" />
      {/* sparkle */}
      <path d="M34 22l2.3 5.4 5.4 2.3-5.4 2.3L34 37.4l-2.3-5.4-5.4-2.3 5.4-2.3z" fill={spark} />
      <circle cx="14" cy="36" r="1.8" fill={spark} />
    </svg>
  );
}
