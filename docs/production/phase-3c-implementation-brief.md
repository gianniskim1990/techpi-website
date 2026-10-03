# Phase 3C implementation brief

Status: **final decisions recorded. Phase 3C.1 in implementation.** 3C.2 is blocked on content.
Date: 2026-10-03
Source of truth: `docs/design/secondary-pages-spec.md` (approved with revisions). Where the disposable study in `explorations/phase-3/secondary-pages/` differs from the spec, **the spec wins**. In particular, the study's "How they combine" table on Capabilities is obsolete and is not built.

---

## 1. Readiness by page

Classified on confirmed project information only.

| Page | Status | Why |
|---|---|---|
| `/about` | **Ready to implement now** | Every line comes from approved sources: the h1 and lead, Pi stays / Tech says (homepage), stayed and changed (brand brief section 8), and the four principles (approved positions). The optional facts section is simply omitted. Needs only approval of the principle wording in section 5 |
| `/capabilities` | **Ready to implement now** | The four names, summaries and item lists are approved homepage copy. The lead is in section 5. The longer body text and per-item explanations are optional additions, not blockers. "Seen in" links are omitted until a case study is published |
| `/work` | **Ready with safe placeholders** | Name, category and summary are confirmed for all three projects. Media uses the approved neutral placeholder. No "View case study" link until a case study exists. The Capabilities row needs confirmation (it already shows on the homepage, see section 7) |
| `/contact` | **Ready with safe placeholders** | Page head and "Greece and Europe" are confirmed. Email and phone rows are omitted until supplied. **Launch is blocked** until at least one contact method is confirmed: a contact page with no way to make contact cannot go live |
| `/work/[slug]` | **Blocked by content** | The minimum publishable case study needs overview, purpose, scope and a cover image. None is confirmed for any project |
| `/eu-projects` | **Blocked by content** | No programme, role, coordinator, period or lead sentence is confirmed. Approved to stay unpublished |

---

## 2. Implementation order

Split into two reviewable parts. **3C.1** can start now. **3C.2** starts when the first project's content arrives.

| # | Step | Part | Why here |
|---|---|---|---|
| 1 | **Content layer.** Typed case-study collection (schema from `content-model.md`, with `status`), shared capability data. The homepage reads projects and capabilities from it, with **no visual change**. Build guard: an indexable build fails if a published entry is incomplete | 3C.1 | Every later page reads this data. Doing it first means the homepage, Work and Capabilities never hold three copies of the same facts |
| 2 | **Mobile navigation** (section 4) | 3C.1 | It changes the shared header on every page, including the homepage. Done early, every later page is reviewed with the final navigation, once |
| 3 | **Shared primitives** with the first page: PageIntro, SectionSplit, FactRows, ClosingCTA | 3C.1 | Built against real content (About), not in the abstract |
| 4 | **About** | 3C.1, **held** | Held until principles 3 and 4 are approved. Content otherwise confirmed. Exercises every Paper primitive plus the one arc. Smallest complete page |
| 5 | **Capabilities** | 3C.1 | Reuses the primitives, adds in-page anchors. No new components |
| 6 | **Work index** with ProjectRow and the Ink band | 3C.1 | Needs the content layer. Introduces the only new list component |
| 7 | **Contact** (page head and direct contact only) | 3C.1 | Smallest page. Reuses PageIntro and FactRows. The form is deferred (section 9) |
| 8 | **Case-study template**, and links from Work, homepage and "Seen in" switched on | 3C.2 | Only after at least one project has its minimum publishable content. Designing the long-form layout against empty fields would be redone once real text and imagery arrive |

Each step is one commit and one Preview review. `/eu-projects` is not built in either part.

---

## 3. Shared components

Smallest useful set. Everything else stays page-specific.

| Component | Used by | Notes |
|---|---|---|
| `PageIntro` | All secondary pages | h1 and lead. No arc option: the arc belongs to About only and lives in the About page |
| `SectionSplit` | About, Capabilities, Contact, later case study and EU Projects | Heading column and content slot. No sticky behaviour |
| `FactRows` | Work index, Contact, later case study and EU Projects | Takes label and value pairs. **Drops any pair without a value** |
| `ClosingCTA` | All secondary pages except Contact | Hairline, the homepage question, the pill to `/contact` |
| `ProjectRow` | Work index (later EU Projects) | Image column and text column on Ink. Not shared with the homepage Selected Work, which is a different composition. They share the data, not the markup |
| `MobileNavigation` | Header | See section 4 |

Not components:

- The ruled list ("What it covers", scope) is a global CSS pattern in `base.css`, not a component.
- About's stayed/changed pair and principles, and the Capabilities in-page index, stay page-specific.
- Case-study blocks (hero, media, next project) are designed in 3C.2 against real content, not now.

---

## 4. Mobile navigation decision

**A full-screen overlay built on the native `<dialog>` element**, opened with `showModal()`.

Why this one:

- A modal dialog makes the rest of the page inert, so focus cannot leave it, with no custom focus-trap code.
- Escape closes it natively. Closing returns focus to the opener.
- It sits in the browser's top layer: no z-index work.
- Body scroll lock is one CSS rule (`html:has(dialog[open]) { overflow: hidden; }`).
- The JavaScript is a few lines: open, close, and keep `aria-expanded` in sync.
- A full-screen panel, not a drawer: a drawer implies slide motion and a half-covered page, which conflicts with "no unnecessary animation" and adds a second surface to compose.

Form:

- Paper surface, header row kept at the top (TECHPI left, a visible "Close" button right).
- The five items in display-m, sentence case, in header order, with hairlines between. Then the language switch.
- No animation. It appears and disappears.
- Trigger: a `<button>` labelled "Menu" with `aria-expanded` and `aria-controls`. Without JavaScript the button stays hidden and the current "Menu → footer" link remains, so the navigation is always reachable.
- Desktop is unchanged (plain Contact link).

---

## 5. Approved lead copy (recommended)

| Page | Lead |
|---|---|
| Work | **Products, platforms and systems, each built around a real business need.** |
| Capabilities | **Four capabilities, brought together around the problem.** |
| Contact | **Tell us about the problem you need to solve.** |

They echo the brand idea ("Technology built around real business needs") and stay business-first, with no claims that need evidence.

About principles: **source check (3C.1).** Only copy already approved may be published. Result:

| # | Proposed principle | Result |
|---|---|---|
| 1 | The business problem first. We start with how an organisation actually works, and choose technology after that. | Supported by the homepage Brand Statement ("The business problem" / "Only then do we choose the stack"). Passes |
| 2 | AI where it creates value. Not where it creates noise. | The approved homepage Intelligence heading. Passes |
| 3 | Built to run every day. Not only to launch. | "A system that runs every day" is approved homepage copy, but "Not only to launch" is a new positioning claim. **Needs approval** |
| 4 | Real work only. No invented results, no stock imagery. | This is an internal design rule, not approved public copy. Publishing it is a new statement. **Needs approval** |

Principles 3 and 4 do not pass, so **About is not implemented in 3C.1 until the wording is approved.** `/about` keeps its route shell meanwhile.

---

## 6. About: what is still needed to be complete

The page can ship without these. Each is added only if supplied, and its row or line is omitted otherwise.

- Whether the stayed/changed wording from the brand brief may be published as written
- When the name changed, if it is to be stated
- Founding year of the company, if it is to be stated
- Where TechPi is based, beyond "Greece and Europe"
- Legal entity name (also needed for the footer and Privacy)
- Whether to add a fifth principle on European and international work

Not to be invented: founding date, team size, number of projects, client counts, countries, office facts.

---

## 7. Work and case-study content

| | cAIrelink | Arman's Ethnic Street Food | SOWISE+ |
|---|---|---|---|
| **Confirmed** | Name. Category "Healthcare platform". Summary "A custom web application for healthcare." Slug `cairelink`. Imagery must be demo, mock or redacted only, with the demo-data disclosure | Name. Category "Direct ordering platform". Summary "A platform that lets the restaurant take orders directly from its customers." Slug `armans` | Name. Category "EU-funded digital platform". Summary "The digital platform of an EU-funded project." Slug `sowise-plus` |
| **Needs your confirmation** | Permission to publish. Client name. Purpose. Scope. TechPi's role. Technology. Year. Imagery and its reviewer. Public URL. Capabilities (currently shown on the homepage as "Digital products, Intelligence") | Permission to publish. Client name. Purpose. Scope. TechPi's role. Technology. Year. Imagery. Public URL. Capabilities (homepage: "Digital products, Web experiences") | Permission to publish. Purpose. Scope. TechPi's role. Technology. Year. Imagery. Public URL. Capabilities (homepage: "Web experiences, EU projects"). Programme, official title, grant number, coordinator, period, project site, funding statement and emblem requirement |
| **Do not invent** | Outcomes, metrics, patient or clinical claims, AI features, technologies, client logos, testimonials | Outcomes, order volumes, revenue, technologies, testimonials | Programme names, funding values, consortium role, outcomes, dissemination figures |

Note: the homepage already shows the per-project capability values from the Gate B prototype, where they were marked "to confirm". They are the first thing to confirm, because they now appear on the homepage, the Work index and later "Seen in".

SOWISE+ also shows "EU projects" as a capability, which is not one of the four fixed capability ids. The content layer (step 1) validates against those four, so this value has to be resolved then: either dropped from the capability list (EU funding is already stated in the category) or confirmed as something else. Recommended: drop it, with no visible change other than that word.

---

## 8. EU Projects handling

**Keep the existing route shell.** `/eu-projects` and `/el/eu-projects` stay as the Phase 3A shell pages. No page design is built until the facts arrive.

- Navigation, canonical URLs, hreflang and the redirect matrix are untouched.
- The whole site is still `noindex`, so the shell is harmless on Preview.
- Before launch the shell must be replaced. This is a launch blocker, recorded here.
- Not chosen: building it unlinked (unconfirmed content in the codebase), or removing the route (damages the route architecture and the navigation).

---

## 9. Contact form handling

**Defer the form entirely** until submission handling is planned (the endpoint is the only Worker code in Phase 3, see `implementation-plan.md`).

- A visual-only form would look working and not be. On a client Preview that misleads, and it would be rebuilt around validation, errors and success states anyway.
- The approved fields (name, organisation, email, what you need to solve, optional timeframe, no budget) are recorded in the spec and carry into the form step unchanged.
- Phase 3C Contact shows the page head, then direct contact methods as fact rows.

---

## 10. Placeholder rules

1. **No visible placeholder text** in production code: never "[to confirm]", "TBC", "Lorem", or a dash in an empty field.
2. **A missing optional value removes its element.** A fact row, a "Seen in" line, a link or a section is simply not rendered.
3. **A missing image uses the approved neutral placeholder** (tinted field, project name cropped large and faint). No fake screens.
4. **A missing required value keeps the page out**: the case study stays `draft`, or the route keeps its shell (EU Projects).
5. **Unconfirmed facts are tracked in the content files**, never only in prose. The build guard fails an indexable build that contains them.
6. **No copy is written to fill a gap.** Optional body text appears only when supplied or approved.

---

## 11. Not in Phase 3C

- The case-study pages until content arrives (3C.2), and the EU Projects page until its facts arrive
- The contact form and its endpoint
- Privacy and Cookies pages (they need legal entity details, which are not supplied)
- The "How they combine" capability table (deferred, spec section 4)
- Work index scaling logic: text index, thresholds and filters (guidance only, spec section 2.4)
- Greek versions of the new pages (Phase 3D). Greek routes keep their current shells
- Any motion (Phase 3E), including the About arc and the Next project edge animating
- Changes to the approved homepage, other than reading its data from the shared content layer with identical output
- Self-hosted fonts, the vector symbol and real imagery (later hand-offs)

---

## 12. Self-check

| Question | Answer |
|---|---|
| Will anything be thrown away? | No. The case-study template waits for real content for this reason. The form is deferred rather than built visual-only. The data move is done once, before three pages depend on it |
| Placeholders where waiting would be better? | Case studies, EU Projects and the form all wait. Placeholders are limited to media fields and omitted rows |
| Is content invented? | No. Leads and principles are drafted from approved positions and are submitted for approval here. All project facts beyond name, category and summary are listed as needing confirmation |
| Calmer than the homepage? | Yes. One arc on one page, one curved edge in 3C.2, no Blue sections, no motion |
| Small enough for controlled review? | 3C.1 is seven steps, each one commit and one Preview review. 3C.2 is separate |

---

## 13. Approval needed to start 3C.1

1. The three leads (section 5).
2. The four About principles (section 5).
3. The implementation order and the 3C.1 / 3C.2 split (section 2).
4. The `<dialog>` overlay for mobile navigation (section 4).
5. Keeping the EU Projects shell and deferring the form (sections 8 and 9).

---

## 14. Final decisions (recorded before 3C.1 implementation)

- Leads as in section 5, exact English lines. Capabilities lead changed to "Four capabilities, brought together around the problem."
- Split approved: 3C.1 (shared project and capability data, mobile navigation, shared building blocks, About once approved, Capabilities, Work index, simplified Contact) and 3C.2 (case-study template and pages, blocked until the first project has the minimum real content).
- **Data model:** "EU projects" is not a capability. The taxonomy is the four capability ids only. Extra classification is modelled separately as `category`. Capability assignments that are not confirmed are marked `confirmed: false` in the data, not turned into permanent content.
- Mobile navigation: `<dialog>` full-screen overlay as in section 4. No drawer, no animation library.
- Contact: no form and no fake form. Only the lead, "Greece and Europe", and the structure. Launch blocker: no confirmed email or phone.
- **Launch blockers recorded:** `/eu-projects` is still a Phase 3A shell. Contact has no confirmed direct contact method. Case studies are not published. Privacy and Cookies pages are not built.
- cAIrelink: no screenshots in 3C.1. Future media demo, mock or redacted only, with "All screens shown use demo data."

---

## 15. About: principles resolved (3C.1 completion)

The blocked principles were replaced by approved wording. The four principles now used on `/about`, as headings:

1. The business problem first. (supporting copy: "We start with how an organisation actually works, and choose technology after that.")
2. AI where it creates value. Not where it creates noise.
3. Built to run every day.
4. Technology built around real business needs.

"Not only to launch" and the "real work only / no stock imagery" line are not published. About also carries the approved evolution statement, the "Stayed / Changed" pair (verbatim from the brand brief, section 8) and "Pi stays. Tech says where we are going…" from the homepage. The hairline arc is shown at 1280px and up only, because below that width there is no position clear of the header and the lead.

Facts still optional for About (omitted until supplied): founding year, base location beyond "Greece and Europe", legal entity name, when the name changed.
