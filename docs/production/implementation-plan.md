# TechPi implementation plan

Status: **locked** after the Phase 3 review. Nothing in this plan has been started.
Date: 2026-10-02 (revised after approval)
Related: `architecture.md`, `routes.md`, `content-model.md`, `motion-implementation.md`, `seo-i18n.md`.

## 1. Locked stage order

| Stage | Name |
|---|---|
| 3A | Project foundation and preview deployment |
| 3B | Homepage static implementation |
| 3C | Secondary-page design and implementation |
| 3D | Greek localisation |
| 3E | Motion |
| 3F | SEO and structured data |
| 3G | QA, accessibility and performance |
| 3H | Final brand assets and launch preparation |
| 3I | pigiota314 migration preparation |

Three principles behind the order:

- **Preview deployment is in the first stage,** so every later stage is reviewable at a real URL on real devices.
- **Responsive design is part of every applicable stage.** There is no separate desktop-first stage followed by stacking. Mobile and desktop are built and reviewed together.
- **Greek comes before motion,** because line masks, the hero hold and panel heights depend on the real text in both languages.

Each stage ends with a review and an approval. No stage starts before the previous one is approved.

## 2. Preview workflow (applies to every stage)

Every meaningful stage is reviewable through three things, in this order:

1. **Local preview.** The site built and served on the development machine.
2. **Git branch.** One branch per stage, pushed to GitHub.
3. **Cloudflare Worker Preview URL.** Built automatically from the branch by Workers Builds.

Production deployment happens from `main` only, and only after approval. See the deployment model in `architecture.md`.

## 3. Stages

### 3A. Project foundation and preview deployment

**Build**

- Astro initialised with static output and TypeScript. Versions recorded.
- Repository layout from `architecture.md`.
- The provisional raster brand files moved from `public/brand/` to `brand-source/provisional/`, so they are not published.
- Design tokens, the three surfaces, the type scale and the language rules, taken from the locked prototype, as plain CSS with custom properties and semantic class names.
- Self-hosted Commissioner prepared: variable, weight axis only, Latin and Greek subsets, matched fallback.
- Base layout, header, footer, language switch, button, text link.
- Locale routing with empty pages for every route in both languages, and the route map. The output file layout that gives the locked URL style is confirmed here.
- CI: type check, build, link check, HTML validation, accessibility check, performance budget, and a check that no page is reachable both with and without a trailing slash.
- Cloudflare Workers with Static Assets connected to the GitHub repository through Workers Builds. `main` as the production branch. Preview builds for all other branches, closed to indexing. Security headers.

**Exit criteria**

- Every route resolves in both languages with the correct `lang`, in the canonical URL form only.
- The header and footer match the prototype at 390 and 1440.
- Fonts load with no visible layout shift, and the Greek subset loads only on Greek pages.
- A Worker Preview URL exists for the branch and is not indexable.
- Nothing is deployed to the production domain.

**Needs from TechPi:** working push access to the repository, and access to the Cloudflare account.

### 3B. Homepage static implementation

**Build**

- The seven homepage sections as components, at mobile and desktop together.
- Sticky behaviour that is pure CSS (project panels, capabilities heading), since it is layout and not animation.
- Real copy from the approved prototype. Marked placeholders for unconfirmed facts.
- No scripted motion yet.

**Exit criteria**

- The page matches the locked prototype at 390 and 1440, side by side.
- No horizontal overflow from 320 to 1920.
- Complete and readable with scripting disabled.
- Performance budget met.

### 3C. Secondary-page design and implementation

**Design step first (confirmed).** A short, controlled design pass, as a prototype for approval, covering:

- Work index
- Case-study template
- Capabilities
- EU Projects
- About
- Contact

It extends the approved homepage system: the same type, surfaces, spacing and restraint. It does not introduce a new visual direction, and the arc is not added to these pages unless a specific page earns it. Implementation of the secondary pages starts only after that design is approved.

**Then build**

- The typed content collections for case studies and capabilities, with the placeholder guard.
- Work index and the case-study template, with the six project components.
- Capabilities, EU Projects, About, Contact, Privacy, Cookies, and the not-found pages.
- The contact form and its endpoint, the only path that runs Worker code.

**Exit criteria**

- The secondary-page design is approved before any of it is built.
- A new case study can be added by creating one file per language, with no code change.
- The build fails when a published entry contains a placeholder.
- The contact form works without JavaScript and delivers to the agreed address.

**Needs from TechPi:** design approval, project facts and imagery, the contact form recipient.

### 3D. Greek localisation

**Build**

- The Greek dictionary, Greek content files and Greek metadata, from copy supplied or approved by TechPi.
- Greek line breaks for display statements.
- A pass over every page in Greek at mobile and desktop widths.

**Exit criteria**

- Every standard page exists in both languages.
- The language switch leads to the same page on every route.
- No Greek display text is clipped or collides, at any width tested.
- The client has reviewed the Greek copy and letterforms.

**Needs from TechPi:** the Greek copy, or review of drafts.

### 3E. Motion

**Build**

- First attempt: the approved interactions with CSS, sticky positioning and minimal JavaScript.
- Hero supporting-line reveal and hold. Image reveals. Arc enhancement.
- The Contact sequence, step 1 or step 2 depending on whether the vector master exists.
- GSAP and ScrollTrigger are considered here, and only if the Contact arc → circle → TechPi sequence genuinely benefits. The justification is written down before anything is installed.

**Exit criteria**

- The acceptance checks in `motion-implementation.md`.
- Reduced-motion, no-script and unsupported-browser versions reviewed as layouts.
- Performance budget still met with motion on.

### 3F. SEO and structured data

**Build**

- The metadata builder, canonicals, hreflang, sitemap.
- JSON-LD templates, validated.
- Open Graph images per language and per case study.
- The crawler policy prepared as a draft. Final `robots.txt` rules are written at launch, in 3H, after re-verifying crawler names and policies.

**Exit criteria**

- No duplicate titles or descriptions. Reciprocal hreflang on every pair.
- Structured data validates and matches visible content.
- The CI crawl is clean.

**Needs from TechPi:** company facts for the organisation data.

### 3G. QA, accessibility and performance

**Build nothing new.** Test and fix.

- One cross-width pass: 320, 360, 390, 768, 1024, 1440, 1920.
- Browsers: current Chrome, Edge, Firefox and Safari, on desktop and on real iOS and Android devices.
- Accessibility: automated checks, then a manual keyboard pass and a screen reader pass in both languages, at 200% zoom.
- Performance: lab measurement on a throttled mid-range profile.
- Content: every placeholder resolved or its page held back.

**Exit criteria**

- No open accessibility failure at level AA.
- All performance targets met.
- No known layout defect at the tested widths.

### 3H. Final brand assets and launch preparation

**Build**

- Replace the provisional mark with the vector master in `Wordmark` and `Symbol`.
- `public/brand/` populated with only the intentionally published, production-ready, optimised assets.
- Favicon set, manifest, final Open Graph images, logo in structured data.
- Final colour check against the vector master, and contrast recalculated.
- Final `robots.txt`, with crawler names and policies re-verified.
- Analytics, legal pages, and consent handling if anything requires it.
- Production domain prepared on the host, without going live.

**Exit criteria**

- No provisional asset remains in the published site.
- A complete production build passes every check.
- `robots.txt` does not block any search or discovery crawler that is meant to be allowed.
- A launch checklist is agreed.

**Needs from TechPi:** the vector identity master, legal texts, and the training-crawler decision. **This stage cannot finish without the master.**

### 3I. pigiota314 migration preparation

**Prepare, do not execute.**

- Inventory of indexed URLs on the pigiota314 sites.
- A proposed redirect mapping, for your review.
- A DNS and cutover plan, with a rollback.
- A post-launch monitoring plan.

**Exit criteria**

- The mapping and the cutover plan are approved.

Going live, changing DNS and switching on redirects are a separate decision with their own approval. They are not part of Phase 3.

## 4. Dependencies on TechPi

| Input | Needed by | Blocks |
|---|---|---|
| Push access to the repository | Before 3A | Branches and preview deployments |
| Cloudflare account access | 3A | Preview deployments |
| Approval of the secondary-page design | During 3C | Building those pages |
| Project facts, imagery and permissions | 3C to 3G | Publishing each case study |
| Contact form recipient and email provider | 3C | The form |
| Greek copy | 3D | Greek launch |
| Company facts | 3F | Organisation data, footer, contact page |
| Vector identity master | 3H | Launch |
| Legal texts | 3H | Launch |
| Training-crawler policy | 3H | Final `robots.txt` |

## 5. Working rules for all stages

- One branch and one Worker Preview URL per stage. Merged to `main` only after approval.
- The prototype in `explorations/` is the visual reference. Its code is not reused.
- No dependency is added without a stated reason and your agreement. This applies to GSAP in particular.
- No Tailwind and no hand-made utility framework. Semantic class names and custom properties.
- No server-side rendering unless a future feature gives a concrete reason.
- No invented content. Placeholders are marked and guarded.
- Mobile and desktop are built and reviewed together.
- Every stage ends with a short written report: what was built, what was checked, what remains.
- Nothing is deployed to production, and no DNS or redirect is changed, without explicit approval.

## 6. Status of decisions

All architecture decisions are locked:

| Decision | Outcome |
|---|---|
| Stack | Astro, static output, TypeScript, plain CSS with custom properties, self-hosted Commissioner |
| Hosting | Cloudflare Workers with Static Assets, deployed by Workers Builds from GitHub |
| Tailwind | Not used |
| GSAP | Not installed at setup. Decided at 3E for the Contact sequence only |
| Content | Local typed content. Markdown case studies, typed dictionaries. No CMS for v1 |
| URLs | No trailing slash on normal pages. Slugs `rocketeer`, `armans`, `logotherapia-xanthi` |
| Locale | English unprefixed, Greek under `/el/`, no automatic redirect |
| Brand files | Provisional rasters move to `brand-source/provisional/` in 3A |
| Secondary pages | A design step precedes implementation in 3C |
| Crawlers | Search and discovery allowed. Training treated separately. Final rules at launch |
| Stage order | As in section 1 |

One practical prerequisite remains, which is operational and not architectural: Git on this machine currently authenticates as an account without write access to the repository. It must be resolved before 3A, because the preview workflow depends on pushing branches.
