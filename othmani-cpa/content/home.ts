/**
 * Contenu supplémentaire de l'accueil (FR + EN) : services, premier rendez-vous, engagements, FAQ.
 * ⚠️ Les engagements et la FAQ décrivent des pratiques courantes d'un cabinet de CPA :
 *    faites-les valider par le cabinet avant la mise en ligne définitive.
 */
export const homeText = {
  fr: {
    services: {
      eyebrow: "Nos services",
      h2: "Tout ce qu'on peut faire pour vous",
      intro: "Un seul cabinet pour votre famille et votre entreprise. Vous avez un interlocuteur qui connaît l'ensemble de votre situation.",
      me: "Pour vous et votre famille",
      biz: "Pour votre entreprise",
      seeAll: "Voir le détail",
    },
    meeting: {
      eyebrow: "Votre premier rendez-vous",
      h2: "Ce qui se passe quand vous nous appelez",
      intro: "Pas de surprise. Voici exactement comment se déroule le début de notre collaboration.",
      steps: [
        {
          t: "Avant",
          d: "Un court appel ou un message pour comprendre votre situation. Nous vous disons quels documents préparer.",
          list: ["Votre dernier avis de cotisation", "Les lettres reçues de l'impôt, s'il y a lieu", "Vos feuillets ou vos relevés de l'année"],
        },
        {
          t: "Pendant",
          d: "Une rencontre, au bureau ou à distance. On écoute, on explique vos options en mots simples.",
          list: ["Ce qui doit être fait, et quand", "Ce qui peut vous faire économiser", "Une estimation des honoraires et des délais"],
        },
        {
          t: "Après",
          d: "Vous recevez une lettre de mission qui confirme par écrit ce que nous faisons pour vous.",
          list: ["Le mandat et son échéancier", "La liste des documents à fournir", "Un suivi à chaque étape importante"],
        },
      ],
    },
    commitments: {
      eyebrow: "Nos engagements",
      h2: "Ce que vous pouvez attendre de nous",
      items: [
        { t: "Une réponse rapide", d: "Nous répondons en général dans un délai d'un jour ouvrable.", icon: "clock" },
        { t: "Des honoraires clairs", d: "Vous connaissez l'estimation avant que le travail commence. Pas de facture surprise.", icon: "receipt" },
        { t: "Le secret professionnel", d: "Vos renseignements sont protégés par le secret professionnel et la Loi 25.", icon: "shield" },
        { t: "Vos échéances suivies", d: "Nous suivons vos dates importantes et vous prévenons à l'avance.", icon: "bell" },
      ],
    },
    faq: {
      eyebrow: "Questions générales",
      h2: "Avant de nous écrire",
      items: [
        { q: "Combien coûtent vos services ?", a: "Les honoraires dépendent de la complexité de votre dossier et du temps requis. Avant de commencer, nous vous donnons une estimation et nous la confirmons par écrit dans une lettre de mission. Vous savez à quoi vous attendre." },
        { q: "Faut-il prendre rendez-vous ?", a: "Oui, de préférence. Un rendez-vous nous permet de vous consacrer le temps nécessaire. Écrivez-nous ou appelez-nous : nous trouvons un moment qui vous convient, au bureau ou à distance." },
        { q: "Servez-vous des clients en dehors de Saint-Léonard ?", a: "Oui. Nous servons Saint-Léonard, Anjou, Saint-Michel, Montréal-Nord, Rivière-des-Prairies et l'ensemble de Montréal. Une bonne partie du travail peut se faire à distance." },
        { q: "Pouvez-vous reprendre mon dossier d'un autre comptable ?", a: "Oui. Avec votre autorisation, nous récupérons l'historique nécessaire et les documents de l'année précédente. Vous n'avez pas à tout recommencer." },
        { q: "Travaillez-vous en anglais ?", a: "Oui. Nous vous servons en français ou en anglais, selon votre préférence. Vos documents peuvent être dans l'une ou l'autre langue." },
        { q: "J'ai reçu une lettre urgente de l'impôt. Que faire ?", a: "Notez la date limite inscrite sur la lettre et écrivez-nous rapidement avec une photo de la lettre. Nous vous disons si c'est urgent et ce qu'il faut faire. Ne laissez pas la lettre sans réponse." },
      ],
    },
  },
  en: {
    services: {
      eyebrow: "Our services",
      h2: "Everything we can do for you",
      intro: "One firm for your family and your business. You have one contact who knows your whole situation.",
      me: "For you and your family",
      biz: "For your business",
      seeAll: "See the details",
    },
    meeting: {
      eyebrow: "Your first meeting",
      h2: "What happens when you call us",
      intro: "No surprises. Here is exactly how our work together begins.",
      steps: [
        {
          t: "Before",
          d: "A short call or message to understand your situation. We tell you which documents to prepare.",
          list: ["Your latest notice of assessment", "Any letters from the tax authorities", "Your slips or statements for the year"],
        },
        {
          t: "During",
          d: "A meeting, at the office or remotely. We listen and explain your options in plain language.",
          list: ["What needs to be done, and when", "What could save you money", "An estimate of fees and timelines"],
        },
        {
          t: "After",
          d: "You receive an engagement letter that confirms in writing what we will do for you.",
          list: ["The engagement and its timeline", "The list of documents to provide", "Follow-up at every key step"],
        },
      ],
    },
    commitments: {
      eyebrow: "Our commitments",
      h2: "What you can expect from us",
      items: [
        { t: "A quick reply", d: "We usually reply within one business day.", icon: "clock" },
        { t: "Clear fees", d: "You know the estimate before work begins. No surprise invoices.", icon: "receipt" },
        { t: "Professional secrecy", d: "Your information is protected by professional secrecy and Quebec's Law 25.", icon: "shield" },
        { t: "Your deadlines tracked", d: "We track your key dates and let you know ahead of time.", icon: "bell" },
      ],
    },
    faq: {
      eyebrow: "General questions",
      h2: "Before you write to us",
      items: [
        { q: "How much do your services cost?", a: "Fees depend on how complex your file is and the time required. Before we start, we give you an estimate and confirm it in writing in an engagement letter. You know what to expect." },
        { q: "Do I need an appointment?", a: "Yes, preferably. An appointment lets us give you the time you need. Write or call us and we'll find a time that works for you, at the office or remotely." },
        { q: "Do you serve clients outside Saint-Léonard?", a: "Yes. We serve Saint-Léonard, Anjou, Saint-Michel, Montréal-Nord, Rivière-des-Prairies and all of Montreal. Much of the work can be done remotely." },
        { q: "Can you take over my file from another accountant?", a: "Yes. With your authorization, we retrieve the history we need and last year's documents. You don't have to start over." },
        { q: "Do you work in English?", a: "Yes. We serve you in English or French, as you prefer. Your documents can be in either language." },
        { q: "I received an urgent letter from the tax authorities. What should I do?", a: "Note the deadline on the letter and write to us quickly with a photo of it. We'll tell you whether it's urgent and what to do. Don't leave the letter unanswered." },
      ],
    },
  },
};
