-- Maheba v2: ID verification flag for the blue tick.
-- Admins flip it after manually checking a provider's ID (e.g. over
-- WhatsApp). The tick shows only on paid + approved listings; the public
-- visibility rule itself is unchanged.
--
-- Fresh volumes: runs automatically via docker-compose init mount (05).
-- Existing volumes: apply once with
--   docker exec -i maheba-db-1 psql -U maheba -d maheba < db/migrations/0004_id_verified.sql

alter table if exists providers
  add column if not exists id_verified boolean not null default false;
