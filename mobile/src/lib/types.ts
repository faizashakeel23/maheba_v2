export type ProviderCategory = "makeup" | "henna" | "baking";
export type ProviderStatus = "pending" | "approved" | "rejected";
export type SubscriptionStatus = "pending" | "active" | "expired";
export type PaymentStatus = "initiated" | "confirmed" | "failed" | "duplicate";
export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "rescheduled"
  | "cancelled";

/** Local bundled photo (require()/import of a .jpg asset). */
export type Img = number;

export interface Service {
  id: string;
  title: string;
  description: string;
  price_kes: number;
  unit: string;
}

export interface PortfolioItem {
  id: string;
  image: Img;
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
  avatar: Img;
  cover_image: Img;
  rating: number;
  reviews_count: number;
  subscription_end: string | null;
  services: Service[];
  portfolio: PortfolioItem[];
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

export interface JoinSubmission {
  id: string;
  business_name: string;
  category: ProviderCategory;
  location: string;
  bio: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

export interface AuditEntry {
  at: string;
  admin: string;
  action: string;
  target: string;
}

export const CATEGORIES: { value: ProviderCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "makeup", label: "Makeup" },
  { value: "henna", label: "Henna" },
  { value: "baking", label: "Baking" },
];

export const SUBSCRIPTION_PRICE_KES = 500;
export const SUBSCRIPTION_DAYS = 30;
