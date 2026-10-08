import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

/** Admin: every booking across all providers, newest first. */
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
    select a.id, a.provider_id, p.business_name, a.customer_name,
           a.customer_phone, a.starts_at, a.ends_at, a.notes, a.status,
           a.proposed_starts_at, a.decided_at, a.created_at
    from appointments a
    join providers p on p.id = a.provider_id
    order by a.created_at desc
    limit 200
  `;
  return NextResponse.json(rows);
}
