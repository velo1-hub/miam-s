import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("home", "en", pagesText.home.en.title, pagesText.home.en.description);

export default function Page() {
  return <HomePage lang="en" />;
}
