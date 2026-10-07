# Legacy — Supabase cloud schema (reference only)

**Canonical schema: `db/schema.sql` (plain Postgres).**

These migrations were written for hosted Supabase (`auth.users`, `auth.uid()`
RLS policies). The project decided on plain Postgres (local Docker for dev,
managed Postgres for prod) with rules enforced in the Next.js API layer.

Kept for reference only — do NOT apply to the canonical database.
If the project ever moves back to Supabase cloud, reconcile `db/schema.sql`
(text ids, denormalized `rating`/`reviews_count`/`subscription_end`) with
`0001_init.sql` (uuid ids, `auth.users` FK) first.
