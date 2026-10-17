import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getRequestUser, ownsProvider } from "@/lib/auth-server";

const ID_DIR = path.join(process.cwd(), "private", "id-docs");
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Owner/admin only: stream a provider's ID document.
 * The filename is never trusted from the client — it always comes from
 * the database row, confined to the vault directory.
 */
export async function GET(
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
    return NextResponse.json({ error: "Not yours to view." }, { status: 403 });
  }
  const rows = (await sql`
    select id_document_url from providers where id = ${provider_id}
  `) as unknown as { id_document_url: string | null }[];
  const stored = rows[0]?.id_document_url;
  if (!stored) {
    return NextResponse.json(
      { error: "No ID document submitted." },
      { status: 404 }
    );
  }
  const full = path.join(ID_DIR, path.basename(stored));
  if (!full.startsWith(ID_DIR + path.sep)) {
    return NextResponse.json({ error: "No ID document found." }, { status: 404 });
  }
  let buf: Buffer;
  try {
    buf = await readFile(full);
  } catch {
    return NextResponse.json(
      { error: "Document file missing." },
      { status: 404 }
    );
  }
  const ext = path.extname(stored).toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
    },
  });
}
