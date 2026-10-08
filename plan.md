# Maheba v2 — Plan to Production

Checklist we work through before going live. Tick boxes as each item lands.
Rule: nothing is "done" until verified — see skills.md completion report.

## 0. Environment prerequisites

- [x] Docker Desktop installed + `docker compose up -d` healthy (`db/README.md`)
  (engine 29.8.2, `maheba-db-1` healthy, seed verified: 8 providers / 6 visible)
- [ ] Node LTS on all dev machines; `npm install` clean in `web/` and `mobile/`
- [x] Expo Go phone testing verified (SDK 57 client, same Wi-Fi, Private
  network profile + firewall rule for TCP 3000, `--tunnel --clear`;
  seed login hits the real API, not the demo fallback)
- [x] Decide prod database: **self-hosted Postgres on an Ubuntu VPS + Docker**
  (4GB RAM, 50GB+ disk — plenty for web + DB + photo volume). Managed cloud
  (Supabase/Neon/RDS) deferred unless self-hosting ever hurts.
- [x] Canonical schema decided: **plain Postgres** — `db/schema.sql` is the one
  true schema; `supabase/migrations/*` kept as legacy reference (`supabase/LEGACY.md`).

## 1. Authentication (blocks everything below)

Local API + demo logins are **wide open**. Before prod: (web done, mobile pending)

- [x] (web) Replace demo auth with real accounts — scrypt passwords + DB sessions
- [x] (web) Passwords hashed server-side only (node:crypto scrypt, never client)
- [x] (web) Sessions: httpOnly cookie (web) + Bearer token ready (mobile)
- [x] (web) Roles enforced: owner-only bookings/decisions/payments, admin-only admin routes
- [x] (mobile) Token login + AsyncStorage token + `Authorization: Bearer` on calls
  (Expo Go compatible; production should move to expo-secure-store + dev build)
- [x] (web) Admin join approve/reject requires admin session (audit uses session email)

Phase 1 **complete**: web + mobile both authenticate against Postgres sessions;
all data routes are owner/admin-gated with demo-store fallbacks offline.

## 2. API + data hardening

- [x] Web pages read `/api/*` with graceful fallback when DB is down
  (feed, profile, join, dashboard, admin go through `@/lib/api` API-first;
  localStorage demo store is fallback only)
- [ ] Mobile points at prod API via `https://` URL (not `localhost`; not LAN IP)
- [x] Rate-limit guest booking + join endpoints (spam protection):
  in-memory per-IP sliding window (`web/src/lib/rate-limit.ts`) —
  20 bookings/hour, 10 joins/hour, 429 + Retry-After.
  Single-process only; swap for Redis/DB counters when multi-instance
- [x] Subscription expiry job: past-`period_end` rows flip to `expired`
  (`web/src/lib/subscriptions.ts`): auto-sweep hourly + shortly after boot
  (`src/instrumentation.ts`), manual "Run expiry check" button in admin
  Overview (`POST /api/admin/expire`, audit-logged). Single-server only —
  move to platform cron when multi-instance
- [x] Portfolio uploads (web): `POST/GET/DELETE /api/portfolio`
  (owner-only, jpg/png/webp ≤5MB + magic-byte check server-side, max 24,
  files in gitignored `public/uploads/`, dashboard UI).
  Still open: prod storage (S3) + mobile upload (needs dev build —
  `expo-image-picker` can't run in Expo Go).
  Decided: prod photos = local disk volume on the Ubuntu VPS (no S3 needed
  at this scale; the upload code writes through one spot if that changes)
- [x] `DATABASE_URL` + all secrets in hosting env vars only — never committed.
  Audited on `feature/secrete_audit`: no hardcoded secrets; real `.env*`
  files ignored + untracked; legacy Supabase URL/key scrubbed from the
  `.example` (rotate or delete that unused cloud project as hygiene).
  Dev defaults (`maheba`/`maheba123`) are documented dev-only
- [x] Automated backups of prod DB tested with a restore drill (dev drill
  proven: pg_dump → spare-DB restore → all 9 tables match; see db/README.
  Prod still needs its own scheduled backup once hosted)

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
- [ ] Hosting chosen: **Ubuntu VPS + Docker** (env vars, domain + HTTPS,
  photo volume mount, firewall, backup cron — all still to do)
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
