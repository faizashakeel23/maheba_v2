import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";
import { validateUpload } from "@/lib/validation";

/**
 * Provider: upload a portfolio photo.
 * Multipart form: provider_id, caption? (≤280), file (jpg/png/webp ≤5MB).
 * Files land in public/uploads/ (gitignored, served statically); the DB row
 * stores the public path. The first portfolio photo doubles as cover/avatar.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_PHOTOS = 24;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Magic-byte check — the client-supplied MIME type is untrusted. */
function magicOk(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === "image/webp") {
    return (
      buf.length >= 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

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
  const isFile =
    !!raw &&
    typeof raw === "object" &&
    typeof (raw as File).arrayBuffer === "function" &&
    typeof (raw as File).size === "number";
  if (!isFile) {
    return NextResponse.json(
      { error: "Choose a photo to upload." },
      { status: 400 }
    );
  }
  const file = raw as File;
  const rejected = validateUpload(file.type, file.size);
  if (rejected) {
    return NextResponse.json({ error: rejected }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!magicOk(buf, file.type)) {
    return NextResponse.json(
      { error: "File content doesn't match its type." },
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
  const safe =
    provider_id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 60) || "photo";
  const name = `${safe}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${EXT[file.type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  const rows = await sql`
    insert into portfolio_items (provider_id, image_url, caption)
    values (${provider_id}, ${`/uploads/${name}`}, ${caption})
    returning id, image_url, caption
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
