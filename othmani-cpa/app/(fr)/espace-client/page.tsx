import type { Metadata } from "next";
import { Portal } from "@/components/app/Portal";

export const metadata: Metadata = { title: { absolute: "Mon espace client | Othmani CPA" }, robots: { index: false, follow: false } };

export default function Page() {
  return <Portal lang="fr" />;
}
