import type { Provider } from "@/types";

// Raw rows from the local Postgres API queries (postgres.js returns
// `any`-shaped rows; these interfaces document what the routes select).
export interface ProviderRow {
  id: string;
  business_name: string;
  category: string;
  location: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  status: string;
  id_verified: boolean;
  rating: number | string | null;
  reviews_count: number | string | null;
  subscription_end: string | Date | null;
}

export interface ServiceRow {
  id: string | number;
  provider_id: string;
  title: string;
  description: string | null;
  price_kes: number;
  unit: string | null;
  image_url: string | null;
}

export interface PortfolioRow {
  id: string | number;
  provider_id: string;
  image_url: string;
  caption: string | null;
}

export interface PostRow {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

/** Shape a DB provider + its extras into the app's Provider type. */
export function toProvider(
  p: ProviderRow,
  services: ServiceRow[],
  portfolio: PortfolioRow[],
  posts: PostRow[] = []
): Provider {
  const first = portfolio[0]?.image_url ?? "";
  return {
    id: p.id,
    business_name: p.business_name,
    category: p.category as Provider["category"],
    location: p.location ?? "",
    bio: p.bio ?? "",
    phone: p.phone ?? "",
    whatsapp: p.whatsapp ?? "",
    instagram: p.instagram ?? "",
    status: p.status as Provider["status"],
    id_verified: p.id_verified ?? false,
    // Never the real filename — ID documents stay in the private vault.
    id_document_url: null,
    // First portfolio image doubles as cover/avatar, like the mock store.
    avatar: first,
    cover_image: first,
    rating: Number(p.rating ?? 0),
    reviews_count: Number(p.reviews_count ?? 0),
    subscription_end:
      p.subscription_end != null
        ? new Date(p.subscription_end).toISOString()
        : null,
    services: services.map((s) => ({
      id: String(s.id),
      title: s.title,
      description: s.description ?? "",
      price_kes: s.price_kes,
      unit: s.unit ?? "per session",
      image_url: s.image_url ?? undefined,
    })),
    portfolio: portfolio.map((item) => ({
      id: String(item.id),
      image_url: item.image_url,
      caption: item.caption ?? "",
    })),
    posts: posts.map((post) => ({
      id: String(post.id),
      body: post.body,
      image_url: post.image_url ?? null,
      created_at: new Date(post.created_at).toISOString(),
      updated_at: new Date(post.updated_at).toISOString(),
    })),
  };
}
