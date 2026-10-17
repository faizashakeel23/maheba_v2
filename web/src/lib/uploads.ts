import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateUpload } from "./validation";

// NOTE: server-only (node:fs) — never import from client components.
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Magic-byte check — the client-supplied MIME type is untrusted. */
export function magicOk(buf: Buffer, mime: string): boolean {
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

/** Duck-type check for a multipart file (avoids instanceof across runtimes). */
export function isFileLike(v: unknown): v is File {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as File).arrayBuffer === "function" &&
    typeof (v as File).size === "number"
  );
}

/**
 * Validate (type + size + magic bytes) and save a multipart file under dir.
 * The filename is server-generated (unguessable) — never trust client names.
 */
export async function saveUpload(
  dir: string,
  prefix: string,
  file: File
): Promise<{ ok: true; filename: string } | { ok: false; error: string }> {
  const rejected = validateUpload(file.type, file.size);
  if (rejected) return { ok: false, error: rejected };
  const buf = Buffer.from(await file.arrayBuffer());
  if (!magicOk(buf, file.type)) {
    return { ok: false, error: "File content doesn't match its type." };
  }
  const safe = prefix.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 60) || "file";
  const filename = `${safe}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${EXT[file.type]}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);
  return { ok: true, filename };
}
