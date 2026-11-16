/**
 * Génère l'image Open Graph et l'icône Apple.
 * Usage : npm run images
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const out = new URL("../public/images/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// L'image d'accueil (public/images/saint-leonard-*.webp) a été générée avec Higgsfield.

// Le portrait de Zouhaier (public/images/zouhaier-othmani.webp) est une vraie photo : ce script ne le touche plus.

// Image Open Graph 1200 × 630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#2a2a5c"/>
<g fill="none" stroke="#6fc1d8" stroke-opacity=".3"><circle cx="1050" cy="120" r="200"/><circle cx="1050" cy="120" r="300"/><circle cx="1050" cy="120" r="400"/></g>
<rect x="80" y="80" width="72" height="72" rx="20" fill="#ffffff"/>
<g transform="translate(88 101) scale(.44)"><path d="M 52.5 32 A 21.5 21.5 0 1 0 17.18 47.47" fill="none" stroke="#2a2a5c" stroke-width="15"/><path d="M15 62 L35 62 L61 39 L41 39 Z" fill="#56bfdc"/><clipPath id="c"><path d="M60 0H128V23H96V63H60Z"/></clipPath><path d="M 116.5 32 A 21.5 21.5 0 1 0 81.18 47.47" fill="none" stroke="#2a2a5c" stroke-width="15" clip-path="url(#c)"/><path d="M79 62 L99 62 L125 39 L105 39 Z" fill="#56bfdc"/></g>
<text x="80" y="300" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">Votre cabinet CPA à Montréal,</text>
<text x="80" y="384" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#6fc1d8">sans le stress.</text>
<text x="80" y="470" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" opacity=".9">Particuliers et entreprises · Montréal et partout au Canada</text>
<text x="80" y="550" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Othmani CPA Inc.</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(out + "og.png");

// Icône Apple
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a2a5c"/><g transform="translate(7 18.5) scale(.39)"><path d="M 52.5 32 A 21.5 21.5 0 1 0 17.18 47.47" fill="none" stroke="#fff" stroke-width="15"/><path d="M15 62 L35 62 L61 39 L41 39 Z" fill="#56bfdc"/><clipPath id="c"><path d="M60 0H128V23H96V63H60Z"/></clipPath><path d="M 116.5 32 A 21.5 21.5 0 1 0 81.18 47.47" fill="none" stroke="#fff" stroke-width="15" clip-path="url(#c)"/><path d="M79 62 L99 62 L125 39 L105 39 Z" fill="#56bfdc"/></g></svg>`;
await sharp(Buffer.from(icon), { density: 600 }).resize(180, 180).png().toFile(out + "apple-touch-icon.png");
console.log("Images générées dans public/images/");
