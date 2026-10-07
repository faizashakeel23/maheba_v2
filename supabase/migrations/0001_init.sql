-- Maheba v2 initial schema
-- Run in order. Requires pgcrypto for gen_random_uuid.

create extension if not exists "pgcrypto";

-- Roles
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

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  display_name text,
  created_at timestamptz not null default now()
);

-- Providers (one row per business; user owns it)
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  category provider_category not null,
  location text not null default '',
  bio text not null default '' check (char_length(bio) <= 2000),
  phone text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  status provider_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
create index if not exists providers_category_idx on public.providers(category);
create index if not exists providers_status_idx on public.providers(status);

-- Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_kes integer not null check (price_kes >= 0),
  unit text not null default 'per session',
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists services_provider_idx on public.services(provider_id);

-- Portfolio
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  image_url text not null,
  caption text not null default '' check (char_length(caption) <= 280),
  created_at timestamptz not null default now()
);
create index if not exists portfolio_provider_idx on public.portfolio_items(provider_id);

-- Subscriptions (explicit periods)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status subscription_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (period_end > period_start)
);
create index if not exists subscriptions_provider_idx on public.subscriptions(provider_id);
create index if not exists subscriptions_active_idx on public.subscriptions(provider_id, status, period_end);

-- Payment attempts (every attempt recorded, unique ref)
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount_kes integer not null check (amount_kes > 0),
  phone_msisdn text not null,
  transaction_reference text not null unique,
  mpesa_receipt text,
  checkout_request_id text,
  status payment_status not null default 'initiated',
  raw_callback jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_provider_idx on public.payment_attempts(provider_id);
create index if not exists payments_ref_idx on public.payment_attempts(transaction_reference);

-- Admin audit (append-only)
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Helpers
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.has_active_subscription(pid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.subscriptions s
    where s.provider_id = pid
      and s.status = 'active'
      and s.period_start <= now()
      and s.period_end > now()
  );
$$;

create or replace function public.is_provider_visible(pid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.providers p
    where p.id = pid
      and p.status = 'approved'
      and public.has_active_subscription(pid)
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.admin_audit enable row level security;

-- profiles: user reads/updates own; admin reads all
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

-- providers: public sees only visible; owner manages own; admin all
drop policy if exists providers_public on public.providers;
create policy providers_public on public.providers
  for select using (status = 'approved' and public.has_active_subscription(id));

drop policy if exists providers_owner on public.providers;
create policy providers_owner on public.providers
  for all using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- services: public sees only visible providers' services
drop policy if exists services_public on public.services;
create policy services_public on public.services
  for select using (public.is_provider_visible(provider_id));

drop policy if exists services_owner on public.services;
create policy services_owner on public.services
  for all using (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  ) with check (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  );

-- portfolio: same as services
drop policy if exists portfolio_public on public.portfolio_items;
create policy portfolio_public on public.portfolio_items
  for select using (public.is_provider_visible(provider_id));

drop policy if exists portfolio_owner on public.portfolio_items;
create policy portfolio_owner on public.portfolio_items
  for all using (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  ) with check (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  );

-- subscriptions/payments: owner reads own; writes via service role only (no direct insert/update policy for anon)
drop policy if exists subs_owner_read on public.subscriptions;
create policy subs_owner_read on public.subscriptions
  for select using (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  );

drop policy if exists payments_owner_read on public.payment_attempts;
create policy payments_owner_read on public.payment_attempts
  for select using (
    exists (select 1 from public.providers p where p.id = provider_id and (p.user_id = auth.uid() or public.is_admin(auth.uid())))
  );

-- admin audit: admin reads; inserts via service role
drop policy if exists audit_admin_read on public.admin_audit;
create policy audit_admin_read on public.admin_audit
  for select using (public.is_admin(auth.uid()));
