import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

const editSchema = z.object({
  body: z.string().trim().min(1, "Write something first ♡").max(1000),
});

async function findPost(
  sql: NonNullable<ReturnType<typeof getDb>>,
  id: string
) {
  try {
    const rows = (await sql`
      select id, provider_id from provider_posts where id = ${id}
    `) as unknown as { id: string; provider_id: string }[];
    return rows[0] ?? null;
  } catch {
    return null; // e.g. malformed uuid
  }
}

/** Owner/admin: edit a post. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }
  const row = await findPost(sql, id);
  if (!row) {
    return NextResponse.json(
      { error: "Post not found." },
      { status: 404 }
    );
  }
  if (!(await ownsProvider(user, row.provider_id))) {
    return NextResponse.json({ error: "Not yours to edit." }, { status: 403 });
  }
  const updated = await sql`
    update provider_posts
    set body = ${parsed.data.body}, updated_at = now()
    where id = ${id}
    returning id, body, image_url, created_at, updated_at
  `;
  return NextResponse.json(updated[0]);
}

/** Owner/admin: delete a post. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  const row = await findPost(sql, id);
  if (!row) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!(await ownsProvider(user, row.provider_id))) {
    return NextResponse.json(
      { error: "Not yours to delete." },
      { status: 403 }
    );
  }
  await sql`delete from provider_posts where id = ${id}`;
  return NextResponse.json({ ok: true });
}
