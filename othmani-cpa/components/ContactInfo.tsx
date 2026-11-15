import { dict } from "@/content/ui";
import { hasEmail, hasPhone, site, type Lang } from "@/lib/site";

export function AddressLines({ lang }: { lang: Lang }) {
  const a = site.address;
  return (
    <>
      {lang === "fr" ? a.street : a.streetEn}
      <br />
      {a.city} ({a.region}) {a.postalCode}
    </>
  );
}

export function PhoneLink({ lang, className = "" }: { lang: Lang; className?: string }) {
  return hasPhone() ? (
    <a href={`tel:${site.phone.tel}`} className={className}>{site.phone.display}</a>
  ) : (
    <span className={className}>{dict(lang).contact.toComplete}</span>
  );
}

export function EmailLink({ lang, className = "" }: { lang: Lang; className?: string }) {
  return hasEmail() ? (
    <a href={`mailto:${site.email}`} className={className}>{site.email}</a>
  ) : (
    <span className={className}>{dict(lang).contact.toComplete}</span>
  );
}
