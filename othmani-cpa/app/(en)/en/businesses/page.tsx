import type { Metadata } from "next";
import { HubPage } from "@/components/pages/HubPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("businesses", "en", pagesText.businesses.en.title, pagesText.businesses.en.description);

export default function Page() {
  return <HubPage lang="en" audience="businesses" />;
}
