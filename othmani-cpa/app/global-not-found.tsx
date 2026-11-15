import type { Metadata } from "next";
import "./globals.css";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = { title: "Page introuvable | Page not found", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="fr-CA">
      <body>
        <main className="flex min-h-svh items-center justify-center bg-gradient-to-b from-sky-50 to-white px-5">
          <div className="max-w-lg text-center">
            <LogoMark className="mx-auto h-14 w-14" />
            <h1 className="mt-8 text-4xl font-semibold">Cette page n'existe pas.</h1>
            <p className="lead mt-4">Pas de stress : tout le reste est au bon endroit.</p>
            <p className="mt-2 text-muted" lang="en">This page doesn't exist. Everything else is right where it should be.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="/" className="btn-primary">Retour à l'accueil</a>
              <a href="/en/" className="btn-secondary" lang="en">Back to home</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
