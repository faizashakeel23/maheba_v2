import { NextResponse } from "next/server";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";
import { isFileLike, saveUpload } from "@/lib/uploads";

/**
 * Provider: upload a portfolio photo.
 * Multipart form: provider_id, caption? (≤280), file (jpg/png/webp ≤5MB).
 * Files land in public/uploads/ (gitignored, served statically); the DB row
 * stores the public path. The first portfolio photo doubles as cover/avatar.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_PHOTOS = 24;

/** Provider: list my own portfolio photos (owner or admin). Visible
 *  even while pending — the public feed hides them until approved + paid. */
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
    return NextResponse.json(
      { error: "Only the owning provider can view these photos." },
      { status: 403 }
    );
  }
  const rows = await sql`
    select id, image_url, caption from portfolio_items
    where provider_id = ${provider_id} order by created_at
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
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
  const form = await req.formData().catch(() => null);
  const provider_id = String(form?.get("provider_id") ?? "").trim();
  if (!provider_id) {
    return NextResponse.json(
      { error: "provider_id is required." },
      { status: 400 }
    );
  }
  if (!(await ownsProvider(user, provider_id))) {
    return NextResponse.json(
      { error: "Only the owning provider can add photos." },
      { status: 403 }
    );
  }
  const caption = String(form?.get("caption") ?? "").trim().slice(0, 280);
  const raw = form?.get("file");
  if (!isFileLike(raw)) {
    return NextResponse.json(
      { error: "Choose a photo to upload." },
      { status: 400 }
    );
  }
  const count = await sql`
    select count(*)::int as n from portfolio_items where provider_id = ${provider_id}
  `;
  if ((count[0] as { n: number }).n >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Portfolio is full (max ${MAX_PHOTOS}) — delete one first.` },
      { status: 400 }
    );
  }
  const saved = await saveUpload(UPLOAD_DIR, provider_id, raw);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  const rows = await sql`
    insert into portfolio_items (provider_id, image_url, caption)
    values (${provider_id}, ${`/uploads/${saved.filename}`}, ${caption})
    returning id, image_url, caption
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
