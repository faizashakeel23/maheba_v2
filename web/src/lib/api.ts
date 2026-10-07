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
