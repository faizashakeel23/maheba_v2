import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Provider } from "@/types";

/**
 * Admin: every provider regardless of visibility, newest first.
 * (No auth yet — plan.md phase 1. Same trust level as the demo store.)
 */
export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  const rows = await sql`
    select id, business_name, category, location, bio, phone, whatsapp,
           instagram, status, rating, reviews_count, subscription_end
    from providers
    order by created_at desc
  `;
  const result: Provider[] = rows.map((p) => ({
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
    services: [],
    portfolio: [],
  }));
  return NextResponse.json(result);
}
