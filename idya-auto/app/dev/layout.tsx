import { notFound } from "next/navigation";
import { inter } from "@/lib/fonts";
import "../globals.css";

/** Internal component gallery — excluded from production (brief §22). */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "false") notFound();
  return (
    <html lang="fr-CA" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
