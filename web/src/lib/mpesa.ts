import { randomUUID } from "node:crypto";
import { SUBSCRIPTION_DAYS } from "@/types";

/** Unique reference for every payment attempt (also DB UNIQUE). */
export function newTransactionReference(): string {
  return `MH-${Date.now().toString(36).toUpperCase()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

/**
 * New 30-day period. Extends from current period_end when still active,
 * otherwise starts now. Pure + unit-testable.
 */
export function nextPeriod(currentEnd: Date | null, now = new Date()): {
  start: Date;
  end: Date;
} {
  const start = currentEnd && currentEnd > now ? currentEnd : now;
  const end = new Date(start.getTime() + SUBSCRIPTION_DAYS * 86400_000);
  return { start, end };
}

export type CallbackOutcome =
  | { action: "confirm"; reference: string }
  | { action: "duplicate"; reference: string }
  | { action: "fail"; reference: string };

/**
 * Idempotent callback decision: only confirm once per reference.
 * Caller must persist every attempt and never double-extend.
 */
export function decideCallback(
  reference: string,
  success: boolean,
  alreadyConfirmed: boolean
): CallbackOutcome {
  if (alreadyConfirmed) return { action: "duplicate", reference };
  if (success) return { action: "confirm", reference };
  return { action: "fail", reference };
}
