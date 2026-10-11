# Skills Ville franchise ERP — proposal for approval

Prepared 11 October 2026. Source reviewed: `bhuvan0311/skills-ville-hub-68`, commit `e4f95d26b4783c0b34fa5c068872c308a211d46e`. These are source-code observations, not a verification of the deployed app or Supabase database.

## Existing scope

The app routes include franchise dashboards, students, batches and schedule, attendance, kit inventory and ordering, franchise invoices, teachers, training, reports, batch exams, and settings. Head-office routes include franchises, products, broadcasts, analytics, payments, certificates, and settings.

Students and inventory substitute sample records for empty or failed database queries. Franchise payments and reports use hard-coded records. The payment dialog simulates success without a gateway. Exams use hard-coded batches and may show success after failed persistence. Certificates change status only in browser memory. Head-office analytics is a placeholder. The SQL document does not define all the tables referenced by the app. Actual database policies and installed migrations remain unverified.

## Work already authorized: improve existing functions

- Correct role checks: missing or failed role verification must never grant access; stale responses must never restore a logged-out account.
- Remove misleading sample records and success messages from the workflows being repaired.
- Connect existing invoice and export screens to scoped database records; distinguish empty results, loading, and errors.
- Stop simulated payments. Only an actual configured checkout may initiate payment; the browser must never declare an invoice paid.
- Test authorization and data-failure paths, type-check, and build. Record observed limitations rather than claim a production-ready ERP.

No live database changes or deployment are part of this initial repair pass.

## Proposed additions — approval required before implementation

| Package | New capabilities | Acceptance criteria |
| --- | --- | --- |
| A — Core ERP (recommended first) | Admissions enquiries and follow-ups; student fee plans, instalments, discounts with approval, receipts and dues; staff roles and permissions; activity/audit history; operational head-office reports | One franchise cannot read or change another franchise's data; role boundaries are enforced by the database; money uses exact minor units; receipts follow confirmed payments; failed operations cannot report success; important changes record actor and time. |
| B — Abacus learning operations | Level and skill assessments, configurable progression criteria, homework/practice tracking, intervention lists, teacher allocation and timetable conflict checks | Criteria are explicitly configured by Skills Ville; marks and progression are reproducible; teacher and classroom clashes are rejected; progression requires recorded evidence. Existing pass marks will not be silently changed. |
| C — Franchise commercial operations | Royalty rules and statements; expenses and centre profitability; procurement approvals, stock movements and reconciliation; franchise onboarding and renewal tracking | Royalty formulas and terms require your rules; reports reconcile with source records; stock changes have an accountable movement; orders and invoices are created together in a database transaction. |
| D — Parent and communication services | Parent portal, approved attendance/dues notifications, appointment requests, payment-provider integration, optional email/SMS/WhatsApp | Parents can access only linked students; messages require approved templates and consent; payment confirmation requires verified provider events; retries do not create duplicate payments or messages. Provider accounts and costs require a separate decision. |

## Design direction

Keep the Skills Ville identity. Build a clear, mobile-friendly work area with a compact sidebar, a daily action dashboard, consistent searchable tables, readable financial summaries, accessible forms, useful empty states, and clear confirmation/error feedback. Design and usability improvements to existing screens do not imply approval for the proposed modules.

## Decisions needed

1. Approve package A only, packages A+B+C, or all four packages. You can select individual capabilities instead.
2. Confirm who will use the ERP: franchise owners and head office only, or also teachers, reception staff, and parents.
3. Before finance implementation, provide actual fee, royalty, discount, receipt, and refund rules. Before live integration, identify the intended Supabase project and payment/messaging providers. No account credentials should be posted in chat.

## Release gates

Each approved package will be implemented in reviewable increments. Validate tenant isolation in a test database with at least two franchises and each supported role; test real workflow persistence and failure handling; validate migrations and rollback planning against a staging database; review on mobile and desktop; reconcile finance and inventory calculations with agreed examples. Launch readiness requires these checks against a configured environment. A successful frontend build alone does not prove database security, payment processing, or deployment readiness.

## AI and data accuracy

No generative AI is needed for the proposed ERP. Calculations, status changes, reports, and alerts should follow explicit rules and stored records. An AI feature would require separate approval, a defined data boundary, and human review; it cannot approve payments, alter marks, or invent business records.
