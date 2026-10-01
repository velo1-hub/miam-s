// Pro Fer Forgé: dependency-free behaviour. Respects prefers-reduced-motion; analytics only after consent.
(() => {
  const d = document, b = d.body, lang = b.dataset.lang || "fr";
  const $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  // Header state, scroll progress, parallax: one rAF-throttled scroll handler
  const hdr = $("[data-hdr]"), bar = $(".progress i"), par = $$("[data-parallax]");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, max = d.documentElement.scrollHeight - innerHeight;
    hdr && hdr.classList.toggle("scrolled", y > 24);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!reduce) par.forEach((el) => { el.style.transform = `translateY(calc(-50% + ${(y * parseFloat(el.dataset.parallax)).toFixed(1)}px))`; });
    updateProcess();
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Mobile menu + services submenu
  const burger = $(".burger"), nav = $("#nav");
  const setMenu = (open) => { nav.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); b.style.overflow = open ? "hidden" : ""; };
  burger && burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav && nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); $$(".has-sub.open").forEach((x) => x.classList.remove("open")); } });
  $$(".sub-btn").forEach((btn) => btn.addEventListener("click", () => { const li = btn.parentElement, o = li.classList.toggle("open"); btn.setAttribute("aria-expanded", o); }));
  // keep section anchor when switching language
  $$("[data-lang-switch]").forEach((a) => a.addEventListener("click", () => { if (location.hash) a.href += location.hash; }));

  // Reveal on scroll
  const rv = $$(".rv");
  if (reduce || !("IntersectionObserver" in window)) rv.forEach((e) => e.classList.add("in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach((e) => io.observe(e));
  }

  // Count-up (real figures only; final value is already in the markup)
  const nf = (n, dec) => n.toFixed(dec).replace(".", lang === "fr" ? "," : ".");
  const counters = $$("[data-count]");
  if (!reduce && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - p, 3)); el.textContent = nf(v, dec); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
    }), { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  // Pinned process sequence (desktop). Steps stack as cards on mobile via CSS.
  const proc = $("[data-process]");
  const steps = proc ? $$(".pstep", proc) : [], pnav = proc ? $$(".pnav li", proc) : [], pbar = proc ? $(".pbar i", proc) : null;
  let cur = -1;
  const setStep = (i) => { if (i === cur) return; cur = i; steps.forEach((s, k) => s.classList.toggle("on", k === i)); pnav.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("done", k < i); }); };
  function updateProcess() {
    if (!proc) return;
    if (innerWidth <= 980 || reduce) { steps.forEach((s) => s.classList.add("on")); return; }
    const r = proc.getBoundingClientRect(), total = r.height - innerHeight, p = Math.max(0, Math.min(1, -r.top / total));
    setStep(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    if (pbar) pbar.style.transform = `scaleX(${p})`;
  }
  addEventListener("resize", () => { cur = -1; updateProcess(); }, { passive: true });
  if (proc) setStep(0);

  // Before/after sliders
  $$("[data-ba]").forEach((el) => { const r = $("input", el); const set = () => el.style.setProperty("--pos", r.value + "%"); r.addEventListener("input", set); set(); });

  // Review carousel buttons
  $$("[data-carousel]").forEach((tr) => {
    const sec = tr.closest("section");
    $$(".rev-b", sec).forEach((bt) => bt.addEventListener("click", () => tr.scrollBy({ left: +bt.dataset.dir * (tr.firstElementChild.offsetWidth + 20), behavior: reduce ? "auto" : "smooth" })));
  });

  // Hero video: only on fast, non-saver, motion-OK connections; poster/ironwork art otherwise
  const vid = $(".hero-video");
  if (vid) {
    const c = navigator.connection || {}, slow = c.saveData || /(^|-)2g$/.test(c.effectiveType || "");
    if (!reduce && !slow && innerWidth > 700) {
      if (vid.dataset.webm && vid.canPlayType("video/webm")) { const s = d.createElement("source"); s.src = vid.dataset.webm; s.type = "video/webm"; vid.appendChild(s); }
      const m = d.createElement("source"); m.src = vid.dataset.mp4; m.type = "video/mp4"; vid.appendChild(m);
      vid.addEventListener("canplay", () => { vid.classList.add("on"); vid.play().catch(() => {}); }, { once: true });
      vid.load();
      d.addEventListener("visibilitychange", () => (d.hidden ? vid.pause() : vid.play().catch(() => {})));
    }
  }

  // Consent (Law 25): no measurement before an explicit "accept"
  const ck = $("#cookie"), gaId = b.dataset.ga;
  const loadGA = () => {
    if (!gaId || window.__ga) return; window.__ga = 1;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", gaId, { anonymize_ip: true });
    const s = d.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId); d.head.appendChild(s);
  };
  const consent = store.get("pf-consent");
  if (consent === "yes") loadGA(); else if (!consent && ck) ck.hidden = false;
  $$("[data-consent]").forEach((bt) => bt.addEventListener("click", () => { store.set("pf-consent", bt.dataset.consent); ck.hidden = true; if (bt.dataset.consent === "yes") loadGA(); }));
  $$("[data-cookie-manage]").forEach((bt) => bt.addEventListener("click", () => { ck.hidden = false; $("button", ck).focus(); }));
  d.addEventListener("click", (e) => {
    const a = e.target.closest("[data-event]"); if (!a || a.dataset.event === "submit_quote" || store.get("pf-consent") !== "yes" || !window.gtag) return;
    gtag("event", a.dataset.event, { page_path: location.pathname });
  });

  // Quote form
  const form = $("#quote");
  if (form) {
    const i18n = JSON.parse(form.dataset.i18n), status = $(".form-status", form), endpoint = b.dataset.endpoint, tsKey = b.dataset.turnstile;
    if (tsKey) { const s = d.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; s.defer = true; d.head.appendChild(s); $("[data-ts]", form).innerHTML = `<div class="cf-turnstile" data-sitekey="${tsKey}"></div>`; }
    const err = (id, msg) => { const p = $(`[data-err="${id}"]`, form); if (!p) return; p.textContent = msg || ""; p.hidden = !msg; const f = p.closest(".fld"); f && f.classList.toggle("bad", !!msg); };
    const val = {
      name: (v) => (v.trim() ? "" : i18n.errRequired),
      phone: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : i18n.errPhone),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : i18n.errEmail),
      postal: (v) => (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) ? "" : i18n.errPostal),
      clientType: (v) => (v ? "" : i18n.errRequired), work: (v) => (v ? "" : i18n.errRequired), timeline: (v) => (v ? "" : i18n.errRequired),
    };
    Object.keys(val).forEach((k) => { const el = form.elements[k]; el && el.addEventListener("blur", () => err(k, val[k](el.value))); });
    const photos = form.elements.photos;
    const checkFiles = () => { const fs = [...photos.files]; const bad = fs.length > 5 || fs.some((f) => f.size > 8 * 1024 * 1024 || !/^image\//.test(f.type)); err("photos", bad ? i18n.errFiles : ""); return !bad; };
    photos.addEventListener("change", checkFiles);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.elements.website.value) return; // honeypot
      let ok = true, first = null;
      Object.keys(val).forEach((k) => { const m = val[k](form.elements[k].value); err(k, m); if (m) { ok = false; first = first || form.elements[k]; } });
      if (!form.elements.consent.checked) { err("consent", i18n.errConsent); ok = false; first = first || form.elements.consent; } else err("consent", "");
      if (!checkFiles()) { ok = false; first = first || photos; }
      if (!ok) { first && first.focus(); return; }
      const submit = $("button[type=submit]", form), label = $("span", submit);
      submit.disabled = true; label.textContent = i18n.sending; status.hidden = true; status.classList.remove("err-s");
      const data = new FormData(form); data.delete("website"); data.append("_lang", lang); data.append("_page", location.href);
      const done = (title, text, bad) => { status.hidden = false; status.classList.toggle("err-s", !!bad); status.innerHTML = `<strong>${title}</strong><br>${text}`; submit.disabled = false; label.textContent = i18n.send; status.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); };
      if (endpoint) {
        try {
          const r = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
          if (!r.ok) throw new Error(r.status);
          form.reset(); done(i18n.sentTitle, i18n.sentText);
          if (store.get("pf-consent") === "yes" && window.gtag) gtag("event", "submit_quote", { page_path: location.pathname });
        } catch { done(lang === "fr" ? "Envoi impossible" : "Could not send", lang === "fr" ? "Appelez-nous ou écrivez à info@proferforge.ca." : "Please call us or email info@proferforge.ca.", true); }
      } else {
        // No backend configured yet: fall back to the visitor's email app (photos must be attached by hand).
        const g = (k) => data.get(k) || "-";
        const body = [`Nom: ${g("name")}`, `Téléphone: ${g("phone")}`, `Courriel: ${g("email")}`, `Code postal: ${g("postal")}`, `Adresse: ${g("address")}`, `Client: ${g("clientType")}`, `Travaux: ${g("work")}`, `Échéancier: ${g("timeline")}`, `Structures: ${data.getAll("structures").join(", ") || "-"}`, "", g("message")].join("\n");
        location.href = `mailto:info@proferforge.ca?subject=${encodeURIComponent(lang === "fr" ? "Demande de soumission" : "Quote request")}&body=${encodeURIComponent(body)}`;
        done(i18n.fallbackTitle, i18n.fallbackText);
      }
    });
  }
  onScroll();
})();
