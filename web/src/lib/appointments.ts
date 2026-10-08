import type { Appointment, AppointmentStatus } from "@/types";

const KEY = "maheba_appointments";

function uid(): string {
  return `appt-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function inDays(days: number, hour: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seed(): Appointment[] {
  return [
    {
      id: "appt-seed-1",
      provider_id: "glam-by-zawadi",
      customer_name: "Aisha M",
      customer_phone: "254722111222",
      starts_at: inDays(1, 10),
      ends_at: null,
      notes: "Bridal trial — soft glam ♡",
      status: "pending",
      proposed_starts_at: null,
      decided_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "appt-seed-2",
      provider_id: "glam-by-zawadi",
      customer_name: "Brian K",
      customer_phone: "254733444555",
      starts_at: inDays(2, 14),
      ends_at: null,
      notes: "Party glam for 2",
      status: "pending",
      proposed_starts_at: null,
      decided_at: null,
      created_at: new Date().toISOString(),
    },
  ];
}

function loadAll(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Appointment[];
  } catch {
    return seed();
  }
}

function saveAll(list: Appointment[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAppointments(providerId: string): Appointment[] {
  return getAllAppointments()
    .filter((a) => a.provider_id === providerId)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

/** All bookings across every provider — for the admin console. */
export function getAllAppointments(): Appointment[] {
  return loadAll().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function createAppointment(input: {
  provider_id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  notes: string;
}): Appointment {
  const appt: Appointment = {
    id: uid(),
    provider_id: input.provider_id,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    starts_at: input.starts_at,
    ends_at: null,
    notes: input.notes ?? "",
    status: "pending",
    proposed_starts_at: null,
    decided_at: null,
    created_at: new Date().toISOString(),
  };
  const all = loadAll();
  all.push(appt);
  saveAll(all);
  return appt;
}

export type Decision =
  | { kind: "accept" }
  | { kind: "decline" }
  | { kind: "propose"; proposed_starts_at: string }
  | { kind: "confirm_new_time" }
  | { kind: "cancel" };

/** Provider decision transitions. Returns updated appointment or null. */
export function decideAppointment(
  id: string,
  decision: Decision
): Appointment | null {
  const all = loadAll();
  const appt = all.find((a) => a.id === id);
  if (!appt) return null;
  const now = new Date().toISOString();

  const setStatus = (s: AppointmentStatus) => {
    appt.status = s;
    appt.decided_at = now;
  };

  switch (decision.kind) {
    case "accept":
      if (appt.status !== "pending" && appt.status !== "rescheduled")
        return null;
      if (appt.status === "rescheduled" && appt.proposed_starts_at) {
        appt.starts_at = appt.proposed_starts_at;
        appt.proposed_starts_at = null;
      }
      setStatus("accepted");
      break;
    case "decline":
      if (appt.status !== "pending" && appt.status !== "rescheduled")
        return null;
      setStatus("declined");
      break;
    case "propose":
      if (appt.status !== "pending" && appt.status !== "rescheduled")
        return null;
      if (Date.parse(decision.proposed_starts_at) <= Date.now()) return null;
      appt.proposed_starts_at = decision.proposed_starts_at;
      setStatus("rescheduled");
      break;
    case "confirm_new_time":
      if (appt.status !== "rescheduled" || !appt.proposed_starts_at)
        return null;
      appt.starts_at = appt.proposed_starts_at;
      appt.proposed_starts_at = null;
      setStatus("accepted");
      break;
    case "cancel":
      if (appt.status === "declined" || appt.status === "cancelled")
        return null;
      setStatus("cancelled");
      break;
  }
  saveAll(all);
  return appt;
}

export function statusLabel(s: AppointmentStatus): string {
  switch (s) {
    case "pending":
      return "Pending ♡";
    case "accepted":
      return "Accepted ✿";
    case "declined":
      return "Declined";
    case "rescheduled":
      return "New time proposed";
    case "cancelled":
      return "Cancelled";
  }
}
