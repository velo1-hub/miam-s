/**
 * Idya Auto demo studio — parametric, unbadged car renderer (brief §28.3).
 * Runs inside headless Chromium; driven by scripts/render-spin.ts through window.idya.*
 * Black seamless studio, polished reflective floor, white key light from above,
 * thin crimson rim light outlining the body (brief §29.2 style block).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Reflector } from "three/addons/objects/Reflector.js";

void RectAreaLightHelper; // keep import tree-shaken consistent; helper unused in production renders

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);

// ---------- Studio ----------
const studio = new THREE.Group();
scene.add(studio);

// Backdrop: huge dark cyclorama
const back = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 40),
  new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 1, metalness: 0 }),
);
back.position.set(0, 10, -26);
studio.add(back);

// Floor: mirror reflector dimmed by a translucent dark plane → "polished black floor"
const reflector = new Reflector(new THREE.PlaneGeometry(60, 60), {
  clipBias: 0.003,
  textureWidth: 1600,
  textureHeight: 900,
  color: 0x5a5a5e,
});
reflector.rotation.x = -Math.PI / 2;
reflector.position.y = 0;
studio.add(reflector);
const floorTint = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.84, roughness: 0.8 }),
);
floorTint.rotation.x = -Math.PI / 2;
floorTint.position.y = 0.001;
floorTint.receiveShadow = true;
studio.add(floorTint);

// Soft contact shadow under the car (radial gradient)
function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  g.addColorStop(0, "rgba(0,0,0,0.85)");
  g.addColorStop(0.6, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  return t;
}
const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.y = 0.004;
studio.add(contact);

// Lights
const key = new THREE.RectAreaLight(0xffffff, 14, 6, 2.2);
key.position.set(0.5, 4.2, 1.2);
key.lookAt(0, 0.6, 0);
studio.add(key);

const keyFill = new THREE.RectAreaLight(0xf4f4f7, 4, 3, 3);
keyFill.position.set(5, 2.2, 4);
keyFill.lookAt(0, 0.7, 0);
studio.add(keyFill);

// Red rim lights are spotlights (soft cone, no hard half-space edge on the floor)
const rimRed = new THREE.SpotLight(0xff1a0a, 90, 18, 0.62, 0.75, 1.6);
rimRed.position.set(-4.2, 2.8, -4.0);
rimRed.target.position.set(0.4, 0.8, 0);
studio.add(rimRed, rimRed.target);

const rimRedTop = new THREE.SpotLight(0xe10600, 45, 16, 0.8, 0.9, 1.6);
rimRedTop.position.set(0.5, 3.4, -4.6);
rimRedTop.target.position.set(0, 0.9, 0);
studio.add(rimRedTop, rimRedTop.target);

const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
shadowLight.position.set(1, 6, 2);
shadowLight.castShadow = true;
shadowLight.shadow.mapSize.set(2048, 2048);
shadowLight.shadow.camera.left = -4;
shadowLight.shadow.camera.right = 4;
shadowLight.shadow.camera.top = 4;
shadowLight.shadow.camera.bottom = -4;
shadowLight.shadow.radius = 6;
shadowLight.shadow.bias = -0.0005;
studio.add(shadowLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.08));

// ---------- Car builder ----------
/**
 * Bodies are swept cross-sections: a side profile h(x) (roof line, front → rear), a plan taper w(x),
 * a beltline and a cabin range. Wheel arches are carved into the section bottom. Faces above the
 * beltline inside the cabin range use the glass material, giving an integrated glasshouse.
 * Units: meters. Profile points are [distance from front, height above ground].
 */
const PROFILES = {
  sedan:        { len: 4.75, width: 1.86, wheel: 0.335, wheelbase: 2.8, clearance: 0.17, belt: 0.95, roofK: 0.66, cabin: [1.85, 4.2],
                  top: [[0,0.70],[0.08,0.78],[0.6,0.84],[1.5,0.9],[1.85,0.93],[2.1,1.2],[2.5,1.43],[3.1,1.46],[3.6,1.42],[4.0,1.24],[4.3,1.06],[4.6,1.0],[4.75,0.96]] },
  "sedan-sport":{ len: 4.8, width: 1.88, wheel: 0.345, wheelbase: 2.86, clearance: 0.15, belt: 0.92, roofK: 0.64, cabin: [1.9, 4.3],
                  top: [[0,0.66],[0.08,0.74],[0.6,0.8],[1.5,0.86],[1.9,0.9],[2.15,1.16],[2.6,1.4],[3.2,1.43],[3.7,1.38],[4.1,1.2],[4.4,1.04],[4.65,0.98],[4.8,0.94]] },
  coupe:        { len: 4.7, width: 1.86, wheel: 0.345, wheelbase: 2.78, clearance: 0.14, belt: 0.88, roofK: 0.6, cabin: [2.0, 4.3],
                  top: [[0,0.62],[0.08,0.7],[0.7,0.76],[1.6,0.82],[2.0,0.86],[2.3,1.1],[2.8,1.32],[3.3,1.35],[3.8,1.26],[4.2,1.06],[4.5,0.96],[4.7,0.92]] },
  hatchback:    { len: 4.45, width: 1.8, wheel: 0.32, wheelbase: 2.72, clearance: 0.16, belt: 0.94, roofK: 0.7, cabin: [1.65, 4.45],
                  top: [[0,0.68],[0.08,0.76],[0.6,0.82],[1.4,0.88],[1.65,0.92],[1.9,1.2],[2.3,1.46],[3.0,1.5],[3.7,1.48],[4.1,1.42],[4.35,1.3],[4.45,1.26]] },
  suv:          { len: 4.6, width: 1.87, wheel: 0.37, wheelbase: 2.69, clearance: 0.21, belt: 1.08, roofK: 0.72, cabin: [1.55, 4.6],
                  top: [[0,0.82],[0.1,0.95],[0.7,1.02],[1.3,1.06],[1.55,1.1],[1.8,1.38],[2.15,1.66],[3.0,1.7],[3.9,1.68],[4.3,1.64],[4.5,1.58],[4.6,1.55]] },
  "suv-large":  { len: 5.0, width: 1.98, wheel: 0.39, wheelbase: 2.9, clearance: 0.22, belt: 1.12, roofK: 0.74, cabin: [1.7, 5.0],
                  top: [[0,0.86],[0.1,1.0],[0.8,1.08],[1.45,1.12],[1.7,1.16],[2.0,1.44],[2.4,1.76],[3.4,1.8],[4.3,1.78],[4.7,1.74],[4.9,1.68],[5.0,1.65]] },
  crossover:    { len: 4.65, width: 1.9, wheel: 0.36, wheelbase: 3.0, clearance: 0.19, belt: 1.04, roofK: 0.7, cabin: [1.45, 4.65],
                  top: [[0,0.78],[0.1,0.9],[0.7,0.98],[1.2,1.02],[1.45,1.06],[1.7,1.3],[2.1,1.6],[3.0,1.63],[3.8,1.56],[4.25,1.44],[4.5,1.3],[4.65,1.26]] },
  offroad:      { len: 4.85, width: 1.9, wheel: 0.42, wheelbase: 3.0, clearance: 0.3, belt: 1.16, roofK: 0.84, cabin: [1.6, 4.85],
                  top: [[0,0.88],[0.08,1.06],[0.7,1.1],[1.3,1.12],[1.6,1.16],[1.8,1.5],[1.95,1.86],[3.0,1.88],[4.4,1.88],[4.7,1.86],[4.85,1.84]] },
  truck:        { len: 5.9, width: 2.03, wheel: 0.43, wheelbase: 3.68, clearance: 0.28, belt: 1.22, roofK: 0.8, cabin: [2.0, 4.0],
                  top: [[0,0.92],[0.1,1.1],[0.9,1.16],[1.75,1.2],[2.0,1.24],[2.25,1.54],[2.55,1.92],[3.2,1.94],[3.75,1.92],[3.95,1.62],[4.05,1.42],[5.7,1.42],[5.9,1.4]] },
  "truck-mid":  { len: 5.4, width: 1.9, wheel: 0.4, wheelbase: 3.24, clearance: 0.26, belt: 1.16, roofK: 0.8, cabin: [1.85, 3.75],
                  top: [[0,0.86],[0.1,1.04],[0.85,1.1],[1.6,1.14],[1.85,1.18],[2.1,1.46],[2.4,1.82],[3.0,1.84],[3.45,1.82],[3.7,1.5],[3.8,1.32],[5.2,1.32],[5.4,1.3]] },
  minivan:      { len: 5.15, width: 1.98, wheel: 0.35, wheelbase: 3.06, clearance: 0.17, belt: 1.08, roofK: 0.8, cabin: [1.2, 5.15],
                  top: [[0,0.8],[0.08,0.92],[0.5,0.98],[0.95,1.04],[1.2,1.1],[1.5,1.44],[2.0,1.76],[3.2,1.78],[4.4,1.78],[4.85,1.74],[5.05,1.68],[5.15,1.65]] },
};

function paintMaterial(hex, finish) {
  const color = new THREE.Color(hex);
  switch (finish) {
    case "matte":
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0.25, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6 });
    case "pearl":
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0.15, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: new THREE.Color(0xfff0e6), sheenRoughness: 0.4 });
    case "metallic":
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0.72, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
    case "gloss":
    default:
      return new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 });
  }
}

const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0.85, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.6, metalness: 0.25 });
const wellMat = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1, metalness: 0, side: THREE.DoubleSide });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.92, metalness: 0 });
const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xa3a5aa, metalness: 0.95, roughness: 0.22, clearcoat: 0.6 });
const rimDarkMat = new THREE.MeshPhysicalMaterial({ color: 0x17171a, metalness: 0.9, roughness: 0.35 });
const headMat = new THREE.MeshPhysicalMaterial({ color: 0xe6edff, emissive: 0xc9dbff, emissiveIntensity: 2.4, roughness: 0.12, metalness: 0.2 });
const tailMat = new THREE.MeshPhysicalMaterial({ color: 0x3a0402, emissive: 0xe10600, emissiveIntensity: 1.4, roughness: 0.15 });
const drlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

/** Smooth roof line: Catmull-Rom through the profile points, sampled as a function of x-from-front. */
function roofLine(points) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "catmullrom", 0.3);
  const samples = curve.getPoints(400);
  return (x) => {
    // samples are monotonic-ish in x; find bracket
    let lo = 0, hi = samples.length - 1;
    if (x <= samples[0].x) return samples[0].y;
    if (x >= samples[hi].x) return samples[hi].y;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].x <= x) lo = mid; else hi = mid; }
    const a = samples[lo], b = samples[hi];
    const t = (x - a.x) / Math.max(1e-6, b.x - a.x);
    return a.y + (b.y - a.y) * t;
  };
}

function halfWidthAt(p, xf) {
  const u = xf / p.len; // 0 front, 1 rear
  const taper = 1 - 0.2 * Math.pow(Math.max(0, 0.42 - u) / 0.42, 1.6) - 0.12 * Math.pow(Math.max(0, u - 0.62) / 0.38, 2.2);
  return (p.width / 2) * taper;
}

function halfSection(p, xf, hFn) {
  // Returns { pts: [z, y][] , glassFrom: index } for the right half of the section (z >= 0), bottom centre → top centre.
  const { len, wheel, clearance, belt, roofK, wheelbase } = p;
  const x = xf; // distance from front
  const w = halfWidthAt(p, xf);
  const h = hFn(x);
  // wheel arch carve
  let bottom = clearance;
  const archR = wheel * 1.14;
  const xc = len / 2; // centre from front
  for (const wx of [xc - wheelbase / 2, xc + wheelbase / 2]) {
    const d = Math.abs(x - wx);
    if (d < archR) bottom = Math.max(bottom, wheel + Math.sqrt(archR * archR - d * d) - 0.02);
  }
  bottom = Math.min(bottom, h - 0.14); // keep at least 14 cm of fender above the arch
  const beltY = Math.min(belt, h - 0.02);
  const rb = 0.08; // lower corner radius
  const rs = 0.05; // shoulder radius
  const pts = [];
  let glassFrom = -1;
  const push = (z, y) => pts.push([z, y]);
  push(0, bottom);
  push(Math.max(0, w - rb), bottom);
  // lower corner
  for (let i = 1; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; push(w - rb + rb * Math.sin(a), bottom + rb - rb * Math.cos(a)); }
  // side, with slight outward bulge at mid height (door skin)
  const sideTop = Math.max(bottom + rb + 0.01, beltY - rs);
  push(w + 0.012, bottom + (sideTop - bottom) * 0.45);
  push(w, sideTop);
  // shoulder
  for (let i = 1; i <= 3; i++) { const a = (i / 3) * Math.PI / 2; push(w - rs + rs * Math.cos(a), sideTop + rs * Math.sin(a)); }
  if (h > beltY + 0.03) {
    // glasshouse with tumblehome
    const roofW = w * roofK;
    const rr = Math.min(0.09, (h - beltY) * 0.35);
    push(w - rs - 0.01, beltY + 0.015);
    glassFrom = pts.length - 1;
    push(roofW + rr * 0.3, h - rr);
    for (let i = 1; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; push(roofW - roofW * 0 + rr * Math.cos(a) * 0.3, h - rr + rr * Math.sin(a)); }
    push(0, h);
  } else {
    push(Math.max(0, w - rs - 0.02), h);
    push(0, h);
  }
  return { pts, glassFrom };
}

function buildBody(p, paint, finish) {
  const hFn = roofLine(p.top);
  const N = 160; // stations
  const positions = [];
  const normals = [];
  const groups = []; // material groups by face index ranges
  const stations = [];
  let M = 0;
  for (let i = 0; i <= N; i++) {
    const xf = (i / N) * p.len;
    const { pts: half, glassFrom } = halfSection(p, Math.min(p.len - 0.001, Math.max(0.001, xf)), hFn);
    // Resample lower body and glasshouse separately with fixed counts so the glass boundary is a clean row.
    const LOWER = 26, UPPER = 14;
    let resampled, glassRow;
    if (glassFrom > 0) {
      const lower = resample(half.slice(0, glassFrom + 1), LOWER);
      const upper = resample(half.slice(glassFrom), UPPER + 1).slice(1);
      resampled = [...lower, ...upper];
      glassRow = LOWER - 1;
    } else {
      resampled = resample(half, LOWER + UPPER);
      glassRow = -1;
    }
    const full = [...resampled.map(([z, y]) => [z, y]), ...resampled.slice(0, -1).reverse().map(([z, y]) => [-z, y]).slice(0, -1)];
    M = full.length;
    stations.push({ xf, pts: full, glassRow });
  }
  // Stitch stations into quads
  const faceMaterial = []; // 0 paint, 1 glass
  const idx = [];
  const verts = [];
  const xOf = (xf) => p.len / 2 - xf; // front at +x
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j < M; j++) {
      const [z, y] = stations[i].pts[j];
      verts.push(xOf(stations[i].xf), y, z);
    }
  }
  const cabinA = p.cabin[0], cabinB = p.cabin[1];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * M + j, b = i * M + ((j + 1) % M), c = (i + 1) * M + ((j + 1) % M), d = (i + 1) * M + j;
      const xMid = (stations[i].xf + stations[i + 1].xf) / 2;
      const inCabin = xMid > cabinA && xMid < cabinB;
      const gr = Math.min(stations[i].glassRow, stations[i + 1].glassRow);
      const half = (M + 1) / 2; // index of the top-centre point
      // side glass rows: from glassRow up to just below the roof edge, mirrored on the left side
      const jj = j < half ? j : M - j; // mirror index
      const sideGlass = gr > 0 && jj >= gr && jj < half - 3;
      // windshield / rear window: roof faces where the roof line is steep
      const slope = (hFn(xMid + 0.05) - hFn(xMid - 0.05)) / 0.1;
      const roofGlass = gr > 0 && Math.abs(slope) > 0.45 && jj >= half - 6;
      const isGlass = inCabin && (sideGlass || roofGlass);
      idx.push(a, b, c, a, c, d);
      faceMaterial.push(isGlass ? 1 : 0, isGlass ? 1 : 0);
    }
  }
  // caps
  const capCenterFront = verts.length / 3;
  const front = stations[0];
  verts.push(xOf(front.xf), (front.pts[0][1] + front.pts[M / 2 | 0][1]) / 2, 0);
  for (let j = 0; j < M; j++) { idx.push(capCenterFront, (j + 1) % M, j); faceMaterial.push(0); }
  const capCenterRear = verts.length / 3;
  const rear = stations[N];
  verts.push(xOf(rear.xf), (rear.pts[0][1] + rear.pts[M / 2 | 0][1]) / 2, 0);
  for (let j = 0; j < M; j++) { idx.push(capCenterRear, N * M + j, N * M + ((j + 1) % M)); faceMaterial.push(0); }

  // Sort faces by material to build groups
  const order = faceMaterial.map((m, f) => [m, f]).sort((a, b) => a[0] - b[0]);
  const sortedIdx = [];
  let g0 = 0, current = order[0][0];
  for (let k = 0; k < order.length; k++) {
    const [m, f] = order[k];
    if (m !== current) { groups.push({ start: g0, count: k * 3 - g0, materialIndex: current }); g0 = k * 3; current = m; }
    sortedIdx.push(idx[f * 3], idx[f * 3 + 1], idx[f * 3 + 2]);
  }
  groups.push({ start: g0, count: order.length * 3 - g0, materialIndex: current });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(sortedIdx);
  for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);
  geo.computeVertexNormals();
  void normals; void positions;
  const mesh = new THREE.Mesh(geo, [paintMaterial(paint, finish), glassMat]);
  mesh.castShadow = true;
  return mesh;
}

function resample(poly, count) {
  const lengths = [0];
  for (let i = 1; i < poly.length; i++) lengths.push(lengths[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const total = lengths[lengths.length - 1];
  const out = [];
  for (let k = 0; k < count; k++) {
    const t = (k / (count - 1)) * total;
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < t) i++;
    const a = poly[i - 1], b = poly[i];
    const seg = Math.max(1e-9, lengths[i] - lengths[i - 1]);
    const f = (t - lengths[i - 1]) / seg;
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

function wheel(radius, width) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 56, 1, false), tireMat);
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  const sidewall = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.94, radius * 0.06, 16, 56), tireMat);
  sidewall.rotation.y = Math.PI / 2;
  sidewall.position.x = width / 2 - radius * 0.02;
  g.add(sidewall);
  const rimR = radius * 0.66;
  const rimOuter = new THREE.Mesh(new THREE.CylinderGeometry(rimR, rimR, width * 0.3, 56), rimDarkMat);
  rimOuter.rotation.z = Math.PI / 2;
  rimOuter.position.x = width / 2 - width * 0.12;
  g.add(rimOuter);
  const spokes = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, rimR * 1.75, radius * 0.17), rimMat);
    s.rotation.x = (i / 5) * Math.PI * 2;
    spokes.add(s);
  }
  spokes.position.x = width / 2 + 0.006;
  g.add(spokes);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.26, rimR * 0.26, width * 0.2, 32), rimMat);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = width / 2 + 0.012;
  g.add(hub);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR, radius * 0.03, 12, 56), rimMat);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = width / 2 + 0.006;
  g.add(lip);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}

let car = null;

function buildCar({ body, paint, finish }) {
  const p = PROFILES[body] ?? PROFILES.sedan;
  const group = new THREE.Group();
  const hFn = roofLine(p.top);
  group.add(buildBody(p, paint, finish));

  const half = p.len / 2;
  // Wheels, inner wells
  const track = p.width / 2 - 0.13;
  const ww = 0.25;
  for (const [x, z] of [[p.wheelbase / 2, track], [p.wheelbase / 2, -track], [-p.wheelbase / 2, track], [-p.wheelbase / 2, -track]]) {
    const w = wheel(p.wheel, ww);
    w.position.set(x, p.wheel, z);
    if (z < 0) w.rotation.y = Math.PI;
    group.add(w);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(p.wheel * 1.19, p.wheel * 1.19, p.width * 0.9, 40, 1, true, 0, Math.PI), wellMat);
    well.rotation.z = Math.PI / 2;
    well.rotation.y = Math.PI / 2;
    well.position.set(x, p.wheel, 0);
    group.add(well);
  }
  // Front fascia: grille + headlights + DRL
  const hFront = hFn(0.02);
  const baseY = p.clearance;
  const fx = half - 0.01;
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, (hFront - baseY) * 0.34, p.width * 0.44), trimMat);
  grille.position.set(fx, baseY + (hFront - baseY) * 0.42, 0);
  group.add(grille);
  const wFront = (p.width / 2) * 0.8;
  for (const side of [1, -1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, (hFront - baseY) * 0.16, p.width * 0.19), headMat);
    lamp.position.set(fx - 0.06, baseY + (hFront - baseY) * 0.8, side * wFront * 0.72);
    lamp.rotation.y = side * 0.25;
    group.add(lamp);
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, p.width * 0.18), drlMat);
    drl.position.set(fx + 0.0, baseY + (hFront - baseY) * 0.9, side * wFront * 0.72);
    drl.rotation.y = side * 0.25;
    group.add(drl);
    // mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.2), paintMaterial(paint, finish));
    const mx = p.cabin[0] + 0.32;
    mirror.position.set(half - mx, p.belt + 0.05, side * (halfWidthAt(p, mx) + 0.09));
    group.add(mirror);
  }
  // Rear: glass panel on steep tailgates, light bar + lamps
  const hRear = hFn(p.len - 0.02);
  if (hRear - p.belt > 0.3) {
    const gw = halfWidthAt(p, p.len - 0.01) * 2 * 0.8;
    const gh = hRear - 0.07 - (p.belt + 0.08);
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.03, gh, gw), glassMat);
    rearGlass.position.set(-half + 0.0, p.belt + 0.08 + gh / 2, 0);
    group.add(rearGlass);
  }
  const lampY = hRear - p.belt > 0.3 ? p.belt - 0.02 : baseY + (hRear - baseY) * 0.78;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, p.width * 0.6), tailMat);
  bar.position.set(-half + 0.01, lampY, 0);
  group.add(bar);
  for (const side of [1, -1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, p.width * 0.2), tailMat);
    tail.position.set(-half + 0.0, lampY, side * p.width * 0.33);
    tail.rotation.y = -side * 0.3;
    group.add(tail);
  }

  group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  contact.scale.set(p.len * 1.3, p.width * 1.7, 1);
  // Base orientation: profile front is +x; rotate so the nose faces the camera (+z) at frame 0.
  const pivot = new THREE.Group();
  group.rotation.y = -Math.PI / 2;
  pivot.add(group);
  return pivot;
}

function fitCamera(len, width, height, elevation = 0.92) {
  // Car occupies ~80 % of the frame width at the widest diagonal
  const diag = Math.sqrt(len * len + width * width);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (diag * 0.5) / Math.tan(fov / 2) / camera.aspect / 0.8 + 0.4;
  camera.position.set(0, elevation, dist);
  camera.lookAt(0, height * 0.42, 0);
}

const api = {
  ready: true,
  setSize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  },
  load(spec) {
    if (car) scene.remove(car);
    car = buildCar(spec);
    scene.add(car);
    const p = PROFILES[spec.body] ?? PROFILES.sedan;
    const height = Math.max(...p.top.map((t) => t[1])) + p.wheel * 0.55;
    api._dims = { len: p.len, width: p.width, height };
    fitCamera(p.len, p.width, height);
  },
  /** Spin frame i of n: frame 0 = straight front view, rotation negative so the nose turns left (toward the headline). */
  renderFrame(i, n) {
    car.rotation.y = -(i / n) * Math.PI * 2;
    fitCamera(api._dims.len, api._dims.width, api._dims.height);
    renderer.render(scene, camera);
  },
  renderGallery(kind) {
    const d = api._dims;
    switch (kind) {
      case "rear":
        car.rotation.y = THREE.MathUtils.degToRad(-215);
        fitCamera(d.len, d.width, d.height, 1.1);
        break;
      case "front-low":
        car.rotation.y = THREE.MathUtils.degToRad(-18);
        fitCamera(d.len, d.width, d.height, 0.55);
        camera.position.multiplyScalar(0.8);
        camera.lookAt(0, d.height * 0.45, 0);
        break;
      case "side":
        car.rotation.y = THREE.MathUtils.degToRad(-90);
        fitCamera(d.len, d.width, d.height, 0.85);
        break;
      case "wheel":
        car.rotation.y = THREE.MathUtils.degToRad(-35);
        camera.position.set(-d.len * 0.05, 0.5, d.len * 0.62);
        camera.lookAt(-d.len * 0.12, 0.38, d.width * 0.1);
        break;
    }
    renderer.render(scene, camera);
  },
};
window.idya = api;

// ---------- Hero « Signature rouge » (brief §11.1) ----------
// Locked-off shot, car in the right two-thirds facing left, only the light moves. 7.0 s loop.
const hero = {
  car: null,
  blade: null,
  bladeFill: null,
  headPool: null,
  floorGlow: null,
  headMats: [],
  rimBase: null,
};

function smooth(t, a, b) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

api.loadHero = function loadHero({ portrait = false } = {}) {
  if (car) scene.remove(car);
  car = buildCar({ body: "sedan-sport", paint: "#070708", finish: "gloss" });
  hero.car = car;
  scene.add(car);
  const p = PROFILES["sedan-sport"];
  const height = Math.max(...p.top.map((t) => t[1])) + p.clearance;
  api._dims = { len: p.len, width: p.width, height };
  // Headlights: collect materials so we can animate their emissive intensity
  hero.headMats = [];
  car.traverse((m) => {
    if (m.isMesh && m.material === headMat) {
      const mat = headMat.clone();
      m.material = mat;
      hero.headMats.push(mat);
    }
  });
  // Studio lights for the hero: everything low-key, red rim stays as the base signature
  key.intensity = 1.2;
  keyFill.intensity = 0.4;
  rimRed.intensity = 18;
  rimRedTop.intensity = 22;
  shadowLight.intensity = 0.25;
  scene.environmentIntensity = 0.12;
  // Blade: narrow vertical red area light that sweeps along the body
  hero.blade = new THREE.RectAreaLight(0xff2a14, 0, 0.16, 6);
  scene.add(hero.blade);
  hero.bladeFill = new THREE.PointLight(0xff1a0a, 0, 7, 1.8);
  scene.add(hero.bladeFill);
  // Headlight pool on the floor + floor glow
  hero.headPool = new THREE.SpotLight(0xdfe8ff, 0, 12, 0.6, 0.8, 1.5);
  scene.add(hero.headPool, hero.headPool.target);
  hero.floorGlow = new THREE.PointLight(0xe10600, 0, 9, 1.6);
  scene.add(hero.floorGlow);

  // Composition: car to the right, nose toward the left (headline zone), camera slightly below hood
  if (portrait) {
    car.rotation.y = THREE.MathUtils.degToRad(-38);
    car.position.set(0.3, 0, 0);
    camera.fov = 36;
    camera.position.set(0.2, 0.95, 9.6);
    camera.lookAt(0.3, -0.35, 0); // aim slightly low so the car sits in the upper half of the frame
  } else {
    car.rotation.y = THREE.MathUtils.degToRad(-36);
    car.position.set(2.35, 0, 0);
    camera.fov = 24;
    camera.position.set(0.3, 0.9, 8.6);
    camera.lookAt(1.25, 0.62, 0);
  }
  camera.updateProjectionMatrix();
  contact.position.x = car.position.x;
};

/** t in seconds, 0 ≤ t < 7 */
api.renderHero = function renderHero(t) {
  const c = hero.car;
  if (!c) return;
  const d = api._dims;
  // --- Blade sweep 0.5 → 3.0 s, rear → front along the car's local x axis
  const sweep = smooth(t, 0.5, 3.0);
  const localX = -d.len * 0.62 + sweep * d.len * 1.3;
  const world = new THREE.Vector3(localX, 1.0, 0.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rotation.y).add(c.position);
  // Offset the light toward the camera side so it rakes across the body
  const side = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rotation.y).multiplyScalar(1.9);
  hero.blade.position.copy(world).add(side).setY(1.9);
  hero.blade.lookAt(world.x, 0.7, world.z);
  const bladeOn = smooth(t, 0.35, 0.8) * (1 - smooth(t, 2.9, 3.4));
  hero.blade.intensity = 220 * bladeOn;
  hero.bladeFill.position.copy(hero.blade.position).setY(0.8);
  hero.bladeFill.intensity = 14 * bladeOn;
  // --- Headlights ignite 3.0 → 3.6 s, hold, dim 4.5 → 6.2 s
  const ignite = smooth(t, 3.0, 3.6) * (1 - smooth(t, 4.5, 6.2));
  for (const m of hero.headMats) m.emissiveIntensity = 0.35 + ignite * 14;
  const nose = new THREE.Vector3(d.len / 2 - 0.1, 0.75, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rotation.y).add(c.position);
  const fwd = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rotation.y);
  hero.headPool.position.copy(nose);
  hero.headPool.target.position.copy(nose.clone().add(fwd.clone().multiplyScalar(5)).setY(0));
  hero.headPool.intensity = 220 * ignite;
  // --- Floor glow pulse (peak at ~3.9 s), returns to the opening value
  const pulse = Math.sin(Math.PI * smooth(t, 3.2, 4.8));
  hero.floorGlow.position.copy(c.position).setY(0.35);
  hero.floorGlow.intensity = 3 + 26 * pulse;
  // Base red rim slightly brighter during the peak, back to base afterwards (start = end)
  rimRedTop.intensity = 22 + 10 * pulse;
  renderer.render(scene, camera);
};
