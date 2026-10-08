/**
 * Demo payment-attempt log (localStorage). The provider dashboard records its
 * mock STK pushes here so the admin console can review them centrally.
 * Real history lives in `payment_attempts` (plain Postgres).
 */

export interface MockPayment {
  ref: string;
  provider_id: string;
  amount_kes: number;
  phone: string;
  status: "initiated" | "confirmed";
  created_at: string;
}

const KEY = "maheba_payments";

function read(): MockPayment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as MockPayment[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function getPayments(): MockPayment[] {
  return read().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function recordPayment(p: Omit<MockPayment, "created_at">) {
  const list = read();
  list.push({ ...p, created_at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
}
