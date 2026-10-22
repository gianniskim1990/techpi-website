# pigiota314.gr -> TechPi: 189-path 301/410 migration candidate (DRAFT)

**State:** owner-approved editorial redirect/retirement policy; full 189-known-path execution candidate **prepared, NOT installed**. Owner backed up `/public_html/.htaccess` on 2026-10-22. Separate approval is still required for deployment. No DNS, hosting, mail, subdomain or production modifications in this PR.

## What this changes after separate approval

- Root `pigiota314.gr` and `www.pigiota314.gr` visitors to **known equivalent content URLs** receive one-hop permanent 301 to appropriate canonical English or Greek TechPi pages. Approved retired/demo URLs receive 410 Gone.
- **189 source-specific rewrite rules** (107×301, 82×410), compiled from 181 audited `.gr` routes + eight missing GSC aliases. The 2026-10-19 crawl reported **206 `.gr` URLs**; its full list is unavailable, so coverage beyond the known 189 sources is **not claimed**. Unmapped URLs remain handled by old WordPress; there is no catch-all.
- The host guard on every rule excludes `proposal.pigiota314.gr`, `saloon.pigiota314.gr`, `physio.pigiota314.gr`, every other application subdomain, and mail hosts even on shared document roots.
- WordPress administration, REST endpoints and `/wp-content` assets are not redirected. There is **no wildcard catch-all** because sending unrelated old URLs to the homepage creates potential Google soft 404s.
- Apache/LiteSpeed `.htaccess` snippet only; not Cloudflare's `techpi.eu` `_redirects`. The owner shared `/public_html/.htaccess` (2026-10-22), confirming `# BEGIN SpeedyCacheheaders`, `# BEGIN WEBPspeedycache`, `# BEGIN speedycache`, `# BEGIN WordPress` and cPanel PHP handler blocks. SpeedyCache has a rewrite rule with `[L]` that could serve cached HTML before later redirects are reached, so **the migration block must be placed at the very top, ahead of all SpeedyCache markers**, not merely above WordPress. If legacy host behaviour differs, inspect the actual server before rollout.

## Known pages

| Old page (`https://pigiota314.gr`) | Canonical Greek TechPi target |
|---|---|
| `/` | `https://techpi.eu/el/` |
| `/portfolio/` | `https://techpi.eu/el/work` |
| `/contact/` | `https://techpi.eu/el/contact` |
| `/about-us/` | `https://techpi.eu/el/about` |
| `/booking-systems/` | `https://techpi.eu/el/work/rantevo` |
| `/website-for-airbnb/` | `https://techpi.eu/el/work/alexandra-apartment` |
| `/online-paraggelies-estiasis/` | `https://techpi.eu/el/work/armans` |

## 18 historic project URLs (source: `docs/content/portfolio-migration.md`)

| # | Old page | Canonical Greek TechPi page |
|---:|---|---|
| 1 | `/case-studies/rocketeer-custom-web-application/` | `https://techpi.eu/el/work/rocketeer` |
| 2 | `/case-studies/armans-ethnic-street-food-online-ordering/` | `https://techpi.eu/el/work/armans` |
| 3 | `/case-studies/logotherapia-xanthi-website-redesign/` | `https://techpi.eu/el/work/logotherapia-xanthi` |
| 4 | `/case-studies/level-up-education-app/` | `https://techpi.eu/el/work/level-up-education-app` |
| 5 | `/case-studies/saloon/` | `https://techpi.eu/el/work/saloon` |
| 6 | `/case-studies/physio/` | `https://techpi.eu/el/work/physio` |
| 7 | `/case-studies/project4you/` | `https://techpi.eu/el/work/project4you` |
| 8 | `/case-studies/mavie-website-rebranding/` | `https://techpi.eu/el/work/mavie` |
| 9 | `/case-studies/iliastech/` | `https://techpi.eu/el/work/iliastech` |
| 10 | `/case-studies/alexandra-apartment/` | `https://techpi.eu/el/work/alexandra-apartment` |
| 11 | `/case-studies/blackjack-streetwear/` | `https://techpi.eu/el/work/blackjack-streetwear` |
| 12 | `/case-studies/level-up-education/` | `https://techpi.eu/el/work/level-up-education` |
| 13 | `/case-studies/logotherapia-xanthi/` | `https://techpi.eu/el/work/logotherapia-xanthi` |
| 14 | `/case-studies/itsallaboutxanthi/` | `https://techpi.eu/el/work/itsallaboutxanthi` |
| 15 | `/case-studies/juliette-coffee-roasters/` | `https://techpi.eu/el/work/juliette-coffee-roasters` |
| 16 | `/case-studies/local-xanthi/` | `https://techpi.eu/el/work/local-xanthi` |
| 17 | `/case-studies/apox-fc/` | `https://techpi.eu/el/work/apox-fc` |
| 18 | `/case-studies/emoved/` | `https://techpi.eu/el/work/emoved` |

Every target case-study slug exists in `content/case-studies/<slug>/index.json` and all 18 are published in both languages. Two source Logotherapia project URLs intentionally converge to the same Greek case study.

**Current 189-rule execution candidate (not deployed):** [reviewed 301/410 rules](pigiota314-gr-htaccess-snippet.txt), [final URL-to-status mapping](pigiota314-gr-final-mapping.csv), plus [source audit register](pigiota314-gr-source-review.csv) and [review methodology](pigiota314-gr-source-review.md). The 2026-10-19 crawl identified 206 `.gr` URLs; its per-URL CSV is unavailable, so not every observed URL has been shown to be covered.

## Key findings from earlier GSC and 2026-10-19 audit

- A pre-existing 2026-10-16 Search Console baseline shows 52 exported `.gr` URLs and **22 clicks**, of which 18 were for the legacy homepage. The 2026-10-19 read-only crawl checked **206 `.gr` sources**. Our 189-rule staged set covers every known audited route, but does **not** prove exhaustive coverage of the 206 live-crawled URLs.
- Another 43 legacy URLs are theme/demo/archive pages previously recommended for **410 Gone**. Do not redirect unrelated demo pages to the TechPi homepage. Some obsolete services or 27 retired portfolio items need explicit owner decisions (301 to a relevant index vs 410).
- `/online-paraggelies-estiasis/` had one recorded GSC click and should lead to the more specific Arman's project rather than generic capabilities. `/en_gb/` also had one click; map it to the English homepage.
- **Google Search Console ownership has been verified by the owner (2026-10-22 screenshot):** the `pigiota314.gr` property uses **HTML file** ownership verification, currently successful. Preserve that verification HTML file in `/public_html` and ensure the exact `https://pigiota314.gr/<verification-file>.html` URL continues to answer 200 after the redirects. The planned exact-path 301 rules do not target this file; do not introduce a blanket catch-all, delete it, or block it. DNS TXT is an optional redundant method, not a prerequisite. Avoid sharing the verification filename/token in public code.
- Four WordPress `?p=ID` shortlinks require review; the provisional root redirect intentionally excludes numeric `?p=` to avoid silently sending these post links to an unrelated homepage.
- The `pigiota314.eu` migration is a separate, previously audited workstream. The 2026-10-19 audit suggested sequencing `.eu` before `.gr`, partly because `.eu` case-study images are served from `.gr` WordPress uploads. Keeping old assets operational is necessary.
- **No 301 or 410 rule in this PR has been deployed, nor has the Google Change of Address action been submitted.** Owner policy approval does **not** authorize activating these production rewrites.

## Extra high-priority alias routes present in the partial snippet

| Old route | Target |
|---|---|
| `/privacy-policy/` | `/el/privacy` |
| `/services/`, `/web-design/` | `/el/capabilities` |
| `/portfolio/project4you-cms/`, `/portfolio/project4you/` | `/el/work/project4you` |
| `/portfolio/local-xanthi-social-media-digital-marketing/` | `/el/work/local-xanthi` |
| `/portfolio/blackjack-streetwear/` | `/el/work/blackjack-streetwear` |
| `/en_gb/` | `/` (English) |
| `/en_gb/portfolio/itsallaboutxanthi-website-social-media-graphic-design-digital-marketing/` | `/work/itsallaboutxanthi` (English) |
| `/eu-projects/` | `/el/eu-projects` |

**Sources of planning evidence:** legacy `TechPi_SEO_Migration_Audit_2026-10-16.xlsx` (Google Search Console exports reconciled against historical 217-row plan) and the 2026-10-19 legacy-domain preflight audit. Neither is a production-config source of truth without new verification.

## Reviewed 301/410 matrix (not deployed)

| Status | Count | Approved purpose |
|---|---:|---|
| 301 | 107 | Relevant replacement (existing case study, Greek/English portfolio, service or contact page) |
| 410 | 82 | Old demos, WordPress themes, abandoned archives and retired creative/social-media content with no relevant equivalent |
| Not enumerated | At least 17 potentially additional URLs in 2026-10-19 crawl | Left on old WordPress; review actual later crawl CSV before claiming a sitewide complete migration |

Each 301 goes directly to a canonical URL from TechPi's published 60-page route list. Every directive is anchored and host-scoped to apex/www only. There is no catch-all; old `/wp-content` images, the Search Console HTML verification file, old sitemap and administrative paths are not matched. Queries on migrated URLs are discarded using Apache `[QSD]`, but root `?p=123` WordPress shortlinks are explicitly excluded.

**Scope limitation:** the 2026-10-19 audit counted 206 URLs but its machine-readable mapping is unavailable. The 189 explicit rules handle all currently recovered source routes; the rest remain on the old server pending separate identification. The 189-rule file is ready for owner review, but **not ready to be described as an exhaustive migration of all historic URLs**.

**Canary outcome, 2026-10-22 — NOT FULLY PASSING:** owner tested two new paths on Apache. 301 correctly returned `Location: https://techpi.eu/el/`. The `[G,L]` test path returned WordPress `404` rather than Apache `410`. A suspected inherited cPanel 410 error handler may be taking over; the isolated candidate fix is `ErrorDocument 410 default` placed before canary `mod_rewrite`. **Do not deploy the full 189-rule file until a live request returns 410**, and test root/verification files/assets/subdomains are unaffected. If the override does not work, investigate server error handlers rather than treating 404 as pass.

## Before enabling on origin

1. Confirm `https://pigiota314.gr` and `https://www.pigiota314.gr` currently reach the old WordPress host and identify Apache/LiteSpeed and the correct document root. Confirm if a CDN or existing redirect rule intercepts the request.
2. Back up the entire `.htaccess` and export the old WordPress sitemap/search-console indexed URLs and incoming-link URLs. Reconcile *all high-traffic URLs*, excluded historic service pages and 13 earlier archive URLs with the existing offline `migration-audit/REDIRECT_MAPPING.md` if available. Do not invent mappings to unrelated homepages.
3. On `techpi.eu`, confirm the targets answer HTTP 200 and remain indexable, especially after `PUBLIC_ALLOW_INDEXING=true` production build. Check preview host still sends `X-Robots-Tag: noindex`.
4. Confirm old-domain mail MX/SPF/DKIM/DMARC, external Resend/Mailgun records, and shared-host application subdomains are backed up **without changing them**. Changing `.htaccess` at a shared origin only after confirming host guard.
5. After a fresh owner approval, put `docs/launch/pigiota314-gr-htaccess-snippet.txt` **at the very beginning of `/public_html/.htaccess`, immediately above `# BEGIN SpeedyCacheheaders`**, before `# BEGIN speedycache` and `# BEGIN WordPress`. Do not modify any generated SpeedyCache/WordPress/PHP blocks. Save a complete byte-for-byte backup first.
6. Clear SpeedyCache and any known CDN/edge HTML cache for the old domain before testing; a cached response can mask the fresh redirect. Validate `https://pigiota314.gr/`, `https://www.pigiota314.gr/`, `/portfolio/`, `/contact/`, old Rocketeer/Armans/Logotherapia case studies, both slash forms, and a query-string variant. Each should return **301 directly to a 200** target, without chain. Verify a random unlisted URL does not become an irrelevant homepage redirect.
7. Smoke-test the three application subdomains, `wp-content` assets, outgoing/incoming old email, and `techpi.eu` contact form. In the old `.gr` Search Console confirm Ownership verification still shows the **HTML file** method as successful and that its file URL remains HTTP 200. If anything breaks, revert the added block only.
8. Only after redirects pass, initiate **Search Console Change of Address** from the legacy `.gr` property to `techpi.eu`. Keep permanent redirects at least 1 year, ideally indefinitely.

## Explicit exclusions / follow-up

- No `.eu` legacy migration in this review; that property needs its own mapping (English Insights links are different).
- Not included: unverifiable service slugs, old media URLs, old WordPress date archives, unknown legacy pages, product app hostnames or `proposal.pigiota314.gr`.
- Old `/booking-systems/`, `/website-for-airbnb/` and `/online-paraggelies-estiasis/` map to specific Greek project pages (`rantevo`, `alexandra-apartment`, `armans`) based on the expanded 2026-10-19 audit; owner must approve the semantics before launch.
- If source/export evidence shows an old URL with no relevant replacement, prefer a genuine 404/410 over an irrelevant redirect.

## Dry-run mapping verification

All old routes are regex-anchored, use canonical slashless TechPi paths (except `/el/`), and are host-scoped. Review live status responses before installation; no live migration has been executed.
