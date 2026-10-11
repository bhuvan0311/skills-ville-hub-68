# Skills Ville ERP custom domain

The user requested `franchise.skillsville.in` and approved a publicly reachable ERP login page on 11 October 2026. The domain is registered with Sites for project `appgprj_6acb6f84553481919363ec4aa8b43241`, custom-domain ID `appgdom_6acb7929a088819196c4cab8d7cc2c5d`. It is pending DNS verification and HTTPS certificate initialization; registration alone does not establish a live custom domain.

The public DNS check returned GoDaddy nameservers `ns53.domaincontrol.com` and `ns54.domaincontrol.com`. The user chose to add the records privately with guidance.

In [GoDaddy Domain Portfolio](https://dcc.godaddy.com), select **skillsville.in → DNS → Add New Record**. Add only these records, with the default TTL, and save. Names here are relative to `skillsville.in`:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `franchise` | `custom-domains.chatgpt.site` |
| TXT | `_openai-site-verification.franchise` | `openai-site-verification=09G-GUT2MsS9_sETB_78QsBFVuIWURYlgFo_F2QuOxk` |
| TXT | `_cf-custom-hostname.franchise` | `fda750dc-5f58-4622-bcbe-ec84a27e6e68` |

These are the exact domain ownership records returned by the hosting service, not application credentials. Complete any GoDaddy account verification privately. Preserve existing root, www, mail and nameserver records. If a conflicting `franchise` record exists, inspect it before replacing it.

After saving, refresh the custom-domain status and verify public DNS, active HTTPS and the `/auth` route. Do not bypass a certificate warning. The initial generated URL remains [Skills Ville ERP](https://skills-ville-franchise-erp.easy-lamb-5969.chatgpt.site).

GoDaddy documents [adding CNAME records](https://www.godaddy.com/en-in/help/add-a-cname-record-19236?locale=en) and [adding TXT records](https://www.godaddy.com/en-uk/help/add-a-txt-record-19232). DNS changes may take time to propagate; readiness must be established by successful validation rather than a fixed waiting period.
