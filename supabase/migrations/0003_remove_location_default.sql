-- Remove location-specific default; app is now used in multiple cities.
-- Existing databases that already ran 0001 need this alter.
alter table if exists public.providers alter column location drop default;
alter table if exists public.providers alter column location set default '';
