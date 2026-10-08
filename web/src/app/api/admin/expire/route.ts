import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";
import { runExpiryCheck } from "@/lib/subscriptions";

/** Admin: run the subscription expiry sweep on demand. */
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Admins only." },
      { status: user ? 403 : 401 }
    );
  }
  if (!getDb()) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const result = await runExpiryCheck(user.email);
  if (!result) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  return NextResponse.json(result);
}
