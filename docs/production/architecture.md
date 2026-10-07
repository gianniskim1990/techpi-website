# TechPi production architecture

Status: **locked** after the Phase 3 review. Planning only. Nothing is initialised, installed or built.
Date: 2026-10-02 (revised after approval)

## 0. Locked decisions

| Topic | Decision |
|---|---|
| Framework | Astro, static output |
| Language | TypeScript |
| Styling | Plain CSS with custom properties. Semantic class names. No Tailwind, and no hand-made utility framework |
| Typeface | Self-hosted Commissioner |
| Motion library | None at setup. GSAP considered at the motion stage, only for the Contact sequence, only if it genuinely benefits |
| Content | Local typed content. Markdown case studies with typed front matter. Typed EN and EL dictionaries. No CMS for v1 |
| Source control | GitHub |
| Hosting | **Cloudflare Workers with Static Assets.** Not Cloudflare Pages |
| Deployment | Cloudflare Workers Builds with the GitHub integration. `main` is production. Every other branch gets a preview deployment |
| Rendering | Static only. No server-side rendering unless a future feature gives a concrete reason |
| URLs | No trailing slash on normal pages. See `routes.md` |
| Locale | English unprefixed, Greek under `/el/`, no automatic locale redirect |
Sources of truth: the Phase 1 documents in `docs/`, the Foundation Board, and the locked Gate B prototype in `explorations/phase-2/homepage-prototype/`.

Related: `routes.md`, `content-model.md`, `motion-implementation.md`, `seo-i18n.md`, `implementation-plan.md`.

## 1. What the site actually is

Before choosing tools, the facts that decide the stack:

- About ten page types, two languages, a handful of case studies. Content changes rarely.
- Every page can be built ahead of time. Nothing is personalised and nothing needs a database.
- The approved homepage runs on about 250 lines of CSS and about 30 lines of script. Sticky positioning does most of the motion.
- The only server-side need is one contact form endpoint.
- The largest element on first paint is text, not an image.

This is a static, content-led site with a small amount of carefully placed motion. The stack should match that.

## 2. The stack and the reasoning behind it

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Astro**, static output | Ships no JavaScript by default, so the page is HTML and CSS unless a script is deliberately added. Built-in locale routing with an unprefixed default language. Typed content collections for case studies. Image optimisation at build time. |
| Language | **TypeScript**, strict | Typed content schemas and typed translation dictionaries catch missing Greek strings at build time. |
| Styling | **Plain CSS with custom properties**, scoped per component, plus one small global sheet for tokens and type | The design has few tokens and many one-off compositions. The prototype already proves the CSS is small. |
| Motion | **CSS first. A small first-party script for scroll state.** GSAP only if one specific sequence proves to need it | See `motion-implementation.md`. Five of the six approved interactions need no library. |
| Fonts | **Self-hosted Commissioner**, variable, subset per script | See section 6. |
| Content | **Local typed content** in the repository: Markdown with typed front matter for case studies, typed dictionaries for interface copy | See `content-model.md`. No CMS in the first version. |
| Hosting | **Cloudflare Workers with Static Assets** | Cloudflare positions Workers as the primary platform for new projects. Static assets are served from the edge without running Worker code, and Git-based builds and preview deployments are kept. See section 11. |
| Source control | **GitHub**, as now | Preview deployment per branch. |

Versions are deliberately not pinned in this document. Use the current stable release of each tool at setup and record the versions in the repository then.

### 2.1 Evaluation of the "likely direction"

| Proposed | Verdict | Reasoning |
|---|---|---|
| Next.js | **Not recommended for this site. Acceptable alternative.** | It would work, but it ships the React runtime and hydrates pages that have almost nothing to hydrate. That cost is paid on every visit to buy capabilities this site does not use (server components, data fetching, client state). It also adds framework surface to maintain. |
| TypeScript | **Keep** | |
| Tailwind CSS | **Not used (confirmed)** | Tailwind is strongest when many people build many similar screens from a shared scale. This site is the opposite: few screens, each composed by hand, with arcs, masks and language-specific type rules that are awkward as utilities. It would add a dependency and a build step, and push the markup toward the generic look the design avoids. |
| GSAP and ScrollTrigger | **Not installed at setup (confirmed). Decided at the motion stage.** | Only the Contact sequence might need it. It must be justified by the final motion requirement, not added pre-emptively. |
| Native scrolling | **Keep, as a hard rule** | No smooth-scroll library of any kind. |
| Self-hosted Commissioner | **Keep** | |
| GitHub | **Keep** | |
| Vercel or Cloudflare | **Cloudflare Workers with Static Assets** | Vercel's free plan is for non-commercial use, so a company site needs a paid plan. Within Cloudflare, Workers is chosen over Pages because it is the platform Cloudflare now directs new projects to. |

### 2.2 When Next.js would be the right call

Astro is the locked choice. This section is kept as a record of what would reopen it:

- TechPi wants the website and its client products on one framework for team reasons, and accepts the extra weight.
- The site is going to gain authenticated areas, a client portal or application-like features within its first year.
- The team that will maintain it works in React daily and has no appetite for a second tool.

If Next.js is chosen: use static generation for every page, keep interactive code in a few small client components, and hold to the same performance budget. Everything else in these documents (routes, content model, motion rules, SEO) applies unchanged.

### 2.3 What to avoid

- A UI component library or design-system kit. The design is the system.
- A CSS-in-JS runtime.
- A smooth-scroll library. It conflicts with the native-scroll rule and with accessibility.
- A headless CMS in the first version.
- A carousel, lightbox or animation-on-scroll package. Each need is small enough to write.
- Client-side routing or page transitions. They add script and complicate focus handling, for an effect the design does not ask for.
- An icon library. The design uses almost no icons.
- Third-party fonts, tag managers or embeds loaded before consent.

### 2.4 Dependencies expected

Kept deliberately short:

| Dependency | Purpose |
|---|---|
| Astro | Framework |
| TypeScript | Types |
| Astro's sitemap integration | `sitemap.xml` with language alternates |
| An image processing library, as required by Astro | Responsive images at build time |
| Wrangler, Cloudflare's command-line tool (development only) | The deployment configuration file and local checks of the deployed behaviour |

Development only: a formatter, a linter, an HTML and link checker, an accessibility checker and a performance budget check in CI.

Possible later, each needing a decision: GSAP (motion phase), MDX (only if case studies need components inside prose), a git-based CMS (only if non-developers need to publish).

## 3. Repository layout

The production application lives at the repository root, beside the existing documentation and explorations.

```
/
├── docs/                      Phase 1 to 3 documentation (kept)
├── explorations/              Design studies (kept, never deployed)
├── brand-source/
│   └── provisional/           Current raster brand explorations. Reference only, never deployed (see 7.3)
├── public/                    Files copied as-is: favicons, fonts, and public/brand/ for production-ready assets only
├── src/
│   ├── pages/                 Routes. English at the root, Greek under el/
│   ├── layouts/               One base layout
│   ├── components/
│   │   ├── global/
│   │   ├── home/
│   │   ├── project/
│   │   └── brand/
│   ├── content/               Case studies and capabilities, per language
│   ├── i18n/                  Typed dictionaries and route map
│   ├── styles/                Tokens, type, base
│   ├── scripts/               The few first-party scripts
│   └── seo/                   Metadata and JSON-LD builders
├── worker/                    The contact form endpoint, the only Worker code
└── wrangler configuration     Static asset directory, not-found handling, preview settings
```

Nothing in this tree exists yet.

## 4. Component architecture

About twenty components. The test for making one: it is used in more than one place, or it isolates something that will be replaced (the brand mark), or it is a page section that would otherwise make a page file unreadable. A visual detail is not a component.

### 4.1 Global

| Component | Responsibility |
|---|---|
| `BaseLayout` | Document shell: `lang`, metadata, fonts, skip link, header, footer, structured data slot |
| `Header` | Name, four links, language switch, Contact action. Surface-aware colours. Mobile menu as a proper disclosure |
| `Footer` | Minimal: name, navigation, language. Contact details live on the Contact page. A legal line and Privacy and Cookies links are added when the facts and the pages exist (`launch-blockers.md`) |
| `LanguageSwitch` | Links to the same page in the other language, from the route map |
| `Button` | The pill. Primary and outline. Renders a link or a button |
| `TextLink` | The underlined text action, with the arrow rule built in as an explicit option |
| `FactList` | Label and value rows with hairlines. Used on the homepage work panels and on case-study pages |

**Typography primitives are CSS, not components.** A small set of classes and custom properties (`display-xl`, `display-l`, `display-m`, `lead`, `label`) in the global sheet. A `<Heading>` component would add indirection, hide the real heading level, and make language-specific rules harder. Headings are written as real `h1` to `h3` elements with a class.

### 4.2 Brand

| Component | Responsibility |
|---|---|
| `Wordmark` | The name. Typographic now. Swaps to the vector wordmark later without touching the header |
| `Symbol` | The mark, in one colour. Raster-mask rendering now. Inline SVG later. Same props either way |

These two are the only place the identity is referenced. See section 7.

### 4.3 Homepage

One component per approved section, each owning its own layout and styles:

`Hero`, `BrandStatement`, `SelectedWork`, `Capabilities`, `Intelligence`, `Evolution`, `Contact`.

- `SelectedWork` contains a private `WorkPanel` used three times. It is not exported for use elsewhere.
- The curved edge into Selected work belongs to `SelectedWork`. It is not a generic "divider" component.
- The hero arc belongs to `Hero`. The resolving symbol belongs to `Contact`.
- The shared geometry (the circle's proportions) is a few custom properties in the token sheet, so the three uses stay related without a shared component.

### 4.4 Projects

| Component | Responsibility |
|---|---|
| `ProjectHero` | Category, name, one-sentence summary, cover image |
| `ProjectOverview` | Purpose and the long-form narrative from the Markdown body |
| `ProjectMedia` | One image or a short sequence, with captions and the reveal behaviour |
| `ProjectScope` | Scope and technology, using `FactList` |
| `ProjectCapabilities` | Which of the four capabilities applied, linking to the capabilities page |
| `NextProject` | The next case study, as a full-width link |

EU project details (programme, role, funding statement) render inside `ProjectScope` when the data is present. They do not need a separate component.

### 4.5 Deliberately not components

Section wrappers, grid helpers, spacers, an "arc" component, an "eyebrow" component, a generic card, a generic section heading. Each would make the site easier to assemble and more generic to look at.

## 5. Styling approach

- **Semantic class names.** Classes name what a thing is (`hero`, `work-panel`, `fact-list`), not how it looks. No utility classes, and no home-made utility framework that recreates Tailwind by hand.
- **Small stylesheets.** One global sheet for tokens, type and base rules. Scoped styles inside each component for its own layout.
- **Tokens** as custom properties in one file: colours, the three surfaces, type scale, spacing scale, the display weight, the circle's proportions.
- **Surfaces** as three classes (`paper`, `ink`, `blue`) that reassign the same set of variables, exactly as in the prototype. Components read variables and never hard-code a colour.
- **Scoped styles** inside each component for layout.
- **Language rules** in the global type sheet, keyed on `:lang(el)`: smaller display sizes and looser leading for Greek. These are already worked out in the prototype.
- **Breakpoints:** composed at 390 and 1440, then refined across 320, 360, 768, 1024 and 1920 in the responsive pass. Fluid type and spacing between them.
- Sticky behaviour needs `overflow: clip`, not `overflow: hidden`, on ancestors. This was found in the prototype and is recorded so it is not rediscovered.

## 6. Typography: self-hosted Commissioner

No font files are downloaded in this phase.

| Decision | Plan |
|---|---|
| Weights in use | Body 400. Display 450. Navigation, labels, buttons 500. The header name 600 |
| Variable or static | **Variable.** 450 is not a named static weight, and four static files would be larger than one variable file |
| Axes | Keep the weight axis only, limited to 400 to 600. The flare, volume and slant axes are not used and are removed when the font is prepared. No italic is shipped |
| Subsets | Two files: **Latin** (basic Latin, Latin-1, the punctuation and symbols in use) and **Greek** (monotonic modern Greek: both cases, accented vowels, dialytika forms, final sigma, Greek punctuation) |
| Loading by language | `unicode-range` on each face, so English pages never download the Greek file |
| Arrows | The → and ↗ glyphs must be in the Latin subset. The prototype showed them falling back to a system font under Google Fonts delivery. To be verified against the real font file |
| Preload | The Latin file on every page. The Greek file on `/el/` pages only. Nothing else is preloaded |
| `font-display` | `swap`, paired with a metrics-matched fallback so the swap does not move the layout |
| Fallback stack | `"Commissioner", "Commissioner Fallback", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`, where "Commissioner Fallback" is a local system font adjusted with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` |
| CLS | The hero statement is the largest paint. The matched fallback keeps its line count and height stable. To be measured, with a target of no visible shift |
| Size target | About 35 KB for Latin and about 30 KB for Greek, compressed. These are estimates to be measured |
| Licence | SIL Open Font License 1.1. Self-hosting and subsetting are permitted. Check `OFL.txt` for a reserved font name before distributing a modified file |
| Open typographic issue | The tight space before an accented Greek capital after a full stop (". Όχι"). To be checked with the real file and corrected in CSS or copy if it persists |

This remains a prototype-stage typeface decision until the files are prepared and the Greek is reviewed in the real build.

## 7. Brand asset handoff

### 7.1 Temporary state (now)

| Item | Current form |
|---|---|
| Symbol | Four provisional raster PNGs with edge fringing |
| Header | Typographic TECHPI |
| Contact | Flat rendering of the symbol from the raster's alpha, as a CSS mask, at 14% |
| Favicon | None |

### 7.2 Required before launch

| Asset | Notes |
|---|---|
| Symbol, SVG | The master. Simplified inner forms for small sizes if needed |
| Symbol in Ink, white and TechPi Blue | Or one SVG using `currentColor` |
| Wordmark, dark and white | The current wordmark fails on light surfaces and on blue |
| Horizontal lockup | Symbol and wordmark together |
| Favicon set | `favicon.svg`, a 32 px `.ico`, a 180 px Apple touch icon, 192 and 512 px icons, a maskable icon, and a web manifest |
| Default Open Graph image | 1200 × 630, per language |
| Logo for structured data | A square or wide raster export of the final mark |

### 7.3 How the architecture absorbs the change

- The identity is referenced in exactly two components: `Wordmark` and `Symbol`. Their props do not change when the files do.
- `Symbol` renders through a mask today. With the SVG it renders inline, which is also what the Contact animation needs.
- The Contact sequence is built in two steps: the resting state first, the full arc → circle → TechPi drawing only once vector paths exist. No layout depends on the difference.
- Favicons and the Open Graph image are files with fixed names. They can be replaced at any time.

**Transition for the source files (approved, not yet carried out).** The existing PNG brand explorations are source and reference files, not public production assets. Anything inside `public/` is published, so they must not stay there when the site is deployed.

| When | State |
|---|---|
| Now | The four provisional rasters are in `public/brand/`. Nothing is deployed, so nothing is exposed. No files are moved during this documentation pass |
| Phase 3A, before the first preview deployment | They move to `brand-source/provisional/`, which is never deployed. The build reads the one file it needs for the Contact mask from there and emits an optimised version |
| Phase 3H, before launch | `public/brand/` contains only intentionally published, production-ready, optimised assets from the vector master |

**Launch is blocked without the vector master.** Development is not.

## 8. Performance budget

Targets are for the homepage on a mid-range phone on a 4G connection, measured at the 75th percentile in the field once there is traffic, and in the lab before that.

| Measure | Target |
|---|---|
| Largest Contentful Paint | 2.0 s or less |
| Cumulative Layout Shift | 0.05 or less |
| Interaction to Next Paint | 150 ms or less |
| First-party JavaScript, compressed | 15 KB or less without GSAP. 60 KB or less in total if GSAP is adopted, loaded late and on desktop only |
| Third-party JavaScript before consent | 0 |
| CSS, compressed | 20 KB or less |
| Fonts | 70 KB or less on English pages, 100 KB or less on Greek pages |
| Total transfer, homepage | 900 KB or less with real project images |

**Images**

- Modern formats with a fallback, generated at build time, with `srcset` and `sizes`.
- Explicit width and height on every image, so nothing shifts.
- Lazy-loaded below the first screen. The hero has no image, so the largest paint is text and is never delayed by an image.
- Case-study covers at 150 KB or less at desktop width.

**Video**

- None on the homepage in the first version.
- If added later: muted, never autoplaying on mobile or with reduced motion, with a poster, loaded only when near the viewport, 2 MB or less, and never the largest paint.

**Animation overhead**

- Only transform, opacity and clip-path are animated.
- No frame longer than 50 ms during scroll.
- One animating full-viewport layer at a time.
- Sections off screen do no work.

**Delivery**

- Pages, styles, fonts and images are static assets served directly from Cloudflare's edge. Ordinary page requests do not execute Worker code.
- No server-side rendering. It is introduced only if a future feature gives a concrete reason.
- The contact form endpoint is the only request that runs code.

**Rule:** if a motion makes any target fail, the motion is simplified. The targets are not relaxed.

A performance check runs in CI against these numbers, so a regression fails the build.

## 9. Accessibility

Baseline: WCAG 2.2 level AA. This also matches what public and institutional clients in the EU expect.

| Area | Plan |
|---|---|
| Keyboard | Every link and control reachable in reading order. No traps. The mobile menu is a real disclosure with focus management and Escape to close |
| Focus | A visible 2 px focus ring on every interactive element, coloured per surface. The sticky header must never cover the focused element |
| Headings | One `h1` per page. Sections `h2`. Project and capability names `h3`. No skipped levels |
| Landmarks | `header`, `nav`, `main`, `footer`, and a skip link as the first focusable element |
| Contrast | All text pairs at AA or better, as verified on the Foundation Board. Recalculated when final brand colours exist. Cyan only on dark surfaces |
| Reduced motion | A complete static version: no hold, no reveals, no arc movement. Reviewed as a layout in its own right |
| Screen readers | Decorative geometry hidden. The symbol has a text alternative where it carries meaning and is hidden where it does not. Text split for animation stays one readable string. Tested with NVDA and VoiceOver, in both languages |
| Language | `lang` on the document per page. `lang` on any inline text in the other language, including the language switch |
| Zoom and reflow | Usable at 200% zoom and at 320 px wide, with no horizontal scrolling and no clipped display text |
| Touch targets | 44 × 44 px for primary controls. Never below the 24 px minimum |
| Sticky sections | Normal document order is kept, so keyboard and reading order match. Sticky behaviour switches off on short or narrow screens |
| Forms | Visible labels, clear errors linked to their fields, no CAPTCHA puzzle |
| Motion safety | Nothing flashes. Nothing moves without user input for more than five seconds |

Checks: an automated accessibility check in CI on every page, and a manual keyboard and screen reader pass before launch. Automated checks find only part of the problems, so the manual pass is not optional.

## 10. Other platform decisions

| Topic | Plan | Status |
|---|---|---|
| Contact form | A plain HTML form posting to one small Worker route, which sends an email through a transactional provider. Works without JavaScript. A honeypot field and rate limiting first, a privacy-friendly challenge only if spam requires it. The route is explicitly sent to the Worker, because a plain form post would otherwise be treated as a page request | Provider and recipient address to confirm. Built in 3C |
| Analytics | Cookieless, EU-hosted analytics, so no consent banner is needed for analytics alone | Product to choose |
| Consent | No banner if nothing requires consent. A banner only if a cookie or tracker is added | Depends on analytics and embeds |
| Security headers | Content Security Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, set at the host | Planned for 3A |
| Preview deployments | Every preview sends `noindex` and is excluded by robots rules, so no unfinished page is indexed | Planned for 3A |
| Legal pages | Privacy and cookies pages in both languages | Content to supply |

## 11. Deployment model

Nothing is configured in Cloudflare during this phase. This section records the model to be set up in Phase 3A.

**Platform:** one Cloudflare Worker with Static Assets. The Astro build output folder is the asset directory.

**Workflow:** Cloudflare Workers Builds, connected to the GitHub repository.

| Branch | Result |
|---|---|
| `main` | The production deployment. Only after approval |
| Any other branch | A preview build, with its own Worker Preview URL |

**Review path for every stage:** local preview, then the Git branch, then the Worker Preview URL.

**Behaviour relied on,** checked against Cloudflare's documentation on 2026-10-02 and **verified in Phase 3A** against the local Workers runtime (see `routes.md` for the full result and two small differences). To be re-checked on the first preview deployment:

| Need | How the platform provides it |
|---|---|
| Static files served without running code | A request that matches a file in the asset directory is served directly, without invoking Worker code |
| The locked URL style | The default HTML handling serves single files (`work.html`) without a trailing slash and folder indexes (`el/index.html`) with one |
| Real 404 pages per language | A not-found setting serves the nearest `404.html` up the folder tree, with a 404 status |
| Headers and redirects | `_headers` and `_redirects` files in the asset directory are supported. Security headers use the first. The later pigiota314 mapping can use the second |
| Preview deployments | Preview builds run for branches other than the production branch and produce a Preview URL |
| One code path | A Worker script handles only the paths routed to it. Here that is the contact form endpoint |

**Rules**

- Preview URLs are never indexable.
- The production domain is attached only in Phase 3H, and going live is a separate approval.
- No secrets in the repository. The form's email credentials are stored as Worker secrets.
- No server-side rendering adapter is installed. The site is a static build plus one small route.

## 12. Risks

1. **The vector identity is not available.** Mitigated by the two-component boundary in section 7. It still blocks launch.
2. **Real content is missing.** Project facts, imagery and Greek copy. Development can proceed with marked placeholders, but a build guard prevents placeholders from reaching production. See `content-model.md`.
3. **Push access.** Git currently authenticates as an account without write access to the repository. Preview deployments need pushes. This must be fixed before Phase 3A.
4. **Scroll-linked CSS is not supported everywhere.** It is never a critical dependency. See `motion-implementation.md`.
5. **Platform details change.** Cloudflare's configuration options and Astro's output settings are confirmed again at setup, and CI asserts the URL behaviour so a change cannot pass unnoticed.

## 13. Phase 3A as built (2026-10-02)

### 13.1 Versions installed

| Package | Version | Note |
|---|---|---|
| Astro | 7.3.5 | Current stable at setup |
| TypeScript | 6.0.3, pinned `~6.0.3` | The registry's newest is 7.0.2, but `@astrojs/check` 0.9.10 supports TypeScript 5 and 6 only. Move to 7 when the checker does |
| `@astrojs/check` | 0.9.10 | Development dependency |
| Wrangler | 4.147.0 | Development dependency. Verifies Cloudflare's asset handling locally, and reads `wrangler.jsonc` |
| Node | 24 (`.node-version`, `engines: ^24.0.0`) | Tested on 24.15.0. Cloudflare Workers Builds defaults to Node 24.x. Node 22 is rejected |

Not installed, by design: Tailwind, React, GSAP, a sitemap integration (3F), an image library beyond Astro's own, a CMS.

### 13.2 Configuration

- `output: 'static'`, `build.format: 'preserve'`, `trailingSlash: 'ignore'`, `site: 'https://techpi.eu'`.
- i18n: default locale `en` without a prefix, `el` as the prefixed locale, no fallback and no `redirectToDefaultLocale`, so Astro creates no automatic locale redirect.
- `tsconfig.json` extends Astro's strict preset and includes only `src/` and the Astro config, so `explorations/`, `docs/` and `brand-source/` can never enter the production type check.
- `wrangler.jsonc`: no Worker script, `assets.directory: "./dist"`, `not_found_handling: "404-page"`, `html_handling: "auto-trailing-slash"`, compatibility date 2026-10-02. Preview settings are not configured. They are set when the repository is connected to Cloudflare.
- Scripts: `dev`, `build`, `preview`, `check`.

### 13.3 Differences from the approved architecture

| # | Difference | Consequence |
|---|---|---|
| 1 | Non-canonical URL forms redirect with an explicit **301** from `public/_redirects` (copied to `dist/`) | Overrides the automatic 307, verified under Wrangler. See `routes.md` |
| 2 | `/404` and `/el/404` return 200 with `noindex` | Harmless. Exclude from the sitemap and disallow at launch |
| 3 | `trailingSlash` is `ignore`, not `never` | `never` breaks `/el/` in the dev server. The host enforces the policy |
| 4 | `Astro.url.pathname` contains `.html` under `preserve` | Canonical, hreflang and the sitemap must come from `src/i18n/routes.ts`. Enforced in `BaseLayout` |
| 5 | TypeScript 6, not 7 | Tooling compatibility. Revisit later |
| 6 | Node policy is 24 (see 13.1) | Replaces the earlier Node 22 setup, which warned about transitive dependencies |
| 7 | `astro preview` is lenient and not authoritative | Use Wrangler's local runtime to check URL behaviour |
| 8 | A functional header and language switch were built in 3A | Needed to navigate and test routes. They are plain. The designed header is 3B |
| 9 | Only the `src/` folders 3A needs exist: `components`, `layouts`, `pages`, `i18n`, `styles` | `content`, `data` and `utils` arrive with the stages that use them |
| 10 | Temporary Google Fonts loader | See 13.4 |

### 13.4 Temporary font loading

`src/components/TemporaryFonts.astro` loads Commissioner from Google Fonts so the 400, 450 and 500 hierarchy is visible on previews. It is one component, used in one place. It must be deleted when the self-hosted files are supplied. It sends visitors' IP addresses to a third party, so it must not ship.

A guard enforces this: a build with `PUBLIC_ALLOW_INDEXING=true` fails while the component is still in use. Verified.

### 13.5 Indexing default

Every page is `noindex, nofollow` unless a build sets `PUBLIC_ALLOW_INDEXING=true`. Nothing is indexable until launch, and a 404 is never indexable. Worker Preview URLs also get a response-header rule in a later stage.
