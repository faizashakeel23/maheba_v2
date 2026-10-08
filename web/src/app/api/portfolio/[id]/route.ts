import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Provider: delete one portfolio photo (row + file, best effort). */
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
  let rows: { id: string; provider_id: string; image_url: string }[];
  try {
    rows = (await sql`
      select id, provider_id, image_url from portfolio_items where id = ${id}
    `) as unknown as typeof rows;
  } catch {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }
  if (!(await ownsProvider(user, row.provider_id))) {
    return NextResponse.json(
      { error: "Only the owning provider can delete photos." },
      { status: 403 }
    );
  }
  await sql`delete from portfolio_items where id = ${id}`;
  // Remove the file too — but only inside our own uploads dir, never seed art.
  if (row.image_url.startsWith("/uploads/")) {
    const name = path.basename(row.image_url);
    if (name && name !== "." && name !== "..") {
      await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}
