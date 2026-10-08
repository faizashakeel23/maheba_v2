import { runExpiryCheck } from "@/lib/subscriptions";

const HOUR_MS = 3600_000;

/**
 * Server boot hook: run the subscription expiry sweep on a schedule.
 * Catches up 30s after boot (covers downtime), then hourly. Single-server
 * only — on multi-instance hosting, move this to the platform cron
 * (e.g. Vercel Cron) hitting POST /api/admin/expire instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const sweep = async () => {
    try {
      const r = await runExpiryCheck("system (auto)");
      if (r && r.expired > 0) {
        console.log(`[expiry] marked ${r.expired} subscription(s) expired`);
      }
    } catch (e) {
      console.error("[expiry] sweep failed", e);
    }
  };
  setTimeout(sweep, 30_000);
  const timer = setInterval(sweep, HOUR_MS);
  (timer as unknown as { unref?: () => void }).unref?.();
}
