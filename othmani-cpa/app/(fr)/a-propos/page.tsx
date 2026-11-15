import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("about", "fr", pagesText.about.fr.title, pagesText.about.fr.description);

export default function Page() {
  return <AboutPage lang="fr" />;
}
