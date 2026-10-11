# Skills Ville ERP release status — 11 October 2026

The user authorised new services and selected the Skills Ville Supabase organization. The new project is **Skills Ville ERP Staging**, project ID `fqjigxiamgnhcspjitzi`, in Mumbai (`ap-south-1`). It is on the organization's Free plan. The integration's cost-check action was unavailable, so the user created the project privately through Supabase's dashboard.

The project was verified active and empty before setup. Six repository migrations, from `202610110000_fresh_core.sql` through `202610110005_function_access.sql`, were applied successfully. All 35 public application tables have RLS enabled. Student photos are in a private bucket; the application stores object paths and requests ten-minute signed URLs after permission checks. No original inactive Supabase project was restored or changed.

The user created and identified their own confirmed Auth account. Its Head Office role was assigned through the connected administrator tool. Passwords and privileged keys were not requested or recorded in this repository. The ignored local connection file uses only the project's public/publishable client key.

## Verified

- 16 application tests and type checking passed.
- 18 database checks passed for both the historical-core and fresh-core setup paths.
- `scripts/staging-sql-check.sql` passed against the real PostgreSQL 17 staging database. It verifies exact instalments, franchise/parent isolation, owner payment verification and idempotency, negative-stock rejection, 12-class progression, direct-progression denial, audit immutability, photo scope, RLS and anonymous RPC denial.
- The staging script uses simulated JWT subjects and transactional fixture rows without login credentials. It rolls everything back. A subsequent count confirmed one real Auth account and zero franchises, students, payments and audit rows. It does not establish browser login or actual Storage HTTP correctness.
- The source includes a clean fresh-project baseline without the historical sample data. Retained global product-catalogue and announcement screens have their required tables and permissions.

## Security report

The live advisor found direct anonymous function grants from Supabase's default privileges; migration `202610110005_function_access.sql` removes these. The follow-up report has no anonymous function warning and no table-RLS warning. It retains a warning for the twelve intentionally authenticated security-definer functions. These functions have explicit role/tenant checks and fixed empty search paths; the legacy identity helpers cannot enumerate other users.

Supabase also reports leaked-password checking disabled. This requires Pro or above and was not enabled by purchasing an upgrade. Use strong unique passwords and review production Auth settings. Reference: [Supabase password security](https://supabase.com/docs/guides/auth/password-security).

## Hosting and remaining checks

The Sites deployment succeeded on 11 October 2026 at [Skills Ville ERP](https://skills-ville-franchise-erp.easy-lamb-5969.chatgpt.site), using application source commit `93a488f1d53c1ec532f77db0747f122e398d4893`. The hosted `/auth` route displayed the ERP email/password login page without console errors. The owner subsequently reported that their private Head Office sign-in opened the dashboard. This is a user-confirmed login, not an agent-observed complete workflow. The user explicitly approved making the ERP login page public; the hosting access policy now reports `public`. Application data remains subject to Supabase authentication and row permissions.

At the user's request, `franchise.skillsville.in` is registered with Sites. Its domain verification and TLS are pending the three DNS records in [custom-domain setup](CUSTOM_DOMAIN_SETUP.md). The domain currently uses `ns53.domaincontrol.com` and `ns54.domaincontrol.com`; the subdomain did not resolve before setup. No root website, mail record or nameserver was changed.

GitHub's previously inspected jobs could not start because of an account billing lock. The user has been given the billing settings and recovery guide; no financial action or plan change was performed. Hosted checks must be rerun after the lock is resolved.

The user approved the temporary records and scoped cleanup in `docs/STAGING_CONCURRENCY_PLAN.md`. Verification from two different PostgreSQL connection IDs returned the same receipt and produced one payment for the 100-paise test claim. Of two four-unit stock deductions against a five-unit opening balance, one succeeded and one was rejected, leaving one unit. The request timestamps did not overlap: this establishes repeated-request safeguards, not simultaneous execution correctness. All temporary records were deleted within the approved scope; a subsequent count confirmed one real Auth account, its one Head Office role, and zero centre/student/payment/stock-movement records.

Actual overlapping concurrent requests, role-specific Auth sessions, student-photo upload/download, and a complete business workflow remain to be verified before declaring unrestricted franchise rollout complete. No real payments or WhatsApp messages have been sent. Fees, royalty rules, centre records and payment details remain unset for Head Office to configure.
