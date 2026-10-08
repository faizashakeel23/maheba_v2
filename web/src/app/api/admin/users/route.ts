import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getRequestUser, hashPassword } from "@/lib/auth-server";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(4).max(128),
});

/** Admin: list admin users. */
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
    select id, email, display_name, created_at from users
    where role = 'admin' order by created_at
  `;
  return NextResponse.json(rows);
}

/** Admin: create another admin user. */
export async function POST(req: Request) {
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
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Name (2+), valid email and 4+ char password required." },
      { status: 400 }
    );
  }
  const email = parsed.data.email.trim().toLowerCase();
  const dupe = await sql`select 1 from users where email = ${email}`;
  if (dupe.length > 0) {
    return NextResponse.json(
      { error: "That email already has an account." },
      { status: 409 }
    );
  }
  const password_hash = await hashPassword(parsed.data.password);
  const rows = await sql`
    insert into users (email, role, display_name, password_hash)
    values (${email}, 'admin', ${parsed.data.name.trim()}, ${password_hash})
    returning id, email, display_name, created_at
  `;
  await sql`
    insert into admin_audit (admin_email, action, target)
    values (${user.email}, 'admin_create', ${email})
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
