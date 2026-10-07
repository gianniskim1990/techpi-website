# Launch blockers and confirmed facts

Status: current as of 2026-10-07 (Phase 3F, contact foundation). This is the single place that records what is confirmed for public display, what is deliberately deferred, and what still blocks launch. Other documents point here instead of repeating it.

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
| EU Projects content | Not approved | See section 4 |
| Organisation structured data | Later milestone | Needs the legal and business identity fields. The site has no Organization schema, and nothing unconfirmed is to be added to any schema |

## 4. EU Projects

`/eu-projects` and `/el/eu-projects` stay as intentional, unpublished route shells. No EU-project fact is confirmed for publication, so nothing is shown: no project cards, no funding claims, no placeholder content.

- **The link is not in the navigation.** The header, the mobile menu and the footer list four pages (Work, Capabilities, About, Contact) from one list, `navPages` in `src/i18n/routes.ts`. An unfinished page must not be promoted as if it were complete.
- **The routes still work** and return 200. Their redirects and dictionary entries are unchanged. They are linked only from each other, through the language switch.
- **They stay `noindex` even after indexing is switched on** for the rest of the site (the `noindex` flag on the shell page). Verified in a throwaway indexable build.
- **To restore the navigation item** when real content is approved: add `'euProjects'` back to `navPages`, between `'capabilities'` and `'about'`; replace the shell with a designed page; remove the `noindex` flag from that page; add it to the sitemap. Header, mobile menu and footer follow automatically.
- The EU Projects page cannot be completed until approved factual content exists: programme, TechPi's role, the funding acknowledgement and the project's own details.

## 5. Launch blockers

Each of these must be resolved, or consciously accepted, before indexing is enabled.

| # | Blocker | Needs | Affects |
|---|---|---|---|
| 1 | Legal entity details | Legal name, registered address, registration and VAT numbers | Footer legal line, Privacy and Cookies pages, Organization schema |
| 2 | Privacy and Cookies pages | Item 1, and the tracking decision | Footer links, consent handling |
| 3 | Tracking and analytics decision | Choice of product, or a decision to use none | Privacy, cookies, whether a consent banner is needed |
| 4 | Self-hosted Commissioner | The prepared font files (Latin and Greek subsets) | Removes the temporary Google Fonts loader. A build with indexing enabled fails until then |
| 5 | Final vector identity and favicon | The vector master: symbol, wordmark, lockup, favicon set | Header mark, Contact symbol, favicon, structured-data logo |
| 6 | Open Graph metadata and social images | Final images, in both languages | Social previews |
| 7 | English homepage meta description | An approved line | Search snippet |
| 8 | Native-speaker Greek editorial read | A reviewer | All Greek pages |
| 9 | Presentation of TechPi-owned products | A decision | Work page and homepage |
| 10 | Permission for Logotherapia imagery | Permission before any image with identifiable children is used | The Logotherapia case study |
| 11 | EU Projects content | Approved factual content | EU Projects pages, navigation |
| 12 | Final `robots.txt` and the training-crawler decision | Re-verify crawler names and policies at launch | Search and answer-engine visibility |
| 13 | Confirmed contact method beyond email and phone, if wanted | A decision | Whether a form is needed |

Resolved in Phase 3F: confirmed email, phone and town (section 1).

## 6. For the owner to decide

- **Repository visibility.** The GitHub repository is public, and `docs/` contains internal planning, including references to a project that must not appear on the website. Consider making the repository private. This is outside what was changed in this phase.
- **Node version on this machine.** The project targets Node 24 (`.node-version`, `engines`). The work machine runs Node 22.12.0. Check, build and the Cloudflare runtime all pass on it, but upgrade before relying on local results as a match for CI.
