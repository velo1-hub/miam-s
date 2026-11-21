// Essais des calculs du numériseur. Lancer : node --test components/app/portal/scanmath.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { applyFilter, applyH, detectQuad, insetCorners, isConvex, orderCorners, outputSize, rotateCorners, scanName, solveHomography, warpRows } from "./scanmath.ts";

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);
const nearPt = (p, q, eps = 1e-6) => { near(p.x, q.x, eps); near(p.y, q.y, eps); };
const rect = (w, h) => [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];

test("les coins sont rangés haut gauche, haut droit, bas droit, bas gauche, quel que soit l'ordre d'entrée", () => {
  const tl = { x: 10, y: 12 }, tr = { x: 90, y: 8 }, br = { x: 95, y: 70 }, bl = { x: 5, y: 75 };
  for (const mix of [[tl, tr, br, bl], [br, tl, bl, tr], [bl, br, tr, tl], [tr, bl, tl, br]]) assert.deepEqual(orderCorners(mix), [tl, tr, br, bl]);
});

test("un quadrilatère tourné de 40 degrés garde un ordre horaire et convexe", () => {
  const a = (40 * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pts = rect(80, 50).map((p) => ({ x: 100 + (p.x - 40) * c - (p.y - 25) * s, y: 100 + (p.x - 40) * s + (p.y - 25) * c }));
  const o = orderCorners([pts[2], pts[0], pts[3], pts[1]]);
  assert.ok(isConvex(o));
  // Même cycle que l'original (rotation du tableau), premier point = plus petit x + y.
  const k = pts.indexOf(o[0]);
  assert.deepEqual(o, [0, 1, 2, 3].map((i) => pts[(k + i) % 4]));
  assert.ok(pts.every((p) => o[0].x + o[0].y <= p.x + p.y));
});

test("convexité : un nœud papillon ou des points alignés sont refusés", () => {
  assert.ok(isConvex(rect(10, 10)));
  assert.ok(!isConvex([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }]));
  assert.ok(!isConvex([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }]));
  assert.ok(!isConvex([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 10 }]));
});

test("l'homographie envoie chaque coin du rectangle sur le coin du quadrilatère", () => {
  const from = rect(400, 300);
  const to = [{ x: 31, y: 44 }, { x: 352, y: 18 }, { x: 389, y: 271 }, { x: 12, y: 240 }];
  const h = solveHomography(from, to);
  assert.ok(h);
  from.forEach((p, i) => nearPt(applyH(h, p.x, p.y), to[i], 1e-7));
  // Les droites restent des droites : le milieu d'un côté tombe sur le côté d'arrivée.
  const m = applyH(h, 200, 0);
  near((m.x - to[0].x) * (to[1].y - to[0].y) - (m.y - to[0].y) * (to[1].x - to[0].x), 0, 1e-6);
});

test("homographie : identité, cas affine, et aller-retour", () => {
  const id = solveHomography(rect(10, 10), rect(10, 10));
  [1, 0, 0, 0, 1, 0, 0, 0, 1].forEach((v, i) => near(id[i], v, 1e-9));
  const aff = solveHomography(rect(1, 1), [{ x: 5, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 10 }, { x: 5, y: 10 }]);
  nearPt(applyH(aff, 0.5, 0.5), { x: 6, y: 8.5 }, 1e-9);
  const q = [{ x: 3, y: 9 }, { x: 80, y: 2 }, { x: 96, y: 77 }, { x: 10, y: 60 }];
  const there = solveHomography(rect(50, 50), q), back = solveHomography(q, rect(50, 50));
  const p = applyH(there, 17, 33);
  nearPt(applyH(back, p.x, p.y), { x: 17, y: 33 }, 1e-6);
});

test("homographie : des points dégénérés donnent null", () => {
  assert.equal(solveHomography(rect(10, 10), [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }].slice(0, 3)), null);
  assert.equal(solveHomography([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 15, y: 0 }], rect(10, 10)), null);
  assert.equal(solveHomography([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 1 }], rect(10, 10)), null);
});

test("taille de sortie : plus longs côtés, jamais plus de 2000 pixels", () => {
  assert.deepEqual(outputSize(rect(800, 600)), { w: 800, h: 600 });
  assert.deepEqual(outputSize(rect(4000, 3000)), { w: 2000, h: 1500 });
  assert.deepEqual(outputSize([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 120, y: 200 }, { x: -20, y: 200 }]), { w: 140, h: 201 });
});

test("rotation des coins d'un quart de tour, puis retour", () => {
  const c = [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.1 }, { x: 0.8, y: 0.9 }, { x: 0.2, y: 0.7 }];
  const r = rotateCorners(c, "right");
  // Le coin haut gauche (0,1 ; 0,2) passe en haut à droite (0,8 ; 0,1).
  nearPt(r[1], { x: 0.8, y: 0.1 });
  assert.ok(isConvex(r));
  const back = rotateCorners(r, "left");
  back.forEach((p, i) => nearPt(p, c[i], 1e-12));
  assert.deepEqual(rotateCorners(insetCorners(), "left").map((p) => [+p.x.toFixed(2), +p.y.toFixed(2)]), [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]]);
});

test("noms de fichiers scan-AAAAMMJJ-HHMM-n.jpg", () => {
  assert.equal(scanName(new Date(2026, 10, 21, 9, 5), 1), "scan-20261121-0905-1.jpg");
  assert.equal(scanName(new Date(2026, 0, 2, 23, 59), 12, "recu"), "recu-20260102-2359-12.jpg");
});

/** Image d'essai : fond sombre, quadrilatère clair. */
function scene(w, h, quad, bg = 30, fg = 235) {
  const g = new Uint8Array(w * h).fill(bg);
  const inside = (x, y) => quad.every((a, i) => { const b = quad[(i + 1) % 4]; return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) >= 0; });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) g[y * w + x] = fg;
  return g;
}

test("détection : un document clair et penché sur fond sombre est trouvé à 3 pixels près", () => {
  const w = 240, h = 180;
  const quad = [{ x: 42, y: 25 }, { x: 190, y: 38 }, { x: 205, y: 150 }, { x: 28, y: 138 }];
  const found = detectQuad(scene(w, h, quad), w, h);
  assert.ok(found, "contour non trouvé");
  found.forEach((p, i) => { near(p.x * w, quad[i].x, 3); near(p.y * h, quad[i].y, 3); });
});

test("détection : un document en losange est trouvé par ses points extrêmes", () => {
  const w = 200, h = 200;
  const quad = [{ x: 100, y: 20 }, { x: 175, y: 100 }, { x: 100, y: 180 }, { x: 25, y: 100 }];
  const found = detectQuad(scene(w, h, quad), w, h);
  assert.ok(found);
  for (const q of quad) assert.ok(found.some((p) => Math.hypot(p.x * w - q.x, p.y * h - q.y) < 4));
});

test("détection : image unie, bruit ou document plein cadre → pas de résultat (retrait de 6 %)", () => {
  assert.equal(detectQuad(new Uint8Array(160 * 120).fill(128), 160, 120), null);
  let seed = 7;
  const noise = Uint8Array.from({ length: 160 * 120 }, () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % 256; });
  assert.equal(detectQuad(noise, 160, 120), null);
  assert.equal(detectQuad(scene(160, 120, [{ x: 1, y: 1 }, { x: 159, y: 1 }, { x: 159, y: 119 }, { x: 1, y: 119 }]), 160, 120), null);
  // Une forme claire qui n'a rien d'un quadrilatère (un L) est refusée.
  const l = new Uint8Array(160 * 120).fill(20);
  for (let y = 10; y < 110; y++) for (let x = 20; x < 140; x++) if (x < 60 || y > 80) l[y * 160 + x] = 240;
  assert.equal(detectQuad(l, 160, 120), null);
});

test("redressement : le quadrilatère penché devient un rectangle plein", () => {
  const sw = 240, sh = 180;
  const quad = [{ x: 42, y: 25 }, { x: 190, y: 38 }, { x: 205, y: 150 }, { x: 28, y: 138 }];
  const g = scene(sw, sh, quad);
  const src = new Uint8ClampedArray(sw * sh * 4);
  for (let i = 0; i < sw * sh; i++) { src[i * 4] = src[i * 4 + 1] = src[i * 4 + 2] = g[i]; src[i * 4 + 3] = 255; }
  const { w, h } = outputSize(quad);
  const H = solveHomography(rect(w, h), quad);
  const out = new Uint8ClampedArray(w * h * 4);
  warpRows(src, sw, sh, H, out, w, 0, h);
  let bright = 0;
  for (let i = 0; i < w * h; i++) if (out[i * 4] > 200) bright++;
  assert.ok(bright / (w * h) > 0.97, `part claire ${bright / (w * h)}`);
  assert.equal(out[3], 255);
});

test("redressement : un repère garde sa place relative", () => {
  // Photo 100 × 100 : un point rouge au centre du quadrilatère doit arriver au centre de la page.
  const sw = 100, sh = 100, quad = [{ x: 20, y: 10 }, { x: 80, y: 20 }, { x: 90, y: 90 }, { x: 10, y: 80 }];
  const H = solveHomography(rect(60, 60), quad);
  const c = applyH(H, 30, 30);
  const src = new Uint8ClampedArray(sw * sh * 4).fill(255);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = ((Math.round(c.y) + dy) * sw + Math.round(c.x) + dx) * 4; src[o + 1] = 0; src[o + 2] = 0; }
  const out = new Uint8ClampedArray(60 * 60 * 4);
  warpRows(src, sw, sh, H, out, 60, 0, 60);
  const o = (30 * 60 + 30) * 4;
  assert.ok(out[o] > 200 && out[o + 1] < 60, "le repère n'est pas au centre");
  assert.ok(out[1] > 200, "le coin doit rester blanc");
});

test("filtre Document : papier gris et éclairage inégal deviennent blancs, le texte reste sombre", () => {
  const w = 120, h = 80, d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const paper = 150 + Math.round((x / w) * 60); // ombre à gauche
    const ink = y % 10 === 5 && x % 3 === 0;
    const o = (y * w + x) * 4;
    d[o] = d[o + 1] = d[o + 2] = ink ? 40 : paper; d[o + 3] = 255;
  }
  const doc = d.slice(); applyFilter(doc, w, h, "document");
  const px = (a, x, y) => a[(y * w + x) * 4];
  assert.ok(px(doc, 4, 2) > 235 && px(doc, 110, 70) > 235, `papier ${px(doc, 4, 2)} / ${px(doc, 110, 70)}`);
  assert.ok(px(doc, 60, 5) < 110, `encre ${px(doc, 60, 5)}`);
  const bw = d.slice(); applyFilter(bw, w, h, "nb");
  assert.ok(px(bw, 4, 2) > 245 && px(bw, 60, 5) < 40);
  const same = d.slice(); applyFilter(same, w, h, "couleur");
  assert.deepEqual(same, d);
});
