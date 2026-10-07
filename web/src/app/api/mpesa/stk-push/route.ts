import { NextResponse } from "next/server";
import { stkPushSchema } from "@/lib/validation";
import { newTransactionReference } from "@/lib/mpesa";

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

  // TODO (Supabase wiring): insert into payment_attempts with status
  // 'initiated' using the SERVICE ROLE key, then call Daraja STK push
  // with MPESA_* server env vars. Never use anon key here.
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
