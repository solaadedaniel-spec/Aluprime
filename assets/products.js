/* =====================================================================
   ALUPRIME CATALOGUE — one entry per window.
   - price: number in naira (VAT included) once approved, otherwise null.
     null shows "Confirm price and availability on WhatsApp".
   - stock: "in_stock" | "made_to_order" | "preorder" | null (unconfirmed).
   - readyText: optional short promise shown with stock, e.g. "Ready in 48 hours".
   - image: path to a real photo (WebP or JPG, about 1000 px wide, under 120 KB),
     relative to the site root, e.g. "assets/img/s-1212.webp". Leave "" to show
     the scale drawing. Set sample:false once the product and photo are real.
   - frameWidthMm / frameHeightMm: outside size of the window frame.
   ===================================================================== */
window.ALUPRIME_PRODUCTS = [
  {
    code: "S-1212",
    name: "Sliding window 1200",
    type: "sliding",
    frameWidthMm: 1180,
    frameHeightMm: 1180,
    panels: 2,
    openingStyle: "Two sliding panels with a sliding insect net",
    finish: "Charcoal grey powder coat",
    glass: "5 mm clear glass",
    includes: ["Rollers and two locks", "Sliding insect net", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Bedrooms",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  },
  {
    code: "S-1512",
    name: "Sliding window 1500",
    type: "sliding",
    frameWidthMm: 1480,
    frameHeightMm: 1180,
    panels: 2,
    openingStyle: "Two sliding panels with a sliding insect net",
    finish: "Charcoal grey powder coat",
    glass: "5 mm clear glass",
    includes: ["Rollers and two locks", "Sliding insect net", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Large bedrooms",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  },
  {
    code: "S-1812",
    name: "Sliding window 1800",
    type: "sliding",
    frameWidthMm: 1780,
    frameHeightMm: 1180,
    panels: 2,
    openingStyle: "Two sliding panels with a sliding insect net",
    finish: "Charcoal grey powder coat",
    glass: "5 mm clear glass",
    includes: ["Rollers and two locks", "Sliding insect net", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Living rooms",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  },
  {
    code: "S-1209",
    name: "Sliding window 1200 kitchen",
    type: "sliding",
    frameWidthMm: 1180,
    frameHeightMm: 880,
    panels: 2,
    openingStyle: "Two sliding panels with a sliding insect net",
    finish: "Charcoal grey powder coat",
    glass: "5 mm clear glass",
    includes: ["Rollers and two locks", "Sliding insect net", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Kitchens, above the worktop",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  },
  {
    code: "P-0606",
    name: "Projected toilet window 600",
    type: "projected",
    frameWidthMm: 580,
    frameHeightMm: 580,
    panels: 1,
    openingStyle: "Top-hung, opens outward at the bottom",
    finish: "Charcoal grey powder coat",
    glass: "5 mm obscure (frosted) glass for privacy",
    includes: ["Friction stays and handle", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Toilets and bathrooms",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  },
  {
    code: "C-0612",
    name: "Casement window 600",
    type: "casement",
    frameWidthMm: 580,
    frameHeightMm: 1180,
    panels: 1,
    openingStyle: "Side-hung, opens outward like a door",
    finish: "Charcoal grey powder coat",
    glass: "5 mm clear glass",
    includes: ["Hinges and handle", "Gaskets and weather seals", "Fixing kit: screws, wall plugs and packers"],
    useCase: "Stairwells and narrow walls",
    image: "", imageAlt: "",
    price: null, stock: null, readyText: "",
    sample: true
  }
];

/* Labels for window types used in filters and pages. */
window.ALUPRIME_TYPES = {
  sliding: "Sliding",
  projected: "Projected (top-hung)",
  casement: "Casement (side-hung)"
};
