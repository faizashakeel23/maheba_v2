import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";
import { isFileLike, saveUpload } from "@/lib/uploads";

/**
 * Provider ID documents — private vault, never public.
 * Files live in private/id-docs/ (gitignored) under server-generated names
 * and are served only through the authenticated /api/id-docs/[id] route.
 */
const ID_DIR = path.join(process.cwd(), "private", "id-docs");

/** Owner/admin: ID verification state (never the document itself). */
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
    return NextResponse.json({ error: "Not yours to view." }, { status: 403 });
  }
  const rows = (await sql`
    select id_verified, id_document_url from providers where id = ${provider_id}
  `) as unknown as { id_verified: boolean; id_document_url: string | null }[];
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  return NextResponse.json({
    id_verified: row.id_verified ?? false,
    submitted: !!row.id_document_url,
  });
}

/**
 * Provider: submit (or re-submit) an ID document for verification.
 * A new submission resets the blue tick — every document gets checked.
 */
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
      { error: "Only the owning provider can submit ID." },
      { status: 403 }
    );
  }
  const raw = form?.get("file");
  if (!isFileLike(raw)) {
    return NextResponse.json(
      { error: "Choose a photo of your ID to upload." },
      { status: 400 }
    );
  }
  const saved = await saveUpload(ID_DIR, `id-${provider_id}`, raw);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  const existing = (await sql`
    select id_document_url from providers where id = ${provider_id}
  `) as unknown as { id_document_url: string | null }[];
  if (!existing[0]) {
    // No such provider — don't orphan the file we just wrote.
    await unlink(path.join(ID_DIR, saved.filename)).catch(() => {});
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  if (existing[0].id_document_url) {
    const old = path.basename(existing[0].id_document_url);
    if (old && old !== "." && old !== "..") {
      await unlink(path.join(ID_DIR, old)).catch(() => {});
    }
  }
  await sql`
    update providers
    set id_document_url = ${saved.filename}, id_verified = false,
        updated_at = now()
    where id = ${provider_id}
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
}
