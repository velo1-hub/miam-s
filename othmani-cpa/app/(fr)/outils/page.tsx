import type { Metadata } from "next";
import { ToolsPage } from "@/components/pages/ToolsPage";
import { toolsText } from "@/content/tools";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("tools", "fr", toolsText.fr.title, toolsText.fr.description);

export default function Page() {
  return <ToolsPage lang="fr" />;
}
