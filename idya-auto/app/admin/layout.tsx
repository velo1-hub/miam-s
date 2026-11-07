import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import { inter } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin · Idya Auto", template: "%s · Admin Idya Auto" },
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = { themeColor: "#08080A", colorScheme: "dark", width: "device-width", initialScale: 1 };

/** Admin root layout — brief §15: French UI, denser variant (body 15 px), noindex. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-admin">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
