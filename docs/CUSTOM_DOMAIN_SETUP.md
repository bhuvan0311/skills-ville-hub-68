# Skills Ville ERP custom domain

The user selected Cloudflare Pages Free for `franchise.skillsville.in` on 11 October 2026 and approved a publicly reachable ERP login page. The existing Supabase project and ERP credentials carry over. The official Cloudflare GitHub app was authorized by the user for only `bhuvan0311/skills-ville-hub-68`; no other private repository was selected.

## Cloudflare deployment

- Account ID: `81ed25bd7863992aa0b9a3c96c95d70a`.
- Pages project: `skills-ville-franchise-erp`.
- Initial deployed source: `4c74a8c5a60b766b551f5a0e3035bcd68d18e30c`.
- Address: [Skills Ville ERP](https://skills-ville-franchise-erp.pages.dev).
- Production branch: `codex/skills-ville-erp`, not the older `main` branch.
- Build command: `npm run typecheck && npm test && npm run test:db && npm run test:db:fresh && npm run build`.
- Output directory: `dist`; root directory: repository root; framework preset: None (explicit Vite build).
- Build variables: `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_PUBLISHABLE_KEY`. No privileged key is configured in the browser build.

Cloudflare's dashboard reported successful deployment. The build gates completed: type check, 16 application tests, both 18-check database test paths and the production build. The database tests use ephemeral local databases; they do not change the Supabase project.

The user saved the CNAME record. Both an authoritative DNS server and the public 1.1.1.1 resolver return the expected target. Pages reports **Active · SSL enabled** for `franchise.skillsville.in`. The live HTTPS `/auth` route was inspected, and the user reported successful Head Office sign-in on the final domain. The public ERP address is [franchise.skillsville.in](https://franchise.skillsville.in).

## GoDaddy DNS

The public DNS check returned nameservers `ns53.domaincontrol.com` and `ns54.domaincontrol.com`. The user chose to add the record privately with guidance. After registering the hostname in Pages, use [GoDaddy Domain Portfolio](https://dcc.godaddy.com) → **skillsville.in → DNS → Add New Record**:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `franchise` | `skills-ville-franchise-erp.pages.dev` | Default |

This Name is relative to `skillsville.in`. Complete any GoDaddy account verification privately. Preserve existing root, www, mail and nameserver records. If a conflicting `franchise` record exists, inspect it before replacing it.

The earlier OpenAI Sites custom-domain registration was removed after the user chose Cloudflare. Do not add the previous `custom-domains.chatgpt.site` CNAME or OpenAI/Cloudflare-for-SaaS TXT verification records. The initial generated Sites address remains as a separate previously deployed copy; `.openai/hosting.json` records that hosting identity and is not the Cloudflare deployment configuration.

After saving, refresh Pages custom-domain status and verify public DNS, active HTTPS and the `/auth` route. Do not bypass a certificate warning. A registered hostname alone does not establish a live custom domain. The Cloudflare subdomain setup supports retaining the existing DNS provider; nameserver transfer is unnecessary.

References: [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Cloudflare SPA fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/), [GoDaddy CNAME instructions](https://www.godaddy.com/en-in/help/add-a-cname-record-19236?locale=en).
