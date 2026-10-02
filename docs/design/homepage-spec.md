# TechPi homepage specification

Status: approved direction with revisions (Phase 1 review). Structure and intent only. No visual design or code yet.
Date: 2026-10-02 (revised after approval)
Related: `design-brief.md`, `design-system.md`, `motion-system.md`

All copy below is draft direction in English. Greek copy is to be written, not translated. Facts marked **[to confirm]** need input from TechPi. Nothing in this document is an invented number, client, country, team size, result or year.

Revisions from the review: approved navigation (Work, Capabilities, EU Projects, About, Contact), Digital Visibility replaces Growth, case-study labels and fact rows changed to describe scope and not results, arrows limited per the approved rule, uppercase limited to small labels and metadata.

## Overview

| # | Section | Surface | Pinned | Arc |
|---|---|---|---|---|
| 0 | Header | follows section | no | no |
| 1 | Hero | Light | yes, short | hairline |
| 2 | Statement | Light | no | no |
| 3 | Selected work | Dark | yes | handoff in, image mask |
| 4 | Capabilities | Light | sticky heading only | no |
| 5 | Intelligence | Dark | no | handoff in |
| 6 | Evolution | Light | no | no |
| 7 | Contact | Blue | no | handoff in, circle completes |
| 8 | Footer | Dark | no | no |

Approximate desktop length: 9 to 10 viewport heights.

---

## 1. Hero

**Purpose.** Say what TechPi is in one line, and establish the tone and the arc.

**Headline direction.**
Primary: "We design and build digital products."
Second state: "Platforms, applications and intelligent systems, built around how your business works."
Descriptor near the logo or at the foot of the hero: "Digital Products & Technology".

**Content hierarchy.**
1. Statement (display-xl)
2. Descriptor and location line: "Greece and Europe" (label)
3. Two actions: "See selected work" (plain text action, no arrow), "Start a project →" (primary, also in header as the Contact pill)

The descriptor ("Digital Products & Technology") may be set as a small uppercase metadata label. It is the only uppercase element in the hero.

**Layout concept.**

```
┌──────────────────────────────────────────────────────────┐
│ TECHPI            Work  Capabilities  European  About  ◯ │
│                                                     ╱    │
│                                                   ╱      │
│  We design                                      ╱        │
│  and build                                     │         │
│  digital products.                              ╲        │
│                                                   ╲      │
│  Digital Products & Technology     See selected work     │
└──────────────────────────────────────────────────────────┘
```

Statement left-aligned in columns 1 to 9, sitting in the lower two thirds. The right third is empty except for the arc.

**Visual concept.** Paper background, Ink type. A single hairline arc from the oversized circle crosses the right side of the frame from top to bottom. No image, no gradient, no product mockup.

**Motion behaviour.**
- On load: statement appears by line reveal (CSS-only, immediate). The arc draws along its path once, about 1 s.
- Pinned for about one viewport of scroll. During the pin the arc rotates a few degrees, the first statement lines exit upward behind their masks, and the second statement arrives the same way.
- Then the section releases.

**Transition to next.** The second statement scrolls away naturally. The arc continues off the top of the frame, giving a continuous line into section 2.

**Desktop.** As described. Two states. Statement at display-xl.

**Mobile.** One state, no pin. Statement, then the second sentence as lead text beneath it, then the actions. The arc is a static cropped line in the top right. Total height about one screen.

**Notes.** The statement is the largest element at first paint and must be visible without scripts. Only one h1 on the page: the first statement.

---

## 2. Brand statement

**Purpose.** Explain the method: TechPi starts from the business need.

**Headline direction.**
"Every business runs on processes that software should make easier. We find them, then build the product around them."
Alternative: "Technology built around real business needs."

**Content hierarchy.**
1. Statement (display-l), four to six lines
2. Short paragraph (lead), two sentences, offset to the right
3. One text action: "How we work" (links to Capabilities)

**Layout concept.** Statement in columns 1 to 10. Paragraph in columns 7 to 11, starting below the statement's last line. Large space above and below.

**Visual concept.** Type only on Paper. This is the quietest screen on the page, on purpose.

**Motion behaviour.** Line reveal on the statement when it enters. Paragraph and action fade in as one block after it.

**Transition to next.** Arc handoff. As the reader scrolls past the paragraph, the Ink surface of Selected work enters from the lower right behind a curved edge and sweeps across the viewport.

**Desktop.** As described.

**Mobile.** Statement at display-l mobile size, paragraph below, full width. Straight edge into the dark section.

---

## 3. Selected work

**Purpose.** Prove the claim with three substantial projects. This is the most important section.

**Headline direction.** Section label: "Selected work". Each case leads with the project name and one sentence on what was built.

Approved cases and labels. One-line directions are draft and **[to confirm with real facts]**:

| Project | Sector label (small uppercase metadata) | One-line direction |
|---|---|---|
| cAIrelink | Healthcare platform | A custom web application for [purpose and users to confirm] |
| Arman's Ethnic Street Food | Direct ordering platform | A platform that lets the restaurant take orders directly from its customers |
| SOWISE+ | EU-funded digital platform | The digital platform for [programme and role to confirm] |

**No performance metrics or business results are shown.** None are invented. The panels communicate scope, complexity, product thinking, technology, design and business purpose. If TechPi and the client later supply and confirm a result, it can be added.

**Content hierarchy, per case.**
1. Large image of the real product
2. Sector label (uppercase metadata)
3. Project name (display-m)
4. One sentence: what was built and for whom
5. Fact block, three rows describing scope: business purpose, TechPi's scope (product, design, engineering), technology **[each to confirm]**
6. Text action: "View case study →" (the arrow communicates entry into a deeper page)
7. Progress: "1 of 3"

After the third case: "See all work" (plain text action).

**Layout concept.**

```
┌──────────────────────────────────────────────────────────┐
│ Selected work                                     1 of 3 │
│ ┌──────────────────────────────────┐                     │
│ │                                  │  HEALTHCARE PLATFORM│
│ │                                  │  cAIrelink          │
│ │        product interface         │  One sentence.      │
│ │                                  │  ─────────────────  │
│ │                                  │  Purpose     …      │
│ │                                  │  Scope       …      │
│ └──────────────────────────────────┘  Technology  …      │
│                                       View case study    │
└──────────────────────────────────────────────────────────┘
```

Image in columns 1 to 8, text in columns 9 to 12. The same composition for every case. Consistency makes it read as a series.

**Visual concept.** Ink surface. Images are flat, real captures on a solid field. The field behind each image may take one restrained colour from the client's own identity. No device frames in perspective, no thumbnails.

**Motion behaviour.**
- Each case is a full-height panel that holds while the next slides up over it (sticky stacking, native scroll).
- When a panel becomes current, its image is uncovered by the circular clip, and the project name appears by line reveal.
- The progress indicator updates.

**Transition to next.** After "See all work", the Ink surface ends at a straight edge and the Paper surface of Capabilities follows. Kept plain, to rest between two arc handoffs.

**Desktop.** Three pinned panels, about three viewport heights in total.

**Mobile.** Three stacked blocks, no pinning: image full width, then text. Images fade in. Progress indicator removed.

**Notes.** Each case is a real link to its case-study page, reachable by keyboard in order. If strong imagery is not available for a project, that panel becomes type-led with the project name at display-l.

---

## 4. Capabilities

**Purpose.** Show the breadth of what TechPi does, without a card grid.

**Headline direction.** "What we build."

Four entries, draft copy. "Growth" from the first proposal is replaced by Digital visibility (approved):

| Name | One sentence | Typical work |
|---|---|---|
| Digital products | Custom web applications, SaaS products and platforms, from first idea to running system | Product strategy, UX and UI, engineering, operation |
| Web experiences | Corporate websites and e-commerce that carry a brand and a business | Design, content structure, development, commerce |
| Intelligence | AI and automation applied to specific problems inside real workflows | Assistants, document and data processing, integration |
| Digital visibility | Making sure the right people, and the search and AI systems they ask, can find and understand what you have built | SEO, GEO (generative engine optimisation), AI visibility, search strategy, technical performance, measurement |

**Content hierarchy.**
1. Section heading (display-l), sticky on the left
2. Four rows, each: name (display-m), sentence (body), typical work (small)
3. One text action: "All capabilities"

**Layout concept.**

```
┌──────────────────────────────────────────────────────────┐
│ What                │ Digital products                   │
│ we build.           │ One sentence.        Typical work  │
│ (sticky)            │ ──────────────────────────────────  │
│                     │ Web experiences                    │
│                     │ One sentence.        Typical work  │
│                     │ ──────────────────────────────────  │
│                     │ Intelligence                …      │
│                     │ ──────────────────────────────────  │
│                     │ Digital visibility          …      │
└──────────────────────────────────────────────────────────┘
```

Heading in columns 1 to 4, index in columns 5 to 12. Rows separated by hairlines. Everything is visible. Nothing is hidden behind hover or accordions.

**Visual concept.** A typographic index on Paper, like a contents page. No icons, no cards, no numbering.

**Motion behaviour.** Heading stays in place (sticky) while the rows scroll past. Line reveal on the heading only. Rows are static. On pointer devices, a row's name shifts to Blue on hover as a link affordance.

**Transition to next.** Arc handoff into the Ink surface of Intelligence, entering from the lower left this time (the same circle, seen from the other side).

**Desktop.** As described.

**Mobile.** Heading, then four stacked rows, full width. Each row is a link to its capability page.

**Notes.** Digital visibility keeps the search and visibility services in the offer without turning TechPi into a marketing agency. It stays last, uses technical and product language (structure, performance, measurement), and has no campaign, awareness, social media or lead-generation wording. It does not get its own homepage section or case study. It is kept distinct from Intelligence: Intelligence is AI inside a product, Digital visibility is how products and organisations are found. The row has the same size and weight as the other three. GEO is spelled out on the first use.

---

## 5. Intelligence

**Purpose.** State TechPi's position on AI: practical, specific, unhyped.

**Headline direction.**
"AI where it creates value. Not where it creates noise."

**Content hierarchy.**
1. Statement (display-l), two lines
2. One paragraph (lead): how TechPi decides where AI belongs in a product
3. Three concrete applications, each a short phrase and one sentence **[to confirm against real delivered work]**, for example: reading and routing documents, answering questions from an organisation's own knowledge, automating repetitive steps in a workflow
4. Text action: "How we use AI"

**Layout concept.** Statement in columns 1 to 10. Below it, paragraph in columns 1 to 5 and the three applications as a simple list in columns 7 to 12 with hairlines between.

**Visual concept.** Ink surface, Paper type, Cyan used only for the link and the arc hairline. No AI imagery of any kind. The restraint is the message.

**Motion behaviour.** Line reveal on the statement, with a slightly longer pause between its two sentences so the second lands as a response to the first. The list fades in as one block.

**Transition to next.** Straight edge to Paper.

**Desktop.** As described.

**Mobile.** Single column: statement, paragraph, list.

**Notes.** If cAIrelink includes AI functionality, link to it here as proof. Claims must match delivered work.

---

## 6. Evolution

**Purpose.** Give continuity to those who know pigiota314 and history to those who do not. Brief.

**Headline direction.**
"pigiota314 is now TechPi."
Support: "Same team and the same clients, with a name that says where we are going."

**Content hierarchy.**
1. Statement (display-m, deliberately one step smaller than other sections)
2. Short paragraph
3. Fact row, three or four figures: years active, projects delivered, countries, people **[all to confirm]**
4. Text action: "About TechPi"

**Layout concept.** Statement and paragraph in columns 1 to 6. Fact row in columns 7 to 12 as label and value pairs with hairlines. Optionally one real team or studio photograph across columns 1 to 12 below **[asset to confirm]**.

**Visual concept.** Paper surface. The old and new marks are not shown side by side. The story is told in words.

**Motion behaviour.** Line reveal on the statement. Facts appear as static text. No counting-up numbers.

**Transition to next.** Arc handoff into the Blue surface of Contact.

**Desktop.** As described.

**Mobile.** Single column. Facts as a two-column list.

**Notes.** If verified figures are not available, the fact row is removed and the section becomes two columns of text.

---

## 7. Contact

**Purpose.** A clear, confident invitation.

**Headline direction.**
"Have something worth building?"
Action: "Start a project"
Secondary: an email address and a phone number as plain links **[to confirm]**.

**Content hierarchy.**
1. Statement (display-xl)
2. Primary button: "Start a project →"
3. Direct contact details (small)

**Layout concept.** The only centred composition on the page. Statement in the middle, button below it, contact details at the foot. The full circle of the symbol sits behind the statement, large, in Sheet at low contrast.

**Visual concept.** TechPi Blue surface, Sheet type. This is the single full-colour moment of the page and the only place the circle is seen whole.

**Motion behaviour.** As the section enters, the arc that has travelled through the page closes into a full circle, scrubbed to scroll. Statement by line reveal. Button fades in last.

**Transition to next.** Straight edge to the Ink footer.

**Desktop.** About one viewport high.

**Mobile.** Statement at display-xl mobile size, button full width, details below. Circle static and cropped.

**Notes.** The button leads to the contact page with a short project form. The form is designed in a later phase.

---

## 8. Footer

**Purpose.** Reference information and trust details.

**Content.** Wordmark. Navigation. Address, email, phone. Legal entity name and registration details **[to confirm]**. Language switch. Privacy and cookie links. "TechPi, formerly pigiota314". Social links as text.

**Layout.** Ink surface, four columns on desktop, stacked on mobile. Small type, hairline above the legal row.

**Motion.** None.

---

## Header behaviour on the homepage

- Items (approved): Work, Capabilities, EU Projects, About, Contact. Contact is the pill. The language switch is beside it.
- Transparent over the hero, with Ink text.
- Becomes a compact bar after the hero. Takes the colours of the surface beneath it (Light, Dark, Blue).
- Hides on scroll down and returns on scroll up.
- The Contact pill is always available.

## Page-level checks

| Check | Requirement |
|---|---|
| Heading order | One h1 (hero). Each section statement is an h2. Case names and capability names are h3 |
| Landmarks | header, nav, main, footer. Each section labelled by its heading |
| Keyboard | Tab order follows reading order through all sections, including pinned ones |
| Without scripts | All content visible and readable in order |
| Reduced motion | Reviewed as its own layout |
| Greek | Every statement set and checked at display size in Greek before approval |
| Content | No placeholder metrics or imagery ships |

## Content needed before the prototype

1. Final logo files in `public/brand/` (the folder is empty as of 2026-10-02). Colour values and arc geometry wait for them.
2. For each case study: confirmed description, business purpose, TechPi's scope, technology, permission to show, interface captures. No outcome metrics are needed or used.
3. Company facts for the Evolution section.
4. Confirmed AI applications TechPi has actually delivered.
5. Contact details and legal entity details.
