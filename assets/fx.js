/* Aluprime interaction layer — purely visual, safe to remove.
   Spotlight on brushed metal, frosted-glass reveal, window tilt and
   scroll-dive, magnetic buttons, glass gleam on cards, scroll reveals,
   timeline progress and the word-by-word closing line.
   Reads layout once per frame at most and only writes CSS variables. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }

  /* rAF-batched writer */
  var jobs = new Map(), queued = false;
  function write(key, fn) { jobs.set(key, fn); if (!queued) { queued = true; requestAnimationFrame(flush); } }
  function flush() { queued = false; var j = jobs; jobs = new Map(); j.forEach(function (fn) { fn(); }); }

  /* rect cache, invalidated on scroll/resize */
  var rects = new WeakMap();
  function rect(el) { var r = rects.get(el); if (!r) { r = el.getBoundingClientRect(); rects.set(el, r); } return r; }
  function invalidate() { rects = new WeakMap(); }
  window.addEventListener("scroll", invalidate, { passive: true });
  window.addEventListener("resize", invalidate);

  /* ---------- spotlight on metal ---------- */
  $$(".spot").forEach(function (el) {
    if (!fine) return;
    el.addEventListener("pointermove", function (e) {
      var r = rect(el), x = e.clientX - r.left, y = e.clientY - r.top;
      write(el, function () { el.style.setProperty("--sx", x + "px"); el.style.setProperty("--sy", y + "px"); });
    });
  });

  /* ---------- hero window: frost reveal, tilt, sheen, scroll-dive ---------- */
  var hero = doc.querySelector(".hero"), win = doc.querySelector(".win");
  if (hero && win) {
    var panes = $$(".pane", win), sheen = win.querySelector(".sheen");
    function frostAt(cx, cy) {
      panes.forEach(function (p) {
        var r = rect(p);
        p.style.setProperty("--mx", (cx - r.left) + "px");
        p.style.setProperty("--my", (cy - r.top) + "px");
      });
    }
    if (fine && !reduce) {
      hero.addEventListener("pointermove", function (e) {
        var cx = e.clientX, cy = e.clientY;
        write("hero", function () {
          var r = rect(win);
          var nx = (cx - (r.left + r.width / 2)) / r.width, ny = (cy - (r.top + r.height / 2)) / r.height;
          nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny));
          win.classList.add("is-live");
          win.style.setProperty("--ry", (nx * 9).toFixed(2) + "deg");
          win.style.setProperty("--rx", (-ny * 7).toFixed(2) + "deg");
          if (sheen) win.style.setProperty("--shx", (50 + nx * 60).toFixed(1) + "%");
          frostAt(cx, cy);
        });
      });
      hero.addEventListener("pointerleave", function () {
        win.classList.remove("is-live");
        win.style.setProperty("--rx", "0deg"); win.style.setProperty("--ry", "0deg");
      });
    }
    /* Touch or reduced motion: a slow clear patch drifts across the glass. */
    if (!fine && !reduce) {
      var t0 = performance.now(), heroVisible = true;
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; if (heroVisible) requestAnimationFrame(drift); }).observe(win);
      var drift = function (now) {
        if (!heroVisible) return;
        var r = rect(win), t = (now - t0) / 1000;
        frostAt(r.left + r.width * (0.5 + 0.32 * Math.sin(t * 0.6)), r.top + r.height * (0.5 + 0.25 * Math.sin(t * 0.9 + 1)));
        win.style.setProperty("--shx", (50 + 40 * Math.sin(t * 0.5)).toFixed(1) + "%");
        requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }
    if (reduce) { panes.forEach(function (p) { p.style.setProperty("--fr", "260px"); }); }
    /* Scroll-dive: the window grows toward you and the frost clears. */
    if (!reduce) {
      var onScroll = function () {
        write("dive", function () {
          var h = hero.offsetHeight || 1, k = Math.max(0, Math.min(1, window.scrollY / h));
          win.style.setProperty("--dive", (1 + k * 0.35).toFixed(3));
          win.style.setProperty("--frost", (1 - k * 0.9).toFixed(3));
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    doc.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b) return;
      var r = rect(b), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      write(b, function () { b.style.transform = "translate(" + (dx * 0.12).toFixed(1) + "px," + (dy * 0.22).toFixed(1) + "px)"; });
    });
    doc.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (b && !b.contains(e.relatedTarget)) write(b, function () { b.style.transform = ""; });
    });
  }

  /* ---------- glass gleam on product media and the fit view ---------- */
  if (fine) {
    doc.addEventListener("pointermove", function (e) {
      var m = e.target.closest && e.target.closest(".card-media, .fit-view");
      if (!m) return;
      var r = rect(m), x = ((e.clientX - r.left) / r.width * 100).toFixed(1), y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      write(m, function () { m.style.setProperty("--gx", x + "%"); m.style.setProperty("--gy", y + "%"); m.style.setProperty("--shx", x + "%"); });
    });
  }

  /* ---------- closing line: split into words ---------- */
  $$(".closing .big").forEach(function (p) {
    var hl = (p.getAttribute("data-hl") || "").split(",");
    var words = p.textContent.trim().split(/\s+/);
    p.innerHTML = '<span class="visually-hidden">' + p.textContent.trim() + "</span>" + words.map(function (w, i) {
      var clean = w.replace(/[^\w]/g, "").toLowerCase();
      return '<span class="w' + (hl.indexOf(clean) > -1 ? " hl" : "") + '" style="--i:' + i + '" aria-hidden="true">' + w + "</span>";
    }).join(" ");
  });

  /* ---------- reveal on scroll ---------- */
  var targets = $$(".rv, .closing, .route-wrap");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach(function (t) { io.observe(t); });
    /* Fallback for fast scrolls/jumps: anything already above the fold bottom is shown. */
    var sweep = function () {
      write("sweep", function () {
        var vh = window.innerHeight;
        targets = targets.filter(function (t) {
          if (t.classList.contains("in")) return false;
          if (t.getBoundingClientRect().top < vh) { t.classList.add("in"); io.unobserve(t); return false; }
          return true;
        });
      });
    };
    window.addEventListener("scroll", sweep, { passive: true });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* ---------- timeline progress ---------- */
  var lines = $$(".timeline");
  if (lines.length) {
    lines.forEach(function (tl) { if (!tl.querySelector(".fill")) { var f = doc.createElement("span"); f.className = "fill"; f.setAttribute("aria-hidden", "true"); tl.prepend(f); } });
    var upd = function () {
      write("tl", function () {
        var vh = window.innerHeight;
        lines.forEach(function (tl) {
          var r = tl.getBoundingClientRect();
          var k = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.75 - r.top) / (r.height || 1)));
          tl.style.setProperty("--p", k.toFixed(3));
          var items = tl.querySelectorAll("li");
          items.forEach(function (li, i) { li.classList.toggle("on", k >= (i + 0.5) / items.length - 0.02 || k >= 0.999); });
        });
      });
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }
})();
