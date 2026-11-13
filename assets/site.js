/* Aluprime site logic: launch mode, WhatsApp links, catalogue, size check,
   tracking. Reads ALUPRIME_CONFIG (config.js) and ALUPRIME_PRODUCTS (products.js).
   Designed so payments and live inventory can be added later: every product
   action goes through `actions` below. */
(function () {
  "use strict";
  var C = window.ALUPRIME_CONFIG || {};
  var P = window.ALUPRIME_PRODUCTS || [];
  var T = window.ALUPRIME_TYPES || {};
  var body = document.body;
  var ROOT = body.getAttribute("data-root") || "";
  var PAGE = body.getAttribute("data-page") || "";

  /* ---------- small helpers ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } return null; }
  function naira(n) { return "₦" + Math.round(n).toLocaleString("en-NG"); }
  function num(v) { var n = parseInt(String(v || "").replace(/[^\d]/g, ""), 10); return isNaN(n) ? null : n; }
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30); }

  /* ---------- launch mode ---------- */
  function mode() {
    if (C.prototypeTools) { var o = store("alp_mode"); if (o === "live" || o === "prelaunch") return o; }
    return C.mode === "live" ? "live" : "prelaunch";
  }
  var LIVE = mode() === "live";

  /* ---------- traffic source ---------- */
  function detectSource() {
    var src = null;
    try { var q = new URLSearchParams(location.search); src = q.get("src") || q.get("utm_source"); } catch (e) {}
    var h = location.hash.replace("#", "");
    if (!src && h.indexOf("src-") === 0) src = h.slice(4);
    if (!src && PAGE === "whatsapp" && h && C.sources && C.sources[h]) src = h;
    src = slug(src);
    if (src) { store("alp_src", src); return src; }
    return store("alp_src") || C.defaultSource || "website";
  }
  var SOURCE = detectSource();

  /* ---------- tracking ---------- */
  window.dataLayer = window.dataLayer || [];
  function loadAnalytics() {
    var a = C.analytics || {};
    if (a.ga4MeasurementId) {
      var s = document.createElement("script"); s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(a.ga4MeasurementId);
      document.head.appendChild(s);
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date()); window.gtag("config", a.ga4MeasurementId, { campaign_source: SOURCE });
    }
    if (a.metaPixelId) {
      (function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", a.metaPixelId); window.fbq("track", "PageView");
    }
  }
  function track(name, params) {
    var ev = { event: name, source: SOURCE, mode: mode(), page: PAGE };
    for (var k in (params || {})) ev[k] = params[k];
    ev.time = new Date().toISOString();
    window.dataLayer.push(ev);
    if (typeof window.gtag === "function") {
      window.gtag("event", name, ev);
      if (name === "whatsapp_click") window.gtag("event", "generate_lead", { source: SOURCE, placement: ev.placement, product_code: ev.product_code || "" });
    }
    if (typeof window.fbq === "function") {
      if (name === "whatsapp_click") window.fbq("track", "Contact", { content_name: ev.product_code || ev.placement });
      if (name === "product_view") window.fbq("track", "ViewContent", { content_ids: [ev.product_code] });
    }
    if ((C.analytics || {}).logToConsole && window.console) console.log("[aluprime]", ev);
    try { var log = JSON.parse(store("alp_log") || "[]"); log.unshift(ev); store("alp_log", JSON.stringify(log.slice(0, 40))); } catch (e) {}
    renderPanel();
  }

  /* ---------- WhatsApp links and messages ---------- */
  function waUrl(text) {
    var digits = String(C.whatsappNumber || "").replace(/\D/g, "");
    var base = "https://wa.me/" + digits;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }
  function withRef(text, placement) { return text + "\n\nRef: " + SOURCE + (placement ? " / " + placement : ""); }
  function dims(p) { return p.frameWidthMm + " × " + p.frameHeightMm + " mm"; }
  function fulfilWords(f) {
    if (f === "pickup") return "factory pickup";
    if (f === "delivery") return "Lagos delivery";
    return "";
  }
  var msg = {
    general: function () {
      return LIVE ? "Hello Aluprime. I'd like to ask about your ready-made aluminium windows."
                  : "Hello Aluprime. I'd like to register my interest in your ready-made aluminium windows. Please tell me when you launch.";
    },
    product: function (name, code, size, qty, fulfil) {
      var q = qty && qty > 0 ? qty : 1;
      var pref = fulfilWords(fulfil);
      var what = (code ? name + " (" + code + ")" : name) + ", " + size;
      if (!LIVE) {
        return "Hello Aluprime. I'd like to register my interest in " + what + ". I would need " + q + " window(s)" +
          (pref ? " and would prefer " + pref : "") + ". Please let me know when you launch, with price and availability.";
      }
      return "Hello Aluprime. I'm interested in " + what + ". I need " + q + " window(s). " +
        (pref ? "I prefer " + pref + ". " : "I haven't decided between factory pickup and Lagos delivery yet. ") +
        "Please confirm availability, total price, and the earliest collection or delivery date.";
    },
    sizeHelp: function (w, h, q, loc) {
      return "Hello Aluprime. Please help me check my window measurements" + (LIVE ? "." : " (registering interest before launch).") +
        "\nOpening width: " + (w ? w + " mm" : "not sure yet") +
        "\nOpening height: " + (h ? h + " mm" : "not sure yet") +
        "\nNumber of windows: " + (q || "not sure yet") +
        "\nProject location: " + (loc || "not given") +
        "\nI will send photos of the openings in this chat.";
    },
    fulfil: function (how, area, date, ref) {
      var lines = ["Hello Aluprime. I want to arrange " + (how === "delivery" ? "delivery within Lagos" : "factory pickup") + (LIVE ? "." : " when you launch.")];
      if (how === "delivery") lines.push("Delivery area or address in Lagos: " + (area || "to be confirmed"));
      lines.push("Preferred date: " + (date || "as soon as possible"));
      if (ref) lines.push("Order or enquiry reference: " + ref);
      lines.push("Please confirm the next steps.");
      return lines.join("\n");
    }
  };
  /* Central place for product actions. Later: swap enquire() for addToCart()/checkout(). */
  var actions = {
    enquireUrl: function (p, qty, fulfil, placement) {
      return waUrl(withRef(msg.product(p.name, p.code, dims(p), qty, fulfil), placement));
    }
  };

  /* ---------- labels ---------- */
  function ctaText(kind) {
    if (!LIVE) return "Register your interest on WhatsApp";
    return { chat: "Chat on WhatsApp", enquire: "Enquire on WhatsApp", open: "Open WhatsApp", go: "Continue to WhatsApp" }[kind] || "Chat on WhatsApp";
  }
  var ICON = '<svg class="wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3C6.9 3 3 6.6 3 11.2c0 2.4 1.1 4.5 2.9 6L5 21l4.1-1.7c.9.3 1.9.4 2.9.4 5.1 0 9-3.6 9-8.3S17.1 3 12 3zm-4 9.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>';
  function setCta(a) {
    a.innerHTML = ICON + "<span>" + esc(ctaText(a.getAttribute("data-cta"))) + "</span>";
  }
  function statusHtml(p) {
    var out = [];
    if (p.price) out.push('<div class="price">' + naira(p.price) + ' <span class="small muted">VAT incl.</span></div>');
    if (!LIVE) {
      out.push('<div class="status"><span class="pill">Launching 2027</span>' + (p.price ? "Launch price, to be confirmed on WhatsApp" : "Price to be confirmed at launch") + "</div>");
      return out.join("");
    }
    var label = { in_stock: "In stock", made_to_order: "Made to order", preorder: "Batch pre-order" }[p.stock];
    if (label) out.push('<div class="status"><span class="pill">' + label + "</span>" + esc(p.readyText || "") + "</div>");
    if (!p.price || !label) out.push('<div class="status muted">Confirm price and availability on WhatsApp</div>');
    return out.join("");
  }

  /* ---------- scale drawing used until real photos are added ---------- */
  function drawing(p) {
    var W = p.frameWidthMm, H = p.frameHeightMm;
    var box = 260, s = box / Math.max(W, H), w = W * s, h = H * s;
    var x = 60 + (box - w) / 2, y = 20 + (box - h) / 2, f = 10;
    var g = [];
    var frame = 'style="fill:var(--frame)"', glass = 'style="fill:var(--glass)"', line = 'style="stroke:var(--frame);fill:none"';
    g.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" ' + frame + "/>");
    if (p.type === "sliding") {
      var half = (w - 2 * f) / 2 + 4;
      g.push('<rect x="' + (x + f) + '" y="' + (y + f) + '" width="' + half + '" height="' + (h - 2 * f) + '" ' + glass + ' rx="1"/>');
      g.push('<rect x="' + (x + w - f - half) + '" y="' + (y + f) + '" width="' + half + '" height="' + (h - 2 * f) + '" ' + glass + ' rx="1"/>');
      g.push('<line x1="' + (x + w / 2) + '" y1="' + (y + f) + '" x2="' + (x + w / 2) + '" y2="' + (y + h - f) + '" style="stroke:var(--frame);stroke-width:4"/>');
      var ay = y + h / 2;
      g.push('<path d="M' + (x + w / 4 - 14) + " " + ay + " h28 m-6 -5 l6 5 l-6 5 M" + (x + 3 * w / 4 + 14) + " " + ay + ' h-28 m6 -5 l-6 5 l6 5" ' + line + ' stroke-width="2"/>');
    } else {
      g.push('<rect x="' + (x + f) + '" y="' + (y + f) + '" width="' + (w - 2 * f) + '" height="' + (h - 2 * f) + '" ' + glass + "/>");
      var d = p.type === "projected"
        ? "M" + (x + f) + " " + (y + h - f) + " L" + (x + w / 2) + " " + (y + f) + " L" + (x + w - f) + " " + (y + h - f)
        : "M" + (x + w - f) + " " + (y + f) + " L" + (x + f) + " " + (y + h / 2) + " L" + (x + w - f) + " " + (y + h - f);
      g.push('<path d="' + d + '" ' + line + ' stroke-width="1.5" stroke-dasharray="6 4"/>');
    }
    var ty = y + h + 22, tx = x - 22, t = 'style="fill:var(--muted)" font-size="13" font-family="system-ui,sans-serif"';
    g.push('<path d="M' + x + " " + (ty - 8) + " h" + w + " M" + x + " " + (ty - 13) + " v10 M" + (x + w) + " " + (ty - 13) + ' v10" style="stroke:var(--muted)"/>');
    g.push("<text " + t + ' x="' + (x + w / 2) + '" y="' + (ty + 8) + '" text-anchor="middle">' + W + " mm</text>");
    g.push('<path d="M' + (tx + 8) + " " + y + " v" + h + " M" + (tx + 3) + " " + y + " h10 M" + (tx + 3) + " " + (y + h) + ' h10" style="stroke:var(--muted)"/>');
    g.push("<text " + t + ' x="' + tx + '" y="' + (y + h / 2) + '" text-anchor="middle" transform="rotate(-90 ' + tx + " " + (y + h / 2) + ')">' + H + " mm</text>");
    return '<svg viewBox="0 0 380 330" role="img" aria-label="Scale drawing of ' + esc(p.name) + ", frame " + W + " by " + H + ' millimetres">' + g.join("") + "</svg>";
  }
  function media(p) {
    var inner = p.image
      ? '<img src="' + esc(ROOT + p.image) + '" alt="' + esc(p.imageAlt || p.name) + '" loading="lazy" decoding="async" width="800" height="600">'
      : drawing(p);
    var tag = p.sample ? '<span class="tag-sample">' + (p.image ? "Sample product" : "Sample drawing · photo to come") + "</span>" : "";
    return '<div class="card-media">' + tag + inner + "</div>";
  }
  function card(p, placement) {
    return '<article class="card"><a href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '" tabindex="-1" aria-hidden="true">' + media(p) + "</a>" +
      '<div class="card-body"><div class="code">' + esc(p.code) + " · " + esc(T[p.type] || p.type) + "</div>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<div class="dims">Frame ' + dims(p) + "</div>" +
      '<div class="small muted">' + esc(p.openingStyle) + "</div>" + statusHtml(p) +
      '<div class="card-actions"><a class="btn btn-outline" href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '">View details</a>' +
      '<a class="btn btn-wa" data-cta="enquire" data-track-wa data-placement="' + placement + '" data-product="' + esc(p.code) + '" href="' + actions.enquireUrl(p, 1, "", placement) + '"></a></div>' +
      "</div></article>";
  }

  /* ---------- fit rule ---------- */
  var FIT = C.fit || { minGapMm: 10, maxGapMm: 40 };
  function fits(p, ow, oh) {
    var gw = ow - p.frameWidthMm, gh = oh - p.frameHeightMm;
    return gw >= FIT.minGapMm && gw <= FIT.maxGapMm && gh >= FIT.minGapMm && gh <= FIT.maxGapMm;
  }
  function openingRange(p) {
    return (p.frameWidthMm + FIT.minGapMm) + "–" + (p.frameWidthMm + FIT.maxGapMm) + " mm wide × " +
      (p.frameHeightMm + FIT.minGapMm) + "–" + (p.frameHeightMm + FIT.maxGapMm) + " mm high";
  }

  /* ---------- shared page chrome ---------- */
  function applyChrome() {
    var lb = $("#launch-bar");
    if (lb) { lb.hidden = LIVE; var t = $("[data-copy='launchNotice']", lb); if (t) t.textContent = C.launchNotice || ""; }
    $$("[data-show='live']").forEach(function (el) { el.hidden = !LIVE; });
    $$("[data-show='prelaunch']").forEach(function (el) { el.hidden = LIVE; });
    $$("[data-copy]").forEach(function (el) {
      var k = el.getAttribute("data-copy"), f = C.fulfilment || {};
      if (k === "pickup" || k === "delivery" || k === "onward") el.textContent = f[k] || "";
    });
    var fa = C.factory || {};
    $$("[data-factory]").forEach(function (el) {
      el.textContent = fa.address ? fa.address + (fa.pickupHours ? ". Pickup hours: " + fa.pickupHours + "." : "") : "We share the factory address and pickup time on WhatsApp when your order is confirmed.";
    });
    $$("a[data-wa]").forEach(function (a) {
      var kind = a.getAttribute("data-wa"), pl = a.getAttribute("data-placement") || kind;
      a.href = waUrl(withRef(kind === "own" ? "Hello Aluprime." : msg.general(), pl));
      a.setAttribute("data-track-wa", "");
    });
    $$("a[data-cta]").forEach(setCta);
    $$("[data-cta-text]").forEach(function (el) { el.textContent = ctaText(el.getAttribute("data-cta-text")); });
    if (C.prototypeTools) {
      var pb = $("#proto-bar"); if (pb) pb.hidden = false;
      var nf = $("#proto-number"); if (nf) nf.textContent = C.whatsappNumber ? "WhatsApp number set." : "WhatsApp number not connected yet: WhatsApp will ask you to pick a contact.";
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-track-wa]");
    if (!a) return;
    track("whatsapp_click", { placement: a.getAttribute("data-placement") || "", product_code: a.getAttribute("data-product") || "", link: a.href });
  });

  /* ---------- prototype test panel ---------- */
  function renderPanel() {
    var panel = $("#test-panel"); if (!panel || panel.hidden) return;
    var log = []; try { log = JSON.parse(store("alp_log") || "[]"); } catch (e) {}
    var opts = Object.keys(C.sources || {}).map(function (k) { return '<option value="' + k + '"' + (k === SOURCE ? " selected" : "") + ">" + esc(C.sources[k]) + " (" + k + ")</option>"; }).join("");
    panel.innerHTML = '<strong>Prototype test panel</strong>' +
      '<div>Mode: <b>' + (LIVE ? "Live" : "Pre-launch") + '</b></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-outline" data-set-mode="prelaunch">Pre-launch</button><button type="button" class="btn btn-outline" data-set-mode="live">Live</button></div>' +
      '<div class="field"><label for="tp-src">Simulate traffic source</label><select id="tp-src">' + opts + "</select></div>" +
      "<div><b>Tracked events</b> (newest first)</div><ol>" + (log.length ? log.map(function (ev) {
        return "<li>" + esc(ev.event) + " · src=" + esc(ev.source) + (ev.placement ? " · " + esc(ev.placement) : "") + (ev.product_code ? " · " + esc(ev.product_code) : "") + (ev.filter ? " · " + esc(ev.filter) : "") + "</li>";
      }).join("") : "<li>No events yet</li>") + "</ol>" +
      '<button type="button" class="btn btn-outline" data-clear-log>Clear log</button>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.id === "proto-toggle") { var p = $("#test-panel"); p.hidden = !p.hidden; b.setAttribute("aria-expanded", String(!p.hidden)); renderPanel(); }
    if (b.hasAttribute("data-set-mode")) { store("alp_mode", b.getAttribute("data-set-mode")); location.reload(); }
    if (b.hasAttribute("data-clear-log")) { store("alp_log", null); renderPanel(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "tp-src") { store("alp_src", e.target.value); location.reload(); }
  });

  /* ---------- home ---------- */
  function initHome() {
    var f = $("#featured"); if (f) f.innerHTML = P.slice(0, 3).map(function (p) { return card(p, "home-featured"); }).join("");
    initRing();
    initHomeFit();
  }

  /* ---------- best match for an opening ---------- */
  function bestFor(ow, oh) {
    var hits = P.filter(function (p) { return fits(p, ow, oh); });
    hits.sort(function (a, b) { return (b.frameWidthMm * b.frameHeightMm) - (a.frameWidthMm * a.frameHeightMm); });
    if (hits.length) return { p: hits[0], hits: hits, ok: true };
    var mid = (FIT.minGapMm + FIT.maxGapMm) / 2, near = null, nd = Infinity;
    P.forEach(function (p) { var d = Math.abs(ow - p.frameWidthMm - mid) + Math.abs(oh - p.frameHeightMm - mid); if (d < nd) { nd = d; near = p; } });
    return { p: near, hits: [], ok: false };
  }
  /* Live drawing: the wall opening (dashed) with a frame placed inside it. */
  function fitSvg(ow, oh, p, ok) {
    var VW = 540, VH = 400, s = Math.min(460 / 2100, 320 / 1550);
    var w = ow * s, h = oh * s, x = (VW - w) / 2, y = (VH - h) / 2 - 6;
    var g = ['<defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" style="fill:var(--surface)"/><line x1="0" y1="0" x2="0" y2="10" style="stroke:var(--line)" stroke-width="3"/></pattern></defs>',
      '<rect x="0" y="0" width="' + VW + '" height="' + VH + '" fill="url(#hatch)"/>',
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" style="fill:var(--card);stroke:var(--muted)" stroke-dasharray="6 5" stroke-width="1.5"/>'];
    if (p) {
      var fw = p.frameWidthMm * s, fh = p.frameHeightMm * s, fx = (VW - fw) / 2, fy = y + (h - fh) / 2, b = 6;
      var col = ok ? "var(--frame)" : "#b3261e";
      g.push('<g style="transition:all .3s">');
      g.push('<rect x="' + fx + '" y="' + fy + '" width="' + fw + '" height="' + fh + '" style="fill:' + col + '" opacity="' + (ok ? 1 : .85) + '"/>');
      if (p.type === "sliding") {
        var half = (fw - 2 * b) / 2;
        g.push('<rect x="' + (fx + b) + '" y="' + (fy + b) + '" width="' + (half - 2) + '" height="' + (fh - 2 * b) + '" style="fill:var(--glass)"/>');
        g.push('<rect x="' + (fx + b + half + 2) + '" y="' + (fy + b) + '" width="' + (half - 2) + '" height="' + (fh - 2 * b) + '" style="fill:var(--glass)"/>');
      } else {
        g.push('<rect x="' + (fx + b) + '" y="' + (fy + b) + '" width="' + (fw - 2 * b) + '" height="' + (fh - 2 * b) + '" style="fill:var(--glass)"/>');
      }
      g.push('</g>');
      var t = 'font-family="ui-monospace,Menlo,monospace" font-size="12" style="fill:var(--ink)"';
      if (ok) {
        var gw = ow - p.frameWidthMm, gh = oh - p.frameHeightMm;
        g.push('<text ' + t + ' x="' + (VW / 2) + '" y="' + (fy + fh / 2 + 4) + '" text-anchor="middle">' + esc(p.code) + '</text>');
        g.push('<text ' + t + ' x="' + (VW / 2) + '" y="' + (y - 8) + '" text-anchor="middle" style="fill:var(--muted)">gap ' + gw + ' × ' + gh + ' mm</text>');
      }
    }
    var m = 'font-family="ui-monospace,Menlo,monospace" font-size="12" style="fill:var(--muted)"';
    g.push('<path d="M' + x + " " + (y + h + 16) + " h" + w + " M" + x + " " + (y + h + 11) + " v10 M" + (x + w) + " " + (y + h + 11) + ' v10" style="stroke:var(--muted)"/>');
    g.push('<text ' + m + ' x="' + (VW / 2) + '" y="' + (y + h + 32) + '" text-anchor="middle">opening ' + ow + ' mm</text>');
    g.push('<text ' + m + ' x="' + (x - 14) + '" y="' + (y + h / 2) + '" text-anchor="middle" transform="rotate(-90 ' + (x - 14) + " " + (y + h / 2) + ')">' + oh + ' mm</text>');
    return '<svg viewBox="0 0 ' + VW + " " + VH + '" role="img" aria-label="Drawing of a ' + ow + " by " + oh + ' millimetre opening' + (p ? " with window " + esc(p.code) : "") + '">' + g.join("") + "</svg>";
  }
  function verdictHtml(ow, oh, r) {
    if (r.ok) {
      return '<div class="fit-verdict ok"><span class="dot"></span><span>' + r.hits.length + " window" + (r.hits.length > 1 ? "s" : "") + " may fit this opening. Closest: " + esc(r.p.name) + " (" + esc(r.p.code) + ").</span></div>";
    }
    var p = r.p, tips = [];
    var gw = ow - p.frameWidthMm, gh = oh - p.frameHeightMm;
    if (gw < FIT.minGapMm) tips.push((FIT.minGapMm - gw) + " mm too narrow");
    if (gw > FIT.maxGapMm) tips.push((gw - FIT.maxGapMm) + " mm too wide");
    if (gh < FIT.minGapMm) tips.push((FIT.minGapMm - gh) + " mm too short");
    if (gh > FIT.maxGapMm) tips.push((gh - FIT.maxGapMm) + " mm too tall");
    return '<div class="fit-verdict"><span class="dot"></span><span>No standard window fits yet. Nearest is ' + esc(p.code) + ", but the opening is " + tips.join(" and ") + ". Ask us on WhatsApp: we can advise on the opening, or Brand Aluminium can make one to size.</span></div>";
  }
  function initHomeFit() {
    var root = $("#home-fit"); if (!root) return;
    var rw = $("#hf-w-r"), nw = $("#hf-w"), rh = $("#hf-h-r"), nh = $("#hf-h");
    var view = $("#hf-svg"), verdict = $("#hf-verdict"), list = $("#hf-matches"), btn = $("#hf-btn");
    var tracked = false;
    function draw() {
      var ow = num(nw.value) || 0, oh = num(nh.value) || 0;
      if (ow < 300 || oh < 300) return;
      var r = bestFor(ow, oh);
      view.innerHTML = fitSvg(ow, oh, r.p, r.ok);
      verdict.innerHTML = verdictHtml(ow, oh, r);
      list.innerHTML = r.hits.map(function (p, i) { return '<a class="' + (i === 0 ? "best" : "") + '" href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '">' + esc(p.code) + " · " + dims(p) + "</a>"; }).join("");
      btn.href = waUrl(withRef(msg.sizeHelp(ow, oh, null, ""), "home-fit"));
    }
    function link(range, box) {
      range.addEventListener("input", function () { box.value = range.value; draw(); });
      box.addEventListener("input", function () { var v = num(box.value); if (v) range.value = v; draw(); });
      range.addEventListener("change", function () { if (!tracked) { tracked = true; track("fit_tool_use", { via: "home" }); } });
    }
    link(rw, nw); link(rh, nh);
    setCta(btn); draw();
  }

  /* ---------- 3D window ring ---------- */
  function initRing() {
    var stage = $("#ring-stage"), ring = $("#ring"); if (!stage || !ring) return;
    var n = P.length, step = 360 / n, angle = 0, vel = 0, dragging = false, lastX = 0, idle = 0, raf = 0;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    ring.innerHTML = P.map(function (p, i) {
      return '<a class="face" href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '" tabindex="-1" aria-hidden="true" data-i="' + i + '">' + drawing(p) +
        '<span><span class="code">' + esc(p.code) + " · " + esc(T[p.type] || p.type) + '</span><br><strong>' + esc(p.name) + '</strong><br><span class="dims">' + dims(p) + "</span></span></a>";
    }).join("");
    var faces = $$(".face", ring), cap = $("#ring-caption"), live = $("#ring-live"), current = -1;
    function size() {
      var fw = Math.min(250, Math.max(180, stage.clientWidth * 0.42));
      ring.style.setProperty("--fw", fw + "px");
      var r = Math.round((fw / 2) / Math.tan(Math.PI / n) + 36);
      faces.forEach(function (f, i) { f.style.transform = "rotateY(" + (i * step) + "deg) translateZ(" + r + "px)"; f.dataset.r = r; });
      ring.dataset.r = r;
    }
    function front() { var i = Math.round(-angle / step) % n; return (i + n) % n; }
    function render() {
      var r = +ring.dataset.r || 300;
      ring.style.transform = "translateZ(" + (-r) + "px) rotateY(" + angle + "deg)";
      faces.forEach(function (f, i) {
        var a = ((i * step + angle) % 360 + 360) % 360, c = Math.cos(a * Math.PI / 180);
        f.style.opacity = (0.25 + 0.75 * Math.max(0, c)).toFixed(3);
      });
      var fi = front();
      if (fi !== current) {
        current = fi; var p = P[fi];
        cap.innerHTML = '<div class="code">' + esc(p.code) + " · " + (fi + 1) + " of " + n + '</div><strong style="font-size:1.2rem">' + esc(p.name) + '</strong><div class="small muted">' + dims(p) + " frame · " + esc(p.useCase) + '</div><a class="btn btn-outline" href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '">View this window</a>';
        if (live) live.textContent = p.name + ", " + dims(p);
      }
    }
    var goal = 0, visible = true, last = 0;
    function snapTarget() { return Math.round(angle / step) * step; }
    function tick(now) {
      raf = 0;
      var dt = last ? Math.min(50, now - last) : 16; last = now;
      if (!dragging) {
        if (Math.abs(vel) > 0.08) { angle += vel; vel *= 0.92; goal = snapTarget(); }
        else {
          vel = 0;
          var d = goal - angle;
          angle = Math.abs(d) > 0.05 ? angle + d * 0.1 : goal;
          if (Math.abs(d) <= 0.05) idle += dt;
          if (!reduce && idle > 3200 && !stage.matches(":hover") && document.activeElement !== stage) { goal -= step; idle = 0; }
        }
      }
      render();
      if (visible && !document.hidden) raf = requestAnimationFrame(tick); else last = 0;
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }
    function go(dir) { idle = 0; vel = 0; goal = Math.round(goal / step) * step - dir * step; start(); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(stage);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
    stage.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; vel = 0; idle = 0; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.35; vel = dx * 0.35; render(); });
    function end() { if (!dragging) return; dragging = false; idle = 0; goal = snapTarget(); start(); }
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
    var moved = 0;
    stage.addEventListener("pointerdown", function () { moved = 0; });
    stage.addEventListener("pointermove", function (e) { if (dragging) moved += Math.abs(e.movementX || 0); });
    stage.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); return; } var a = e.target.closest(".face"); if (a) { e.preventDefault(); location.href = a.href; } });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "Enter") { location.href = faces[front()].href; }
    });
    $("#ring-prev").addEventListener("click", function () { go(-1); });
    $("#ring-next").addEventListener("click", function () { go(1); });
    window.addEventListener("resize", function () { size(); render(); });
    size(); render(); start();
  }

  /* ---------- catalogue ---------- */
  var DOC_TITLE = document.title;
  function initCatalogue() {
    var state = { type: "all", size: "all" };
    try { var saved = JSON.parse(store("alp_filters") || "null"); if (saved) state = saved; } catch (e) {}
    var types = []; P.forEach(function (p) { if (types.indexOf(p.type) < 0) types.push(p.type); });
    var sizes = []; P.forEach(function (p) { var k = p.frameWidthMm + "x" + p.frameHeightMm; if (sizes.indexOf(k) < 0) sizes.push(k); });
    sizes.sort(function (a, b) { var A = a.split("x").map(Number), B = b.split("x").map(Number); return A[0] - B[0] || A[1] - B[1]; });
    var chips = $("#type-chips");
    chips.innerHTML = '<legend>Window type</legend>' + ["all"].concat(types).map(function (t) {
      return '<label class="chip"><input type="radio" name="type" value="' + t + '"' + (state.type === t ? " checked" : "") + "><span>" + esc(t === "all" ? "All types" : (T[t] || t)) + "</span></label>";
    }).join("");
    var sel = $("#size-select");
    sel.innerHTML = '<option value="all">All sizes</option>' + sizes.map(function (k) {
      var a = k.split("x"); return '<option value="' + k + '"' + (state.size === k ? " selected" : "") + ">" + a[0] + " × " + a[1] + " mm (frame)</option>";
    }).join("");
    function list() {
      var items = P.filter(function (p) {
        return (state.type === "all" || p.type === state.type) && (state.size === "all" || (p.frameWidthMm + "x" + p.frameHeightMm) === state.size);
      });
      $("#count").textContent = "Showing " + items.length + " of " + P.length + " windows";
      $("#grid").innerHTML = items.length ? items.map(function (p) { return card(p, "catalogue-card"); }).join("")
        : '<div class="empty"><p>No window matches both filters.</p><p><button type="button" class="btn btn-outline" id="reset">Show all windows</button></p></div>';
      $$("#grid a[data-cta]").forEach(setCta);
    }
    function change(source) {
      state.type = ($("input[name='type']:checked") || {}).value || "all";
      state.size = sel.value;
      store("alp_filters", JSON.stringify(state));
      list();
      track("filter_change", { filter: "type=" + state.type + ", size=" + state.size, via: source });
    }
    chips.addEventListener("change", function () { change("type"); });
    sel.addEventListener("change", function () { change("size"); });
    document.addEventListener("click", function (e) { if (e.target.id === "reset") { state = { type: "all", size: "all" }; $("input[name='type'][value='all']").checked = true; sel.value = "all"; store("alp_filters", JSON.stringify(state)); list(); } });

    function route() {
      var code = location.hash.replace("#", "").toUpperCase();
      var p = P.filter(function (x) { return x.code === code; })[0];
      $("#catalogue-view").hidden = !!p;
      $("#detail-view").hidden = !p;
      if (p) { renderDetail(p); window.scrollTo(0, 0); track("product_view", { product_code: p.code }); }
      else {
        list();
        var cr = $("#crumb-current"); if (cr) { cr.textContent = "Windows"; cr.setAttribute("aria-current", "page"); }
        var c3 = $("#crumb-product"); if (c3) c3.hidden = true;
        var ph = $("#page-hero"); if (ph) ph.classList.remove("compact");
        document.title = DOC_TITLE;
      }
    }
    window.addEventListener("hashchange", route);
    route();
    track("catalogue_view", {});
  }
  function carousel(cur) {
    var others = P.filter(function (x) { return x.code !== cur.code; });
    return '<section class="carousel" aria-labelledby="more-h" style="padding:0"><div class="carousel-head"><h2 id="more-h" style="font-size:1.5rem">Other windows</h2>' +
      '<div class="carousel-nav"><button type="button" data-scroll="-1" aria-label="Previous windows">&#8592;</button><button type="button" data-scroll="1" aria-label="Next windows">&#8594;</button></div></div>' +
      '<div class="track" id="track">' + others.map(function (p) {
        return '<a class="mini" href="#' + p.code.toLowerCase() + '">' + media(p) + '<div><span class="code">' + esc(p.code) + '</span><strong>' + esc(p.name) + '</strong><span class="small muted">' + dims(p) + "</span></div></a>";
      }).join("") + "</div></section>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-scroll]"); if (!b) return;
    var t = $("#track"); if (t) t.scrollBy({ left: +b.getAttribute("data-scroll") * (t.clientWidth * 0.8), behavior: "smooth" });
  });
  function renderDetail(p) {
    var v = $("#detail-view");
    v.innerHTML = '<a class="back" href="#catalogue">← All windows</a>' +
      '<div class="detail">' + media(p) +
      '<div class="stack"><div class="code">' + esc(p.code) + (p.sample ? " · sample product, details to be confirmed" : "") + "</div>" +
      "<h1>" + esc(p.name) + "</h1>" + statusHtml(p) +
      '<dl class="spec">' +
      "<dt>Product code</dt><dd>" + esc(p.code) + "</dd>" +
      "<dt>Frame size (W × H)</dt><dd class=\"dims\">" + dims(p) + "</dd>" +
      "<dt>Suits openings</dt><dd>" + openingRange(p) + ' <a href="' + ROOT + 'will-it-fit/index.html">Will it fit?</a></dd>' +
      "<dt>Window type</dt><dd>" + esc(T[p.type] || p.type) + "</dd>" +
      "<dt>Opening style</dt><dd>" + esc(p.openingStyle) + "</dd>" +
      "<dt>Finish</dt><dd>" + esc(p.finish) + "</dd>" +
      "<dt>Glass</dt><dd>" + esc(p.glass) + "</dd>" +
      "<dt>Comes with</dt><dd><ul>" + p.includes.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></dd>" +
      "<dt>Good for</dt><dd>" + esc(p.useCase) + "</dd></dl>" +
      '<form class="panel" id="enquiry" novalidate>' +
      '<div class="field"><label for="qty">How many windows?</label><input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="500" value="1"></div>' +
      '<fieldset class="radio-row"><legend>Collection</legend>' +
      '<label class="chip"><input type="radio" name="fulfil" value="pickup" checked><span>Factory pickup</span></label>' +
      '<label class="chip"><input type="radio" name="fulfil" value="delivery"><span>Delivery within Lagos</span></label></fieldset>' +
      '<a class="btn btn-wa btn-block" id="enquire-btn" data-cta="enquire" data-track-wa data-placement="product-page" data-product="' + esc(p.code) + '"></a>' +
      '<p class="small muted">Opens WhatsApp with your message ready. Please confirm your measurements with your installer before ordering. <a href="' + ROOT + 'will-it-fit/index.html">Not sure of the size?</a></p>' +
      "</form></div></div>" + carousel(p);
    var btn = $("#enquire-btn"); setCta(btn);
    var cr = $("#crumb-current"); if (cr) { cr.removeAttribute("aria-current"); cr.innerHTML = '<a href="#catalogue">Windows</a>'; }
    var c3 = $("#crumb-product"); if (c3) { c3.hidden = false; c3.textContent = p.code; }
    document.title = p.name + " (" + p.code + ") · Aluprime windows";
    var ph = $("#page-hero"); if (ph) ph.classList.add("compact");
    function upd() {
      var q = num($("#qty").value) || 1;
      var f = ($("input[name='fulfil']:checked") || {}).value || "pickup";
      btn.href = actions.enquireUrl(p, q, f, "product-page");
    }
    $("#enquiry").addEventListener("input", upd);
    $("#enquiry").addEventListener("change", upd);
    $("#enquiry").addEventListener("submit", function (e) { e.preventDefault(); });
    upd();
  }

  /* ---------- will it fit ---------- */
  function initFit() {
    var form = $("#checker");
    var gt = $("#gap-text"); if (gt) gt.textContent = FIT.minGapMm + "–" + FIT.maxGapMm;
    function check() {
      var w = num($("#ow").value), h = num($("#oh").value), out = $("#check-result");
      if (!w || !h) { out.innerHTML = "<p>Enter the smallest opening width and height to see which windows may fit.</p>"; var fv0 = $("#fit-live"); if (fv0) fv0.hidden = true; return; }
      var hits = P.filter(function (p) { return fits(p, w, h); });
      var fv = $("#fit-live");
      if (fv && w >= 300 && h >= 300) { var r = bestFor(w, h); fv.hidden = false; fv.innerHTML = fitSvg(w, h, r.p, r.ok); }
      if (hits.length) {
        out.innerHTML = "<p><strong>These windows may fit an opening of " + w + " × " + h + " mm:</strong></p><ul>" + hits.map(function (p) {
          return '<li><a href="' + ROOT + "windows/index.html#" + p.code.toLowerCase() + '">' + esc(p.code) + " " + esc(p.name) + "</a>, frame " + dims(p) + " (gap " + (w - p.frameWidthMm) + " mm × " + (h - p.frameHeightMm) + " mm)</li>";
        }).join("") + "</ul><p class=\"small\">This is a guide only. Confirm with your installer, and we will confirm on WhatsApp before you pay.</p>";
      } else {
        out.innerHTML = "<p><strong>No catalogue window fits " + w + " × " + h + " mm within the " + FIT.minGapMm + "–" + FIT.maxGapMm + " mm gap.</strong> Send us the measurements below. We can suggest how to adjust the opening, or Brand Aluminium can make a window to size.</p>";
      }
      $("#hw").value = $("#hw").value || w; $("#hh").value = $("#hh").value || h;
      updHelp();
    }
    function updHelp() {
      var btn = $("#help-btn");
      btn.href = waUrl(withRef(msg.sizeHelp(num($("#hw").value), num($("#hh").value), num($("#hq").value), $("#hl").value.trim()), "fit-guide"));
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); check(); });
    form.addEventListener("input", check);
    $("#help").addEventListener("input", updHelp);
    $("#help").addEventListener("submit", function (e) { e.preventDefault(); });
    setCta($("#help-btn")); check(); updHelp();
  }

  /* ---------- WhatsApp landing page ---------- */
  function initLanding() {
    var sel = $("#p1-product");
    sel.innerHTML = P.map(function (p) { return '<option value="' + esc(p.code) + '">' + esc(p.code) + " · " + esc(p.name) + " · " + dims(p) + "</option>"; }).join("") +
      '<option value="other">Another size (type it below)</option>';
    function upd1() {
      var code = sel.value, other = code === "other";
      $("#p1-other").hidden = !other;
      var q = num($("#p1-qty").value) || 1, f = ($("input[name='p1-fulfil']:checked") || {}).value || "pickup";
      var text;
      if (other) {
        var w = num($("#p1-w").value), h = num($("#p1-h").value);
        text = msg.product("a window", "", (w || "?") + " × " + (h || "?") + " mm", q, f);
      } else {
        var p = P.filter(function (x) { return x.code === code; })[0];
        text = msg.product(p.name, p.code, dims(p), q, f);
      }
      $("#p1-btn").href = waUrl(withRef(text, "landing-know-size"));
      $("#p1-btn").setAttribute("data-product", other ? "" : code);
    }
    function upd2() { $("#p2-btn").href = waUrl(withRef(msg.sizeHelp(num($("#p2-w").value), num($("#p2-h").value), num($("#p2-q").value), $("#p2-loc").value.trim()), "landing-size-help")); }
    function upd3() {
      var how = ($("input[name='p3-how']:checked") || {}).value || "pickup";
      $("#p3-area-field").hidden = how !== "delivery";
      $("#p3-btn").href = waUrl(withRef(msg.fulfil(how, $("#p3-area").value.trim(), $("#p3-date").value, $("#p3-ref").value.trim()), "landing-pickup-delivery"));
    }
    [["#path1", upd1], ["#path2", upd2], ["#path3", upd3]].forEach(function (x) {
      var f = $(x[0]); f.addEventListener("input", x[1]); f.addEventListener("change", x[1]); f.addEventListener("submit", function (e) { e.preventDefault(); }); x[1]();
    });
    track("landing_view", {});
  }

  /* ---------- start ---------- */
  applyChrome();
  loadAnalytics();
  track("page_view", { path: location.pathname });
  if (PAGE === "home") initHome();
  if (PAGE === "windows") initCatalogue();
  if (PAGE === "fit") initFit();
  if (PAGE === "whatsapp") initLanding();
  $$("a[data-cta]").forEach(setCta);

  window.Aluprime = { waUrl: waUrl, msg: msg, track: track, fits: fits, mode: mode, source: function () { return SOURCE; } };
})();
