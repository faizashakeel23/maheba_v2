import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { providerSchema } from "@/lib/validation";
import {
  toProvider,
  type PortfolioRow,
  type ProviderRow,
  type ServiceRow,
} from "@/lib/provider-shape";

function uid(): string {
  return `pending-${Date.now()}`;
}

/** Public feed: approved + subscription-active providers with their extras. */
export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const providers = (await sql`
    select id, business_name, category, location, bio, phone, whatsapp,
           instagram, status, rating, reviews_count, subscription_end
    from providers
    where status = 'approved'
      and subscription_end is not null
      and subscription_end > now()
    order by rating desc, reviews_count desc
  `) as unknown as ProviderRow[];
  const ids = providers.map((p) => p.id);
  let services: (ServiceRow & { provider_id: string })[] = [];
  let portfolio: (PortfolioRow & { provider_id: string })[] = [];
  if (ids.length > 0) {
    services = (await sql`
      select id, provider_id, title, description, price_kes, unit, image_url
      from services where provider_id in ${sql(ids)} order by created_at
    `) as unknown as (ServiceRow & { provider_id: string })[];
    portfolio = (await sql`
      select id, provider_id, image_url, caption
      from portfolio_items where provider_id in ${sql(ids)} order by created_at
    `) as unknown as (PortfolioRow & { provider_id: string })[];
  }
  return NextResponse.json(
    providers.map((p) =>
      toProvider(
        p,
        services.filter((s) => s.provider_id === p.id),
        portfolio.filter((item) => item.provider_id === p.id)
      )
    )
  );
}

/** Provider join submission → pending row (admin approves in dashboard). */
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = providerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const id = uid();
  await sql`
    insert into providers
      (id, business_name, category, location, bio, phone, whatsapp, instagram, status)
    values
      (${id}, ${d.business_name}, ${d.category}, ${d.location}, ${d.bio},
       ${d.phone}, ${d.whatsapp}, ${d.instagram}, 'pending')
  `;
  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}
