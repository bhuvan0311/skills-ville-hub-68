The existing app substituted sample records for empty or failed database results, simulated payment success, and granted franchise-owner access when role verification failed. This change adds an ERP workspace backed by scoped database records and replaces those misleading paths with verified access, persistence failures and explicit setup states.

The workspace covers admissions, student fees/instalments/receipts, discount approval, classes and attendance, learning records, stock/procurement, expenses and royalty statements, franchise renewals, staff permissions, parent appointments, consent-based WhatsApp drafts and audit history. Head Office sets fees, royalty rules and payment details. Owners advance students only after the database verifies 12 distinct attended classes at their current level. Existing 70/100 exam marking remains separate.

Payments use manual UPI/bank/cash references and explicit bank verification before issuing an immutable receipt. WhatsApp opens a reviewed click-to-chat draft; it never claims that a message was sent. No generative AI or business-data generation is used.

Validation completed locally:

- Production build and TypeScript check pass.
- 14 frontend/calculation/access tests pass.
- 15 PostgreSQL integration checks pass, covering tenant isolation, exact instalments, atomic admissions, payment/receipt idempotency, overpayment and discount rejection, stock/procurement, timetable clashes, progression, exams and audit immutability.
- Browser checks pass for 11 internal module screens, parent/teacher views, failed-save feedback and mobile navigation/overflow; these use clearly labelled design fixtures, with saving disabled.
- Dependency lock supports a clean install; automated CI checks are included.

Release remains pending staging setup. The actual Supabase schema, live account provisioning, concurrent database sessions and production deployment have not been verified. Apply the two reviewed migrations in staging, configure the public client connection, check any additional live policies and reconcile old stock/teacher data before merging an auto-deployed branch. See [setup and handover](ERP_SETUP_AND_HANDOVER.md), [desktop preview](screenshots/erp-desktop.png) and [mobile preview](screenshots/erp-mobile.png).
