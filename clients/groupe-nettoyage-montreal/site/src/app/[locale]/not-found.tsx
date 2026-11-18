import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-3 text-3xl">Page introuvable · Page not found</h1>
      <p className="mt-3 text-ink-600">La page demandée n'existe pas ou a été déplacée. · The page you requested does not exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/" className="btn btn-dark">Accueil</Link><Link href="/en" className="btn btn-ghost">Home (EN)</Link></div>
    </div>
  );
}
