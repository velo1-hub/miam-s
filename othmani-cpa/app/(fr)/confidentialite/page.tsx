import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("privacy", "fr", pagesText.privacy.fr.title, pagesText.privacy.fr.description);

export default function Page() {
  return <PrivacyPage lang="fr" />;
}
