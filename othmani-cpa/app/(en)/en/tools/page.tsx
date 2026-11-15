import type { Metadata } from "next";
import { ToolsPage } from "@/components/pages/ToolsPage";
import { toolsText } from "@/content/tools";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("tools", "en", toolsText.en.title, toolsText.en.description);

export default function Page() {
  return <ToolsPage lang="en" />;
}
