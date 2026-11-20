import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("contact", "fr", pagesText.contact.fr.title, pagesText.contact.fr.description);

export default function Page() {
  return <ContactPage lang="fr" />;
}
