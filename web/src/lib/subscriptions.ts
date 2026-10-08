import { getDb } from "@/lib/db";

// NOTE: server-only — imports the DB client. Never import from client
// components; the admin route below is the entry point.
export interface ExpiryResult {
  expired: number;
  providerIds: string[];
}

/**
 * Subscription expiry sweep: flip past-due `active` rows to `expired`.
 * Idempotent — already-expired rows are untouched, so re-runs are safe.
 * Audit-logged only when something actually expired (the auto-timer runs
 * hourly; logging empty sweeps would flood the audit trail).
 */
export async function runExpiryCheck(
  actor: string
): Promise<ExpiryResult | null> {
  const sql = getDb();
  if (!sql) return null;
  const rows = (await sql`
    update subscriptions
    set status = 'expired'
    where status = 'active' and period_end < now()
    returning provider_id
  `) as unknown as { provider_id: string }[];
  const providerIds = [...new Set(rows.map((r) => r.provider_id))];
  if (rows.length > 0) {
    await sql`
      insert into admin_audit (admin_email, action, target)
      values (${actor}, 'expiry_check',
              ${`${rows.length} subscription(s): ${providerIds.slice(0, 10).join(", ")}`})
    `;
  }
  return { expired: rows.length, providerIds };
}
