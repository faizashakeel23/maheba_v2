export type ProviderCategory = "makeup" | "henna" | "baking";
export type ProviderStatus = "pending" | "approved" | "rejected" | "suspended";
export type SubscriptionStatus = "pending" | "active" | "expired";
export type PaymentStatus = "initiated" | "confirmed" | "failed" | "duplicate";
export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "rescheduled"
  | "cancelled";

export interface Service {
  id: string;
  title: string;
  description: string;
  price_kes: number;
  unit: string;
  image_url?: string;
}

export interface PortfolioItem {
  id: string;
  image_url: string;
  caption: string;
}

export interface Provider {
  id: string;
  business_name: string;
  category: ProviderCategory;
  location: string;
  bio: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  status: ProviderStatus;
  avatar: string;
  cover_image: string;
  rating: number;
  reviews_count: number;
  /** ISO date — listing is public only if approved AND this is in the future */
  subscription_end: string | null;
  services: Service[];
  portfolio: PortfolioItem[];
}

export interface Subscription {
  id: string;
  provider_id: string;
  period_start: string;
  period_end: string;
  status: SubscriptionStatus;
}

export interface PaymentAttempt {
  id: string;
  provider_id: string;
  amount_kes: number;
  phone_msisdn: string;
  transaction_reference: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Appointment {
  id: string;
  provider_id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string | null;
  notes: string;
  status: AppointmentStatus;
  proposed_starts_at: string | null;
  decided_at: string | null;
  created_at: string;
}

export const CATEGORIES: { value: ProviderCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "makeup", label: "Makeup" },
  { value: "henna", label: "Henna" },
  { value: "baking", label: "Baking" },
];

export const SUBSCRIPTION_PRICE_KES = 500;
export const SUBSCRIPTION_DAYS = 30;

/** Girlie color story per category — full Tailwind class names (no dynamic concat). */
export const CATEGORY_THEMES: Record<
  ProviderCategory,
  {
    label: string;
    /** gradient pills + buttons */
    gradient: string;
    /** category badge */
    badge: string;
    /** accent text (prices, links) */
    accent: string;
    /** avatar ring */
    ring: string;
    /** soft input/card bg tint */
    soft: string;
    /** glow shadow */
    glow: string;
  }
> = {
  makeup: {
    label: "Makeup",
    gradient: "from-rose-400 to-pink-500",
    badge: "bg-rose-100 text-rose-700",
    accent: "text-rose-600",
    ring: "ring-rose-200",
    soft: "bg-rose-50/60",
    glow: "shadow-rose-200",
  },
  henna: {
    label: "Henna",
    gradient: "from-violet-400 to-fuchsia-500",
    badge: "bg-violet-100 text-violet-700",
    accent: "text-violet-600",
    ring: "ring-violet-200",
    soft: "bg-violet-50/60",
    glow: "shadow-violet-200",
  },
  baking: {
    label: "Baking",
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-orange-100 text-orange-700",
    accent: "text-orange-600",
    ring: "ring-orange-200",
    soft: "bg-orange-50/60",
    glow: "shadow-orange-200",
  },
};

export const ALL_GRADIENT = "from-blush-400 to-fuchsia-400";
