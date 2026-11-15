import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("contact", "en", pagesText.contact.en.title, pagesText.contact.en.description);

export default function Page() {
  return <ContactPage lang="en" />;
}
