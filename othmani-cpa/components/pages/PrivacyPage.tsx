import { dict } from "@/content/ui";
import type { Lang } from "@/lib/site";
import { site } from "@/lib/site";
import { PageHeader } from "../blocks";
import { CookieSettingsButton } from "../CookieBanner";
import { AddressLines, EmailLink, PhoneLink } from "../ContactInfo";
import { Shell } from "../Shell";

type Block = { id?: string; h2: string; p?: string[]; list?: string[] };

const UPDATED = "2026-11-18";

const fr: Block[] = [
  {
    h2: "En bref",
    p: [
      "Vos renseignements personnels vous appartiennent. Nous recueillons seulement ce qui est nécessaire pour vous servir, nous les protégeons et nous ne les vendons jamais.",
      "Cette politique explique comment Othmani CPA Inc. recueille, utilise, communique, conserve et détruit vos renseignements, conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (telle que modifiée par la Loi 25) et à nos obligations professionnelles de secret.",
    ],
  },
  {
    h2: "Responsable de la protection des renseignements personnels",
    p: ["Zouhaier Othmani, CPA auditeur, est responsable de la protection des renseignements personnels du cabinet. Vous pouvez le joindre aux coordonnées indiquées au bas de cette page."],
  },
  {
    h2: "Les renseignements que nous recueillons",
    list: [
      "Par le formulaire de contact : votre nom, votre courriel, votre téléphone (facultatif) et votre message",
      "Par l'inscription aux rappels : votre courriel",
      "Dans le cadre d'un mandat : les documents et renseignements nécessaires à vos déclarations ou à votre mission (feuillets, numéro d'assurance sociale, renseignements financiers), transmis de façon sécuritaire",
      "Lors de votre visite du site : seulement les données techniques nécessaires à son fonctionnement et, avec votre consentement, des statistiques anonymes",
    ],
  },
  {
    h2: "Pourquoi nous les utilisons",
    list: [
      "Répondre à vos demandes et prendre rendez-vous",
      "Réaliser le mandat que vous nous confiez",
      "Vous envoyer des rappels fiscaux, si vous l'avez demandé",
      "Respecter nos obligations légales et professionnelles",
    ],
    p: ["Nous n'utilisons pas vos renseignements à d'autres fins sans votre consentement, sauf si la loi le permet."],
  },
  {
    h2: "Qui peut y avoir accès",
    p: [
      "Seuls les membres de l'équipe qui en ont besoin pour vous servir. Nous sommes tenus au secret professionnel.",
      "Nous pouvons faire appel à des fournisseurs (hébergement du site, réception des formulaires, transfert sécurisé de documents, logiciels fiscaux). Ils sont liés par contrat et ne peuvent utiliser vos renseignements que pour nous rendre service. Certains peuvent conserver des données à l'extérieur du Québec ; nous évaluons alors les risques avant de leur communiquer des renseignements, comme l'exige la loi.",
      "Les demandes envoyées par le formulaire de contact et les inscriptions aux rappels fiscaux sont enregistrées dans une base de données hébergée au Canada (fournisseur : Supabase), accessible seulement à l'équipe du cabinet.",
      "Avec votre autorisation, nous transmettons des renseignements à Revenu Québec et à l'Agence du revenu du Canada.",
    ],
  },
  {
    h2: "Combien de temps nous les conservons",
    p: [
      "Les messages reçus par le site qui ne mènent pas à un mandat sont détruits dans un délai raisonnable. Les dossiers clients sont conservés pendant la durée exigée par les lois fiscales et par les règles de l'Ordre des CPA du Québec, puis détruits de façon sécuritaire. Votre inscription aux rappels prend fin dès que vous vous désinscrivez.",
    ],
  },
  {
    id: "temoins",
    h2: "Témoins (cookies)",
    p: [
      "Par défaut, seuls les témoins nécessaires sont utilisés. Ils mémorisent vos choix de confidentialité, dans votre navigateur.",
      "Aucun témoin de mesure d'audience ou de publicité n'est activé sans votre consentement. La carte de notre bureau, fournie par OpenStreetMap, ne se charge que si vous cliquez ou si vous l'acceptez. Clara, l'assistante du site, fonctionne entièrement dans votre navigateur et n'enregistre pas vos messages. Les outils (liste de documents, calculatrices) gardent vos saisies dans votre navigateur seulement ; rien ne nous est transmis.",
      "Vous pouvez modifier vos choix en tout temps.",
    ],
  },
  {
    h2: "Vos droits",
    list: [
      "Accéder aux renseignements que nous détenons sur vous",
      "Les faire corriger s'ils sont inexacts ou incomplets",
      "Retirer votre consentement",
      "Demander la cessation de la diffusion ou la désindexation, dans les cas prévus par la loi",
      "Recevoir vos renseignements dans un format technologique structuré et couramment utilisé, dans les cas prévus par la loi",
      "Porter plainte auprès de la Commission d'accès à l'information du Québec",
    ],
    p: ["Pour exercer vos droits, écrivez au responsable de la protection des renseignements personnels. Nous répondons dans un délai de 30 jours."],
  },
  {
    h2: "Sécurité et incidents",
    p: [
      "Nous protégeons vos renseignements par des mesures adaptées : transferts chiffrés, accès limité, mots de passe robustes. En cas d'incident de confidentialité présentant un risque de préjudice sérieux, nous vous aviserons, ainsi que la Commission d'accès à l'information, et nous tenons un registre des incidents.",
    ],
  },
];

const en: Block[] = [
  {
    h2: "In short",
    p: [
      "Your personal information belongs to you. We only collect what we need to serve you, we protect it and we never sell it.",
      "This policy explains how Othmani CPA Inc. collects, uses, discloses, retains and destroys your information, in accordance with Quebec's Act respecting the protection of personal information in the private sector (as amended by Law 25) and our professional secrecy obligations.",
    ],
  },
  {
    h2: "Person in charge of the protection of personal information",
    p: ["Zouhaier Othmani, CPA auditor, is responsible for the protection of personal information at the firm. You can reach him using the contact details at the bottom of this page."],
  },
  {
    h2: "Information we collect",
    list: [
      "Through the contact form: your name, email, phone (optional) and message",
      "Through the reminder sign-up: your email",
      "During an engagement: the documents and information needed for your returns or engagement (slips, social insurance number, financial information), sent to us securely",
      "When you visit the site: only the technical data needed for it to work and, with your consent, anonymous statistics",
    ],
  },
  {
    h2: "Why we use it",
    list: [
      "To answer your requests and book appointments",
      "To carry out the engagement you entrust to us",
      "To send you tax reminders, if you asked for them",
      "To meet our legal and professional obligations",
    ],
    p: ["We don't use your information for other purposes without your consent, unless the law allows it."],
  },
  {
    h2: "Who can access it",
    p: [
      "Only team members who need it to serve you. We are bound by professional secrecy.",
      "We may use service providers (website hosting, form handling, secure document transfer, tax software). They are bound by contract and may only use your information to provide services to us. Some may store data outside Quebec; we assess the risks before sharing information with them, as the law requires.",
      "Requests sent through the contact form and tax reminder sign-ups are stored in a database hosted in Canada (provider: Supabase), accessible only to the firm's team.",
      "With your authorization, we send information to Revenu Québec and the Canada Revenue Agency.",
    ],
  },
  {
    h2: "How long we keep it",
    p: [
      "Website messages that don't lead to an engagement are destroyed within a reasonable time. Client files are kept for the period required by tax laws and by the rules of the Ordre des CPA du Québec, then securely destroyed. Your reminder subscription ends as soon as you unsubscribe.",
    ],
  },
  {
    id: "temoins",
    h2: "Cookies",
    p: [
      "By default, only necessary cookies are used. They remember your privacy choices, in your browser.",
      "No audience measurement or advertising cookies are turned on without your consent. The map of our office, provided by OpenStreetMap, only loads if you click or accept it. Clara, the site assistant, runs entirely in your browser and doesn't store your messages. The tools (document checklist, calculators) keep your entries in your browser only; nothing is sent to us.",
      "You can change your choices at any time.",
    ],
  },
  {
    h2: "Your rights",
    list: [
      "Access the information we hold about you",
      "Have it corrected if it is inaccurate or incomplete",
      "Withdraw your consent",
      "Request that dissemination stop or de-indexing, in the cases provided by law",
      "Receive your information in a structured, commonly used technological format, in the cases provided by law",
      "File a complaint with the Commission d'accès à l'information du Québec",
    ],
    p: ["To exercise your rights, write to the person in charge of the protection of personal information. We reply within 30 days."],
  },
  {
    h2: "Security and incidents",
    p: [
      "We protect your information with appropriate measures: encrypted transfers, limited access, strong passwords. If a confidentiality incident presents a risk of serious injury, we will notify you and the Commission d'accès à l'information, and we keep a register of incidents.",
    ],
  },
];

export function PrivacyPage({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const blocks = lang === "fr" ? fr : en;
  const title = lang === "fr" ? "Politique de confidentialité" : "Privacy policy";
  const updated = new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(UPDATED + "T12:00:00Z"));
  return (
    <Shell lang={lang} routeKey="privacy">
      <PageHeader lang={lang} crumbs={[{ name: t.footer.privacy, key: "privacy" }]} title={title} intro={<p>{lang === "fr" ? "Dernière mise à jour : " : "Last updated: "}<time dateTime={UPDATED}>{updated}</time></p>} />
      <div className="container-site py-16">
        <div className="prose-site max-w-3xl space-y-12">
          {blocks.map((b) => (
            <section key={b.h2} id={b.id} aria-labelledby={`pv-${b.h2.length}-${b.h2.slice(0, 6).replace(/\W/g, "")}`}>
              <h2 id={`pv-${b.h2.length}-${b.h2.slice(0, 6).replace(/\W/g, "")}`} className="mb-5 text-2xl font-semibold">{b.h2}</h2>
              {b.list && <ul>{b.list.map((l) => <li key={l}>{l}</li>)}</ul>}
              {b.p?.map((p) => <p key={p}>{p}</p>)}
              {b.id === "temoins" && (
                <CookieSettingsButton label={t.footer.cookies} className="btn-secondary mt-2 cursor-pointer" />
              )}
            </section>
          ))}
          <section aria-labelledby="pv-contact" className="card p-7">
            <h2 id="pv-contact" className="mb-4 text-2xl font-semibold">{lang === "fr" ? "Nous joindre" : "Contact us"}</h2>
            <address className="space-y-1 leading-relaxed not-italic">
              <p className="font-semibold">{site.owner}, {site.ownerTitle[lang]}</p>
              <p>{site.name}</p>
              <p><AddressLines lang={lang} /></p>
              <p><EmailLink lang={lang} className="text-navy underline underline-offset-4" /></p>
              <p><PhoneLink lang={lang} className="text-navy underline underline-offset-4" /></p>
            </address>
          </section>
        </div>
      </div>
    </Shell>
  );
}
