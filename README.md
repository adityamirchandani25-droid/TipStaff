# FixItFast

On-demand home-service discovery and request intake. Customers can browse
approved professionals who are actively sharing a recent location, review a
starting estimate, pay securely, and keep the submitted request in one place.

## Tech stack

| Layer      | Choice                                                   |
| ---------- | --------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4    |
| Database   | PostgreSQL + Prisma ORM 7 (driver adapters, no `url` in schema) |
| Auth       | Supabase Auth (`@supabase/ssr`, cookie-based sessions)     |
| Live availability | Authenticated location pings + 15-second map polling |
| Payments   | Stripe PaymentIntents + Elements                            |
| Maps       | Leaflet + OpenStreetMap (no map API key required)          |
| Forms      | react-hook-form + zod                                      |
| Client state | React state                                               |

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) — or point `DATABASE_URL` at any Postgres instance you already have

## Setup

```bash
npm install
cp .env.example .env        # already done in this repo; re-copy if you reset it

docker compose up -d        # starts local Postgres on :5432

npm run db:migrate          # creates tables from prisma/schema.prisma
npm run db:seed             # sample admin, customers, providers, one completed job

npm run dev                 # http://localhost:3000
```

Supabase Auth manages login credentials. Seeded Prisma profiles are sample
application data only and are not automatically Supabase Auth accounts.
Create a customer at `/signup` to walk through **New request** —
category → details/photos → urgency (with a live price estimate) →
address → confirmation.

### Environment variables

`DATABASE_URL`, Supabase credentials, Stripe credentials, `MAPBOX_TOKEN`, and
`NEXT_PUBLIC_SITE_URL`
are required for the complete request flow:

- **Stripe** — use test-mode keys from your
  [Stripe dashboard](https://dashboard.stripe.com/test/apikeys) to
  exercise the PaymentIntent + Elements flow locally. Missing keys fail safely.
- **Mapbox (required for service-address matching)** — set `MAPBOX_TOKEN` so
  submitted addresses resolve to real coordinates. Requests fail safely if it is missing.
  The app requests permanent geocoding because coordinates are stored for dispatch;
  your Mapbox account must be eligible for permanent result storage.
- **Auth** — set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Supabase manages passwords and
  sessions; Prisma keeps the trusted FixItFast role and application profile.
- **Password-recovery email** — in Supabase Dashboard → Authentication →
  Email Templates → Reset Password, set the subject to
  `Reset your FixItFast password` and paste the contents of
  [`supabase/templates/recovery.html`](supabase/templates/recovery.html).
  The template uses Supabase's `{{ .ConfirmationURL }}` and `{{ .Email }}`
  variables. Disable link tracking in your SMTP provider so it does not
  rewrite the one-time recovery URL.
- **Site URL** — set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS production
  origin. It is used for canonical URLs, the sitemap, and auth redirects.
- **Stripe webhook** — point a Stripe endpoint at
  `https://YOUR_DOMAIN/api/stripe/webhook`, subscribe to
  `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `payment_intent.canceled`, and `charge.refunded`, then set
  `STRIPE_WEBHOOK_SECRET`.

### Useful scripts

| Command              | What it does                                  |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Next.js dev server                             |
| `npm run build`       | Production build                               |
| `npm run typecheck`   | `tsc --noEmit`                                 |
| `npm run lint`        | ESLint                                          |
| `npm run db:migrate`  | Apply Prisma migrations                        |
| `npm run db:deploy`   | Apply committed migrations in production       |
| `npm run db:seed`     | Reset and reseed sample data                   |
| `npm run db:studio`   | Prisma Studio (browse the DB)                  |

## Project structure

```
prisma/
  schema.prisma          # data model — see below
  seed.ts                 # sample providers, customers, one completed job
src/
  app/
    (auth)/                # /login, /signup — split branded layout
    (customer)/             # /dashboard, /request/new, /request/[id] — session-gated
    auth/confirm/           # Supabase email-confirmation callback
  components/
    ui/                    # design-system primitives (Button, Badge, Card, Input, ...)
    request-wizard/         # five-step request and payment flow
    auth/                   # login/signup forms
  lib/
    auth.ts                 # verified Supabase session + Prisma profile lookup
    supabase/               # SSR server client and session-refresh proxy
    actions/                 # server actions (signUp, createServiceRequest, ...)
    validations/             # zod schemas shared by client forms and server actions
    pricing.ts, categories.ts, geocode.ts
  generated/prisma/        # generated Prisma client (gitignored, regenerated on install)
  proxy.ts                 # route protection (Next 16's renamed "middleware")
```

The provider and admin route groups land under `src/app/` as those
flows are built (see build status below).

## Data model

`User` → `Provider` (1:1 profile for provider-role users) and
`Address` (many, for customers). A `ServiceRequest` fans out into one
`DispatchAttempt` per candidate provider as the matching engine
cascades down the ranked list (rank, payout, distance, accept-window
expiry all live on that row); the attempt that gets accepted produces
the single `Job`, which carries the customer-facing status timeline
(`JobStatusEvent`), `Message` thread, `Payment`, and eventual `Review`.
`Payout` aggregates a provider's completed jobs for their earnings
dashboard. Full schema: [`prisma/schema.prisma`](prisma/schema.prisma).

## Release scope

- ✅ Supabase customer, independent-worker, and company accounts
- ✅ Company-managed worker creation and removal
- ✅ Approved-worker location sharing with automatic stale-location expiry
- ✅ Public nearby-provider list/map with approximate public coordinates
- ✅ Category filters, provider details, and server-owned estimates
- ✅ Stripe Payment Element, server-side payment verification, idempotent
  request recovery, and signed webhook status updates
- ✅ Customer request history and worker job dashboard
- ⏳ Automated dispatch, worker accept/decline, notifications, cancellation /
  refund controls, reviews, and admin approval tooling are not implemented.
  Do not advertise automatic assignment or run unattended fulfillment until
  those operational pieces exist.

## Production deployment

1. Provision PostgreSQL and set both `DATABASE_URL` (pooled app traffic) and
   `DIRECT_URL` (direct migration connection).
2. Run `npm ci`, `npm run db:deploy`, and `npm run build` in the release job.
3. Configure the Supabase production URL and redirect allow-list with
   `https://YOUR_DOMAIN/auth/confirm`.
4. Configure the Stripe webhook described above. Start with Stripe test mode;
   switch to live keys only after an end-to-end paid request and refund test.
5. Set `MAPBOX_TOKEN` with permanent geocoding access and set
   `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin.
6. Smoke-test `/`, `/services`, all three account portals, a worker location
   toggle, one paid customer request, and the Stripe webhook before opening
   traffic.

### Branding and account portals

The landing page, login pages, and both dashboards use the shared text-only
`BrandLogo` component.

- Customer login: `/login`; signup: `/signup`; requests: `/dashboard`.
- Worker / driver login: `/worker/login`; signup: `/worker/signup`;
  workspace: `/worker/dashboard`. New worker profiles await approval.
- Add local keys to `.env.local` (ignored by Git).

### Company directory

- `/` is the informational landing page; `/services` is the live provider browser.
- Visitors explicitly opt into browser location before any nearby lookup runs.
- Service tabs filter approved providers with fresh online location pings inside 50 miles.
- Provider actions continue into the authenticated request and payment flow; signed-out visitors return to the same preselected service after login.
- The map uses Leaflet and standard OpenStreetMap tiles with visible attribution. No Mapbox token is needed. `NEXT_PUBLIC_MAP_TILE_URL` can point to a compatible tile service; keep attribution appropriate to the chosen source.
