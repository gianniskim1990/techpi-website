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
| ✓ O1 | Legal name, legal form, registered address and VAT status confirmed (2026-10-13). Both VAT/ΑΦΜ and GEMI registration numbers supplied and expressly approved for publication; stored in `registrationFacts` on Draft PR #21 (GEMI owner supplied 2026-10-14 with a public registry link). Postal code not supplied. | Done |
| ✓ O2 | Privacy contact: **info@techpi.eu** (confirmed) | Done |
| ✓ O3 | Retention: **12 months after the most recent communication** for enquiries and quotation requests that do not lead to work; client records per statutory requirements (periods not stated) | Done (an operational duty: checklist P0-12) |
| ✓ O4 | Email client: **Outlook Classic over IMAP/SMTP** (not New Outlook) and Roundcube webmail; mailbox hosted by Pointer.gr cPanel. Microsoft is not listed as a provider | Done |
| ✓ O5 | Cloudflare security (owner's settings export, 2026-10-13): Free plan; Bot Fight Mode **off**; AI Labyrinth off; Browser Integrity Check **on**; Managed Ruleset active; HTTP DDoS protection active; Email Address Obfuscation shown as enabled; Continuous Script Monitoring off. Cookies Policy written accordingly (`cf_clearance` possible when a security check is shown; never claimed as always present) | Done |
| ✓ O6 | Contracts (Cloudflare DPA, Pointer terms): **not verified**, so the pages claim no contract; transfers are described as Cloudflare states them in its own privacy policy | Done (no claim made) |
| ✓ O7 | Legal review: the owner has decided **not** to commission an external lawyer review at this stage. Not a development blocker; the texts do not claim lawyer approval | Done |

### Website and content

| # | Question | Unblocks |
|---|---|---|
| ✓ O8 | ~~Review and merge the Phase 2A Draft PR~~: merged as PR #20 (2026-10-13) | Done |
| O9 | Approve fix F1 (optional branch-scoped indexing guard), and check how the production and preview Workers Builds triggers are configured (per-trigger build variables; not inspected yet). Phase 2A: F1 not implemented; if wanted, first record `WORKERS_CI`/`WORKERS_CI_BRANCH` from one production and one preview build | P1-2, P1-8 |
| O10 | Who is the native Greek editorial reviewer, and by when? Scope: 26 Greek pages (24 existing content pages + Greek Privacy and Cookies) | P0-8 |
| O11 | Rights confirmations (rights checklist in `TECHPI_LAUNCH_CHECKLIST.md`): client screenshots, Logotherapia imagery, client naming and links | P0-9 |
| O12 | Which products are TechPi-owned vs client-owned (Saloon, Physio, Project4You, Rantevo.gr, Level Up Education App); relationship of Rantevo.gr and Saloon | Launch blocker 9; product presentation |
| O13 | Approve final wording of company and service claims (EU Projects programmes, Intelligence capability, About) | Launch |
| O14 | Contact method beyond email and phone (a form?) | Launch blocker 13; would change Privacy and CSP |
| O15 | Optional: shorten 9 case-study titles over 65 characters | SEO polish |

### Phase 2B: points for the owner's review of the legal pages (Draft PR)

| # | Question | Why it matters |
|---|---|---|
| ✓ L1 | ~~Read and approve the final wording of the four pages on the Draft PR preview~~: approved and published with PR #21 (merged 2026-10-14) | Done |
| ✓ L2 | ~~Both policies said Search Console **is** used~~. **Corrected 2026-10-13** to prospective wording while the property was unverified. **Phase 2E (2026-10-17, Draft PR):** the property is verified, so both policies (EN and EL) now say so, without claiming a submitted sitemap, indexing or reports. Review the wording on the Phase 2E preview (L8) | Done at merge |
| ✓ L3 | ~~"We do not transfer your personal data outside the EEA ourselves"~~. **Removed 2026-10-13** in EN and EL. The Transfers section now only describes Cloudflare's possible processing outside the EEA and the mechanisms Cloudflare itself states (EU–U.S. DPF, SCCs as fallback), attributed to Cloudflare's privacy policy. The validator keeps the absolute statement out | Done |
| ✓ L4 | **Both GEMI and VAT/ΑΦΜ numbers supplied and approved for publication**, set in `src/content/site.ts` and published on both Privacy pages with PR #21 (verified on production 2026-10-17). The legal validator requires both on each Privacy page and rejects invalid formats | Done |
| L5 | Pointer.gr is named by its brand name only; its legal entity name was not supplied. Add it only if you want it shown | Precision |
| L6 | Legal bases are stated as Article 6(1)(b), (c) and (f) GDPR, with no consent-based processing. This is the standard reading for this kind of site, but it has not been reviewed by a lawyer (your decision) | Awareness |
| L7 | Cloudflare's dashboard shows Email Address Obfuscation enabled, but live pages (served by the Worker) show no rewriting. If Cloudflare ever began rewriting `mailto:` links, its decode script would be blocked by the site's Content Security Policy. Re-check `/contact` and the legal pages after deploy; turning the feature off is optional | Email links keep working |
| L8 | **Phase 2E (Draft PR):** read the new Search Console sentence in the four policies (EN and EL) and the version date 17 October 2026 on the preview, then approve the merge | Accurate policies |

### Analytics, search and crawling

| # | Question | Unblocks |
|---|---|---|
| ✓ O16 | Analytics: **Google Search Console only** (no GA4, no Meta Pixel, no advertising trackers, no profiling, no other analytics) | Done |
| ◐ O17 | Search Console ownership. **2026-10-16 (owner):** `techpi.eu` Domain property verified; access to the `pigiota314.eu` and `pigiota314.gr` properties confirmed; historical exports saved (P0-10 done). Still open: a second owner account | Change of Address |
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
| ✓ O28 | Insights: **decided 2026-10-16: `/insights` with the seven `pigiota314.eu` articles, slugs kept, English only.** Published with PR #22 (merged 2026-10-17), still `noindex` (`docs/content/insights-migration.md`). Greek versions: a later phase | Legacy redirects (D2) |
| O29 | `pigiota314.eu/` → `/eu-projects` (recommended) or `/` (D1) | Legacy redirects |
| O30 | Retired services and 13 historical portfolio items: 301 to `/el/work` or 410 (D3, D4); local and product landings (D5, D6); long-tail fallback (D7); Street Box = Rocketeer (D8) | Legacy redirects |
| O31 | Move the legacy DNS zones to Cloudflare to run the redirects (copying every mail and subdomain record unchanged) | Legacy redirects |
| O32 | Future of the `@pigiota314.gr` / `@pigiota314.eu` mailboxes, Mailgun on `notify.pigiota314.eu`, Resend on `pigiota314.gr` | Mail continuity |
| O33 | Plans for the other product subdomains (SalonPilot, PhysioPilot, BeautyPilot, Business OS, agents, airbnb, demo, hair) | Separate migrations |
| O34 | Registrar access, expiry and auto-renew for `pigiota314.gr`, `pigiota314.eu`, `techpi.eu`, `techpi.gr` | Continuity |
| O35 | Stabilise `pigiota314.gr` (intermittent timeouts/500s seen 2026-10-12) or bring the redirect phase forward | Search-signal preservation |
| O36 | Whether to fix the `pigiota314.eu` analytics/cookie-policy mismatch while that site is live | Compliance of the legacy site |
| O37 | Repository visibility (public): keep public, or make private before more operational details are documented | Information exposure |
