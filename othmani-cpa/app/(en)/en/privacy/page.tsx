import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("privacy", "en", pagesText.privacy.en.title, pagesText.privacy.en.description);

export default function Page() {
  return <PrivacyPage lang="en" />;
}
