-- Maheba local database — plain Postgres (Docker), no Supabase required.
-- Adapted from supabase/migrations/*.sql:
--   * `auth.users` replaced by a local `users` table (demo auth, no JWT/RLS).
--   * RLS policies dropped: access rules are enforced in the Next.js API layer
--     (`web/src/app/api/*`), which is the only writer using DATABASE_URL.
--   * `providers.id` is TEXT so human-readable ids (e.g. 'glam-by-zawadi')
--     survive seeding; everything else keeps uuid keys.
--   * `rating`, `reviews_count`, `subscription_end` live on providers so the
--     API can serve the app's Provider shape with one query pattern.
--
-- Loaded automatically on first `docker compose up` (empty volume only).

create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('customer', 'provider', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provider_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provider_category as enum ('makeup', 'henna', 'baking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('pending', 'active', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('initiated', 'confirmed', 'failed', 'duplicate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('pending', 'accepted', 'declined', 'rescheduled', 'cancelled');
exception when duplicate_object then null; end $$;

-- Local users (replaces auth.users). Demo login only — no passwords stored here.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role user_role not null default 'customer',
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists providers (
  id text primary key,
  user_id uuid references users(id) on delete set null,
  business_name text not null check (char_length(business_name) between 2 and 120),
  category provider_category not null,
  location text not null default '',
  bio text not null default '' check (char_length(bio) <= 2000),
  phone text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  status provider_status not null default 'pending',
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  -- Public listing rule (mirrors lib/directory.ts isVisible):
  -- status = 'approved' AND subscription_end is not null AND > now().
  subscription_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists providers_category_idx on providers(category);
create index if not exists providers_status_idx on providers(status);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references providers(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_kes integer not null check (price_kes >= 0),
  unit text not null default 'per session',
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists services_provider_idx on services(provider_id);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references providers(id) on delete cascade,
  image_url text not null,
  caption text not null default '' check (char_length(caption) <= 280),
  created_at timestamptz not null default now()
);
create index if not exists portfolio_provider_idx on portfolio_items(provider_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references providers(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status subscription_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (period_end > period_start)
);
create index if not exists subscriptions_provider_idx on subscriptions(provider_id);

create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references providers(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount_kes integer not null check (amount_kes > 0),
  phone_msisdn text not null,
  transaction_reference text not null unique,
  mpesa_receipt text,
  checkout_request_id text,
  status payment_status not null default 'initiated',
  raw_callback jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_provider_idx on payment_attempts(provider_id);
create index if not exists payments_ref_idx on payment_attempts(transaction_reference);

-- Admin audit (append-only, no deletes).
create table if not exists admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null default '',
  action text not null,
  target text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id text primary key,
  provider_id text not null references providers(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (char_length(customer_phone) between 7 and 20),
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 1000),
  status appointment_status not null default 'pending',
  proposed_starts_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index if not exists appointments_provider_idx on appointments(provider_id, starts_at);
create index if not exists appointments_status_idx on appointments(provider_id, status);

-- Keep updated_at fresh on writes.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists providers_updated_at on providers;
create trigger providers_updated_at
  before update on providers
  for each row execute function set_updated_at();

drop trigger if exists appointments_updated_at on appointments;
create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- Public visibility rule, same as the app's isVisible(): approved + paid up.
create or replace function is_provider_visible(pid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from providers p
    where p.id = pid
      and p.status = 'approved'
      and p.subscription_end is not null
      and p.subscription_end > now()
  );
$$;
