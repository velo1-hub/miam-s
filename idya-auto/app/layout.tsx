import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Inter variable, self-hosted by next/font (brief §3.4). The opsz axis is enabled so
 * display sizes get the optical-size cut. Subsets: latin + latin-ext for Québec French.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "Idya Auto", template: "%s | Idya Auto" },
  description:
    "Idya Auto — concessionnaire automobile au Québec. Site en construction.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#08080A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr-CA" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
