-- Maheba v2: provider ID documents for the verification tick.
-- Stores the private vault filename (never a public URL — ID cards are
-- served only through the authenticated /api/id-docs route).
--
-- Fresh volumes: runs automatically via docker-compose init mount (06).
-- Existing volumes: apply once with
--   docker exec -i maheba-db-1 psql -U maheba -d maheba < db/migrations/0005_id_documents.sql

alter table if exists providers
  add column if not exists id_document_url text;
