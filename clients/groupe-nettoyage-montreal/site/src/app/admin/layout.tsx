import "../globals.css";
import { GeistSans } from "geist/font/sans";
export const metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.groupenettoyagemontreal.ca"), title: "Admin · Groupe Nettoyage Montréal", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr-CA" className={GeistSans.variable}><body className="bg-sand-50 font-sans">{children}</body></html>;
}
