"use client";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "@/lib/site";
import { Ico } from "./icons";
import { MAX_SCAN_BYTES, MAX_SIDE, applyFilter, detectQuad, insetCorners, isConvex, orderCorners, outputSize, rotateCorners, scanName, solveHomography, toGray, warpRows, type Filter, type Pt } from "./scanmath";
import { scanTx } from "./scantext";
import { fmtSize } from "./util";

/**
 * Numériseur de documents intégré : appareil photo (ou photo existante), quatre coins à ajuster,
 * redressement de la perspective, filtres, plusieurs pages, puis envoi page par page.
 * Tout le traitement d'image se fait dans le navigateur, sur une image de 2000 pixels au plus.
 *
 * Deux usages :
 *  - `send` : plusieurs pages ; le numériseur envoie chaque page et garde celles qui échouent pour un nouvel essai ;
 *  - `onFile` (avec `single`) : une seule page, rendue à l'écran appelant (reçus du quotidien).
 */
export type ScannerProps = {
  lang: Lang;
  /** Titre affiché (par exemple le nom du document demandé). */
  title?: string;
  single?: boolean;
  /** Début du nom de fichier : scan-AAAAMMJJ-HHMM-1.jpg. */
  prefix?: string;
  send?: (file: File) => Promise<boolean>;
  onFile?: (file: File) => void;
  /** `sent` : nombre de pages envoyées avec succès avant la fermeture. */
  onClose: (sent: number) => void;
};

type Page = { id: number; blob: Blob; url: string; state: "new" | "wait" | "busy" | "ok" | "error"; name?: string };
type Shot = { w: number; h: number; v: number; auto: boolean };
const FILTERS: Filter[] = ["couleur", "document", "nb"];
const PAD = 26;

const tick = () => new Promise<void>((r) => window.setTimeout(r, 0));
const toBlob = (c: HTMLCanvasElement, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));
function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
const ctx2d = (c: HTMLCanvasElement) => { const x = c.getContext("2d", { willReadFrequently: true }); if (!x) throw new Error("canvas"); return x; };

/** Copie une image (photo, image vidéo, canevas) sur un canevas à fond blanc, de `max` pixels au plus. */
function drawScaled(src: CanvasImageSource, w: number, h: number, max: number) {
  const k = Math.min(1, max / Math.max(w, h));
  const c = makeCanvas(w * k, h * k);
  const x = ctx2d(c);
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  x.imageSmoothingQuality = "high";
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Lit un fichier image, dans le bon sens (orientation de l'appareil appliquée). */
async function decode(file: Blob): Promise<HTMLCanvasElement> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    try { return drawScaled(bmp, bmp.width, bmp.height, MAX_SIDE); } finally { bmp.close(); }
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((ok, ko) => { img.onload = () => ok(); img.onerror = () => ko(new Error("image")); img.src = url; });
      if (!img.naturalWidth) throw new Error("image");
      return drawScaled(img, img.naturalWidth, img.naturalHeight, MAX_SIDE);
    } finally { URL.revokeObjectURL(url); }
  }
}

/** JPEG d'environ 0,82 de qualité ; la qualité, puis la taille, baissent tant que le fichier dépasse la limite. */
async function encode(c: HTMLCanvasElement): Promise<Blob> {
  let canvas = c;
  for (let round = 0; round < 4; round++) {
    for (const q of [0.82, 0.72, 0.6, 0.5, 0.4]) {
      const b = await toBlob(canvas, q);
      if (b && b.size < MAX_SCAN_BYTES) return b;
    }
    canvas = drawScaled(canvas, canvas.width, canvas.height, Math.max(canvas.width, canvas.height) * 0.7);
  }
  throw new Error("encode");
}

function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(navigator.onLine !== false);
    sync();
    window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  return on;
}

const btnMain = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[0.95rem] font-semibold text-navy-950 disabled:bg-white/40 disabled:text-navy-950/70";
const btnGhost = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/45 px-5 text-[0.95rem] font-semibold text-white hover:bg-white/10 disabled:opacity-50";
const btnIcon = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 text-white hover:bg-white/10 disabled:opacity-40";
const pickCls = "relative cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-white";

function ImagePick({ label, onFile, camera = false, className, children }: { label: string; onFile: (f: File) => void; camera?: boolean; className: string; children: ReactNode }) {
  return (
    <label className={`${pickCls} ${className}`}>
      {children}
      <input type="file" accept="image/*" className="sr-only" aria-label={label} {...(camera ? { capture: "environment" as const } : {})}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
    </label>
  );
}

export function Scanner({ lang, title, single = false, prefix = "scan", send, onFile, onClose }: ScannerProps) {
  const t = scanTx[lang];
  const online = useOnline();
  const headId = useId();
  const [step, setStep] = useState<"capture" | "adjust" | "pages">("capture");
  const [cam, setCam] = useState<"starting" | "live" | "denied" | "none">("starting");
  const [camTry, setCamTry] = useState(0);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState<boolean | null>(null);
  const [coarse, setCoarse] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<"" | "reading" | "working">("");
  const [shot, setShot] = useState<Shot | null>(null);
  const [preview, setPreview] = useState("");
  const [corners, setCorners] = useState<Pt[]>(insetCorners());
  const [drag, setDrag] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("document");
  const [pages, setPages] = useState<Page[]>([]);
  const [sending, setSending] = useState(false);
  const [quit, setQuit] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const src = useRef<HTMLCanvasElement | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const grab = useRef({ dx: 0, dy: 0 });
  const alive = useRef(true);
  const pagesRef = useRef<Page[]>([]);
  const seq = useRef(0);
  const named = useRef(0);
  const stamp = useRef<Date | null>(null);
  pagesRef.current = pages;

  const sentCount = pages.filter((p) => p.state === "ok").length;
  const unsent = pages.filter((p) => p.state !== "ok");

  // Montage : la page derrière ne défile plus ; à la fermeture, on libère les images et le focus revient d'où il vient.
  useEffect(() => {
    alive.current = true;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setCoarse(window.matchMedia?.("(pointer: coarse)").matches ?? false);
    return () => {
      alive.current = false;
      document.body.style.overflow = prev;
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      (opener?.isConnected ? opener : document.getElementById("portal-title"))?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Chaque étape est annoncée : le focus va sur le titre.
  useEffect(() => { head.current?.focus({ preventScroll: true }); }, [step]);

  // Appareil photo : ouvert seulement à l'étape de prise de vue, toujours arrêté en la quittant.
  useEffect(() => {
    if (step !== "capture") return;
    let dead = false;
    let mine: MediaStream | null = null;
    setCam("starting"); setReady(false); setTorch(null);
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.getUserMedia) { setCam("none"); return; }
    md.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false }).then((s) => {
      if (dead) { s.getTracks().forEach((x) => x.stop()); return; }
      mine = s; stream.current = s;
      const track = s.getVideoTracks()[0];
      const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
      if (caps.torch) setTorch(false);
      track?.addEventListener("ended", () => { if (!dead) setCam("none"); });
      const v = video.current;
      if (v) { v.srcObject = s; v.play().catch(() => { /* la lecture démarre au premier geste */ }); }
      setCam("live");
    }).catch((e: unknown) => {
      if (dead) return;
      const name = (e as { name?: string } | null)?.name ?? "";
      setCam(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "none");
    });
    const v = video.current;
    return () => {
      dead = true;
      mine?.getTracks().forEach((x) => x.stop());
      if (stream.current === mine) stream.current = null;
      if (v) v.srcObject = null;
    };
  }, [step, camTry]);

  const toggleTorch = async () => {
    const track = stream.current?.getVideoTracks()[0];
    if (!track || torch === null) return;
    const next = !torch;
    try { await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }); setTorch(next); } catch { setTorch(null); }
  };

  /** Une photo est prête : on cherche les bords sur une petite copie en gris, sinon retrait de 6 %. */
  const takeShot = useCallback((c: HTMLCanvasElement) => {
    src.current = c;
    let found: Pt[] | null = null;
    try {
      const small = drawScaled(c, c.width, c.height, 240);
      found = detectQuad(toGray(ctx2d(small).getImageData(0, 0, small.width, small.height).data, small.width * small.height), small.width, small.height);
    } catch { found = null; }
    setCorners(found ?? insetCorners());
    setShot((s) => ({ w: c.width, h: c.height, v: (s?.v ?? 0) + 1, auto: Boolean(found) }));
    setMsg("");
    setStep("adjust");
  }, []);

  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth || busy) return;
    try { takeShot(drawScaled(v, v.videoWidth, v.videoHeight, MAX_SIDE)); } catch { setMsg(t.failed); }
  };

  const fromFile = async (f: File) => {
    if (busy) return;
    setBusy("reading"); setMsg("");
    try {
      const c = await decode(f);
      if (alive.current) takeShot(c);
    } catch { if (alive.current) setMsg(t.badImage); }
    if (alive.current) setBusy("");
  };

  // Aperçu de l'étape d'ajustement : petite copie de la photo, avec le rendu choisi réellement appliqué.
  useEffect(() => {
    const c = src.current;
    if (step !== "adjust" || !shot || !c) return;
    let dead = false;
    (async () => {
      try {
        const small = drawScaled(c, c.width, c.height, 900);
        if (filter !== "couleur") {
          const x = ctx2d(small), d = x.getImageData(0, 0, small.width, small.height);
          applyFilter(d.data, small.width, small.height, filter);
          x.putImageData(d, 0, 0);
        }
        const b = await toBlob(small, 0.8);
        if (!b) return;
        const url = URL.createObjectURL(b);
        if (dead) URL.revokeObjectURL(url); else setPreview(url);
      } catch { /* l'aperçu précédent reste affiché */ }
    })();
    return () => { dead = true; };
  }, [step, shot, filter]);

  // Taille de la photo à l'écran : la plus grande possible dans la zone, avec une marge pour les poignées.
  useEffect(() => {
    const el = stage.current;
    if (step !== "adjust" || !el || !shot) return;
    const fit = () => {
      const k = Math.min((el.clientWidth - PAD * 2) / shot.w, (el.clientHeight - PAD * 2) / shot.h);
      setBox({ w: Math.max(40, shot.w * k), h: Math.max(40, shot.h * k) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step, shot]);

  const rotate = (dir: "left" | "right") => {
    const c = src.current;
    if (!c || busy) return;
    const r = makeCanvas(c.height, c.width), x = ctx2d(r);
    x.translate(r.width / 2, r.height / 2);
    x.rotate(dir === "right" ? Math.PI / 2 : -Math.PI / 2);
    x.drawImage(c, -c.width / 2, -c.height / 2);
    src.current = r;
    setCorners((cs) => rotateCorners(cs, dir));
    setShot((s) => (s ? { ...s, w: r.width, h: r.height, v: s.v + 1 } : s));
    setMsg("");
  };

  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const moveCorner = (i: number, p: Pt) => { setMsg(""); setCorners((cs) => cs.map((c, k) => (k === i ? { x: clamp(p.x), y: clamp(p.y) } : c))); };
  const pointerPos = (e: RPointerEvent): Pt | null => {
    const r = e.currentTarget.parentElement?.getBoundingClientRect();
    return r && r.width && r.height ? { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } : null;
  };
  const onDown = (i: number) => (e: RPointerEvent<HTMLButtonElement>) => {
    const p = pointerPos(e);
    if (!p || busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { dx: corners[i].x - p.x, dy: corners[i].y - p.y };
    setDrag(i);
  };
  const onMove = (i: number) => (e: RPointerEvent<HTMLButtonElement>) => {
    if (drag !== i) return;
    const p = pointerPos(e);
    if (p) moveCorner(i, { x: p.x + grab.current.dx, y: p.y + grab.current.dy });
  };
  const onUp = (e: RPointerEvent<HTMLButtonElement>) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); setDrag(null); };
  const onKey = (i: number) => (e: RKeyboardEvent) => {
    const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key];
    if (!d || busy) return;
    e.preventDefault();
    const stepSize = e.shiftKey ? 0.05 : 0.01;
    moveCorner(i, { x: corners[i].x + d[0] * stepSize, y: corners[i].y + d[1] * stepSize });
  };

  /** Redresse la page : homographie rectangle → quadrilatère, par tranches pour laisser l'écran répondre. */
  const apply = async () => {
    const c = src.current;
    if (!c || busy) return;
    const q = orderCorners(corners.map((p) => ({ x: p.x * c.width, y: p.y * c.height })));
    if (!isConvex(q)) { setMsg(t.badQuad); return; }
    const { w, h } = outputSize(q);
    const H = solveHomography([{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }], q);
    if (!H) { setMsg(t.badQuad); return; }
    setBusy("working"); setMsg("");
    await tick();
    try {
      const data = ctx2d(c).getImageData(0, 0, c.width, c.height).data;
      const out = makeCanvas(w, h), ox = ctx2d(out), img = ox.createImageData(w, h);
      let last = performance.now();
      for (let y = 0; y < h; y += 48) {
        warpRows(data, c.width, c.height, H, img.data, w, y, Math.min(h, y + 48));
        if (performance.now() - last > 30) { await tick(); last = performance.now(); }
      }
      await tick();
      applyFilter(img.data, w, h, filter);
      ox.putImageData(img, 0, 0);
      const blob = await encode(out);
      if (!alive.current) return;
      if (single && onFile) {
        onFile(new File([blob], scanName(new Date(), 1, prefix), { type: "image/jpeg" }));
        return;
      }
      setPages((l) => [...l, { id: ++seq.current, blob, url: URL.createObjectURL(blob), state: "new" }]);
      src.current = null; setShot(null);
      setStep("pages");
    } catch { if (alive.current) setMsg(t.failed); }
    if (alive.current) setBusy("");
  };

  const move = (i: number, by: number) => setPages((l) => { const j = i + by; if (j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (id: number) => setPages((l) => { const p = l.find((x) => x.id === id); if (p) URL.revokeObjectURL(p.url); return l.filter((x) => x.id !== id); });

  // Plus aucune page : retour à la prise de vue.
  useEffect(() => { if (step === "pages" && pages.length === 0) setStep("capture"); }, [step, pages.length]);

  /** Envoie les pages qui ne le sont pas encore, une à une. Une page envoyée ne repart jamais. */
  const sendAll = async () => {
    if (!send || sending || !unsent.length) return;
    setSending(true); setMsg("");
    const when = (stamp.current ??= new Date());
    const before = pagesRef.current.filter((p) => p.state === "ok").length;
    const todo = pagesRef.current.filter((p) => p.state !== "ok").map((p) => ({ ...p, name: p.name ?? scanName(when, ++named.current, prefix) }));
    const mark = (id: number, state: Page["state"], name?: string) => setPages((l) => l.map((p) => (p.id === id ? { ...p, state, name: name ?? p.name } : p)));
    todo.forEach((p) => mark(p.id, "wait", p.name));
    let failed = 0;
    for (const p of todo) {
      mark(p.id, "busy");
      let ok = false;
      try { ok = await send(new File([p.blob], p.name, { type: "image/jpeg" })); } catch { ok = false; }
      if (!alive.current) return;
      mark(p.id, ok ? "ok" : "error");
      if (!ok) failed++;
    }
    setSending(false);
    if (failed) setMsg(t.sendErr); else onClose(before + todo.length);
  };

  const askClose = () => {
    if (sending) return;
    if (unsent.length && !quit) { setQuit(true); return; }
    onClose(sentCount);
  };

  // Clavier : Échap ferme, Tab reste dans le numériseur.
  const onRootKey = (e: RKeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); if (quit) setQuit(false); else askClose(); return; }
    if (e.key !== "Tab" || !root.current) return;
    const items = Array.from(root.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]')).filter((el) => el.offsetParent !== null || el.tagName === "INPUT");
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1], cur = document.activeElement;
    if (e.shiftKey && (cur === first || cur === head.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
  };

  const heading = step === "adjust" ? t.adjustTitle : step === "pages" ? t.pagesTitle : title ?? t.title;
  const total = pages.reduce((s, p) => s + p.blob.size, 0);
  const pill: Record<Page["state"], string> = { new: "", wait: t.stWait, busy: t.stBusy, ok: t.stOk, error: t.stErr };
  const pillCls: Record<Page["state"], string> = { new: "", wait: "bg-white/15 text-white", busy: "bg-[#8fd3e6] text-navy-950", ok: "bg-[#bfe9d8] text-[#0b4a37]", error: "bg-[#ffd9d4] text-[#7a1c16]" };
  const poly = corners.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");
  const ZOOM = 2.2, LENS = 104;

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby={headId} onKeyDown={onRootKey} className="on-dark fixed inset-0 z-[60] flex flex-col bg-[#101129] text-white">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <h2 id={headId} ref={head} tabIndex={-1} className="min-w-0 flex-1 truncate font-display text-lg font-semibold !text-white outline-none">{heading}</h2>
        {!single && pages.length > 0 && <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{step === "pages" ? t.pages(pages.length) : t.pageN(pages.length + 1)}</span>}
        <button type="button" onClick={askClose} disabled={sending} aria-label={t.close} className={btnIcon}><Ico name="close" strokeWidth={2} /></button>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4">
        {!online && <p role="status" className="mb-2 flex items-start gap-2 rounded-2xl bg-[#fff4e5] px-3.5 py-2.5 text-sm font-medium text-[#6b3d00]"><Ico name="wifiOff" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />{t.offline}</p>}
        <div role="alert">{msg && <p className="mb-2 rounded-2xl bg-[#ffe1dd] px-3.5 py-2.5 text-sm font-medium text-[#7a1c16]">{msg}</p>}</div>
        <div role="status" aria-live="polite" className="sr-only">{busy === "working" ? t.working : busy === "reading" ? t.reading : ""}</div>
      </div>

      {quit && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div role="alertdialog" aria-label={t.quitQ} className="mb-2 rounded-2xl bg-white p-4 text-navy-950 on-light">
            <p className="font-semibold">{t.quitQ}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" autoFocus onClick={() => setQuit(false)} className="btn-secondary min-h-11 flex-1">{t.quitNo}</button>
              <button type="button" onClick={() => onClose(sentCount)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#7a1c16] px-4 font-semibold text-white">{t.quitYes}</button>
            </div>
          </div>
        </div>
      )}

      {step === "capture" && (
        <>
          {cam === "live" && <p className="mx-auto w-full max-w-3xl px-4 pb-1 text-sm leading-snug text-white/90">{t.camHint}</p>}
          <div className="relative mx-auto min-h-0 w-full max-w-3xl flex-1">
            <video ref={video} playsInline muted autoPlay onLoadedMetadata={() => setReady(true)} aria-hidden="true" className={`absolute inset-0 h-full w-full object-contain ${cam === "live" ? "" : "invisible"}`} />
            {cam === "live" && (
              <>
                <div className="pointer-events-none absolute inset-[7%] rounded-2xl border-2 border-dashed border-white/70" aria-hidden="true">
                  {["-top-0.5 -left-0.5 border-t-4 border-l-4 rounded-tl-2xl", "-top-0.5 -right-0.5 border-t-4 border-r-4 rounded-tr-2xl", "-bottom-0.5 -right-0.5 border-b-4 border-r-4 rounded-br-2xl", "-bottom-0.5 -left-0.5 border-b-4 border-l-4 rounded-bl-2xl"].map((c) => <span key={c} className={`absolute h-7 w-7 border-white ${c}`} />)}
                </div>
              </>
            )}
            {cam === "starting" && <p role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-white/90">{t.camStarting}</p>}
            {(cam === "denied" || cam === "none") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Ico name="camera" className="h-7 w-7" /></span>
                <p className="max-w-sm leading-relaxed">{cam === "denied" ? t.camDenied : t.camNone}</p>
                <ImagePick label={t.pickExisting} onFile={fromFile} className={`${btnMain} w-full max-w-xs`}><Ico name="image" /><span>{t.pickExisting}</span></ImagePick>
                {coarse && <ImagePick camera label={t.nativeCam} onFile={fromFile} className={`${btnGhost} w-full max-w-xs`}><Ico name="camera" /><span>{t.nativeCam}</span></ImagePick>}
                {<button type="button" onClick={() => setCamTry((n) => n + 1)} className="min-h-11 rounded-full px-3 text-sm font-semibold underline underline-offset-4">{t.camRetry}</button>}
              </div>
            )}
            {busy === "reading" && <p className="absolute inset-0 flex items-center justify-center bg-[#101129]/85 px-6 text-center font-medium">{t.reading}</p>}
          </div>
          {(cam === "live" || cam === "starting") && (
            <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
                <span />
                <button type="button" onClick={shoot} disabled={cam !== "live" || !ready || Boolean(busy)} aria-label={t.shutter} className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white disabled:opacity-40">
                  <span className="h-14 w-14 rounded-full bg-white" />
                </button>
                {torch !== null ? (
                  <button type="button" onClick={toggleTorch} aria-pressed={torch} aria-label={torch ? t.torchOff : t.torchOn} className={`${btnIcon} ${torch ? "!border-white bg-white !text-navy-950" : ""}`}><Ico name="bolt" strokeWidth={2} /></button>
                ) : <span />}
              </div>
              <ImagePick label={t.pickExisting} onFile={fromFile} className={`${btnGhost} mt-3 w-full`}><Ico name="image" /><span>{t.pickExisting}</span></ImagePick>
            </div>
          )}
        </>
      )}

      {step === "adjust" && shot && (
        <>
          <p className="mx-auto w-full max-w-3xl px-4 pb-1 text-sm leading-snug text-white/90">{shot.auto ? t.adjustAuto : t.adjustManual}<span className="sr-only"> {t.adjustKeys}</span></p>
          <div ref={stage} className="relative mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: box.w, height: box.h }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview && <img src={preview} alt="" draggable={false} className="block h-full w-full rounded-sm select-none" />}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <path d={`M0 0H100V100H0Z M${poly.split(" ").join(" L")}Z`} fill="rgba(16,17,41,.55)" fillRule="evenodd" />
                <polygon points={poly} fill="none" stroke="#8fd3e6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </svg>
              {corners.map((p, i) => (
                <button key={i} type="button" data-corner={i} aria-label={`${t.corners[i]} : ${t.cornerAt(Math.round(p.x * 100), Math.round(p.y * 100))}`}
                  onPointerDown={onDown(i)} onPointerMove={onMove(i)} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey(i)}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, touchAction: "none" }}
                  className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center !rounded-full active:cursor-grabbing">
                  <span className={`block rounded-full border-[3px] border-white bg-[#2b8fb0] shadow-[0_0_0_2px_rgba(16,17,41,.6)] ${drag === i ? "h-4 w-4 opacity-70" : "h-6 w-6"}`} />
                </button>
              ))}
              {drag !== null && preview && (
                <div aria-hidden="true" className={`pointer-events-none absolute -top-5 overflow-hidden rounded-full border-2 border-white bg-[#101129] bg-no-repeat shadow-lg ${corners[drag].x < 0.5 ? "-right-5" : "-left-5"}`}
                  style={{ width: LENS, height: LENS, backgroundImage: `url(${preview})`, backgroundSize: `${box.w * ZOOM}px ${box.h * ZOOM}px`, backgroundPosition: `${LENS / 2 - corners[drag].x * box.w * ZOOM}px ${LENS / 2 - corners[drag].y * box.h * ZOOM}px` }}>
                  <span className="absolute top-1/2 left-0 h-px w-full bg-[#8fd3e6]" /><span className="absolute top-0 left-1/2 h-full w-px bg-[#8fd3e6]" />
                </div>
              )}
            </div>
            {busy === "working" && <p className="absolute inset-0 flex items-center justify-center bg-[#101129]/80 px-6 text-center font-medium">{t.working}</p>}
          </div>
          <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <div role="group" aria-label={t.filter} className="flex min-w-0 flex-1 rounded-full border border-white/35 p-0.5">
                {FILTERS.map((f) => (
                  <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} disabled={Boolean(busy)} className={`min-h-10 min-w-0 flex-1 !rounded-full px-1 text-[0.78rem] leading-tight font-semibold ${filter === f ? "bg-white text-navy-950" : "text-white"}`}>{t.filters[f]}</button>
                ))}
              </div>
              <button type="button" onClick={() => rotate("left")} disabled={Boolean(busy)} aria-label={t.rotL} className={btnIcon}><Ico name="rotL" strokeWidth={2} /></button>
              <button type="button" onClick={() => rotate("right")} disabled={Boolean(busy)} aria-label={t.rotR} className={btnIcon}><Ico name="rotR" strokeWidth={2} /></button>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { src.current = null; setShot(null); setMsg(""); setStep("capture"); }} disabled={Boolean(busy)} className={`${btnGhost} px-4`}>{t.retake}</button>
              <button type="button" onClick={() => { setMsg(""); setCorners([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]); }} disabled={Boolean(busy)} aria-label={t.wholePhoto} title={t.wholePhoto} className={`${btnIcon} h-12 w-12`}><Ico name="expand" strokeWidth={2} /></button>
              <button type="button" onClick={apply} disabled={Boolean(busy)} aria-busy={busy === "working"} className={`${btnMain} min-w-0 flex-1`}><Ico name="check" strokeWidth={2.4} />{busy === "working" ? t.working : single ? t.applySingle : t.apply}</button>
            </div>
          </div>
        </>
      )}

      {step === "pages" && (
        <>
          <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto px-4">
            <ol className="space-y-2">
              {pages.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={t.pageAlt(i + 1)} className="h-20 w-16 shrink-0 rounded-lg bg-white object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.pageN(i + 1)}</p>
                    <p className="text-sm text-white/80">{fmtSize(p.blob.size, lang)}</p>
                    {p.state !== "new" && <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${pillCls[p.state]}`}>{pill[p.state]}</p>}
                  </div>
                  {p.state !== "ok" && (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={sending || i === 0} aria-label={t.up(i + 1)} className={btnIcon}><Ico name="up" strokeWidth={2} /></button>
                      <button type="button" onClick={() => move(i, 1)} disabled={sending || i === pages.length - 1} aria-label={t.down(i + 1)} className={btnIcon}><Ico name="down" strokeWidth={2} /></button>
                      <button type="button" onClick={() => remove(p.id)} disabled={sending} aria-label={t.remove(i + 1)} className={btnIcon}><Ico name="trash" strokeWidth={1.9} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <div role="status" aria-live="polite" className="sr-only">{sending ? t.sending : ""}</div>
            <p className="mt-3 text-sm text-white/85">{t.total(fmtSize(total, lang))}{pages.length > 1 ? ` · ${t.multiNote}` : ""}</p>
          </div>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] min-[30rem]:flex-row">
            <button type="button" onClick={() => { setMsg(""); setStep("capture"); }} disabled={sending} className={`${btnGhost} min-[30rem]:flex-1`}><Ico name="plus" strokeWidth={2.2} />{t.addPage}</button>
            <button type="button" onClick={sendAll} disabled={sending || !online || unsent.length === 0} aria-busy={sending} className={`${btnMain} min-[30rem]:flex-1`}>
              <Ico name="send" strokeWidth={2.2} />{sending ? t.sending : pages.some((p) => p.state === "error") ? t.retrySend(unsent.length) : t.send(unsent.length)}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
