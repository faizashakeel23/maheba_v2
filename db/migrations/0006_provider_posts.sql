-- Maheba v2: provider feed/blog posts.
-- Short daily updates (text + optional photo) shown first on the public
-- profile page; managed from the dashboard Feed tab. Only live (approved +
-- paid) providers' posts are served publicly — enforced in the API layer.
--
-- Fresh volumes: runs automatically via docker-compose init mount (07).
-- Existing volumes: apply once with
--   docker exec -i maheba-db-1 psql -U maheba -d maheba < db/migrations/0006_provider_posts.sql

create table if not exists provider_posts (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references providers(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_provider_idx on provider_posts(provider_id, created_at desc);
