# Green Card Kosova

A production-minded, bilingual (Albanian/English) DV lottery application service for Kosovo. It covers the public site, an 8-step application wizard, an applicant portal, payments, filing records, and a role-protected staff dashboard.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zod, Firebase (Auth/Firestore/Storage) and Vitest. All prices are derived server-side from household answers; the browser only shows a preview.

> **This repository is not ready for public launch.** Legal copy, data-retention policy, cash handling rules and several commercial rules are unapproved. Firebase, email, payment and bot-protection credentials are not configured. See [Launch blockers](#launch-blockers).

---

## What works

| Area | Status |
|---|---|
| Bilingual public site (SQ default, EN complete) | Working |
| 8-step wizard with autosave, resume, validation, photo upload | Working |
| Server-side tier/price calculation and frozen order amount | Working |
| Application submission, unique reference, confirmation page | Working |
| Magic-link portal, ownership checks, timeline, edit/data requests | Working |
| Admin dashboard, searchable cases, review queue, photo review | Working |
| Cash reconciliation, refunds, filing records, confirmation notices | Working |
| Reports and permission-checked CSV exports | Working |
| Role matrix (admin/operator/accountant/viewer/client) + audit log | Working |
| Demo mode with explicitly labelled seeded data | Working |
| Firestore/Storage adapters and deny-by-default rules | Implemented, not deployed |
| Firebase Auth email-link, magic links, signed session cookies | Implemented, credentials required |
| Resend email delivery | Implemented, credentials required |
| Stripe adapter + authoritative webhook | Implemented, **not usable for Kosovo merchants** |
| Unit tests (pricing, state machines, permissions, photos, validation, filing readiness) | 61 passing |
| TypeScript, lint, production build | Passing (lint has no errors) |

Not implemented: staff MFA, Turnstile challenge (env placeholders only), PDF generation, automated DV filing (deliberately manual — the official site must be used by a human), multi-instance rate limiting, backup/restore automation.

---

## Quick start (demo mode)

Requirements: Node.js 20+ (tested on Node 24), npm.

```bash
npm install
cp .env.example .env.local       # Windows: Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000> — it redirects to `/sq`.

Demo mode is selected automatically when Firebase is not configured. It is clearly labelled with a banner, stores data under `.data/` locally (Vercel uses Runtime Cache), never sends email (messages go to `/admin/outbox`) and never accepts card payments.

### Seeded demo accounts

Staff sign-in: <http://localhost:3000/admin/login>. Client sign-in: <http://localhost:3000/sq/login>.

| Role | Email |
|---|---|
| Admin | `admin@demo.greencardkosova.com` |
| Operator | `operator@demo.greencardkosova.com` |
| Accountant | `accountant@demo.greencardkosova.com` |
| Viewer | `viewer@demo.greencardkosova.com` |
| Client | `client@demo.greencardkosova.com` |

The client owns seeded application `GCK-4KT9M`. Other seeded references include `GCK-8QW2N`, `GCK-2MX7P`, `GCK-9RB4T`, `GCK-5CN8K`, `GCK-7HD3V`, `GCK-3PL6W`, `GCK-6TJ9S`, `GCK-1VK5D`.

Demo authentication buttons are only available in demo mode; the demo auth routes are hard-disabled outside it.

### Reset demo data

```bash
npm run demo:reset
```

This deletes `.data/store` and `.data/uploads`; the seed is recreated automatically on the next demo sign-in/page load. The script refuses to run with `APP_MODE=firebase`.

### Deploy the demo to Vercel

Import <https://github.com/lorikjashari/greencard> at <https://vercel.com/new>. Next.js is detected automatically; no build command or output directory override is needed. Keep **Enable access to System Environment Variables** on so the demo can detect Vercel and use the shared Runtime Cache.

1. Leave Firebase variables empty and set `APP_MODE=demo` explicitly.
2. `SESSION_SECRET` is optional **only in demo mode**; without it the app uses a public demo key. Never use that key with real applicant data.
3. Set `NEXT_PUBLIC_APP_URL` to the final Vercel URL if you want fixed magic links. If it is omitted, the app derives the URL from `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`.
4. Deploy, open `/admin/login`, and use the seeded staff buttons. Client sign-in is at `/sq/login`.

**Vercel demo limits:** Vercel runs routes in separate functions, so the demo does not use a local file. It stores data and chunked photos in [Vercel Runtime Cache](https://vercel.com/docs/caching/runtime-cache), namespaced by deployment. That makes the seeded admin, wizard, portal and outbox usable without extra credentials, but Runtime Cache is **non-durable**: entries are regional, may be evicted, and reset on each deployment. It is suitable for evaluation, not a persistent public demo or any real data. Vercel also caps request bodies at 4.5 MB, below the app's 5 MB photo limit, so use a photo under about 4 MB when testing uploads. Switch to Firebase mode for durable data.

### Useful routes

- `/sq`, `/en` — public site
- `/sq/apply` — wizard
- `/sq/login` — client magic-link / demo sign-in
- `/sq/account` — applicant portal
- `/admin` — staff dashboard
- `/admin/outbox` — every rendered email + delivery status
- `/admin/launch-checklist` — live readiness and blocker list
- `/api/health` — liveness/config summary

---

## Configuration

Copy `.env.example` to `.env.local`. Values that matter:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | HMAC key for session cookies and signed file URLs. Use ≥32 random bytes in any deployment. |
| `APP_MODE` | `demo` or `firebase`. Leave unset to auto-detect from Firebase credentials. Set `demo` explicitly on a Vercel demo. |
| `DEMO_DATA_DIR` | Optional local demo storage root. Defaults to `.data/`. Vercel uses Runtime Cache instead; `/tmp` is only a fallback. |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config for email-link auth. |
| `FIREBASE_ADMIN_*` | Service account for server-side Firestore/Storage. Never expose with `NEXT_PUBLIC_`. |
| `EMAIL_PROVIDER` / `RESEND_API_KEY` / `EMAIL_FROM` | Real email delivery. Without these, messages are `not_configured` and stay in the outbox. |
| `PAYMENT_PROVIDER` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Card payments. Leaving `disabled` keeps card hidden. |
| `DV_ACTIVE_YEAR`, `DV_OPENS_AT`, `DV_CLOSES_AT` | Configured DV window. Verify against official instructions; the app does not replace them. |
| `TURNSTILE_*` | Reserved; the challenge is not wired yet. |

### Firebase setup (production path)

1. Create a Firebase project and a web app.
2. Enable **Authentication → Email/Google link** (passwordless). Add your production domain to authorised domains.
3. Create **Firestore** (production mode) and a **Storage** bucket.
4. Create a service account and set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` (keep newlines escaped as `\n`).
5. Set all `NEXT_PUBLIC_FIREBASE_*` values.
6. Set `SESSION_SECRET`.
7. Deploy rules: `firebase deploy --only firestore:rules,storage --project <id>` (requires Firebase CLI login).
8. Set `APP_MODE=firebase` and verify `/admin/launch-checklist`.

Client browsers never read Firestore or Storage directly. The rules deny all direct access by design; the Next.js server uses the Admin SDK and re-checks the session, role and ownership on every request. Do not loosen the rules to fix a client query — add a server endpoint.

### Email

Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and a verified `EMAIL_FROM`. Emails are sent synchronously by `queueEmail`; failures are recorded as `failed` with the provider error. Without a provider, every message is stored in `emailOutbox` and shown in `/admin/outbox`, and the UI never labels it as sent. Confirmation status only changes to `confirmation_sent` when the provider accepted the message.

### Payments

Cash in hand/post is the default. Card controls are hidden unless `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY` **and** `STRIPE_WEBHOOK_SECRET` are all set.

Card flow (when enabled): create a pending card order → create a Stripe Checkout session → redirect → verify session on return → mark paid. The signed webhook is authoritative and idempotent; a browser redirect alone never marks an order paid.

**Important:** Stripe does not currently support merchants established in Kosovo. The adapter exists, but card payments must stay disabled until an eligible PSP or merchant structure is selected, contracted and configured. This is a launch blocker, not a code toggle.

---

## Security model

- HMAC-signed, httpOnly, SameSite=Lax `gck_session` cookie. Staff lifetime 8h; clients 30 days.
- Single-use magic-link tokens stored as SHA-256 hashes with expiry. Resume rotates the draft secret.
- Draft access requires the draft id **and** secret; stale-version saves are rejected.
- Photo access requires a short-lived signed URL, an owning client session, or staff permission.
- Uploads are checked by magic bytes, dimensions, squareness, 5 MB cap; JPEG metadata (EXIF/GPS/XMP/IPTC/comments) is stripped without re-encoding.
- Server derives the price and photo metadata; client-supplied amounts/tier/approval are ignored.
- Every privileged action re-checks `hasPermission(role, …)` and writes an audit record.
- Staff guard re-reads the user record, so deactivation/role changes take effect immediately.
- Viewer/accountant masks sensitive contact data; photo review and notes require explicit permissions.
- Firestore/Storage rules deny all direct browser access.
- No raw IP addresses are stored. Rate-limit keys use in-memory buckets (single instance only).

Known hardening gaps: no MFA, no CSRF token beyond same-origin checks on JSON endpoints, unsigned idle-timestamp cookie (30 min) enforced only in middleware, in-memory rate limiter, no automated backups/monitoring/alerts. See [docs/launch-blockers.md](docs/launch-blockers.md).

---

## Pricing and state rules

Tier is derived only from household answers (marital status, spouse inclusion, derivative children: under 21 and unmarried at entry):

| Tier | Price |
|---|---|
| Individual | €12.50 |
| Couple | €17.50 |
| Family | €27.50 |

The amount and `pricingRulesVersion` are frozen on the order. Tests cover age boundaries, excluded children, single-parent cases and spouse exclusion.

Application and payment state machines are separate. Generic status changes cannot set `filed` or `confirmation_sent`: filing requires a staff-recorded confirmation number, and confirmation requires a provider-accepted email. `ready_to_file` and filing require a confirmed exact payment (or a documented mismatch review), complete data, and staff approval of every required photo. The server re-runs these checks even if the UI is bypassed.

---

## Testing and quality gates

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e   # requires Playwright browsers: npx playwright install chromium
```

Latest verified results in this workspace:

- `npm run typecheck` — passed
- `npm run lint` — passed with no errors
- `npm test` — 5 files, 61 tests passed
- `npm run build` — passed
- `npm run test:e2e` — not executed here; Playwright browser binaries were not installed in this environment

The Playwright smoke suite covers the SQ/EN landing pages, no horizontal overflow, wizard start, admin demo login and `/api/health`.

---

## Launch blockers

No launch date should be set until these are closed. The live list is also at `/admin/launch-checklist`.

**Credentials / infrastructure**

1. Firebase project, Auth email-link, Firestore, Storage, service account and deployed rules.
2. `SESSION_SECRET` generated and stored securely.
3. Verified Resend domain + API key (or another email provider).
4. Backups, restore test, monitoring and alerting.
5. Multi-instance rate limiting (current limiter is process-local).
6. Staff MFA before exposing personal data to staff accounts.

**Commercial / legal decisions**

7. Post-selection fee (proposed €750) — unresolved; currently not applied.
8. Single-parent pricing — unapproved; flagged for manual review.
9. Spouse-exclusion pricing and evidence rules — unapproved; flagged for manual review.
10. Cash mechanics: office/post/bank, loss liability, expiry, receipt wording — unapproved.
11. Legal copy (Terms, Privacy, refunds, disclaimer) — draft only, needs qualified review.
12. Retention periods — proposed in code, not approved; do not present as final.
13. DV 2027 window/dates and eligible-country list — must be verified against official instructions before opening sales or filing.

**Payments**

14. Card payments are disabled. Stripe does not support Kosovo merchants; choose a PSP/merchant structure that can legally operate, complete contracting/KYC, then configure it. Until then, cash remains the only method.

**Operations**

15. A named person/team must actually file each entry at `dvprogram.state.gov`, record the confirmation number, and handle client communication. The system never files automatically.
16. Data-processing agreements with providers, incident-response contact and a documented deletion procedure.

See [docs/launch-blockers.md](docs/launch-blockers.md) for acceptance criteria.

---

## Project structure

```
src/
  app/
    [locale]/            public site, wizard, portal, legal pages
    admin/               staff login + dashboard + server actions
    api/                 drafts, uploads, files, applications, auth, exports, payments
  components/            UI primitives, layout, admin, applicant components
  features/applications/ wizard, steps, submission orchestration
  lib/
    auth/                sessions, guards, signed URLs
    repo/                data access for applications, orders, users, etc.
    store/               DataStore/BlobStore with file + Firebase adapters
    pricing/             pure tier engine
    status/              state machines + permissions
    validation/          zod schemas + per-step validation
    dv/                  eligibility, photo rules
    notifications/       templates, Resend sender, outbox
    payments/            provider boundary + Stripe adapter
  messages/              bilingual copy dictionary
e2e/                     Playwright smoke tests
docs/                    pricing spec and launch blockers
firestore.rules          deny-all client access
storage.rules            deny-all client access
```

### Data and money invariants

- The server recomputes the tier on submission; the client's displayed tier is never trusted.
- Existing orders keep their original amount and rules version when prices change.
- Payment status changes only through the state machine; card status changes only from the provider webhook/verified return.
- Emails are never marked `sent` without provider acceptance.
- Staff-facing audit records are append-only by convention; do not add delete/update paths.
- The official DV entry is free at <https://dvprogram.state.gov>. Green Card Kosova is an independent preparation service, not a government site.
