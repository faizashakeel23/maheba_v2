import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { providerSchema } from "@/lib/validation";
import type { Provider } from "@/types";

function uid(): string {
  return `pending-${Date.now()}`;
}

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  price_kes: number;
  unit: string;
  image_url: string | null;
};

type PortfolioRow = { id: string; image_url: string; caption: string };

/** Public feed: approved + subscription-active providers with their extras. */
export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const providers = await sql`
    select id, business_name, category, location, bio, phone, whatsapp,
           instagram, status, rating, reviews_count, subscription_end
    from providers
    where status = 'approved'
      and subscription_end is not null
      and subscription_end > now()
    order by rating desc, reviews_count desc
  `;
  const ids = providers.map((p) => p.id as string);
  let services: (ServiceRow & { provider_id: string })[] = [];
  let portfolio: (PortfolioRow & { provider_id: string })[] = [];
  if (ids.length > 0) {
    services = await sql`
      select id, provider_id, title, description, price_kes, unit, image_url
      from services where provider_id in ${sql(ids)} order by created_at
    `;
    portfolio = await sql`
      select id, provider_id, image_url, caption
      from portfolio_items where provider_id in ${sql(ids)} order by created_at
    `;
  }
  const result: Provider[] = providers.map((p) => ({
    id: p.id as string,
    business_name: p.business_name as string,
    category: p.category as Provider["category"],
    location: (p.location as string) ?? "",
    bio: (p.bio as string) ?? "",
    phone: (p.phone as string) ?? "",
    whatsapp: (p.whatsapp as string) ?? "",
    instagram: (p.instagram as string) ?? "",
    status: p.status as Provider["status"],
    avatar: "",
    cover_image: "",
    rating: Number(p.rating ?? 0),
    reviews_count: Number(p.reviews_count ?? 0),
    subscription_end:
      p.subscription_end != null
        ? new Date(p.subscription_end as string).toISOString()
        : null,
    services: services
      .filter((s) => s.provider_id === p.id)
      .map((s) => ({
        id: String(s.id),
        title: s.title,
        description: s.description ?? "",
        price_kes: s.price_kes,
        unit: s.unit ?? "per session",
        image_url: s.image_url ?? undefined,
      })),
    portfolio: portfolio
      .filter((item) => item.provider_id === p.id)
      .map((item) => ({
        id: String(item.id),
        image_url: item.image_url,
        caption: item.caption ?? "",
      })),
  }));
  // First portfolio image doubles as cover/avatar, like the mock store.
  for (const p of result) {
    const first = p.portfolio[0]?.image_url ?? "";
    p.cover_image = first;
    p.avatar = first;
  }
  return NextResponse.json(result);
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
