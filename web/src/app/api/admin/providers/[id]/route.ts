import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

const ALLOWED = ["approved", "rejected", "suspended"] as const;
type Decision = (typeof ALLOWED)[number];

/**
 * Admin: approve / reject / suspend a provider, and/or flip the ID-verified
 * blue tick. Approving a join (no subscription yet) grants a 30-day start;
 * re-approvals keep the existing period. Every decision is audit-logged
 * (reactivate is logged when a suspended provider is approved again).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const { id } = await params;
  const requester = await getRequestUser(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json(
      { error: "Admins only." },
      { status: requester ? 403 : 401 }
    );
  }
  const body = (await req.json().catch(() => null)) as {
    status?: string;
    id_verified?: unknown;
  } | null;
  const status =
    body && (ALLOWED as readonly string[]).includes(body.status ?? "")
      ? (body.status as Decision)
      : null;
  const verified =
    typeof body?.id_verified === "boolean" ? body.id_verified : null;
  if (!body || (!status && verified === null)) {
    return NextResponse.json(
      {
        error:
          "Provide status (approved, rejected or suspended) and/or id_verified (boolean).",
      },
      { status: 400 }
    );
  }
  const admin = requester.email;
  const current = await sql`
    select status from providers where id = ${id}
  `;
  const prev = current[0]?.status as string | undefined;
  if (!prev) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  let updated:
    | { id: string; business_name: string; status: string }
    | undefined;
  if (status) {
    const rows = await sql`
      update providers
      set status = ${status},
          subscription_end = case
            when ${status} = 'approved' and subscription_end is null
            then now() + interval '30 days'
            else subscription_end
          end,
          updated_at = now()
      where id = ${id}
      returning id, business_name, status
    `;
    updated = rows[0] as
      | { id: string; business_name: string; status: string }
      | undefined;
    if (!updated) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      );
    }
    const action =
      status === "approved"
        ? prev === "suspended"
          ? "reactivate"
          : "approve"
        : status === "suspended"
          ? "suspend"
          : "reject";
    await sql`
      insert into admin_audit (admin_email, action, target)
      values (${admin}, ${action}, ${updated.business_name})
    `;
  }
  if (verified !== null) {
    const rows = await sql`
      update providers
      set id_verified = ${verified}, updated_at = now()
      where id = ${id}
      returning id, business_name, status
    `;
    updated = rows[0] as
      | { id: string; business_name: string; status: string }
      | undefined;
    if (!updated) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      );
    }
    await sql`
      insert into admin_audit (admin_email, action, target)
      values (${admin}, ${verified ? "verify" : "unverify"},
              ${updated.business_name})
    `;
  }
  return NextResponse.json(updated);
}
