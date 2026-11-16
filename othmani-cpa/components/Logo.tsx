/**
 * Logo « OC » d'Othmani CPA Inc., redessiné en vectoriel d'après la carte professionnelle :
 * deux anneaux marine ouverts, chacun prolongé par un parallélogramme bleu ciel.
 */
const SKY = "#56bfdc";

function Letter({ cx, color, c = false }: { cx: number; color: string; c?: boolean }) {
  const cy = 31, r = 21.5;
  // Arc : de 3 h (extrémité à coupe horizontale), par le haut et la gauche, jusqu'en bas à gauche (coupe en biais)
  const a = (130 * Math.PI) / 180;
  const ex = cx + r * Math.cos(a), ey = cy + r * Math.sin(a);
  return (
    <>
      <path
        d={`M ${cx + r} ${cy + 1} A ${r} ${r} 0 1 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
        fill="none"
        stroke={color}
        strokeWidth="15"
        clipPath={c ? `url(#oc-clip-c)` : undefined}
      />
      <path d={`M ${cx - 16} ${cy + 31} L ${cx + 4} ${cy + 31} L ${cx + 30} ${cy + 8} L ${cx + 10} ${cy + 8} Z`} fill={SKY} />
    </>
  );
}

export function LogoMark({ className = "h-9 w-auto", light = false }: { className?: string; light?: boolean }) {
  const color = light ? "#ffffff" : "currentColor";
  return (
    <svg viewBox="0 0 128 63" className={`${light ? "" : "text-navy"} ${className}`} aria-hidden="true" focusable="false">
      <defs>
        {/* Le « C » : on retire le quart inférieur droit de l'anneau */}
        <clipPath id="oc-clip-c">
          <path d="M 60 0 H 128 V 23 H 96 V 63 H 60 Z" />
        </clipPath>
      </defs>
      <Letter cx={31} color={color} />
      <Letter cx={95} color={color} c />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark className="h-10 w-auto" light={light} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.15rem] font-bold tracking-tight ${light ? "text-white" : "text-navy"}`}>
          Othmani CPA <span className="text-[0.7rem] font-medium">Inc.</span>
        </span>
        <span className={`mt-1 text-[0.68rem] font-medium tracking-wide ${light ? "text-white/80" : "text-muted"}`}>Société de comptable professionnel agréé</span>
      </span>
    </span>
  );
}
