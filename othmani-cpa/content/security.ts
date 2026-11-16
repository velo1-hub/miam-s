/**
 * Section « Sécurité et confidentialité » (FR + EN).
 * ⚠️ Chaque affirmation doit rester vraie : elles reposent sur les obligations légales et
 * professionnelles d'un CPA au Québec et sur la politique de confidentialité du site.
 * N'ajoutez une mesure technique (chiffrement, hébergement, etc.) que si le cabinet l'applique réellement.
 */
export const security = {
  fr: {
    eyebrow: "Sécurité et confidentialité",
    h2: "Vos renseignements sont entre bonnes mains",
    intro: "Vous nous confiez vos revenus, votre numéro d'assurance sociale, les chiffres de votre entreprise. Voici ce qui les protège.",
    pillar: { t: "Secret professionnel", d: "Comme CPA, nous sommes tenus par la loi de garder confidentiel tout ce que vous nous confiez. Ce n'est pas une promesse commerciale : c'est une obligation professionnelle.",
      coversTitle: "Ce qu'il couvre",
      covers: ["Vos revenus, vos feuillets et vos déclarations", "Votre numéro d'assurance sociale", "Les chiffres et les contrats de votre entreprise", "Tout ce que vous nous dites, par écrit ou de vive voix"],
      foot: "Une obligation prévue par le Code des professions du Québec",
    },
    items: [
      { icon: "shield", t: "Protégé par la Loi 25", d: "Zouhaier Othmani est le responsable de la protection des renseignements personnels du cabinet. Vous pouvez consulter, corriger ou faire retirer vos renseignements." },
      { icon: "badge", t: "Encadré par l'Ordre des CPA", d: "Le cabinet est soumis au Code de déontologie des CPA et à l'inspection professionnelle de l'Ordre." },
      { icon: "user", t: "Un accès limité", d: "Seules les personnes qui travaillent sur votre dossier y ont accès." },
      { icon: "check", t: "Jamais vendus, jamais partagés", d: "Nous ne vendons pas vos renseignements. Nous ne les transmettons à Revenu Québec ou à l'ARC qu'avec votre autorisation." },
      { icon: "clock", t: "Conservés puis détruits", d: "Vos documents sont gardés le temps exigé par les lois fiscales et les règles de l'Ordre, puis détruits de façon sécuritaire." },
      { icon: "globe", t: "Un site qui ne vous piste pas", d: "Aucun témoin de suivi ou de publicité n'est activé sans votre accord. Les outils du site gardent vos saisies sur votre appareil." },
    ],
    fraud: {
      t: "Méfiez-vous des faux appels de l'impôt",
      d: "Des fraudeurs se font passer pour l'ARC, Revenu Québec ou même pour un cabinet comptable. Retenez ceci :",
      list: [
        "Nous ne vous demanderons jamais un mot de passe ni un paiement par carte-cadeau, cryptomonnaie ou virement à un inconnu.",
        "N'envoyez jamais votre numéro d'assurance sociale par courriel ordinaire ou par texto. Demandez-nous comment le transmettre.",
        "Un doute sur un appel, un courriel ou une lettre ? Appelez-nous avant de répondre.",
      ],
    },
    link: "Lire la politique de confidentialité",
  },
  en: {
    eyebrow: "Security and confidentiality",
    h2: "Your information is in good hands",
    intro: "You trust us with your income, your social insurance number, your business figures. Here is what protects them.",
    pillar: { t: "Professional secrecy", d: "As CPAs, we are bound by law to keep everything you tell us confidential. It isn't a marketing promise: it's a professional obligation.",
      coversTitle: "What it covers",
      covers: ["Your income, slips and tax returns", "Your social insurance number", "Your business figures and contracts", "Everything you tell us, in writing or in person"],
      foot: "An obligation set out in Quebec's Professional Code",
    },
    items: [
      { icon: "shield", t: "Protected by Quebec's Law 25", d: "Zouhaier Othmani is the firm's person in charge of the protection of personal information. You can view, correct or withdraw your information." },
      { icon: "badge", t: "Overseen by the Ordre des CPA", d: "The firm is subject to the CPA Code of Ethics and to the Ordre's professional inspection." },
      { icon: "user", t: "Limited access", d: "Only the people working on your file can access it." },
      { icon: "check", t: "Never sold, never shared", d: "We don't sell your information. We only send it to Revenu Québec or the CRA with your authorization." },
      { icon: "clock", t: "Kept, then destroyed", d: "Your documents are kept for as long as tax laws and the Ordre's rules require, then securely destroyed." },
      { icon: "globe", t: "A site that doesn't track you", d: "No tracking or advertising cookies are turned on without your consent. The site's tools keep what you type on your device." },
    ],
    fraud: {
      t: "Beware of fake tax calls",
      d: "Scammers pose as the CRA, Revenu Québec or even an accounting firm. Remember this:",
      list: [
        "We will never ask you for a password, or for payment by gift card, cryptocurrency or transfer to a stranger.",
        "Never send your social insurance number by regular email or text. Ask us how to send it.",
        "Unsure about a call, an email or a letter? Call us before you reply.",
      ],
    },
    link: "Read the privacy policy",
  },
};
