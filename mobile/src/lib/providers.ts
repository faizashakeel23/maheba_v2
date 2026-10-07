import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_PROVIDERS } from "./mock-data";
import { CATEGORY_COVER } from "./images";
import type {
  AuditEntry,
  JoinSubmission,
  Provider,
  ProviderStatus,
} from "./types";

const STATUS_KEY = "maheba_provider_status";
const CUSTOM_KEY = "maheba_custom_providers";
const PENDING_KEY = "maheba_pending";
const AUDIT_KEY = "maheba_audit";

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Demo provider store: static mocks + admin overrides + approved joins. */
export async function getAllProviders(): Promise<Provider[]> {
  const overrides = await read<Record<string, ProviderStatus>>(STATUS_KEY, {});
  const base = MOCK_PROVIDERS.map((p) =>
    overrides[p.id] ? { ...p, status: overrides[p.id] } : p
  );
  const custom = await read<Provider[]>(CUSTOM_KEY, []);
  return [...base, ...custom];
}

export async function setProviderStatus(
  id: string,
  status: ProviderStatus,
  adminEmail: string
) {
  const overrides = await read<Record<string, ProviderStatus>>(STATUS_KEY, {});
  overrides[id] = status;
  await write(STATUS_KEY, overrides);
  await logAudit(adminEmail, status === "approved" ? "approve" : "reject", id);
}

export async function getJoinSubmissions(): Promise<JoinSubmission[]> {
  const list = await read<JoinSubmission[]>(PENDING_KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function saveJoinSubmission(sub: JoinSubmission) {
  const list = await getJoinSubmissions();
  await write(PENDING_KEY, [...list, sub]);
}

export async function approveSubmission(
  sub: JoinSubmission,
  adminEmail: string
): Promise<Provider> {
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
    avatar: imgs.avatar,
    cover_image: imgs.cover,
    rating: 5.0,
    reviews_count: 0,
    subscription_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
    services: [],
    portfolio: [],
  };
  const custom = await read<Provider[]>(CUSTOM_KEY, []);
  await write(CUSTOM_KEY, [...custom, provider]);
  await write(
    PENDING_KEY,
    (await getJoinSubmissions()).filter((s) => s.id !== sub.id)
  );
  await logAudit(adminEmail, "approve", sub.business_name);
  return provider;
}

export async function rejectSubmission(sub: JoinSubmission, adminEmail: string) {
  await write(
    PENDING_KEY,
    (await getJoinSubmissions()).filter((s) => s.id !== sub.id)
  );
  await logAudit(adminEmail, "reject", sub.business_name);
}

export async function logAudit(admin: string, action: string, target: string) {
  const log = await read<AuditEntry[]>(AUDIT_KEY, []);
  await write(
    AUDIT_KEY,
    [{ at: new Date().toISOString(), admin, action, target }, ...log].slice(0, 100)
  );
}

export async function getAudit(): Promise<AuditEntry[]> {
  return read<AuditEntry[]>(AUDIT_KEY, []);
}
