import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Appointment, AuditEntry, Provider } from "./types";
import type { DemoUser } from "./auth";

/**
 * Backend client. API-first with local fallback: `null` / `offline: true`
 * means unreachable — callers use the AsyncStorage demo store instead.
 *
 * Base URL: physical devices can't reach your PC's `localhost`, so set it:
 *   EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:3000  (Expo Go on a phone)
 * Emulators reach the host at 10.0.2.2 (Android) — the default below.
 * Web (`expo start --web`) can use http://localhost:3000.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";

const TOKEN_KEY = "maheba_session_token";

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* demo mode survives without storage */
  }
}

/** NOTE: token lives in AsyncStorage (Expo Go compatible). For production,
 *  switch to expo-secure-store (requires a dev build, not Expo Go). */
export { setToken };

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** Authenticated fetch against the backend (Bearer when logged in). */
export async function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
  const headers = { ...(await authHeaders()), ...(opts?.headers ?? {}) };
  return fetch(`${API_BASE}${path}`, { ...opts, headers });
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// API providers carry web image paths — serve them as remote URIs.
function img(url: string | undefined | null): { uri: string } {
  return { uri: url ? `${API_BASE}${url}` : "" };
}

function mapProvider(p: Record<string, unknown>): Provider {
  const portfolio = (Array.isArray(p.portfolio) ? p.portfolio : []).map(
    (item: unknown) => {
      const it = item as { id: unknown; image_url: string; caption?: string };
      return { id: String(it.id), image: img(it.image_url), caption: it.caption ?? "" };
    }
  );
  const first =
    portfolio.length > 0 ? (portfolio[0].image as { uri: string }) : { uri: "" };
  return {
    id: String(p.id),
    business_name: String(p.business_name ?? ""),
    category: p.category as Provider["category"],
    location: String(p.location ?? ""),
    bio: String(p.bio ?? ""),
    phone: String(p.phone ?? ""),
    whatsapp: String(p.whatsapp ?? ""),
    instagram: String(p.instagram ?? ""),
    status: p.status as Provider["status"],
    avatar: first,
    cover_image: first,
    rating: Number(p.rating ?? 0),
    reviews_count: Number(p.reviews_count ?? 0),
    subscription_end: (p.subscription_end as string | null) ?? null,
    services: (Array.isArray(p.services) ? p.services : []).map((s: unknown) => {
      const sv = s as {
        id: unknown;
        title: string;
        description?: string;
        price_kes: number;
        unit?: string;
      };
      return {
        id: String(sv.id),
        title: sv.title,
        description: sv.description ?? "",
        price_kes: sv.price_kes,
        unit: sv.unit ?? "per session",
      };
    }),
    portfolio,
  };
}

export async function fetchProviders(): Promise<Provider[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    if (!res.ok) return null;
    const data = await readJson(res);
    if (!Array.isArray(data)) return null;
    return (data as Record<string, unknown>[]).map(mapProvider);
  } catch {
    return null;
  }
}

/** `undefined` = not found (404). */
export async function fetchProviderById(
  id: string
): Promise<Provider | null | undefined> {
  try {
    const res = await fetch(
      `${API_BASE}/api/providers/${encodeURIComponent(id)}`
    );
    if (res.status === 404) return undefined;
    if (!res.ok) return null;
    return mapProvider((await readJson(res)) as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; offline?: boolean };

function failure<T>(res: Response, data: unknown, fallback: string): ApiResult<T> {
  if (res.status === 503 || res.status === 0)
    return { ok: false, error: "", offline: true };
  const err =
    data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : fallback;
  return { ok: false, error: err };
}

export async function postBooking(input: {
  provider_id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  notes: string;
}): Promise<ApiResult<Appointment>> {
  try {
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await readJson(res);
    if (!res.ok) return failure(res, data, "Booking failed, pretty.");
    return { ok: true, data: data as Appointment };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

export async function fetchAppointments(
  providerId: string
): Promise<Appointment[] | null> {
  try {
    const res = await apiFetch(
      `/api/appointments?provider_id=${encodeURIComponent(providerId)}`
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as Appointment[]) : null;
  } catch {
    return null;
  }
}

export type DecisionInput =
  | { kind: "accept" }
  | { kind: "decline" }
  | { kind: "propose"; proposed_starts_at: string }
  | { kind: "confirm_new_time" }
  | { kind: "cancel" };

export async function decideBooking(
  id: string,
  decision: DecisionInput
): Promise<ApiResult<Appointment>> {
  try {
    const res = await apiFetch(
      `/api/appointments/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(decision) }
    );
    const data = await readJson(res);
    if (!res.ok) return failure(res, data, "Decision failed, pretty.");
    return { ok: true, data: data as Appointment };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

export async function submitJoin(input: {
  business_name: string;
  category: string;
  location: string;
  bio: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  password: string;
}): Promise<ApiResult<{ id: string }>> {
  try {
    const res = await fetch(`${API_BASE}/api/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await readJson(res)) as { error?: string; id?: string } | null;
    if (!res.ok) return failure(res, data, "Submission failed, pretty.");
    // Join auto-logs-in: the session cookie is web-only, so log in for the token.
    const login = await apiLogin(input.email, input.password);
    if (!login.ok) return { ok: true, data: { id: String(data?.id ?? "") } };
    return { ok: true, data: { id: String(data?.id ?? "") } };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

/** Validate + normalize a /api/auth/* user payload. Null when logged out. */
export function toUser(raw: unknown): DemoUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (u.role !== "provider" && u.role !== "admin") return null;
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    role: u.role,
    providerId: u.providerId == null ? null : String(u.providerId),
    businessName: String(u.businessName ?? ""),
  };
}

export async function apiLogin(
  email: string,
  password: string
): Promise<ApiResult<DemoUser>> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await readJson(res)) as {
      error?: string;
      token?: string;
      user?: unknown;
    } | null;
    if (!res.ok) return failure(res, data, "Login failed, pretty.");
    if (data?.token) await setToken(data.token);
    const user = toUser(data?.user);
    if (!user) return { ok: false, error: "Login failed, pretty." };
    return { ok: true, data: user };
  } catch {
    return { ok: false, error: "Network error. Is the API reachable?", offline: true };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* already out */
  }
  await setToken(null);
}

export async function apiSession(): Promise<DemoUser | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await apiFetch("/api/auth/session");
    if (!res.ok) return null;
    const data = (await readJson(res)) as { user?: unknown } | null;
    return toUser(data?.user);
  } catch {
    return null;
  }
}

export async function fetchAdminProviders(): Promise<Provider[] | null> {
  try {
    const res = await apiFetch("/api/admin/providers");
    if (!res.ok) return null;
    const data = await readJson(res);
    if (!Array.isArray(data)) return null;
    return (data as Record<string, unknown>[]).map(mapProvider);
  } catch {
    return null;
  }
}

export async function decideProvider(
  id: string,
  status: "approved" | "rejected"
): Promise<{ ok: true } | { ok: false; error: string; offline?: boolean }> {
  try {
    const res = await apiFetch(
      `/api/admin/providers/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    );
    const data = await readJson(res);
    if (!res.ok) return failure(res, data, "Decision failed.");
    return { ok: true };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

export async function fetchAudit(): Promise<AuditEntry[] | null> {
  try {
    const res = await apiFetch("/api/admin/audit");
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as AuditEntry[]) : null;
  } catch {
    return null;
  }
}
