// Digital / QR menu: search, dietary filters, allergen exclusion, sticky category nav.
// Items are rendered server-side (works without JS, indexable); this script only filters.
(function () {
  var root = document.querySelector("[data-menu]");
  if (!root) return;
  var lang = document.documentElement.lang.slice(0, 2);
  var items = Array.prototype.slice.call(root.querySelectorAll(".menu-item"));
  var cats = Array.prototype.slice.call(root.querySelectorAll(".menu-cat"));
  var search = root.querySelector(".menu-search");
  var empty = root.querySelector(".menu-empty");
  var state = { q: "", diet: "", without: {} };

  var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  function apply() {
    var shown = 0;
    items.forEach(function (li) {
      var tags = li.getAttribute("data-tags").split(" ");
      var alg = li.getAttribute("data-allergens").split(" ");
      var ok = true;
      if (state.q && norm(li.textContent).indexOf(state.q) === -1) ok = false;
      if (state.diet === "vegetarian" && tags.indexOf("vegetarian") === -1 && tags.indexOf("vegan") === -1) ok = false;
      else if (state.diet && state.diet !== "vegetarian" && tags.indexOf(state.diet) === -1) ok = false;
      for (var a in state.without) if (state.without[a] && alg.indexOf(a) > -1) ok = false;
      li.hidden = !ok;
      if (ok) shown++;
    });
    cats.forEach(function (c) { c.hidden = !c.querySelector(".menu-item:not([hidden])"); });
    if (empty) empty.hidden = shown > 0;
    if (window.dataLayer && (state.q || state.diet)) window.dataLayer.push({ event: "menu_filter", q: state.q, diet: state.diet });
  }

  if (search) search.addEventListener("input", function () { state.q = norm(search.value.trim()); apply(); });

  root.querySelectorAll("[data-diet]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = b.getAttribute("data-diet");
      state.diet = state.diet === d ? "" : d;
      root.querySelectorAll("[data-diet]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-diet") === state.diet ? "true" : "false"); });
      apply();
    });
  });
  root.querySelectorAll("[data-without]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-without");
      state.without[a] = !state.without[a];
      b.setAttribute("aria-pressed", state.without[a] ? "true" : "false");
      apply();
    });
  });

  // Highlight current category in the sticky nav
  var links = root.querySelectorAll(".cat-nav a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) {
          var on = l.getAttribute("href") === "#" + en.target.id;
          l.classList.toggle("active", on);
          if (on && l.scrollIntoView) l.parentNode.scrollLeft = l.offsetLeft - 16;
        });
      });
    }, { rootMargin: "-200px 0px -60% 0px" });
    cats.forEach(function (c) { io.observe(c); });
  }

  // QR placement tracking: ?src=table-12 etc. is forwarded to analytics (after consent).
  var src = new URLSearchParams(location.search).get("utm_content");
  if (src && window.dataLayer) window.dataLayer.push({ event: "qr_scan", placement: src, lang: lang });
})();
