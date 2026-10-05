# TechPi route architecture

Status: **locked** after the Phase 3 review. Planning only. No routes, redirects or DNS changes are created.
Date: 2026-10-02 (revised after approval)

## 1. Routes

English is the default language and has no prefix. Greek lives under `/el/`. Slugs are Latin and identical in both languages.

| Page | English | Greek |
|---|---|---|
| Home | `/` | `/el/` |
| Work index | `/work` | `/el/work` |
| Case study | `/work/[slug]` | `/el/work/[slug]` |
| Capabilities | `/capabilities` | `/el/capabilities` |
| EU Projects | `/eu-projects` | `/el/eu-projects` |
| About | `/about` | `/el/about` |
| Contact | `/contact` | `/el/contact` |
| Privacy | `/privacy` | `/el/privacy` |
| Cookies | `/cookies` | `/el/cookies` |
| Not found | `404` | Greek `404` under `/el/` |

Case studies at launch (revised in Phase 3C.2). The portfolio comes from the public pigiota314 portfolio, audited in `docs/content/portfolio-migration.md`. The earlier cAIrelink and SOWISE+ routes were never built, launched or indexed, so they are removed from the plan with no redirects.

| Project | English | Greek |
|---|---|---|
| Rocketeer | `/work/rocketeer` | `/el/work/rocketeer` (Phase 3D) |
| Arman's Ethnic Street Food | `/work/armans` | `/el/work/armans` (Phase 3D) |
| Logotherapia Xanthi | `/work/logotherapia-xanthi` | `/el/work/logotherapia-xanthi` (Phase 3D) |

Index-only projects have a row on `/work` and no page of their own: Level Up Education App, Saloon, Physio and Project4You. A project gets a route only when it has a published case study. The Greek case-study pages are built in Phase 3D, and until then each English case study declares itself as its only language alternate.

Notes:

- Capabilities is one page with four sections and anchors (`#digital-products`, `#web-experiences`, `#intelligence`, `#digital-visibility`). Separate pages per capability can be added later under `/capabilities/[slug]` without changing existing URLs.
- EU Projects is a page in its own right, for institutional visitors. It lists the case studies that carry EU project data and adds partner information. It does not duplicate case-study content.
- Privacy and Cookies are included because a company site in the EU needs them.

### 1.1 URL style (locked)

**Normal pages have no trailing slash.** The two language roots are `/` and `/el/`, which are directory roots and keep their slash.

| Rule | Detail |
|---|---|
| One canonical form | `/work`, never `/work/`. `/el/`, never `/el` |
| The other form | Redirects to the canonical form and never serves a second copy of the page. Explicit rules in `public/_redirects` answer with a **301 (permanent)**. Cloudflare's automatic handling alone would answer 307 (see below). The canonical tag and internal links also use only the canonical form |
| Everywhere the same | Canonical tags, hreflang, the sitemap, internal links, Open Graph URLs and structured data all use the canonical form, produced from one route map |
| Case and characters | Lower case, Latin letters, digits and hyphens only |
| No file extensions | `/work`, not `/work.html` |

**Verified in Phase 3A (2026-10-02).** Astro 7.3.5 with `build.format: "preserve"` writes `work.html`, `el/work.html`, `index.html` and `el/index.html` exactly as intended. Served by Cloudflare's local Workers runtime (Wrangler 4.147.0) with `html_handling: "auto-trailing-slash"`, 23 of 23 assertions passed:

| Request | Result |
|---|---|
| `/`, `/work`, `/capabilities`, `/eu-projects`, `/about`, `/contact` | 200 |
| `/el/`, `/el/work`, `/el/capabilities`, `/el/eu-projects`, `/el/about`, `/el/contact` | 200 |
| `/work/`, `/el/work/` | 301 to `/work`, `/el/work` |
| `/work.html`, `/index.html`, `/el/work.html`, `/el/index.html` | 301 to the canonical form |
| `/el` | 301 to `/el/` |
| `/nope`, `/work/nope` | 404 with the English not-found page |
| `/el/nope`, `/el/work/nope` | 404 with the Greek not-found page |

Two details differ from the earlier plan:

1. **Phase 3A.1 update:** without rules, the platform's automatic handling returns 307. `public/_redirects` now lists all 23 non-canonical forms (trailing slash, `.html`, `/index.html`, `/el`) with explicit 301 rules, tested under Wrangler 4.147.0: canonical URLs 200, every listed form 301 straight to the canonical URL in one hop with no loops, query strings preserved, unknown paths 404 with the English or Greek page. The same file is used for the pigiota314 migration.
2. The not-found page file is itself a normal asset, so `/404` and `/el/404` return **200** with the not-found content. They carry `noindex`, nothing links to them, and they are best excluded from the sitemap and disallowed at launch. This is not harmful, but it is a soft-404 pattern and is recorded so it is not a surprise.

Local results come from Wrangler's local runtime. They are re-checked on the first Cloudflare preview deployment, and an automated check of this table is added to CI in a later stage.

Astro's own dev server and `astro preview` are not authoritative for these rules. `astro preview` serves `/work/` and `/work.html` as 200. Only the Cloudflare runtime decides the production behaviour.

### 1.2 Host

- Canonical host: `https://techpi.eu`. `www.techpi.eu` redirects permanently to it.
- HTTPS only.
- `techpi.gr` may later redirect to `https://techpi.eu/el/`, keeping the path. Not configured now.

## 2. Canonical strategy

- Every page declares itself as canonical, with an absolute `https://techpi.eu/...` URL in the canonical form above.
- A Greek page is canonical to itself. It is never canonicalised to the English page. They are translations, not duplicates.
- URLs with query strings or anchors canonicalise to the clean URL.
- Preview deployments are not indexable.

## 3. hreflang strategy

Every page lists all of its language versions, including itself, plus a default:

```
en         → the English URL
el         → the Greek URL
x-default  → the English URL
```

- Language codes only (`en`, `el`). No country codes. `gr` is never used as a language code.
- The annotations are reciprocal. Each page in a pair names the other.
- They appear in the page head and are repeated in the sitemap.
- If a page exists in only one language, it carries no hreflang entry for the missing language.

## 4. Language and the language switch

- `lang="en"` on English documents and `lang="el"` on Greek documents.
- The switch is a pair of plain links, not a script.
- It always leads to **the same page in the other language**. It never sends the visitor to the homepage.
- Targets come from one route map (see `seo-i18n.md`), so they cannot drift from the real routes.
- The current language is marked for assistive technology. Each option carries its own `lang` attribute.
- **No automatic redirection** by browser language or location. Language switching is always user-controlled. The URL is the state, and nothing is stored.

Policy for missing translations:

| Case | Behaviour |
|---|---|
| Standard pages (home, work index, capabilities, EU projects, about, contact, legal) | Must exist in both languages. The build fails if one is missing |
| A case study not yet translated | The page is not published in that language. The switch on the existing version leads to the work index in the other language |

## 5. 404 behaviour

- Unknown URLs return a real **404 status**, not a redirect to the homepage and not a 200.
- An English not-found page for English paths and a Greek one for paths under `/el/`. The platform serves the nearest not-found page up the folder tree, so this needs only the two files.
- The page offers the main navigation, a link to the work index and the language switch.
- It is marked `noindex` and has no canonical or hreflang.
- A removed case study gets a deliberate redirect to the work index, added by hand, not a 404.

## 6. Future redirect compatibility with pigiota314.gr and pigiota314.eu

**No redirect mappings are created in this phase, and the existing sites are not touched.** This section only records how the new structure stays compatible with a later migration.

1. **Redirects are a separate layer.** They will live in one redirects file at the host, not inside page code. Adding them later changes no page.
2. **URL by URL, not blanket.** Each old URL will map to its closest new equivalent. Old pages with no equivalent map to the nearest section, not all to the homepage.
3. **Language is preserved.** Old Greek pages will map to `/el/...`. Old English pages to the unprefixed routes.
4. **Permanent redirects (301)**, one hop only, landing directly on the canonical form so the slash rule never adds a second hop.
5. **The new URL scheme is stable from launch.** Slugs locked now should not change later.
6. **No collisions.** New slugs are checked against the old sites' paths during the inventory.
7. **The old domains stay registered and serving redirects** for at least a year, and ideally for as long as the links exist.

The migration stage (3I) will prepare the inventory, the mapping table for your review, and the cutover plan. Executing it is a separate decision.

## 7. Routes and a future CMS

Routes are derived from the route map and from each case study's slug, which is plain data. They do not depend on where the content is stored. If a CMS is adopted later, it supplies the same fields, including the same slugs, and no URL changes.

## 8. Sitemap and robots

- One `sitemap.xml` listing every published URL in both languages, in canonical form, each with its language alternates.
- Not-found pages, previews and drafts are excluded.
- `robots.txt` policy is described in `seo-i18n.md`. The final rules are written at launch.
- Preview deployments are closed to indexing.

## 9. Locked decisions

| Topic | Decision |
|---|---|
| Trailing slash | None on normal pages. `/` and `/el/` keep theirs |
| Case-study slugs | `rocketeer`, `armans`, `logotherapia-xanthi` |
| Capabilities | One page with anchors at launch |
| Locale redirect | None. User-controlled only |
| `techpi.gr` | May redirect to `/el/` later. Not part of this phase |
| Astro `trailingSlash` | `ignore`. `never` was tried and rejected: in the dev server it makes the canonical Greek root `/el/` return 404. For prerendered pages the host enforces the policy, as Astro's own documentation states |
| Source of canonical URLs | `src/i18n/routes.ts` only. With `build.format: "preserve"`, `Astro.url.pathname` contains `.html` for normal pages, so it must never be used for canonical, hreflang or sitemap URLs |
