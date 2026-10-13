# TechPi launch checklist

Prepared 2026-10-13. Ordered by priority. **Nothing in this list has been executed by the audit**, except where marked
"done (verified)". Owners: **Owner** = business owner; **Dev** = implementation PR (Claude Code or developer, after
approval); **Legal** = legal reviewer; **Reviewer** = native Greek editor.

Status keys: ☐ open · ☑ done (verified) · ◐ partly done.

---

## P0 — must be done before indexing is enabled

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☑ P0-1 | `techpi.eu` on Cloudflare, Worker connected, HTTPS certificate | Owner | — | Done (verified 2026-10-13): 50 pages live, identical to `main`, certificate valid to 2027-01-11 |
| ☑ P0-2 | `www.techpi.eu` → apex 301; `techpi.gr` → `/el/` 301 | Owner | — | Done (verified): 301s for HTTP and HTTPS, paths preserved |
| ☐ P0-3 | **Force HTTPS on the `techpi.eu` apex** (Cloudflare → `techpi.eu` → SSL/TLS → Edge Certificates → **Always Use HTTPS**: On) | Owner | — | `curl -I http://techpi.eu/work` returns **301** to `https://techpi.eu/work` |
| ☐ P0-4 | Legal entity details (name, form, address, GEMI/VAT if applicable) | Owner | — | Values supplied privately for `LEGAL_CONTENT_DRAFTS.md` L1–L3 |
| ☐ P0-5 | Privacy and Cookies policy text approved, EN and EL | Owner, Legal | P0-4, analytics decision (P1-1) | Every `[OWNER INPUT]` / `[LEGAL REVIEW]` marker resolved |
| ☐ P0-6 | Publish `/privacy`, `/cookies`, `/el/privacy`, `/el/cookies` and footer links | Dev | P0-5 | Build: sitemap 52 URLs, hreflang pairs, validators updated and passing; footer links on all pages in both languages |
| ☐ P0-7 | Fix Greek lists on `/el/work` (fix F2 in `TECHPI_LAUNCH_STATUS.md`) | Dev | Owner approval | `/el/work`: no English highlights/disciplines; all other 49 page bodies unchanged |
| ☐ P0-8 | Greek editorial review of all **26 Greek pages**: the 24 existing content pages (6 page types + 18 case studies) plus the new Greek Privacy and Cookies pages | Reviewer | P0-6, P0-7 | Reviewer sign-off; corrections merged |
| ☐ P0-9 | Rights and approvals checklist below completed | Owner | — | Every row marked confirmed or the asset removed/replaced by decision |
| ☐ P0-10 | Search Console: `techpi.eu` Domain property verified; legacy property access confirmed; historical data exported | Owner | — | `SEARCH_CONSOLE_SETUP.md` §1–3 done; exports stored privately |
| ☐ P0-11 | Final pre-launch QA on the release candidate | Dev | P0-6 … P0-8 | check/build/SEO/security/asset validators pass; live = build; browser sweep clean |

## P1 — strongly recommended before launch

| # | Item | Owner | Depends on | Verification |
|---|---|---|---|---|
| ☐ P1-1 | Analytics decision (recommended: Search Console only at launch) | Owner | `ANALYTICS_RECOMMENDATION.md` | Decision recorded in `OWNER_DECISIONS_REQUIRED.md` |
| ☐ P1-2 | Optional defence in depth: branch-scoped indexing guard (fix F1), so the code itself keeps preview builds `noindex` whatever the trigger variables are | Dev | Owner approval | Isolated test: indexable only for a `main` build with the variable set; preview build stays `noindex` |
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
| ☐ P2-3 | HSTS on `techpi.eu`: `max-age=31536000` without `includeSubDomains`/`preload` | Owner | P0-3 verified for a week | Header present on HTTPS responses |

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
