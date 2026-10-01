// Pro Fer Forgé: website assistant widget. Loaded on first click of the launcher (see site.js).
// Talks to the assistant endpoint (data-assistant on <body>). No tracking; consent asked before the first message.
(() => {
  if (window.PFAssistant) return;
  const d = document, b = d.body, lang = b.dataset.lang === "en" ? "en" : "fr", API = b.dataset.assistant;
  const T = {
    fr: { title: "Assistant Pro Fer Forgé", status: "Répond en quelques secondes", close: "Fermer l’assistant", placeholder: "Écrivez votre message…", send: "Envoyer",
      hello: "Bonjour ! Je peux préparer votre demande de soumission et réserver une visite gratuite. Parlez-moi de votre projet : balcons, escaliers, garde-corps ?",
      consentT: "Avant de commencer", consent: "Vos réponses servent à préparer votre soumission et sont conservées de façon sécurisée. Elles sont traitées par un assistant d’intelligence artificielle (Anthropic) et un hébergeur infonuagique, possiblement hors Québec.",
      privacy: "Politique de confidentialité", start: "J’accepte, commencer", typing: "L’assistant écrit…", error: "Connexion impossible. Réessayez ou appelez le (438) 815-7232.",
      booked: "Visite demandée", ics: "Ajouter à mon calendrier", call: "Parler à quelqu’un : (438) 815-7232", restart: "Nouvelle conversation", privacyUrl: "/politique-de-confidentialite/", demo: "Mode démonstration" },
    en: { title: "Pro Fer Forgé assistant", status: "Replies in seconds", close: "Close the assistant", placeholder: "Type your message…", send: "Send",
      hello: "Hello! I can prepare your quote request and book a free visit. Tell me about your project: balconies, stairs, railings?",
      consentT: "Before we start", consent: "Your answers are used to prepare your quote and are stored securely. They are processed by an AI assistant (Anthropic) and a cloud host, possibly outside Québec.",
      privacy: "Privacy policy", start: "I agree, start", typing: "The assistant is typing…", error: "Connection failed. Try again or call (438) 815-7232.",
      booked: "Visit requested", ics: "Add to my calendar", call: "Talk to someone: (438) 815-7232", restart: "New conversation", privacyUrl: "/en/privacy-policy/", demo: "Demo mode" },
  }[lang];
  const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch {} } };
  const newSid = () => { const a = new Uint8Array(18); crypto.getRandomValues(a); return "s_" + [...a].map((x) => x.toString(36).padStart(2, "0")).join("").slice(0, 30); };
  let pending = [], sid = store.get("pf-asst-sid") || newSid(), consented = store.get("pf-asst-consent") === "1", busy = false, lastFocus = null;

  const el = (tag, attrs = {}, ...kids) => { const n = d.createElement(tag); for (const [k, v] of Object.entries(attrs)) k === "class" ? (n.className = v) : k.startsWith("on") ? n.addEventListener(k.slice(2), v) : n.setAttribute(k, v); kids.flat().forEach((c) => c != null && n.append(c)); return n; };
  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  const panel = el("section", { class: "asst", role: "dialog", "aria-modal": "false", "aria-labelledby": "asst-t", hidden: "" });
  panel.innerHTML = `<header class="asst-h"><div class="asst-av" aria-hidden="true">PF</div><div><h2 id="asst-t">${T.title}</h2><p><i class="asst-dot"></i>${T.status}${b.dataset.assistantDemo ? ` · <strong>${T.demo}</strong>` : ""}</p></div>
<button type="button" class="asst-x" aria-label="${T.close}">${ICON}<path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
<div class="asst-log" role="log" aria-live="polite" aria-relevant="additions"></div>
<div class="asst-choices" aria-label="${lang === "fr" ? "Choix rapides" : "Quick choices"}"></div>
<form class="asst-f"><label class="sr" for="asst-in">${T.placeholder}</label><textarea id="asst-in" rows="1" maxlength="1500" placeholder="${T.placeholder}" autocomplete="off"></textarea>
<button type="submit" class="asst-send" aria-label="${T.send}">${ICON}<path d="M4 12l16-8-6 16-2-7z"/></svg></button></form>
<p class="asst-foot"><a href="tel:+14388157232" data-event="click_call">${T.call}</a> · <button type="button" class="asst-restart">${T.restart}</button></p>`;
  d.body.append(panel);
  const log = panel.querySelector(".asst-log"), choices = panel.querySelector(".asst-choices"), form = panel.querySelector(".asst-f"), input = panel.querySelector("textarea");

  const scroll = () => (log.scrollTop = log.scrollHeight);
  const bubble = (role, text) => { const m = el("div", { class: `asst-m asst-${role}` }); m.textContent = text; log.append(m); scroll(); return m; };
  const clearChoices = () => (choices.innerHTML = "");
  function showChoices(opts, slots) {
    clearChoices();
    (slots || []).forEach((s) => choices.append(el("button", { type: "button", class: "asst-slot", onclick: () => send(s.label, s.id) }, el("span", {}, "📅"), s.label)));
    (opts || []).forEach((o) => choices.append(el("button", { type: "button", class: "asst-chip", onclick: () => send(o) }, o)));
  }
  function consentCard() {
    const c = el("div", { class: "asst-consent" }, el("h3", {}, T.consentT), el("p", {}, T.consent), el("a", { href: T.privacyUrl, target: "_blank", rel: "noopener" }, T.privacy),
      el("button", { type: "button", class: "btn btn-primary asst-start", onclick: () => { consented = true; store.set("pf-asst-consent", "1"); c.remove(); form.hidden = false; showChoices(pending); input.focus(); } }, el("span", {}, T.start)));
    pending = [...choices.querySelectorAll(".asst-chip")].map((x) => x.textContent); clearChoices();
    log.append(c); form.hidden = true;
  }
  async function api(body) {
    const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error });
    return j;
  }
  async function send(text, slotId) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true; input.value = ""; autosize(); clearChoices(); bubble("user", text);
    const typing = bubble("bot asst-typing", T.typing);
    try {
      const out = await api({ session_id: sid, message: text, lang, page: location.pathname, consent: consented, slot_id: slotId });
      store.set("pf-asst-sid", sid);
      typing.remove();
      bubble("bot", out.reply);
      if (out.booked) {
        const card = el("div", { class: "asst-booked" }, el("strong", {}, `✅ ${T.booked}`), el("span", {}, out.booked.label),
          el("a", { href: `${API.replace(/\/$/, "")}/ics?session_id=${encodeURIComponent(sid)}`, download: "visite-pro-fer-forge.ics" }, T.ics));
        log.append(card); scroll();
      }
      showChoices(out.options, out.slots);
      track("assistant_message", { done: !!out.done, booked: !!out.booked });
    } catch (e) {
      typing.remove();
      if (e.code === "consent_required") { consented = false; store.del("pf-asst-consent"); consentCard(); }
      else bubble("bot asst-err", T.error);
    } finally { busy = false; if (!form.hidden) input.focus(); }
  }
  function track(name, params) { try { if (localStorage.getItem("pf-consent") === "yes" && window.gtag) gtag("event", name, params); } catch {} }
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  panel.querySelector(".asst-x").addEventListener("click", () => close());
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  panel.querySelector(".asst-restart").addEventListener("click", () => { sid = newSid(); store.del("pf-asst-sid"); log.innerHTML = ""; clearChoices(); greet(); });

  async function greet() {
    bubble("bot", T.hello);
    showChoices(lang === "fr" ? ["Peinture de fer forgé", "Soudure / réparation", "Les deux", "Je ne sais pas"] : ["Wrought iron painting", "Welding / repair", "Both", "Not sure"]);
    if (!consented) consentCard();
  }
  async function restore() {
    if (!store.get("pf-asst-sid")) return greet();
    try {
      const r = await fetch(`${API}?session_id=${encodeURIComponent(sid)}`); const j = await r.json();
      if (!j.messages?.length) return greet();
      j.messages.forEach((m) => bubble(m.role === "user" ? "user" : "bot", m.role === "user" ? m.text : m.text.replace(/\[\[options:[^\]]*\]\]\s*$/i, "").trim()));
      if (!consented) consentCard();
    } catch { greet(); }
  }
  let started = false;
  function open() {
    lastFocus = d.activeElement; panel.hidden = false; b.classList.add("asst-open");
    d.querySelector(".asst-launch")?.setAttribute("aria-expanded", "true");
    if (!started) { started = true; restore(); }
    setTimeout(() => (form.hidden ? panel.querySelector(".asst-start, .asst-x") : input).focus(), 50);
    track("assistant_open", {});
  }
  function close() { panel.hidden = true; b.classList.remove("asst-open"); d.querySelector(".asst-launch")?.setAttribute("aria-expanded", "false"); lastFocus?.focus?.(); }
  window.PFAssistant = { open, close, toggle: () => (panel.hidden ? open() : close()) };
})();
