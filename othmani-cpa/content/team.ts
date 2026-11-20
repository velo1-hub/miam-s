/** Membres de l'équipe. Pour ajouter quelqu'un : une photo WebP 800 × 1000 dans /public/images et une entrée ici. */
export type Member = {
  id: string;
  name: string;
  photo: string;
  thumb?: string;
  fr: { role: string; text: string };
  en: { role: string; text: string };
};

export const team: Member[] = [
  {
    id: "zouhaier",
    name: "Zouhaier Othmani",
    photo: "/images/zouhaier-othmani.webp",
    fr: { role: "CPA auditeur, fondateur", text: "Membre de l'Ordre des CPA du Québec. Il supervise chaque dossier et signe les missions d'examen et d'audit." },
    en: { role: "CPA auditor, founder", text: "Member of the Ordre des CPA du Québec. He oversees every file and signs review and audit engagements." },
  },
  {
    id: "racha",
    name: "Racha Ghazoini",
    photo: "/images/racha-ghazoini.webp",
    thumb: "/images/racha-ghazoini-thumb.webp",
    fr: { role: "Technicienne comptable", text: "Racha prépare les dossiers, fait le suivi de vos documents et répond à vos questions au quotidien." },
    en: { role: "Accounting technician", text: "Racha prepares files, follows up on your documents and answers your day-to-day questions." },
  },
];
