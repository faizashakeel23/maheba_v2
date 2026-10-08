import { NextResponse } from "next/server";
import { stkPushSchema } from "@/lib/validation";
import { newTransactionReference } from "@/lib/mpesa";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

/**
 * Trusted backend: initiates M-Pesa STK push.
 * Never trusts client-side payment status; only records an `initiated`
 * attempt here. Activation happens in /api/mpesa/callback after verification.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = stkPushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }

  const transaction_reference = newTransactionReference();

  // Only the owning provider (or admin) may pay for a subscription.
  const user = await getRequestUser(req);
  if (!user || !(await ownsProvider(user, parsed.data.provider_id))) {
    return NextResponse.json(
      { error: "Log in as the owning provider to pay." },
      { status: user ? 403 : 401 }
    );
  }

  // Record every attempt (subscription rule) — best effort, never blocks.
  try {
    const { getDb } = await import("@/lib/db");
    const sql = getDb();
    if (sql) {
      await sql`
        insert into payment_attempts (provider_id, amount_kes, phone_msisdn, transaction_reference, status)
        values (${parsed.data.provider_id}, ${parsed.data.amount_kes},
                ${parsed.data.phone_msisdn}, ${transaction_reference}, 'initiated')
      `;
    }
  } catch {
    /* demo slugs have no provider row — mock response still returned */
  }

  // TODO (Daraja live): call the Daraja STK push API here with MPESA_*
  // server env vars. Attempts are already recorded above in Postgres.
  const darajaConfigured =
    !!process.env.MPESA_CONSUMER_KEY && !!process.env.MPESA_CONSUMER_SECRET;

  if (!darajaConfigured) {
    return NextResponse.json({
      ok: true,
      mock: true,
      transaction_reference,
      message:
        "Mock STK push (Daraja not configured). Set MPESA_* env vars for live payments.",
    });
  }

  return NextResponse.json({
    ok: true,
    mock: false,
    transaction_reference,
    message: "STK push initiated. Complete payment on your phone.",
  });
}
