# Phase 2I: site-wide typography consistency

Branch `feat/phase-2i-typography-consistency`, from `main` at `cd185c3`. Date 2026-10-19. Draft, awaiting the owner's
visual approval. The resulting scale and its rules are in `docs/design/design-system.md`, section 3.

## How the audit was done

- Every `font-size` declaration in `src` was listed with its selector, media query and line height (95 declarations).
- The computed size, line height and weight of every visible text element was recorded in Chrome on all 60 content
  pages (English and Greek) at 1440, 768, 390 and 320 px, for `main` and for this branch, and compared element by
  element (16,105 elements per run).

## Root causes

1. **Content text set in the metadata size.** `--text-small` (15 px) was used for ordinary content in some components,
   while the same kind of content was `--text-body` (17 px) elsewhere: the homepage capability and EU lists (15) against
   the same lists on Capabilities and EU Projects (17); the homepage "First / Second" step descriptions (15) against the
   About principles (17); on EU Projects, the platform and partner descriptions (15) sat next to the principle and step
   descriptions (17) in the same sections.
2. **Component-specific `clamp()` scales instead of tokens.** Page titles had three sizes for one role (page intros
   95 px, case studies 101 px, plus near-copies on the homepage at 92 and 94 px); project titles, Earlier Work titles,
   related-project and related-article titles each had their own expression. Small differences such as 26 against 28 px
   or 20 against 22 px read as arbitrary.
3. **One inverted hierarchy.** The case-study overview paragraph was 32 px under a 28 px "Overview" heading, and larger
   than the case's own lead (22 px) at the top of the page.
4. **Hardcoded one-offs.** Insights paragraphs at 18 px (the rest of the site, including the Legal pages' long-form
   text, is 17 px); fact-strip values at 16 px; About step labels at 14 px; several 17 px and 13 px values written as
   rem literals instead of tokens.
5. **Responsive overrides that changed the role.** On phones, an Insights paragraph rule also caught the note below the
   article (15 px on desktop, 17 px on a phone), and a homepage rule raised one case summary from 17 to 18 px.
6. **Greek scaling applied unevenly.** Greek page intros used the 0.88 display multiplier; Greek case-study titles and
   the homepage contact statement did not, and the homepage AI statement used its own Greek size (about 0.82).

## Before and after

Sizes in px as computed (desktop 1440 / phone 390). EN and EL are equal unless shown.

| Text role | Previous | New | Reason | Components |
|---|---|---|---|---|
| Page title (h1) | Intros 95 / 40; case studies 101 / 44 | 95 / 40 (`--text-display-xl`) | One token for one role | `PageIntro`, `CaseStudyPage`, `NotFound` |
| Homepage AI and contact statements | 94 / 38 and 92 / 40 | 95 / 40 (`--text-display-xl`) | Near-copies of the page-title size, now the same token | `Intelligence`, `ContactSection` |
| Greek page titles and those statements | Intros 84; case titles 101; contact 92; AI 78 | 84 / 35 everywhere | The documented 0.88 Greek display rule, now applied by the token | `tokens.css` |
| Section heading, scope list | Scope list 52 / 26 | 53 / 28 (`--text-display-m`) | It was a near-copy of the section-heading size | `CaseStudyPage` |
| Project and capability titles | Same `clamp()` repeated: 37 / 26 | 37 / 26 (`--text-title`, new) | Shared token | `ProjectRow`, `Capabilities` (home) |
| About principles | 36 / 24 | 37 / 26 (`--text-title`) | Own `clamp()` with no matching role | `AboutPage` |
| Earlier Work titles | 29 / 21 | 28 / 22 (`--text-heading`) | Own `clamp()`; the smaller tier is kept, on the shared token | `ProjectRow` |
| Related projects and articles | Case 28 / 20; Insights 22 / 18 | 28 / 22 (`--text-heading`) | Same role, two sizes | `CaseStudyPage`, `InsightPage` |
| Case-study overview | 32 / 22, line height 1.3 | 22 / 18, 1.42 (`--text-lead`) | It was larger than its own heading; it is the section's lead | `CaseStudyPage` |
| Ordinary content: paragraphs, lists, descriptions | 15 in the components above | 17 (`--text-body`) | Content is body text wherever it appears | `BrandStatement`, `Capabilities`, `EuProjects` (home), `EuProjectsPage` |
| Insights article paragraphs | 18 desktop / 17 phone | 17 (`--text-body`), line height 1.65 | Same as the Legal pages' long-form text; no size jump between widths | `InsightPage` |
| Insights note under an article | 15 desktop / 17 phone | 15 (`--text-small`) | The phone override no longer catches it | `InsightPage` |
| Case fact values (Client, Year, website) | 16 | 17 (`--text-body`) | Hardcoded value between two tokens | `FactRows` |
| Step labels | Home 15, About 14 | 15 (`--text-small`) | Same role | `AboutPage` |
| Literals equal to a token | 17 and 13 as rem values | The tokens | No visible change | `EuProjectsPage`, `InsightPage`, `SelectedWork`, `LanguageSwitch`, `TransformationMap` |

Unchanged on every page at every width, in both languages: the hero, section headings, leads, the header and
navigation, the footer, the Capabilities, Contact and Legal pages, and the Insights index.

**One layout fix:** fact values now wrap long website addresses inside their column (`overflow-wrap: anywhere`, as
the large fact variant already did). On `main`, three case studies already overflowed the screen at 320 px
(`www.levelupeducation.gr`, `app.levelupeducation.gr`). That overflow is gone, and the 17 px values do not reintroduce
it at 390 px.

## Screenshots (before on the left, after on the right)

Captured from a build of `main` and a build of this branch at identical viewport sizes, with reduced motion so that
reveal animations do not affect the frame. Desktop composites are shown at half size.

| Area | Files |
|---|---|
| Home: statement steps, capabilities, Greek contact statement | `01-…`, `02-…`, `03-…` |
| Case study: header (EN and EL), overview, scope, related | `04-…`, `05-…`, `06-…`, `07-…`, `15-…`, `21-…` |
| Earlier Work case facts at 390 and 320 (the overflow fix) | `08-…` |
| Work index: Earlier Work rows; top of the page | `09-…`, `20-…` |
| About principles | `10-…` |
| EU Projects: platforms and principles; partners | `11-…`, `12-…` |
| Insights article: body and related reading | `13-…`, `14-…` |
| Unchanged templates (Capabilities, Greek Contact, Greek Privacy, Insights index) | `16-…` to `19-…` |

## Remaining exceptions

Listed in `design-system.md`, section 3: the hero, the Selected Work horizon, the Work page word title, the intro
animation, the hero map labels, the brand wordmark and buttons, and three phone overrides that keep text on screen at
320 px. The tight-leading display lines of the hero and the homepage statements touch by design.
