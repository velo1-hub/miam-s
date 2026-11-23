import type { Metadata } from "next";
import { HubPage } from "@/components/pages/HubPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("individuals", "fr", pagesText.individuals.fr.title, pagesText.individuals.fr.description);

export default function Page() {
  return <HubPage lang="fr" audience="individuals" />;
}
