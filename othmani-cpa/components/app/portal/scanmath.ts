/**
 * Calculs du numériseur de documents, sans dépendance ni accès au navigateur (essais : scanmath.test.mjs).
 * Les coins sont toujours donnés dans l'ordre : haut gauche, haut droit, bas droit, bas gauche.
 */
export type Pt = { x: number; y: number };
export type Filter = "couleur" | "document" | "nb";
type Pixels = Uint8ClampedArray | Uint8Array;

export const MAX_SIDE = 2000;
/** Limite acceptée par la lecture automatique des reçus (octets). */
export const MAX_SCAN_BYTES = 6_000_000;

/** Range quatre points dans le sens horaire à l'écran, en commençant par le plus proche du coin haut gauche. */
export function orderCorners(pts: Pt[]): Pt[] {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const s = [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  let k = 0;
  for (let i = 1; i < s.length; i++) if (s[i].x + s[i].y < s[k].x + s[k].y) k = i;
  return s.map((_, i) => s[(k + i) % s.length]);
}

/** Aire signée d'un polygone (positive dans le sens horaire à l'écran). */
export function polyArea(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i].x * q.y - q.x * p[i].y; }
  return a / 2;
}

/** Vrai si les quatre coins, pris dans l'ordre, forment un quadrilatère convexe et non aplati. */
export function isConvex(p: Pt[]): boolean {
  if (p.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-9) return false;
    const s = cross > 0 ? 1 : -1;
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

/**
 * Homographie (9 coefficients, le dernier vaut 1) qui envoie chaque point de `from` sur celui de `to`.
 * `null` si les points ne définissent pas une transformation (points alignés ou confondus).
 */
export function solveHomography(from: Pt[], to: Pt[]): number[] | null {
  if (from.length !== 4 || to.length !== 4) return null;
  const m: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i], { x: u, y: v } = to[i];
    m.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u]);
    m.push([0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  }
  // Élimination de Gauss avec pivot partiel.
  for (let c = 0; c < 8; c++) {
    let best = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(m[r][c]) > Math.abs(m[best][c])) best = r;
    if (Math.abs(m[best][c]) < 1e-10) return null;
    [m[c], m[best]] = [m[best], m[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      if (f) for (let k = c; k < 9; k++) m[r][k] -= f * m[c][k];
    }
  }
  const h = m.map((row, i) => row[8] / row[i]);
  return h.every(Number.isFinite) ? [...h, 1] : null;
}

export function applyH(h: number[], x: number, y: number): Pt {
  const w = h[6] * x + h[7] * y + h[8];
  return { x: (h[0] * x + h[1] * y + h[2]) / w, y: (h[3] * x + h[4] * y + h[5]) / w };
}

/** Taille de la page redressée : les plus longs côtés opposés, ramenés à `max` pixels au plus. */
export function outputSize(q: Pt[], max = MAX_SIDE): { w: number; h: number } {
  const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const w = Math.max(d(q[0], q[1]), d(q[3], q[2]));
  const h = Math.max(d(q[0], q[3]), d(q[1], q[2]));
  const k = Math.min(1, max / Math.max(w, h, 1));
  return { w: Math.max(16, Math.round(w * k)), h: Math.max(16, Math.round(h * k)) };
}

/**
 * Redresse les lignes y0..y1 de la destination : pour chaque pixel, on cherche sa place dans la photo
 * (homographie rectangle → quadrilatère) et on mélange les quatre pixels voisins (bilinéaire).
 */
export function warpRows(src: Pixels, sw: number, sh: number, h: number[], dst: Pixels, dw: number, y0: number, y1: number) {
  for (let y = y0; y < y1; y++) {
    const py = y + 0.5;
    let X = h[0] * 0.5 + h[1] * py + h[2], Y = h[3] * 0.5 + h[4] * py + h[5], W = h[6] * 0.5 + h[7] * py + h[8];
    let o = y * dw * 4;
    for (let x = 0; x < dw; x++, o += 4, X += h[0], Y += h[3], W += h[6]) {
      let sx = X / W - 0.5, sy = Y / W - 0.5;
      if (sx < 0) sx = 0; else if (sx > sw - 1) sx = sw - 1;
      if (sy < 0) sy = 0; else if (sy > sh - 1) sy = sh - 1;
      const x0 = sx | 0, yy0 = sy | 0;
      const x1 = x0 + 1 < sw ? x0 + 1 : x0, yy1 = yy0 + 1 < sh ? yy0 + 1 : yy0;
      const fx = sx - x0, fy = sy - yy0;
      const a = (yy0 * sw + x0) * 4, b = (yy0 * sw + x1) * 4, c = (yy1 * sw + x0) * 4, d = (yy1 * sw + x1) * 4;
      const wa = (1 - fx) * (1 - fy), wb = fx * (1 - fy), wc = (1 - fx) * fy, wd = fx * fy;
      dst[o] = src[a] * wa + src[b] * wb + src[c] * wc + src[d] * wd;
      dst[o + 1] = src[a + 1] * wa + src[b + 1] * wb + src[c + 1] * wc + src[d + 1] * wd;
      dst[o + 2] = src[a + 2] * wa + src[b + 2] * wb + src[c + 2] * wc + src[d + 2] * wd;
      dst[o + 3] = 255;
    }
  }
}

/** Coins de départ quand le contour n'est pas trouvé : un retrait de 6 % sur chaque bord. */
export const insetCorners = (f = 0.06): Pt[] => [{ x: f, y: f }, { x: 1 - f, y: f }, { x: 1 - f, y: 1 - f }, { x: f, y: 1 - f }];

/** Coins (coordonnées de 0 à 1) après une rotation de la photo d'un quart de tour. */
export function rotateCorners(c: Pt[], dir: "left" | "right"): Pt[] {
  return orderCorners(c.map((p) => (dir === "right" ? { x: 1 - p.y, y: p.x } : { x: p.y, y: 1 - p.x })));
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Horodatage local AAAAMMJJ-HHMM pour les noms de fichiers. */
export const scanStamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
export const scanName = (d: Date, page: number, prefix = "scan") => `${prefix}-${scanStamp(d)}-${page}.jpg`;

/** Niveaux de gris (0 à 255) d'une image RGBA. */
export function toGray(rgba: Pixels, n: number): Uint8Array {
  const g = new Uint8Array(n);
  for (let i = 0, o = 0; i < n; i++, o += 4) g[i] = (rgba[o] * 77 + rgba[o + 1] * 150 + rgba[o + 2] * 29) >> 8;
  return g;
}

/**
 * Devine les quatre coins du document sur une petite image en niveaux de gris.
 * Méthode : seuil d'Otsu, plus grande zone claire d'un seul tenant, coins = points extrêmes de cette zone,
 * puis deux vérifications (la zone remplit bien le quadrilatère ; son bord est un vrai contour, mesuré par Sobel).
 * Renvoie des coins de 0 à 1, ou `null` si le résultat n'est pas assez sûr.
 */
export function detectQuad(gray: Pixels, w: number, h: number): Pt[] | null {
  const n = w * h;
  if (w < 16 || h < 16) return null;
  // Lissage 3 × 3 : le texte et le grain ne doivent pas découper la zone claire.
  const g = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; s += gray[yy * w + xx]; c++; } }
    g[y * w + x] = s / c;
  }
  // Seuil d'Otsu, avec sa qualité de séparation (0 à 1).
  const hist = new Float64Array(256);
  for (let i = 0; i < n; i++) hist[g[i]]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  const mean = sum / n;
  let varT = 0;
  for (let i = 0; i < 256; i++) varT += hist[i] * (i - mean) * (i - mean);
  let wB = 0, sumB = 0, bestV = 0, thr = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue;
    const wF = n - wB; if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if (v > bestV) { bestV = v; thr = i; }
  }
  if (varT <= 0 || bestV / n / varT < 0.4) return null;
  // Plus grande zone claire d'un seul tenant.
  const label = new Int32Array(n), stack = new Int32Array(n);
  let bestId = 0, bestArea = 0, id = 0;
  for (let start = 0; start < n; start++) {
    if (g[start] <= thr || label[start]) continue;
    id++;
    let top = 0, area = 0;
    stack[top++] = start; label[start] = id;
    while (top) {
      const p = stack[--top]; area++;
      const x = p % w;
      if (x > 0 && g[p - 1] > thr && !label[p - 1]) { label[p - 1] = id; stack[top++] = p - 1; }
      if (x < w - 1 && g[p + 1] > thr && !label[p + 1]) { label[p + 1] = id; stack[top++] = p + 1; }
      if (p >= w && g[p - w] > thr && !label[p - w]) { label[p - w] = id; stack[top++] = p - w; }
      if (p < n - w && g[p + w] > thr && !label[p + w]) { label[p + w] = id; stack[top++] = p + w; }
    }
    if (area > bestArea) { bestArea = area; bestId = id; }
  }
  if (bestArea < n * 0.1 || bestArea > n * 0.92) return null;
  // Points extrêmes : selon les diagonales (document à peu près droit) et selon les axes (document en losange).
  const far = [Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity, -Infinity, Infinity];
  const at: Pt[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0 }));
  const keep = (k: number, v: number, x: number, y: number, min: boolean) => { if (min ? v < far[k] : v > far[k]) { far[k] = v; at[k] = { x, y }; } };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (label[y * w + x] !== bestId) continue;
    keep(0, x + y, x, y, true); keep(1, x - y, x, y, false); keep(2, x + y, x, y, false); keep(3, x - y, x, y, true);
    keep(4, y, x, y, true); keep(5, x, x, y, false); keep(6, y, x, y, false); keep(7, x, x, y, true);
  }
  let quad: Pt[] | null = null, bestFit = Infinity;
  for (const cand of [at.slice(0, 4), at.slice(4)]) {
    const q = orderCorners(cand);
    const area = Math.abs(polyArea(q));
    if (!isConvex(q) || area < 1) continue;
    const fill = bestArea / area, fit = Math.abs(1 - fill);
    if (fill < 0.8 || fill > 1.2 || fit >= bestFit) continue;
    bestFit = fit; quad = q;
  }
  if (!quad) return null;
  const minSide = Math.min(w, h) * 0.15;
  for (let i = 0; i < 4; i++) if (Math.hypot(quad[i].x - quad[(i + 1) % 4].x, quad[i].y - quad[(i + 1) % 4].y) < minSide) return null;
  // Contour (Sobel) : le bord du quadrilatère doit être nettement plus marqué que le reste de l'image.
  const edge = (x: number, y: number) => {
    if (x < 1 || y < 1 || x > w - 2 || y > h - 2) return 0;
    const p = y * w + x;
    const gx = g[p - w + 1] + 2 * g[p + 1] + g[p + w + 1] - g[p - w - 1] - 2 * g[p - 1] - g[p + w - 1];
    const gy = g[p + w - 1] + 2 * g[p + w] + g[p + w + 1] - g[p - w - 1] - 2 * g[p - w] - g[p - w + 1];
    return Math.abs(gx) + Math.abs(gy);
  };
  let all = 0;
  for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x += 2) all += edge(x, y);
  all /= Math.max(1, Math.floor((h - 1) / 2) * Math.floor((w - 1) / 2));
  let rim = 0, count = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i], b = quad[(i + 1) % 4];
    for (let s = 0.1; s <= 0.9; s += 0.05) {
      const x = Math.round(a.x + (b.x - a.x) * s), y = Math.round(a.y + (b.y - a.y) * s);
      // Un bord coupé par le cadre de la photo ne compte pas.
      if (x < 2 || y < 2 || x > w - 3 || y > h - 3) continue;
      let m = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m = Math.max(m, edge(x + dx, y + dy));
      rim += m; count++;
    }
  }
  if (count < 20 || rim / count < 80 || rim / count < all * 2.5) return null;
  return quad.map((p) => ({ x: (p.x + 0.5) / w, y: (p.y + 0.5) / h }));
}

const c8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Filtres, appliqués sur place à une image RGBA.
 * « document » : éclairage égalisé (blanc local estimé par cases), papier blanchi, contraste relevé.
 * « nb » : le même traitement, en niveaux de gris avec un contraste plus fort.
 */
export function applyFilter(data: Pixels, w: number, h: number, mode: Filter) {
  if (mode === "couleur") return;
  const n = w * h;
  const lum = toGray(data, n);
  const cell = Math.max(8, Math.round(Math.max(w, h) / 24));
  const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  const total = new Uint32Array(256);
  const white = new Float32Array(gw * gh);
  const hist = new Uint32Array(256);
  const p85 = (hh: Uint32Array, cnt: number) => { let acc = 0; for (let v = 255; v >= 0; v--) { acc += hh[v]; if (acc >= cnt * 0.15) return v; } return 0; };
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    hist.fill(0);
    let cnt = 0;
    const yEnd = Math.min(h, (gy + 1) * cell), xEnd = Math.min(w, (gx + 1) * cell);
    for (let y = gy * cell; y < yEnd; y += 2) for (let x = gx * cell; x < xEnd; x += 2) { const v = lum[y * w + x]; hist[v]++; total[v]++; cnt++; }
    white[gy * gw + gx] = p85(hist, cnt);
  }
  let cntAll = 0;
  for (let v = 0; v < 256; v++) cntAll += total[v];
  const globalWhite = Math.max(60, p85(total, cntAll));
  // Une case sombre (photo, grand aplat) ne doit pas être éclaircie à l'excès.
  for (let i = 0; i < white.length; i++) white[i] = Math.max(white[i], globalWhite * 0.6);
  const smooth = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    let s = 0, c = 0;
    for (let dy = -1; dy <= 1; dy++) { const yy = gy + dy; if (yy < 0 || yy >= gh) continue; for (let dx = -1; dx <= 1; dx++) { const xx = gx + dx; if (xx < 0 || xx >= gw) continue; s += white[yy * gw + xx]; c++; } }
    smooth[gy * gw + gx] = s / c;
  }
  // Dominante de couleur du papier (éclairage jaune) : on équilibre les zones claires.
  let sr = 0, sg = 0, sb = 0, sc = 0;
  for (let i = 0, o = 0; i < n; i += 7, o += 28) if (lum[i] >= globalWhite * 0.85) { sr += data[o]; sg += data[o + 1]; sb += data[o + 2]; sc++; }
  const mid = sc ? (sr + sg + sb) / 3 : 1;
  const bal = (s: number) => (sc && s > 0 ? Math.min(1.25, Math.max(0.8, mid / s)) : 1);
  const br = bal(sr), bg = bal(sg), bb = bal(sb);
  const x0 = new Int32Array(w), fx = new Float32Array(w);
  for (let x = 0; x < w; x++) { const u = Math.min(gw - 1, Math.max(0, (x + 0.5) / cell - 0.5)); x0[x] = Math.min(gw - 2 < 0 ? 0 : gw - 2, u | 0); fx[x] = gw > 1 ? u - x0[x] : 0; }
  const bw = mode === "nb";
  const lo = bw ? 80 : 10, span = bw ? 255 / (225 - 80) : 255 / 245;
  for (let y = 0; y < h; y++) {
    const v = Math.min(gh - 1, Math.max(0, (y + 0.5) / cell - 0.5));
    const y0 = Math.min(gh - 2 < 0 ? 0 : gh - 2, v | 0), fy = gh > 1 ? v - y0 : 0;
    const r0 = y0 * gw, r1 = Math.min(gh - 1, y0 + 1) * gw;
    let o = y * w * 4;
    for (let x = 0; x < w; x++, o += 4) {
      const a = x0[x], b = Math.min(gw - 1, a + 1), f = fx[x];
      const wh = (smooth[r0 + a] * (1 - f) + smooth[r0 + b] * f) * (1 - fy) + (smooth[r1 + a] * (1 - f) + smooth[r1 + b] * f) * fy;
      const gain = 250 / wh;
      if (bw) {
        data[o] = data[o + 1] = data[o + 2] = c8((lum[y * w + x] * gain - lo) * span);
      } else {
        data[o] = c8((data[o] * gain * br - lo) * span);
        data[o + 1] = c8((data[o + 1] * gain * bg - lo) * span);
        data[o + 2] = c8((data[o + 2] * gain * bb - lo) * span);
      }
    }
  }
}
