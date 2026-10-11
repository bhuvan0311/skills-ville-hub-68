# Skills Ville Franchise ERP

A React / TypeScript workspace for Skills Ville Abacus franchise operations and parent services, with Supabase authentication and PostgreSQL tenant permissions.

Head Office configures fees, royalty terms and payment details. Student progression requires 12 attended classes at the current level. Payments use manual UPI/bank/cash references and verified receipts; WhatsApp uses reviewed click-to-chat drafts. No generative AI is used in the application.

## Setup

See [ERP setup and handover](docs/ERP_SETUP_AND_HANDOVER.md) for migrations, account provisioning, existing-data reconciliation, release gates and known limits. The actual live schema and production deployment are not verified by this repository change.

Create an ignored .env.local from .env.example with the approved Supabase project URL and public client key. Never use a service-role key in browser variables.

    npm ci --ignore-scripts --no-audit --no-fund
    npm run dev

## Verification

    npm run typecheck
    npm test
    npm run test:db
    npm run build

The database tests use an ephemeral PostgreSQL database; they never touch live records. GitHub Actions runs these checks when its account/runner access is available.

## Design review

    npm run preview:design

Open /erp/overview at the printed local address. This separate preview labels every fixture as sample data and disables saving. Its aliases and entry are excluded from the production build.

[Desktop preview](docs/screenshots/erp-desktop.png) · [Mobile preview](docs/screenshots/erp-mobile.png) · [Approved ERP proposal](docs/ERP_UPGRADE_PROPOSAL.md)
