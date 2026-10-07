import { BAKING, HENNA, MAKEUP } from "./images";
import type { Img, PortfolioItem, Provider } from "./types";

function portfolio(imgs: Img[], captions: string[], prefix: string): PortfolioItem[] {
  return imgs.map((image, i) => ({
    id: `${prefix}-${i + 1}`,
    image,
    caption: captions[i % captions.length],
  }));
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

const [m1, m2, m3, m4, m5, m6] = MAKEUP;
const [h1, h2, h3, h4, h5, h6, h7, h8] = HENNA;
const [b1, b2, b3, b4, b5, b6, b7, b8, b9] = BAKING;

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: "glam-by-zawadi",
    business_name: "Glam by Zawadi",
    category: "makeup",
    location: "Nyali",
    bio: "Bridal & party makeup artist. 6 yrs experience, home service available. Trial sessions available.",
    phone: "+254712345001",
    whatsapp: "254712345001",
    instagram: "@glambyzawadi",
    status: "approved",
    avatar: m1,
    cover_image: m2,
    rating: 4.9,
    reviews_count: 132,
    subscription_end: daysFromNow(18),
    services: [
      { id: "s1", title: "Bridal glam (full)", description: "Trial + wedding day, lashes included", price_kes: 8000, unit: "per session" },
      { id: "s2", title: "Party glam", description: "Soft glam / full glam for events", price_kes: 3500, unit: "per face" },
      { id: "s3", title: "Makeup lesson 1:1", description: "2-hour personal lesson with kit list", price_kes: 5000, unit: "per session" },
    ],
    portfolio: portfolio(
      [m1, m2, m3, m4, m5, m6],
      ["Bridal soft glam", "Kit essentials", "Party full glam", "Detail work", "Glam session", "Finishing touches"],
      "zawadi"
    ),
  },
  {
    id: "face-by-amara",
    business_name: "Face by Amara",
    category: "makeup",
    location: "Bamburi",
    bio: "Bold editorial + Swahili bridal looks. Studio in Bamburi, travels to Diani & Malindi.",
    phone: "+254712345002",
    whatsapp: "254712345002",
    instagram: "@facebyamara",
    status: "approved",
    avatar: m4,
    cover_image: m5,
    rating: 4.8,
    reviews_count: 89,
    subscription_end: daysFromNow(6),
    services: [
      { id: "s1", title: "Bridal package", description: "Bride + 2 bridesmaids", price_kes: 15000, unit: "per package" },
      { id: "s2", title: "Engagement glam", description: "HD makeup, hairstyling add-on", price_kes: 4000, unit: "per face" },
    ],
    portfolio: portfolio(
      [m4, m5, m6, m1, m2, m3],
      ["Editorial look", "Bridal glow", "Shoot day", "Soft beat", "Bold lip", "Skin prep"],
      "amara"
    ),
  },
  {
    id: "henna-by-layla",
    business_name: "Henna by Layla",
    category: "henna",
    location: "Old Town",
    bio: "Bridal henna specialist — intricate coastal designs, organic cones. Home visits + Eid bookings.",
    phone: "+254712345003",
    whatsapp: "254712345003",
    instagram: "@hennabylayla",
    status: "approved",
    avatar: h3,
    cover_image: h1,
    rating: 5.0,
    reviews_count: 210,
    subscription_end: daysFromNow(25),
    services: [
      { id: "s1", title: "Bridal henna (hands + feet)", description: "Full intricate design, 4–6 hrs", price_kes: 6000, unit: "per bride" },
      { id: "s2", title: "Party henna", description: "Simple elegant motifs per hand", price_kes: 800, unit: "per hand" },
      { id: "s3", title: "Eid / group bookings", description: "Per-person rate for 5+ guests", price_kes: 500, unit: "per person" },
    ],
    portfolio: portfolio(
      [h1, h2, h3, h4, h5, h6],
      ["Bridal hands", "Mehndi detail", "Cute motif", "Floral design", "Full hand", "Front & back"],
      "layla"
    ),
  },
  {
    id: "coastal-mehndi",
    business_name: "Coastal Mehndi",
    category: "henna",
    location: "Likoni",
    bio: "Fast, neat henna for weddings & festivals. Ferry-side studio, walk-ins welcome.",
    phone: "+254712345004",
    whatsapp: "254712345004",
    instagram: "@coastalmehndi",
    status: "approved",
    avatar: h8,
    cover_image: h7,
    rating: 4.7,
    reviews_count: 64,
    subscription_end: daysFromNow(11),
    services: [
      { id: "s1", title: "Simple hands", description: "Both hands front", price_kes: 1000, unit: "per set" },
      { id: "s2", title: "Bridal deluxe", description: "Hands + feet + touch-up", price_kes: 5500, unit: "per bride" },
    ],
    portfolio: portfolio(
      [h5, h6, h7, h8, h1, h2],
      ["Palm design", "Back hand", "Bridal set", "Guest design", "Festival hands", "Fine lines"],
      "mehndi"
    ),
  },
  {
    id: "sweet-oven",
    business_name: "Sweet Oven",
    category: "baking",
    location: "Kisauni",
    bio: "Custom cakes, cupcakes & Swahili treats. 48-hr notice, delivery available.",
    phone: "+254712345005",
    whatsapp: "254712345005",
    instagram: "@sweetoven",
    status: "approved",
    avatar: b6,
    cover_image: b1,
    rating: 4.9,
    reviews_count: 178,
    subscription_end: daysFromNow(29),
    services: [
      { id: "s1", title: "Custom birthday cake 1kg", description: "Vanilla/chocolate/red velvet + message", price_kes: 2800, unit: "per kg" },
      { id: "s2", title: "Wedding cake", description: "3-tier from, tasting included", price_kes: 25000, unit: "from" },
      { id: "s3", title: "Cupcakes box of 6", description: "Assorted flavours", price_kes: 1200, unit: "per box" },
    ],
    portfolio: portfolio(
      [b1, b2, b3, b4, b5, b6],
      ["Chocolate layer", "Celebration cake", "Sweet detail", "Berry topping", "Fresh bakes", "Cupcake box"],
      "oven"
    ),
  },
  {
    id: "pwani-cakes",
    business_name: "Pwani Cakes",
    category: "baking",
    location: "Nyali",
    bio: "Swahili wedding cakes & mahamri platters. Halal kitchen, bulk orders for events.",
    phone: "+254712345006",
    whatsapp: "254712345006",
    instagram: "@pwanicakes",
    status: "approved",
    avatar: b5,
    cover_image: b4,
    rating: 4.6,
    reviews_count: 52,
    subscription_end: daysFromNow(3),
    services: [
      { id: "s1", title: "Mahamri platter (20pc)", description: "Fresh morning delivery", price_kes: 900, unit: "per platter" },
      { id: "s2", title: "Coconut cake 1kg", description: "Signature pwani flavour", price_kes: 2500, unit: "per kg" },
    ],
    portfolio: portfolio(
      [b4, b5, b7, b8, b9, b2],
      ["Signature cake", "Morning bakes", "Bakery fresh", "Sweet box", "Custom order", "Weekend treats"],
      "pwani"
    ),
  },
  {
    id: "new-glam-pending",
    business_name: "New Glam (pending review)",
    category: "makeup",
    location: "Mtwapa",
    bio: "Awaiting admin approval.",
    phone: "+254712345007",
    whatsapp: "254712345007",
    instagram: "",
    status: "pending",
    avatar: m3,
    cover_image: m3,
    rating: 0,
    reviews_count: 0,
    subscription_end: daysFromNow(30),
    services: [],
    portfolio: [],
  },
  {
    id: "old-henna-expired",
    business_name: "Old Henna (expired)",
    category: "henna",
    location: "Changamwe",
    bio: "Subscription lapsed — hidden until renewed.",
    phone: "+254712345008",
    whatsapp: "254712345008",
    instagram: "",
    status: "approved",
    avatar: h4,
    cover_image: h4,
    rating: 4.5,
    reviews_count: 30,
    subscription_end: daysAgo(5),
    services: [],
    portfolio: [],
  },
];
