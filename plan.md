# Maheba v2 — Plan to Production

Checklist we work through before going live. Tick boxes as each item lands.
Rule: nothing is "done" until verified — see skills.md completion report.

## 0. Environment prerequisites

- [x] Docker Desktop installed + `docker compose up -d` healthy (`db/README.md`)
  (engine 29.8.2, `maheba-db-1` healthy, seed verified: 8 providers / 6 visible)
- [ ] Node LTS on all dev machines; `npm install` clean in `web/` and `mobile/`
- [ ] Expo Go Android crash resolved (paste the detail text from the red screen)
- [ ] Decide prod database: **managed Postgres** (recommended: Supabase cloud,
  Neon, RDS) vs self-hosted. Local Docker is for dev only.
- [x] Canonical schema decided: **plain Postgres** — `db/schema.sql` is the one
  true schema; `supabase/migrations/*` kept as legacy reference (`supabase/LEGACY.md`).

## 1. Authentication (blocks everything below)

Local API + demo logins are **wide open**. Before prod: (web done, mobile pending)

- [x] (web) Replace demo auth with real accounts — scrypt passwords + DB sessions
- [x] (web) Passwords hashed server-side only (node:crypto scrypt, never client)
- [x] (web) Sessions: httpOnly cookie (web) + Bearer token ready (mobile)
- [x] (web) Roles enforced: owner-only bookings/decisions/payments, admin-only admin routes
- [ ] (mobile) Token login + secure storage + `Authorization: Bearer` on calls
- [x] (web) Admin join approve/reject requires admin session (audit uses session email)

## 2. API + data hardening

- [ ] Web pages read `/api/*` with graceful fallback when DB is down
  (today they still read localStorage only)
- [ ] Mobile points at prod API via `https://` URL (not `localhost`; not LAN IP)
- [ ] Rate-limit guest booking + join endpoints (spam protection)
- [ ] Subscription expiry job: mark past-`period_end` rows `expired` on a schedule
  (visibility rule depends on it)
- [ ] Portfolio uploads: real storage (Supabase Storage / S3) with the existing
  jpg/png/webp ≤5MB validation enforced server-side (today images are static paths)
- [ ] `DATABASE_URL` + all secrets in hosting env vars only — never committed
- [ ] Automated backups of prod DB tested with a restore drill

## 3. M-Pesa (Daraja) live wiring

Both routes are mock-shaped today (see `TODO`s in the files):

- [ ] `POST /api/mpesa/stk-push`: insert `payment_attempts(initiated)` with unique
  reference, call Daraja STK push with `MPESA_*` server env vars
- [ ] `POST /api/mpesa/callback`: verify authenticity (signature/IP), idempotent
  confirm → extend subscription via `nextPeriod()` in one transaction, audit it
- [ ] Public HTTPS callback URL configured (`MPESA_CALLBACK_URL`) — Safaricom
  can't reach `localhost`
- [ ] End-to-end sandbox test: pay → active → listing visible → expiry → hidden
- [ ] Duplicate-callback test: no double extension for one payment

## 4. Web production build

- [ ] `npm run build`, `tsc --noEmit`, `npm run lint` all green
- [ ] Hosting chosen (Vercel / VPS + Docker) with env vars set
- [ ] Custom domain + HTTPS; metadata/descriptions final (Kenya-wide wording)
- [ ] Error/404 pages reviewed; loading states on feed + profile

## 5. Mobile production build

- [ ] `npx expo-doctor` fully green (1 warning left: `.expo/` gitignore — fixed?)
- [ ] EAS project configured (`eas.json`), Android package `com.maheba.app` kept
- [ ] Icons, splash, version bump in `app.json`; test on a real device via dev build
- [ ] Production API URL baked in; guest booking + dashboards tested on device
- [ ] Store listing assets ready (screenshots, description, privacy note)

## 6. QA pass (staging, with prod-like data)

- [ ] Guest: browse → search/filter → profile → book → WhatsApp contact
- [ ] Provider: join → approve → pay → visible → receive/decide bookings
- [ ] Admin: approve/reject, hide expired, audit trail reads correctly
- [ ] Visibility matrix: pending hidden, expired hidden, rejected hidden, paid visible
- [ ] Invalid inputs rejected everywhere (zod messages sane, no 500s)
- [ ] Fresh-device test: no localStorage/AsyncStorage leftovers assumed

## 7. Launch

- [ ] Seed prod with REAL providers only (no mock data: Zawadi/Amara/Layla/etc.)
- [ ] Backup taken right before launch
- [ ] Monitor: error logs (web), crash reports (mobile), payment attempts table
- [ ] Support path: how a provider reaches you when STK push fails

## 8. After launch (from skills.md To Do — explicitly NOT launch blockers)

- [ ] Provider availability calendar
- [ ] Client deposit on booking
- [ ] ID verification + blue tick for paid + admin-approved providers

## Working agreement

- Small commits on `main` (local only, no remote yet)
- `tsc --noEmit` (web + mobile) before every commit; `expo-doctor` for mobile changes
- Update this file when the plan changes; update `docs/architecture.md` when
  behavior changes.
