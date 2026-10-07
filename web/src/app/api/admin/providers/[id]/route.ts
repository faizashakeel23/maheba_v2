import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Admin: approve / reject a provider. Approving a join (no subscription yet)
 * grants the same 30-day start the demo store gives; re-approvals keep the
 * existing period. Every decision is audit-logged.
 * (No auth yet — plan.md phase 1. Same trust level as the demo store.)
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
  const body = (await req.json().catch(() => null)) as {
    status?: string;
    admin?: string;
  } | null;
  if (body?.status !== "approved" && body?.status !== "rejected") {
    return NextResponse.json(
      { error: "status must be approved or rejected." },
      { status: 400 }
    );
  }
  const admin =
    typeof body.admin === "string" && body.admin.includes("@")
      ? body.admin
      : "admin@maheba.local";
  const rows = await sql`
    update providers
    set status = ${body.status},
        subscription_end = case
          when ${body.status} = 'approved' and subscription_end is null
          then now() + interval '30 days'
          else subscription_end
        end,
        updated_at = now()
    where id = ${id}
    returning id, business_name, status
  `;
  const updated = rows[0] as
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
    values (${admin}, ${body.status === "approved" ? "approve" : "reject"},
            ${updated.business_name})
  `;
  return NextResponse.json(updated);
}
