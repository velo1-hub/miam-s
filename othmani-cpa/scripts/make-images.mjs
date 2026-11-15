/**
 * Génère les images provisoires (WebP) : visuel du héros, portrait temporaire, image Open Graph.
 * ⚠️ Le portrait est un espace réservé : remplacez public/images/zouhaier-othmani.webp
 *    par la vraie photo de Zouhaier (800 × 1000 px, WebP, < 120 Ko).
 * Usage : npm run images
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const out = new URL("../public/images/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// Visuel du héros : colonnes de chiffres stylisées et courbes douces (aucune banque d'images)
const W = 1600, H = 1000;
let cols = "";
for (let x = 0; x < W; x += 64) cols += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff" stroke-opacity="0.045"/>`;
for (let y = 0; y < H; y += 64) cols += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff" stroke-opacity="0.035"/>`;
let bars = "";
const seed = [0.42, 0.58, 0.5, 0.7, 0.62, 0.8, 0.74, 0.9, 0.86, 1];
seed.forEach((h, i) => {
  const bw = 46, gap = 26, x = 860 + i * (bw + gap), bh = h * 420;
  bars += `<rect x="${x}" y="${820 - bh}" width="${bw}" height="${bh}" rx="12" fill="url(#bar)" opacity="${0.35 + h * 0.5}"/>`;
});
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17173a"/><stop offset=".55" stop-color="#2a2a5c"/><stop offset="1" stop-color="#34407a"/></linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc1d8"/><stop offset="1" stop-color="#6fc1d8" stop-opacity="0.15"/></linearGradient>
  <radialGradient id="glow" cx=".78" cy=".35" r=".55"><stop offset="0" stop-color="#6fc1d8" stop-opacity=".35"/><stop offset="1" stop-color="#6fc1d8" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${cols}
${bars}
<path d="M780 760 C 980 700, 1080 560, 1240 520 S 1500 380, 1640 300" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="5" stroke-linecap="round"/>
<circle cx="1240" cy="520" r="11" fill="#6fc1d8"/>
<g fill="none" stroke="#6fc1d8" stroke-opacity=".25"><circle cx="1290" cy="300" r="220"/><circle cx="1290" cy="300" r="320"/><circle cx="1290" cy="300" r="420"/></g>
</svg>`;
await sharp(Buffer.from(hero)).webp({ quality: 78 }).toFile(out + "hero-1600.webp");
await sharp(Buffer.from(hero)).resize(800, 1000, { fit: "cover", position: "right" }).webp({ quality: 74 }).toFile(out + "hero-800.webp");

// Portrait provisoire (à remplacer par la vraie photo)
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f4f9"/><stop offset="1" stop-color="#c9e8f1"/></linearGradient></defs>
<rect width="800" height="1000" fill="url(#p)"/>
<circle cx="400" cy="400" r="150" fill="#2a2a5c" opacity=".9"/>
<path d="M150 1000 C 150 760, 260 640, 400 640 S 650 760, 650 1000 Z" fill="#2a2a5c" opacity=".9"/>
<text x="400" y="430" font-family="Arial, sans-serif" font-size="96" font-weight="700" fill="#ffffff" text-anchor="middle">ZO</text>
<text x="400" y="930" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" text-anchor="middle" opacity=".85">Photo à venir</text>
</svg>`;
await sharp(Buffer.from(portrait)).webp({ quality: 80 }).toFile(out + "zouhaier-othmani.webp");

// Image Open Graph 1200 × 630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#2a2a5c"/>
<g fill="none" stroke="#6fc1d8" stroke-opacity=".3"><circle cx="1050" cy="120" r="200"/><circle cx="1050" cy="120" r="300"/><circle cx="1050" cy="120" r="400"/></g>
<rect x="80" y="80" width="72" height="72" rx="20" fill="#ffffff"/>
<circle cx="116" cy="116" r="17" fill="none" stroke="#2a2a5c" stroke-width="5.5"/>
<path d="M105 130 L130 105" stroke="#6fc1d8" stroke-width="5.5" stroke-linecap="round"/>
<text x="80" y="300" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">Votre CPA à Saint-Léonard,</text>
<text x="80" y="384" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#6fc1d8">sans le stress.</text>
<text x="80" y="470" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" opacity=".9">Particuliers et entreprises · Impôts · TPS/TVQ · États financiers</text>
<text x="80" y="550" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Othmani CPA Inc.</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(out + "og.png");

// Icône Apple
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#2a2a5c"/><circle cx="20" cy="20" r="9.5" fill="none" stroke="#fff" stroke-width="3"/><path d="M14 27.5L27.5 14" stroke="#6fc1d8" stroke-width="3" stroke-linecap="round"/></svg>`;
await sharp(Buffer.from(icon), { density: 600 }).resize(180, 180).png().toFile(out + "apple-touch-icon.png");
console.log("Images générées dans public/images/");
