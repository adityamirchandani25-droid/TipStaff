# TipStaff

On-demand home services, matched and dispatched like a delivery app.
A homeowner describes what broke; the platform ranks nearby available
pros and cascades the job to them one at a time; the customer tracks
the accepted pro live until the job is done and paid for.

This repo is mid-build. See [Build status](#build-status) for what
exists today versus what's still scaffolding.

## Tech stack

| Layer      | Choice                                                   |
| ---------- | --------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4    |
| Database   | PostgreSQL + Prisma ORM 7 (driver adapters, no `url` in schema) |
| Auth       | Auth.js / NextAuth v5 (credentials provider, JWT sessions) |
| Realtime   | Self-hosted Socket.IO server (`server/`)                  |
| Payments   | Stripe (test mode; mocked when no key is set)              |
| Maps       | Leaflet + OpenStreetMap (no map API key required)          |
| Forms      | react-hook-form + zod                                      |
| Client state | zustand                                                   |

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

All seeded accounts (see `prisma/seed.ts`) use the password
`password123` — for example `jordan@tipstaff.dev` (customer),
`mike.reyes@tipstaff.dev` (approved, online plumber), or
`alex.novak@tipstaff.dev` (provider still pending admin approval).
Log in as a customer at `/login` to walk through **New request** —
category → details/photos → urgency (with a live price estimate) →
address → confirmation.

### Running without real API keys

Every third-party integration is structured to degrade to a mocked
mode when its env var is blank, so the app is fully usable locally
with just Postgres running:

- **Stripe** — blank keys mean payments auto-"succeed" server-side
  instead of calling the Stripe SDK. Drop in test-mode keys from your
  [Stripe dashboard](https://dashboard.stripe.com/test/apikeys) to
  exercise the real PaymentIntent + Elements flow.
- **Mapbox (optional)** — leave `NEXT_PUBLIC_MAPBOX_TOKEN` blank to use
  login and booking locally. New addresses receive deterministic demo
  coordinates around Austin, not their actual locations. A token enables
  address geocoding; live maps, tracking, and dispatch are separate work.
- **Auth** — the credentials provider hashes/checks passwords against
  Postgres directly; no external identity provider is required. Swap
  in a real OTP/SMS or OAuth provider later without touching the data
  model.

### Useful scripts

| Command              | What it does                                  |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Next.js dev server                             |
| `npm run build`       | Production build                               |
| `npm run typecheck`   | `tsc --noEmit`                                 |
| `npm run lint`        | ESLint                                          |
| `npm run db:migrate`  | Apply Prisma migrations                        |
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
    api/auth/[...nextauth]/ # NextAuth route handler
  components/
    ui/                    # design-system primitives (Button, Badge, Card, Input, ...)
    request-wizard/         # the 4-step "what's wrong" flow
    auth/                   # login/signup forms
  lib/
    auth.ts, auth.config.ts # NextAuth config, split edge-safe/full per Auth.js v5 convention
    actions/                 # server actions (signUp, createServiceRequest, ...)
    validations/             # zod schemas shared by client forms and server actions
    pricing.ts, categories.ts, geocode.ts
  generated/prisma/        # generated Prisma client (gitignored, regenerated on install)
  proxy.ts                 # route protection (Next 16's renamed "middleware")
server/                    # standalone Socket.IO realtime server (job + location events) — not built yet
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

## Build status

1. ✅ Project scaffold, Prisma schema, seed data
2. ✅ Auth (credentials, JWT sessions) + basic customer request flow
3. ⬜ Provider dashboard + accept/decline flow
4. ⬜ Real-time matching + live status updates
5. ⬜ Map integration + live location tracking
6. ⬜ Stripe payment flow
7. ⬜ Reviews + order history
8. ⬜ Admin dashboard
9. ⬜ Polish: notifications, no-providers-available, cancellations, timeouts

### Branding and account portals

Save the supplied logo as `public/images/tipstaff-logo.png` and refresh.
The landing page, login pages, and both dashboards use the shared
`BrandLogo` component. Until the file exists, they retain the text logo.

- Customer login: `/login`; signup: `/signup`; requests: `/dashboard`.
- Worker / driver login: `/worker/login`; signup: `/worker/signup`;
  workspace: `/worker/dashboard`. New worker profiles await approval.
- Add local keys to `.env.local` (ignored by Git); Mapbox may remain blank.

### Company directory

- `/` is the informational landing page; `/services` is the map and company browser.
- Service tabs filter both the left-hand listings and map markers. Either can open company details.
- `src/lib/directory.ts` contains fictional, labeled demo companies and worker locations around Austin.
- Company booking is an explicit demo preview: no dispatch, payment, or live appointment is created. The preview can lead to the existing general service-request form.
- The map uses Leaflet and standard OpenStreetMap tiles with visible attribution. No Mapbox token is needed. `NEXT_PUBLIC_MAP_TILE_URL` can point to a compatible tile service; keep attribution appropriate to the chosen source.
- Real company onboarding, live driver telemetry, and company-specific booking require a production data integration.
