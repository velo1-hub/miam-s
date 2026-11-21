import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { BIZ } from "@/content/business";
import { Section, Heading, CtaBand, PageHero, Check } from "@/components/ui";
import { LeadForm } from "@/components/Forms";
import { I } from "@/components/Icons";
import { PHOTO } from "@/content/media";
import { mediaExists } from "@/lib/media-exists";

export function AboutPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  return (
    <>
      <PageHero photo={mediaExists(PHOTO.team) ? PHOTO.team : null} eyebrow={d.nav.about} title={fr ? "Une entreprise montréalaise bâtie sur une idée simple" : "A Montréal company built on one simple idea"} sub={fr ? "Le nettoyage est un métier de constance. Même équipe, même liste, même résultat, et quelqu'un qui répond quand ça compte." : "Cleaning is a job of consistency. Same team, same checklist, same result, and someone who answers when it matters."} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="prose-gnm">
            <p>{fr ? "Groupe Nettoyage Montréal est né d'une frustration partagée par nos premiers clients : des nettoyeurs qui changent à chaque visite, des passages manqués sans avertissement et personne à qui parler quand quelque chose a été oublié." : "Groupe Nettoyage Montréal was born from a frustration shared by our first clients: cleaners who change every visit, missed visits without warning and nobody to talk to when something was missed."}</p>
            <p>{fr ? "Nous avons construit l'entreprise à l'envers de ça. Des équipes attitrées et salariées, une liste de vérification signée à chaque passage, un rapport photo, et une règle : un oubli signalé est corrigé dans les 24 heures, sans discussion." : "We built the company the other way around. Dedicated, salaried teams, a checklist signed every visit, a photo report, and one rule: anything reported is fixed within 24 hours, no argument."}</p>
            <h2>{fr ? "Ce que nous garantissons" : "What we guarantee"}</h2>
            <ul className="!list-none !pl-0 grid gap-2.5">{(fr ? [`Assurance responsabilité civile commerciale de ${BIZ.insurance.amount} · certificat sur demande`, "Employés déclarés, cotisations CNESST à jour", "Vérification des antécédents judiciaires pour chaque membre d'équipe", "Formation SIMDUT et protocoles par type d'espace", "Produits certifiés écologiques, fiches techniques disponibles", "Facturation claire, TPS et TVQ, reçus pour vos déclarations"] : [`Commercial general liability insurance of ${BIZ.insurance.amount} · certificate on request`, "Declared employees, CNESST contributions up to date", "Criminal background check for every team member", "WHMIS training and protocols by type of space", "Certified eco-friendly products, data sheets available", "Clear invoicing, GST and QST, receipts for your records"]).map((x) => <Check key={x}>{x}</Check>)}</ul>
            <h2>{fr ? "L'équipe" : "The team"}</h2>
            <p>{fr ? "Une équipe de coordination joignable de 7 h à 21 h, sept jours sur sept, et des équipes terrain basées dans chaque secteur que nous desservons. Les photos et présentations de l'équipe seront publiées ici après la séance photo." : "A coordination team reachable 7 a.m. to 9 p.m., seven days a week, and field teams based in every area we serve. Team photos and bios will be published here after the photo shoot."}</p>
          </div>
          <aside className="space-y-5">
            <div className="card p-6"><p className="eyebrow">{fr ? "En chiffres" : "By the numbers"}</p><dl className="mt-4 grid grid-cols-2 gap-5">{(fr ? [["24 h", "délai de correction"], ["7 j / 7", "coordination joignable"], ["5", "zones avec équipe locale"], ["0", "contrat requis"]] : [["24 h", "fix turnaround"], ["7 / 7", "coordination reachable"], ["5", "areas with a local team"], ["0", "contracts required"]]).map(([n, l]) => <div key={l}><dt className="text-3xl font-semibold tracking-tight text-navy-950">{n}</dt><dd className="text-[13.5px] text-ink-600">{l}</dd></div>)}</dl></div>
            <div className="card p-6"><p className="eyebrow">{fr ? "Coordonnées" : "Contact"}</p><ul className="mt-3 space-y-2 text-[15px] text-ink-700"><li>{BIZ.address.street}, {BIZ.address.city} ({BIZ.address.region}) {BIZ.address.postal}</li><li><a className="underline" href={`tel:${BIZ.phone}`}>{BIZ.phoneDisplay}</a></li><li><a className="underline" href={`mailto:${BIZ.email}`}>{BIZ.email}</a></li><li>{d.common.hours}</li></ul></div>
          </aside>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function MethodPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  const steps = fr ? [["Fiche d'espace", "Avant la première visite, nous consignons l'accès, les priorités, les surfaces délicates, les animaux et vos consignes. Votre équipe la relit avant chaque passage."], ["Liste de vérification", "Chaque service a sa liste, pièce par pièce. Elle est cochée sur place et signée. Rien ne dépend de la mémoire de quelqu'un."], ["Équipe attitrée", "Les mêmes personnes reviennent. Elles connaissent vos lieux et gagnent du temps à chaque visite. En cas d'absence, le remplaçant reçoit la fiche complète."], ["Rapport photo", "Photos horodatées des pièces clés, heure d'arrivée et de départ, notes. Envoyé par courriel ou texto à la fin du passage."], ["Retour sous 24 h", "Un oubli? Un message, une photo, et nous revenons sans frais. Toujours insatisfait? La visite est remboursée."]] : [["Space file", "Before the first visit we record access, priorities, delicate surfaces, pets and your instructions. Your team re-reads it before every visit."], ["Checklist", "Every service has its room-by-room list. It is checked on site and signed. Nothing depends on someone's memory."], ["Dedicated team", "The same people come back. They know your space and save time every visit. If someone is away, the replacement gets the full file."], ["Photo report", "Time-stamped photos of key rooms, arrival and departure time, notes. Sent by email or text at the end of the visit."], ["24-hour fix", "Something missed? One message, one photo, and we come back free. Still unhappy? The visit is refunded."]];
  return (
    <>
      <PageHero eyebrow={d.nav.method} title={fr ? "Des choses simples, faites de façon constante" : "Simple things, done consistently"} sub={fr ? "La plupart des plaintes en nettoyage se résument à trois causes : passages manqués, équipes qui changent, aucune communication. Notre méthode élimine les trois." : "Most cleaning complaints come down to three causes: missed visits, changing crews, no communication. Our method removes all three."} />
      <Section><ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{steps.map(([t_, d_], i) => <li key={t_} className="card p-6"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[14px] font-semibold text-white">{i + 1}</span><h2 className="mt-4 text-[18px] font-semibold text-navy-950">{t_}</h2><p className="mt-2 text-[15px] leading-relaxed text-ink-600">{d_}</p></li>)}
        <li className="rounded-2xl bg-amber-500 p-6 text-navy-950"><I.camera width={28} height={28} /><h2 className="mt-4 text-[18px] font-semibold">{fr ? "Exemple de rapport de visite" : "Sample visit report"}</h2><p className="mt-2 text-[15px] leading-relaxed">{fr ? "Un rapport réel anonymisé sera publié ici dès la première semaine de service. Les clients le reçoivent après chaque passage." : "A real, anonymized report will be published here from the first week of service. Clients receive one after every visit."}</p></li></ol></Section>
      <Section tone="sand"><div className="grid gap-8 lg:grid-cols-2 lg:items-center"><Heading title={fr ? "Produits et équipement" : "Products and equipment"} sub={fr ? "Produits certifiés écologiques, sans parfum sur demande, sécuritaires pour les enfants, les animaux et les surfaces alimentaires. Aspirateurs HEPA, microfibres codées par couleur par zone pour éviter la contamination croisée." : "Certified eco-friendly products, fragrance-free on request, safe for children, pets and food surfaces. HEPA vacuums, colour-coded microfibres per zone to avoid cross-contamination."} /><ul className="grid gap-3 sm:grid-cols-2">{(fr ? ["Fiches techniques disponibles", "Microfibres codées par couleur", "Aspirateurs HEPA", "Vos produits si vous préférez", "Protocole cuisine commerciale", "Protocole poussière de gypse"] : ["Data sheets available", "Colour-coded microfibres", "HEPA vacuums", "Your products if you prefer", "Commercial kitchen protocol", "Drywall dust protocol"]).map((x) => <Check key={x}>{x}</Check>)}</ul></div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function ReviewsPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  return (
    <>
      <PageHero eyebrow="Google" title={d.sections.reviewsTitle} sub={fr ? "Cette page affiche uniquement des avis Google vérifiés, synchronisés automatiquement depuis notre fiche. Les avis apparaîtront dès que la fiche Google sera connectée." : "This page shows only verified Google reviews, synced automatically from our profile. Reviews will appear once the Google profile is connected."} />
      <Section><div className="card mx-auto max-w-2xl p-8 text-center"><div className="mx-auto flex gap-1 text-amber-500 justify-center">{[1, 2, 3, 4, 5].map((i) => <I.star key={i} width={22} height={22} />)}</div><p className="mt-4 text-[17px] text-ink-700">{fr ? "Vous avez fait affaire avec nous? Votre avis aide d'autres clients de Montréal à nous trouver." : "Worked with us? Your review helps other Montréal clients find us."}</p><a className="btn btn-dark mt-6" href={BIZ.social.google || `https://www.google.com/search?q=${encodeURIComponent(BIZ.name)}`} target="_blank" rel="noopener">{fr ? "Laisser un avis Google" : "Leave a Google review"}</a></div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function WorkPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  const cases = fr ? [["Gestion immobilière", "Portefeuille de 27 logements, Hochelaga", "Problème : trois fournisseurs, qualité inégale, plaintes de locataires. Solution : un seul point de contact, liste commune, rapport mensuel. Résultat mesuré sur 90 jours à publier avec l'accord du client."], ["Airbnb", "Trois lofts, Plateau-Mont-Royal", "Problème : rotations de 4 heures manquées par un nettoyeur indépendant. Solution : synchronisation iCal, équipe de deux, rapport photo avant l'arrivée. Résultat : note propreté à suivre sur l'annonce."], ["Restaurant", "Bistro 60 places, Petite-Italie", "Problème : inspection avec remarques. Solution : passage nocturne quotidien, dégraissage hebdomadaire, registre signé. Résultat : prochaine inspection à documenter."]] : [["Property management", "27-unit portfolio, Hochelaga", "Problem: three vendors, uneven quality, tenant complaints. Solution: one contact, shared checklist, monthly report. Result measured over 90 days, to be published with the client's consent."], ["Airbnb", "Three lofts, Plateau-Mont-Royal", "Problem: 4-hour turnovers missed by an independent cleaner. Solution: iCal sync, two-person team, photo report before check-in. Result: cleanliness score to track on the listing."], ["Restaurant", "60-seat bistro, Little Italy", "Problem: inspection with remarks. Solution: nightly visit, weekly degreasing, signed log. Result: next inspection to document."]];
  return (
    <>
      <PageHero eyebrow={d.nav.work} title={fr ? "Avant / après et études de cas" : "Before / after and case studies"} sub={fr ? "Les photos avant / après de vrais chantiers et les chiffres des études de cas sont publiés avec l'accord écrit de chaque client. Les trois cas ci-dessous sont en cours de documentation." : "Before / after photos of real jobs and case-study numbers are published with each client's written consent. The three cases below are being documented."} />
      <Section><div className="grid gap-5 md:grid-cols-3">{cases.map(([tag, title, body]) => <article key={title} className="card flex flex-col p-6"><p className="eyebrow">{tag}</p><h2 className="mt-2 text-[18px] font-semibold text-navy-950">{title}</h2><p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-600">{body}</p><div className="mt-5 grid grid-cols-2 gap-2">{["avant", "après"].map((x) => <div key={x} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-sand-100 text-[12px] font-semibold uppercase tracking-wider text-ink-500">{fr ? x : x === "avant" ? "before" : "after"}</div>)}</div></article>)}</div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function CareersPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  const perks = fr ? ["Salaire au-dessus du décret de l'entretien d'édifices publics, révisé chaque année", "Horaires stables : les mêmes clients, les mêmes jours", "Équipe fixe de deux, jamais seul(e) sur un chantier commercial", "Matériel, produits et uniforme fournis", "Primes de recommandation et d'ancienneté", "Formation payée : SIMDUT, protocoles, service client", "Déplacements planifiés par secteur, près de chez vous", "Possibilité d'évoluer vers chef d'équipe et coordination"] : ["Pay above the public-building cleaning decree, reviewed every year", "Stable schedules: same clients, same days", "Fixed team of two, never alone on a commercial site", "Equipment, products and uniform provided", "Referral and seniority bonuses", "Paid training: WHMIS, protocols, customer service", "Routes planned by area, close to home", "Path to team lead and coordination roles"];
  const roles = fr ? [["Préposé(e) à l'entretien résidentiel", "Jour, lun–ven, 25–35 h", "Montréal, Laval, Rive-Sud"], ["Préposé(e) commercial", "Soir, 18 h–23 h, 20–30 h", "Centre-ville, Laval"], ["Chef d'équipe", "Jour ou soir, temps plein", "Montréal"], ["Coordination et service client", "Jour, temps plein, bilingue", "Bureau / télétravail"]] : [["Residential cleaner", "Days, Mon–Fri, 25–35 h", "Montréal, Laval, South Shore"], ["Commercial cleaner", "Evenings, 6–11 p.m., 20–30 h", "Downtown, Laval"], ["Team lead", "Days or evenings, full time", "Montréal"], ["Coordination and customer service", "Days, full time, bilingual", "Office / remote"]];
  return (
    <>
      <PageHero photo={mediaExists(PHOTO.team) ? PHOTO.team : null} eyebrow={d.nav.careers} title={fr ? "Un métier respecté, une équipe stable" : "A respected trade, a stable team"} sub={fr ? "Nous embauchons toute l'année. Candidature en deux minutes, réponse en 48 heures, entrevue la semaine même." : "We hire year-round. Two-minute application, reply within 48 hours, interview the same week."} />
      <Section><div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div><Heading title={fr ? "Postes ouverts" : "Open positions"} /><ul className="mt-6 divide-y divide-line rounded-2xl border border-line">{roles.map(([r, h, z]) => <li key={r} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><div><p className="text-[16px] font-semibold text-navy-950">{r}</p><p className="text-[13.5px] text-ink-600">{h} · {z}</p></div><a href="#apply" className="text-[14px] font-semibold text-amber-600 underline">{fr ? "Postuler" : "Apply"}</a></li>)}</ul>
          <h3 className="mt-10 text-[13px] font-semibold uppercase tracking-wider text-ink-500">{fr ? "Ce que nous offrons" : "What we offer"}</h3><ul className="mt-4 grid gap-2.5">{perks.map((p) => <Check key={p}>{p}</Check>)}</ul>
          <p className="mt-6 text-[13.5px] text-ink-500">{fr ? "Exigences : fiabilité, souci du détail, français ou anglais fonctionnel, vérification des antécédents. Permis de conduire un atout. Nous sommes un employeur qui valorise la diversité." : "Requirements: reliability, attention to detail, working French or English, background check. Driver's licence an asset. We are an equal-opportunity employer."}</p></div>
        <div id="apply"><Heading title={fr ? "Postuler en deux minutes" : "Apply in two minutes"} sub={fr ? "Pas de CV requis pour commencer. Dites-nous qui vous êtes et quand vous êtes disponible." : "No résumé needed to start. Tell us who you are and when you are available."} /><div className="mt-6"><LeadForm locale={locale} type="career" source="careers" /></div></div>
      </div></Section>
    </>
  );
}

export function ContactPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr"; const d = t(locale);
  return (
    <>
      <PageHero eyebrow={d.nav.contact} title={fr ? "Parlons de votre espace" : "Let's talk about your space"} sub={fr ? "Pour un prix immédiat, utilisez la soumission instantanée ou l'assistant. Pour tout le reste, écrivez-nous : réponse sous 24 heures ouvrables." : "For an immediate price, use the instant quote or the assistant. For everything else, write to us: reply within 24 business hours."}><Link href={pagePath(locale, "quote")} className="btn btn-primary">{d.hero.cta}</Link></PageHero>
      <Section><div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <div className="card p-6"><ul className="space-y-4 text-[15.5px] text-ink-700">
            <li className="flex gap-3"><I.phone width={22} height={22} className="shrink-0 text-amber-600" /><div><a className="font-semibold text-navy-950" href={`tel:${BIZ.phone}`}>{BIZ.phoneDisplay}</a><p className="text-[13.5px] text-ink-500">{d.common.hours} · {fr ? "texto accepté" : "texts welcome"}</p></div></li>
            <li className="flex gap-3"><I.mail width={22} height={22} className="shrink-0 text-amber-600" /><div><a className="font-semibold text-navy-950" href={`mailto:${BIZ.email}`}>{BIZ.email}</a><p className="text-[13.5px] text-ink-500">{fr ? "Réponse sous 24 h ouvrables" : "Reply within 24 business hours"}</p></div></li>
            <li className="flex gap-3"><I.pin width={22} height={22} className="shrink-0 text-amber-600" /><div><p className="font-semibold text-navy-950">{BIZ.address.street}, {BIZ.address.city} ({BIZ.address.region}) {BIZ.address.postal}</p><p className="text-[13.5px] text-ink-500">{d.common.serviceArea}</p></div></li>
          </ul></div>
          <div className="card p-6"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Urgence le jour même?" : "Same-day emergency?"}</h2><p className="mt-2 text-[14.5px] text-ink-600">{fr ? "Appelez plutôt que d'écrire. Nous confirmons la disponibilité en quelques minutes." : "Call rather than write. We confirm availability within minutes."}</p></div>
        </div>
        <LeadForm locale={locale} type="contact" source="contact" />
      </div></Section>
    </>
  );
}
