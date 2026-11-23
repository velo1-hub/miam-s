import type { Metadata } from "next";
import { Dashboard } from "@/components/app/Dashboard";

export const metadata: Metadata = { title: { absolute: "Gestion | Othmani CPA" }, robots: { index: false, follow: false } };

export default function Page() {
  return <Dashboard />;
}
