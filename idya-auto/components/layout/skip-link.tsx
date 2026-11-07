import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-pill focus:bg-text focus:px-5 focus:py-3 focus:text-bg focus:font-medium"
    >
      {t("skipToContent")}
    </a>
  );
}
