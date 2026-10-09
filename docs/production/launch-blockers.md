# Launch blockers and confirmed facts

Status: current as of 2026-10-08 (Phase 5, security and technical hardening). This is the single place that records what is confirmed for public display, what is deliberately deferred, and what still blocks launch. Other documents point here instead of repeating it.

The site stays `noindex` until every blocker below that applies is resolved and indexing is switched on deliberately.

## 1. Confirmed for public display

| Fact | English | Greek | Shown on |
|---|---|---|---|
| Email | info@techpi.eu | info@techpi.eu | `/contact`, `/el/contact` |
| Phone | +30 697 594 6984 | +30 697 594 6984 | `/contact`, `/el/contact` |
| Location | Xanthi, Greece | Ξάνθη, Ελλάδα | `/contact`, `/el/contact` |

- Email is a `mailto:info@techpi.eu` link. Phone is a `tel:+306975946984` link. The visible phone number keeps its spaces.
- The location is the **town only**. No street address is confirmed, so none is shown, and none must be inferred.
- The values live in `src/content/site.ts` (email, phone) and `src/content/pages.en.ts` / `pages.el.ts` (labels and location). They appear on the Contact pages only. They are deliberately **not** in the footer, the homepage, page titles or descriptions. Since Phase 4 they are also in the Organization structured data (email, phone, and the town as locality and country only), as the Phase 4 brief specified (`seo.md`, section 5).
- The Contact lead is kept: "Tell us about the problem you need to solve." / "Πείτε μας ποιο πρόβλημα θέλετε να λύσετε."

Not confirmed, therefore not shown anywhere: WhatsApp, social profiles, office hours, street address, map, booking link, legal entity name, company registration, VAT. Add one only when it is explicitly approved.

## 2. Must never be displayed

**SOWISE+ must not be displayed on the TechPi website**, in any language: not as a case study, in navigation, on the EU Projects page, in metadata, in structured data, in an image, or as a link. It is not TechPi content. Older planning documents list it as a planned case study. That plan is withdrawn.

Internal information does not go into public page copy. This repository is currently public, so the documents in `docs/` are readable by anyone. See section 5.

## 3. Deferred by decision

| Item | Decision | Notes |
|---|---|---|
| Contact form | Not wanted yet | No form, no fields, no backend, no third-party form service, no CAPTCHA. When approved, the planned fields are: name, organisation, email, what you need to solve, optional timeframe. No budget field. It needs a recipient, a mail provider and a spam strategy first |
| Analytics and trackers | Not approved | None is implemented: no analytics, tag manager, advertising pixel or session recording. No cookie banner exists, and none is added for hypothetical trackers. Privacy and cookie requirements are assessed once the final tracking stack is known |
| Privacy Policy, Cookies Policy, Terms | Not created | They need the legal entity details and the tracking decision. The footer links to no page that does not exist |
| EU project case studies | Not approved | The service page is approved; specific projects are not. See section 4 |
| Organisation structured data | Later milestone | Needs the legal and business identity fields. The site has no Organization schema, and nothing unconfirmed is to be added to any schema |

## 4. EU Projects

Updated 2026-10-08: EU-funded projects are approved as a **target market and service offering**.

- `/eu-projects` and `/el/eu-projects` are full service pages (`EuProjectsPage.astro`, copy in `src/content/eu.ts`),
  expanded 2026-10-08 from the services publicly described on pigiota314.eu (approved as a source): lifecycle, EU
  project websites, digital platforms, an offer for communication and dissemination partners, programmes, technical
  priorities, process, proposal-stage and long-term support. The homepage keeps a short teaser between Capabilities
  and Intelligence.
- **It is not a portfolio.** No specific EU project, programme participation, partner, result, certification or
  compliance is claimed. Horizon Europe, Interreg, Erasmus+, EDIHs and European R&I projects are named as the kinds of
  projects the approach is built for; LIFE and Digital Europe only as examples TechPi can technically support. The
  page carries: "TechPi is an independent technology company and is not affiliated with or endorsed by these
  programmes or the European Commission."
- **Deliberately softened or left out, for the launch copy review:**
  - Accessibility reads "designed with WCAG 2.2 AA requirements in mind", not a guaranteed baseline. Decide whether
    TechPi commits to WCAG 2.2 AA as a baseline before changing it.
  - The source's "six to ten weeks" delivery time is not used; no budgets, dates or proposal outcomes are promised.
    Proposal-stage estimates are labelled indicative.
  - The partner offer (white-label delivery, direct subcontracting, etc.) implies no procurement or legal arrangement.
- **SOWISE+ is not mentioned** anywhere (section 2).
- **Navigation restored:** EU Projects / Ευρωπαϊκά έργα is back in the header, the mobile menu and the footer
  (`navPages` in `src/i18n/routes.ts`), between Capabilities and About.
- **Indexing:** the pages follow the site-wide `noindex` like every other page. The extra page-level `noindex` of the
  former route shell is removed, so they become indexable together with the rest of the site at launch. They are in
  the sitemap since Phase 4 (`seo.md`).
- Showing specific EU projects as case studies still needs approved factual content: the programme, TechPi's role,
  the funding acknowledgement and the project's own details.

## 5. Launch blockers

Each of these must be resolved, or consciously accepted, before indexing is enabled.

| # | Blocker | Needs | Affects |
|---|---|---|---|
| 1 | Legal entity details | Legal name, registered address, registration and VAT numbers | Footer legal line, Privacy and Cookies pages, Organization schema |
| 2 | Privacy and Cookies pages | Item 1, and the tracking decision. Since 2026-10-09 the homepage intro stores one functional value in `localStorage` (`techpi-intro-seen`, no identifier, never sent; `security.md` section 11): decide whether the pages mention it | Footer links, consent handling |
| 3 | Tracking and analytics decision | Choice of product, or a decision to use none | Privacy, cookies, whether a consent banner is needed |
| 4 | ~~Self-hosted Commissioner~~ | **Resolved in Phase 3G.2** (below) | |
| 5 | ~~Final identity and favicon~~ | **Resolved in Phase 3G.2** (below). The flat vector master is no longer a blocker | |
| 6 | ~~Open Graph metadata, social images and the structured-data logo~~ | **Resolved in Phase 4** (below) | |
| 7 | ~~English homepage meta description~~ | **Resolved in Phase 4** (below). Like every description, open to the launch copy review | |
| 8 | Native-speaker Greek editorial read | A reviewer | All Greek pages |
| 9 | Presentation of TechPi-owned products | A decision | Work page and homepage |
| 10 | Permission for Logotherapia imagery | Permission before any image with identifiable children is used | The Logotherapia case study |
| 11 | EU project case studies (optional) | Approved factual content per project | Would extend the EU Projects page; the service page itself is not blocked |
| 12 | The training-crawler decision | The owner's decision; then re-verify crawler names and policies and add narrow per-agent rules, if any. The base `robots.txt` (allow all, sitemap line) exists since Phase 4 and needs no change if nothing is blocked | Search and answer-engine visibility |
| 13 | Confirmed contact method beyond email and phone, if wanted | A decision | Whether a form is needed |
| 14 | `PUBLIC_ALLOW_INDEXING` unset in Cloudflare | Confirm in the Cloudflare dashboard that the variable is not set for production or previews. Since Phase 3G.2 it is the only indexing switch: the TemporaryFonts guard, which also failed indexable builds, went with the remote fonts. Set it only for production, only at launch | Every page's `noindex` |
| 15 | HTTPS and HSTS on `techpi.eu` | After the domain is connected: Always Use HTTPS, minimum TLS 1.2, then HSTS without `includeSubDomains` or `preload` at first (`security.md`, section 9). Not checked in the dashboard yet | Transport security of the production domain |

Resolved in Phase 3F: confirmed email, phone and town (section 1).

Resolved in Phase 5 (`security.md`):
- **Dependency advisories.** 4 high → 1 high. `sharp` (GHSA-wq5f-xc86-pv6w) fixed with an npm override of miniflare's pinned copy. `http-cache-semantics` (GHSA-ch52-4w7c-c8xp) has no upstream fix; npm's suggested 4.3.0 does not change the affected code, so it was not taken; the code path (build-time remote-image caching) is not reachable in this site.
- **Security headers and Content Security Policy.** A hashed per-page CSP (Astro), plus `frame-ancestors`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and COOP in `public/_headers`, verified on the Preview URL. Known gap: Cloudflare does not apply `_headers` to 404 responses.
- **workers.dev indexing safeguard.** `X-Robots-Tag: noindex` on `*.workers.dev` hosts only, never on `techpi.eu`. `PUBLIC_ALLOW_INDEXING` remains the only route to indexing (blocker 14 unchanged: the dashboard was not inspected).
- **Not inspected in Phase 5:** Cloudflare dashboard settings (variables, zone TLS and HTTPS settings). Blocker 15 added.

Resolved in Phase 4 (`seo.md`):
- **Open Graph, social images and the structured-data logo** (blocker 6). Open Graph and Twitter card tags on all 18 content pages. Two 1200 x 630 images, English and Greek, from the approved 3D symbol and the self-hosted font (`scripts/brand/derive-social.mjs`). The Organization logo is `/techpi-logo.png`, 512 x 512, the blue 3D symbol.
- **English homepage meta description** (blocker 7). Every page now has a written title and description in `src/content/seo.ts`.
- Also added: JSON-LD (Organization, WebSite, WebPage, Service on Capabilities and EU Projects, breadcrumbs on case studies), `/sitemap.xml` (18 URLs), `/robots.txt`, and an SEO validator (`scripts/seo/validate.mjs`). The site stays `noindex`: blocker 14 is unchanged.
- **Not a blocker, recorded:** case studies use their language's default sharing image. A designed card per case study is optional later design work.

Resolved in Phase 3G.2 (`identity-font-readiness.md`):
- **Self-hosted Commissioner** (blocker 4). Two official WOFF2 files, version 1.001, OFL 1.1, from Google Fonts. The temporary Google Fonts loader is removed, and the site makes no third-party font request.
- **Identity and favicon** (blocker 5). The four 3D raster assets are approved as the official identity and moved to `brand-source/final/3d/`. The homepage Contact section resolves into the white 3D symbol. Header and footer stay typographic by decision. PNG favicons and an Apple touch icon come from the approved app icon.
- **Not a blocker:** a flat vector master. It does not exist and was not fabricated. It is a future brand-system deliverable (`identity-font-readiness.md`, B.7).
- **Accepted:** Commissioner has no arrow glyphs (← → ↗), so they use the system font. The English pages also fetch the 15 KB Greek font file, because the language switch shows "ΕΛ".

## 6. For the owner to decide

- **Repository visibility.** The GitHub repository is public, and `docs/` contains internal planning, including references to a project that must not appear on the website. Consider making the repository private. This is outside what was changed in this phase.
- **Node version on this machine.** Resolved 2026-10-07: Node 24.18.0 is installed and active through `nvm-windows`, matching `.node-version`, `engines` and Cloudflare's build image. `npm ci` leaves the lockfile unchanged.
- **Dependency advisories.** Handled in Phase 5 (above, and `security.md`). One advisory remains, not reachable here and with no upstream fix: re-run `npm audit` before launch.
