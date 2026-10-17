import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { providerSchema } from "@/lib/validation";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";
import {
  createSession,
  hashPassword,
  sessionCookieHeader,
} from "@/lib/auth-server";
import {
  toProvider,
  type PortfolioRow,
  type PostRow,
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
           instagram, status, id_verified, rating, reviews_count, subscription_end
    from providers
    where status = 'approved'
      and subscription_end is not null
      and subscription_end > now()
    order by rating desc, reviews_count desc
  `) as unknown as ProviderRow[];
  const ids = providers.map((p) => p.id);
  let services: (ServiceRow & { provider_id: string })[] = [];
  let portfolio: (PortfolioRow & { provider_id: string })[] = [];
  let posts: (PostRow & { provider_id: string })[] = [];
  if (ids.length > 0) {
    services = (await sql`
      select id, provider_id, title, description, price_kes, unit, image_url
      from services where provider_id in ${sql(ids)} order by created_at
    `) as unknown as (ServiceRow & { provider_id: string })[];
    portfolio = (await sql`
      select id, provider_id, image_url, caption
      from portfolio_items where provider_id in ${sql(ids)} order by created_at
    `) as unknown as (PortfolioRow & { provider_id: string })[];
    posts = (await sql`
      select id, provider_id, body, image_url, created_at, updated_at
      from provider_posts where provider_id in ${sql(ids)}
      order by created_at desc
    `) as unknown as (PostRow & { provider_id: string })[];
  }
  return NextResponse.json(
    providers.map((p) =>
      toProvider(
        p,
        services.filter((s) => s.provider_id === p.id),
        portfolio.filter((item) => item.provider_id === p.id),
        posts.filter((post) => post.provider_id === p.id)
      )
    )
  );
}

const joinSchema = providerSchema.extend({
  email: z.string().email("Enter a valid email for your login."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** Provider join: creates a login account + pending provider in one
 *  transaction, and logs the new provider straight in. */
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Local database not configured (DATABASE_URL missing)." },
      { status: 503 }
    );
  }
  // Spam guard: fake joins pollute the admin queue (CGNAT-safe ceiling).
  const limited = checkRateLimit(req, "join", {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!limited.ok) return rateLimitExceeded(limited.retryAfter);
  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const email = d.email.trim().toLowerCase();
  const taken = await sql`
    select 1 from users where email = ${email}
  `;
  if (taken.length > 0) {
    return NextResponse.json(
      { error: "That email is already registered — log in instead ♡" },
      { status: 409 }
    );
  }
  const id = uid();
  const passwordHash = await hashPassword(d.password);
  const userId = await sql.begin(async (tx) => {
    const users = await tx`
      insert into users (email, role, display_name, password_hash)
      values (${email}, 'provider', ${d.business_name}, ${passwordHash})
      returning id
    `;
    const newId = (users[0] as { id: string }).id;
    await tx`
      insert into providers
        (id, user_id, business_name, category, location, bio, phone, whatsapp, instagram, status)
      values
        (${id}, ${newId}, ${d.business_name}, ${d.category}, ${d.location},
         ${d.bio}, ${d.phone}, ${d.whatsapp}, ${d.instagram}, 'pending')
    `;
    return newId;
  });
  const token = await createSession(userId);
  const res = NextResponse.json({ id, status: "pending" }, { status: 201 });
  res.headers.append("Set-Cookie", sessionCookieHeader(token));
  return res;
}
