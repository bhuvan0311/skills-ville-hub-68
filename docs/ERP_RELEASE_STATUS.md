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

The new Sites destination is recorded in `.openai/hosting.json`. It starts owner-private. Publishing status, browser login, SPA route refresh, and final audience are recorded here as each is verified. Its creation URL alone does not establish deployment.

GitHub's previously inspected jobs could not start because of an account billing lock. The user has been given the billing settings and recovery guide; no financial action or plan change was performed. Hosted checks must be rerun after the lock is resolved.

Concurrent requests from separate PostgreSQL connections, actual role-specific Auth sessions, student-photo upload/download, and a complete business workflow remain to be verified before declaring unrestricted franchise rollout complete. No real payments or WhatsApp messages have been sent. Fees, royalty rules, centre records and payment details remain unset for Head Office to configure.
