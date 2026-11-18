import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES, type ServiceId } from "@/content/services";
import { DEFAULT_RULES, computeQuote, fmtCAD } from "@/lib/pricing";
import { Section, Heading, CtaBand, PageHero, Check } from "@/components/ui";
import { QuoteWizard } from "@/components/QuoteWizard";
import { BookingFlow } from "@/components/BookingFlow";
import { BookingLookup } from "@/components/Forms";
import { I } from "@/components/Icons";

const isService = (v?: string): v is ServiceId => !!v && SERVICES.some((s) => s.id === v);

export function PricingPage({ locale }: { locale: Locale }) {
  const d = t(locale); const fr = locale === "fr"; const R = DEFAULT_RULES;
  const row = (label: string, id: ServiceId, input: Omit<Parameters<typeof computeQuote>[0], "service">) => { const q = computeQuote({ ...input, service: id }); return { label, id, price: q.min === q.max ? fmtCAD(q.min, locale) : `${fmtCAD(q.min, locale)} – ${fmtCAD(q.max, locale)}`, unit: q.unit }; };
  const resRows = [row(fr ? "Studio / 1½–2½" : "Studio / 1-bed", "residential", { homeType: "studio" }), row("3½", "residential", { homeType: "3half" }), row("4½", "residential", { homeType: "4half" }), row("5½", "residential", { homeType: "5half" }), row(fr ? "Maison 3 ch., 2 sdb, 2 étages" : "House, 3 bed, 2 bath, 2 floors", "residential", { homeType: "house", bedrooms: 3, bathrooms: 2, floors: 2 })];
  const deepRows = [row("3½", "deep", { homeType: "3half" }), row("4½", "deep", { homeType: "4half" }), row("5½", "deep", { homeType: "5half" })];
  const moveRows = [row("3½", "move", { homeType: "3half" }), row("4½", "move", { homeType: "4half" }), row("5½", "move", { homeType: "5half" })];
  const bnbRows = [row("Studio", "airbnb", { bedrooms: 0 }), row(fr ? "1 chambre" : "1 bedroom", "airbnb", { bedrooms: 1 }), row(fr ? "2 chambres" : "2 bedrooms", "airbnb", { bedrooms: 2 }), row(fr ? "3 chambres" : "3 bedrooms", "airbnb", { bedrooms: 3 })];
  const offRows = [row(fr ? "1 000 pi², 2 passages/sem." : "1,000 sq ft, 2 visits/wk", "office", { sqft: 1000, visitsPerWeek: 2 }), row(fr ? "2 000 pi², 3 passages/sem." : "2,000 sq ft, 3 visits/wk", "office", { sqft: 2000, visitsPerWeek: 3 }), row(fr ? "5 000 pi², 5 passages/sem." : "5,000 sq ft, 5 visits/wk", "office", { sqft: 5000, visitsPerWeek: 5 })];
  const unitLabel = (u: string) => u === "visit" ? d.common.perVisit : u === "turnover" ? d.common.perTurnover : u === "month" ? d.common.perMonth : "";
  const Table = ({ title, rows, note, id }: { title: string; rows: ReturnType<typeof row>[]; note?: string; id: ServiceId }) => { const s = SERVICES.find((x) => x.id === id)!; return (
    <div className="card overflow-hidden"><div className="flex items-center justify-between gap-3 bg-sand-50 px-5 py-4"><h3 className="text-[17px] font-semibold text-navy-950">{title}</h3><Link href={pagePath(locale, "services", s.slug[locale])} className="text-[13px] font-semibold text-amber-600 underline">{d.common.learnMore}</Link></div>
      <table className="w-full text-[15px]"><tbody>{rows.map((r) => <tr key={r.label} className="border-t border-line"><td className="px-5 py-3 text-ink-700">{r.label}</td><td className="px-5 py-3 text-right font-semibold text-navy-950 whitespace-nowrap">{r.price} <span className="text-[12px] font-normal text-ink-500">{unitLabel(r.unit)}</span></td></tr>)}</tbody></table>
      {note && <p className="border-t border-line px-5 py-3 text-[13px] text-ink-500">{note}</p>}</div>); };
  return (
    <>
      <PageHero eyebrow={d.nav.pricing} title={d.sections.pricingTitle} sub={fr ? "Tous les prix sont avant taxes et incluent les produits, le matériel, l'équipe assurée et le rapport photo. Le prix exact de votre espace s'affiche dans la soumission instantanée." : "All prices are before tax and include products, equipment, the insured team and the photo report. Your exact price appears in the instant quote."}><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}</Link></PageHero>
      <Section><div className="grid gap-6 lg:grid-cols-2">
        <Table id="residential" title={fr ? "Ménage régulier (visite ponctuelle)" : "Regular cleaning (one-time visit)"} rows={resRows} note={fr ? `Hebdomadaire −${R.residential.frequencyDiscount.weekly * 100} % · Aux deux semaines −${R.residential.frequencyDiscount.biweekly * 100} %. Salle de bain supplémentaire +${R.residential.perBath} $.` : `Weekly −${R.residential.frequencyDiscount.weekly * 100}% · Biweekly −${R.residential.frequencyDiscount.biweekly * 100}%. Extra bathroom +$${R.residential.perBath}.`} />
        <Table id="deep" title={fr ? "Grand ménage" : "Deep cleaning"} rows={deepRows} note={fr ? "Intérieur du four et du frigo inclus." : "Inside oven and fridge included."} />
        <Table id="move" title={fr ? "Déménagement (logement vide)" : "Move-in / move-out (empty home)"} rows={moveRows} note={fr ? "Créneaux du 30 juin et 1er juillet ouverts dès avril." : "June 30 and July 1 slots open from April."} />
        <Table id="airbnb" title={fr ? "Rotation Airbnb" : "Airbnb turnover"} rows={bnbRows} note={fr ? `Literie fournie +${R.addons.linens} $ · Buanderie +${R.addons.laundry} $ par brassée.` : `Linens supplied +$${R.addons.linens} · Laundry +$${R.addons.laundry} per load.`} />
        <Table id="office" title={fr ? "Bureaux (fourchette mensuelle)" : "Offices (monthly range)"} rows={offRows} note={fr ? `Minimum ${R.office.minimumMonth} $ / mois. Prix définitif après visite gratuite.` : `Minimum $${R.office.minimumMonth} / month. Final price after free walkthrough.`} />
        <div className="card p-6"><h3 className="text-[17px] font-semibold text-navy-950">{fr ? "Extras et suppléments" : "Add-ons and surcharges"}</h3>
          <ul className="mt-4 grid gap-2 text-[15px] text-ink-700 sm:grid-cols-2">{(Object.keys(R.addons) as (keyof typeof R.addons)[]).map((k) => <li key={k} className="flex justify-between gap-3 border-b border-line py-1.5"><span>{({ fr: { oven: "Four (intérieur)", fridge: "Réfrigérateur (intérieur)", windows: "Fenêtre intérieure (chacune)", pets: "Animaux", laundry: "Buanderie (brassée)", linens: "Literie fournie", carpet: "Shampoing tapis", balcony: "Balcon" }, en: { oven: "Oven (inside)", fridge: "Fridge (inside)", windows: "Interior window (each)", pets: "Pets", laundry: "Laundry (load)", linens: "Linens supplied", carpet: "Carpet shampoo", balcony: "Balcony" } } as const)[locale][k]}</span><strong className="text-navy-950">{fmtCAD(R.addons[k], locale)}</strong></li>)}</ul>
          <p className="mt-4 text-[13px] text-ink-500">{fr ? "Déplacement : 0 $ sur l'île de Montréal, 15 $ Laval / Longueuil / Ouest-de-l'Île, 20 $ Brossard (offert en récurrent). Post-construction : 0,45 $ à 0,70 $ / pi², minimum 300 $. Restaurants et gestion immobilière : sur soumission." : "Travel: $0 on the island, $15 Laval / Longueuil / West Island, $20 Brossard (waived on recurring). Post-construction: $0.45 to $0.70 / sq ft, $300 minimum. Restaurants and property management: by quote."}</p></div>
      </div></Section>
      <Section tone="sand"><div className="grid gap-8 lg:grid-cols-2 lg:items-center"><Heading title={fr ? "Ce qui est toujours inclus" : "Always included"} /><ul className="grid gap-3 sm:grid-cols-2">{(fr ? ["Produits certifiés écologiques", "Matériel professionnel, aspirateurs HEPA", "Équipe attitrée, assurée, antécédents vérifiés", "Rapport photo après chaque visite", "Retour gratuit sous 24 h", "Annulation gratuite jusqu'à 24 h avant", "Aucun contrat, aucune durée minimale", "Facture détaillée, TPS et TVQ incluses"] : ["Certified eco-friendly products", "Professional equipment, HEPA vacuums", "Dedicated, insured, background-checked team", "Photo report after every visit", "Free return within 24 h", "Free cancellation up to 24 h before", "No contract, no minimum term", "Itemized invoice, GST and QST included"]).map((x) => <Check key={x}>{x}</Check>)}</ul></div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function QuotePage({ locale, service }: { locale: Locale; service?: string }) {
  const d = t(locale); const fr = locale === "fr";
  return (
    <>
      <PageHero eyebrow={d.nav.quote} title={fr ? "Votre prix en deux minutes" : "Your price in two minutes"} sub={fr ? "Décrivez votre espace. Le résidentiel et l'Airbnb obtiennent un prix ferme et un bouton de réservation; le commercial, une fourchette et une visite gratuite." : "Describe your space. Residential and Airbnb get a firm price and a booking button; commercial gets a range and a free walkthrough."} />
      <Section className="!pt-10"><div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]"><QuoteWizard locale={locale} initialService={isService(service) ? service : undefined} />
        <aside className="space-y-5"><div className="card p-5"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Comment le prix est calculé" : "How the price is calculated"}</h2><ul className="mt-3 space-y-2 text-[14.5px] text-ink-700"><li>• {fr ? "Base + pièces + salles de bain, puis remise de fréquence." : "Base + rooms + bathrooms, then frequency discount."}</li><li>• {fr ? "Extras à l'unité, affichés avant de réserver." : "Add-ons per unit, shown before you book."}</li><li>• {fr ? "Bureaux : au pi² et à la fréquence, minimum 450 $ / mois." : "Offices: per sq ft and frequency, $450 / month minimum."}</li><li>• {fr ? "Le prix affiché est celui que vous payez, avant taxes." : "The price shown is what you pay, before tax."}</li></ul></div>
          <div className="card p-5"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Vous préférez parler?" : "Prefer to talk?"}</h2><p className="mt-2 text-[14.5px] text-ink-600">{fr ? "L'assistant répond 24 h sur 24 et réserve pour vous. Un humain répond au téléphone de 7 h à 21 h." : "The assistant answers 24/7 and books for you. A human answers the phone 7 a.m. to 9 p.m."}</p></div></aside></div></Section>
    </>
  );
}

export function BookPage({ locale, service }: { locale: Locale; service?: string }) {
  const d = t(locale); const fr = locale === "fr";
  return (
    <>
      <PageHero eyebrow={d.nav.book} title={fr ? "Réserver en ligne" : "Book online"} sub={fr ? "Calendrier en direct, confirmation immédiate. Annulation gratuite jusqu'à 24 h avant." : "Live calendar, instant confirmation. Free cancellation up to 24 h before."} />
      <Section className="!pt-10"><BookingFlow locale={locale} initialService={isService(service) ? service : undefined} /></Section>
    </>
  );
}

export function MyBookingPage({ locale }: { locale: Locale }) {
  const d = t(locale); const fr = locale === "fr";
  return (
    <>
      <PageHero eyebrow={d.nav.myBooking} title={fr ? "Retrouver ma réservation" : "Find my booking"} sub={fr ? "Entrez la référence reçue par courriel et votre adresse courriel." : "Enter the reference from your email and your email address."} />
      <Section className="!pt-10"><div className="max-w-3xl"><BookingLookup locale={locale} /><p className="mt-6 text-[14px] text-ink-600">{fr ? "Pour modifier la date, annulez puis réservez de nouveau, ou écrivez-nous." : "To change the date, cancel and rebook, or write to us."} <Link href={pagePath(locale, "contact")} className="underline">{d.nav.contact}</Link></p></div></Section>
    </>
  );
}
