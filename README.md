# Aluprime website — handover

A static, mobile-first website in the Brand Aluminium premium style: brushed-aluminium hero with a frosted-glass window that clears where you look, a 3D ring of the window range, a live "size your opening" tool, and the same WhatsApp, pre-launch and tracking logic as the prototype. No database. It runs on any static host (Netlify, Cloudflare Pages, GitHub Pages, cPanel hosting).

```
index.html                 Home
windows/index.html         Catalogue + product pages (windows/#s-1212 opens a product)
will-it-fit/index.html     Size guide, size checker, "ask us to check" form
whatsapp/index.html        Standalone WhatsApp landing page  (/whatsapp)
assets/config.js           ← business settings (edit this)
assets/products.js         ← catalogue (edit this)
404.html                   Not-found page
assets/site.css            Design
assets/site.js             Logic: modes, WhatsApp links, filters, size check, ring, tracking
assets/fx.js               Visual effects only (spotlight, frosted glass, tilt, reveals). Safe to delete.
assets/fonts/              Archivo (self-hosted, SIL Open Font License)
assets/img/                brushed.webp texture, og-aluprime.jpg share image, product photos
_build/build.py            Rebuilds the four pages and 404 from one template (header, footer, SEO)
robots.txt, sitemap.xml    Search engines
.htaccess                  cPanel/Apache only: gzip, caching, 404 page
orders-log-template.csv    Sheet for logging paid orders
```

**Page copy** (headings, FAQ, step text) lives in `_build/build.py`. Edit it there, then run `python3 _build/build.py` from the site folder. Do not hand-edit the generated `index.html` files or your edits will be overwritten on the next build.

**Domain:** the canonical links, share image, `robots.txt` and `sitemap.xml` use `https://aluprime.ng`. If the domain is different, change `SITE` at the top of `_build/build.py`, re-run it, and find-and-replace the domain in `robots.txt` and `sitemap.xml`.

Edit the two files marked ← for routine changes. Use a plain text editor (Notepad++, VS Code). Keep the quotes and commas as they are.

## 1. Connect the WhatsApp Business number
In `assets/config.js` set `whatsappNumber` to the official number in international format, digits only:

```js
whatsappNumber: "2348012345678",   // for 0801 234 5678
```

Every button on the site uses this one field. Until it is set, WhatsApp opens with the message ready and asks the customer to choose a contact. Do not launch like that.

## 2. Replace the demo products
Each window is one block in `assets/products.js`. To change a product, edit its fields. To add one, copy a whole block `{ ... },` and change the code. To remove one, delete its block.

- `code` must be unique (it becomes the link, e.g. `windows/#s-1212`).
- `frameWidthMm` / `frameHeightMm` = outside size of the frame, in mm.
- `type` must be `sliding`, `projected` or `casement` (labels are in `ALUPRIME_TYPES` at the bottom of the file; add a new type there).
- Set `sample: false` once the product details and photo are real. This removes the "Sample" tag.

## 3. Update prices and stock
In `assets/products.js`, per product:

```js
price: 150000,            // naira incl. VAT; null = "Confirm price and availability on WhatsApp"
stock: "in_stock",        // "in_stock" | "made_to_order" | "preorder" | null
readyText: "Ready in 48 hours",
```

Only enter prices and stock that the business has approved. The site shows "Confirm price and availability on WhatsApp" whenever price or stock is not set.

## 4. Add real photos
1. Photograph each window on a plain background, landscape (4:3).
2. Resize to about 1000 px wide and save as WebP or JPG under 120 KB (squoosh.app does both, free).
3. Put the file in `assets/img/`, e.g. `assets/img/s-1212.webp`.
4. In `products.js` set `image: "assets/img/s-1212.webp"` and a short `imageAlt`, e.g. "Charcoal grey sliding window with insect net".

Until a photo is set, the site draws a scale drawing of the window, labelled "Sample drawing". The drawings are also used on the 3D ring on the home page.

## 5. Switch from pre-launch to live
In `assets/config.js`:

```js
mode: "live",            // was "prelaunch"
prototypeTools: false,   // hides the prototype bar and test panel
```

Pre-launch shows the launch notice and "Register your interest on WhatsApp" on every button. Live shows "Chat on WhatsApp", "Enquire on WhatsApp" and "Open WhatsApp", plus stock and prices.

While `prototypeTools` is `true`, the **Test panel** button switches modes in your own browser only, lets you simulate a traffic source, and lists tracked events.

## 6. Factory address and fulfilment wording
In `assets/config.js`: `factory.address`, `factory.pickupHours`, and the three `fulfilment` sentences. Leave the address empty until it is confirmed; the site then says it will be shared on WhatsApp.

## 7. Tracking enquiries by source
- Add `?src=<code>` to every link you post:
  - Instagram bio: `https://yourdomain/whatsapp/?src=ig-bio`
  - Facebook post: `?src=fb-post` · Meta ads: `?src=ad-meta` · Google ads: `?src=ad-google` · QR code: `?src=qr`
- Add new codes and their labels under `sources` in `config.js`.
- The code and the button used are added to every WhatsApp message as a last line, e.g. `Ref: ig-bio / product-page`. Sales staff should copy it into the order log.
- Events sent: `page_view`, `catalogue_view`, `product_view`, `filter_change`, `landing_view`, and `whatsapp_click` (the enquiry action). Add your GA4 Measurement ID and/or Meta Pixel ID in `config.js` to send them. GA4 also receives `generate_lead`; Meta receives `Contact`.
- **Paid orders are tracked separately.** When a payment is confirmed, the sales team adds a row to `orders-log-template.csv` (or a Google Sheet with the same columns) including the `Ref` from the chat. Paid orders ÷ WhatsApp clicks by source gives the conversion rate per channel.

## 8. Publish
**Netlify (simplest, free tier):** sign in at netlify.com → Add new site → Deploy manually → drag the whole site folder in. Then Domain settings → add your domain (e.g. aluprime.ng) and follow the DNS steps. To update, drag the folder in again.

**Cloudflare Pages / GitHub Pages / cPanel:** upload the folder as-is. `yourdomain/whatsapp` serves `whatsapp/index.html` automatically.

After publishing, test on a phone: open `/whatsapp/?src=qr`, tap each path, and check the message that appears in WhatsApp.

## 9. Adding online payment and inventory later
- All product buttons get their link from `actions.enquireUrl()` in `assets/site.js`. Add a `checkoutUrl()` there (for example a Paystack payment page per product, or a cart) and switch the button in `card()` and `renderDetail()`.
- Stock and price come from `products.js`. To use live inventory, generate this file from Zoho Inventory (or fetch the same fields from an API) instead of editing it by hand. The pages do not need to change.
