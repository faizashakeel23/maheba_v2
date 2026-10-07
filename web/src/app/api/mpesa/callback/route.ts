import { NextResponse } from "next/server";
import { decideCallback, nextPeriod } from "@/lib/mpesa";

/**
 * Trusted backend: Safaricom Daraja callback.
 * Idempotent: duplicate callbacks for the same reference never double-extend.
 * Never activate a subscription before this verified confirmation.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // TODO: verify callback authenticity (signature / allowed IPs / OAuth),
  // then with SERVICE ROLE:
  //  1. look up payment_attempts by transaction_reference / CheckoutRequestID
  //  2. if already confirmed -> store raw + mark duplicate, return ok
  //  3. if success -> mark confirmed, create/extend subscriptions via nextPeriod(), audit
  //  4. if failure -> mark failed, store raw
  const reference: string =
    body?.transaction_reference ?? body?.CheckoutRequestID ?? "unknown";
  const success: boolean =
    body?.success === true || body?.ResultCode === 0 || body?.mock_success === true;
  const alreadyConfirmed: boolean = body?.already_confirmed === true;

  const outcome = decideCallback(reference, success, alreadyConfirmed);

  if (outcome.action === "confirm") {
    // Illustrate period math without touching a DB in mock mode.
    const { start, end } = nextPeriod(null, new Date());
    return NextResponse.json({
      ok: true,
      action: "confirm",
      reference,
      period: { start: start.toISOString(), end: end.toISOString() },
    });
  }

  return NextResponse.json({ ok: true, ...outcome });
}
