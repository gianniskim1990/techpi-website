# Launch blockers and confirmed facts

Status: current as of 2026-10-07 (Phase 3G.2, identity and self-hosted fonts). This is the single place that records what is confirmed for public display, what is deliberately deferred, and what still blocks launch. Other documents point here instead of repeating it.

The site stays `noindex` until every blocker below that applies is resolved and indexing is switched on deliberately.

## 1. Confirmed for public display

| Fact | English | Greek | Shown on |
|---|---|---|---|
| Email | info@techpi.eu | info@techpi.eu | `/contact`, `/el/contact` |
| Phone | +30 697 594 6984 | +30 697 594 6984 | `/contact`, `/el/contact` |
| Location | Xanthi, Greece | Ξάνθη, Ελλάδα | `/contact`, `/el/contact` |

- Email is a `mailto:info@techpi.eu` link. Phone is a `tel:+306975946984` link. The visible phone number keeps its spaces.
- The location is the **town only**. No street address is confirmed, so none is shown, and none must be inferred.
- The values live in `src/content/site.ts` (email, phone) and `src/content/pages.en.ts` / `pages.el.ts` (labels and location). They appear on the Contact pages only. They are deliberately **not** in the footer, the homepage, page titles, descriptions or structured data.
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

- `/eu-projects` and `/el/eu-projects` are real service pages (`EuProjectsPage.astro`, copy in `src/content/eu.ts`):
  what TechPi builds for EU-funded projects and consortia, who it is for, and how it is built. The homepage has a
  matching section between Capabilities and Intelligence.
- **It is not a portfolio.** No specific EU project, programme participation, partner, result, certification or
  compliance is claimed. Programmes (Horizon Europe, Interreg, Erasmus+, LIFE, Digital Europe) are named only as
  examples: "Suitable for projects funded through programmes such as…".
- **SOWISE+ is not mentioned** anywhere (section 2).
- **Navigation restored:** EU Projects / Ευρωπαϊκά έργα is back in the header, the mobile menu and the footer
  (`navPages` in `src/i18n/routes.ts`), between Capabilities and About.
- **Indexing:** the pages follow the site-wide `noindex` like every other page. The extra page-level `noindex` of the
  former route shell is removed, so they become indexable together with the rest of the site at launch. Add them to
  the sitemap at the SEO milestone.
- Showing specific EU projects as case studies still needs approved factual content: the programme, TechPi's role,
  the funding acknowledgement and the project's own details.

## 5. Launch blockers

Each of these must be resolved, or consciously accepted, before indexing is enabled.

| # | Blocker | Needs | Affects |
|---|---|---|---|
| 1 | Legal entity details | Legal name, registered address, registration and VAT numbers | Footer legal line, Privacy and Cookies pages, Organization schema |
| 2 | Privacy and Cookies pages | Item 1, and the tracking decision | Footer links, consent handling |
| 3 | Tracking and analytics decision | Choice of product, or a decision to use none | Privacy, cookies, whether a consent banner is needed |
| 4 | ~~Self-hosted Commissioner~~ | **Resolved in Phase 3G.2** (below) | |
| 5 | ~~Final identity and favicon~~ | **Resolved in Phase 3G.2** (below). The flat vector master is no longer a blocker | |
| 6 | Open Graph metadata, social images and the structured-data logo | Final images in both languages, made from the approved 3D identity | Social previews, Organization schema |
| 7 | English homepage meta description | An approved line | Search snippet |
| 8 | Native-speaker Greek editorial read | A reviewer | All Greek pages |
| 9 | Presentation of TechPi-owned products | A decision | Work page and homepage |
| 10 | Permission for Logotherapia imagery | Permission before any image with identifiable children is used | The Logotherapia case study |
| 11 | EU project case studies (optional) | Approved factual content per project | Would extend the EU Projects page; the service page itself is not blocked |
| 12 | Final `robots.txt` and the training-crawler decision | Re-verify crawler names and policies at launch | Search and answer-engine visibility |
| 13 | Confirmed contact method beyond email and phone, if wanted | A decision | Whether a form is needed |
| 14 | `PUBLIC_ALLOW_INDEXING` unset in Cloudflare | Confirm in the Cloudflare dashboard that the variable is not set for production or previews. Since Phase 3G.2 it is the only indexing switch: the TemporaryFonts guard, which also failed indexable builds, went with the remote fonts. Set it only for production, only at launch | Every page's `noindex` |

Resolved in Phase 3F: confirmed email, phone and town (section 1).

Resolved in Phase 3G.2 (`identity-font-readiness.md`):
- **Self-hosted Commissioner** (blocker 4). Two official WOFF2 files, version 1.001, OFL 1.1, from Google Fonts. The temporary Google Fonts loader is removed, and the site makes no third-party font request.
- **Identity and favicon** (blocker 5). The four 3D raster assets are approved as the official identity and moved to `brand-source/final/3d/`. The homepage Contact section resolves into the white 3D symbol. Header and footer stay typographic by decision. PNG favicons and an Apple touch icon come from the approved app icon.
- **Not a blocker:** a flat vector master. It does not exist and was not fabricated. It is a future brand-system deliverable (`identity-font-readiness.md`, B.7).
- **Accepted:** Commissioner has no arrow glyphs (← → ↗), so they use the system font. The English pages also fetch the 15 KB Greek font file, because the language switch shows "ΕΛ".

## 6. For the owner to decide

- **Repository visibility.** The GitHub repository is public, and `docs/` contains internal planning, including references to a project that must not appear on the website. Consider making the repository private. This is outside what was changed in this phase.
- **Node version on this machine.** Resolved 2026-10-07: Node 24.18.0 is installed and active through `nvm-windows`, matching `.node-version`, `engines` and Cloudflare's build image. `npm ci` leaves the lockfile unchanged.
- **Dependency advisories.** `npm audit` now reports 4 high-severity advisories (Astro's `http-cache-semantics`, and `sharp` through Wrangler). They are build-time or dev-only and do not ship in the static site. Handled in the dedicated pre-launch security milestone, not in identity or fonts (deliberately untouched in 3G.2).
