// NOTE: server-only by convention — never import this from client
// components. It reads DATABASE_URL, which has no NEXT_PUBLIC_ prefix.
import postgres, { type Sql } from "postgres";

let cached: Sql | null | undefined;

/**
 * Local Postgres connection (Docker). Server-only — never import from
 * client components. Returns null when DATABASE_URL is not set, in which
 * case callers should fall back to the localStorage demo store.
 */
export function getDb(): Sql | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = null;
    return cached;
  }
  cached = postgres(url, { max: 5 });
  return cached;
}

export const isDbConfigured = !!process.env.DATABASE_URL;
