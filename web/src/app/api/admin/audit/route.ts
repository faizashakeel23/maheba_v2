import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/** Admin audit trail, newest first (same shape as the demo store entries). */
export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const rows = await sql`
    select created_at as at, admin_email as admin, action, target
    from admin_audit
    order by created_at desc
    limit 100
  `;
  return NextResponse.json(
    rows.map((a) => ({
      at: new Date(a.at as string).toISOString(),
      admin: a.admin as string,
      action: a.action as string,
      target: a.target as string,
    }))
  );
}
