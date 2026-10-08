import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

/** Admin: every M-Pesa payment attempt, newest first. */
export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Admins only." },
      { status: user ? 403 : 401 }
    );
  }
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const rows = await sql`
    select pa.id, pa.provider_id, p.business_name, pa.amount_kes,
           pa.phone_msisdn, pa.transaction_reference, pa.mpesa_receipt,
           pa.status, pa.created_at
    from payment_attempts pa
    join providers p on p.id = pa.provider_id
    order by pa.created_at desc
    limit 200
  `;
  return NextResponse.json(rows);
}
