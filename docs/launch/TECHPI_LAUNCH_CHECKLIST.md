# TechPi launch checklist

Prepared 2026-10-13. Ordered by priority. **Nothing in this list has been executed by the audit**, except where marked
"done (verified)". Owners: **Owner** = business owner; **Dev** = implementation PR (Claude Code or developer, after
approval); **Legal** = legal reviewer; **Reviewer** = native Greek editor.

Status keys: ☐ open · ☑ done (verified) · ◐ partly done · **▣ implemented on a Draft PR** (not merged, not deployed: done only after merge and a production check).

---

## P0 — must be done before indexing is enabled

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☑ P0-1 | `techpi.eu` on Cloudflare, Worker connected, HTTPS certificate | Owner | — | Done (verified 2026-10-13): 50 pages live, identical to `main`, certificate valid to 2027-01-11 |
| ☑ P0-2 | `www.techpi.eu` → apex 301; `techpi.gr` → `/el/` 301 | Owner | — | Done (verified): 301s for HTTP and HTTPS, paths preserved |
| ☑ P0-3 | **Force HTTPS on the `techpi.eu` apex** (Cloudflare → `techpi.eu` → SSL/TLS → Edge Certificates → **Always Use HTTPS**: On) | Owner | — | Done: owner-enabled; verified 2026-10-13: `http://techpi.eu/work` → **301** → `https://techpi.eu/work` (path and query kept) |
| ☑ P0-4 | Legal entity details | Owner | — | Done (owner-confirmed 2026-10-13): Ioannis Kimoundris / Ιωάννης Κιμούντρης, Greek sole proprietorship (ατομική επιχείρηση), registered address Χρ. Μπρωκούμη 30, Ξάνθη (30 Chr. Brokoumi Street, Xanthi), privacy contact info@techpi.eu, approved for publication; registered in GEMI and subject to VAT. Both VAT and GEMI numbers are now supplied, approved and set on the Draft PR (P0-14). Postal code: not supplied and not published |
| ◐ P0-5 | Privacy and Cookies policy text, EN and EL | Owner | P0-4 ✓, analytics decision ✓ | Written from the confirmed facts (`src/content/legal.ts`). The owner has decided **not** to commission an external legal review; the texts are not lawyer-approved and do not claim to be. Remaining: the owner reads and approves the final wording on the Draft PR preview (`OWNER_DECISIONS_REQUIRED.md` §Phase 2B) |
| ▣ P0-6 | Publish `/privacy`, `/cookies`, `/el/privacy`, `/el/cookies` and footer links | Dev | P0-5 | Implemented on the Phase 2B Draft PR (branch `phase-2b-legal-pages`): 54 pages, sitemap 52 URLs, reciprocal hreflang, footer legal links on every page, 301s for slash and `.html` variants, `scripts/content/validate-legal.mjs` in `npm run build`. Done when merged and verified on production |
| ◐ P0-7 | Fix Greek lists on `/el/work` (fix F2 in `TECHPI_LAUNCH_STATUS.md`) | Dev | Owner approval | Implemented on `phase-2a-greek-work-lists` (Draft PR): only `/el/work` changes (22 strings, 10 rows), the other 109 output files are identical; `node scripts/content/validate.mjs` passes and now runs inside `npm run build`. Done when merged and deployed |
| ☐ P0-8 | Greek editorial review of all **26 Greek pages**: the 24 existing content pages (6 page types + 18 case studies) plus the Greek Privacy and Cookies pages (now written, on the Phase 2B Draft PR) | Reviewer | P0-6, P0-7 | Reviewer sign-off; corrections merged |
| ☐ P0-9 | Rights and approvals checklist below completed | Owner | — | Every row marked confirmed or the asset removed/replaced by decision |
| ☐ P0-10 | Search Console: `techpi.eu` Domain property verified; legacy property access confirmed; historical data exported | Owner | — | `SEARCH_CONSOLE_SETUP.md` §1–3 done; exports stored privately |
| ☐ P0-11 | Final pre-launch QA on the release candidate | Dev | P0-6 … P0-8 | check/build/SEO/security/asset/content validators pass; live = build; browser sweep clean |
| ☐ P0-12 | **Operate the 12-month enquiry retention** stated in the Privacy Policy: at least every few months, delete or anonymise enquiry emails (and local Outlook copies) more than 12 months after the last communication when no collaboration followed, unless a legal obligation or justified need applies | Owner | P0-6 merged | A recurring reminder exists; first review done |
| ☑ P0-13 | Search Console wording matches reality at go-live | Dev | — | Done 2026-10-13: both policies (EN and EL) now say TechPi *intends* to use Search Console, because the Domain property is not yet verified. After P0-10, the present tense may be restored (update `src/content/legal.ts` and the retired-claim patterns in `scripts/content/validate-legal.mjs` together) |
| ▣ P0-14 | **GEMI and VAT/ΑΦΜ identifiers:** both supplied, expressly approved for publication, and set in `registrationFacts` on Draft PR #21. | Dev/Owner | — | Build must show both identifiers on `/privacy` and `/el/privacy`; legal validator now requires both. Confirm Cloudflare preview, then owner reviews final wording before merge. Law 4919/2022 Art. 22(3)(d); P.D. 131/2003 Art. 4(1)(d) and (g). |

## P1 — strongly recommended before launch

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☑ P1-1 | Analytics decision | Owner | — | Decided 2026-10-13: **Google Search Console only** at launch. No GA4, no Meta Pixel, no advertising trackers, no profiling, no other analytics |
| ☐ P1-2 | Optional defence in depth: branch-scoped indexing guard (fix F1), so the code itself keeps preview builds `noindex` whatever the trigger variables are | Dev | Owner approval | Isolated test: indexable only for a `main` build with the variable set; preview build stays `noindex`. **Phase 2A: reviewed, not implemented** until `WORKERS_CI`/`WORKERS_CI_BRANCH` are confirmed in this Worker's builds (`TECHPI_LAUNCH_STATUS.md` §4, F1) |
| ☐ P1-3 | **Email authentication test.** From `info@techpi.eu` send a message to a Gmail address → Gmail → ⋮ → **Show original**: SPF **PASS**, DKIM **PASS** (`d=techpi.eu`), DMARC **PASS**. Repeat from Outlook if it sends through a different server. Optionally use a mail-tester service | Owner | — | Screenshot or header excerpt with three PASS results and `header.d=techpi.eu` |
| ☐ P1-4 | DMARC reporting: add `rua=mailto:<address>` to `_dmarc.techpi.eu` (keep `p=none` for 2–4 weeks, then consider `quarantine`) | Owner | P1-3 | Aggregate reports arrive; all legitimate sources aligned |
| ☐ P1-5 | `techpi.gr` anti-spoofing (domain sends no mail): SPF `v=spf1 -all`, DMARC `v=DMARC1; p=reject;`, optionally null MX `0 .` | Owner | Decision that `techpi.gr` will not send mail | DNS shows the records; no mail flow affected (none exists) |
| ☐ P1-6 | Enable **DNSSEC** for `techpi.eu` (Cloudflare → DNS → Settings → Enable DNSSEC → add the DS record at Pointer) | Owner | Pointer DS support for `.eu` | DNSSEC validation (`AD` flag) on a validating resolver; no resolution errors |
| ☐ P1-7 | Update `PUBLIC_ALLOW_INDEXING` procedure in `seo.md` if F1 is implemented | Dev | P1-2 | Doc matches code |
| ☐ P1-8 | **Inspect how the Worker's Workers Builds triggers are configured**: Cloudflare dashboard → Worker → Settings → Build (production trigger and preview trigger), or `GET /builds/triggers` and each trigger's `environment_variables`. Confirm `PUBLIC_ALLOW_INDEXING` is not set on either trigger today, and that at launch it will be set on the **production trigger only** | Owner | — | Screenshot or API output of both triggers' variables (secret values hidden); the preview trigger has no `PUBLIC_ALLOW_INDEXING=true` |

## P2 — launch day (only after explicit owner authorisation)

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☐ P2-1 | Set `PUBLIC_ALLOW_INDEXING=true` on the **production trigger** only (P1-8; or rely on F1 if implemented) and redeploy `main` | Owner | All P0 | Live: content pages have **no** robots meta; 404s still `noindex`; workers.dev/previews still `X-Robots-Tag: noindex` |
| ☐ P2-2 | Submit `https://techpi.eu/sitemap.xml` in Search Console; inspect home, `/el/`, two case studies | Owner | P2-1 | Sitemap "Success", URL count matches |
| ☐ P2-3 | HSTS on `techpi.eu`: `max-age=31536000` without `includeSubDomains`/`preload` | Owner | P0-3 (done 2026-10-13), then about a week of HTTPS-only | Header present on HTTPS responses |

## P3 — after launch (separate approvals)

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☐ P3-1 | Legacy redirects `pigiota314.eu` then `pigiota314.gr` (`migration-audit/REDIRECT_MAPPING.md`, `MIGRATION_EXECUTION_PLAN.md`) | Owner, Dev | P2 done; owner decisions D1–D8; Insights decision | Smoke tests per mapping; mail and product subdomains untouched |
| ☐ P3-2 | Change of Address for both legacy properties | Owner | P3-1 | `SEARCH_CONSOLE_SETUP.md` §6 |
| ☐ P3-3 | Monitoring at 30/60/90 days | Owner | P2, P3-1 | `SEARCH_CONSOLE_SETUP.md` §7 |
| ☐ P3-4 | `proposal.pigiota314.gr` → `proposal.techpi.eu` (Decision A plan) | Owner, Dev | Separate approved plan | Plan in `migration-audit/OWNER_DECISIONS_UPDATE.md` |

---

## Rights and editorial approvals checklist

"Verified" means confirmed from evidence available in the repository or on public pages. Public availability is **not**
the same as a licence: the owner's confirmation is still needed where marked.

| Item | What is used on TechPi | Verified | Owner confirmation still needed |
|---|---|---|---|
| Client screenshots: Rocketeer | Admin dashboard and sign-in screen (shows the Rocketeer logo), EN/EL case study | Same project and images previously published by pigiota314 on its own portfolio | ☐ Client agrees to use under the TechPi brand (written or email confirmation recommended) |
| Client screenshots: Arman's Ethnic Street Food | Admin view and devices mockup | Previously published by pigiota314 | ☐ Same |
| Client screenshot: Logotherapia Xanthi | Capture of the live website | Captured by TechPi from the public site (`portfolio-migration.md`) | ☐ Client consent; ☐ **confirm no identifiable children** appear (launch blocker 10) |
| Rantevo.gr screenshots | Booking homepage and business page (the signed-in dashboard with a personal name was deliberately not used) | TechPi/pigiota314 product | ☐ Confirm ownership/rights of Rantevo.gr content and its relationship to Saloon |
| Other 14 case studies | Text only, no images | — | ☐ Client agreement to be named (applies to all 18) |
| Third-party logos | Only inside screenshots (Rocketeer, Arman's, Rantevo, Logotherapia site branding); no logo wall | Verified: no standalone client logos on TechPi | ☐ Covered by the client confirmations above |
| Client names and live links | 18 client/project names; 8 external links | Facts taken from the legacy portfolio (`portfolio-migration.md`) | ☐ Each client still wants the link (and the link target is still correct) |
| Company and service claims | Capabilities, EU Projects (with non-affiliation disclaimer), About | No superlatives, certifications or metrics found | ☐ Owner approves final wording, especially EU programme references and the "Intelligence" capability |
| Presentation of TechPi-owned products | Saloon, Physio, Project4You, Rantevo.gr (Business Solutions); Level Up Education App (Our Products) | Groupings exist on `/work` | ☐ Confirm which are TechPi-owned vs client-owned (launch blocker 9) and whether their `pigiota314.gr` hosts may be mentioned later |
| Legacy pigiota314 attribution | Footer line, About, homepage evolution, "Earlier work by pigiota314" on 6 projects | Verified: historical only, no links to legacy hosts | ☐ Owner approves the wording and the six earlier-work entries |
| Greek editorial review | 24 Greek content pages now; 26 with the Greek Privacy and Cookies pages | Not done | ☐ Reviewer sign-off (P0-8) |
| Intro footage and identity assets | Original intro footage and 3D identity | Repository records them as original/approved (`identity-font-readiness.md`, intro docs) | — |
| Font | Commissioner, SIL OFL 1.1, self-hosted, licence file in repo | Verified | — |
