import "../globals.css";
export const metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.groupenettoyagemontreal.ca"), title: "Admin · Groupe Nettoyage Montréal", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr-CA"><body className="bg-sand-50">{children}</body></html>;
}
