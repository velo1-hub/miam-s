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
<path d="M131 103 A18 18 0 1 0 131 129" fill="none" stroke="#2a2a5c" stroke-width="5.5" stroke-linecap="round"/>
<path d="M109.5 117 l5.5 5.5 l13 -13.5" fill="none" stroke="#6fc1d8" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
<text x="80" y="300" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">Votre CPA à Saint-Léonard,</text>
<text x="80" y="384" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#6fc1d8">sans le stress.</text>
<text x="80" y="470" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" opacity=".9">Particuliers et entreprises · Impôts · TPS/TVQ · États financiers</text>
<text x="80" y="550" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Othmani CPA Inc.</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(out + "og.png");

// Icône Apple
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#2a2a5c"/><path d="M27.8 13.2A10 10 0 1 0 27.8 26.8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M16 20.4l3.2 3.2 7.6-8" fill="none" stroke="#6fc1d8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
await sharp(Buffer.from(icon), { density: 600 }).resize(180, 180).png().toFile(out + "apple-touch-icon.png");
console.log("Images générées dans public/images/");
