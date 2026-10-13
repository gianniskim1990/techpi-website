# Owner decisions and missing facts required

Prepared 2026-10-13 for the next implementation phase. Each item says what it unblocks. Confirmed decisions are listed
first so they are not asked again. Note: this repository is public; send private values (legal identifiers, retention
schedules, contracts) through a private channel and record only the approved public wording here.

## Already confirmed (no action)

| # | Decision | Recorded in |
|---|---|---|
| ✓ | Pigiota314 is fully replaced by TechPi; canonical site `https://techpi.eu` | Migration brief |
| ✓ | `techpi.eu` and `techpi.gr` on Cloudflare; `www.techpi.eu` → apex; `techpi.gr` → `/el/` | `TECHPI_LAUNCH_STATUS.md` §2 |
| ✓ | `info@techpi.eu` hosted on the Pointer.gr cPanel server; website stays on Cloudflare Workers | `TECHPI_LAUNCH_STATUS.md` §2 |
| ✓ | `proposal.pigiota314.gr` → `proposal.techpi.eu` is the approved **future** hostname only | `migration-audit/OWNER_DECISIONS_UPDATE.md` (Decision A) |
| ✓ | Other legacy application subdomains stay untouched until separate plans are approved | Brief |
| ✓ | The site stays `noindex` until the owner explicitly authorises launch | Brief |

## Required before the next implementation phase

### Legal and company facts

| # | Question | Unblocks |
|---|---|---|
| O1 | Legal name, legal form, registered business address, GEMI and VAT numbers (if applicable) | Privacy/Cookies pages, footer legal line, Organization schema |
| O2 | Privacy contact (proposed `info@techpi.eu`) | Privacy page |
| O3 | Retention periods for enquiries and client correspondence | Privacy page §6 |
| O4 | Does Outlook sync `info@techpi.eu` through a Microsoft account, or is it a direct IMAP/SMTP client of the Pointer server? | Processor list in the Privacy page |
| O5 | Cloudflare: is Bot Fight Mode, a WAF challenge or any feature that sets `__cf_bm`/`cf_clearance` enabled for `techpi.eu`? | Cookies page §2 |
| O6 | Has the Cloudflare Data Processing Addendum been accepted; Pointer's data processing terms? | Privacy page §7 |
| O7 | Who performs the legal review of the Privacy and Cookies texts? | Publishing the legal pages |

### Website and content

| # | Question | Unblocks |
|---|---|---|
| O8 | Review and merge the Phase 2A Draft PR (`phase-2a-greek-work-lists`): fix F2, Greek lists on `/el/work` | P0-7 |
| O9 | Approve fix F1 (optional branch-scoped indexing guard), and check how the production and preview Workers Builds triggers are configured (per-trigger build variables; not inspected yet). Phase 2A: F1 not implemented; if wanted, first record `WORKERS_CI`/`WORKERS_CI_BRANCH` from one production and one preview build | P1-2, P1-8 |
| O10 | Who is the native Greek editorial reviewer, and by when? Scope: 26 Greek pages (24 existing content pages + Greek Privacy and Cookies) | P0-8 |
| O11 | Rights confirmations (rights checklist in `TECHPI_LAUNCH_CHECKLIST.md`): client screenshots, Logotherapia imagery, client naming and links | P0-9 |
| O12 | Which products are TechPi-owned vs client-owned (Saloon, Physio, Project4You, Rantevo.gr, Level Up Education App); relationship of Rantevo.gr and Saloon | Launch blocker 9; product presentation |
| O13 | Approve final wording of company and service claims (EU Projects programmes, Intelligence capability, About) | Launch |
| O14 | Contact method beyond email and phone (a form?) | Launch blocker 13; would change Privacy and CSP |
| O15 | Optional: shorten 9 case-study titles over 65 characters | SEO polish |

### Analytics, search and crawling

| # | Question | Unblocks |
|---|---|---|
| O16 | Analytics: A (Search Console only, recommended), B (cookieless analytics) or C (GA4 with consent banner) | Cookies page, monitoring |
| O17 | Which Google account owns Search Console; second owner; access to the `pigiota314.eu` and `pigiota314.gr` properties | P0-10, Change of Address |
| O18 | Training-crawler policy for `robots.txt` (allow all, or block specific AI training agents) | Launch blocker 12 |
| O19 | Launch date / explicit authorisation to enable indexing | P2 |

### Infrastructure (Cloudflare, DNS, email)

| # | Question | Unblocks |
|---|---|---|
| ✓ O20 | **Always Use HTTPS** for the `techpi.eu` zone: enabled by the owner; verified 2026-10-13 (HTTP → HTTPS 301) | Done |
| O21 | HSTS policy after a week of HTTPS-only (recommended `max-age=31536000`, no `includeSubDomains`/`preload` at first) | P2-3 |
| O22 | Enable DNSSEC for `techpi.eu` and `techpi.gr` (needs the DS record added at Pointer) | P1-6 |
| O23 | DMARC: reporting address for `rua=`; when to move from `p=none` to `quarantine` | P1-4 |
| O24 | `techpi.gr`: confirm it will not send mail, then publish `v=spf1 -all`, DMARC `p=reject`, optional null MX | P1-5 |
| O25 | `techpi.gr` redirect rule: keep as is, or avoid `/el/el/` for paths that already start with `/el/` | Polish |
| O26 | Is a `CAA` record wanted for `techpi.eu` (restricts which authorities may issue certificates; must include Cloudflare's issuers) | Optional hardening |
| O27 | Should `www.techpi.eu` keep dropping query strings, or preserve them like `techpi.gr` does | Consistency |

### Migration (from the six audit reports; still open)

| # | Question | Unblocks |
|---|---|---|
| O28 | Insights: create `/insights` with the seven `pigiota314.eu` articles (recommended) or redirect them to `/eu-projects` | Legacy redirects (D2) |
| O29 | `pigiota314.eu/` → `/eu-projects` (recommended) or `/` (D1) | Legacy redirects |
| O30 | Retired services and 13 historical portfolio items: 301 to `/el/work` or 410 (D3, D4); local and product landings (D5, D6); long-tail fallback (D7); Street Box = Rocketeer (D8) | Legacy redirects |
| O31 | Move the legacy DNS zones to Cloudflare to run the redirects (copying every mail and subdomain record unchanged) | Legacy redirects |
| O32 | Future of the `@pigiota314.gr` / `@pigiota314.eu` mailboxes, Mailgun on `notify.pigiota314.eu`, Resend on `pigiota314.gr` | Mail continuity |
| O33 | Plans for the other product subdomains (SalonPilot, PhysioPilot, BeautyPilot, Business OS, agents, airbnb, demo, hair) | Separate migrations |
| O34 | Registrar access, expiry and auto-renew for `pigiota314.gr`, `pigiota314.eu`, `techpi.eu`, `techpi.gr` | Continuity |
| O35 | Stabilise `pigiota314.gr` (intermittent timeouts/500s seen 2026-10-12) or bring the redirect phase forward | Search-signal preservation |
| O36 | Whether to fix the `pigiota314.eu` analytics/cookie-policy mismatch while that site is live | Compliance of the legacy site |
| O37 | Repository visibility (public): keep public, or make private before more operational details are documented | Information exposure |
