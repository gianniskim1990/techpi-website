# TechPi launch checklist

Prepared 2026-10-13. Ordered by priority. **Nothing in this list has been executed by the audit**, except where marked
"done (verified)". Owners: **Owner** = business owner; **Dev** = implementation PR (Claude Code or developer, after
approval); **Legal** = legal reviewer; **Reviewer** = native Greek editor.

Status keys: ☐ open · ☑ done (verified) · ◐ partly done · **▣ implemented on a Draft PR** (not merged, not deployed: done only after merge and a production check).

---

## P0 — must be done before indexing is enabled

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☑ P0-1 | `techpi.eu` on Cloudflare, Worker connected, HTTPS certificate | Owner | — | Done (verified 2026-10-13). Re-verified 2026-10-18 (Phase 2G, read-only): production serves `main` at `da398aa`; all 60 content pages and the sitemap byte-identical to that build (62 HTML pages with the two 404s) |
| ☑ P0-2 | `www.techpi.eu` → apex 301; `techpi.gr` → `/el/` 301 | Owner | — | Done (verified): 301s for HTTP and HTTPS, paths preserved |
| ☑ P0-3 | **Force HTTPS on the `techpi.eu` apex** (Cloudflare → `techpi.eu` → SSL/TLS → Edge Certificates → **Always Use HTTPS**: On) | Owner | — | Done: owner-enabled; verified 2026-10-13: `http://techpi.eu/work` → **301** → `https://techpi.eu/work` (path and query kept) |
| ☑ P0-4 | Legal entity details | Owner | — | Done (owner-confirmed 2026-10-13): Ioannis Kimoundris / Ιωάννης Κιμούντρης, Greek sole proprietorship (ατομική επιχείρηση), registered address Χρ. Μπρωκούμη 30, Ξάνθη (30 Chr. Brokoumi Street, Xanthi), privacy contact info@techpi.eu, approved for publication; registered in GEMI and subject to VAT. Both GEMI and VAT numbers were supplied and approved, and are **published** on `/privacy` and `/el/privacy` since PR #21 (P0-14; verified on production 2026-10-17). Postal code: not supplied and not published |
| ☑ P0-5 | Privacy and Cookies policy text, EN and EL | Owner | P0-4 ✓, analytics decision ✓ | Original wording approved by the owner and published with PR #21 (2026-10-14); the verified Search Console sentence and the 17 October 2026 version date published with PR #23 (merged by the owner); the Greek policies are covered by the owner's sign-off of all 26 Greek pages (P0-8). No external legal review, by the owner's decision; the texts do not claim one. The optional Greek Cookies style edits (G4) are declined: the legal text stays as published |
| ☑ P0-6 | Publish `/privacy`, `/cookies`, `/el/privacy`, `/el/cookies` and footer links | Dev | P0-5 | Done: PR #21 merged 2026-10-14; live and verified 2026-10-17 (pages 200, footer legal links, GEMI and VAT shown, 301s for slash and `.html` variants) |
| ☑ P0-7 | Fix Greek lists on `/el/work` (fix F2 in `TECHPI_LAUNCH_STATUS.md`) | Dev | — | Done: PR #20 merged 2026-10-13; Greek lists verified on production 2026-10-17; `scripts/content/validate.mjs` runs inside `npm run build` |
| ◐ P0-8 | Greek editorial review of all **26 Greek pages** (6 page types + 18 case studies + Greek Privacy and Cookies). The 8 Insights pages are English only | Owner / Reviewer | — | **Owner sign-off 2026-10-18:** the owner personally read and approved all 26 Greek pages as published from `main` at `da398aa` (after the Phase 2F corrections). **Open:** the owner's review of the Greek text changed in Phase 2H (Draft PR; listed in `GREEK_EDITORIAL_AUDIT.md` §6). Done once that is approved |
| ☑ P0-9 | Rights and approvals checklist below completed | Owner | — | **Owner attestation 2026-10-18** (not independently verified written licences): permission to present all 18 projects publicly, including client names, images, screenshots, embedded logos and external links; the Logotherapia images on TechPi show no identifiable children. See the rights table below |
| ☑ P0-10 | Search Console: `techpi.eu` Domain property verified; legacy property access confirmed; historical data exported | Owner | — | Done (owner-confirmed 2026-10-16): Domain property verified; historical data exported from both legacy properties. No sitemap submitted yet (P2-2) |
| ☐ P0-11 | Final pre-launch QA on the release candidate | Dev | P0-8 | Phase 2G (2026-10-18) QA of `main` at `da398aa`: 1,440 checks, 1,438 pass (one test artefact, one HSTS recommendation). **To repeat on the final release candidate** (after Phase 2H is merged and deployed) on launch day: check/build/validators, live = build, browser sweep |
| ☐ P0-12 | **Operate the 12-month enquiry retention** stated in the Privacy Policy: at least every few months, delete or anonymise enquiry emails (and local Outlook copies) more than 12 months after the last communication when no collaboration followed, unless a legal obligation or justified need applies | Owner | P0-6 merged | A recurring reminder exists; first review done |
| ☑ P0-13 | Search Console wording matches reality at go-live | Dev | P0-10 ✓ | Done: PR #23 merged; production verified 2026-10-18: all four policies say the `techpi.eu` Domain property has been verified, without claiming a submitted sitemap, indexing or reports. The legal validator requires the exact statements |
| ☑ P0-14 | **GEMI and VAT/ΑΦΜ identifiers** published on `/privacy` and `/el/privacy` | Dev/Owner | — | Done: PR #21 merged; both identifiers shown on production (verified 2026-10-17); the legal validator requires both. Law 4919/2022 Art. 22(3)(d); P.D. 131/2003 Art. 4(1)(d) and (g) |

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
| ☐ P3-1 | Legacy redirects `pigiota314.eu` then `pigiota314.gr` (`migration-audit/REDIRECT_MAPPING.md`, `MIGRATION_EXECUTION_PLAN.md`) | Owner, Dev | P2 done; owner decisions D1, D3–D8; Insights (D2) decided 2026-10-16 and built on the Phase 2D Draft PR: `pigiota314.eu/insights[/<slug>]` → `techpi.eu/insights[/<slug>]`, same path (`docs/content/insights-migration.md`) | Smoke tests per mapping; mail and product subdomains untouched |
| ☐ P3-2 | Change of Address for both legacy properties | Owner | P3-1 | `SEARCH_CONSOLE_SETUP.md` §6 |
| ☐ P3-3 | Monitoring at 30/60/90 days | Owner | P2, P3-1 | `SEARCH_CONSOLE_SETUP.md` §7 |
| ☐ P3-4 | `proposal.pigiota314.gr` → `proposal.techpi.eu` (Decision A plan) | Owner, Dev | Separate approved plan | Plan in `migration-audit/OWNER_DECISIONS_UPDATE.md` |

---

## Rights and editorial approvals checklist

"Verified" means confirmed from evidence available in the repository or on public pages. Public availability is **not**
the same as a licence. The 2026-10-18 confirmations are the owner's attestations; no written licences were reviewed.

| Item | What is used on TechPi | Verified | Owner confirmation still needed |
|---|---|---|---|
| Client screenshots: Rocketeer | Admin dashboard and sign-in screen (shows the Rocketeer logo), EN/EL case study | Same project and images previously published by pigiota314 on its own portfolio | ☑ **Owner attestation 2026-10-18** (permission to present all 18 projects, names, images, screenshots, embedded logos, links) |
| Client screenshots: Arman's Ethnic Street Food | Admin view and devices mockup | Previously published by pigiota314 | ☑ Owner attestation 2026-10-18 |
| Client screenshot: Logotherapia Xanthi | Capture of the live website | Captured by TechPi from the public site (`portfolio-migration.md`) | ☑ Owner attestation 2026-10-18, including that the images on TechPi show **no identifiable children** |
| Rantevo.gr screenshots | Booking homepage and business page (the signed-in dashboard with a personal name was deliberately not used) | Presented as a client project since Phase 2H | ☑ Owner attestation 2026-10-18 |
| Other 14 case studies | Text only, no images | — | ☑ Owner attestation 2026-10-18 (naming all 18 clients/projects) |
| Third-party logos | Only inside screenshots (Rocketeer, Arman's, Rantevo, Logotherapia site branding); no logo wall | Verified: no standalone client logos on TechPi | ☑ Covered by the owner attestation |
| Client names and live links | 18 client/project names; external client links | Facts taken from the legacy portfolio (`portfolio-migration.md`); all links resolve (Phase 2G, 2026-10-18) | ☑ Owner attestation 2026-10-18 |
| Company and service claims | Capabilities (incl. AI & Intelligence), EU Projects (white-label work, rapid start, parallel projects, WCAG 2.2 AA as a design target; non-affiliation disclaimer), About | No superlatives, certifications or metrics found | ☑ Approved by the owner 2026-10-18; EU disclaimer reworded to "independent technology business" (G2, Phase 2H) |
| Presentation of the five web applications | Level Up Education App, Saloon, Physio, Project4You, Rantevo.gr | **Decided 2026-10-18 (O12): client projects**, not TechPi-owned products; regrouped in Phase 2H | ☑ |
| Legacy pigiota314 attribution | Footer line, About, homepage evolution, "Earlier work by pigiota314" on 6 projects | Verified: historical only, no links to legacy hosts | ☑ Approved by the owner 2026-10-18 |
| Greek editorial review | 26 Greek pages | Owner sign-off 2026-10-18 on `da398aa` | ◐ Phase 2H Greek changes to review (P0-8) |
| Intro footage and identity assets | Original intro footage and 3D identity | Repository records them as original/approved (`identity-font-readiness.md`, intro docs) | — |
| Font | Commissioner, SIL OFL 1.1, self-hosted, licence file in repo | Verified | — |
