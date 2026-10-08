# TechPi SEO, social metadata and structured data

Status: implemented in Phase 4 (2026-10-08), on `phase-4-seo-schema`. **The site is still `noindex` on every page.**
This document records what is built and the rules it follows. The planning document `seo-i18n.md` still holds the
architecture and the locked crawler policy (its section 6.3); where the two differ on a detail, this one is current.

## 1. What every page carries

18 content pages (9 routes in English and Greek) and two 404 pages.

| Item | Content pages | 404 pages |
|---|---|---|
| `<title>`, `meta description` | From `src/content/seo.ts` | Title only (`src/i18n`) |
| `canonical` | Absolute, self-referencing, `https://techpi.eu` | None |
| `hreflang` | `en`, `el`, `x-default` (English), reciprocal | None |
| `robots` | `noindex, nofollow` unless the build sets `PUBLIC_ALLOW_INDEXING=true` | `noindex, nofollow` in every build |
| Open Graph, Twitter card | Yes | None |
| JSON-LD | Yes | None |
| In the sitemap | Yes | No |

All of it is generated at build time into static HTML by `src/layouts/BaseLayout.astro`. There is no client-side
SEO script and no schema library. The page `<body>` is untouched: Phase 4 changed only `<head>` and machine-readable
files (verified: every page body byte-identical to `main`, and pixel-identical captures, section 10).

## 2. Titles and descriptions

One source: `src/content/seo.ts` (`pageMeta` for the six page types, `caseStudyMeta()` for the case studies). The
same text feeds `<title>`, the meta description, `og:`/`twitter:` title and description, and the WebPage node.

Rules:

- **Titles** name the page first and end with `| TechPi`; the homepage leads with the name ("TechPi — Digital
  Products & Technology"). Unique, 34 to 69 characters.
- **Descriptions** say only what the page itself shows: no metric, result, client claim, endorsement or invented
  fact, no keyword lists. Unique, about 75 to 175 characters.
- **Case studies** use their own published facts: `Name — Category | TechPi`, and the summary shown as the page lead.
- **Greek** is written for Greek searches (for example "ιστοσελίδες … για ευρωπαϊκά χρηματοδοτούμενα έργα"), not
  translated word for word. Due for the native-speaker read (launch blocker 8).
- **EU Projects** targets what people search for (EU project websites, digital platforms and web applications for
  EU-funded projects) in plain sentences. It does not imply European Commission endorsement, accreditation,
  experience under a named programme, or grant consultancy.
- **Digital visibility** is described as one of four capabilities, never as TechPi's identity: TechPi is not
  positioned as a marketing agency.
- **About** leads with what TechPi does; the former name appears once ("Formerly pigiota314.").

The visible copy was not rewritten. The descriptions are new text for search snippets only, consistent with the
visible copy. The English homepage, which had no description, now has one (launch blocker 7).

## 3. Canonical URLs and hreflang

- From the route map (`src/i18n/routes.ts`), never from `Astro.url`. Origin `https://techpi.eu` (`site` in
  `astro.config.mjs`).
- The language roots keep their slash (`https://techpi.eu/`, `https://techpi.eu/el/`); every other URL has none.
  No query string, fragment, preview or development host ever appears.
- Each content page lists itself and its counterpart (`en`, `el`) plus `x-default`, which points to the English page.
  Reciprocal by construction, and checked by the validator.
- No automatic language redirect. Routing and the 35 redirects in `public/_redirects` are unchanged (all 301).

## 4. Open Graph and the Twitter card

`og:type` `website`, `og:site_name` `TechPi`, `og:title`, `og:description`, `og:url` (the canonical),
`og:locale` (`en_US` or `el_GR`) and `og:locale:alternate` (the other), `og:image` with type, width, height and alt.
Twitter: `summary_large_image`, title, description, image and alt. **No `twitter:site` or `twitter:creator`:** no
TechPi account is confirmed, so none is invented.

### Social images

| File | Used by |
|---|---|
| `public/og/techpi-en.png` (1200 x 630, about 58 KB) | Every English page |
| `public/og/techpi-el.png` (1200 x 630, about 59 KB) | Every Greek page |

Ink background, the approved white 3D symbol (the variant approved for Ink), the TECHPI name set as in the header
(Commissioner 600, tracked 0.09em), a short TechPi Blue rule, and the site descriptor in the page's language
("Digital Products & Technology" / "Ψηφιακά προϊόντα & τεχνολογία"). No other artwork, gradient, screenshot or
new mark.

Made by `scripts/brand/derive-social.mjs` from the committed identity files. It uses `sharp` (already installed with
Astro) and a locally installed Chrome or Edge run headless, because `sharp` cannot load the self-hosted WOFF2 font and
silently falls back to a system serif. No package was added. The outputs are committed, so the build never needs a
browser. Re-run it only when the identity changes.

**Case-study images: assessed, not made.** Each case study has real imagery, but a crop of a product screenshot
into a 1.91:1 card either shrinks the interface to illegibility or needs added framing and type, which would be a
new design. Case studies use their language's default image. A designed card per case study is a later design task,
not an SEO blocker.

## 5. Structured data (JSON-LD)

One `<script type="application/ld+json">` per content page with an `@graph`. Built in `src/seo/schema.ts`.

| Node | `@id` | Where | Content |
|---|---|---|---|
| `Organization` | `https://techpi.eu/#organization` | Every content page | `name` TechPi, `alternateName` pigiota314, `url`, `logo` (`/techpi-logo.png`, 512 x 512, the blue 3D symbol), `email`, `telephone`, `address` (locality Xanthi, country GR only) |
| `WebSite` | `https://techpi.eu/#website` | Every content page | `name`, `url`, `inLanguage` `en` and `el`, `publisher` the Organization |
| `WebPage` and subtypes | `<canonical>#webpage` | Every content page | `name`, `description`, `url`, `inLanguage`, `isPartOf` the WebSite, `publisher`. `about` the Organization on the homepage and About. Type: `CollectionPage` (Work), `AboutPage`, `ContactPage`, otherwise `WebPage` |
| `BreadcrumbList` | `<canonical>#breadcrumb` | The six case-study pages | Home, Work, the case study, with the visible labels. This is the real URL hierarchy and the page's own "Work" link. No breadcrumb UI was added |
| `Service` x 4 | `<canonical>#service-<id>` | Capabilities, both languages | Each capability's visible name and summary, `provider` the Organization |
| `Service` x 2 | `<canonical>#service-eu-projects`, `…#service-eu-project-websites` | EU Projects, both languages | The page's visible hero heading and lead, and its "EU project websites" section heading and introduction |

Deliberately absent: `legalName`, VAT, street address, founding date, employee count, `sameAs` (no confirmed social
profile), `SearchAction` (the site has no search), reviews, ratings, awards, `FAQPage`, and any case-study markup
(`Article`, `Product`, `SoftwareApplication`, or an invented "CaseStudy" type). `CreativeWork` for a case study was
considered (the planning document proposed it) and left out: the WebPage and breadcrumb already describe the page,
and a CreativeWork would need a creator and client relationship the site states only loosely.

The contact facts and the town were added to the Organization by the Phase 4 brief. They are the facts already
published on the Contact page (`launch-blockers.md`, section 1).

## 6. Sitemap

`/sitemap.xml`, generated at build time by `src/pages/sitemap.xml.ts` from the same route map and case-study list as
the pages: **exactly 18 URLs**, absolute, canonical form. No 404, redirect source, slash variant or preview URL.
**No `<lastmod>`**: the site has no real modification dates, and an invented one is worse than none. No hreflang in
the sitemap: the pages carry it.

## 7. robots.txt

```
User-agent: *
Allow: /

Sitemap: https://techpi.eu/sitemap.xml
```

Crawling is allowed on purpose: a crawler must fetch a page to read its `noindex`. Blocking crawling now would not
keep pages out of the index reliably, and would hide the `noindex` itself.

**AI crawler policy: undecided, owner decision.** No rule names GPTBot, ClaudeBot, Google-Extended, CCBot,
PerplexityBot or any other agent. The policy in `seo-i18n.md` section 6.3 stands: search and answer-engine
retrieval is wanted; training use is a separate decision, made at launch against each vendor's current
documentation, with narrow per-agent rules and no keyword wildcards. The validator fails if any agent-specific rule
appears, so adding one is a deliberate change.

**`llms.txt`: not published.** No major system is confirmed to use it. Recommendation: reconsider after launch; if
added, it should only restate the About page and link the sitemap.

## 8. The indexing switch

`PUBLIC_ALLOW_INDEXING=true` at build time is the only switch. Without it, every page carries
`noindex, nofollow`. With it, the 18 content pages carry no robots tag and are indexable; the two 404 pages stay
`noindex` in every build. Set it only for the production build, only at launch, never for previews (launch
blocker 14). It is not set anywhere today.

Tested in Phase 4 with an isolated local build into a separate output directory (never deployed): **18 indexable
pages, 2 noindex**, no preview or development URL anywhere. The normal build afterwards: 20 of 20 `noindex`.

## 9. Validation

```bash
npm run build && node scripts/seo/validate.mjs
```

`--indexable` validates a `PUBLIC_ALLOW_INDEXING=true` build; `--dist <dir>` another output directory. No dependency.
About 1,140 checks: per page the title, description, `lang`, one `h1`, robots, canonical, hreflang and reciprocity,
x-default, every Open Graph and Twitter field, that the image exists, valid JSON-LD with the expected nodes,
`@id`s on the production origin, resolved references, forbidden types and properties, no development or preview
origin in the head, unique titles and descriptions; then the 404s, the set of built pages, the sitemap (18 URLs, no
`lastmod`), `robots.txt` (no Disallow, no agent rules, sitemap line) and the image files. It exits 1 on any failure.
The expected route list is written out in the script, independently of the route map, so an accidental route change
is caught.

## 10. Phase 4 results

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| SEO validator, normal build | 1,138 checks, 0 failures, 20 of 20 pages `noindex` |
| SEO validator, `PUBLIC_ALLOW_INDEXING=true` (local only) | 1,138 checks, 0 failures, 18 indexable, both 404s `noindex` |
| Page bodies against `main` | 20 of 20 byte-identical; CSS and JS bundles identical |
| Pixel comparison against `main` (reduced motion, full page) | 16 of 16 identical: Home, Work, EU Projects, Rocketeer, EN and EL, 1440 and 390 |
| Static audit, Wrangler route and redirect matrix | 39 / 39, 97 / 97 |
| JavaScript | No change (5,843 bytes, the motion module only) |
| HTML | About 3 KB more per page, uncompressed (the head tags and JSON-LD) |
| Dependencies | None added |

## 11. At launch (not done in Phase 4)

1. Connect `techpi.eu`, then build production with `PUBLIC_ALLOW_INDEXING=true` (previews never).
2. Decide the training-crawler policy and, if any rule is added, re-verify crawler names first (`seo-i18n.md` 6.3).
3. Google Search Console and Bing Webmaster Tools: verify the domain property, submit `https://techpi.eu/sitemap.xml`,
   inspect the homepage, one case study and `/el/` in both languages, and watch the coverage and hreflang reports.
4. Check a live share preview (LinkedIn Post Inspector, the Facebook sharing debugger) once the domain serves the site.
5. Run the Rich Results Test and the Schema Markup Validator on the homepage, Capabilities and one case study.
6. Redirect pigiota314 to techpi.eu (301, path by path) as its own migration milestone; then the Search Console
   change-of-address tool from the old property.
