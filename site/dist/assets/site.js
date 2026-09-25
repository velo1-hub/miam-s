// Miam's: small progressive enhancements. The site works without JS.
(function () {
  var html = document.documentElement;
  var lang = html.lang.slice(0, 2);

  // Mobile nav
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Open now + highlight today's hours (Montréal time)
  var hoursEl = document.querySelector("[data-hours]");
  if (hoursEl) {
    try {
      var hours = JSON.parse(hoursEl.getAttribute("data-hours"));
      var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
      var day = get("weekday"), now = get("hour").replace("24", "00") + ":" + get("minute");
      var today = hours.find(function (h) { return h.days.indexOf(day) > -1; });
      document.querySelectorAll('.hours tr[data-day="' + day + '"]').forEach(function (tr) { tr.classList.add("today"); });
      var openEl = document.querySelector(".open-now");
      if (openEl) {
        var isOpen = today && now >= today.opens && now < today.closes;
        var fmt = function (t) { return lang === "fr" ? t.replace(":", " h ").replace(" h 00", " h") : t; };
        openEl.textContent = isOpen
          ? (lang === "fr" ? "Ouvert maintenant · jusqu'à " + fmt(today.closes) : "Open now · until " + fmt(today.closes))
          : (lang === "fr" ? "Fermé en ce moment" : "Closed right now");
        openEl.classList.toggle("closed", !isOpen);
        openEl.hidden = false;
      }
    } catch (e) { /* hours stay static */ }
  }

  // Consent (Law 25): analytics only after an explicit "Accept".
  var KEY = "miams-consent";
  var banner = document.querySelector(".consent");
  var gtm = html.getAttribute("data-gtm");
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGTM() {
    if (!gtm || window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtm);
    document.head.appendChild(s);
  }
  if (banner && gtm) {
    var c = stored();
    if (c === "yes") loadGTM();
    else if (c !== "no") banner.classList.add("show");
    banner.addEventListener("click", function (e) {
      var v = e.target.getAttribute("data-consent");
      if (!v) return;
      store(v);
      banner.classList.remove("show");
      if (v === "yes") loadGTM();
    });
  }

  // Conversion events for GA4 / Meta via GTM (only fire if GTM loaded after consent)
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-event]");
    if (a && window.dataLayer) window.dataLayer.push({ event: a.getAttribute("data-event"), link_url: a.href || "" });
  });
})();
