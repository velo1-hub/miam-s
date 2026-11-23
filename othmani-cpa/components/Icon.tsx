const paths: Record<string, string> = {
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6M9 16h3",
  letter: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11zM3.5 6l8.5 6.5L20.5 6",
  laptop: "M5 6a1 1 0 011-1h12a1 1 0 011 1v9H5V6zM2.5 18h19M9 18l.5-1.5h5L15 18",
  home: "M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  rocket: "M14 4c3 0 6 1 6 1s0 3-1 6l-6 6-4-4 6-6M9 13l-3 1-2 4 4-2 1-3M15 9h.01",
  percent: "M19 5L5 19M7.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  layers: "M12 4l9 5-9 5-9-5 9-5zM3 14l9 5 9-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zm-3.5 9l2.5 2.5 4.5-5",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  building: "M4 21V5l8-2v18M12 8h8v13M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20",
  badge: "M12 3l2.4 1.8 3 .1.9 2.8 2.4 1.8-.9 2.9.9 2.8-2.4 1.8-.9 2.9-3 .1L12 21l-2.4-1.9-3-.1-.9-2.8-2.4-1.8.9-2.9-.9-2.8 2.4-1.8.9-2.9 3-.1L12 3zm-3 9l2 2 4-4",
  chat: "M4 5h16v11H9l-5 4V5z",
  close: "M6 6l12 12M18 6L6 18",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  pin: "M12 21s-7-6.1-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.9 12 21 12 21zm0-9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l3.5 2",
  calendar: "M4 6h16v14H4V6zm0 4h16M8 3v4M16 3v4",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8L12 3.5z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0",
  briefcase: "M3 8h18v12H3V8zm6 0V5h6v3M3 13h18",
  bell: "M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zm4 4a2 2 0 004 0",
  menu: "M4 7h16M4 12h16M4 17h16",
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-6 w-6", strokeWidth = 1.6 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d={paths[name] ?? paths.check} />
    </svg>
  );
}
