(function () {
  var FROM_KEY = "chubuFrom";
  var CLOSED_KEY = "chubuStickyClosed";
  var INTERNAL = { "chubutripnotes.com": 1, "www.chubutripnotes.com": 1 };
  var ALLOWED = {
    "sakuramobile.jp": 1,
    "www.sakuramobile.jp": 1,
    "japan-wireless.com": 1,
    "www.japan-wireless.com": 1,
    "getyourguide.com": 1,
    "www.getyourguide.com": 1,
    "viator.com": 1,
    "www.viator.com": 1,
    "japan-bus-tickets.com": 1,
    "www.japan-bus-tickets.com": 1,
    "airport-taxi.tokyo": 1,
    "www.airport-taxi.tokyo": 1
  };

  function clean(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
  }

  function storageGet(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  function pageSlug() {
    var parts = location.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "home";
  }

  function relTokens(el) {
    return (el.getAttribute("rel") || "").toLowerCase().split(/\s+/);
  }

  function isSponsored(el) {
    return relTokens(el).indexOf("sponsored") !== -1;
  }

  function allowedHost(hostname) {
    var host = String(hostname || "").toLowerCase();
    if (!host || host === "tpx.lv" || host.slice(-7) === ".tpx.lv") return false;
    if (host.indexOf("klook") !== -1 || host.indexOf("kkday") !== -1) return false;
    return !!ALLOWED[host];
  }

  function isInternal(hostname) {
    var host = String(hostname || "").toLowerCase();
    return host === location.hostname || !!INTERNAL[host];
  }

  var params = new URLSearchParams(location.search);
  var from = clean(params.get("from"));
  if (from) storageSet(FROM_KEY, from);
  else from = clean(storageGet(FROM_KEY));

  function writeHref(anchor, url, original) {
    if (/^https?:\/\//i.test(original)) anchor.setAttribute("href", url.toString());
    else anchor.setAttribute("href", url.pathname + url.search + url.hash);
  }

  function decorateSponsored(anchor) {
    if (!from || !isSponsored(anchor)) return;
    var original = anchor.getAttribute("href");
    if (!original || original.indexOf("rfsn=") !== -1) return;
    var url;
    try { url = new URL(original, location.href); } catch (e) { return; }
    if (url.searchParams.has("rfsn") || !allowedHost(url.hostname)) return;
    url.searchParams.set("utm_source", from);
    url.searchParams.set("utm_content", pageSlug());
    writeHref(anchor, url, original);
  }

  function carryFrom(anchor) {
    if (!from || isSponsored(anchor)) return;
    var original = anchor.getAttribute("href");
    if (!original || original.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(original)) return;
    var url;
    try { url = new URL(original, location.href); } catch (e) { return; }
    if (!isInternal(url.hostname)) return;
    if (url.searchParams.get("from") === from) return;
    url.searchParams.set("from", from);
    writeHref(anchor, url, original);
  }

  function primaryCard() {
    var cards = document.querySelectorAll("a.card");
    for (var i = 0; i < cards.length; i++) {
      if (isSponsored(cards[i])) return cards[i];
    }
    return null;
  }

  function injectStyles() {
    if (document.getElementById("chubu-cta-css")) return;
    var style = document.createElement("style");
    style.id = "chubu-cta-css";
    style.textContent = [
      ".sticky-cta{display:none;position:fixed;z-index:30;left:0;right:0;bottom:0;align-items:center;gap:.5rem;",
      "padding:.6rem .75rem calc(.6rem + env(safe-area-inset-bottom));background:var(--card,#fffdf8);",
      "border-top:1px solid var(--line,#d9d0c3);box-shadow:0 -8px 18px rgba(28,25,21,.08);",
      "font-family:Georgia,'Times New Roman',serif;}",
      ".sticky-cta-link{flex:1;min-width:0;display:flex;align-items:baseline;gap:.45rem;color:var(--accent,#8b3a2a);",
      "text-decoration:none;font-size:.98rem;line-height:1.3;}",
      ".sticky-ad{flex:none;font-size:.72rem;letter-spacing:.04em;color:var(--muted,#5c564c);}",
      ".sticky-label{min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
      ".sticky-close{flex:none;width:2.75rem;height:2.75rem;border:1px solid var(--line,#d9d0c3);border-radius:8px;",
      "background:var(--bg,#f6f1e8);color:var(--ink,#1c1915);font:1.25rem Georgia,'Times New Roman',serif;line-height:1;cursor:pointer;}",
      "@media (max-width:47.99rem){.sticky-cta{display:flex}html.has-sticky-cta body{padding-bottom:calc(6.5rem + env(safe-area-inset-bottom))}}",
      "@media (min-width:48rem){.sticky-cta{display:none !important}}",
      "@media print{.sticky-cta{display:none !important}html.has-sticky-cta body{padding-bottom:0}}"
    ].join("");
    document.head.appendChild(style);
  }

  function buildBar(card) {
    if (!card || storageGet(CLOSED_KEY) === "1") return;
    var titleEl = card.querySelector("strong");
    var title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "Compare";
    var bar = document.createElement("div");
    bar.className = "sticky-cta";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Sponsored booking");
    var link = document.createElement("a");
    link.className = "sticky-cta-link";
    link.setAttribute("data-chubu-sticky", "1");
    link.rel = "sponsored nofollow noopener";
    link.target = "_blank";
    link.href = card.getAttribute("href");
    var ad = document.createElement("span");
    ad.className = "sticky-ad";
    ad.textContent = "#ad";
    var label = document.createElement("span");
    label.className = "sticky-label";
    label.textContent = title;
    link.appendChild(ad);
    link.appendChild(label);
    var close = document.createElement("button");
    close.type = "button";
    close.className = "sticky-close";
    close.setAttribute("aria-label", "Close");
    close.textContent = "\u00d7";
    close.addEventListener("click", function () {
      storageSet(CLOSED_KEY, "1");
      bar.parentNode.removeChild(bar);
      document.documentElement.classList.remove("has-sticky-cta");
    });
    bar.appendChild(link);
    bar.appendChild(close);
    document.body.appendChild(bar);
    document.documentElement.classList.add("has-sticky-cta");
    decorateSponsored(link);
  }

  function init() {
    var anchors = document.querySelectorAll("a[href]");
    for (var i = 0; i < anchors.length; i++) {
      decorateSponsored(anchors[i]);
      carryFrom(anchors[i]);
    }
    injectStyles();
    buildBar(primaryCard());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
