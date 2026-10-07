import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { appointmentSchema } from "@/lib/validation";

function uid(): string {
  return `appt-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const SELECT = `
  id, provider_id, customer_name, customer_phone, starts_at, ends_at,
  notes, status, proposed_starts_at, decided_at, created_at
`;

/** List a provider's appointments, earliest first. */
export async function GET(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const providerId = new URL(req.url).searchParams.get("provider_id");
  if (!providerId) {
    return NextResponse.json(
      { error: "provider_id query param is required." },
      { status: 400 }
    );
  }
  const rows = await sql.unsafe(
    `select ${SELECT} from appointments where provider_id = $1 order by starts_at`,
    [providerId]
  );
  return NextResponse.json(rows);
}

/** Guest booking: no account needed, always starts as pending. */
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const visible = await sql`
    select 1 from providers
    where id = ${d.provider_id}
      and status = 'approved'
      and subscription_end is not null
      and subscription_end > now()
  `;
  if (visible.length === 0) {
    return NextResponse.json(
      { error: "This provider is not bookable right now." },
      { status: 422 }
    );
  }
  const id = uid();
  const [appt] = await sql`
    insert into appointments (id, provider_id, customer_name, customer_phone, starts_at, notes, status)
    values (${id}, ${d.provider_id}, ${d.customer_name}, ${d.customer_phone},
            ${d.starts_at}, ${d.notes ?? ""}, 'pending')
    returning id, provider_id, customer_name, customer_phone, starts_at,
              ends_at, notes, status, proposed_starts_at, decided_at, created_at
  `;
  return NextResponse.json(appt, { status: 201 });
}
