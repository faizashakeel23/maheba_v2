import { SUBSCRIPTION_DAYS } from "./types";

/** Unique reference for every payment attempt (also DB UNIQUE). */
export function newTransactionReference(): string {
  const rand = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MH-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/** New 30-day period, extending from the current one when still active. */
export function nextPeriod(
  currentEnd: Date | null,
  now = new Date()
): { start: Date; end: Date } {
  const start = currentEnd && currentEnd > now ? currentEnd : now;
  const end = new Date(start.getTime() + SUBSCRIPTION_DAYS * 86400_000);
  return { start, end };
}
