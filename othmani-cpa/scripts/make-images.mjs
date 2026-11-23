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
// Image de partage 1200 × 630 : le logo et le nom du cabinet, lisibles même en petite vignette
const ocLogo = (color) => `<path d="M 52.5 32 A 21.5 21.5 0 1 0 17.18 47.47" fill="none" stroke="${color}" stroke-width="15"/><path d="M15 62 L35 62 L61 39 L41 39 Z" fill="#56bfdc"/><clipPath id="c"><path d="M60 0H128V23H96V63H60Z"/></clipPath><path d="M 116.5 32 A 21.5 21.5 0 1 0 81.18 47.47" fill="none" stroke="${color}" stroke-width="15" clip-path="url(#c)"/><path d="M79 62 L99 62 L125 39 L105 39 Z" fill="#56bfdc"/>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eaf6fa"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<path d="M 980 0 L 1200 0 L 1200 250 Z" fill="#56bfdc" opacity=".18"/>
<g transform="translate(408 70) scale(3)">${ocLogo("#2a2a5c")}</g>
<text x="600" y="372" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700" fill="#2a2a5c" text-anchor="middle" letter-spacing="-2">Othmani CPA <tspan font-size="40" font-weight="400">Inc.</tspan></text>
<text x="600" y="430" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#4a4e66" text-anchor="middle">Société de comptable professionnel agréé</text>
<rect x="0" y="510" width="1200" height="120" fill="#2a2a5c"/>
<text x="600" y="583" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">Montréal · Partout au Canada · 514 448-0924</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(out + "othmani-cpa-partage.png");

// Icône Apple
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a2a5c"/><g transform="translate(7 18.5) scale(.39)"><path d="M 52.5 32 A 21.5 21.5 0 1 0 17.18 47.47" fill="none" stroke="#fff" stroke-width="15"/><path d="M15 62 L35 62 L61 39 L41 39 Z" fill="#56bfdc"/><clipPath id="c"><path d="M60 0H128V23H96V63H60Z"/></clipPath><path d="M 116.5 32 A 21.5 21.5 0 1 0 81.18 47.47" fill="none" stroke="#fff" stroke-width="15" clip-path="url(#c)"/><path d="M79 62 L99 62 L125 39 L105 39 Z" fill="#56bfdc"/></g></svg>`;
await sharp(Buffer.from(icon), { density: 600 }).resize(180, 180).png().toFile(out + "apple-touch-icon.png");
console.log("Images générées dans public/images/");
