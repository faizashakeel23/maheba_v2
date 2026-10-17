import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

const postSchema = z.object({
  body: z.string().trim().min(1, "Write something first ♡").max(1000),
});

const VISIBLE = `
  status = 'approved'
  and subscription_end is not null
  and subscription_end > now()
`;

/** Public: a visible provider's feed, newest first. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const { id } = await params;
  // Owners (and admins) always see their own posts — even while pending.
  // Everyone else only sees posts of visible listings.
  const viewer = await getRequestUser(req);
  const owner =
    !!viewer && viewer.role === "admin"
      ? true
      : !!viewer && (await ownsProvider(viewer, id));
  if (!owner) {
    const visible = await sql.unsafe(
      `select 1 from providers where id = $1 and ${VISIBLE}`,
      [id]
    );
    if (visible.length === 0) {
      return NextResponse.json(
        { error: "Provider not found or not visible." },
        { status: 404 }
      );
    }
  }
  const rows = await sql`
    select id, body, image_url, created_at, updated_at
    from provider_posts where provider_id = ${id}
    order by created_at desc limit 50
  `;
  return NextResponse.json(rows);
}

/** Owner: post a daily update. */
export async function POST(
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
  const { id: provider_id } = await params;
  if (!(await ownsProvider(user, provider_id))) {
    return NextResponse.json(
      { error: "Only the owning provider can post." },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }
  const rows = await sql`
    insert into provider_posts (provider_id, body)
    values (${provider_id}, ${parsed.data.body})
    returning id, body, image_url, created_at, updated_at
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
