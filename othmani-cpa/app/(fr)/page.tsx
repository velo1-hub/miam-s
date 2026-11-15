import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("home", "fr", pagesText.home.fr.title, pagesText.home.fr.description);

export default function Page() {
  return <HomePage lang="fr" />;
}
