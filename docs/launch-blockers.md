# Launch blockers and acceptance criteria

This is the authoritative checklist for leaving demo/evaluation mode. A box is only checked when there is evidence, not intent. The same list is rendered at `/admin/launch-checklist`; technical checks are computed from the environment at request time.

A Vercel demo deployment runs on regional, non-durable Vercel Runtime Cache with a public demo session key and no real email or payments. Cache entries can be evicted and reset on deployment. The demo is suitable only for reviewing screens and workflows; it does not satisfy any production item below and must not receive real applicant data.

## A. Credentials and infrastructure

| # | Blocker | Acceptance criteria |
|---|---|---|
| A1 | Firebase not configured | Project created; Email-link auth enabled; Firestore + Storage provisioned; client and admin env vars set; `firebase deploy --only firestore:rules,storage` succeeds; `/admin/launch-checklist` shows Firebase checks green. |
| A2 | Session secret missing/default | `SESSION_SECRET` is ≥32 random bytes, stored in secret manager, rotated with a documented plan. |
| A3 | Email not configured | Verified sending domain; `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` set; a test message reaches an external inbox; outbox empty for that message. |
| A4 | No backups/restore | Automated Firestore + Storage exports; retention defined; restore rehearsed and timed; owner named. |
| A5 | No monitoring | Error tracking, uptime check, failed-webhook alert, email-failure alert, payment-mismatch alert; on-call contact documented. |
| A6 | Rate limiting is in-process | Shared store (e.g. Redis/Firestore) or edge rate limiting verified across multiple instances. |
| A7 | Staff MFA missing | MFA enforced for admin/operator/accountant accounts before any production personal data is loaded. |
| A8 | Idle lock is cookie-only | Server-side idle/session revocation implemented and tested, or accepted as a documented residual risk with compensating controls. |

## B. Commercial and legal decisions

| # | Blocker | Current behaviour | Decision needed |
|---|---|---|---|
| B1 | Post-selection fee (proposed €750) | Not applied; setting is `null` | Decide whether it exists, when it is charged, what it covers, refund rules, and how consent is captured. Do not mark it enabled without updated copy and order logic. |
| B2 | Single-parent pricing | Family tier with `needsReview` | Approve or reject a pricing rule for single-parent households; update pricing tests and copy. |
| B3 | Spouse exclusion | Individual tier with `needsReview` | Approve evidence requirements and pricing for US-citizen spouse / documented legal separation. |
| B4 | Cash mechanics | Office/post default instructions in settings | Approve accepted channels, receipt wording, loss liability, deadlines and expiry handling. |
| B5 | Legal copy | Draft pages marked “DRAFT — pending legal review” | Qualified Kosovo/EU legal review of Terms, Privacy, refunds, controller identity, transfers and disclaimers. Set `legalCopyApproved` only after sign-off. |
| B6 | Retention | Proposed values in `src/lib/policy.ts` | Approve periods per data class, deletion procedure, legal hold, and how deletion requests are fulfilled. Set `retentionApproved` only after sign-off. |
| B7 | DV dates/countries | Env defaults, not verified | Verify the new DV year’s opening/closing dates, eligible countries and photo rules against official instructions; update DV year; keep an archived screenshot/reference. |

## C. Payments

| # | Blocker | Acceptance criteria |
|---|---|---|
| C1 | Card payments disabled | A PSP/merchant structure legally able to serve Kosovo is contracted and KYC-approved. |
| C2 | Stripe unsupported for Kosovo merchants | Do not enable Stripe based on this repository alone. If Stripe is used through an eligible entity, obtain written confirmation and configure `PAYMENT_PROVIDER=stripe`, keys and webhook secret. |
| C3 | Webhook not verified in production | Signed test webhook accepted; invalid signature rejected; duplicate event idempotent; browser redirect alone does not mark paid. |
| C4 | Refund execution | Refund policy approved; provider-side refunds reconciled to local `refunded` status; accountant procedure documented. |

## D. Operations

| # | Blocker | Acceptance criteria |
|---|---|---|
| D1 | Manual filing | Named staff, trained on the official site, files each entry, records the confirmation number, and sends the confirmation notice. No automated filing claim anywhere in the UI or emails. |
| D2 | Data processing agreements | DPAs with Firebase/Google, email and payment providers; incident response and breach notification procedure documented. |
| D3 | Support process | Published hours, response expectations, escalation path, and a process for payment/photo disputes. |
| D4 | Accessibility and content review | Keyboard/AT pass on all shipped screens, both locales; no untranslated strings; no invented reviews/statistics; independence disclosure prominent. |
| D5 | Independent testing | End-to-end test of a real application, cash receipt, filing, confirmation and portal access in a staging environment with production-like credentials. |

## Sign-off record

| Area | Owner | Date | Evidence link |
|---|---|---|---|
| Technical readiness | | | |
| Legal/privacy | | | |
| Payments/accounting | | | |
| Operations/filing | | | |

Until this table is complete, the product should remain in demo/staging and must not take real payments or process real applicant data.
