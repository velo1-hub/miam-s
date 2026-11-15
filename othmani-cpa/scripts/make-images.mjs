/**
 * Génère les images (WebP) : visuel du héros, image Open Graph, icône.
 * Usage : npm run images
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const out = new URL("../public/images/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// Visuel du héros : aurores douces bleu ciel / marine et fines lignes (aucune banque d'images)
const W = 1600, H = 1000;
let grid = "";
for (let x = 0; x <= W; x += 80) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-opacity="0.035"/>`;
for (let y = 0; y <= H; y += 80) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-opacity="0.03"/>`;
let waves = "";
for (let i = 0; i < 14; i++) {
  const y = 520 + i * 22;
  waves += `<path d="M -50 ${y} C 400 ${y - 160 - i * 6}, 900 ${y + 120}, 1650 ${y - 260 - i * 8}" fill="none" stroke="#6fc1d8" stroke-opacity="${0.05 + i * 0.018}" stroke-width="1.4"/>`;
}
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#121232"/><stop offset=".6" stop-color="#22224e"/><stop offset="1" stop-color="#2a2a5c"/></linearGradient>
  <radialGradient id="a" cx=".78" cy=".28" r=".5"><stop offset="0" stop-color="#6fc1d8" stop-opacity=".55"/><stop offset="1" stop-color="#6fc1d8" stop-opacity="0"/></radialGradient>
  <radialGradient id="b" cx=".55" cy=".95" r=".55"><stop offset="0" stop-color="#5b5bc4" stop-opacity=".55"/><stop offset="1" stop-color="#5b5bc4" stop-opacity="0"/></radialGradient>
  <radialGradient id="c" cx=".98" cy=".85" r=".35"><stop offset="0" stop-color="#9fd9ea" stop-opacity=".35"/><stop offset="1" stop-color="#9fd9ea" stop-opacity="0"/></radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#a)"/>
<rect width="${W}" height="${H}" fill="url(#b)"/>
<rect width="${W}" height="${H}" fill="url(#c)"/>
<g filter="url(#blur)" opacity=".5"><circle cx="1250" cy="260" r="170" fill="#6fc1d8"/><circle cx="980" cy="760" r="140" fill="#4d4db0"/></g>
${grid}
${waves}
<g fill="none" stroke="#ffffff" stroke-opacity=".08"><circle cx="1240" cy="300" r="260"/><circle cx="1240" cy="300" r="380"/></g>
</svg>`;
await sharp(Buffer.from(hero)).webp({ quality: 80 }).toFile(out + "hero-1600.webp");
await sharp(Buffer.from(hero)).resize(800, 1000, { fit: "cover", position: "right" }).webp({ quality: 76 }).toFile(out + "hero-800.webp");

// Le portrait de Zouhaier (public/images/zouhaier-othmani.webp) est une vraie photo : ce script ne le touche plus.

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
