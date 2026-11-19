import type { ReactNode } from "react";
export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`marquee ${className}`}><div className="marquee-track"><div className="marquee-row">{children}</div><div className="marquee-row" aria-hidden>{children}</div></div></div>;
}
