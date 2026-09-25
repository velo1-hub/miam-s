// Page copy, FR first. Placeholders like {{MENU}} are rendered by build.mjs.
// SEO fields follow Phase 6 §4 (title ≤ 60 chars, description ≤ 155 chars).

export const UI = {
  fr: {
    skip: "Aller au contenu",
    nav: { menu: "Menu", order: "Commander", book: "Réserver", story: "Notre histoire", catering: "Traiteur", contact: "Nous trouver" },
    langSwitch: "English",
    tagline: "Ici, on dit miam.",
    hoursTitle: "Heures d'ouverture",
    days: { Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi", Thursday: "Jeudi", Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche" },
    closed: "Fermé",
    footerLegal: ["Confidentialité", "Conditions", "Carrières", "FAQ", "Cartes-cadeaux", "Avis"],
    newsletterTitle: "La lettre miam",
    newsletterText: "Une fois par mois : nouveaux plats, soirées mezze et petites attentions. Désabonnement en un clic.",
    newsletterEmail: "Votre courriel",
    newsletterConsent: "J'accepte de recevoir la lettre de Miam's Resto Café. Je peux me désabonner en tout temps.",
    newsletterBtn: "Je m'inscris",
    comingSoon: "Bientôt disponible",
    callUs: "Appelez-nous",
    cookieText: "On utilise des témoins de mesure d'audience seulement si vous acceptez. Le site fonctionne très bien sans.",
    cookieAccept: "Accepter",
    cookieDecline: "Refuser",
    cookieLink: "Politique de confidentialité",
  },
  en: {
    skip: "Skip to content",
    nav: { menu: "Menu", order: "Order", book: "Book", story: "Our story", catering: "Catering", contact: "Find us" },
    langSwitch: "Français",
    tagline: "Here, we say miam.",
    hoursTitle: "Opening hours",
    days: { Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday" },
    closed: "Closed",
    footerLegal: ["Privacy", "Terms", "Careers", "FAQ", "Gift cards", "Reviews"],
    newsletterTitle: "The miam letter",
    newsletterText: "Once a month: new dishes, mezze evenings and small treats. Unsubscribe in one click.",
    newsletterEmail: "Your email",
    newsletterConsent: "I agree to receive emails from Miam's Resto Café. I can unsubscribe at any time.",
    newsletterBtn: "Sign me up",
    comingSoon: "Coming soon",
    callUs: "Call us",
    cookieText: "We only use audience-measurement cookies if you accept. The site works perfectly without them.",
    cookieAccept: "Accept",
    cookieDecline: "Decline",
    cookieLink: "Privacy policy",
  },
};

export const PAGES = [
  {
    key: "home",
    fr: {
      path: "/fr/",
      title: "Miam's Resto Café | Café & brunch méditerranéen à Montréal",
      description: "Café torréfié à Montréal, brunch méditerranéen maison et mezzes du jeudi. Réservez votre brunch sans file. Végane, végé et poulet halal.",
      h1: "Café sérieux, cuisine méditerranéenne maison, toute la journée.",
      body: `
<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Resto Café · {{NEIGHBOURHOOD}}, Montréal</p>
    <h1>Café sérieux, cuisine méditerranéenne maison, toute la journée.</h1>
    <p class="lead">Du premier latte au dernier mezze, on cuisine comme à la maison et on vous garde une place. <strong>Ici, on dit miam.</strong></p>
    <div class="cta-row">
      {{BTN_BOOK}}
      <a class="btn btn-ghost" href="/fr/menu/">Voir le menu</a>
      {{BTN_ORDER}}
    </div>
    {{OPEN_NOW}}
  </div>
  <div class="hero-art" aria-hidden="true">{{HERO_ART}}</div>
</section>

<section class="pillars">
  <article><h2>Fait maison, fait miam.</h2><p>Sauce de shakshuka mijotée trois heures, labneh égoutté la veille, falafels roulés à la main. Si on peut le faire, on le fait.</p></article>
  <article><h2>Toute la journée.</h2><p>Latte miel-cardamome dès 7 h 30, bols et pitas à midi, douceurs l'après-midi, mezzes à partager le jeudi et le vendredi soir.</p></article>
  <article><h2>Tout le monde à table.</h2><p>En français ou en anglais. Plats véganes, végés et poulet halal clairement indiqués. Et le brunch se réserve : fini la file sur le trottoir.</p></article>
</section>

<section class="signatures">
  <h2>Nos signatures</h2>
  {{SIGNATURES}}
  <p><a class="link-arrow" href="/fr/menu/">Tout le menu</a></p>
</section>

<section class="split">
  <div>
    <h2>Nourrir le bureau ?</h2>
    <p>Plateaux du matin, boîtes déjeuner étiquetées avec allergènes, grands plateaux mezze. Commande 48 h à l'avance, livraison avant 11 h 45.</p>
    <a class="btn" href="/fr/traiteur/">Découvrir le traiteur</a>
  </div>
  <div>
    <h2>Nous trouver</h2>
    {{NAP}}
    {{HOURS}}
  </div>
</section>`,
    },
    en: {
      path: "/en/",
      title: "Miam's Resto Café | Mediterranean café & brunch in Montréal",
      description: "Montréal-roasted coffee, homemade Mediterranean brunch and Thursday mezze. Book brunch, skip the line. Vegan, vegetarian and halal chicken.",
      h1: "Serious coffee, homemade Mediterranean food, all day long.",
      body: `
<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Resto Café · {{NEIGHBOURHOOD}}, Montréal</p>
    <h1>Serious coffee, homemade Mediterranean food, all day long.</h1>
    <p class="lead">From the first latte to the last mezze, we cook like at home and save you a seat. <strong>Here, we say miam.</strong></p>
    <div class="cta-row">
      {{BTN_BOOK}}
      <a class="btn btn-ghost" href="/en/menu/">See the menu</a>
      {{BTN_ORDER}}
    </div>
    {{OPEN_NOW}}
  </div>
  <div class="hero-art" aria-hidden="true">{{HERO_ART}}</div>
</section>

<section class="pillars">
  <article><h2>Made in-house. Made miam.</h2><p>Shakshuka sauce simmered for three hours, labneh drained overnight, falafel shaped by hand. If we can make it, we do.</p></article>
  <article><h2>All day long.</h2><p>Honey-cardamom lattes from 7:30, bowls and pitas at lunch, sweets in the afternoon, mezze to share on Thursday and Friday evenings.</p></article>
  <article><h2>Everyone at the table.</h2><p>In French or English. Vegan, vegetarian and halal chicken dishes, clearly marked. And brunch is bookable, so no more sidewalk queue.</p></article>
</section>

<section class="signatures">
  <h2>Our signatures</h2>
  {{SIGNATURES}}
  <p><a class="link-arrow" href="/en/menu/">Full menu</a></p>
</section>

<section class="split">
  <div>
    <h2>Feeding the office?</h2>
    <p>Morning platters, lunch boxes labelled with allergens, large mezze platters. Order 48 hours ahead, delivered before 11:45 am.</p>
    <a class="btn" href="/en/catering/">Explore catering</a>
  </div>
  <div>
    <h2>Find us</h2>
    {{NAP}}
    {{HOURS}}
  </div>
</section>`,
    },
  },
  {
    key: "menu",
    fr: {
      path: "/fr/menu/",
      title: "Menu | Brunch, café, bols & mezzes | Miam's Resto Café",
      description: "Shakshuka, pain perdu fleur d'oranger, bols poulet chermoula, lattes signature et mezzes. Filtres végane, végé, halal et allergènes.",
      h1: "Le menu",
      body: `{{MENU}}`,
    },
    en: {
      path: "/en/menu/",
      title: "Menu | Brunch, coffee, bowls & mezze | Miam's Resto Café",
      description: "Shakshuka, orange blossom French toast, chermoula chicken bowls, signature lattes and mezze. Vegan, vegetarian, halal and allergen filters.",
      h1: "The menu",
      body: `{{MENU}}`,
    },
  },
  {
    key: "order",
    fr: {
      path: "/fr/commander/",
      title: "Commander en ligne | Pour emporter | Miam's Resto Café",
      description: "Commandez en direct pour emporter : plus rapide et moins cher que les applis, sans frais de service. Prêt en 15 minutes.",
      h1: "Commander en ligne",
      body: `
<section class="narrow">
  <h1>Commander en ligne</h1>
  <p class="lead">Commandez en direct : c'est <strong>plus rapide et moins cher que les applis</strong>, et 100 % de votre commande va à la cuisine qui la prépare.</p>
  {{ORDER_BLOCK}}
  <ul class="checks">
    <li>Prêt en 15 minutes environ (20 à 25 minutes le week-end)</li>
    <li>Cueillette au comptoir, à gauche de l'entrée, à votre nom</li>
    <li>Allergènes indiqués pour chaque plat</li>
    <li>Vous gagnez des points fidélité à chaque commande</li>
  </ul>
  <p>Vous préférez la livraison ? On est aussi sur Uber Eats, DoorDash et SkipTheDishes, avec un menu pensé pour voyager.</p>
</section>`,
    },
    en: {
      path: "/en/order/",
      title: "Order online | Pickup | Miam's Resto Café",
      description: "Order direct for pickup: faster and cheaper than the apps, no service fees. Ready in about 15 minutes.",
      h1: "Order online",
      body: `
<section class="narrow">
  <h1>Order online</h1>
  <p class="lead">Order direct: it's <strong>faster and cheaper than the apps</strong>, and 100% of your order goes to the kitchen that makes it.</p>
  {{ORDER_BLOCK}}
  <ul class="checks">
    <li>Ready in about 15 minutes (20 to 25 on weekends)</li>
    <li>Pick up at the counter, left of the entrance, under your name</li>
    <li>Allergens listed for every dish</li>
    <li>You earn loyalty points with every order</li>
  </ul>
  <p>Prefer delivery? We're also on Uber Eats, DoorDash and SkipTheDishes, with a menu designed to travel.</p>
</section>`,
    },
  },
  {
    key: "book",
    fr: {
      path: "/fr/reserver/",
      title: "Réserver le brunch | Miam's Resto Café Montréal",
      description: "Réservez votre brunch à Montréal et oubliez la file. Tables de 2 à 8, liste d'attente par texto pour les sans-réservation.",
      h1: "Réserver",
      body: `
<section class="narrow">
  <h1>Réservez votre table</h1>
  <p class="lead">Parce que personne ne devrait attendre 45 minutes sur le trottoir un samedi de janvier.</p>
  {{BOOK_BLOCK}}
  <h2>Bon à savoir</h2>
  <ul class="checks">
    <li>Réservations de 2 à 8 personnes. Pour 9 personnes ou plus, écrivez-nous : on prépare un menu de groupe.</li>
    <li>Le week-end, les tables sont réservées pour 1 h 30. Personne ne vous presse avant.</li>
    <li>Sans réservation ? Inscrivez-vous sur place : on vous texte quand votre table est prête.</li>
    <li>Chaises hautes et place pour les poussettes : dites-le-nous en réservant.</li>
  </ul>
</section>`,
    },
    en: {
      path: "/en/book/",
      title: "Book brunch | Miam's Resto Café Montréal",
      description: "Book brunch in Montréal and skip the line. Tables for 2 to 8, SMS waitlist for walk-ins.",
      h1: "Book",
      body: `
<section class="narrow">
  <h1>Book your table</h1>
  <p class="lead">Because nobody should wait 45 minutes on the sidewalk on a Saturday in January.</p>
  {{BOOK_BLOCK}}
  <h2>Good to know</h2>
  <ul class="checks">
    <li>Bookings for 2 to 8 people. For 9 or more, email us and we'll prepare a group menu.</li>
    <li>On weekends, tables are held for 1 h 30. Nobody will rush you before that.</li>
    <li>No booking? Join the waitlist on site and we'll text you when your table is ready.</li>
    <li>High chairs and stroller space: just mention it when you book.</li>
  </ul>
</section>`,
    },
  },
  {
    key: "story",
    fr: {
      path: "/fr/notre-histoire/",
      title: "Notre histoire | Miam's Resto Café",
      description: "Une table sans porte, du café torréfié à Montréal et une cuisine méditerranéenne faite maison. L'histoire de Miam's Resto Café.",
      h1: "Notre histoire",
      body: `
<section class="narrow prose">
  <h1>Notre histoire</h1>
  <h2>Une table sans porte</h2>
  <p>Chez [prénom], on ne demandait jamais « Tu as faim ? ». On mettait une assiette. La cuisine de [ville/région d'origine] était petite, mais elle ne fermait jamais : une casserole de [plat de famille] sur le feu, un panier de pain, du thé à la menthe pour les grands et des tartines au miel pour les petits. Et, autour de la table, le même mot dans toutes les langues de la famille : « Miam. »</p>
  <h2>Montréal, à l'heure du café</h2>
  <p>Des années plus tard, à Montréal, [prénom] tombe amoureux·se d'une autre culture de table : celle des cafés de quartier, où l'on s'installe avec un latte et un livre, où le barista connaît votre prénom. Il manquait pourtant quelque chose : un endroit où le café est sérieux <em>et</em> où la cuisine nourrit vraiment. Où l'on peut commencer la journée avec un croissant et la finir autour d'une planche de mezzes.</p>
  <h2>Ce qu'on fait, et comment</h2>
  <p>Miam's Resto Café, c'est cette table-là. Notre café est torréfié à Montréal par [torréfacteur]. Nos viennoiseries sont dorées chaque matin. Nos sauces, notre labneh, nos falafels, notre granola et notre chaï sont faits ici, tous les jours. La sauce de notre shakshuka mijote trois heures, parce que c'est le temps qu'il faut. Et quand on ne fait pas quelque chose nous-mêmes, on vous dit qui le fait.</p>
  <h2>Tout le monde à table</h2>
  <p>Ici, on vous accueille en français ou en anglais. On a des plats véganes, végétariens et du poulet halal, clairement indiqués, et nos allergènes sont affichés sur chaque menu. On prend les réservations pour le brunch, parce que personne ne devrait attendre 45 minutes sur le trottoir un samedi de janvier.</p>
  <h2>Le quartier, notre famille élargie</h2>
  <p>On travaille avec des producteurs d'ici : miel du Québec, pain de [boulangerie partenaire], café de [torréfacteur]. Chaque mois, on s'implique dans le quartier, avec l'école, le marché ou l'organisme du coin.</p>
  <p>Alors entrez, installez-vous. Il y a toujours une chaise de plus.</p>
  <p class="signoff">Assieds-toi, c'est prêt.</p>
</section>`,
    },
    en: {
      path: "/en/our-story/",
      title: "Our story | Miam's Resto Café",
      description: "A table without a door, Montréal-roasted coffee and homemade Mediterranean cooking. The story of Miam's Resto Café.",
      h1: "Our story",
      body: `
<section class="narrow prose">
  <h1>Our story</h1>
  <h2>A table without a door</h2>
  <p>In [first name]'s family, nobody asked "Are you hungry?" They just set a plate. The kitchen in [city/region of origin] was small, but it never closed: a pot of [family dish] on the stove, a basket of bread, mint tea for the grown-ups and honey toast for the kids. And around the table, the same word in every language the family spoke: "Miam."</p>
  <h2>Montréal, at coffee time</h2>
  <p>Years later in Montréal, [first name] fell for a different table culture: neighbourhood cafés where you settle in with a latte and a book, and the barista knows your name. Yet something was missing: a place where the coffee is serious <em>and</em> the food truly feeds you. Somewhere you could start the day with a croissant and end it around a mezze board.</p>
  <h2>What we make, and how</h2>
  <p>Miam's Resto Café is that table. Our coffee is roasted in Montréal by [roaster]. Our pastries come out golden every morning. Our sauces, labneh, falafel, granola and chai are made here, every day. Our shakshuka sauce simmers for three hours, because that's how long it takes. And when we don't make something ourselves, we'll tell you who does.</p>
  <h2>Everyone at the table</h2>
  <p>We'll welcome you in French or English. We have vegan and vegetarian dishes and halal chicken, clearly marked, and our allergens are listed on every menu. We take brunch reservations, because nobody should wait 45 minutes on the sidewalk on a Saturday in January.</p>
  <h2>The neighbourhood is family</h2>
  <p>We work with local producers: Québec honey, bread from [partner bakery], coffee from [roaster]. Every month we show up for the neighbourhood, at the school, the market or the local community group.</p>
  <p>So come in and make yourself at home. There's always one more chair.</p>
  <p class="signoff">Sit down, it's ready.</p>
</section>`,
    },
  },
  {
    key: "catering",
    fr: {
      path: "/fr/traiteur/",
      title: "Traiteur bureau Montréal | Boîtes déjeuner & plateaux | Miam's",
      description: "Traiteur méditerranéen pour le bureau à Montréal : plateaux du matin, boîtes déjeuner étiquetées, plateaux mezze. Livraison avant 11 h 45.",
      h1: "Traiteur",
      body: `
<section class="narrow">
  <h1>Nourrir le bureau, sans stress.</h1>
  <p class="lead">Réunions d'équipe, journées d'accueil, fêtes de bureau : on s'occupe du miam, vous vous occupez du reste.</p>
  {{CATERING}}
  <h2>Comment ça marche</h2>
  <ol class="steps">
    <li><strong>Commandez 48 h à l'avance</strong> par courriel ou par téléphone : nombre de personnes, heure, adresse, restrictions alimentaires.</li>
    <li><strong>Recevez votre soumission</strong> en moins de 4 heures ouvrables. Bon de commande et facture d'entreprise acceptés.</li>
    <li><strong>On livre avant 11 h 45</strong> dans un rayon de 5 km (frais selon la zone). Chaque boîte est étiquetée : nom, plat, allergènes.</li>
  </ol>
  <p><a class="btn" href="mailto:{{EMAIL}}?subject=Demande%20traiteur">Demander une soumission</a> <a class="btn btn-ghost" href="tel:{{PHONE}}">{{PHONE_DISPLAY}}</a></p>
  <h2>Événements privés</h2>
  <p>Anniversaires, showers, lancements : privatisez le café (jusqu'à 30 personnes) le soir, du lundi au mercredi ou le week-end après 16 h. Menu mezze sur mesure.</p>
</section>`,
    },
    en: {
      path: "/en/catering/",
      title: "Office catering Montréal | Lunch boxes & platters | Miam's",
      description: "Mediterranean office catering in Montréal: morning platters, labelled lunch boxes, mezze platters. Delivered before 11:45 am.",
      h1: "Catering",
      body: `
<section class="narrow">
  <h1>Feed the office, stress-free.</h1>
  <p class="lead">Team meetings, onboarding days, office parties: we handle the miam, you handle the rest.</p>
  {{CATERING}}
  <h2>How it works</h2>
  <ol class="steps">
    <li><strong>Order 48 hours ahead</strong> by email or phone: headcount, time, address, dietary needs.</li>
    <li><strong>Get your quote</strong> within 4 business hours. Purchase orders and company invoices accepted.</li>
    <li><strong>Delivered before 11:45 am</strong> within 5 km (fee depends on zone). Every box is labelled with name, dish and allergens.</li>
  </ol>
  <p><a class="btn" href="mailto:{{EMAIL}}?subject=Catering%20request">Request a quote</a> <a class="btn btn-ghost" href="tel:{{PHONE}}">{{PHONE_DISPLAY}}</a></p>
  <h2>Private events</h2>
  <p>Birthdays, showers, launches: book the whole café (up to 30 guests) in the evening from Monday to Wednesday, or on weekends after 4 pm. Custom mezze menu.</p>
</section>`,
    },
  },
  {
    key: "gift",
    fr: {
      path: "/fr/cartes-cadeaux/",
      title: "Cartes-cadeaux | Miam's Resto Café",
      description: "Offrez un brunch, un latte ou une soirée mezze. Cartes-cadeaux Miam's en ligne ou au comptoir, sans date d'expiration.",
      h1: "Cartes-cadeaux",
      body: `
<section class="narrow">
  <h1>Offrez du miam.</h1>
  <p class="lead">Un brunch pour deux, dix lattes, une soirée mezze : la carte-cadeau qui fait toujours plaisir.</p>
  {{GIFT_BLOCK}}
  <ul class="checks">
    <li>Montants de 25 $ à 200 $, ou au choix</li>
    <li>Envoyée par courriel en quelques secondes, ou en carte physique au comptoir</li>
    <li>Aucune date d'expiration, conformément à la loi québécoise</li>
    <li>Entreprises : cartes-cadeaux en lot pour vos équipes et clients. Écrivez-nous.</li>
  </ul>
</section>`,
    },
    en: {
      path: "/en/gift-cards/",
      title: "Gift cards | Miam's Resto Café",
      description: "Give brunch, a latte or a mezze night. Miam's gift cards online or at the counter, with no expiry date.",
      h1: "Gift cards",
      body: `
<section class="narrow">
  <h1>Give some miam.</h1>
  <p class="lead">Brunch for two, ten lattes, a mezze night: the gift that always lands.</p>
  {{GIFT_BLOCK}}
  <ul class="checks">
    <li>From $25 to $200, or any amount</li>
    <li>Sent by email in seconds, or as a physical card at the counter</li>
    <li>No expiry date, as required by Québec law</li>
    <li>Companies: bulk gift cards for teams and clients. Email us.</li>
  </ul>
</section>`,
    },
  },
  {
    key: "reviews",
    fr: {
      path: "/fr/avis/",
      title: "Avis clients | Miam's Resto Café",
      description: "Ce que nos clients disent de Miam's Resto Café, et comment nous laisser un avis sur Google.",
      h1: "Avis",
      body: `
<section class="narrow">
  <h1>Vous avez dit miam ?</h1>
  <p class="lead">Vos avis aident nos voisins à nous trouver, et nous aident à nous améliorer. On les lit tous, et on répond à chacun.</p>
  {{REVIEW_BLOCK}}
  <p>Quelque chose ne s'est pas bien passé ? Écrivez-nous directement à <a href="mailto:{{EMAIL}}">{{EMAIL}}</a> : la personne propriétaire vous répond sous 24 h.</p>
</section>`,
    },
    en: {
      path: "/en/reviews/",
      title: "Reviews | Miam's Resto Café",
      description: "What guests say about Miam's Resto Café, and how to leave us a Google review.",
      h1: "Reviews",
      body: `
<section class="narrow">
  <h1>Did you say miam?</h1>
  <p class="lead">Your reviews help neighbours find us and help us get better. We read every one and reply to each.</p>
  {{REVIEW_BLOCK}}
  <p>Something went wrong? Email us directly at <a href="mailto:{{EMAIL}}">{{EMAIL}}</a> and the owner will reply within 24 hours.</p>
</section>`,
    },
  },
  {
    key: "faq",
    fr: { path: "/fr/faq/", title: "FAQ | Miam's Resto Café", description: "Réservations, végane, halal, allergènes, Wi-Fi, poussettes, traiteur : toutes vos questions sur Miam's Resto Café.", h1: "Questions fréquentes", body: `<section class="narrow"><h1>Questions fréquentes</h1>{{FAQ}}</section>` },
    en: { path: "/en/faq/", title: "FAQ | Miam's Resto Café", description: "Bookings, vegan, halal, allergens, Wi-Fi, strollers, catering: all your questions about Miam's Resto Café.", h1: "Frequently asked questions", body: `<section class="narrow"><h1>Frequently asked questions</h1>{{FAQ}}</section>` },
  },
  {
    key: "contact",
    fr: {
      path: "/fr/contact/",
      title: "Nous trouver | Adresse & heures | Miam's Resto Café Montréal",
      description: "Adresse, heures d'ouverture, téléphone et accès en transport de Miam's Resto Café à Montréal.",
      h1: "Nous trouver",
      body: `
<section class="split">
  <div>
    <h1>Nous trouver</h1>
    {{NAP}}
    <p><a class="btn" href="{{MAPS_URL}}" rel="noopener" target="_blank">Itinéraire</a> <a class="btn btn-ghost" href="tel:{{PHONE}}">Appeler</a></p>
    <h2>Accès</h2>
    <p>Métro : [station], à [x] minutes à pied. Bixi : station [nom] devant la porte. Stationnement sur rue, zone [x].</p>
    <p>Entrée de plain-pied. Toilette accessible : [oui/non, à confirmer].</p>
  </div>
  <div>{{HOURS}}{{MAP}}</div>
</section>`,
    },
    en: {
      path: "/en/contact/",
      title: "Find us | Address & hours | Miam's Resto Café Montréal",
      description: "Address, opening hours, phone and transit directions for Miam's Resto Café in Montréal.",
      h1: "Find us",
      body: `
<section class="split">
  <div>
    <h1>Find us</h1>
    {{NAP}}
    <p><a class="btn" href="{{MAPS_URL}}" rel="noopener" target="_blank">Directions</a> <a class="btn btn-ghost" href="tel:{{PHONE}}">Call</a></p>
    <h2>Getting here</h2>
    <p>Metro: [station], [x] minutes' walk. Bixi: [name] station right outside. Street parking, zone [x].</p>
    <p>Step-free entrance. Accessible washroom: [yes/no, to confirm].</p>
  </div>
  <div>{{HOURS}}{{MAP}}</div>
</section>`,
    },
  },
  {
    key: "careers",
    fr: {
      path: "/fr/carrieres/",
      title: "Carrières | Travailler chez Miam's Resto Café",
      description: "Barista, cuisine, service : rejoignez l'équipe de Miam's Resto Café à Montréal. Horaires stables, pourboires partagés, repas inclus.",
      h1: "Carrières",
      body: `
<section class="narrow">
  <h1>Assieds-toi… ou viens cuisiner avec nous.</h1>
  <p class="lead">On cherche des gens qui aiment faire plaisir : baristas, cuisinier·ères, plongeur·euses, serveur·euses.</p>
  <ul class="checks">
    <li>Horaires publiés deux semaines à l'avance</li>
    <li>Pourboires partagés de façon transparente entre la salle et la cuisine</li>
    <li>Repas et cafés inclus pendant le quart</li>
    <li>Formation barista et cuisine méditerranéenne</li>
    <li>Fermé le soir du samedi au mercredi : une vie après le travail</li>
  </ul>
  <p><a class="btn" href="mailto:{{EMAIL}}?subject=Candidature">Envoyer ma candidature</a></p>
  <p class="small">Joignez votre CV ou quelques lignes sur vous. On répond à tout le monde.</p>
</section>`,
    },
    en: {
      path: "/en/careers/",
      title: "Careers | Work at Miam's Resto Café",
      description: "Barista, kitchen, floor: join the Miam's Resto Café team in Montréal. Stable schedules, shared tips, meals included.",
      h1: "Careers",
      body: `
<section class="narrow">
  <h1>Take a seat… or come cook with us.</h1>
  <p class="lead">We're looking for people who love making others happy: baristas, cooks, dishwashers and servers.</p>
  <ul class="checks">
    <li>Schedules posted two weeks in advance</li>
    <li>Tips shared transparently between floor and kitchen</li>
    <li>Meals and coffee included on shift</li>
    <li>Barista and Mediterranean kitchen training</li>
    <li>Closed evenings Saturday to Wednesday: a life after work</li>
  </ul>
  <p><a class="btn" href="mailto:{{EMAIL}}?subject=Application">Send my application</a></p>
  <p class="small">Attach a CV or a few lines about yourself. We reply to everyone. French is required for guest-facing roles.</p>
</section>`,
    },
  },
  {
    key: "privacy",
    fr: {
      path: "/fr/confidentialite/",
      title: "Politique de confidentialité | Miam's Resto Café",
      description: "Comment Miam's Resto Café recueille, utilise et protège vos renseignements personnels, conformément à la Loi 25.",
      h1: "Politique de confidentialité",
      body: `
<section class="narrow prose">
  <h1>Politique de confidentialité</h1>
  <p class="small">Dernière mise à jour : {{UPDATED}}</p>
  <p>[Raison sociale] (« Miam's Resto Café », « nous ») respecte votre vie privée et se conforme à la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> du Québec (modifiée par la Loi 25) et à la <em>Loi canadienne anti-pourriel</em>.</p>
  <h2>Responsable de la protection des renseignements personnels</h2>
  <p>[Nom et titre de la personne responsable], <a href="mailto:{{EMAIL}}">{{EMAIL}}</a>, {{ADDRESS_LINE}}.</p>
  <h2>Ce que nous recueillons et pourquoi</h2>
  <ul>
    <li><strong>Commandes en ligne et réservations</strong> : nom, téléphone, courriel, détails de commande, allergies déclarées, afin de préparer votre commande, vous joindre et respecter vos besoins alimentaires.</li>
    <li><strong>Programme de fidélité et infolettre</strong> (avec votre consentement exprès) : nom, courriel ou téléphone, date d'anniversaire (facultative), historique d'achats, afin de vous accorder des récompenses et de vous envoyer nos communications.</li>
    <li><strong>Traiteur</strong> : coordonnées professionnelles et de facturation.</li>
    <li><strong>Site web</strong> : si vous acceptez les témoins de mesure d'audience, des données de navigation anonymisées (Google Analytics, Meta). Ces témoins sont <strong>désactivés par défaut</strong>.</li>
  </ul>
  <p>Nous ne conservons jamais les numéros de carte de paiement : les paiements sont traités par notre fournisseur certifié [fournisseur de paiement].</p>
  <h2>Communication à des tiers</h2>
  <p>Nous partageons uniquement ce qui est nécessaire avec nos fournisseurs de services (point de vente, réservations, envoi de courriels, hébergement), liés par contrat à des obligations de confidentialité. Certains peuvent héberger des données à l'extérieur du Québec ; nous évaluons ces transferts avant de les faire. Nous ne vendons jamais vos renseignements.</p>
  <h2>Conservation</h2>
  <p>Commandes : 7 ans (obligations fiscales). Fidélité et infolettre : jusqu'au retrait de votre consentement ou 3 ans d'inactivité. Réservations : 12 mois.</p>
  <h2>Vos droits</h2>
  <p>Vous pouvez accéder à vos renseignements, les faire corriger, retirer votre consentement, demander la désindexation ou la suppression, et porter plainte à la Commission d'accès à l'information. Écrivez-nous : nous répondons dans un délai de 30 jours.</p>
  <h2>Incidents de confidentialité</h2>
  <p>Nous tenons un registre des incidents et avisons les personnes concernées et la Commission lorsqu'un incident présente un risque de préjudice sérieux.</p>
</section>`,
    },
    en: {
      path: "/en/privacy/",
      title: "Privacy policy | Miam's Resto Café",
      description: "How Miam's Resto Café collects, uses and protects your personal information, in line with Québec's Law 25.",
      h1: "Privacy policy",
      body: `
<section class="narrow prose">
  <h1>Privacy policy</h1>
  <p class="small">Last updated: {{UPDATED}}</p>
  <p>[Legal name] ("Miam's Resto Café", "we") respects your privacy and complies with Québec's <em>Act respecting the protection of personal information in the private sector</em> (as amended by Law 25) and Canada's Anti-Spam Legislation (CASL).</p>
  <h2>Person in charge of personal information</h2>
  <p>[Name and title], <a href="mailto:{{EMAIL}}">{{EMAIL}}</a>, {{ADDRESS_LINE}}.</p>
  <h2>What we collect and why</h2>
  <ul>
    <li><strong>Online orders and reservations</strong>: name, phone, email, order details and declared allergies, to prepare your order, contact you and respect your dietary needs.</li>
    <li><strong>Loyalty and newsletter</strong> (with your express consent): name, email or phone, birthday (optional) and purchase history, to give you rewards and send you our communications.</li>
    <li><strong>Catering</strong>: business contact and billing details.</li>
    <li><strong>Website</strong>: if you accept audience-measurement cookies, anonymised browsing data (Google Analytics, Meta). These cookies are <strong>off by default</strong>.</li>
  </ul>
  <p>We never store payment card numbers: payments are processed by our certified provider [payment provider].</p>
  <h2>Sharing with third parties</h2>
  <p>We share only what is necessary with our service providers (point of sale, reservations, email delivery, hosting), who are contractually bound to confidentiality. Some may host data outside Québec; we assess those transfers before making them. We never sell your information.</p>
  <h2>Retention</h2>
  <p>Orders: 7 years (tax obligations). Loyalty and newsletter: until you withdraw consent or after 3 years of inactivity. Reservations: 12 months.</p>
  <h2>Your rights</h2>
  <p>You can access and correct your information, withdraw consent, request de-indexing or deletion, and file a complaint with the Commission d'accès à l'information. Write to us and we'll reply within 30 days.</p>
  <h2>Privacy incidents</h2>
  <p>We keep an incident register and notify affected people and the Commission when an incident presents a risk of serious injury.</p>
</section>`,
    },
  },
  {
    key: "terms",
    fr: {
      path: "/fr/conditions/",
      title: "Conditions d'utilisation | Miam's Resto Café",
      description: "Conditions des commandes en ligne, réservations, cartes-cadeaux et programme de fidélité de Miam's Resto Café.",
      h1: "Conditions",
      body: `
<section class="narrow prose">
  <h1>Conditions d'utilisation</h1>
  <p class="small">Dernière mise à jour : {{UPDATED}}</p>
  <h2>Prix et taxes</h2><p>Les prix sont en dollars canadiens, taxes en sus (TPS 5 %, TVQ 9,975 %). Les prix sur les applications de livraison peuvent différer des prix en salle.</p>
  <h2>Commandes en ligne</h2><p>Une commande est confirmée à la réception du courriel de confirmation. Annulation gratuite tant que la préparation n'a pas commencé.</p>
  <h2>Réservations</h2><p>Les tables sont gardées 15 minutes après l'heure prévue. Pour les groupes de 9 personnes et plus ou les événements privés, un dépôt peut être demandé ; il est remboursable jusqu'à 72 h avant l'événement.</p>
  <h2>Cartes-cadeaux</h2><p>Sans date d'expiration et sans frais d'inactivité. Non échangeables contre de l'argent, sauf lorsque la loi l'exige.</p>
  <h2>Programme de fidélité</h2><p>Les points n'ont pas de valeur monétaire et ne sont pas transférables. Nous vous aviserons 30 jours à l'avance de toute modification du programme.</p>
  <h2>Allergies</h2><p>Nos plats sont préparés dans une cuisine où sont manipulés les 11 allergènes prioritaires. Nous ne pouvons pas garantir l'absence de traces.</p>
</section>`,
    },
    en: {
      path: "/en/terms/",
      title: "Terms of use | Miam's Resto Café",
      description: "Terms for online orders, reservations, gift cards and the loyalty program at Miam's Resto Café.",
      h1: "Terms",
      body: `
<section class="narrow prose">
  <h1>Terms of use</h1>
  <p class="small">Last updated: {{UPDATED}}</p>
  <h2>Prices and taxes</h2><p>Prices are in Canadian dollars, taxes extra (GST 5%, QST 9.975%). Prices on delivery apps may differ from in-store prices.</p>
  <h2>Online orders</h2><p>An order is confirmed when you receive the confirmation email. Free cancellation until preparation has started.</p>
  <h2>Reservations</h2><p>Tables are held for 15 minutes after the booked time. For groups of 9 or more, or private events, a deposit may be requested; it is refundable up to 72 hours before the event.</p>
  <h2>Gift cards</h2><p>No expiry date and no inactivity fees. Not redeemable for cash except where required by law.</p>
  <h2>Loyalty program</h2><p>Points have no cash value and are not transferable. We'll give 30 days' notice of any change to the program.</p>
  <h2>Allergies</h2><p>Our food is prepared in a kitchen that handles all 11 priority allergens. We cannot guarantee the absence of traces.</p>
</section>`,
    },
  },
];

// FAQ: also used for FAQPage schema and the Google Business Profile Q&A (Phase 7).
export const FAQ = {
  fr: [
    ["Est-ce qu'on peut réserver pour le brunch ?", "Oui ! Réservez en ligne pour 2 à 8 personnes, 7 jours sur 7. Sans réservation, inscrivez-vous sur la liste d'attente sur place et on vous texte quand votre table est prête."],
    ["Avez-vous des options véganes et végétariennes ?", "Oui, beaucoup : bol mezze, wrap falafel, soupe lentilles-citron, frites au zaatar et falafels sont véganes ; la plupart de nos plats brunch sont végétariens. Tout est indiqué sur le menu."],
    ["Votre viande est-elle halal ?", "Notre poulet est certifié halal. Notre cuisine n'est pas exclusivement halal, et nous ne servons pas de porc."],
    ["Comment gérez-vous les allergies ?", "Les allergènes de chaque plat sont indiqués sur nos menus et sur notre menu en ligne, avec des filtres. Nous manipulons les 11 allergènes prioritaires dans la même cuisine : dites-nous toute allergie avant de commander."],
    ["Avez-vous des plats sans gluten ?", "Certains plats ne contiennent aucun ingrédient à base de gluten (gâteau orange-amande, halloumi grillé, soupe sur demande sans pain), mais notre cuisine n'est pas sans gluten et nous ne pouvons pas garantir l'absence de traces."],
    ["Y a-t-il le Wi-Fi et des prises pour travailler ?", "Oui, Wi-Fi gratuit et prises au comptoir-fenêtre. En semaine, travaillez aussi longtemps que vous voulez. Le week-end entre 10 h et 14 h, on garde les tables pour le brunch."],
    ["Est-ce adapté aux enfants ?", "Oui : menu enfants, chaises hautes, place pour les poussettes et crayons sur la table."],
    ["Livrez-vous ?", "Oui, via Uber Eats, DoorDash et SkipTheDishes. Pour moins cher, commandez en direct sur notre site pour emporter."],
    ["Faites-vous du traiteur pour les bureaux ?", "Oui : plateaux du matin, boîtes déjeuner étiquetées et plateaux mezze, livrés avant 11 h 45 avec 48 h de préavis."],
    ["Peut-on privatiser le café ?", "Oui, jusqu'à 30 personnes, le soir du lundi au mercredi ou le week-end après 16 h, avec un menu mezze sur mesure."],
    ["Servez-vous de l'alcool ?", "Pas encore. Vins et bières accompagneront bientôt nos soirées mezze. En attendant : limonade maison, thé à la menthe et lattes signature."],
    ["D'où vient votre café ?", "Il est torréfié à Montréal par [torréfacteur]. Le café filtre change d'origine chaque semaine."],
  ],
  en: [
    ["Can I book for brunch?", "Yes! Book online for 2 to 8 people, 7 days a week. No booking? Join the waitlist on site and we'll text you when your table is ready."],
    ["Do you have vegan and vegetarian options?", "Plenty: the mezze bowl, falafel wrap, lemon lentil soup, za'atar fries and falafel are vegan, and most brunch dishes are vegetarian. Everything is marked on the menu."],
    ["Is your meat halal?", "Our chicken is halal-certified. Our kitchen is not exclusively halal, and we don't serve pork."],
    ["How do you handle allergies?", "Allergens for every dish are listed on our menus and on our online menu, with filters. We handle all 11 priority allergens in the same kitchen, so please tell us about any allergy before ordering."],
    ["Do you have gluten-free dishes?", "Some dishes contain no gluten ingredients (orange-almond cake, grilled halloumi, soup without bread on request), but our kitchen isn't gluten-free and we can't guarantee the absence of traces."],
    ["Is there Wi-Fi and outlets for working?", "Yes, free Wi-Fi and outlets at the window bar. On weekdays, work as long as you like. On weekends from 10 am to 2 pm, we keep tables for brunch."],
    ["Is it kid-friendly?", "Yes: kids' menu, high chairs, stroller space and crayons on the table."],
    ["Do you deliver?", "Yes, through Uber Eats, DoorDash and SkipTheDishes. To save money, order direct for pickup on our website."],
    ["Do you cater for offices?", "Yes: morning platters, labelled lunch boxes and mezze platters, delivered before 11:45 am with 48 hours' notice."],
    ["Can we book the café privately?", "Yes, up to 30 guests, in the evening from Monday to Wednesday or on weekends after 4 pm, with a custom mezze menu."],
    ["Do you serve alcohol?", "Not yet. Wine and beer will soon join our mezze evenings. Meanwhile: house lemonade, mint tea and signature lattes."],
    ["Where does your coffee come from?", "It's roasted in Montréal by [roaster]. Our filter coffee changes origin every week."],
  ],
};
