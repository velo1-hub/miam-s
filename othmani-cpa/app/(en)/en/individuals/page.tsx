import type { Metadata } from "next";
import { HubPage } from "@/components/pages/HubPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("individuals", "en", pagesText.individuals.en.title, pagesText.individuals.en.description);

export default function Page() {
  return <HubPage lang="en" audience="individuals" />;
}
