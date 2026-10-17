import { MOCK_PROVIDERS } from "./mock-data";
import type { Provider, ProviderCategory, ProviderStatus } from "@/types";

const STATUS_KEY = "maheba_provider_status";
const CUSTOM_KEY = "maheba_custom_providers";
const PENDING_KEY = "maheba_pending";
const AUDIT_KEY = "maheba_audit";

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

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Demo provider store: static mocks + admin status overrides + approved joins. */
export function getAllProviders(): Provider[] {
  const overrides = read<Record<string, ProviderStatus>>(STATUS_KEY, {});
  const base = MOCK_PROVIDERS.map((p) =>
    overrides[p.id] ? { ...p, status: overrides[p.id] } : p
  );
  const custom = read<Provider[]>(CUSTOM_KEY, []);
  return [...base, ...custom];
}

export function setProviderStatus(
  id: string,
  status: ProviderStatus,
  adminEmail: string
) {
  const overrides = read<Record<string, ProviderStatus>>(STATUS_KEY, {});
  overrides[id] = status;
  write(STATUS_KEY, overrides);
  logAudit(adminEmail, status === "approved" ? "approve" : "reject", id);
}

const CATEGORY_COVER: Record<ProviderCategory, { cover: string; avatar: string }> = {
  makeup: { cover: "/images/makeup/m3.jpg", avatar: "/images/makeup/m3.jpg" },
  henna: { cover: "/images/henna/h2.jpg", avatar: "/images/henna/h2.jpg" },
  baking: { cover: "/images/baking/b9.jpg", avatar: "/images/baking/b9.jpg" },
};

export function getJoinSubmissions(): JoinSubmission[] {
  const list = read<JoinSubmission[]>(PENDING_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Approve a join submission → full provider (visible once subscribed). */
export function approveSubmission(sub: JoinSubmission, adminEmail: string): Provider {
  const imgs = CATEGORY_COVER[sub.category];
  const provider: Provider = {
    id: sub.id,
    business_name: sub.business_name,
    category: sub.category,
    location: sub.location,
    bio: sub.bio || "New on Maheba ♡",
    phone: sub.phone,
    whatsapp: sub.whatsapp,
    instagram: sub.instagram || "",
    status: "approved",
    id_verified: false,
    id_document_url: null,
    avatar: imgs.avatar,
    cover_image: imgs.cover,
    rating: 5.0,
    reviews_count: 0,
    // Demo: approved joins start with an active subscription period.
    subscription_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
    services: [],
    portfolio: [],
    posts: [],
  };
  const custom = read<Provider[]>(CUSTOM_KEY, []);
  write(CUSTOM_KEY, [...custom, provider]);
  write(
    PENDING_KEY,
    getJoinSubmissions().filter((s) => s.id !== sub.id)
  );
  logAudit(adminEmail, "approve", sub.business_name);
  return provider;
}

export function rejectSubmission(sub: JoinSubmission, adminEmail: string) {
  write(
    PENDING_KEY,
    getJoinSubmissions().filter((s) => s.id !== sub.id)
  );
  logAudit(adminEmail, "reject", sub.business_name);
}

export function logAudit(admin: string, action: string, target: string) {
  const log = read<AuditEntry[]>(AUDIT_KEY, []);
  write(AUDIT_KEY, [
    { at: new Date().toISOString(), admin, action, target },
    ...log,
  ].slice(0, 100));
}

export function getAudit(): AuditEntry[] {
  return read<AuditEntry[]>(AUDIT_KEY, []);
}
