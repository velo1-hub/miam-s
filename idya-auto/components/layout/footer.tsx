import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPhone } from "@/lib/format/phone";
import type { Settings } from "@/lib/settings/types";
import { Logo } from "@/components/ui/logo";
import { HoursStatus } from "./hours-status";
import { Year } from "./year";
import { HoursTable } from "./hours-table";
import { LanguageToggle } from "./language-toggle";

/** Footer — brief §5.3: four columns, live hours status, legal column with the privacy officer. */
export function Footer({ settings, demoMode }: { settings: Settings; demoMode: boolean }) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const b = settings.business;
  return (
    <footer className="border-t border-line bg-bg-raised">
      <div className="container-content py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Logo />
            <address className="not-italic text-small text-text-2">
              <div>{b.addressLine1}</div>
              <div>
                {b.city}, {b.province} {b.postalCode}
              </div>
            </address>
            <div className="flex flex-col gap-1.5 text-small">
              <a href={`tel:${b.phone}`} className="text-text hover:underline">
                {formatPhone(b.phone)}
              </a>
              <a href={`mailto:${b.email}`} className="text-text hover:underline">
                {b.email}
              </a>
              <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="text-text-2 hover:text-text hover:underline">
                {t("mapLink")}
              </a>
            </div>
          </div>
          <div>
            <h2 className="eyebrow mb-4">{t("hours")}</h2>
            <HoursStatus settings={settings} className="mb-4" />
            <HoursTable hours={settings.hours} />
          </div>
          <div>
            <h2 className="eyebrow mb-4">{t("links")}</h2>
            <ul className="flex flex-col gap-2 text-small">
              <li><Link href="/inventory" className="text-text-2 hover:text-text">{tn("inventory")}</Link></li>
              <li><Link href="/financing" className="text-text-2 hover:text-text">{tn("financing")}</Link></li>
              <li><Link href="/trade-in" className="text-text-2 hover:text-text">{tn("tradeIn")}</Link></li>
              <li><Link href="/about" className="text-text-2 hover:text-text">{tn("about")}</Link></li>
              <li><Link href="/contact" className="text-text-2 hover:text-text">{tn("contact")}</Link></li>
              <li><Link href="/favorites" className="text-text-2 hover:text-text">{tn("favorites")}</Link></li>
              <li><Link href="/compare" className="text-text-2 hover:text-text">{tn("compare")}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow mb-4">{t("legal")}</h2>
            <ul className="flex flex-col gap-2 text-small">
              <li><Link href="/privacy" className="text-text-2 hover:text-text">{t("privacy")}</Link></li>
              <li><Link href="/terms" className="text-text-2 hover:text-text">{t("terms")}</Link></li>
            </ul>
            <p className="mt-6 text-caption text-text-3">{t("privacyOfficer")}</p>
            <p className="text-small text-text-2">
              {settings.privacyOfficer.name}
              <br />
              <a href={`mailto:${settings.privacyOfficer.email}`} className="hover:text-text hover:underline">
                {settings.privacyOfficer.email}
              </a>
            </p>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-caption text-text-3 md:flex-row md:items-center md:justify-between">
          <p>{t.rich("copyright", { year: () => <Year />, name: b.legalName })}</p>
          <div className="flex items-center gap-4">
            {demoMode ? <span className="rounded-pill border border-line px-2.5 py-1">{tc("demoLabel")}</span> : null}
            <LanguageToggle />
            <span>{tc("poweredBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
