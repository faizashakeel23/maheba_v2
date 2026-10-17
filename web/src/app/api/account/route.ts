import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

const accountSchema = z.object({
  display_name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(160).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

/**
 * Self-service account settings: display name, login email, provider phone.
 * At least one field; email must stay unique across accounts.
 */
export async function PATCH(req: Request) {
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
  const body = await req.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (
    !parsed.success ||
    Object.keys(parsed.data).length === 0
  ) {
    return NextResponse.json(
      { error: "Send a new display name (2+), valid email and/or phone (7+)." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (d.email) {
    const email = d.email.toLowerCase();
    const taken = await sql`
      select 1 from users where email = ${email} and id != ${user.id}
    `;
    if (taken.length > 0) {
      return NextResponse.json(
        { error: "That email is taken — try another ♡" },
        { status: 409 }
      );
    }
    d.email = email;
  }
  await sql.begin(async (tx) => {
    if (d.display_name !== undefined || d.email !== undefined) {
      await tx`
        update users
        set display_name = coalesce(${d.display_name ?? null}, display_name),
            email = coalesce(${d.email ?? null}, email)
        where id = ${user.id}
      `;
    }
    if (d.phone !== undefined) {
      await tx`
        update providers set phone = ${d.phone}, updated_at = now()
        where user_id = ${user.id}
      `;
    }
  });
  const rows = (await sql`
    select u.id, u.email, u.display_name,
           (select phone from providers where user_id = u.id) as phone
    from users u where u.id = ${user.id}
  `) as unknown as {
    id: string;
    email: string;
    display_name: string | null;
    phone: string | null;
  }[];
  return NextResponse.json(rows[0]);
}
