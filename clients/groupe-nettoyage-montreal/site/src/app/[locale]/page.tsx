import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES } from "@/content/services";
import { ZONES } from "@/content/zones";
import { FAQ } from "@/content/faq";
import { POSTS } from "@/content/posts";
import { BIZ } from "@/content/business";
import { Section, Heading, Faq, ServiceCard } from "@/components/ui";
import { JsonLd, faqJsonLd } from "@/components/JsonLd";
import { I } from "@/components/Icons";
import { AssistantOpen } from "@/components/AssistantOpen";
import { Reviews } from "@/components/Reviews";
import { Reveal } from "@/components/fx/Reveal";
import { Spotlight } from "@/components/fx/Spotlight";
import { HeroVideo } from "@/components/fx/HeroVideo";
import { Marquee } from "@/components/fx/Marquee";
import { BeforeAfter } from "@/components/fx/BeforeAfter";
import { InlineVideo } from "@/components/fx/InlineVideo";
import { SERVICE_PHOTO, PHOTO as MEDIA } from "@/content/media";
import { mediaExists } from "@/lib/media-exists";
import { preload } from "react-dom";
import { existsSync } from "node:fs";
import { join } from "node:path";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const fr = locale === "fr";
  return { title: fr ? "Entretien commercial à Montréal · Bureaux, restaurants, immeubles" : "Commercial cleaning in Montréal · Offices, restaurants, buildings", alternates: { canonical: fr ? "/" : "/en", languages: { "fr-CA": "/", "en-CA": "/en", "x-default": "/" } } };
}

const PHOTO = { visit: "/media/visit.webp", airbnb: "/media/airbnb.webp", restaurant: "/media/restaurant.webp", office: "/media/office.webp", lobby: "/media/lobby.webp", team: "/media/team.webp" };
const pic = (p: string) => (mediaExists(p) ? p : null);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const locale: Locale = raw; const d = t(locale); const fr = locale === "fr";
  const expertise = (["office", "restaurant", "property", "airbnb"] as const).map((id) => SERVICES.find((s) => s.id === id)!);
  const steps = fr ? [["Décrivez vos locaux", "Type d'espace, superficie approximative, fréquence souhaitée. Deux minutes, en ligne ou avec l'assistant."], ["Visite gratuite, soumission écrite", "20 minutes sur place, en semaine. La soumission détaillée, par passage et par mois, arrive dans les 24 heures."], ["Équipe attitrée, liste signée", "Les mêmes personnes reviennent. Chaque passage suit la même liste de vérification, cochée sur place."], ["Rapport photo, garantie 24 h", "Photos horodatées à la fin. Un oubli? On revient gratuitement dans les 24 heures."]] : [["Describe your premises", "Type of space, approximate area, desired frequency. Two minutes, online or with the assistant."], ["Free walkthrough, written quote", "20 minutes on site, on a weekday. The detailed quote, per visit and per month, arrives within 24 hours."], ["Dedicated team, signed checklist", "The same people come back. Every visit follows the same checklist, ticked on site."], ["Photo report, 24-hour guarantee", "Time-stamped photos at the end. Something missed? We return free within 24 hours."]];
  preload("/media/hero-poster.jpg", { as: "image", fetchPriority: "high" });
  const hasBeforeAfter = existsSync(join(process.cwd(), "public", "media", "before.webp")) && existsSync(join(process.cwd(), "public", "media", "after.webp"));
  const certs = fr ? [["CNESST", "Employés déclarés, cotisations à jour"], ["Assurance responsabilité", `${BIZ.insurance.amount} · certificat joint à la soumission`], ["Antécédents vérifiés", "Chaque membre d'équipe, avant le premier passage"], ["Produits écocertifiés", "Sécuritaires pour les surfaces alimentaires et les milieux de soins"]] : [["CNESST", "Declared employees, contributions up to date"], ["Liability insurance", `${BIZ.insurance.amount} · certificate attached to the quote`], ["Background checks", "Every team member, before the first visit"], ["Eco-certified products", "Safe for food surfaces and care settings"]];
  const clients = fr ? ["Bureaux et sièges sociaux", "Cliniques et cabinets", "Restaurants et cafés", "Syndicats de copropriété", "Gestionnaires d'immeubles", "Gestionnaires Airbnb", "Entrepreneurs et promoteurs", "Commerces et boutiques", "Espaces de coworking", "Résidences étudiantes"] : ["Offices and head offices", "Clinics and practices", "Restaurants and cafés", "Condo boards", "Building managers", "Airbnb operators", "Contractors and developers", "Shops and boutiques", "Coworking spaces", "Student residences"];
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale])} />

      {/* HERO: full-bleed video */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-navy-950 text-white">
        <HeroVideo desktop={{ webm: "/media/hero.webm", mp4: "/media/hero.mp4" }} mobile={{ webm: "/media/hero-mobile.webm", mp4: "/media/hero-mobile.mp4" }} poster="/media/hero-poster.jpg" posterMobile="/media/hero-poster-mobile.jpg" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-950/55 to-navy-950/25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-navy-950/40" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="container-x relative flex min-h-[100svh] flex-col justify-end pb-24 pt-32 sm:pb-28 lg:justify-center lg:pb-32">
          <div className="max-w-3xl">
            <span className="pill hero-fade" style={{ "--delay": ".1s" } as React.CSSProperties}><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="sm:hidden">{fr ? "Entretien commercial · Grand Montréal" : "Commercial cleaning · Greater Montréal"}</span><span className="hidden sm:inline">{d.hero.eyebrow}</span></span>
            <h1 className="hero-fade text-h1 mt-6 font-display font-semibold text-white" style={{ "--delay": ".25s" } as React.CSSProperties}>{fr ? <>Des locaux impeccables,<br />une équipe attitrée,<br /><span className="text-amber-400">sans que vous y pensiez.</span></> : <>Spotless premises,<br />a dedicated team,<br /><span className="text-amber-400">without you thinking about it.</span></>}</h1>
            <p className="hero-fade mt-6 max-w-xl text-[18px] leading-relaxed text-white/85" style={{ "--delay": ".4s" } as React.CSSProperties}>{d.hero.sub}</p>
            <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ "--delay": ".55s" } as React.CSSProperties}>
              <Link href={pagePath(locale, "book")} className="btn btn-primary"><I.calendar width={18} height={18} />{d.common.bookNow}</Link>
              <Link href={pagePath(locale, "quote")} className="btn btn-glass">{d.hero.cta}<I.arrow width={18} height={18} /></Link>
            </div>
            <p className="hero-fade mt-3 text-[13px] text-white/60" style={{ "--delay": ".7s" } as React.CSSProperties}>{fr ? "Entreprises et gestionnaires seulement · gratuit et sans engagement" : "Businesses and managers only · free, no commitment"}</p>
          </div>
          <div className="hero-fade mt-10 hidden max-w-md self-end lg:absolute lg:bottom-32 lg:right-8 lg:mt-0 lg:block" style={{ "--delay": ".8s" } as React.CSSProperties}>
            <div className="glass rounded-3xl p-5">
              <p className="eyebrow !text-amber-400">{fr ? "Ligne ouverte 7 h – 21 h" : "Line open 7 a.m. – 9 p.m."}</p>
              <p className="mt-2 text-[15px] text-white/85">{fr ? "Un gestionnaire de compte vous répond, sept jours sur sept. Après 21 h, l'assistant prend le relais et planifie la visite pour vous." : "An account manager answers, seven days a week. After 9 p.m., the assistant takes over and schedules the walkthrough for you."}</p>
              <div className="mt-4 flex gap-2"><a href={`tel:${BIZ.phone}`} className="btn btn-primary !min-h-11 !py-2 flex-1">{BIZ.phoneDisplay}</a><AssistantOpen className="btn btn-light !min-h-11 !py-2">{fr ? "Assistant" : "Assistant"}</AssistantOpen></div>
            </div>
          </div>
          <div className="scroll-cue absolute bottom-6 right-6 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 lg:block" aria-hidden>{fr ? "Défiler" : "Scroll"}</div>
        </div>
        {/* trust bar */}
        <div className="relative border-t border-white/10 bg-navy-950/70 backdrop-blur">
          <div className="container-x grid grid-cols-2 gap-x-6 gap-y-3 py-4 text-[13.5px] text-white/85 md:grid-cols-4">
            {d.hero.proof.map((p, i) => { const Icon = [I.shield, I.users, I.camera, I.clock][i]; return <span key={p} className="flex items-center gap-2"><Icon width={16} height={16} className="shrink-0 text-amber-400" />{p}</span>; })}
          </div>
        </div>
      </section>

      {/* WALKTHROUGH + WHO WE SERVE */}
      <Section className="!pt-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <div className="photo relative flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[2rem] p-8 text-white sm:p-10" style={{ backgroundImage: `linear-gradient(180deg, rgba(15,20,36,.62) 0%, rgba(15,20,36,.78) 45%, rgba(15,20,36,.97) 100%), url(${pic(PHOTO.office) ?? PHOTO.visit}), linear-gradient(135deg,#2c3347,#1b2238)`, textShadow: "0 1px 2px rgba(0,0,0,.45)" }}>
              <p className="eyebrow !text-amber-400">{fr ? "La visite d'évaluation" : "The walkthrough"}</p>
              <h2 className="text-h2 mt-3 font-display font-semibold">{fr ? "Pas de grille de prix. Une visite, puis un montant écrit." : "No price grid. A visit, then a written amount."}</h2>
              <p className="mt-4 max-w-xl text-[16.5px] text-white/85">{fr ? "Chaque local est différent : densité des postes, planchers, horaires, accès. Nous passons 20 minutes sur place, gratuitement, et vous recevez une soumission détaillée par passage et par mois dans les 24 heures. Vous savez exactement ce qui sera fait avant de signer quoi que ce soit." : "Every space is different: workstation density, flooring, hours, access. We spend 20 minutes on site, free of charge, and you receive a detailed quote per visit and per month within 24 hours. You know exactly what gets done before you sign anything."}</p>
              <ul className="mt-5 grid gap-2 text-[14.5px] text-white/85 sm:grid-cols-2">{(fr ? ["Visite gratuite, en semaine, sans engagement", "Soumission écrite en 24 heures, valable 30 jours", "Entente mensuelle, sans durée minimale", "Certificat d'assurance joint à la soumission"] : ["Free weekday visit, no commitment", "Written quote within 24 hours, valid 30 days", "Month-to-month agreement, no minimum term", "Insurance certificate attached to the quote"]).map((x) => <li key={x} className="flex items-center gap-2"><I.check width={16} height={16} className="text-amber-400" strokeWidth={2.5} />{x}</li>)}</ul>
              <div className="mt-6 flex flex-wrap gap-3"><Link href={pagePath(locale, "book")} className="btn btn-primary"><I.calendar width={18} height={18} />{d.common.bookNow}</Link><Link href={pagePath(locale, "quote")} className="btn btn-glass">{d.hero.cta}<I.arrow width={18} height={18} /></Link></div>
            </div>
          </Reveal>
          <Reveal index={1}>
            <div className="relative flex h-full min-h-[460px] flex-col justify-between overflow-hidden rounded-[2rem] bg-navy-950 p-8 text-white sm:p-10">
              <InlineVideo webm="/media/hero-mobile.webm" mp4="/media/hero-mobile.mp4" poster="/media/hero-poster-mobile.jpg" position="center 30%" portraitAlt={{ webm: "/media/hero.webm", mp4: "/media/hero.mp4", poster: "/media/hero-poster.jpg" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/45 via-navy-950/60 to-navy-950/92" aria-hidden />
              <div className="relative">
                <p className="eyebrow !text-amber-400">{fr ? "Entreprises et gestionnaires" : "Businesses and managers"}</p>
                <h2 className="text-h2 mt-3 font-display font-semibold">{fr ? "Nous travaillons avec ceux qui gèrent des lieux, pas des maisons." : "We work with people who run places, not homes."}</h2>
                <p className="mt-4 text-[16.5px] text-white/80">{fr ? "Pas de ménage résidentiel pour particuliers. Toute l'organisation, les horaires de soir et de nuit, la facturation mensuelle et les rapports sont pensés pour des locaux professionnels." : "No residential cleaning for private individuals. The whole operation, evening and night schedules, monthly invoicing and reporting, is built for professional premises."}</p>
              </div>
              <div className="relative mt-8 flex flex-wrap gap-2">{clients.map((c) => <span key={c} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white/90">{c}</span>)}</div>
              <div className="relative mt-6 flex flex-wrap gap-3"><Link href={pagePath(locale, "services")} className="btn btn-primary">{d.nav.services}<I.arrow width={18} height={18} /></Link><a href={`tel:${BIZ.phone}`} className="btn btn-glass"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* EXPERTISES */}
      <Section tone="sand" className="!pt-16">
        <Reveal><Heading eyebrow={d.nav.services} title={fr ? "Quatre réalités, une seule façon de travailler : la bonne." : "Four realities, one way of working: the right one."} sub={d.sections.servicesSub} /></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {expertise.map((s, i) => <Reveal key={s.id} index={i} className="h-full"><Spotlight className="h-full rounded-3xl"><ServiceCard s={s} locale={locale} photo={pic(SERVICE_PHOTO[s.id])} /></Spotlight></Reveal>)}
        </div>
        <Reveal index={2}><div className="mt-6 flex flex-wrap gap-2">{SERVICES.filter((s) => !expertise.includes(s)).map((s) => <Link key={s.id} href={pagePath(locale, "services", s.slug[locale])} className="chip">{s.name[locale]}</Link>)}<Link href={pagePath(locale, "services")} className="chip chip-on">{d.common.seeAll} →</Link></div></Reveal>
      </Section>

      {/* SEASONAL */}
      <Section className="!py-10">
        <Reveal>
          <div className="photo relative overflow-hidden rounded-[2rem] text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(15,20,36,.97) 0%, rgba(15,20,36,.9) 50%, rgba(15,20,36,.55) 100%), url(${pic(PHOTO.lobby) ?? PHOTO.visit}), linear-gradient(135deg,#1b2238,#0f1424)`, textShadow: "0 1px 2px rgba(0,0,0,.45)" }}>
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="eyebrow !text-amber-400">{fr ? "Cet hiver" : "This winter"}</p>
                <h2 className="text-h2 mt-3 font-display font-semibold">{fr ? <>Sel, calcium et gadoue. <span className="text-amber-400">Vos entrées restent nettes</span> jusqu'en avril.</> : <>Salt, calcium and slush. <span className="text-amber-400">Your entrances stay sharp</span> until April.</>}</h2>
                <p className="mt-4 max-w-xl text-[16.5px] text-white/85">{fr ? "Tapis d'hiver changés, halls et escaliers passés plus souvent, traces de sel retirées des planchers avant qu'elles ne les marquent. Un passage renforcé de décembre à mars, inclus dans l'entente des immeubles et des commerces." : "Winter mats rotated, lobbies and stairs done more often, salt streaks lifted off floors before they mark them. A reinforced visit from December to March, included in building and retail agreements."}</p>
                <div className="mt-5 flex flex-wrap gap-2">{(fr ? ["Halls et entrées", "Tapis d'hiver", "Escaliers et ascenseurs", "Vitrines de commerces"] : ["Lobbies and entrances", "Winter mats", "Stairs and elevators", "Shop fronts"]).map((c) => <span key={c} className="pill !normal-case !tracking-normal">{c}</span>)}</div>
                <div className="mt-7 flex flex-wrap gap-3"><Link href={`${pagePath(locale, "book")}?service=property`} className="btn btn-primary">{fr ? "Planifier la visite de mon immeuble" : "Schedule my building's walkthrough"}<I.arrow width={18} height={18} /></Link><a href={`tel:${BIZ.phone}`} className="btn btn-glass"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></div>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* METHOD */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal><Heading eyebrow={d.nav.method} title={fr ? "Notre méthode en quatre étapes" : "Our method in four steps"} sub={fr ? "La plupart des plaintes en nettoyage commercial viennent de passages manqués, d'équipes qui changent et de personne à qui parler. Chaque étape ci-dessous existe pour éliminer l'une de ces trois causes." : "Most commercial cleaning complaints come from missed visits, changing crews and nobody to talk to. Each step below exists to remove one of those three causes."} /><Link href={pagePath(locale, "method")} className="btn btn-dark mt-8">{d.nav.method}<I.arrow width={18} height={18} /></Link></Reveal>
          <ol className="grid gap-4 sm:grid-cols-2">{steps.map(([ti, de], i) => <Reveal key={ti} index={i} as="li"><div className="card h-full p-6"><span className="font-display text-4xl font-semibold text-amber-500">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-3 text-[18px] font-semibold text-navy-950">{ti}</h3><p className="mt-2 text-[15px] leading-relaxed text-ink-600">{de}</p></div></Reveal>)}</ol>
        </div>
      </Section>

      {/* PROOF */}
      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>{hasBeforeAfter ? <BeforeAfter before="/media/before.webp" after="/media/after.webp" ratioClass="aspect-[4/5] max-w-md mx-auto lg:mx-0" labels={fr ? ["Avant", "Après"] : ["Before", "After"]} /> : <img src={pic(MEDIA.report) ?? "/media/after.webp"} alt={fr ? "Rapport photo envoyé après le passage" : "Photo report sent after the visit"} className="aspect-[4/3] w-full rounded-3xl object-cover" />}</Reveal>
          <Reveal index={1}>
            <Heading light eyebrow={fr ? "Des preuves, pas des promesses" : "Proof, not promises"} title={fr ? "Vous voyez ce qui a été fait. À chaque passage." : "You see what was done. Every visit."} sub={fr ? "Un rapport photo horodaté, la liste cochée et signée, l'heure d'arrivée et de départ. Envoyé par courriel dès que l'équipe quitte, archivé pour vos audits et vos assemblées. Glissez le curseur : la même cuisinette, avant et après notre passage." : "A time-stamped photo report, the signed checklist, arrival and departure times. Emailed as soon as the team leaves, archived for your audits and board meetings. Drag the handle: the same kitchenette, before and after our visit."} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">{(fr ? ["Photos horodatées des zones clés", "Liste de vérification signée", "Heures d'arrivée et de départ", "Bouton « un oubli? » dans le rapport"] : ["Time-stamped photos of key areas", "Signed checklist", "Arrival and departure times", "\"Something missed?\" button in the report"]).map((x) => <li key={x} className="flex items-start gap-3 text-[15.5px] text-white/85"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-navy-950"><I.check width={13} height={13} strokeWidth={2.5} /></span>{x}</li>)}</ul>
            <Link href={pagePath(locale, "work")} className="btn btn-primary mt-8">{d.nav.work}<I.arrow width={18} height={18} /></Link>
          </Reveal>
        </div>
      </Section>

      {/* ASSISTANT */}
      <Section className="!py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 text-white">
            <div className="aurora" aria-hidden><div className="aurora-blob a1" /><div className="aurora-blob a2" /><div className="aurora-blob a3" /></div>
            <div className="grain" aria-hidden />
            <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="pill"><span className="h-2 w-2 rounded-full bg-leaf" />{fr ? "En ligne maintenant" : "Online now"}</span>
                <h2 className="text-h2 mt-5 font-display font-semibold">{fr ? "Vos locaux ne dorment jamais. Notre assistant non plus." : "Your premises never sleep. Neither does our assistant."}</h2>
                <p className="mt-4 text-[16.5px] text-white/80">{fr ? "Décrivez vos locaux en une phrase. L'assistant pose les deux ou trois questions utiles, propose les créneaux libres et confirme la visite d'évaluation, en français ou en anglais, à 2 h du matin comme à midi. Un humain reste joignable à chaque étape." : "Describe your premises in one sentence. The assistant asks the two or three useful questions, offers open slots and confirms the walkthrough, in French or English, at 2 a.m. or at noon. A human stays reachable at every step."}</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">{(fr ? [["Décrivez", "Local, superficie, fréquence"], ["Choisissez", "Un créneau de visite réel"], ["Confirmé", "Référence et courriel reçus"]] : [["Describe", "Space, area, frequency"], ["Choose", "A real walkthrough slot"], ["Confirmed", "Reference and email received"]]).map(([a, b]) => <div key={a} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-semibold">{a}</p><p className="mt-1 text-[13.5px] text-white/70">{b}</p></div>)}</div>
                <div className="mt-7 flex flex-wrap gap-3"><AssistantOpen className="btn btn-primary">{d.hero.cta2}<I.chat width={18} height={18} /></AssistantOpen><a href={`tel:${BIZ.phone}`} className="btn btn-light"><I.phone width={18} height={18} />{fr ? "Ou parlez à quelqu'un" : "Or talk to someone"}</a></div>
              </div>
              <div className="glass rounded-3xl p-5 text-[14.5px]">
                {(fr ? [["u", "Bureau de 2 500 pi² à Laval, trois soirs par semaine."], ["a", "Parfait. Pour un bureau de cette taille, je planifie une visite gratuite de 20 minutes; la soumission écrite suit en 24 h. Mardi 11 h ou mercredi 16 h?"], ["u", "Mercredi 16 h."], ["a", "Noté. Il me faut le nom de l'entreprise, votre nom, courriel, téléphone et l'adresse des locaux, et c'est confirmé."]] : [["u", "2,500 sq ft office in Laval, three evenings a week."], ["a", "Great. For an office that size I'll schedule a free 20-minute walkthrough; the written quote follows within 24 h. Tuesday 11:00 or Wednesday 16:00?"], ["u", "Wednesday 16:00."], ["a", "Noted. I just need the company name, your name, email, phone and the premises address, and it's confirmed."]]).map(([r, txt], i) => <div key={i} className={`flex ${r === "u" ? "justify-end" : ""} ${i ? "mt-3" : ""}`}><p className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${r === "u" ? "bg-amber-500 text-navy-950" : "bg-white/10 text-white"}`}>{txt}</p></div>)}
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* CERTIFICATIONS */}
      <Section tone="sand">
        <Reveal><Heading eyebrow={fr ? "Conformité" : "Compliance"} title={fr ? "Certifications et conformité" : "Certifications and compliance"} sub={fr ? "Ce que votre service des achats, votre syndicat ou votre assureur demande avant de signer. Tout est joint à la soumission." : "What your procurement team, your board or your insurer asks before signing. All of it comes with the quote."} /></Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{certs.map(([ti, de], i) => { const Icon = [I.shield, I.check, I.users, I.leaf][i]; return <Reveal key={ti} index={i}><div className="card h-full p-6"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600"><Icon width={22} height={22} /></span><h3 className="mt-4 text-[17px] font-semibold text-navy-950">{ti}</h3><p className="mt-1.5 text-[14.5px] text-ink-600">{de}</p></div></Reveal>; })}</div>
      </Section>

      {/* REAL WORK */}
      <Section>
        <Reveal><Heading eyebrow={d.nav.work} title={fr ? "De la cuisine de restaurant au hall d'immeuble : de vrais lieux, de vrais résultats" : "From restaurant kitchen to building lobby: real places, real results"} /></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[[PHOTO.restaurant, fr ? "Restaurants" : "Restaurants", fr ? "Dégraissage nocturne et registre MAPAQ" : "Night degreasing and MAPAQ log", "restaurant"], [PHOTO.airbnb, fr ? "Locations court terme" : "Short-term rentals", fr ? "Rotations de 4 heures, rapport photo" : "4-hour turnovers, photo report", "airbnb"], [pic(SERVICE_PHOTO.property) ?? PHOTO.visit, fr ? "Gestion immobilière" : "Property management", fr ? "Un seul contact pour tous vos immeubles" : "One contact for all your buildings", "property"]].map(([img, ti, de, id], i) => { const s = SERVICES.find((x) => x.id === id)!; return (
            <Reveal key={ti} index={i}><Link href={pagePath(locale, "services", s.slug[locale])} className="photo group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl p-6 text-white" style={{ backgroundImage: `linear-gradient(180deg, rgba(15,20,36,.1) 35%, rgba(15,20,36,.95)), url(${img}), linear-gradient(135deg,#2c3347,#1b2238)`, textShadow: "0 1px 2px rgba(0,0,0,.45)" }}><p className="eyebrow !text-amber-400">{ti}</p><p className="mt-2 text-[19px] font-semibold leading-snug">{de}</p><span className="mt-3 flex items-center gap-1 text-[14px] font-semibold text-white/85 transition-transform group-hover:translate-x-1">{d.common.learnMore}<I.arrow width={16} height={16} /></span></Link></Reveal>); })}
        </div>
      </Section>

      {/* ZONES marquee */}
      <Section tone="sand" className="!py-14">
        <Reveal><Heading eyebrow={d.sections.zonesTitle} title={fr ? "Partout dans le Grand Montréal" : "Everywhere in Greater Montréal"} sub={fr ? "Des équipes basées dans chaque secteur, pour des passages de soir et de nuit fiables." : "Teams based in each area, for reliable evening and night visits."} /></Reveal>
        <div className="mt-8"><Marquee>{ZONES.flatMap((z) => z.sectors).map((s, i) => <span key={`${s}${i}`} className="mx-2 rounded-full border border-line bg-white px-4 py-2 text-[14px] font-medium text-ink-700">{s}</span>)}</Marquee></div>
        <div className="mt-6 flex flex-wrap gap-2">{ZONES.map((z) => <Link key={z.id} href={pagePath(locale, "zones", z.slug[locale])} className="chip">{z.name[locale]}</Link>)}</div>
      </Section>

      <Reviews locale={locale} />

      {/* GUIDES */}
      <Section>
        <Reveal><Heading eyebrow={d.nav.blog} title={fr ? "Bien décider avant de signer" : "Decide well before you sign"} /></Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{POSTS.slice(0, 3).map((p, i) => <Reveal key={p.id} index={i}><Link href={pagePath(locale, "blog", p.slug[locale])} className="card flex h-full flex-col p-6 hover:shadow-lift"><p className="text-[12.5px] text-ink-500">{p.readMin} {d.common.minRead}</p><h3 className="mt-2 text-[18px] font-semibold leading-snug text-navy-950">{p.title[locale]}</h3><p className="mt-2 flex-1 text-[14.5px] text-ink-600">{p.excerpt[locale]}</p><span className="mt-4 text-[14px] font-semibold text-amber-ink">{d.common.readMore} →</span></Link></Reveal>)}</div>
      </Section>

      {/* FAQ */}
      <Section tone="sand"><div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]"><Reveal><Heading eyebrow="FAQ" title={d.sections.faqTitle} sub={fr ? "Pas de réponse à votre question? L'assistant ou le (514) 260-5194." : "Can't find your answer? Ask the assistant or call (514) 260-5194."} /></Reveal><Reveal index={1}><Faq items={FAQ[locale]} /></Reveal></div></Section>

      {/* FINAL CTA */}
      <Section className="!pb-0">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 p-8 text-white sm:p-14">
            <div className="aurora" aria-hidden><div className="aurora-blob a1" /><div className="aurora-blob a2" /></div><div className="grain" aria-hidden />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div><h2 className="text-h2 font-display font-semibold">{d.sections.ctaTitle}</h2><p className="mt-4 text-[17px] text-white/80">{d.sections.ctaSub}</p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">{d.hero.proof.map((p) => <li key={p} className="flex items-center gap-2 text-[14.5px] text-white/85"><I.check width={16} height={16} className="text-amber-400" strokeWidth={2.5} />{p}</li>)}</ul></div>
              <div className="glass rounded-3xl p-6"><h3 className="text-[18px] font-semibold">{fr ? "Planifier la visite gratuite" : "Schedule the free walkthrough"}</h3><p className="mt-2 text-[14.5px] text-white/75">{fr ? "Choisissez un créneau en ligne, ou un appel de cinq minutes. Soumission écrite dans les 24 heures suivant la visite." : "Pick a slot online, or a five-minute call. Written quote within 24 hours of the visit."}</p><div className="mt-5 flex flex-col gap-2"><Link href={pagePath(locale, "book")} className="btn btn-primary">{d.common.bookNow}</Link><Link href={pagePath(locale, "quote")} className="btn btn-light">{d.hero.cta}</Link><a href={`tel:${BIZ.phone}`} className="btn btn-glass"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></div></div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
