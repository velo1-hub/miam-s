import type { RouteKey } from "@/lib/routes";

export type Section = { h2: string; paras?: string[]; list?: string[]; after?: string[] };
export type QA = { q: string; a: string };
export type ConcernText = {
  /** Libellé court utilisé dans les « portes » de l'accueil */
  label: string;
  /** Balise <title> : moins de 60 caractères (le nom du cabinet n'est pas ajouté) */
  title: string;
  /** Meta description : moins de 155 caractères */
  description: string;
  /** H1 : la vraie question du client */
  h1: string;
  /** Réponse simple, en haut de page */
  answer: string;
  /** Phrase courte pour les cartes et les liens internes */
  teaser: string;
  sections: Section[];
  faq: QA[];
};
export type Concern = {
  key: RouteKey;
  audience: "individuals" | "businesses";
  icon: "receipt" | "letter" | "laptop" | "home" | "rocket" | "percent" | "chart" | "layers";
  related: RouteKey[];
  fr: ConcernText;
  en: ConcernText;
};

export const concerns: Concern[] = [
  /* ───────────────────────── 1. Mes impôts ───────────────────────── */
  {
    key: "personalTaxes",
    audience: "individuals",
    icon: "receipt",
    related: ["lifeChanges", "taxLetter", "selfEmployed"],
    fr: {
      label: "Mes impôts",
      title: "Déclaration de revenus à Saint-Léonard | CPA",
      description:
        "Faire vos impôts au Québec sans stress : un CPA à Saint-Léonard prépare vos déclarations fédérale et provinciale. Dépôt de documents en ligne.",
      h1: "Comment faire mes impôts au Québec sans stress ?",
      answer:
        "Au Québec, vous produisez deux déclarations : une au fédéral, une au provincial. La date limite est le 30 avril. Le plus simple : rassemblez vos feuillets, transmettez-les-nous, et un CPA s'occupe du reste.",
      teaser: "Vos deux déclarations, préparées par un CPA, sans courir après les papiers.",
      sections: [
        {
          h2: "Deux déclarations, une seule démarche pour vous",
          paras: [
            "Au Québec, on déclare ses revenus deux fois : à l'Agence du revenu du Canada (ARC) et à Revenu Québec. Les règles se ressemblent, mais pas tout à fait.",
            "Vous n'avez pas à gérer ces différences. Vous nous confiez vos documents une fois. Nous préparons les deux déclarations et vous expliquons le résultat en mots simples.",
          ],
        },
        {
          h2: "Les documents à rassembler",
          list: [
            "Vos feuillets de revenus : T4 et Relevé 1 (emploi), T4A, T5 et Relevé 3 (placements), pensions",
            "Vos reçus de cotisations REER et CELIAPP",
            "Vos reçus de frais médicaux, de dons et de frais de garde",
            "Votre Relevé 31 si vous êtes locataire",
            "Votre avis de cotisation de l'an dernier, si vous êtes un nouveau client",
          ],
          after: [
            "Il vous manque un papier ? Ce n'est pas grave. Déposez ce que vous avez. Nous vous dirons ce qui manque.",
          ],
        },
        {
          h2: "Ce que nous vérifions pour vous",
          paras: [
            "Nous regardons les crédits auxquels vous avez droit : frais médicaux, dons, frais de garde, solidarité, maintien à domicile des aînés, etc. Nous vérifions aussi si le partage de certains revenus avec votre conjoint est avantageux.",
            "Avant de transmettre, nous vous montrons le résultat : remboursement ou solde à payer. Aucune surprise.",
          ],
        },
        {
          h2: "Les dates à retenir",
          list: [
            "30 avril : date limite pour produire et pour payer un solde dû",
            "15 juin : date limite de production si vous ou votre conjoint êtes travailleur autonome (le solde reste dû le 30 avril)",
          ],
        },
      ],
      faq: [
        {
          q: "Quelle est la date limite pour faire mes impôts au Québec ?",
          a: "Le 30 avril, pour les deux déclarations. Si vous ou votre conjoint êtes travailleur autonome, vous avez jusqu'au 15 juin pour produire. Tout solde à payer reste dû le 30 avril.",
        },
        {
          q: "Que se passe-t-il si je produis en retard ?",
          a: "Si vous avez un solde à payer, des pénalités et des intérêts s'ajoutent. Si vous attendez un remboursement, il n'y a généralement pas de pénalité, mais vos prestations (comme le crédit de solidarité) peuvent être retardées. Mieux vaut produire, même en retard.",
        },
        {
          q: "Puis-je vous envoyer mes documents sans me déplacer ?",
          a: "Oui. Vous pouvez nous transmettre vos documents à distance, de façon sécuritaire, ou venir au bureau de Saint-Léonard. Nous vous indiquons la marche à suivre dès votre premier contact.",
        },
        {
          q: "Je n'ai pas fait mes impôts depuis plusieurs années. Que faire ?",
          a: "On peut régulariser la situation, une année à la fois. Plus tôt vous agissez, plus vous limitez les intérêts. Écrivez-nous : nous verrons ensemble par où commencer.",
        },
        {
          q: "Préparez-vous les déclarations de toute la famille ?",
          a: "Oui. Préparer les déclarations des conjoints ensemble permet de vérifier les crédits transférables et le fractionnement de certains revenus. Les déclarations des enfants aux études peuvent aussi être faites.",
        },
      ],
    },
    en: {
      label: "My taxes",
      title: "Personal tax returns in Saint-Léonard | CPA",
      description:
        "File your Quebec taxes without the stress. A CPA in Saint-Léonard prepares your federal and provincial returns. Upload your documents online.",
      h1: "How do I file my taxes in Quebec without the stress?",
      answer:
        "In Quebec, you file two returns: one federal, one provincial. The deadline is April 30. The simplest way: gather your slips, send them to us, and a CPA takes care of the rest.",
      teaser: "Both of your returns, prepared by a CPA, without chasing paperwork.",
      sections: [
        {
          h2: "Two returns, one simple process for you",
          paras: [
            "In Quebec, you report your income twice: to the Canada Revenue Agency (CRA) and to Revenu Québec. The rules are similar, but not identical.",
            "You don't have to manage those differences. You send us your documents once. We prepare both returns and explain the result in plain language.",
          ],
        },
        {
          h2: "Documents to gather",
          list: [
            "Your income slips: T4 and RL-1 (employment), T4A, T5 and RL-3 (investments), pensions",
            "Your RRSP and FHSA contribution receipts",
            "Receipts for medical expenses, donations and childcare",
            "Your RL-31 if you rent your home",
            "Last year's notice of assessment, if you are a new client",
          ],
          after: ["Missing a document? That's fine. Upload what you have. We'll tell you what's missing."],
        },
        {
          h2: "What we check for you",
          paras: [
            "We look at the credits you are entitled to: medical expenses, donations, childcare, the solidarity tax credit, home support for seniors, and more. We also check whether splitting certain income with your spouse helps.",
            "Before filing, we show you the result: refund or balance owing. No surprises.",
          ],
        },
        {
          h2: "Key dates",
          list: [
            "April 30: deadline to file and to pay any balance owing",
            "June 15: filing deadline if you or your spouse are self-employed (any balance is still due April 30)",
          ],
        },
      ],
      faq: [
        {
          q: "What is the tax filing deadline in Quebec?",
          a: "April 30, for both returns. If you or your spouse are self-employed, you have until June 15 to file. Any balance owing is still due April 30.",
        },
        {
          q: "What happens if I file late?",
          a: "If you owe money, penalties and interest are added. If you are expecting a refund, there is usually no penalty, but benefits such as the solidarity tax credit can be delayed. It's always better to file, even late.",
        },
        {
          q: "Can I send my documents without coming in?",
          a: "Yes. You can send us your documents remotely and securely, or visit our Saint-Léonard office. We explain how as soon as you first contact us.",
        },
        {
          q: "I haven't filed in several years. What should I do?",
          a: "We can bring things up to date, one year at a time. The sooner you act, the less interest builds up. Write to us and we'll figure out where to start together.",
        },
        {
          q: "Do you prepare returns for the whole family?",
          a: "Yes. Preparing spouses' returns together lets us check transferable credits and income splitting. Returns for children who are students can also be prepared.",
        },
      ],
    },
  },

  /* ─────────────────── 2. J'ai reçu une lettre de l'impôt ─────────────────── */
  {
    key: "taxLetter",
    audience: "individuals",
    icon: "letter",
    related: ["personalTaxes", "selfEmployed", "lifeChanges"],
    fr: {
      label: "J'ai reçu une lettre de l'impôt",
      title: "Avis de cotisation de Revenu Québec : quoi faire ?",
      description:
        "Vous avez reçu un avis de cotisation, une demande de documents ou une nouvelle cotisation ? Un CPA à Saint-Léonard vous aide à répondre à temps.",
      h1: "J'ai reçu un avis de cotisation de Revenu Québec : quoi faire ?",
      answer:
        "Pas de panique. Lisez la date sur la lettre : c'est elle qui compte. Si vous n'êtes pas d'accord, vous avez généralement 90 jours pour contester. Envoyez-nous une photo de la lettre : nous vous dirons si c'est grave, et quoi faire.",
      teaser: "Une lettre de Revenu Québec ou de l'ARC ? On la lit avec vous et on répond.",
      sections: [
        {
          h2: "D'abord, identifier le type de lettre",
          paras: ["Toutes les lettres de l'impôt ne se ressemblent pas. Les plus fréquentes :"],
          list: [
            "Avis de cotisation : le résultat de votre déclaration. Souvent, il confirme simplement ce que vous avez déclaré.",
            "Avis de nouvelle cotisation : l'impôt a modifié votre déclaration. Il peut vous réclamer un montant.",
            "Demande de renseignements : on vous demande des pièces justificatives (reçus, factures) avant une date précise.",
            "Avis de vérification : un examen plus poussé de votre dossier ou de votre entreprise.",
          ],
        },
        {
          h2: "Ce qu'il faut faire tout de suite",
          list: [
            "Notez la date de la lettre et la date limite de réponse",
            "Ne jetez rien : gardez la lettre et l'enveloppe",
            "Ne payez pas un montant que vous ne comprenez pas sans vérifier",
            "Ne laissez pas la lettre sans réponse : le silence aggrave presque toujours la situation",
          ],
        },
        {
          h2: "Si vous n'êtes pas d'accord",
          paras: [
            "Vous pouvez contester par un avis d'opposition. En général, le délai est de 90 jours après la date de l'avis. Pour un particulier, ce délai peut aller jusqu'à un an après la date limite de production, selon la date la plus tardive.",
            "Une opposition bien préparée explique, preuves à l'appui, pourquoi la cotisation est erronée. C'est exactement ce que nous faisons pour vous.",
          ],
        },
        {
          h2: "Comment nous vous aidons",
          paras: [
            "Nous lisons la lettre et vous expliquons ce qu'elle veut dire, en mots simples. Avec votre autorisation, nous communiquons directement avec Revenu Québec ou l'ARC. Vous n'avez plus à appeler vous-même ni à attendre au téléphone.",
          ],
        },
      ],
      faq: [
        {
          q: "Combien de temps ai-je pour contester un avis de cotisation ?",
          a: "Généralement 90 jours après la date inscrite sur l'avis. Pour un particulier, vous pouvez aussi avoir jusqu'à un an après la date limite de production de la déclaration visée, selon la date la plus tardive. Vérifiez vite : chaque situation est différente.",
        },
        {
          q: "Revenu Québec me demande des documents. Est-ce grave ?",
          a: "Pas forcément. C'est souvent une vérification de routine, par exemple pour des frais médicaux ou des frais de garde. Il faut toutefois répondre avant la date indiquée, avec les bons documents.",
        },
        {
          q: "Dois-je payer le montant réclamé même si je conteste ?",
          a: "Pour la plupart des particuliers, le recouvrement d'un montant contesté est suspendu pendant l'opposition. Mais les intérêts continuent de courir si la cotisation est finalement maintenue. Nous évaluons avec vous s'il vaut mieux payer maintenant.",
        },
        {
          q: "Pouvez-vous parler à l'impôt à ma place ?",
          a: "Oui. Avec une procuration que vous signez, nous pouvons communiquer avec Revenu Québec et l'ARC en votre nom.",
        },
        {
          q: "J'ai fait une erreur dans ma déclaration. Comment la corriger ?",
          a: "On peut demander une modification de la déclaration déjà produite. Si l'erreur est en votre défaveur et que vous la corrigez de vous-même, avant que l'impôt ne vous contacte, cela joue généralement en votre faveur.",
        },
      ],
    },
    en: {
      label: "I got a letter from the tax authorities",
      title: "Notice of assessment from Revenu Québec: what now?",
      description:
        "Received a notice of assessment, a request for documents or a reassessment? A CPA in Saint-Léonard helps you reply on time.",
      h1: "I got a notice of assessment from Revenu Québec: what should I do?",
      answer:
        "Don't panic. Look at the date on the letter: that's what matters. If you disagree, you usually have 90 days to object. Send us a photo of the letter and we'll tell you whether it's serious and what to do.",
      teaser: "A letter from Revenu Québec or the CRA? We read it with you and reply.",
      sections: [
        {
          h2: "First, identify the type of letter",
          paras: ["Not all tax letters are the same. The most common ones:"],
          list: [
            "Notice of assessment: the result of your return. Often it simply confirms what you filed.",
            "Notice of reassessment: your return was changed. You may be asked to pay an amount.",
            "Request for information: you are asked for supporting documents (receipts, invoices) by a specific date.",
            "Audit notice: a closer review of your file or your business.",
          ],
        },
        {
          h2: "What to do right away",
          list: [
            "Write down the date of the letter and the reply deadline",
            "Keep everything: the letter and the envelope",
            "Don't pay an amount you don't understand without checking",
            "Don't ignore the letter: silence almost always makes things worse",
          ],
        },
        {
          h2: "If you disagree",
          paras: [
            "You can dispute it with a notice of objection. In general, the deadline is 90 days after the date of the notice. For an individual, it can extend to one year after the filing deadline, whichever is later.",
            "A well-prepared objection explains, with evidence, why the assessment is wrong. That's exactly what we do for you.",
          ],
        },
        {
          h2: "How we help",
          paras: [
            "We read the letter and explain what it means, in plain language. With your authorization, we deal directly with Revenu Québec or the CRA. No more calling yourself or waiting on hold.",
          ],
        },
      ],
      faq: [
        {
          q: "How long do I have to object to a notice of assessment?",
          a: "Usually 90 days after the date on the notice. For an individual, you may also have up to one year after the filing deadline of the return in question, whichever is later. Check quickly: every situation is different.",
        },
        {
          q: "Revenu Québec is asking for documents. Is it serious?",
          a: "Not necessarily. It's often a routine review, for example of medical or childcare expenses. You still need to reply before the date shown, with the right documents.",
        },
        {
          q: "Do I have to pay the amount even if I object?",
          a: "For most individuals, collection of a disputed amount is put on hold during the objection. But interest keeps running if the assessment is upheld. We'll assess with you whether paying now makes sense.",
        },
        {
          q: "Can you talk to the tax authorities for me?",
          a: "Yes. With an authorization you sign, we can deal with Revenu Québec and the CRA on your behalf.",
        },
        {
          q: "I made a mistake on my return. How do I fix it?",
          a: "We can request an adjustment to the return already filed. If the error is in your disfavour and you correct it on your own, before the tax authorities contact you, it generally works in your favour.",
        },
      ],
    },
  },

  /* ─────────────────── 3. Je travaille à mon compte ─────────────────── */
  {
    key: "selfEmployed",
    audience: "individuals",
    icon: "laptop",
    related: ["salesTax", "startBusiness", "personalTaxes"],
    fr: {
      label: "Je travaille à mon compte",
      title: "Comptable pour travailleur autonome | Saint-Léonard",
      description:
        "Travailleur autonome au Québec ? Dépenses déductibles, acomptes, TPS/TVQ : un CPA à Saint-Léonard simplifie vos impôts de A à Z.",
      h1: "Je travaille à mon compte : qu'est-ce que je dois déclarer ?",
      answer:
        "Tous vos revenus d'entreprise, moins vos dépenses liées au travail. Vous avez jusqu'au 15 juin pour produire, mais l'impôt est dû le 30 avril. Gardez vos factures et vos reçus : nous faisons le tri et le calcul.",
      teaser: "Revenus, dépenses, acomptes et taxes : on démêle tout pour vous.",
      sections: [
        {
          h2: "Ce que vous déclarez",
          paras: [
            "Vous déclarez votre revenu net : vos revenus moins les dépenses engagées pour gagner ces revenus. Ce calcul se fait sur des formulaires spéciaux, joints à vos déclarations personnelles.",
            "Vous payez aussi vos cotisations au Régime de rentes du Québec (part employé et part employeur) et au Régime québécois d'assurance parentale.",
          ],
        },
        {
          h2: "Les dépenses que vous pouvez souvent déduire",
          list: [
            "Une partie de votre loyer ou de vos frais de maison, si vous travaillez de chez vous",
            "Une partie de vos frais de véhicule, selon vos kilomètres d'affaires",
            "Téléphone, internet, logiciels, matériel",
            "Fournitures, publicité, frais professionnels",
            "Formation liée à votre travail",
          ],
          after: [
            "La règle est simple : la dépense doit servir à gagner votre revenu. Gardez toujours la facture.",
          ],
        },
        {
          h2: "Les acomptes provisionnels",
          paras: [
            "Si vous devez beaucoup d'impôt deux années de suite, l'impôt vous demandera de payer d'avance, en quatre versements : 15 mars, 15 juin, 15 septembre et 15 décembre. Nous calculons ces montants avec vous pour éviter les intérêts.",
          ],
        },
        {
          h2: "Et les taxes ?",
          paras: [
            "Dès que vos revenus taxables dépassent 30 000 $ sur quatre trimestres consécutifs, vous devez vous inscrire à la TPS et à la TVQ.",
          ],
        },
      ],
      faq: [
        {
          q: "Quelle est la date limite pour un travailleur autonome ?",
          a: "Vous avez jusqu'au 15 juin pour produire vos déclarations. Attention : le solde d'impôt à payer est dû le 30 avril. Des intérêts s'appliquent après cette date.",
        },
        {
          q: "Dois-je m'incorporer ?",
          a: "Pas forcément. L'incorporation peut être avantageuse quand vos revenus dépassent vos besoins personnels, mais elle ajoute des coûts et des obligations. Nous faisons le calcul avec vos vrais chiffres avant de recommander quoi que ce soit.",
        },
        {
          q: "Puis-je déduire mon bureau à domicile ?",
          a: "Oui, si c'est votre principal lieu de travail ou si vous l'utilisez régulièrement pour rencontrer des clients. Vous déduisez une partie des frais (loyer, électricité, assurance) selon la superficie utilisée.",
        },
        {
          q: "Quels documents dois-je garder, et combien de temps ?",
          a: "Toutes vos factures de ventes, vos reçus de dépenses et vos relevés bancaires. Conservez-les au moins six ans. Le plus simple : prenez-les en photo au fil de l'année et classez-les dans un même dossier.",
        },
        {
          q: "Que sont les acomptes provisionnels ?",
          a: "Ce sont des paiements d'impôt faits d'avance, en quatre versements par année. Ils sont exigés lorsque votre impôt à payer dépasse un certain seuil. Nous vous indiquons les montants et les dates.",
        },
      ],
    },
    en: {
      label: "I'm self-employed",
      title: "Accountant for self-employed people | Saint-Léonard",
      description:
        "Self-employed in Quebec? Deductible expenses, instalments, GST/QST: a CPA in Saint-Léonard handles your taxes from start to finish.",
      h1: "I'm self-employed: what do I need to report?",
      answer:
        "All of your business income, minus your work-related expenses. You have until June 15 to file, but any tax owing is due April 30. Keep your invoices and receipts: we sort them and do the math.",
      teaser: "Income, expenses, instalments and sales tax: we sort it all out.",
      sections: [
        {
          h2: "What you report",
          paras: [
            "You report your net income: your revenue minus the expenses you incurred to earn it. This is done on special forms attached to your personal returns.",
            "You also pay contributions to the Quebec Pension Plan (both employee and employer shares) and to the Quebec Parental Insurance Plan.",
          ],
        },
        {
          h2: "Expenses you can often deduct",
          list: [
            "Part of your rent or home costs, if you work from home",
            "Part of your vehicle costs, based on business kilometres",
            "Phone, internet, software, equipment",
            "Supplies, advertising, professional fees",
            "Training related to your work",
          ],
          after: ["The rule is simple: the expense must help you earn your income. Always keep the receipt."],
        },
        {
          h2: "Tax instalments",
          paras: [
            "If you owe a significant amount of tax two years in a row, you'll be asked to pay in advance, in four instalments: March 15, June 15, September 15 and December 15. We calculate these amounts with you to avoid interest.",
          ],
        },
        {
          h2: "What about sales tax?",
          paras: [
            "Once your taxable revenue exceeds $30,000 over four consecutive calendar quarters, you must register for GST and QST.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the filing deadline for self-employed people?",
          a: "You have until June 15 to file your returns. Note: any balance owing is due April 30. Interest applies after that date.",
        },
        {
          q: "Should I incorporate?",
          a: "Not necessarily. Incorporating can pay off when your income exceeds your personal needs, but it adds costs and obligations. We run the numbers with your real figures before recommending anything.",
        },
        {
          q: "Can I deduct my home office?",
          a: "Yes, if it's your main place of work or you use it regularly to meet clients. You deduct a portion of costs (rent, electricity, insurance) based on the space used.",
        },
        {
          q: "Which documents should I keep, and for how long?",
          a: "All of your sales invoices, expense receipts and bank statements. Keep them for at least six years. The easiest way: take a photo throughout the year and keep them in a single folder.",
        },
        {
          q: "What are tax instalments?",
          a: "They are advance tax payments, made in four instalments a year. They are required when the tax you owe exceeds a certain threshold. We tell you the amounts and dates.",
        },
      ],
    },
  },

  /* ─────────────────── 4. Un grand changement ─────────────────── */
  {
    key: "lifeChanges",
    audience: "individuals",
    icon: "home",
    related: ["personalTaxes", "taxLetter", "multiCompanies"],
    fr: {
      label: "Un grand changement",
      title: "Maison, bébé, retraite, succession : vos impôts",
      description:
        "Achat d'une maison, naissance, retraite ou décès d'un proche : un CPA à Saint-Léonard vous dit quoi faire pour vos impôts, étape par étape.",
      h1: "Maison, bébé, retraite, succession : quel impact sur mes impôts ?",
      answer:
        "Chaque grand moment de la vie change votre situation fiscale. Certains ouvrent droit à des aides, d'autres créent des obligations. Parlez-nous-en tôt : quelques décisions prises au bon moment peuvent faire une vraie différence.",
      teaser: "Maison, bébé, retraite ou succession : les bonnes décisions au bon moment.",
      sections: [
        {
          h2: "Vous achetez une première maison",
          list: [
            "Le CELIAPP vous permet d'épargner pour votre mise de fonds tout en réduisant vos impôts",
            "Le Régime d'accession à la propriété (RAP) permet de retirer une partie de vos REER sans impôt immédiat",
            "Un crédit d'impôt fédéral existe pour l'achat d'une première habitation",
            "Prévoyez les droits de mutation (la « taxe de bienvenue ») dans votre budget",
          ],
        },
        {
          h2: "Vous accueillez un enfant",
          list: [
            "Produisez vos déclarations chaque année : c'est ce qui déclenche l'Allocation canadienne pour enfants et l'Allocation famille du Québec",
            "Gardez vos reçus de frais de garde : ils donnent droit à un crédit d'impôt",
            "Le Régime québécois d'assurance parentale (RQAP) est imposable : prévoyez-le",
          ],
        },
        {
          h2: "Vous prenez votre retraite",
          list: [
            "Le moment où vous demandez vos rentes de retraite change leur montant",
            "Le fractionnement du revenu de pension avec votre conjoint peut réduire l'impôt du couple",
            "Vos REER doivent être convertis au plus tard à la fin de l'année de vos 71 ans",
          ],
        },
        {
          h2: "Vous perdez un proche",
          paras: [
            "C'est un moment difficile. Les démarches fiscales peuvent attendre quelques semaines, mais pas indéfiniment.",
            "Le liquidateur doit produire les déclarations finales du défunt. Au Québec, il doit aussi obtenir un certificat de Revenu Québec avant de distribuer les biens. Nous accompagnons les liquidateurs du début à la fin.",
          ],
        },
      ],
      faq: [
        {
          q: "Quelle est la date limite pour la déclaration d'une personne décédée ?",
          a: "Si le décès a lieu entre le 1er janvier et le 31 octobre, la déclaration finale est due le 30 avril de l'année suivante. Si le décès a lieu en novembre ou en décembre, le délai est de six mois après la date du décès.",
        },
        {
          q: "Un liquidateur peut-il distribuer les biens tout de suite ?",
          a: "Il est préférable d'attendre. Au Québec, le liquidateur doit obtenir un certificat autorisant la distribution de Revenu Québec, et il est recommandé d'obtenir un certificat de décharge de l'ARC. Sinon, il peut être tenu personnellement responsable des impôts impayés.",
        },
        {
          q: "CELIAPP ou RAP : lequel choisir pour ma première maison ?",
          a: "Souvent, les deux. Le CELIAPP est généralement plus avantageux parce que le retrait n'a pas à être remboursé. Le RAP peut compléter. Le bon choix dépend de vos revenus et de votre échéancier.",
        },
        {
          q: "Je me sépare. Qu'est-ce qui change pour mes impôts ?",
          a: "Votre état civil, les prestations pour enfants, la pension alimentaire et parfois le partage de biens ont des effets fiscaux. Avisez l'ARC et Retraite Québec du changement, et parlons-en avant de signer une entente.",
        },
        {
          q: "À quel âge dois-je demander ma rente du Régime de rentes du Québec ?",
          a: "Vous pouvez la demander dès 60 ans ou la reporter jusqu'à 72 ans. Plus vous attendez, plus la rente est élevée. Le bon moment dépend de votre santé, de vos autres revenus et de vos besoins.",
        },
      ],
    },
    en: {
      label: "A big life change",
      title: "Home, baby, retirement, estate: your taxes",
      description:
        "Buying a home, a new baby, retirement or the loss of a loved one: a CPA in Saint-Léonard tells you what to do for your taxes, step by step.",
      h1: "Home, baby, retirement, estate: how does it affect my taxes?",
      answer:
        "Every big life moment changes your tax situation. Some open the door to benefits, others create obligations. Talk to us early: a few decisions made at the right time can make a real difference.",
      teaser: "Home, baby, retirement or an estate: the right decisions at the right time.",
      sections: [
        {
          h2: "You're buying your first home",
          list: [
            "The FHSA lets you save for your down payment while reducing your taxes",
            "The Home Buyers' Plan (HBP) lets you withdraw part of your RRSP with no immediate tax",
            "A federal tax credit exists for buying a first home",
            "Budget for the land transfer duties (the \"welcome tax\")",
          ],
        },
        {
          h2: "You're welcoming a child",
          list: [
            "File your returns every year: that's what triggers the Canada Child Benefit and Quebec's family allowance",
            "Keep your childcare receipts: they give you a tax credit",
            "Quebec Parental Insurance Plan (QPIP) benefits are taxable: plan for it",
          ],
        },
        {
          h2: "You're retiring",
          list: [
            "When you start your pensions changes how much you receive",
            "Splitting pension income with your spouse can reduce the couple's tax",
            "Your RRSP must be converted by the end of the year you turn 71",
          ],
        },
        {
          h2: "You've lost a loved one",
          paras: [
            "It's a hard time. Tax matters can wait a few weeks, but not indefinitely.",
            "The liquidator must file the deceased's final returns. In Quebec, they must also obtain a certificate from Revenu Québec before distributing the property. We support liquidators from start to finish.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the deadline for a deceased person's final return?",
          a: "If the death occurred between January 1 and October 31, the final return is due April 30 of the following year. If it occurred in November or December, the deadline is six months after the date of death.",
        },
        {
          q: "Can a liquidator distribute the property right away?",
          a: "It's better to wait. In Quebec, the liquidator must obtain a certificate authorizing distribution from Revenu Québec, and a clearance certificate from the CRA is recommended. Otherwise, they may be held personally liable for unpaid taxes.",
        },
        {
          q: "FHSA or HBP: which one for my first home?",
          a: "Often both. The FHSA is usually more advantageous because the withdrawal doesn't have to be repaid. The HBP can top it up. The right choice depends on your income and timeline.",
        },
        {
          q: "I'm separating. What changes for my taxes?",
          a: "Your marital status, child benefits, support payments and sometimes the division of property all have tax effects. Notify the CRA and Retraite Québec of the change, and talk to us before signing an agreement.",
        },
        {
          q: "At what age should I apply for my Quebec Pension Plan pension?",
          a: "You can start as early as 60 or delay until 72. The longer you wait, the higher the pension. The right time depends on your health, other income and needs.",
        },
      ],
    },
  },

  /* ─────────────────── 5. Je démarre ─────────────────── */
  {
    key: "startBusiness",
    audience: "businesses",
    icon: "rocket",
    related: ["salesTax", "statements", "selfEmployed"],
    fr: {
      label: "Je démarre",
      title: "Démarrer une entreprise au Québec | CPA Saint-Léonard",
      description:
        "Entreprise individuelle ou société par actions ? Inscriptions, taxes, comptabilité : un CPA à Saint-Léonard vous aide à bien démarrer.",
      h1: "Je démarre mon entreprise : par où commencer ?",
      answer:
        "Commencez par choisir la forme de votre entreprise : à votre nom ou incorporée. Ensuite, inscrivez-la, ouvrez un compte bancaire séparé et mettez en place une comptabilité simple dès le premier jour. Nous vous guidons à chaque étape.",
      teaser: "Choisir la bonne structure et partir du bon pied, dès le premier jour.",
      sections: [
        {
          h2: "À votre nom ou incorporée ?",
          paras: [
            "Une entreprise individuelle est simple et peu coûteuse. Vos revenus d'affaires s'ajoutent à vos revenus personnels.",
            "Une société par actions (incorporée) est une personne distincte. Elle peut payer moins d'impôt sur les profits laissés dans l'entreprise et protège mieux vos biens personnels. Elle demande aussi plus de suivi : déclarations de la société, états financiers, registres.",
            "Il n'y a pas de bonne réponse universelle. Nous comparons les deux options avec vos chiffres.",
          ],
        },
        {
          h2: "Les premières démarches",
          list: [
            "Immatriculer l'entreprise au Registraire des entreprises du Québec (ou l'incorporer)",
            "S'inscrire à la TPS et à la TVQ, si nécessaire",
            "Ouvrir un compte bancaire réservé à l'entreprise",
            "S'inscrire comme employeur, si vous embauchez",
            "Choisir un outil simple pour suivre vos revenus et dépenses",
          ],
        },
        {
          h2: "Ce que nous mettons en place pour vous",
          paras: [
            "Une structure adaptée, un calendrier de vos obligations et une méthode simple pour classer vos documents. Vous savez quoi faire, et quand. Le reste, nous nous en occupons.",
          ],
        },
      ],
      faq: [
        {
          q: "Quand est-il avantageux de s'incorporer ?",
          a: "Souvent quand l'entreprise fait plus de profits que ce dont vous avez besoin pour vivre. Les profits laissés dans la société sont imposés à un taux plus bas. Mais chaque situation est différente : nous faisons le calcul avant de recommander.",
        },
        {
          q: "Dois-je m'inscrire à la TPS et à la TVQ dès le départ ?",
          a: "C'est obligatoire dès que vos ventes taxables dépassent 30 000 $ sur quatre trimestres consécutifs. Vous pouvez aussi vous inscrire volontairement avant, pour récupérer les taxes payées sur vos achats.",
        },
        {
          q: "Ai-je besoin d'un compte bancaire séparé ?",
          a: "Pour une société par actions, oui. Pour une entreprise individuelle, ce n'est pas obligatoire, mais c'est fortement recommandé. Cela simplifie votre comptabilité et vos déclarations.",
        },
        {
          q: "Combien de temps dois-je garder mes documents ?",
          a: "Au moins six ans après la fin de l'année à laquelle ils se rapportent. Les documents de constitution et les registres de la société se conservent plus longtemps.",
        },
        {
          q: "Comment me payer quand je suis incorporé ?",
          a: "Par salaire, par dividendes, ou un mélange des deux. Chaque option a des effets sur votre impôt, votre rente de retraite et vos REER. Nous établissons avec vous la combinaison qui convient.",
        },
      ],
    },
    en: {
      label: "I'm starting out",
      title: "Starting a business in Quebec | CPA Saint-Léonard",
      description:
        "Sole proprietorship or corporation? Registrations, sales tax, bookkeeping: a CPA in Saint-Léonard helps you start on the right foot.",
      h1: "I'm starting a business: where do I begin?",
      answer:
        "Start by choosing your business structure: in your own name or incorporated. Then register it, open a separate bank account and set up simple bookkeeping from day one. We guide you at every step.",
      teaser: "Choose the right structure and get off on the right foot from day one.",
      sections: [
        {
          h2: "In your name or incorporated?",
          paras: [
            "A sole proprietorship is simple and inexpensive. Your business income is added to your personal income.",
            "A corporation is a separate legal person. It can pay less tax on profits left in the business and better protects your personal assets. It also requires more follow-up: corporate returns, financial statements, records.",
            "There's no one-size-fits-all answer. We compare both options using your numbers.",
          ],
        },
        {
          h2: "First steps",
          list: [
            "Register the business with the Registraire des entreprises du Québec (or incorporate)",
            "Register for GST and QST, if required",
            "Open a bank account just for the business",
            "Register as an employer, if you hire",
            "Choose a simple tool to track income and expenses",
          ],
        },
        {
          h2: "What we set up for you",
          paras: [
            "The right structure, a calendar of your obligations and a simple way to file your documents. You know what to do, and when. We handle the rest.",
          ],
        },
      ],
      faq: [
        {
          q: "When does it make sense to incorporate?",
          a: "Often when the business earns more than you need to live on. Profits left in the corporation are taxed at a lower rate. But every situation is different: we run the numbers before recommending anything.",
        },
        {
          q: "Do I need to register for GST and QST from the start?",
          a: "It's mandatory once your taxable sales exceed $30,000 over four consecutive calendar quarters. You can also register voluntarily before that, to recover the taxes paid on your purchases.",
        },
        {
          q: "Do I need a separate bank account?",
          a: "For a corporation, yes. For a sole proprietorship it isn't mandatory, but it's strongly recommended. It simplifies your bookkeeping and your returns.",
        },
        {
          q: "How long should I keep my records?",
          a: "At least six years after the end of the year they relate to. Incorporation documents and corporate records are kept longer.",
        },
        {
          q: "How do I pay myself once incorporated?",
          a: "By salary, by dividends, or a mix of both. Each option affects your taxes, your pension and your RRSP room. We work out the right mix with you.",
        },
      ],
    },
  },

  /* ─────────────────── 6. Mes taxes TPS/TVQ ─────────────────── */
  {
    key: "salesTax",
    audience: "businesses",
    icon: "percent",
    related: ["startBusiness", "selfEmployed", "statements"],
    fr: {
      label: "Mes taxes TPS/TVQ",
      title: "Inscription et déclarations TPS/TVQ | CPA",
      description:
        "Dois-je m'inscrire aux taxes ? Quand produire ma déclaration de TPS/TVQ ? Un CPA à Saint-Léonard s'occupe de vos taxes de vente, sans erreur.",
      h1: "Dois-je m'inscrire à la TPS et à la TVQ ?",
      answer:
        "Oui, dès que vos ventes taxables dépassent 30 000 $ sur quatre trimestres consécutifs. Vous facturez alors 5 % de TPS et 9,975 % de TVQ, et vous récupérez les taxes payées sur vos achats d'affaires. Nous préparons vos déclarations et respectons les dates pour vous.",
      teaser: "Inscription, déclarations et remboursements de taxes, toujours à temps.",
      sections: [
        {
          h2: "Le seuil de 30 000 $",
          paras: [
            "Tant que vos ventes taxables restent sous 30 000 $ sur quatre trimestres consécutifs, vous êtes un « petit fournisseur ». L'inscription est alors facultative.",
            "Dès que vous dépassez ce seuil, l'inscription devient obligatoire. Vous devez commencer à facturer les taxes rapidement : ne tardez pas.",
          ],
        },
        {
          h2: "Comment ça fonctionne",
          list: [
            "Vous ajoutez la TPS (5 %) et la TVQ (9,975 %) à vos factures",
            "Vous récupérez les taxes payées sur vos achats d'affaires : ce sont les crédits et remboursements de taxe sur les intrants",
            "Vous versez la différence à Revenu Québec, qui administre les deux taxes au Québec",
            "Vous produisez une déclaration chaque mois, chaque trimestre ou chaque année, selon votre chiffre d'affaires",
          ],
        },
        {
          h2: "Les erreurs que nous évitons pour vous",
          list: [
            "Oublier de s'inscrire après avoir dépassé le seuil",
            "Réclamer des taxes sur des dépenses personnelles ou sans facture valide",
            "Rater une date de production ou de paiement",
            "Mal traiter les ventes hors Québec ou les ventes détaxées",
          ],
        },
      ],
      faq: [
        {
          q: "Quand dois-je produire ma déclaration de TPS/TVQ ?",
          a: "Cela dépend de votre période : mensuelle, trimestrielle ou annuelle. Pour une période mensuelle ou trimestrielle, la déclaration et le paiement sont généralement dus un mois après la fin de la période. Pour une période annuelle, les règles varient selon votre situation.",
        },
        {
          q: "Puis-je m'inscrire même si je fais moins de 30 000 $ ?",
          a: "Oui. L'inscription volontaire vous permet de récupérer les taxes payées sur vos achats. En revanche, vous devrez facturer les taxes à vos clients et produire des déclarations.",
        },
        {
          q: "Qu'est-ce qu'un remboursement de taxe sur les intrants ?",
          a: "C'est la TPS et la TVQ que vous avez payées sur vos achats d'affaires et que vous pouvez récupérer. Vous les déduisez des taxes perçues auprès de vos clients.",
        },
        {
          q: "J'ai dépassé le seuil sans m'inscrire. Que faire ?",
          a: "Agissez vite. Plus vous attendez, plus les taxes non perçues s'accumulent. Nous vous aidons à vous inscrire, à régulariser les périodes passées et à limiter les pénalités.",
        },
        {
          q: "Qui administre la TPS au Québec ?",
          a: "Revenu Québec administre à la fois la TPS et la TVQ pour la plupart des entreprises situées au Québec. Vous produisez donc une seule déclaration pour les deux taxes.",
        },
      ],
    },
    en: {
      label: "My GST/QST",
      title: "GST/QST registration and returns | CPA",
      description:
        "Do I need to register for sales tax? When is my GST/QST return due? A CPA in Saint-Léonard handles your sales tax, accurately and on time.",
      h1: "Do I need to register for GST and QST?",
      answer:
        "Yes, once your taxable sales exceed $30,000 over four consecutive calendar quarters. You then charge 5% GST and 9.975% QST, and you recover the taxes paid on your business purchases. We prepare your returns and meet the deadlines for you.",
      teaser: "Registration, returns and tax refunds, always on time.",
      sections: [
        {
          h2: "The $30,000 threshold",
          paras: [
            "As long as your taxable sales stay under $30,000 over four consecutive calendar quarters, you are a \"small supplier\". Registration is optional.",
            "Once you pass that threshold, registration becomes mandatory. You must start charging the taxes quickly, so don't wait.",
          ],
        },
        {
          h2: "How it works",
          list: [
            "You add GST (5%) and QST (9.975%) to your invoices",
            "You recover the taxes paid on your business purchases: these are input tax credits and refunds",
            "You remit the difference to Revenu Québec, which administers both taxes in Quebec",
            "You file a return every month, quarter or year, depending on your revenue",
          ],
        },
        {
          h2: "Mistakes we help you avoid",
          list: [
            "Forgetting to register after passing the threshold",
            "Claiming taxes on personal expenses or without a valid invoice",
            "Missing a filing or payment deadline",
            "Mishandling sales outside Quebec or zero-rated sales",
          ],
        },
      ],
      faq: [
        {
          q: "When is my GST/QST return due?",
          a: "It depends on your reporting period: monthly, quarterly or annual. For monthly or quarterly periods, the return and payment are generally due one month after the end of the period. For annual periods, the rules depend on your situation.",
        },
        {
          q: "Can I register even if I earn less than $30,000?",
          a: "Yes. Voluntary registration lets you recover the taxes paid on your purchases. However, you will have to charge the taxes to your customers and file returns.",
        },
        {
          q: "What is an input tax credit?",
          a: "It's the GST and QST you paid on business purchases that you can recover. You subtract them from the taxes collected from your customers.",
        },
        {
          q: "I passed the threshold without registering. What now?",
          a: "Act quickly. The longer you wait, the more uncollected tax builds up. We help you register, bring past periods up to date and limit penalties.",
        },
        {
          q: "Who administers GST in Quebec?",
          a: "Revenu Québec administers both GST and QST for most businesses located in Quebec. So you file a single return for both taxes.",
        },
      ],
    },
  },

  /* ─────────────────── 7. Mes états financiers ─────────────────── */
  {
    key: "statements",
    audience: "businesses",
    icon: "chart",
    related: ["multiCompanies", "startBusiness", "salesTax"],
    fr: {
      label: "Mes états financiers",
      title: "États financiers : compilation, examen, audit",
      description:
        "Votre banque, un bailleur de fonds ou un organisme demande vos états financiers ? Un CPA auditeur à Saint-Léonard vous dit lequel il vous faut.",
      h1: "De quels états financiers mon entreprise a-t-elle besoin ?",
      answer:
        "Cela dépend de qui les demande. Pour vos impôts, une mission de compilation suffit souvent. Une banque peut exiger une mission d'examen. Certains organismes ou bailleurs de fonds exigent un audit. Comme CPA auditeur, nous pouvons réaliser les trois.",
      teaser: "Compilation, examen ou audit : le bon niveau, ni plus, ni moins.",
      sections: [
        {
          h2: "Trois niveaux, trois besoins",
          list: [
            "Mission de compilation : nous présentons vos chiffres sous forme d'états financiers. C'est souvent suffisant pour vos déclarations de revenus.",
            "Mission d'examen : nous analysons vos chiffres et posons des questions pour vérifier qu'ils sont plausibles. Les banques la demandent souvent.",
            "Audit : nous vérifions vos chiffres en profondeur, avec des preuves. C'est le niveau d'assurance le plus élevé.",
          ],
        },
        {
          h2: "Pourquoi un CPA auditeur fait une différence",
          paras: [
            "Seul un CPA titulaire d'un permis de comptabilité publique peut signer une mission d'examen ou un audit. Avec un CPA auditeur, vous n'avez pas à changer de cabinet si votre banque ou un organisme devient plus exigeant.",
            "Nous réalisons aussi des mandats auprès d'organismes publics, qui demandent une grande rigueur.",
          ],
        },
        {
          h2: "Ce dont nous avons besoin",
          list: [
            "Vos relevés bancaires et de cartes de crédit de l'année",
            "Vos factures de ventes et d'achats, ou l'accès à votre logiciel comptable",
            "Vos contrats de prêt et de location",
            "Les états financiers de l'année précédente",
          ],
        },
      ],
      faq: [
        {
          q: "Quelle est la différence entre une compilation et un audit ?",
          a: "Une compilation présente vos chiffres sans les vérifier. Un audit les vérifie en profondeur et donne une opinion sur leur fidélité. L'examen se situe entre les deux.",
        },
        {
          q: "Ma banque demande des états financiers « examinés ». Pouvez-vous les préparer ?",
          a: "Oui. Comme CPA auditeur, nous pouvons réaliser des missions d'examen et des audits, en plus des compilations.",
        },
        {
          q: "Une société par actions doit-elle avoir des états financiers ?",
          a: "Oui. Ils sont nécessaires pour préparer les déclarations de revenus de la société. Le niveau requis (compilation, examen ou audit) dépend surtout de ce que demandent vos actionnaires, votre banque ou vos partenaires.",
        },
        {
          q: "Combien de temps faut-il pour préparer des états financiers ?",
          a: "Cela dépend de l'état de vos documents et du type de mission. Une compilation pour un dossier bien tenu va plus vite qu'un audit. Nous vous donnons un échéancier clair dès le départ.",
        },
        {
          q: "Travaillez-vous avec des OBNL et des organismes ?",
          a: "Oui. Nous réalisons des missions pour des organismes, y compris des mandats auprès d'organismes publics.",
        },
      ],
    },
    en: {
      label: "My financial statements",
      title: "Financial statements: compilation, review, audit",
      description:
        "Your bank, a funder or an organization is asking for financial statements? A CPA auditor in Saint-Léonard tells you which kind you need.",
      h1: "What kind of financial statements does my business need?",
      answer:
        "It depends on who is asking. For your taxes, a compilation engagement is often enough. A bank may require a review engagement. Some organizations and funders require an audit. As a CPA auditor, we can do all three.",
      teaser: "Compilation, review or audit: the right level, no more, no less.",
      sections: [
        {
          h2: "Three levels, three needs",
          list: [
            "Compilation engagement: we present your numbers as financial statements. Often enough for your tax returns.",
            "Review engagement: we analyze your numbers and ask questions to check that they are plausible. Banks often ask for this.",
            "Audit: we verify your numbers in depth, with evidence. It's the highest level of assurance.",
          ],
        },
        {
          h2: "Why a CPA auditor makes a difference",
          paras: [
            "Only a CPA holding a public accountancy permit can sign a review engagement or an audit. With a CPA auditor, you don't have to change firms if your bank or an organization becomes more demanding.",
            "We also carry out mandates for public bodies, which require great rigour.",
          ],
        },
        {
          h2: "What we need",
          list: [
            "Your bank and credit card statements for the year",
            "Your sales and purchase invoices, or access to your accounting software",
            "Your loan and lease agreements",
            "Last year's financial statements",
          ],
        },
      ],
      faq: [
        {
          q: "What's the difference between a compilation and an audit?",
          a: "A compilation presents your numbers without verifying them. An audit verifies them in depth and gives an opinion on whether they are fairly presented. A review sits in between.",
        },
        {
          q: "My bank wants \"reviewed\" financial statements. Can you prepare them?",
          a: "Yes. As a CPA auditor, we can perform review engagements and audits, in addition to compilations.",
        },
        {
          q: "Does a corporation need financial statements?",
          a: "Yes. They are needed to prepare the corporation's tax returns. The level required (compilation, review or audit) depends mostly on what your shareholders, bank or partners ask for.",
        },
        {
          q: "How long does it take to prepare financial statements?",
          a: "It depends on the state of your records and the type of engagement. A compilation for well-kept books is faster than an audit. We give you a clear timeline from the start.",
        },
        {
          q: "Do you work with non-profits and organizations?",
          a: "Yes. We carry out engagements for organizations, including mandates for public bodies.",
        },
      ],
    },
  },

  /* ─────────────────── 8. J'ai plusieurs entreprises ─────────────────── */
  {
    key: "multiCompanies",
    audience: "businesses",
    icon: "layers",
    related: ["statements", "startBusiness", "lifeChanges"],
    fr: {
      label: "J'ai plusieurs entreprises",
      title: "Plusieurs entreprises ou société de gestion | CPA",
      description:
        "Plusieurs sociétés, une société de gestion ou des immeubles ? Un CPA à Saint-Léonard simplifie votre comptabilité et vos déclarations.",
      h1: "J'ai plusieurs entreprises : comment simplifier ma comptabilité ?",
      answer:
        "En confiant toutes vos sociétés au même cabinet. Nous voyons alors l'ensemble : les liens entre vos entreprises, les règles qui s'appliquent au groupe et les occasions d'économiser. Vous avez un seul interlocuteur et un seul calendrier.",
      teaser: "Une vue d'ensemble de vos sociétés, un seul interlocuteur.",
      sections: [
        {
          h2: "Pourquoi tout regrouper",
          paras: [
            "Chaque société a ses propres états financiers et ses propres déclarations. Mais les règles fiscales regardent souvent le groupe dans son ensemble.",
            "Par exemple, des sociétés « associées » se partagent la déduction pour petite entreprise. Si chaque société est suivie par un comptable différent, personne ne voit le portrait complet.",
          ],
        },
        {
          h2: "Ce que nous faisons pour vous",
          list: [
            "Un calendrier unique pour toutes vos sociétés",
            "Le suivi des transactions entre vos entreprises (prêts, frais de gestion, dividendes)",
            "La répartition optimale de la déduction pour petite entreprise",
            "Des conseils sur la société de gestion et la réorganisation, au besoin",
          ],
        },
        {
          h2: "Société de gestion : est-ce utile ?",
          paras: [
            "Une société de gestion (ou « holding ») peut détenir les actions de vos entreprises. Elle peut servir à protéger les profits accumulés, à faciliter l'achat d'un immeuble ou à préparer la relève. Elle n'est pas toujours nécessaire : nous évaluons avec vous si elle vous apporte vraiment quelque chose.",
          ],
        },
      ],
      faq: [
        {
          q: "Qu'est-ce que des sociétés associées ?",
          a: "Ce sont des sociétés liées par le contrôle, par exemple parce qu'une même personne ou un même groupe les contrôle. Elles doivent se partager certains avantages fiscaux, comme la déduction pour petite entreprise.",
        },
        {
          q: "Ai-je besoin d'une société de gestion ?",
          a: "Pas toujours. Elle peut être utile pour protéger des profits, investir ou préparer une vente ou une relève. Mais elle ajoute des coûts. Nous évaluons votre situation avant de la recommander.",
        },
        {
          q: "Chaque société doit-elle produire sa propre déclaration ?",
          a: "Oui. Chaque société produit ses déclarations au fédéral et au Québec, et a ses propres états financiers. Nous les coordonnons pour vous.",
        },
        {
          q: "Comment documenter un prêt entre deux de mes sociétés ?",
          a: "Par écrit, avec des modalités claires et inscrites dans les livres des deux sociétés. Certains prêts, notamment à un actionnaire, ont des conséquences fiscales. Parlons-en avant de faire le transfert.",
        },
        {
          q: "Pouvez-vous reprendre des dossiers suivis par d'autres comptables ?",
          a: "Oui. Nous reprenons les dossiers en douceur, avec l'historique et les documents de l'année précédente. Vous n'avez pas à tout recommencer.",
        },
      ],
    },
    en: {
      label: "I have several businesses",
      title: "Multiple companies or a holding company | CPA",
      description:
        "Several corporations, a holding company or rental properties? A CPA in Saint-Léonard simplifies your accounting and tax returns.",
      h1: "I own several businesses: how can I simplify my accounting?",
      answer:
        "By entrusting all of your companies to the same firm. We then see the whole picture: the links between your businesses, the rules that apply to the group and the opportunities to save. You have one contact and one calendar.",
      teaser: "One view of all your companies, one contact.",
      sections: [
        {
          h2: "Why bring everything together",
          paras: [
            "Each corporation has its own financial statements and returns. But tax rules often look at the group as a whole.",
            "For example, \"associated\" corporations share the small business deduction. If each company has a different accountant, no one sees the full picture.",
          ],
        },
        {
          h2: "What we do for you",
          list: [
            "One calendar for all your companies",
            "Tracking transactions between your businesses (loans, management fees, dividends)",
            "The best allocation of the small business deduction",
            "Advice on holding companies and reorganizations, when needed",
          ],
        },
        {
          h2: "A holding company: is it useful?",
          paras: [
            "A holding company can own the shares of your businesses. It can protect accumulated profits, make buying a building easier or prepare for succession. It isn't always needed: we assess with you whether it really adds value.",
          ],
        },
      ],
      faq: [
        {
          q: "What are associated corporations?",
          a: "They are corporations linked by control, for example because the same person or group controls them. They must share certain tax benefits, such as the small business deduction.",
        },
        {
          q: "Do I need a holding company?",
          a: "Not always. It can help protect profits, invest, or prepare a sale or succession. But it adds costs. We look at your situation before recommending it.",
        },
        {
          q: "Does each corporation file its own return?",
          a: "Yes. Each corporation files federal and Quebec returns and has its own financial statements. We coordinate them for you.",
        },
        {
          q: "How do I document a loan between two of my companies?",
          a: "In writing, with clear terms, recorded in the books of both companies. Some loans, especially to a shareholder, have tax consequences. Let's talk before you move the money.",
        },
        {
          q: "Can you take over files from other accountants?",
          a: "Yes. We take over files smoothly, using last year's history and documents. You don't have to start over.",
        },
      ],
    },
  },
];

export const concernByKey = (key: RouteKey) => concerns.find((c) => c.key === key)!;
export const concernsFor = (audience: Concern["audience"]) => concerns.filter((c) => c.audience === audience);
