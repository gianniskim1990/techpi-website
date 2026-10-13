# TechPi launch status

Status date: **2026-10-13**. Branch `launch-readiness-phase-1` from `origin/main` `701cb09`.
**The site is live on `https://techpi.eu` and remains `noindex`. It is not launched in search.**

Confidence legend: **[V] Verified** in this audit (live request, DNS query, build or browser test) · **[O] Owner-confirmed**
(not independently verifiable from outside) · **[D] Needs dashboard access** (Cloudflare, Pointer, cPanel, Search Console:
not inspected) · **[A] Assumption**.

Inputs: `docs/production/*`, the six reports in the untracked `migration-audit/` folder (2026-10-12/13, still accurate
for the legacy sites; their `techpi.eu` "no DNS" finding is **superseded** by this document), and read-only live tests.

---

## 1. Summary

| Area | State | Confidence |
|---|---|---|
| Production site on `techpi.eu` | Live, HTTPS, serving exactly the `main` build | [V] |
| Indexing safeguards | All 50 pages `noindex, nofollow`; workers.dev and previews also `X-Robots-Tag: noindex` | [V] |
| Domains `techpi.eu`, `techpi.gr` | On Cloudflare, Active; `www.techpi.eu` → apex 301; `techpi.gr` → `/el/` 301 | [V] (DNS, HTTP) / [O] (zone status) |
| Email `info@techpi.eu` | MX, SPF, DKIM, DMARC published; mailbox works | [V] (DNS) / [O] (delivery tests) |
| Technical SEO in code | Canonical, hreflang, sitemap (48), structured data, robots | [V] |
| Security | CSP and headers live on the custom domain, including 404 responses | [V] |
| Content, legal, editorial | **Not ready**: legal pages, Greek editorial review, rights confirmations open | [V] / [O] |
| Launch in search | **Not authorised**; blockers in section 6 | — |

---

## 2. Completed infrastructure (owner work, verified from outside where possible)

### techpi.eu
- [V] Nameservers `galilea.ns.cloudflare.com`, `marvin.ns.cloudflare.com`; apex and `www` resolve to Cloudflare proxy
  addresses (IPv4 and IPv6). [O] Zone Active; registrar Pointer.gr.
- [V] Certificate: Google Trust Services (WE1), covers `techpi.eu` and `*.techpi.eu`, valid 2026-10-13 → 2027-01-11
  (Cloudflare Universal SSL renews automatically [A]). TLS 1.2 and 1.3 accepted, TLS 1.1 refused.
- [V] `https://techpi.eu` serves the production `techpi-website` Worker: **all 50 pages are byte-identical to a local build
  of `origin/main` `701cb09`**. No mismatch between live site and repository.
- [V] `www.techpi.eu` (HTTP and HTTPS) → **301** → `https://techpi.eu` + same path (query string dropped).
- [V] **Finding:** `http://techpi.eu/…` (plain HTTP, apex) returns **200 over HTTP** instead of redirecting to HTTPS.
  "Always Use HTTPS" (or an equivalent rule) is not active for the apex. See blocker B2.
- [V] DNSSEC: **not enabled** (no DS at the registry, no DNSKEY in the zone; method validated against cloudflare.com).
- [V] No CAA record (allowed; optional hardening).

### techpi.gr
- [V] Nameservers on Cloudflare; apex and `www` proxied. Certificate: Let's Encrypt, `techpi.gr` and `*.techpi.gr`.
- [V] `techpi.gr`, `www.techpi.gr`, HTTP and HTTPS → **301** → `https://techpi.eu/el/` + **path and query preserved**
  (`/work` → `/el/work`, `/about?x=1` → `/el/about?x=1`).
- [V] Edge case: a path that already starts with `/el/` becomes `/el/el/…` (404), e.g. `techpi.gr/el/work/rocketeer`.
  Low impact (nobody links to `techpi.gr/el/…` today); optional rule refinement.
- [V] No MX, SPF or DMARC on `techpi.gr`: the domain cannot receive mail, and receivers have no policy telling them that
  mail claiming to be from `@techpi.gr` is never legitimate. Recommendation R3.

### Email (`info@techpi.eu`)
- [V] MX `mail.techpi.eu` (priority 0, `185.25.23.40`) and `mail2.techpi.eu` (priority 40, `185.162.237.90`); both A records
  resolve (DNS-only, not proxied, as required). Reverse DNS: `linux62.name-servers.gr` and `mail2.linux62.name-servers.gr`
  (the hosting provider's server names; normal for shared hosting).
- [V] SPF `v=spf1 mx ip4:185.25.23.40 ~all` (the `mx` mechanism also authorises `185.162.237.90`).
- [V] DKIM key published at `default._domainkey.techpi.eu` (cPanel default selector).
- [V] DMARC `v=DMARC1; p=none;` (monitoring only, **no reporting address**).
- [O] Incoming (Gmail → Roundcube) and outgoing (Roundcube → Yahoo) tested; Outlook configured; cPanel Email Routing:
  Local Mail Exchanger.
- **Not yet verified:** that outgoing mail actually passes **SPF, DKIM and DMARC with alignment** (records existing ≠
  mail passing). Owner test in `TECHPI_LAUNCH_CHECKLIST.md` P1-3.

### Application
- [V] `proposal.techpi.eu` does not exist in DNS (correct: Decision A approves the name only). `proposal.pigiota314.gr`
  and all other legacy subdomains were not touched by this work.

---

## 3. Website verification (live and build)

| Check | Result | Confidence |
|---|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints | [V] |
| `npm run build` | **50 pages**: 48 content URLs (6 page types + 18 case studies, EN and EL) + 2 not-found pages | [V] |
| SEO validator | 2,998 checks, 0 failures; every page `noindex` | [V] |
| Security validator | 816 checks, 0 failures | [V] |
| Asset validator | 38 checks, 0 failures | [V] |
| Live pages | 50/50 expected status (48 × 200, 2 × 404), 50/50 `noindex, nofollow`, 50/50 identical to the build | [V] |
| Internal links and assets referenced by live pages | 98 distinct targets, all 200 | [V] |
| `sitemap.xml` | Live = build, 48 `<loc>` | [V] |
| `robots.txt` | Live content = build (line endings differ only because of the Windows checkout); no Cloudflare-managed rules injected | [V] |
| Canonical and hreflang | Validated on all 48 (self-canonical, `en`/`el`/`x-default` reciprocal) | [V] |
| Structured data | Organization, WebSite, WebPage types, Service, BreadcrumbList; valid JSON-LD (validator) | [V] |
| Security headers on `techpi.eu` | CSP (`frame-ancestors 'none'` …), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP on HTML, assets, sitemap, robots, redirects **and on 404 responses** (the custom domain applies `_headers` to 404s, unlike the preview hosts seen in Phase 5) | [V] |
| HSTS | Not sent (intentional until HTTPS-only is confirmed; blocker B2) | [V] |
| `/_astro/*` caching | `public, max-age=31536000, immutable`; HTML `max-age=0, must-revalidate` | [V] |
| Internal 301s (`_redirects`) | e.g. `/index.html` → `/` 301 on the custom domain | [V] (sample) |
| Cookies, storage, third parties | No `Set-Cookie` on any response; no storage; 0 third-party requests; no Cloudflare beacon or email obfuscation injected | [V] |
| Browser sweep, 50 pages × 1440/768/390 | 0 CSP violations, 0 console errors (other than the expected 404 status lines), 0 failed requests, no horizontal overflow, fonts and motion working, mobile menu working | [V] |
| CSP negative tests on production | Injected inline script, unhashed style, foreign script and image, `<base>` hijack and framing all blocked | [V] |
| Accessibility smoke (50 pages, 1440 and 390, reduced motion) | One `h1` per page, no skipped heading levels, 0 contrast failures on solid backgrounds; 3 Greek screenshot alt texts are longer than 160 characters (acceptable; optional editorial trim) | [V] |
| Image noted as "not loaded" at 390 px on the homepage | Inside a `figure.detail` hidden by the mobile layout (`display: none`): correctly never fetched. Not a defect | [V] |
| Performance (production) | Desktop LCP 0.24–1.38 s; throttled phone (4× CPU, slow 4G) LCP 0.82–1.90 s; CLS ≤ 0.033; scroll p50 16.7 ms. Homepage intro footage ≈ 120 KB and one long load task on the slowed phone (documented intro cost) | [V] |

### Indexing safeguards

| Requirement | Result | Confidence |
|---|---|---|
| `techpi.eu` remains noindex | 50/50 pages carry `noindex, nofollow`; no `X-Robots-Tag` on `techpi.eu` (correct: only the meta switch applies there) | [V] |
| workers.dev remains noindex | `techpi-website.<account>.workers.dev`: `X-Robots-Tag: noindex` on 200 and 404 responses, plus the meta tag | [V] |
| Preview deployments remain noindex | Branch previews: `X-Robots-Tag: noindex` on 200 and 404; meta tag on pages. Preview 404s are Cloudflare's plain "Not found" (9 bytes), not the site's 404 page: still 404 + noindex | [V] |
| 404 pages non-indexable | `noindex, nofollow` in every build mode (validator, live) | [V] |
| `PUBLIC_ALLOW_INDEXING` unset | No page is indexable, so it is unset or not `true` for production | [V] effect / [D] dashboard |
| The production switch cannot affect previews | **Partly.** Workers Builds has one set of *build variables* for the Worker, used by production **and** preview builds (Cloudflare docs, "Build variables and secrets"). Setting `PUBLIC_ALLOW_INDEXING=true` there would also remove the meta `noindex` from preview builds. Previews would **still** be non-indexable through `X-Robots-Tag: noindex` (sent by Cloudflare on preview URLs and by `public/_headers` for every `*.workers.dev` host). Proposed hardening F1 below | [V] (docs + headers) |

---

## 4. Content and SEO review

| Topic | Finding | Confidence |
|---|---|---|
| Counts | 48 content URLs, 18 case studies × 2 languages, sitemap 48: **correct** on `main`. Stale "18 content pages"/"18 URLs"/"20 pages" statements remain only in dated phase records (`launch-blockers.md` Phase 4 note, `security.md`, `accessibility-performance.md`, `identity-font-readiness.md` result tables); present-tense counts updated on this branch | [V] |
| pigiota314 references | All are historical attribution: footer "TechPi — the evolution of pigiota314", About, homepage evolution section, "Earlier work by pigiota314" labels and notes on 6 earlier-work case studies. No link to any pigiota314 host | [V] |
| SOWISE+ | Absent from all output | [V] |
| Brand naming | Consistent (TechPi; "TECHPI" as the typographic header name by design). No variants found | [V] |
| Placeholders, overreaching claims | None found (scan for placeholder text and superlative/guarantee/award/percentage wording, EN and EL) | [V] |
| External links | Only 8 client websites (case studies) | [V] |
| **Untranslated Greek lists** | On `/el/work`, **10 rows show English lists**: the "Τι περιλαμβάνει" highlights of Saloon, Physio, Project4You, Rantevo.gr and the disciplines of the 6 earlier-work projects (e.g. "Online booking", "Graphic design"). Greek translations exist in `src/content/projects.el.ts`, but `toGreek()` in `src/content/projects.ts` (≈ line 771) only applies `highlights`/`disciplines` to projects **without** a case study, and every project now has one. Live on production. Fix F2 | [V] |
| Meta titles/descriptions | All unique; 9 case-study titles are 66–71 characters (may be truncated in results); `/work/saloon` description 179 characters | [V] |
| Legal links | No Privacy or Cookie link anywhere (pages do not exist yet) | [V] |
| Image accessibility | Case-study screenshots have descriptive alt text in both languages; decorative thumbnails use empty `alt` | [V] |

### Proposed source fixes (not implemented: outside this documentation-only scope)

- **F1. Branch-scoped indexing switch** (defence in depth). Make indexing require both `PUBLIC_ALLOW_INDEXING=true` and the
  production branch, e.g. in `astro.config.mjs` read `process.env.WORKERS_CI_BRANCH` (injected by Workers Builds) and
  only allow indexing when it is `main`; keep local isolated test builds possible with an explicit override. Update
  `docs/production/seo.md` §8 and the SEO validator.
- **F2. Greek highlights and disciplines.** In `toGreek()`, add `highlights` and `disciplines` (with `required(…)`) to the
  case-study branch as in the non-case-study branch. Expected effect: only `/el/work` changes (10 lists become Greek);
  verify with a body diff of all 50 pages against `main`.
- **F3 (optional).** Shorten the 9 case-study titles over 65 characters during the Greek/English editorial review.

---

## 5. What changed on this branch

Documentation only (`docs/launch/*`, `docs/production/launch-blockers.md`, `routes.md`, `security.md`). No source,
configuration, dependency or output change: the build is byte-identical before and after (verified).

---

## 6. Remaining blockers, ranked

| Rank | Blocker | Why it blocks | Owner / dependency |
|---|---|---|---|
| **B1** | Legal entity details; Privacy and Cookies pages (EN/EL) | Required before public launch; also destinations of legacy privacy redirects | Owner inputs L1–L10 (`LEGAL_CONTENT_DRAFTS.md`), legal review, then an implementation PR |
| **B2** | HTTP → HTTPS on the `techpi.eu` apex; then HSTS | Plain-HTTP access serves pages unencrypted; indexing could pick up `http://` URLs | Owner: Cloudflare "Always Use HTTPS" on the `techpi.eu` zone (or a redirect rule); HSTS later |
| **B3** | Greek translation bug on `/el/work` (F2) | Visible English text on a Greek page | Approve fix F2 |
| **B4** | Native-speaker Greek editorial review (24 Greek pages) | Launch blocker 8 | Owner / reviewer |
| **B5** | Rights confirmations: client screenshots, Logotherapia imagery, third-party logos in screenshots | Launch blockers 10 and the rights checklist | Owner |
| **B6** | Analytics decision | Determines the cookie policy and monitoring | Owner (`ANALYTICS_RECOMMENDATION.md`) |
| **B7** | Email authentication verified (SPF, DKIM, DMARC pass with alignment) | Deliverability of replies to enquiries | Owner test (checklist P1-3) |
| **B8** | Search Console Domain property for `techpi.eu`; legacy property access; data exports | Needed to launch and to migrate signals | Owner (`SEARCH_CONSOLE_SETUP.md`) |
| B9 | Branch-scoped indexing guard (F1) | Defence in depth; previews already protected by headers | Approve F1 |
| B10 | DNSSEC on `techpi.eu` (and `techpi.gr`) | Hardening, not a hard blocker | Owner (Cloudflare one-click + DS at Pointer) |
| B11 | Training-crawler policy (launch blocker 12) | Owner decision; current allow-all is valid | Owner |
| — | Legacy redirects, Change of Address, `proposal.techpi.eu` | After launch, separate phases | `migration-audit/*`, Decision A |
