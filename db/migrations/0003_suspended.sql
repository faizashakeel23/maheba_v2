-- Maheba v2: suspended providers.
-- Suspended listings are hidden by the existing visibility rule
-- (public = approved + active subscription), same as rejected/expired.
-- Admins suspend / reactivate from the console; every action is audit-logged.
--
-- Fresh volumes: runs automatically via docker-compose init mount (04).
-- Existing volumes: apply once with
--   docker exec -i maheba-db-1 psql -U maheba -d maheba < db/migrations/0003_suspended.sql

alter type provider_status add value if not exists 'suspended';
