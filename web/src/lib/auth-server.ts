import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

// NOTE: server-only by convention — never import from client components.

const SESSION_DAYS = 30;
export const SESSION_COOKIE = "maheba_session";

export interface SessionUser {
  id: string;
  email: string;
  role: "customer" | "provider" | "admin";
  providerId: string | null;
  businessName: string;
}

interface UserRow {
  id: string;
  email: string;
  role: SessionUser["role"];
  display_name: string | null;
}

function parseHash(stored: string): { salt: string; hash: Buffer } | null {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return null;
  return { salt: parts[1], hash: Buffer.from(parts[2], "hex") };
}

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384 }, (err, key) =>
      err ? reject(err) : resolve(key as Buffer)
    );
  });
}

/** Hash a new password (`scrypt$<salt-hex>$<hash-hex>`). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

/** Constant-time password check. False for unknown formats / NULL hashes. */
export async function verifyPassword(
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const key = await scryptAsync(password, parsed.salt);
  return (
    key.length === parsed.hash.length && timingSafeEqual(key, parsed.hash)
  );
}

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function toSessionUser(row: UserRow): Promise<SessionUser> {
  const sql = getDb()!;
  let providerId: string | null = null;
  let businessName = row.display_name ?? "";
  if (row.role === "provider") {
    const prow = await sql`
      select id, business_name from providers where user_id = ${row.id} limit 1
    `;
    const p = prow[0] as { id: string; business_name: string } | undefined;
    if (p) {
      providerId = p.id;
      businessName = p.business_name;
    }
  }
  if (row.role === "admin" && !businessName) businessName = "Maheba Admin";
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    providerId,
    businessName,
  };
}

/** Create a session row + return the raw token (set as cookie / Bearer). */
export async function createSession(userId: string): Promise<string> {
  const sql = getDb()!;
  const token = randomBytes(32).toString("hex");
  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${sha256(token)}, ${userId},
            now() + ${`${SESSION_DAYS} days`}::interval)
  `;
  return token;
}

/** Validate a raw token → user, or null. Expired/revoked tokens fail. */
export async function getSessionUser(
  token: string | null | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql`
    select u.id, u.email, u.role, u.display_name
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)}
      and s.revoked_at is null
      and s.expires_at > now()
  `;
  const row = rows[0] as UserRow | undefined;
  if (!row) return null;
  return toSessionUser(row);
}

/** Revoke one session (logout). True if a row was revoked. */
export async function revokeSession(token: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  const rows = await sql`
    update sessions set revoked_at = now()
    where token_hash = ${sha256(token)} and revoked_at is null
    returning token_hash
  `;
  return rows.length > 0;
}

/** True for admins, or the provider who owns this business. */
export async function ownsProvider(
  user: SessionUser,
  providerId: string
): Promise<boolean> {
  if (user.role === "admin") return true;
  const sql = getDb();
  if (!sql) return false;
  const rows = await sql`
    select 1 from providers where id = ${providerId} and user_id = ${user.id}
  `;
  return rows.length > 0;
}

/** Owner (or admin) of the provider an appointment belongs to. */
export async function ownsAppointment(
  user: SessionUser,
  appointmentId: string
): Promise<boolean> {
  if (user.role === "admin") return true;
  const sql = getDb();
  if (!sql) return false;
  const rows = await sql`
    select 1 from appointments a
    join providers p on p.id = a.provider_id
    where a.id = ${appointmentId} and p.user_id = ${user.id}
  `;
  return rows.length > 0;
}

function getCookieToken(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Session user from cookie (web) or `Authorization: Bearer` (mobile). */
export async function getRequestUser(
  req: Request
): Promise<SessionUser | null> {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return getSessionUser(auth.slice(7).trim());
  }
  return getSessionUser(getCookieToken(req));
}

export function sessionCookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 86400;
  return `${SESSION_COOKIE}=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
