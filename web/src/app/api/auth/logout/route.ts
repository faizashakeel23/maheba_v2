import { NextResponse } from "next/server";
import { clearCookieHeader, revokeSession } from "@/lib/auth-server";

function requestToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "maheba_session") return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Logout: revoke this session, clear the cookie. Idempotent. */
export async function POST(req: Request) {
  const token = requestToken(req);
  if (token) await revokeSession(token);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearCookieHeader());
  return res;
}
