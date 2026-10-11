# Skills Ville ERP: setup and handover

## Accepted decisions, 11 October 2026

The founder approved packages A+B+C+D from the ERP proposal: the internal ERP, abacus learning operations, franchise commercial operations and parent services.

The founder then specified that Head Office must configure student fees and royalty terms. No monetary defaults are seeded. Level progression requires **12 distinct classes attended by the individual student at their current level**. The owner explicitly confirms advancement; the database verifies eligibility and records the change. Advancement clears the old batch assignment so the student can be assigned to a batch at the new level. This does not alter the existing 70/100 pass rule for separately recorded exams.

The requested low-cost payment path is manual UPI / bank transfer. Head Office configures actual payee details; a submitted reference remains pending until an owner or Head Office verifies receipt against the bank/cash records. A browser callback, UPI link or submitted reference never marks an invoice paid. A verified claim issues one immutable receipt, including on repeated verification requests.

WhatsApp uses official click-to-chat links. Staff select a consenting contact and a Head Office template, review the text, then send it in WhatsApp. The ERP does not send automatically or claim delivery. No paid gateway or WhatsApp API is required by this implementation. Bank, connectivity and hosting terms still need checking; no promise of zero external costs is made. References: [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934), [NPCI UPI FAQs](https://www.npci.org.in/what-we-do/upi/faqs).

## Implemented scope

- Responsive centre workspace and Head Office views, including all-centre overview, cash-basis reporting and audit views.
- Admissions stages, follow-up dates, atomic enquiry-to-student conversion, student details and batch assignment.
- Head Office fee plans, exact monthly instalments, dues, discount requests and Head Office approval, pending payment references, verified receipts, CSV exports and printable receipts.
- Class timetable with teacher/room/batch conflict checks, capacity checks, actual class attendance, assessments, homework, 12-class progression, progression history and teacher training records.
- Head Office stock catalogue and prices, accountable stock movements, procurement approval/receipt and negative-stock rejection.
- Expense records, Head Office royalty rules, non-overlapping royalty statements and recorded cash-basis surplus for a selected period.
- Franchise agreements, onboarding checklist and renewal dates.
- Owner/staff/parent memberships, linked-child parent access, parent fees/receipts/learning records and appointment requests/confirmation.
- Approved WhatsApp templates, contact consent records and reviewed click-to-chat drafts.
- Database-generated audit history with actors and changed-field names. It intentionally does not copy full sensitive records into the audit table.
- Actual exam result persistence and printable certificates; invalid marks and fabricated pass/certificate states are rejected.

No generative AI is used. All operational records come from user input and stored data; eligibility, amounts and transitions use deterministic rules.

## Existing data and route continuity

`students`, `batches`, `franchises`, `profiles`, `user_roles`, `finance_ledger` and `exam_results` remain the existing records. Most former dashboard/placeholder pages redirect to their working ERP counterparts. Existing Head Office invoices are separate from student-fee invoices and remain accessible. Existing product catalogue and broadcast tools remain available from Head Office navigation. Existing student photo enrolment remains available to owners through the student directory.

The new ERP stock ledger starts with explicit stock opening movements. **It does not silently import or overwrite the old `franchise_inventory`, `products`, `orders`, `teachers` or training tables.** Reconcile and import actual balances/teacher account memberships in staging before switching operating procedures. No existing invoice is marked paid or converted automatically. The old non-transactional order helper and simulated payment paths were removed.

## Configure and validate a test environment

1. Use the intended Supabase staging project. Inventory its existing tables, grants, policies, triggers and extensions first. The live schema has not been accessed in this task.
2. The original `docs/supabase-schema.sql` is historical setup documentation, not an incremental migration. Do not rerun it against an existing database. For a fresh environment, create the existing core tables from a reviewed baseline; its public student-photo bucket policy also needs a separate privacy review before use with real children’s photos.
3. Apply `supabase/migrations/202610110001_erp.sql` and then `202610110002_exams.sql` once, using the project migration process. They require the existing core tables. They add new ERP tables and replace the specifically identified legacy policies that treated profile franchise assignment as owner authorisation.
4. Create `.env.local` from `.env.example`, using the approved project URL and its public/publishable client key. Service-role keys must never be put in a `VITE_` variable, browser code, committed files or chat. The app explicitly shows configuration required when the client connection is missing.
5. Create real accounts through Supabase Auth's secure administrative process. Add an initial `super_admin` record in `user_roles` through a trusted database administrator. Create a centre in the existing Head Office directory; use ERP → People & permissions to assign the existing account UUID and role. No browser-side account signup changes the administrator's session.
6. Head Office configures fee plans, royalty rules, UPI/bank details, templates, stock catalogue and franchise dates per centre. Owners assign staff/parent accounts, link children, assign fee plans and record actual opening stock. No sample values from the design preview should be imported.
7. Test with at least two real staging franchises, each role, and an inactive account. Verify actual Auth session handling, RLS, persistence, account disablement, duplicate/conflicting requests and exports. Check existing policies not present in the repository, which could broaden access through PostgreSQL's permissive-policy rules.
8. Review and reconcile balances and records, take a database backup, approve the release, then deploy the frontend with the reviewed environment and SPA route fallback. Do not merge a branch into an auto-deployed main branch until these checks are complete.

## Verification commands

```text
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
npm run test:db
npm run build
```

The SQL integration checks run against ephemeral PGlite PostgreSQL with the inspected core schema and Supabase-like Auth roles. They do not connect to the live project. They exercise money and permission failures, atomic enrolment/plan assignment, receipt idempotency, stock/procurement, timetable conflicts, attendance progression, exams and audit immutability. They do not establish concurrency correctness under multiple independent PostgreSQL connections; run concurrency checks in staging.

The separate design preview is started by `npm run preview:design`; open `/erp/overview` on its printed local URL. It visibly labels all example records as sample data and disables saves. Its entry and fixture aliases are not used by the production build. `scripts/browser-check.mjs` checks the actual workspace component in this isolated preview with Playwright; supply a local Playwright module through `ERP_BROWSER_RUNTIME` if it is not installed in the checkout.

Desktop/mobile review images are in `docs/screenshots`. They show labelled design fixtures, not a live franchise.

## Remaining release requirements and limits

This is an implemented, locally tested ERP change. **No live database migration, production deployment, payment collection or WhatsApp message delivery has occurred.** A staging connection and authorised account provisioning are needed to verify and release it against real services.

Cash-basis reports exclude unrecorded expenses, unissued royalties, taxes and refunds. They are operational reports, not statutory accounts or tax invoices. Issued royalty statements are immutable; configuration changes should be accompanied by reviewed effective-date rules. A royalty statement crossing the selected report boundary is excluded; choose matching periods.

Records are paged from the database and tables show 25 rows at a time; reporting reads all accessible rows in the selected scope. High-volume deployments should add server-side aggregates and indexed reporting queries after measuring real data volumes. Role/tenant isolation is enforced in SQL; production needs a review of any additional live policies. The UI selects one primary account role; use separate logins for people needing distinct parent/staff roles until a role-switch workflow is specified.

Automated payment webhooks, bulk/automatic WhatsApp sending, refunds, tax/GST invoicing, formal inventory-accounting valuation, automated account invitations and file-based certificate archives are not included. They require specific provider/business decisions and separate reviewed implementation. The present flow implements the manual payment and WhatsApp choices accepted above.
