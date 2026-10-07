import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rescheduleSchema } from "@/lib/validation";

type Decision =
  | { kind: "accept" }
  | { kind: "decline" }
  | { kind: "propose"; proposed_starts_at: string }
  | { kind: "confirm_new_time" }
  | { kind: "cancel" };

const ALLOWED = ["accept", "decline", "propose", "confirm_new_time", "cancel"];

/**
 * Provider decision on a booking. Same transition rules as the demo store:
 * accept/decline from pending|rescheduled; propose needs a future time;
 * confirm_new_time applies the proposal; cancel preserves history.
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
  const body = (await req.json().catch(() => null)) as Decision | null;
  if (!body || !ALLOWED.includes(body.kind)) {
    return NextResponse.json(
      { error: "kind must be accept, decline, propose, confirm_new_time or cancel." },
      { status: 400 }
    );
  }
  if (body.kind === "propose") {
    const parsed = rescheduleSchema.safeParse({
      proposed_starts_at: body.proposed_starts_at,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 }
      );
    }
  }
  const rows = await sql`
    select id, status, proposed_starts_at from appointments where id = ${id}
  `;
  const appt = rows[0] as
    | { id: string; status: string; proposed_starts_at: string | null }
    | undefined;
  if (!appt) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  const from = appt.status;

  // One explicit statement per transition (mirrors the demo store exactly).
  let updated;
  switch (body.kind) {
    case "accept":
      if (from !== "pending" && from !== "rescheduled") break;
      [updated] =
        from === "rescheduled" && appt.proposed_starts_at
          ? await sql`
              update appointments set starts_at = proposed_starts_at,
                proposed_starts_at = null, status = 'accepted', decided_at = now()
              where id = ${id} returning id`
          : await sql`
              update appointments set status = 'accepted', decided_at = now()
              where id = ${id} returning id`;
      break;
    case "decline":
      if (from !== "pending" && from !== "rescheduled") break;
      [updated] = await sql`
        update appointments set status = 'declined', decided_at = now()
        where id = ${id} returning id`;
      break;
    case "propose":
      if (from !== "pending" && from !== "rescheduled") break;
      [updated] = await sql`
        update appointments set
          proposed_starts_at = ${(body as { proposed_starts_at: string }).proposed_starts_at},
          status = 'rescheduled', decided_at = now()
        where id = ${id} returning id`;
      break;
    case "confirm_new_time":
      if (from !== "rescheduled" || !appt.proposed_starts_at) break;
      [updated] = await sql`
        update appointments set starts_at = proposed_starts_at,
          proposed_starts_at = null, status = 'accepted', decided_at = now()
        where id = ${id} returning id`;
      break;
    case "cancel":
      if (from === "declined" || from === "cancelled") break;
      [updated] = await sql`
        update appointments set status = 'cancelled', decided_at = now()
        where id = ${id} returning id`;
      break;
  }
  if (!updated) {
    return NextResponse.json(
      { error: `Cannot ${body.kind} an appointment with status ${from}.` },
      { status: 409 }
    );
  }
  const [fresh] = await sql`
    select id, provider_id, customer_name, customer_phone, starts_at,
           ends_at, notes, status, proposed_starts_at, decided_at, created_at
    from appointments where id = ${id}
  `;
  return NextResponse.json(fresh);
}
