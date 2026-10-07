# Maheba v2 — Provider Directory

Provider directory for makeup artists, henna artists, and bakers in Kenya.

## Structure

- `web/` — Next.js (TypeScript) responsive web app, provider dashboard, admin dashboard
- `mobile/` — Expo SDK 57 Android app (full parity) — see `mobile/README.md`
- `db/` — Local Postgres via Docker (persistent volume, seeded) — see `db/README.md`
- `supabase/` — Cloud Supabase migrations (optional alternative to `db/`)
- `docs/` — Architecture notes
- `skills.md` — Product / tech / dev rules (read before every task)

## Product rules (from skills.md)

- Customers browse without an account
- Only approved + paid providers appear publicly
- Providers manage own profiles/services
- Monthly subscription, M-Pesa via trusted backend
- Customers contact providers directly (phone/WhatsApp)
- No booking commissions or delivery in MVP

## Quick start (web)

```bash
cd web
cp .env.local.example .env.local  # fill Supabase keys, never commit secrets
npm install
npm run dev
# open http://localhost:3000
```

Build / typecheck / lint:

```bash
npm run build
npx tsc --noEmit
npm run lint
```

## Databases

Two options, pick one:

- **Local (default now):** Postgres in Docker with a persistent `pgdata` volume.
  See `db/README.md`. Set `DATABASE_URL` in `web/.env.local`.
- **Cloud:** Supabase — apply migrations in `supabase/migrations/` in order via
  Supabase CLI or dashboard SQL editor.

See `docs/architecture.md` for schema + RLS + M-Pesa flow.
