"""Builds the Aluprime pages from one template so the header, footer and SEO
tags stay identical everywhere. Run from the site folder:

    python3 _build/build.py

Edit copy here, then re-run. Business settings and products live in
assets/config.js and assets/products.js and need no rebuild.
"""
import html, json, os, re

SITE = "https://aluprime.ng"   # ← change to the real domain before launch
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORG = "Brand Aluminium Limited"
FONT = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap"

MARK = ('<span class="brand-mark alu" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="2.5" y="2.5" width="15" height="15" rx="1" '
        'fill="none" stroke="#2b3338" stroke-width="2"/><path d="M10 3v14M3 10h7" stroke="#2b3338" stroke-width="1.6"/></svg></span>')
WA_ICON_HREF = "https://wa.me/"
# The 404 page is served for any URL, so relative links cannot work on their own.
# This works out the site root (e.g. /Aluprime/ on GitHub Pages, / on a real domain)
# and sets a <base> before the stylesheet and scripts load.
BASE_404 = ('<script>(function(){var s=location.pathname.split("/")[1];var b=document.createElement("base");'
            'b.href=(/\\.github\\.io$/.test(location.hostname)&&s?"/"+s+"/":"/");document.head.appendChild(b);})();</script>\n')
BAR = '<script>/* show notices before first paint so the page does not jump */(function(C){try{var o=C.prototypeTools&&sessionStorage.getItem("alp_mode");var live=(o||C.mode)==="live";var lb=document.getElementById("launch-bar");if(lb&&!live){lb.hidden=false;lb.firstChild.textContent=C.launchNotice||"";}if(C.prototypeTools){document.getElementById("proto-bar").hidden=false;}}catch(e){}})(window.ALUPRIME_CONFIG||{});</script>'


def esc(s):
    return html.escape(s, quote=True)


def header(r, current):
    def link(href, label, key, cls=""):
        cur = ' aria-current="page"' if key == current else ""
        c = f' class="{cls}"' if cls else ""
        return f'<a{c} href="{r}{href}"{cur}>{label}</a>'
    return f'''<a class="visually-hidden" href="#main">Skip to content</a>
<div class="proto-bar" id="proto-bar" hidden><div class="wrap"><span><strong>Prototype.</strong> Sample products and drawings. <span id="proto-number"></span></span><button type="button" id="proto-toggle" aria-expanded="false" aria-controls="test-panel">Test panel</button></div></div>
<div class="launch-bar" id="launch-bar" hidden role="status"><div class="wrap" data-copy="launchNotice"></div></div>
{BAR}
<header class="site-header"><div class="wrap">
<a class="brand" href="{r}index.html">{MARK}<span class="brand-txt"><strong>ALUPRIME</strong><span>Window System by Brand Aluminium</span></span></a>
<nav class="nav" aria-label="Main">
{link("windows/index.html", "Windows", "windows")}
{link("will-it-fit/index.html", "Will it fit?", "fit")}
{link("whatsapp/index.html", "WhatsApp", "whatsapp", "nav-wa")}
</nav></div></header>'''


def footer(r):
    return f'''<footer><div class="wrap">
<div><div class="foot-mark" aria-hidden="true">ALUPRIME</div>
<p><strong style="color:#e2e7ea">Aluprime Window System by {ORG}.</strong></p>
<p style="margin-top:8px">Ready-made aluminium windows in standard sizes. Factory pickup or delivery within Lagos.</p></div>
<div><h2>Explore</h2><ul><li><a href="{r}windows/index.html">All windows</a></li><li><a href="{r}will-it-fit/index.html">Will it fit? Size guide</a></li><li><a href="{r}whatsapp/index.html">WhatsApp enquiries</a></li></ul></div>
<div><h2>Factory pickup</h2><p data-factory></p></div>
<p class="foot-base">© <span id="yr">2026</span> {ORG}. Sizes are frame sizes in millimetres. Confirm every measurement with your installer before ordering.</p>
</div></footer>
<div class="wa-bar"><a class="btn btn-wa btn-block" data-wa="general" data-placement="sticky-bar" data-cta="chat" href="{WA_ICON_HREF}">Chat on WhatsApp</a></div>
<div class="test-panel" id="test-panel" hidden aria-live="polite"></div>'''


def page(path, title, desc, body, page_key, current, ld=None, crumbs=None, extra_head="", chrome=True, r=None, pre_head=""):
    depth = path.count("/")
    r = ("../" * depth) if r is None else r
    url = SITE + "/" + (path.replace("index.html", ""))
    graphs = [{"@type": "Organization", "@id": SITE + "/#org", "name": ORG, "url": SITE + "/",
               "logo": SITE + "/assets/img/og-aluprime.jpg",
               "brand": {"@type": "Brand", "name": "Aluprime"}},
              {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "Aluprime", "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en-NG"}]
    if crumbs:
        graphs.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + "/" + u} for i, (n, u) in enumerate(crumbs)]})
    if ld:
        graphs.extend(ld)
    ldjson = json.dumps({"@context": "https://schema.org", "@graph": graphs}, ensure_ascii=False, separators=(",", ":"))
    head = f'''<!DOCTYPE html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#c9ced2">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aluprime">
<meta property="og:locale" content="en_NG">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og-aluprime.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}/assets/img/og-aluprime.jpg">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' rx='4' fill='%23c9ced2'/%3E%3Crect x='4' y='4' width='12' height='12' fill='none' stroke='%232b3338' stroke-width='1.8'/%3E%3Cpath d='M10 4v12' stroke='%232b3338' stroke-width='1.4'/%3E%3C/svg%3E">
<link rel="preload" href="{r}assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
{pre_head}<link rel="preload" href="{r}assets/img/brushed.webp" as="image" type="image/webp" fetchpriority="high">
<link rel="stylesheet" href="{r}assets/site.css">
<script src="{r}assets/config.js"></script>
{extra_head}<script type="application/ld+json">{ldjson}</script>
</head>
<body data-page="{page_key}" data-root="{r}">
'''
    top = header(r, current) if chrome else ""
    bottom = footer(r) if chrome else '<div class="test-panel" id="test-panel" hidden aria-live="polite"></div>'
    scripts = f'''
<script src="{r}assets/products.js"></script>
<script src="{r}assets/site.js"></script>
<script src="{r}assets/fx.js" defer></script>
<script>document.getElementById("yr")&&(document.getElementById("yr").textContent=new Date().getFullYear());</script>
</body>
</html>
'''
    out = head + top + "\n" + body.replace("{r}", r) + "\n" + bottom + scripts
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(out)
    print("wrote", path, f"title={len(title)} desc={len(desc)}")


def crumbs_html(items):
    lis = []
    for i, (n, u) in enumerate(items):
        if i == len(items) - 1:
            lis.append(f'<li id="crumb-current" aria-current="page">{n}</li>')
        else:
            lis.append(f'<li><a href="{{r}}{u}">{n}</a></li>')
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + "".join(lis) + '<li id="crumb-product" hidden aria-current="page"></li></ol></nav>'


def page_hero(crumbs, eyebrow, h1, lead, frame_word="ALUPRIME"):
    return f'''<section class="page-hero alu spot" id="page-hero"><div class="wrap">
{crumbs_html(crumbs)}
<div class="ph-copy stack"><p class="eyebrow">{eyebrow}</p><h1>{h1}</h1><p class="lead">{lead}</p></div>
<div class="logo-frame alu spot" aria-hidden="true"><span class="emboss">{frame_word}</span></div>
</div></section>'''


def faq_ld(pairs):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in pairs]}


# ---------------------------------------------------------------- HOME
SKYLINE = ('<svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true"><path fill="#2a2638" opacity=".55" d="M0 160V96h18V70h14v26h10V58h22v38h8V80h16v16h12V40h18v56h10V74h20v22h8V62h14v34h12V50h24v46h8V84h18v12h10V66h16v30h12V56h20v40h14V78h16v18h10V60h22v100z"/>'
           '<path fill="#1d1b29" d="M0 160v-38h26v-14h18v14h12v-26h26v26h10v-18h22v18h14v-34h20v34h12v-12h18v12h16v-42h24v42h10v-20h20v20h12v-30h18v30h14v-16h16v16h12v-36h22v36h14v-12h24v52z"/></svg>')

HOME_FAQ = [
    ("How do I measure, and which size do I need?",
     'Measure the finished opening (after plastering) three times across and three times up, and use the smallest numbers. The window frame is a little smaller than the opening so your installer can fix and seal it. Please confirm the measurements with your installer before ordering. Our <a href="{r}will-it-fit/index.html">size guide</a> shows which windows may fit, and we check again on WhatsApp.'),
    ("Are the windows in stock?", "Each window shows its stock status once we launch. Always confirm availability on WhatsApp before you travel to collect."),
    ("How do I pay?", "We confirm the total price and how to pay on WhatsApp before you pay anything. Payment details are only sent from the official Aluprime WhatsApp number."),
    ("Do you install the windows?", "Aluprime supplies ready-made windows; your own installer fits them. Send installation questions on WhatsApp and we will help. Each window comes with its fixing kit."),
    ("Can you send the windows to my site outside Lagos?", "We deliver within Lagos only. You arrange onward transport from the factory or your Lagos delivery address, usually with your other building materials. Tell us how far they will travel and we will advise on packing."),
]


def faq_block(pairs, extra=""):
    items = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in pairs)
    return items + extra


home_body = f'''<main id="main">
<section class="hero alu spot" aria-labelledby="hero-h"><div class="wrap hero-inner">
<div class="hero-mark"><p class="eyebrow">Aluprime Window System · Lagos</p>
<p class="wordmark emboss" aria-hidden="true">ALUPRIME</p></div>
<div class="hero-copy">
<h1 id="hero-h">Ready-made aluminium windows for your building project.</h1>
<p class="lead">Choose your window size online. Pick up from our factory or get delivery within Lagos.</p>
<p class="muted">No waiting weeks for fabrication: the windows are already made in standard sizes.</p>
<div class="btn-row">
<a class="btn btn-wa" data-wa="general" data-placement="home-hero" data-cta="chat" href="{WA_ICON_HREF}">Chat on WhatsApp</a>
<a class="btn btn-metal alu" href="{{r}}windows/index.html">Browse windows</a>
</div>
<ul class="hero-facts"><li>Standard sizes, already made</li><li>Fixing kit included</li><li>Factory pickup or Lagos delivery</li></ul>
</div>
<div class="win-stage" aria-hidden="true">
<div class="win">
<div class="win-frame">
<div class="pane"><div class="scene"><div class="sun"></div>{SKYLINE}</div><div class="frost"></div><div class="sheen"></div></div>
<div class="pane"><div class="scene"><div class="sun" style="left:-14%"></div>{SKYLINE}</div><div class="frost"></div><div class="sheen"></div><span class="win-handle"></span></div>
</div>
<p class="win-label">S-1512 · Sliding window · 1480 × 1180 mm</p>
</div>
</div>
</div></section>

<section class="on-dark" aria-labelledby="ring-h"><div class="wrap">
<div class="sec-head rv"><div class="stack"><p class="eyebrow">The range</p><h2 id="ring-h">Six standard sizes, made before you ask.</h2>
<p class="muted">Drag the ring, use the arrows or your keyboard. Every size is the outside of the frame, in millimetres.</p></div>
<a class="btn btn-outline" href="{{r}}windows/index.html">See all windows</a></div>
<div class="ring-wrap">
<div class="ring-stage" id="ring-stage" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Aluprime windows. Use the left and right arrow keys to turn, Enter to open.">
<div class="ring" id="ring"></div><div class="ring-floor"></div></div>
<div class="ring-ctrl">
<button type="button" id="ring-prev" aria-label="Previous window">&#8592;</button>
<div class="ring-caption" id="ring-caption"></div>
<button type="button" id="ring-next" aria-label="Next window">&#8594;</button>
</div>
<p class="visually-hidden" id="ring-live" aria-live="polite"></p>
</div>
</div></section>

<section class="section-alt" id="home-fit" aria-labelledby="fit-h"><div class="wrap">
<div class="sec-head rv"><div class="stack"><p class="eyebrow">Size your opening</p><h2 id="fit-h">Will a ready-made window fit your wall?</h2>
<p class="muted">Slide to your opening size. We place the closest window inside it and show the gap your installer needs for packers and sealant.</p></div></div>
<div class="fit-tool">
<div class="fit-controls rv">
<div class="slider"><div class="slider-top"><label for="hf-w">Opening width (mm)</label><input id="hf-w" type="number" inputmode="numeric" value="1500" min="400" max="2000"></div>
<input id="hf-w-r" type="range" min="400" max="2000" step="5" value="1500" aria-label="Opening width slider"></div>
<div class="slider"><div class="slider-top"><label for="hf-h">Opening height (mm)</label><input id="hf-h" type="number" inputmode="numeric" value="1210" min="400" max="1500"></div>
<input id="hf-h-r" type="range" min="400" max="1500" step="5" value="1210" aria-label="Opening height slider"></div>
<div id="hf-verdict" aria-live="polite"></div>
<div class="fit-matches" id="hf-matches"></div>
<a class="btn btn-wa btn-block" id="hf-btn" data-cta="chat" data-track-wa data-placement="home-fit" href="{WA_ICON_HREF}">Chat on WhatsApp</a>
<p class="small muted">Guide only. Confirm with your installer, and we confirm every size on WhatsApp before you pay. <a href="{{r}}will-it-fit/index.html">How to measure</a></p>
</div>
<div class="fit-view rv"><div id="hf-svg"></div><div class="sheen"></div></div>
</div>
</div></section>

<section aria-labelledby="outside-h"><div class="wrap route-wrap">
<div class="sec-head"><div class="stack"><p class="eyebrow">Building outside Lagos?</p><h2 id="outside-h">Buy in Lagos. Send to site with your other materials.</h2>
<p class="muted">Buy your windows while you buy the rest of your materials in Lagos. Collect them from our factory, or have them delivered to a Lagos address such as your supplier, a market or a loading point. Then send them to site on your own transport.</p></div></div>
<div class="route-map"><div class="route-line"><i></i></div>
<div class="stop"><span class="stop-pin alu">01</span><strong>Collect from the factory</strong><p class="small muted" data-copy="pickup"></p></div>
<div class="stop"><span class="stop-pin alu">02</span><strong>Or Lagos delivery</strong><p class="small muted" data-copy="delivery"></p></div>
<div class="stop"><span class="stop-pin alu">03</span><strong>Onward to your site</strong><p class="small muted" data-copy="onward"></p></div>
</div>
<p class="small muted" style="margin-top:20px">Tell us your project location on WhatsApp and we will advise on packing for the trip.</p>
</div></section>

<section class="section-alt" aria-labelledby="how-h"><div class="wrap">
<div class="sec-head rv"><div class="stack"><p class="eyebrow">How it works</p><h2 id="how-h">From your measurements to your site in five steps.</h2></div></div>
<ol class="timeline h">
<li><strong>Find a window</strong><span class="small muted">Browse sliding, toilet and casement windows by size.</span></li>
<li><strong>Check the size</strong><span class="small muted">Measure the opening and confirm with your installer. <a href="{{r}}will-it-fit/index.html">Size guide</a></span></li>
<li><strong>Send an enquiry on WhatsApp</strong><span class="small muted">The window code and size are added to your message.</span></li>
<li><strong>Confirm availability and price</strong><span class="small muted">We reply with stock, the total price and the earliest date.</span></li>
<li><strong>Arrange pickup or Lagos delivery</strong><span class="small muted">Collect from the factory or we deliver within Lagos.</span></li>
</ol>
</div></section>

<section aria-labelledby="faq-h"><div class="wrap faq-grid">
<div class="stack rv"><p class="eyebrow">Questions</p><h2 id="faq-h">Before you order</h2><p class="muted">Anything else? Ask on WhatsApp and the window code and size go straight into the message.</p></div>
<div class="faq">{faq_block(HOME_FAQ, '<details><summary>Where is factory pickup?</summary><p data-factory></p></details>')}</div>
</div></section>

<section class="closing on-dark" aria-label="Get started"><div class="wrap">
<p class="big" data-hl="made,measured,ready">Already made. Measured right. Ready when you are.</p>
<div class="btn-row">
<a class="btn btn-wa" data-wa="general" data-placement="home-closing" data-cta="chat" href="{WA_ICON_HREF}">Chat on WhatsApp</a>
<a class="btn btn-outline" href="{{r}}windows/index.html">Browse windows</a>
</div>
</div></section>
</main>'''

page("index.html",
     "Aluprime ready-made aluminium windows in Lagos",
     "Ready-made aluminium windows in standard sizes: sliding, toilet and casement. Check your opening online, enquire on WhatsApp, collect or get Lagos delivery.",
     home_body, "home", "home", ld=[faq_ld([(q, a) for q, a in HOME_FAQ])])

# ---------------------------------------------------------------- WINDOWS
win_body = page_hero([("Home", "index.html"), ("Windows", "windows/")], "Catalogue",
                     "Ready-made aluminium windows",
                     'Sizes shown are the window frame (width × height in mm). Your opening needs to be a little larger. <a href="{r}will-it-fit/index.html">Will it fit?</a>',
                     "WINDOWS") + '''
<main id="main">
<section style="padding-top:36px"><div class="wrap stack">
<div id="catalogue-view" class="stack">
<h2 class="visually-hidden">All windows</h2>
<form class="filters" id="filters" onsubmit="return false">
<fieldset class="chips" id="type-chips"></fieldset>
<div class="field"><label for="size-select">Frame size</label><select id="size-select"></select></div>
</form>
<p class="count" id="count" aria-live="polite"></p>
<div class="grid" id="grid"></div>
</div>
<div id="detail-view" hidden></div>
</div></section>
</main>'''
page("windows/index.html",
     "Aluminium window catalogue: sizes and types | Aluprime",
     "Browse Aluprime ready-made aluminium windows by type and frame size: sliding, projected toilet and casement. See specs, then enquire on WhatsApp in one tap.",
     win_body, "windows", "windows", crumbs=[("Home", ""), ("Windows", "windows/")])

# ---------------------------------------------------------------- WILL IT FIT
fit_body = page_hero([("Home", "index.html"), ("Will it fit?", "will-it-fit/")], "Size guide", "Will it fit?",
                     "Two sizes matter: the opening in the wall and the frame of the window. Measure once, check here, and we confirm on WhatsApp.",
                     "FIT") + '''
<main id="main">
<section><div class="wrap">
<div class="faq-grid">
<div class="stack rv">
<p class="eyebrow">Opening vs frame</p>
<h2>The opening must be a little bigger than the frame.</h2>
<p>The <strong>opening size</strong> is the hole in the wall. The <strong>frame size</strong> is the outside of the window. The gap lets your installer pack, fix and seal the window.</p>
<div class="fit-figure"><svg viewBox="0 0 360 250" role="img" aria-labelledby="fit-fig-t"><title id="fit-fig-t">Opening size is the wall opening; frame size is the window; the gap between them is for packers and sealant.</title>
<rect x="40" y="20" width="280" height="190" style="fill:var(--card);stroke:var(--muted)" stroke-dasharray="5 4"/>
<rect x="52" y="32" width="256" height="166" style="fill:var(--frame)"/>
<rect x="62" y="42" width="236" height="146" style="fill:var(--glass)"/>
<text x="180" y="122" text-anchor="middle" font-size="13" style="fill:var(--ink)">Window frame</text>
<text x="180" y="14" text-anchor="middle" font-size="12" style="fill:var(--muted)">Opening (wall)</text>
<path d="M40 228 h280 M40 222 v12 M320 222 v12" style="stroke:var(--muted)"/>
<text x="180" y="245" text-anchor="middle" font-size="12" style="fill:var(--muted)">Opening width = frame width + gap</text>
<path d="M320 115 h-12" style="stroke:var(--accent);stroke-width:2"/>
<text x="326" y="112" font-size="11" style="fill:var(--accent)">gap</text>
</svg></div>
</div>
<div class="stack">
<h2 class="rv" style="font-size:1.6rem">How to measure</h2>
<ol class="timeline">
<li><strong>Measure the finished opening</strong><span class="small muted">After plastering if possible. If it is not plastered yet, say so and tell us how thick the plaster will be.</span></li>
<li><strong>Measure 3 widths and 3 heights</strong><span class="small muted">Width at the top, middle and bottom. Height at the left, centre and right. Use the smallest of each.</span></li>
<li><strong>Check it is square</strong><span class="small muted">Measure both diagonals, corner to corner. They should be within about 10 mm of each other.</span></li>
<li><strong>Confirm with your installer</strong><span class="small muted">Ask your installer to check the measurements before you order.</span></li>
</ol>
</div>
</div>
</div></section>

<section class="section-alt" aria-labelledby="chk-h"><div class="wrap">
<div class="sec-head rv"><div class="stack"><p class="eyebrow">Check your opening</p><h2 id="chk-h">Type your smallest measurements.</h2>
<p class="small muted">Guide only: a window may fit when the opening is about <span id="gap-text">10–40</span> mm larger than the frame in both directions. We confirm every size on WhatsApp before you pay.</p></div></div>
<div class="fit-tool">
<form id="checker" class="panel" novalidate>
<div class="field-row">
<div class="field"><label for="ow">Opening width (mm)</label><input id="ow" type="number" inputmode="numeric" min="200" max="4000" placeholder="e.g. 1200"></div>
<div class="field"><label for="oh">Opening height (mm)</label><input id="oh" type="number" inputmode="numeric" min="200" max="3000" placeholder="e.g. 1200"></div>
</div>
<button class="btn btn-outline" type="submit">Check size</button>
<div class="result" id="check-result" aria-live="polite"></div>
</form>
<div class="fit-view"><div id="fit-live" hidden></div><div class="sheen"></div></div>
</div>
</div></section>

<section aria-labelledby="help-h"><div class="wrap">
<div class="faq-grid">
<div class="stack rv"><p class="eyebrow">Not sure?</p><h2 id="help-h">Ask us to check</h2><p>Send your measurements on WhatsApp. After the chat opens, attach photos of each opening with the tape measure showing.</p></div>
<form id="help" class="panel" novalidate>
<div class="field-row">
<div class="field"><label for="hw">Opening width (mm)</label><input id="hw" type="number" inputmode="numeric"></div>
<div class="field"><label for="hh">Opening height (mm)</label><input id="hh" type="number" inputmode="numeric"></div>
</div>
<div class="field-row">
<div class="field"><label for="hq">Number of windows</label><input id="hq" type="number" inputmode="numeric" min="1"></div>
<div class="field"><label for="hl">Project location (town, state)</label><input id="hl" type="text" autocomplete="address-level2" placeholder="e.g. Ibadan, Oyo"></div>
</div>
<a class="btn btn-wa btn-block" id="help-btn" data-cta="chat" data-track-wa data-placement="fit-guide" href="https://wa.me/">Chat on WhatsApp</a>
</form>
</div>
</div></section>
</main>'''
page("will-it-fit/index.html",
     "Will it fit? Window size guide and checker | Aluprime",
     "How to measure a window opening and check it against Aluprime frame sizes. Enter your smallest width and height to see which ready-made windows may fit.",
     fit_body, "fit", "fit", crumbs=[("Home", ""), ("Will it fit?", "will-it-fit/")])

# ---------------------------------------------------------------- WHATSAPP LANDING
lp_css = '''<style>
 body { padding-bottom: 24px; background: var(--surface); }
 .lp { max-width: 580px; margin: 0 auto; padding: 20px var(--gutter) 12px; display: grid; gap: 18px; }
 .lp-card { border-radius: 18px; padding: 22px; display: grid; gap: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 24px 40px -28px rgba(0,0,0,.6); }
 .lp-card .wordmark { font-size: clamp(2.4rem, 13vw, 3.6rem); }
 .lp-card .muted { color: #3e474d; }
 .path { border: 1px solid var(--line); border-radius: var(--r); background: var(--card); transition: box-shadow .3s; }
 .path[open] { box-shadow: 0 16px 30px -24px rgba(0,0,0,.45); }
 .path summary { cursor: pointer; padding: 16px; font-weight: 700; font-size: 1.05rem; min-height: 60px; display: flex; gap: 12px; align-items: center; list-style: none; }
 .path summary::-webkit-details-marker { display: none; }
 .path summary .n { width: 34px; height: 34px; border-radius: 50%; background: var(--ink); color: var(--paper); display: grid; place-items: center; flex: none; font: 700 .85rem/1 var(--mono); }
 .path summary::after { content: "+"; margin-left: auto; font-size: 1.4rem; color: var(--muted); }
 .path[open] summary::after { content: "\\2212"; }
 .path form { padding: 0 16px 16px; display: grid; gap: 14px; }
</style>
'''
lp_body = '''<div class="proto-bar" id="proto-bar" hidden><div class="wrap"><span><strong>Prototype.</strong> <span id="proto-number"></span></span><button type="button" id="proto-toggle" aria-expanded="false" aria-controls="test-panel">Test panel</button></div></div>
<div class="launch-bar" id="launch-bar" hidden role="status"><div class="wrap" data-copy="launchNotice"></div></div>
<script>/* show notices before first paint so the page does not jump */(function(C){try{var o=C.prototypeTools&&sessionStorage.getItem("alp_mode");var live=(o||C.mode)==="live";var lb=document.getElementById("launch-bar");if(lb&&!live){lb.hidden=false;lb.firstChild.textContent=C.launchNotice||"";}if(C.prototypeTools){document.getElementById("proto-bar").hidden=false;}}catch(e){}})(window.ALUPRIME_CONFIG||{});</script>
<main class="lp" id="main">
<div class="lp-card alu spot">
<a class="brand" href="{r}index.html" style="position:relative;z-index:2">''' + MARK + '''<span class="brand-txt"><strong>ALUPRIME</strong><span>Window System by Brand Aluminium</span></span></a>
<p class="wordmark emboss" aria-hidden="true" style="position:relative;z-index:2">ALUPRIME</p>
<h1 style="font-size:1.7rem;position:relative;z-index:2">Ready-made aluminium windows. Ask us on WhatsApp.</h1>
<p class="muted" style="position:relative;z-index:2">Pick up from our factory or get delivery within Lagos.</p>
</div>
<a class="btn btn-wa btn-block" style="min-height:60px;font-size:1.1rem" data-wa="general" data-placement="landing-main" data-cta="open" href="https://wa.me/">Open WhatsApp</a>
<p class="small muted" style="text-align:center">Or choose what you need, and we will write the message for you:</p>

<details class="path" open>
<summary><span class="n">01</span>I know the window size I need</summary>
<form id="path1" novalidate>
<div class="field"><label for="p1-product">Window</label><select id="p1-product"></select></div>
<div class="field-row" id="p1-other" hidden>
<div class="field"><label for="p1-w">Width (mm)</label><input id="p1-w" type="number" inputmode="numeric"></div>
<div class="field"><label for="p1-h">Height (mm)</label><input id="p1-h" type="number" inputmode="numeric"></div>
</div>
<div class="field"><label for="p1-qty">How many windows?</label><input id="p1-qty" type="number" inputmode="numeric" min="1" value="1"></div>
<fieldset class="radio-row"><legend>Collection</legend>
<label class="chip"><input type="radio" name="p1-fulfil" value="pickup" checked><span>Factory pickup</span></label>
<label class="chip"><input type="radio" name="p1-fulfil" value="delivery"><span>Lagos delivery</span></label></fieldset>
<a class="btn btn-wa btn-block" id="p1-btn" data-cta="go" data-track-wa data-placement="landing-know-size" href="https://wa.me/">Continue to WhatsApp</a>
</form>
</details>

<details class="path">
<summary><span class="n">02</span>I need help checking my measurements</summary>
<form id="path2" novalidate>
<div class="field-row">
<div class="field"><label for="p2-w">Opening width (mm)</label><input id="p2-w" type="number" inputmode="numeric"></div>
<div class="field"><label for="p2-h">Opening height (mm)</label><input id="p2-h" type="number" inputmode="numeric"></div>
</div>
<div class="field-row">
<div class="field"><label for="p2-q">Number of windows</label><input id="p2-q" type="number" inputmode="numeric" min="1"></div>
<div class="field"><label for="p2-loc">Project location</label><input id="p2-loc" type="text" placeholder="Town, state"></div>
</div>
<p class="small muted">After the chat opens, attach photos of each opening with the tape measure showing.</p>
<a class="btn btn-wa btn-block" id="p2-btn" data-cta="go" data-track-wa data-placement="landing-size-help" href="https://wa.me/">Continue to WhatsApp</a>
</form>
</details>

<details class="path">
<summary><span class="n">03</span>I want to arrange factory pickup or Lagos delivery</summary>
<form id="path3" novalidate>
<fieldset class="radio-row"><legend>How do you want to receive the windows?</legend>
<label class="chip"><input type="radio" name="p3-how" value="pickup" checked><span>Factory pickup</span></label>
<label class="chip"><input type="radio" name="p3-how" value="delivery"><span>Lagos delivery</span></label></fieldset>
<div class="field" id="p3-area-field" hidden><label for="p3-area">Delivery area or address in Lagos</label><input id="p3-area" type="text" placeholder="e.g. Ikeja, or market name"></div>
<div class="field"><label for="p3-date">Preferred date</label><input id="p3-date" type="date"></div>
<div class="field"><label for="p3-ref">Order or enquiry reference (if you have one)</label><input id="p3-ref" type="text"></div>
<p class="small muted" data-copy="onward"></p>
<a class="btn btn-wa btn-block" id="p3-btn" data-cta="go" data-track-wa data-placement="landing-pickup-delivery" href="https://wa.me/">Continue to WhatsApp</a>
</form>
</details>

<p style="text-align:center"><a data-wa="own" data-placement="landing-own-message" href="https://wa.me/">Prefer to type your own message? Open WhatsApp</a></p>
<p style="text-align:center"><a href="{r}windows/index.html">Browse all windows</a></p>
<p class="small muted" style="text-align:center">Aluprime Window System by Brand Aluminium Limited.</p>
</main>'''
page("whatsapp/index.html",
     "Message Aluprime on WhatsApp about aluminium windows",
     "Message Aluprime on WhatsApp about ready-made aluminium windows: pick a size, ask us to check your measurements, or arrange factory pickup or Lagos delivery.",
     lp_body, "whatsapp", "whatsapp", crumbs=[("Home", ""), ("WhatsApp", "whatsapp/")], extra_head=lp_css, chrome=False)

# ---------------------------------------------------------------- 404
nf_body = '''<main id="main">
<section class="hero alu spot" style="min-height:70vh;display:grid;align-items:center"><div class="wrap stack" style="position:relative;z-index:2;justify-items:start">
<p class="wordmark emboss" aria-hidden="true">404</p>
<h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">This page doesn’t fit the opening.</h1>
<p class="lead">The link may be old or mistyped. Try one of these instead.</p>
<div class="btn-row"><a class="btn btn-metal alu" href="index.html">Home</a><a class="btn btn-metal alu" href="windows/">All windows</a><a class="btn btn-wa" data-wa="general" data-placement="404" data-cta="chat" href="https://wa.me/">Chat on WhatsApp</a></div>
</div></section>
</main>'''
page("404.html", "Page not found | Aluprime", "This page could not be found. Browse Aluprime ready-made aluminium windows or message us on WhatsApp.",
     nf_body, "404", "", extra_head='<meta name="robots" content="noindex">\n', r="", pre_head=BASE_404)
