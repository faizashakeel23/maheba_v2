-- Maheba auth (plain Postgres): password login + opaque sessions.
-- No Supabase Auth. Access rules stay in the Next.js API layer.
--
-- Fresh volumes: runs automatically via docker-compose init mount (03).
-- Existing volumes: apply once with
--   docker exec -i maheba-db-1 psql -U maheba -d maheba < db/migrations/0002_auth.sql

-- Passwords: `scrypt$<salt-hex>$<hash-hex>` (node:crypto scrypt, N=16384).
-- NULL = login disabled (account must set a password first).
alter table if exists users
  add column if not exists password_hash text;

-- Opaque sessions. Only the SHA-256 of the token is stored; the raw token
-- lives in the user's httpOnly cookie (web) or secure storage (mobile,
-- sent as `Authorization: Bearer`). One row per login; logout revokes.
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists sessions_user_idx on sessions(user_id, expires_at);
