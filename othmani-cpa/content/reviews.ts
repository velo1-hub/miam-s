/**
 * Avis Google — VRAIS AVIS SEULEMENT (règles de publicité de l'Ordre des CPA du Québec).
 * Copiez ici, mot pour mot, des avis publiés sur la fiche Google du cabinet,
 * avec le prénom tel qu'affiché et la date. Ne modifiez jamais le texte d'un avis.
 * Tant que la liste est vide, la section affiche simplement les liens vers Google.
 */
export type Review = { author: string; date: string; rating: 1 | 2 | 3 | 4 | 5; text: string; lang: "fr" | "en" };

export const reviews: Review[] = [];
