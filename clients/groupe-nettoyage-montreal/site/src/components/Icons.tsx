import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });
export const I = {
  home: (p: P) => <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>,
  sparkles: (p: P) => <svg {...base(p)}><path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>,
  truck: (p: P) => <svg {...base(p)}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>,
  hardhat: (p: P) => <svg {...base(p)}><path d="M4 16a8 8 0 0 1 16 0"/><path d="M2 16h20v2H2z"/><path d="M10 8V5h4v3"/></svg>,
  key: (p: P) => <svg {...base(p)}><circle cx="8" cy="14" r="4"/><path d="m11 11 9-9"/><path d="m16 6 2 2"/><path d="m18.5 3.5 2 2"/></svg>,
  building: (p: P) => <svg {...base(p)}><path d="M4 21V5a1 1 0 0 1 1-1h8v17"/><path d="M13 9h6a1 1 0 0 1 1 1v11"/><path d="M7 8h2M7 12h2M7 16h2M16 13h1M16 17h1"/></svg>,
  chef: (p: P) => <svg {...base(p)}><path d="M7 11a3.5 3.5 0 0 1 .6-6.9A4.5 4.5 0 0 1 16 4a3.5 3.5 0 0 1 1 6.9V18H7z"/><path d="M7 15h10"/></svg>,
  layers: (p: P) => <svg {...base(p)}><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/></svg>,
  check: (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>,
  shield: (p: P) => <svg {...base(p)}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>,
  camera: (p: P) => <svg {...base(p)}><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  users: (p: P) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 14a6 6 0 0 1 4 6"/></svg>,
  phone: (p: P) => <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>,
  chat: (p: P) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>,
  calendar: (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  pin: (p: P) => <svg {...base(p)}><path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>,
  star: (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>,
  arrow: (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  x: (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  menu: (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  mail: (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  clock: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  leaf: (p: P) => <svg {...base(p)}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/></svg>,
  send: (p: P) => <svg {...base(p)}><path d="m3 11 18-8-8 18-2-8z"/></svg>,
  globe: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
};
export type IconName = keyof typeof I;
