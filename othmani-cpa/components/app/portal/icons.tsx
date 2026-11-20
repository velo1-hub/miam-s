const P: Record<string, string> = {
  home: "M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  docs: "M9 7V5a1 1 0 011-1h5l4 4v8a1 1 0 01-1 1h-2M5 8a1 1 0 011-1h5l4 4v8a1 1 0 01-1 1H6a1 1 0 01-1-1V8z",
  chat: "M4 5h16v11H9l-5 4V5zM8 9h8M8 12.5h5",
  user: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 12.5a3 3 0 100-6 3 3 0 000 6zM6.4 18a6.6 6.6 0 0111.2 0",
  camera: "M4 8h3l1.5-2.5h7L17 8h3v11H4V8zM12 16.4a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z",
  calendar: "M4 6h16v14H4V6zm0 4h16M8 3v4M16 3v4M8 14h3",
  card: "M3 6h18v12H3V6zm0 4h18M7 15h3",
  sign: "M3 16c2-4 4-9 6-9s0 8 2 8 2-4 4-4 1 3 3 3h3M3 20.5h18",
  piggy: "M5 12a6.5 5 0 0111-3.8l3-.7-.5 3 1.5 1.3v2.7H18a6 6 0 01-1.5 1.8V19h-2.6v-1.3h-3.3V19H8v-2.4A5 5 0 015 12zm10.5-1h.01M9.3 8.8c1-.5 2.2-.7 3.4-.5",
  sun: "M12 16a4 4 0 100-8 4 4 0 000 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4",
  cloud: "M7 18a4 4 0 01-.5-8 5.5 5.5 0 0110.6 1.2A3.5 3.5 0 0117 18H7z",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  grid: "M4 4h7v7H4V4zm9 0h7v4h-7V4zm0 6h7v10h-7V10zm-9 3h7v7H4v-7z",
  chevron: "M9 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  cloudUp: "M7 17a4 4 0 01-.5-8 5.5 5.5 0 0110.6 1.2A3.4 3.4 0 0117 17M12 20v-8M9 14.5l3-3 3 3",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.5V12l3 2",
  file: "M7 3h7l4 4v14H7V3zm7 0v4h4M10 12h5M10 16h5",
  send: "M12 19V5M6 11l6-6 6 6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  close: "M6 6l12 12M18 6L6 18",
  lock: "M6 11h12v9H6v-9zm2.5 0V8a3.5 3.5 0 017 0v3M12 14.5v2",
  folder: "M3 6h6l2 2h10v11H3V6z",
  refresh: "M20 5v5h-5M4 19v-5h5M19.4 10A8 8 0 005.6 7.5M4.6 14a8 8 0 0013.8 2.5",
  download: "M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  shield: "M12 3l7 3v5.5c0 4.3-2.8 7.7-7 9.5-4.2-1.8-7-5.2-7-9.5V6l7-3zM9 12l2.2 2.2L15 10.5",
  wifiOff: "M4 4l16 16M8.5 15.5a5 5 0 017 0M5.3 12.2a9.5 9.5 0 013.4-2.3M12 8.5c2.6 0 5 1 6.8 2.7M2.5 9a14 14 0 013.3-2.4M10 5.2A14 14 0 0121.5 9M12 19h.01",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.4a4.3 4.3 0 017.5 2.4C19.5 15.4 12 20 12 20z",
};
const SPARKLE = "M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9L11 3zM18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z";

/** Icônes au trait de l'application (décoratives : le texte voisin porte le sens). */
export function Ico({ name, className = "h-5 w-5", strokeWidth = 1.7 }: { name: string; className?: string; strokeWidth?: number }) {
  if (name === "sparkle")
    return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false"><path d={SPARKLE} /></svg>;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d={P[name] ?? P.check} />
    </svg>
  );
}
