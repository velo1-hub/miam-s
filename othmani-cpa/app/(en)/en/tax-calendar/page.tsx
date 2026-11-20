import type { Metadata } from "next";
import { CalendarPage } from "@/components/pages/CalendarPage";
import { pagesText } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("calendar", "en", pagesText.calendar.en.title, pagesText.calendar.en.description);

export default function Page() {
  return <CalendarPage lang="en" />;
}
