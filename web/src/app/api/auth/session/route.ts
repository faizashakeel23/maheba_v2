import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";

/** Who am I (drives the client auth context). Null user = logged out. */
export async function GET(req: Request) {
  const user = await getRequestUser(req);
  return NextResponse.json({ user });
}
