"use client";

import type { Appointment, Provider } from "@/types";

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Client-side API wrappers. Every function is API-first with a local
 * fallback: `null` / `offline: true` means the database/API is unreachable
 * and the caller should use the localStorage demo store instead.
 */

export async function fetchProviders(): Promise<Provider[] | null> {
  try {
    const res = await fetch("/api/providers", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as Provider[]) : null;
  } catch {
    return null;
  }
}

/** A single visible provider. `undefined` = not found (404). */
export async function fetchProviderById(
  id: string
): Promise<Provider | null | undefined> {
  try {
    const res = await fetch(`/api/providers/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return undefined;
    if (!res.ok) return null;
    return (await readJson(res)) as Provider;
  } catch {
    return null;
  }
}

export type BookingResult =
  | { ok: true; booking: Appointment }
  | { ok: false; error: string; offline?: boolean };

export type DecisionInput =
  | { kind: "accept" }
  | { kind: "decline" }
  | { kind: "propose"; proposed_starts_at: string }
  | { kind: "confirm_new_time" }
  | { kind: "cancel" };

/** Provider join submission (creates login account too).
 *  Offline flag → save to the demo store. */
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
}): Promise<{ ok: true; id: string } | { ok: false; error: string; offline?: boolean }> {
  try {
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await readJson(res)) as { error?: string; id?: string } | null;
    if (!res.ok) {
      if (res.status === 503) return { ok: false, error: "", offline: true };
      return { ok: false, error: data?.error ?? "Submission failed, pretty." };
    }
    return { ok: true, id: String(data?.id ?? "") };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

/** Admin: all providers. Null = API unreachable. */
export async function fetchAdminProviders(): Promise<Provider[] | null> {
  try {
    const res = await fetch("/api/admin/providers", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as Provider[]) : null;
  } catch {
    return null;
  }
}

/** Admin: approve / reject / suspend. Offline flag → use the demo store. */
export async function decideProvider(
  id: string,
  status: "approved" | "rejected" | "suspended",
  admin: string
): Promise<{ ok: true } | { ok: false; error: string; offline?: boolean }> {
  try {
    const res = await fetch(
      `/api/admin/providers/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin }),
      }
    );
    const data = (await readJson(res)) as { error?: string } | null;
    if (!res.ok) {
      if (res.status === 503) return { ok: false, error: "", offline: true };
      return { ok: false, error: data?.error ?? "Decision failed." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

export interface AuditEntry {
  at: string;
  admin: string;
  action: string;
  target: string;
}

/** Admin audit trail. Null = API unreachable. */
export async function fetchAudit(): Promise<AuditEntry[] | null> {
  try {
    const res = await fetch("/api/admin/audit", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as AuditEntry[]) : null;
  } catch {
    return null;
  }
}
/** Provider's appointments, earliest first. Null = API unreachable. */
export async function fetchAppointments(
  providerId: string
): Promise<Appointment[] | null> {
  try {
    const res = await fetch(
      `/api/appointments?provider_id=${encodeURIComponent(providerId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as Appointment[]) : null;
  } catch {
    return null;
  }
}

/** Provider decision on a booking. Offline flag → use the demo store. */
export async function decideBooking(
  id: string,
  decision: DecisionInput
): Promise<BookingResult> {
  try {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decision),
    });
    const data = (await readJson(res)) as { error?: string } | null;
    if (!res.ok) {
      if (res.status === 503) return { ok: false, error: "", offline: true };
      return { ok: false, error: data?.error ?? "Decision failed, pretty." };
    }
    return { ok: true, booking: data as Appointment };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}
/** Guest booking. Offline flag → save to the demo store instead. */
export async function postBooking(input: {
  provider_id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  notes: string;
}): Promise<BookingResult> {
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await readJson(res)) as { error?: string } | null;
    if (!res.ok) {
      if (res.status === 503)
        return { ok: false, error: "", offline: true };
      return { ok: false, error: data?.error ?? "Booking failed, pretty." };
    }
    return { ok: true, booking: data as Appointment };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

/** Admin: every booking. Null = API unreachable. */
export async function fetchAllAppointments(): Promise<
  (Appointment & { business_name?: string })[] | null
> {
  try {
    const res = await fetch("/api/admin/appointments", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export interface AdminPayment {
  id: string;
  provider_id: string;
  business_name: string;
  amount_kes: number;
  phone_msisdn: string;
  transaction_reference: string;
  mpesa_receipt: string | null;
  status: string;
  created_at: string;
}

/** Admin: every payment attempt. Null = API unreachable. */
export async function fetchPayments(): Promise<AdminPayment[] | null> {
  try {
    const res = await fetch("/api/admin/payments", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

/** Admin: list admin users. Null = API unreachable. */
export async function fetchAdminUsers(): Promise<AdminUserRow[] | null> {
  try {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Admin: create another admin. */
export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not add admin." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Admin: remove an admin. Server guards self-removal + last admin. */
export async function deleteAdminUser(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not remove admin." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

export interface PortfolioPhoto {
  id: string;
  image_url: string;
  caption: string;
}

/** Provider: upload a portfolio photo (jpg/png/webp ≤5MB). */
export async function uploadPhoto(
  providerId: string,
  file: File,
  caption: string
): Promise<{ ok: true; photo: PortfolioPhoto } | { ok: false; error: string }> {
  try {
    const form = new FormData();
    form.append("provider_id", providerId);
    form.append("caption", caption);
    form.append("file", file);
    const res = await fetch("/api/portfolio", { method: "POST", body: form });
    const data = (await readJson(res)) as
      | (Partial<PortfolioPhoto> & { error?: string })
      | null;
    if (!res.ok || !data?.id) {
      return { ok: false, error: data?.error ?? "Upload failed, pretty." };
    }
    return {
      ok: true,
      photo: {
        id: String(data.id),
        image_url: String(data.image_url ?? ""),
        caption: String(data.caption ?? ""),
      },
    };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Provider: my portfolio photos. Null = unreachable. */
export async function fetchPhotos(
  providerId: string
): Promise<PortfolioPhoto[] | null> {
  try {
    const res = await fetch(
      `/api/portfolio?provider_id=${encodeURIComponent(providerId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as PortfolioPhoto[]) : null;
  } catch {
    return null;
  }
}

/** Provider: delete a portfolio photo. */
export async function deletePhoto(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/portfolio/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not delete photo." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Admin: run the subscription expiry sweep now. */
export async function runExpirySweep(): Promise<
  { ok: true; expired: number } | { ok: false; error: string }
> {
  try {
    const res = await fetch("/api/admin/expire", { method: "POST" });
    const data = (await readJson(res)) as {
      expired?: number;
      error?: string;
    } | null;
    if (!res.ok) {
      return { ok: false, error: data?.error ?? "Sweep failed." };
    }
    return { ok: true, expired: Number(data?.expired ?? 0) };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Admin: flip the ID-verified blue tick. Offline flag → no demo fallback. */
export async function setIdVerified(
  id: string,
  verified: boolean
): Promise<{ ok: true } | { ok: false; error: string; offline?: boolean }> {
  try {
    const res = await fetch(
      `/api/admin/providers/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_verified: verified }),
      }
    );
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      if (res.status === 503)
        return { ok: false, error: "", offline: true };
      return { ok: false, error: data?.error ?? "Could not update tick." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "", offline: true };
  }
}

export interface IdStatus {
  id_verified: boolean;
  submitted: boolean;
}

/** View URL for a provider's ID document (cookie-authenticated). */
export function idDocUrl(providerId: string): string {
  return `/api/id-docs/${encodeURIComponent(providerId)}`;
}

/** Owner/admin: has ID been submitted + is the tick on? Null = unreachable. */
export async function fetchIdStatus(
  providerId: string
): Promise<IdStatus | null> {
  try {
    const res = await fetch(
      `/api/id-docs?provider_id=${encodeURIComponent(providerId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await readJson(res)) as Partial<IdStatus> | null;
    if (!data) return null;
    return {
      id_verified: data.id_verified ?? false,
      submitted: data.submitted ?? false,
    };
  } catch {
    return null;
  }
}

/** Provider: submit (or re-submit) an ID document for verification. */
export async function uploadIdDocument(
  providerId: string,
  file: File
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const form = new FormData();
    form.append("provider_id", providerId);
    form.append("file", file);
    const res = await fetch("/api/id-docs", { method: "POST", body: form });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Upload failed, pretty." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

export interface FeedPost {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Public: a provider's feed posts. Null = unreachable. */
export async function fetchPosts(
  providerId: string
): Promise<FeedPost[] | null> {
  try {
    const res = await fetch(
      `/api/providers/${encodeURIComponent(providerId)}/posts`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as FeedPost[]) : null;
  } catch {
    return null;
  }
}

/** Owner: publish a feed post. */
export async function createPost(
  providerId: string,
  body: string
): Promise<{ ok: true; post: FeedPost } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `/api/providers/${encodeURIComponent(providerId)}/posts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
    const data = (await readJson(res)) as
      | (Partial<FeedPost> & { error?: string })
      | null;
    if (!res.ok || !data?.id) {
      return { ok: false, error: data?.error ?? "Could not publish." };
    }
    return {
      ok: true,
      post: {
        id: String(data.id),
        body: String(data.body ?? ""),
        image_url: (data.image_url as string) ?? null,
        created_at: String(data.created_at ?? ""),
        updated_at: String(data.updated_at ?? ""),
      },
    };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Owner: edit a feed post. */
export async function updatePost(
  id: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not save edit." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

/** Owner: delete a feed post. */
export async function deletePost(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await readJson(res)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not delete post." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}

export interface MyPayment {
  id: string;
  amount_kes: number;
  phone_msisdn: string;
  transaction_reference: string;
  mpesa_receipt: string | null;
  status: string;
  created_at: string;
}

/** Owner: my M-Pesa payment attempts. Null = unreachable. */
export async function fetchMyPayments(
  providerId: string
): Promise<MyPayment[] | null> {
  try {
    const res = await fetch(
      `/api/payments?provider_id=${encodeURIComponent(providerId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await readJson(res);
    return Array.isArray(data) ? (data as MyPayment[]) : null;
  } catch {
    return null;
  }
}

export interface AccountInfo {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
}

/** Self: update display name, login email and/or provider phone. */
export async function updateAccount(input: {
  display_name?: string;
  email?: string;
  phone?: string;
}): Promise<{ ok: true; account: AccountInfo } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await readJson(res)) as
      | (Partial<AccountInfo> & { error?: string })
      | null;
    if (!res.ok || !data?.id) {
      return { ok: false, error: data?.error ?? "Could not save settings." };
    }
    return {
      ok: true,
      account: {
        id: String(data.id),
        email: String(data.email ?? ""),
        display_name: data.display_name ?? null,
        phone: data.phone ?? null,
      },
    };
  } catch {
    return { ok: false, error: "Network error. Is the server running?" };
  }
}
