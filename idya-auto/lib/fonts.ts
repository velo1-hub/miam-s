import { Inter } from "next/font/google";

/** Inter variable with the opsz axis, self-hosted by next/font — brief §3.4. */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz"],
});
