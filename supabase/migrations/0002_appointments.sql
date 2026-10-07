-- Maheba v2: guest appointment booking + provider decision flow.
-- Guests (no account) may INSERT a pending booking for a visible provider.
-- Only the owning provider (or admin / service role) may read or decide.

do $$ begin
  create type appointment_status as enum ('pending', 'accepted', 'declined', 'rescheduled', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (char_length(customer_phone) between 7 and 20),
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 1000),
  status appointment_status not null default 'pending',
  -- Provider counter-proposal: set with status 'rescheduled' until confirmed.
  proposed_starts_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index if not exists appointments_provider_idx on public.appointments(provider_id, starts_at);
create index if not exists appointments_status_idx on public.appointments(provider_id, status);

-- Keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

-- Guest booking: anyone may request a PENDING slot with a visible provider.
-- (Future-datetime + input validation enforced in app via zod.)
drop policy if exists appointments_guest_insert on public.appointments;
create policy appointments_guest_insert on public.appointments
  for insert
  with check (
    status = 'pending'
    and public.is_provider_visible(provider_id)
  );

-- Provider owner + admin may read their appointments.
drop policy if exists appointments_owner_read on public.appointments;
create policy appointments_owner_read on public.appointments
  for select using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id
        and (p.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- Provider owner + admin may decide (accept / decline / counter-propose / cancel).
drop policy if exists appointments_owner_update on public.appointments;
create policy appointments_owner_update on public.appointments
  for update using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id
        and (p.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  ) with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_id
        and (p.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- No public read, no deletes (history preserved; cancel via status).
