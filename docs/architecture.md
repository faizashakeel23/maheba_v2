# Architecture — Maheba v2

## Stack

- Web: Next.js 16 (App Router) + TypeScript + Tailwind, `web/src/`
- Mobile (future): Expo / React Native, shares Supabase + types
- Backend: Supabase (Postgres, Auth, Storage)
- Payments: M-Pesa Daraja via trusted Next.js Route Handlers (`web/src/app/api/mpesa/*`), never trust client status

## Data model

`supabase/migrations/0001_init.sql`:

- `profiles(id uuid PK → auth.users, role: customer|provider|admin, display_name, created_at)`
- `providers(id uuid PK, user_id → profiles, business_name, category: makeup|henna|baking, location, bio, phone, whatsapp, instagram, status: pending|approved|rejected, created_at, updated_at)`
- `services(id, provider_id → providers, title, description, price_kes int, unit text, image_url, created_at)`
- `portfolio_items(id, provider_id, image_url, caption, created_at)` — file type/size validated in app + Storage policy (jpg/png/webp, ≤5MB)
- `subscriptions(id, provider_id, period_start timestamptz, period_end timestamptz, status: pending|active|expired, created_at)` — periods stored explicitly
- `payment_attempts(id, provider_id, subscription_id nullable, amount_kes int, phone_msisdn text, transaction_reference text UNIQUE, mpesa_receipt nullable, status: initiated|confirmed|failed|duplicate, raw_callback jsonb, created_at)` — every attempt recorded
- `admin_audit(id, admin_id → profiles, action text, target_type text, target_id text, metadata jsonb, created_at)` — append-only

Public visibility rule: `providers.status = 'approved'` AND EXISTS active subscription (`period_start <= now() < period_end`, `status='active'`).

## RLS (enforced in DB, mirrored in app queries)

- `providers`: public SELECT only where visible (via `is_provider_visible()`); providers UPDATE own row only; admin full access via `is_admin()`.
- `services`, `portfolio_items`: public SELECT only for visible providers; owner write only.
- `subscriptions`, `payment_attempts`: owner read own; write via service role only (API route). Never via anon client.
- `admin_audit`: admin read; insert via service role only.

## M-Pesa flow (idempotent, server-verified)

1. Provider clicks Pay in dashboard → `POST /api/mpesa/stk-push` (server, authenticated) creates `payment_attempts(initiated)` with `transaction_reference = uuid`, calls Daraja STK push.
2. Safaricom calls `POST /api/mpesa/callback` (server, validates signature/IP, service role). Lookup by `transaction_reference` / `CheckoutRequestID`.
3. If already `confirmed` → record `duplicate`, do nothing (no double-extend).
4. If success → in one transaction: mark attempt `confirmed`, create/extend `subscriptions` period (30 days from max(now, current period_end)), set `pending→active`. Never activate before confirmation.
5. Expired listings hidden automatically by visibility rule. Cron marks `subscriptions` past `period_end` as `expired`.

Client never sets subscription status. All status changes happen in the callback transaction.

## Web routes

- `/` — Instagram-like feed: photo-forward grid, category filter (All/Makeup/Henna/Baking), search, location filter
- `/p/[id]` — Provider profile: cover, portfolio grid, services + prices, WhatsApp/call buttons, guest booking form (name + phone + date/time, no account)
- `/join` — Provider signup (creates pending provider)
- `/login` — Provider demo login (picks a business profile; real Supabase Auth once keys exist)
- `/dashboard` — Provider: appointments (accept / decline / propose new time / cancel), subscription status, Pay with M-Pesa
- `/admin` — Admin demo login (admin tab) required; approve/reject pending providers
  + join submissions, hidden-listings view, audit trail (all in `lib/providers.ts`
  demo store; real RLS + `admin_audit` table once Supabase keys exist)
- `/api/mpesa/stk-push`, `/api/mpesa/callback` — trusted backend only

## Appointments (To Do, demo mode)

- Table `appointments` (`supabase/migrations/0002_appointments.sql`): guest INSERT of
  `pending` rows for visible providers only; owner/admin read + decide; no
  deletes (cancel via status). Statuses: pending → accepted / declined /
  rescheduled (provider counter-proposal in `proposed_starts_at`) / cancelled.
- Demo runtime: `web/src/lib/appointments.ts` (localStorage, seeded) mirrors the
  SQL transition rules; swap for Supabase queries when keys are configured.
- Demo auth: `web/src/lib/auth.tsx` (localStorage session). Replace with
  Supabase Auth (`signInWithPassword`, `profiles` link) without changing pages.

## Validation

- Shared zod schemas in `web/src/lib/validation.ts`
- Shared types in `web/src/types/index.ts`
