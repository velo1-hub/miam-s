/**
 * Phase 0 placeholder. The real home page (brief §6) is built in Phase 1 under
 * app/[locale]/(site)/page.tsx. This page only proves the toolchain builds and deploys.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-eyebrow uppercase text-text-2">Idya Auto · Québec</p>
      <h1 className="text-h1 font-semibold text-text">Site en construction</h1>
      <p className="max-w-md text-body text-text-2">
        Le nouveau site d&rsquo;Idya Auto arrive bientôt.
      </p>
    </main>
  );
}
