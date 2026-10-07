import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  toProvider,
  type PortfolioRow,
  type ProviderRow,
  type ServiceRow,
} from "@/lib/provider-shape";

/** Single provider profile — visible listings only (404 otherwise). */
export async function GET(
  _req: Request,
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
  const rows = (await sql`
    select id, business_name, category, location, bio, phone, whatsapp,
           instagram, status, rating, reviews_count, subscription_end
    from providers
    where id = ${id}
      and status = 'approved'
      and subscription_end is not null
      and subscription_end > now()
  `) as unknown as ProviderRow[];
  const p = rows[0];
  if (!p) {
    return NextResponse.json(
      { error: "Provider not found or not visible." },
      { status: 404 }
    );
  }
  const services = (await sql`
    select id, provider_id, title, description, price_kes, unit, image_url
    from services where provider_id = ${id} order by created_at
  `) as unknown as ServiceRow[];
  const portfolio = (await sql`
    select id, provider_id, image_url, caption
    from portfolio_items where provider_id = ${id} order by created_at
  `) as unknown as PortfolioRow[];
  return NextResponse.json(toProvider(p, services, portfolio));
}
