import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

/** Owner/admin: one provider's M-Pesa payment attempts, newest first. */
export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const provider_id =
    new URL(req.url).searchParams.get("provider_id")?.trim() ?? "";
  if (!provider_id) {
    return NextResponse.json(
      { error: "provider_id is required." },
      { status: 400 }
    );
  }
  if (!(await ownsProvider(user, provider_id))) {
    return NextResponse.json({ error: "Not yours to view." }, { status: 403 });
  }
  const rows = await sql`
    select id, amount_kes, phone_msisdn, transaction_reference,
           mpesa_receipt, status, created_at
    from payment_attempts where provider_id = ${provider_id}
    order by created_at desc limit 100
  `;
  return NextResponse.json(rows);
}
