import { notFound } from "next/navigation";

/** Any unknown localized path renders the locale-aware 404 (next-intl recommendation). */
export default function CatchAll() {
  notFound();
}
