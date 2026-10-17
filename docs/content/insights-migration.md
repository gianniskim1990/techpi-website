# Insights migration: pigiota314.eu → techpi.eu

Status: **published** (Phase 2D, PR #22, merged 2026-10-17 and live on techpi.eu), still **`noindex`** like the whole
site. One post-migration clarification (Phase 2E, section 7). Approved by the owner on
2026-10-16 (migration-audit decision D2 / owner decision O28: create `/insights` with the seven articles, keeping their
slugs). English only; a Greek version is a separate, later phase. No legacy redirect is active.

## 1. Sources

Read in full on 2026-10-16 from the live pages (server-rendered HTML, confirmed with a rendered fetch: no content is
loaded by script). Every article page displays a date ("… min read · 12 September 2025") and declares the same date as
`datePublished` in its own `Article` JSON-LD (author: the organisation "Pigiota314"). No modified date and no personal
author is shown or declared. The displayed reading times (4 to 7 min) do not match the very short bodies and are not
carried over.

The source bodies are short: one to three sections of one or two paragraphs each. Nothing was missing or truncated.
They were kept short; nothing was added to lengthen them.

## 2. Source → destination

| # | Source (pigiota314.eu) | Destination (techpi.eu) | Topic (source) | Date (verified) | Sections |
|---|---|---|---|---|---|
| — | `/insights` | `/insights` | — | — | index |
| 1 | `/insights/what-every-eu-project-website-should-include` | `/insights/what-every-eu-project-website-should-include` | EU project websites | 12 September 2025 | 3 |
| 2 | `/insights/common-mistakes-in-horizon-europe-project-websites` | `/insights/common-mistakes-in-horizon-europe-project-websites` | EU project websites | 21 August 2025 | 3 |
| 3 | `/insights/how-to-structure-deliverables-and-publications` | `/insights/how-to-structure-deliverables-and-publications` | Information architecture | 18 July 2025 | 2 |
| 4 | `/insights/accessibility-considerations-for-project-websites` | `/insights/accessibility-considerations-for-project-websites` | Accessibility | 9 June 2025 | 2 |
| 5 | `/insights/preparing-a-website-brief-during-the-proposal-stage` | `/insights/preparing-a-website-brief-during-the-proposal-stage` | Proposals | 14 May 2025 | 1 |
| 6 | `/insights/what-communication-partners-should-ask-a-web-development-supplier` | `/insights/what-communication-partners-should-ask-a-web-development-supplier` | Communication partners | 22 April 2025 | 2 |
| 7 | `/insights/how-analytics-can-support-dissemination-reporting` | `/insights/how-analytics-can-support-dissemination-reporting` | Analytics | 30 March 2025 | 1 |

Source host: `https://pigiota314.eu` (no trailing slash on the source either). These are the URLs the future
legacy-redirect phase maps one to one (`pigiota314.eu/insights/<slug>` → `techpi.eu/insights/<slug>`, 301, same path).
That phase is not started.

Titles, slugs, topics, order (newest first) and section headings are the source's own. The one heading change is
typographic (a curly apostrophe in "project’s").

## 3. Editorial changes

Applied to every article:

- The closing "Working on a similar project? We'd be happy to discuss how Pigiota314 can support your project website or
  digital platform. [Discuss your project]" is replaced by a restrained TechPi invitation (EU Projects, Contact).
- A visible line says the article was first published under the pigiota314 name and edited for TechPi, next to the
  original date. "Pigiota314" is written "pigiota314", as everywhere on techpi.eu.
- Punctuation: spaced em dashes are replaced by commas or colons, Oxford commas removed, in the site's house style.
- Inline enumerations that the source wrote as one sentence are set as lists, word for word (article 1's seven
  sections, article 3's eight fields, article 4's four problems, article 5's four actions, article 6's questions).

Per article (source wording → TechPi wording, where it changed in substance):

1. **What every EU-funded project website should include.** "frequently inherit" → "often inherit". Otherwise the same.
2. **Common mistakes in Horizon Europe project websites.** Lead: "Patterns we repeatedly see — and how to avoid them —
   when reviewing existing Horizon Europe project websites" → "Three recurring patterns in Horizon Europe project
   websites, and how to avoid them." The original implies a review practice that TechPi does not document; the
   article's substance is unchanged.
3. **How to structure deliverables and publications.** Unchanged apart from the list.
4. **Accessibility considerations for project websites.** "remain the most common findings" → "The same problems come
   up most often:", because "findings" implies audits that are not documented. "public-funded" → "publicly funded".
5. **Preparing a website brief during the proposal stage.** Unchanged apart from the list.
6. **What communication partners should ask a web development supplier.** Unchanged apart from the lists.
7. **How analytics can support dissemination reporting.** A note is added, set apart from the article text: the
   article is about measuring an EU project's website; techpi.eu itself uses no analytics or tracking (link to the
   Cookies Policy). It does not describe Search Console, whose wording belongs to the legal pages.

Index: the source heading "Practical notes for EU project communication teams" and its lead ("… practical guidance
rather than generic agency content") became the TechPi lead; the page title is "Insights".

## 4. Statements to verify (flagged, not changed)

- Article 4: "WCAG 2.2 AA is the realistic target for most publicly funded project websites." Kept as the source's
  recommendation at migration; **clarified in Phase 2E** (section 7). It is not a legal claim: the EU Web Accessibility Directive (2016/2102) applies to public sector
  bodies and refers to EN 301 549, which currently references WCAG 2.1 AA; whether it applies to a given project
  website depends on who operates it. Do not strengthen the sentence into a legal requirement without checking.
- Article 4's lead says "What WCAG 2.2 AA means in practice"; the body is short. Accurate, but a fuller treatment would
  be new content and needs approval.
- Article 3: "the most downloaded items" assumes download counts are measured on the project site. Kept as advice.

## 4a. Recorded source wording (unchanged evidence)

Article 4, first section, as published on pigiota314.eu (read 2026-10-16): "Treat accessibility as part of the
original specification, not as a remediation effort before review. WCAG 2.2 AA is the realistic target for most
public-funded project websites." The Phase 2D migration kept the second sentence, with "publicly funded".

## 5. What was not done

- No Greek pages, no `/el/insights` route, no Greek link to Insights.
- No images: the source articles have none (their sharing image was a generic preview screenshot). The pages are
  text-first and use the site's default sharing image.
- No author, reading time, modified date, category filter, search, CMS, script or tracker.
- No legacy redirects, no sitemap submission, no Change of Address, no indexing.

## 6. Where things are

- Content: `src/content/insights.ts`. Templates: `src/components/pages/InsightsIndexPage.astro`,
  `InsightPage.astro`. Routes: `src/pages/insights.astro`, `src/pages/insights/[slug].astro`.
- English-only mechanism: `docs/production/routes.md`, section 4.1.
- Structured data: `docs/production/seo.md`, section 5.
- Validation: `scripts/content/validate-insights.mjs` (in `npm run build`), and `scripts/seo/validate.mjs`.

## 7. Post-migration clarification (Phase 2E, 2026-10-17)

Article 4 (`/insights/accessibility-considerations-for-project-websites`), first section, second sentence:

- Before: "WCAG 2.2 AA is the realistic target for most publicly funded project websites."
- After: "WCAG 2.2 Level AA is a useful accessibility target when planning a project website. The precise compliance
  requirements depend on the organisation operating the site and any applicable legal or contractual obligations."

Why: the earlier sentence could be read as a general requirement. WCAG 2.2 Level AA stays the recommended target
(W3C recommends WCAG 2.2 for new work: https://www.w3.org/TR/WCAG22/), but the legal reference is narrower and moving:
EN 301 549 v4.1.1 (published September 2026) adopts WCAG 2.2, while AccessibleEU reported on 7 September 2026 that it
is not yet cited in the Official Journal, so v3.2.1 (based on WCAG 2.1 Level AA) remains the reference for the EAA
and the Web Accessibility Directive
(https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en,
read 2026-10-17; the Official Journal itself was not checked). The article states no legal reference, so it does
not need to follow that status; it only says that requirements depend on the operator and its obligations.

Unchanged: slug, date (9 June 2025), headings, structure, lead, metadata, related articles, provenance line,
English-only routing.
