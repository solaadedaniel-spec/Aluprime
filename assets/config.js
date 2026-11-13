/* =====================================================================
   ALUPRIME SITE SETTINGS — edit this file to update the business details.
   Everything customer-facing that changes often lives here or in
   products.js. No other file needs editing for routine updates.
   ===================================================================== */
window.ALUPRIME_CONFIG = {

  /* "prelaunch" = buttons say "Register your interest on WhatsApp" and a
     launch notice shows on every page.
     "live"      = product enquiry and ordering actions are shown. */
  mode: "prelaunch",

  /* Official WhatsApp Business number, INTERNATIONAL FORMAT, DIGITS ONLY.
     Example for a Nigerian number 0801 234 5678 -> "2348012345678".
     Leave "" until the number is confirmed: WhatsApp will then open with
     the message ready and ask the customer to choose a contact. */
  whatsappNumber: "",

  /* Shown to customers. Leave "" until confirmed. */
  factory: {
    address: "",          // e.g. "12 Example Road, Ikeja, Lagos"
    mapLink: "",          // e.g. a Google Maps share link
    pickupHours: ""       // e.g. "Monday to Friday, 9am to 5pm"
  },

  /* Fulfilment copy. Change wording here, not in the pages. */
  fulfilment: {
    pickup: "Collect your windows from our factory in Lagos. We confirm the pickup time on WhatsApp.",
    delivery: "We deliver to addresses within Lagos only, including building-material markets and loading points. The delivery fee depends on your area and is confirmed on WhatsApp.",
    onward: "From pickup or your Lagos delivery address, you arrange onward transport to your site with your other building materials."
  },

  /* Launch notice used in pre-launch mode. */
  launchNotice: "Aluprime is preparing to launch in 2027. Register your interest on WhatsApp and we will tell you when the first windows are ready.",

  /* Size-check guide: how much bigger than the frame the finished opening
     should be (mm). PROVISIONAL until confirmed by Brand Aluminium installers. */
  fit: { minGapMm: 10, maxGapMm: 40 },

  /* Analytics. Leave "" to switch off. WhatsApp clicks are sent as
     "whatsapp_click" (GA4 also gets "generate_lead"; Meta gets "Contact"). */
  analytics: {
    ga4MeasurementId: "",   // e.g. "G-XXXXXXX"
    metaPixelId: "",        // e.g. "1234567890"
    logToConsole: true
  },

  /* Traffic sources. Add ?src=<code> to any link you post, e.g.
     https://aluprime.ng/whatsapp/?src=ig-bio . The code is added to the
     WhatsApp message as "Ref:" so the sales team can see where it came from. */
  sources: {
    "ig-bio": "Instagram bio",
    "ig-post": "Instagram post",
    "fb-post": "Facebook post",
    "ad-meta": "Paid ad (Facebook/Instagram)",
    "ad-google": "Paid ad (Google)",
    "tiktok": "TikTok",
    "qr": "QR code",
    "website": "Website (direct)"
  },
  defaultSource: "website",

  /* PROTOTYPE ONLY. Shows the prototype notice and the test panel
     (switch modes, view tracked events). Set to false before going live. */
  prototypeTools: true
};
