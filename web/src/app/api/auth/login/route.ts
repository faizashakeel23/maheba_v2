import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  createSession,
  getSessionUser,
  sessionCookieHeader,
  verifyPassword,
} from "@/lib/auth-server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Email + password login. Sets the httpOnly session cookie and returns
 *  the raw token too (mobile stores it, sends `Authorization: Bearer`). */
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }
  const email = parsed.data.email.trim().toLowerCase();
  const rows = await sql`
    select id, email, role, display_name, password_hash
    from users where email = ${email}
  `;
  const row = rows[0] as
    | {
        id: string;
        email: string;
        role: "customer" | "provider" | "admin";
        display_name: string | null;
        password_hash: string | null;
      }
    | undefined;
  if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    // Same message either way — no account enumeration.
    return NextResponse.json(
      { error: "Wrong email or password, pretty." },
      { status: 401 }
    );
  }
  const token = await createSession(row.id);
  const user = await getSessionUser(token);
  const res = NextResponse.json({ ok: true, token, user });
  res.headers.append("Set-Cookie", sessionCookieHeader(token));
  return res;
}
