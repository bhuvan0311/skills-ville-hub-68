# Reviewable staging concurrency check

Target: the new `fqjigxiamgnhcspjitzi` staging project only. Existing inactive projects are excluded.

Create one clearly labelled temporary centre (`ERP-STAGING-CONCURRENCY-20261011`), one test student, one test fee plan/invoice/payment claim for 100 paise, and one test stock item with five units. No Auth users, credentials, real transfers, customer contacts or WhatsApp messages are created. These are test records, not monetary configuration defaults.

Submit the same claim for verification in two database requests, then verify that both resolve to one receipt and only 100 paise was recorded. Submit two stock deductions of four units each; require one successful deduction, one rejection and a final balance of one unit.

Capture connection identities and results. If separate overlapping database connections cannot be established through the connector, report that limitation rather than claiming concurrency was proven.

Cleanup is part of the test, including on a failed assertion: verify the temporary centre's exact identity; remove only its generated test payments, claims, invoices, fee plan, stock movements/item and student; then remove its test audit rows and centre. Confirm that the user's Auth account and Head Office role remain and that no test centre/student/payment remains. Never perform an unscoped delete.

The test requires a short-lived committed fixture because independent database connections cannot see rollback-only, uncommitted fixtures. The rollback-only permission and calculation tests have already passed without leaving records.
