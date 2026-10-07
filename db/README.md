# Maheba local database — Postgres in Docker

Plain Postgres 16 with a **named volume** (`pgdata`), so data survives
restarts, rebuilds, and `docker compose down`. No Supabase account needed.

## Prerequisite

Docker is **not installed** on this machine yet. Install **Docker Desktop
for Windows** (https://www.docker.com/products/docker-desktop/), start it,
then continue below.

## Start

```bash
# from the repo root (where docker-compose.yml lives)
cp .env.example .env          # optional — defaults work as-is
docker compose up -d
```

First launch creates the database, applies `db/schema.sql`, then `db/seed.sql`
(6 visible providers, 1 pending, 1 expired, services, portfolio, 2 demo
appointments). Check it:

```bash
docker compose ps
docker compose logs db --tail 20   # look for "database system is ready"
```

## Connect the web app

```bash
cd web
cp .env.local.example .env.local   # contains DATABASE_URL for the container
npm install
npm run dev
```

### Dev logins (seed only — password `maheba123` for every seed account)

- Admin: `admin@maheba.local`
- Providers: `glam-by-zawadi@maheba.local`, `face-by-amara@maheba.local`, … (one per business)
- Never use these on production. Prod starts with an empty `users` table;
  real accounts come from Join (email + password, scrypt-hashed).

The new API routes use it (503 with a clear message if it can't connect):

- `GET /api/providers` — public feed (approved + paid-up, with services + portfolio)
- `POST /api/providers` — join submission → `pending` row
- `GET /api/appointments?provider_id=…` — provider's bookings
- `POST /api/appointments` — guest booking (pending, visible providers only)
- `PATCH /api/appointments/[id]` — accept / decline / propose / confirm_new_time / cancel

Smoke test:

```bash
curl http://localhost:3000/api/providers | head -c 300
```

## Everyday commands

```bash
docker compose stop     # stop, keep data
docker compose start    # start again, data intact
docker compose down     # stop + remove containers, KEEP data (volume stays)
```

## Reset / re-seed

Init scripts only run on an **empty** volume:

```bash
docker compose down -v  # DANGER: deletes all data in pgdata
docker compose up -d    # fresh DB + seed again
```

## Backup the volume

```bash
docker run --rm -v maheba_pgdata:/data -v %cd%:/backup alpine ^
  tar czf /backup/pgdata-backup.tgz /data
```

## Notes & limits

- Access rules live in the API layer, not Postgres RLS (see `db/schema.sql`
  header). The API is currently open — per-user auth is the next step.
- Mobile still uses its AsyncStorage demo store; pointing it at these
  endpoints (via your PC's LAN IP, not `localhost`) is the follow-up task.
- The cloud Supabase path (`supabase/migrations/*`, `lib/supabase.ts`) is
  untouched and still works if you set those env vars instead.
