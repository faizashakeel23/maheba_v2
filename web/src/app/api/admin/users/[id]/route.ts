import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

/** Admin: remove an admin user. Never yourself, never the last one. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json(
      { error: "You can't remove yourself." },
      { status: 400 }
    );
  }
  const target = await sql`
    select id, email from users where id = ${id} and role = 'admin'
  `;
  const row = target[0] as { id: string; email: string } | undefined;
  if (!row) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }
  const count = await sql`select count(*)::int as n from users where role = 'admin'`;
  if ((count[0] as { n: number }).n <= 1) {
    return NextResponse.json(
      { error: "At least one admin must remain." },
      { status: 400 }
    );
  }
  await sql`delete from sessions where user_id = ${id}`;
  await sql`delete from users where id = ${id}`;
  await sql`
    insert into admin_audit (admin_email, action, target)
    values (${user.email}, 'admin_remove', ${row.email})
  `;
  return NextResponse.json({ ok: true });
}
