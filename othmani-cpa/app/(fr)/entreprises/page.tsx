import type { Metadata } from "next";
import { HubPage } from "@/components/pages/HubPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("businesses", "fr", pagesText.businesses.fr.title, pagesText.businesses.fr.description);

export default function Page() {
  return <HubPage lang="fr" audience="businesses" />;
}
