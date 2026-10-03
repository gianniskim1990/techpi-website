# TechPi secondary pages: design specification

Status: **Phase 3C design direction approved with revisions** (see section 12). Planning only. No production code.
Date: 2026-10-03
Related: `design-system.md`, `homepage-spec.md`, `../production/content-model.md`, `../production/routes.md`, `../production/implementation-plan.md` (3C)
Visual study (disposable): `explorations/phase-3/secondary-pages/`

All copy below is draft direction in English. Greek is written in Phase 3D, not translated. Anything marked **[to confirm]** is a fact TechPi must supply. Nothing here is an invented number, client, role, programme, year or result.

---

## 0. Position

The homepage tells the story: ARC → CIRCLE → TECHPI, motion, full-screen panels, a Blue ending. The secondary pages do the work. They answer a visitor who already knows what TechPi is and now wants evidence, detail or a way to get in touch.

So the secondary pages are **the same system at a lower voice**:

- Same type, palette, grid, hairlines, pill and text actions. Nothing new is introduced.
- One step down the type scale. The largest secondary heading is display-l, never display-xl.
- No pinning, no viewport-height panels, no Blue sections.
- The arc appears on **one** secondary page (About). The circle appears on none.
- Premium comes from space, scale contrast and real imagery, not from geometry.

The rule throughout: **remove before adding.** Where a section has no confirmed content, it is not shown, and the page is shorter. It is never filled.

---

## 1. Shared secondary-page system

### 1.1 Page anatomy

Every secondary page uses the same five parts, in this order. Only the middle varies.

| # | Part | Surface | Notes |
|---|---|---|---|
| 1 | Header | Paper | The production header, unchanged on desktop (plain Contact link). The current page carries `aria-current` (underlined). The mobile "Menu" link is a temporary fallback, see section 13 |
| 2 | Page head | Paper | See 1.2 |
| 3 | Body sections | Paper, with Ink bands for media | See 1.3 to 1.7 |
| 4 | Closer | Paper | See 1.8 |
| 5 | Footer | Ink | The production footer, unchanged. Hard edge from Paper, no curve |

### 1.2 Page head

```
1440                                                              
┌──────────────────────────────────────────────────────────────────┐
│ TECHPI                  Work  Capabilities  EU Projects  About … │
│                                                                  │
│                                                                  │
│  Work                       ← h1, display-l, cols 1–9            │
│                                                                  │
│                          Lead text, one or two sentences,        │
│                          cols 7–11, Graphite, text-lead          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
   top padding ≈ 200 px      h1 → lead 40 px     lead → body 168 px

390
┌──────────────────────────┐
│ TECHPI       EN ΕΛ  Menu │
│                          │
│ Work          ← display-l│
│                          │
│ Lead text, full width.   │
│                          │
└──────────────────────────┘
   top padding ≈ 128 px   h1 → lead 24 px   lead → body 104 px
```

- The h1 is short: a name ("Work") or one statement ("TechPi is the evolution of pigiota314."). Display-l, weight 450.
- The lead is offset right on desktop (columns 7 to 11). This is the one asymmetric move per page head and it is what keeps a plain page from looking like a template. On mobile it sits under the h1 at full width.
- No metadata label above the h1. No button in the page head. No image in the page head, except the case-study hero (section 3).
- Height is content height. The page head is not a viewport-height hero.

### 1.3 The index section (the main body pattern)

The homepage Capabilities section becomes the default body pattern: **a heading column and a content column.**

```
1440
  cols 1–4                     cols 5–12
  ─────────────────────────────────────────────────────────
  Section heading             Content: reading text (max 640 px),
  (display-m or               ruled lists, fact rows or project rows
   text-lead weight 500)
  ─────────────────────────────────────────────────────────

390
  Section heading
  Content, full width
```

- Sections are separated by 168 px desktop and 104 px mobile, or by a full-width hairline plus that space where two sections are closely related.
- The heading column is never sticky in 3C. Stickiness is a 3E decision.
- Reading text never exceeds 640 px.

### 1.4 Editorial typography on secondary pages

| Role | Token | Use |
|---|---|---|
| Page h1 | display-l | One per page |
| Section h2 | display-m | Index-section headings |
| Item h3 | about 22–28 px, weight 450 (the homepage "pair" size) | Capability names inside a section, principle names |
| Lead | text-lead | The page-head lead and the first paragraph of a section |
| Body | 17 px / 1.5 | Reading text |
| Metadata label | 13 px uppercase, weight 500, +0.07em | Category only. At most once per screen |
| Fact label | 15 px sentence case, weight 500, Slate / Fog | Left side of fact rows |

### 1.5 Fact rows

The one dense element. Used for case-study facts, EU project data and contact details.

- A `dl`. Label left, value right on desktop (label 1/3, value 2/3 of the column). Hairline above each row and below the last.
- Mobile: label above value, still hairline-separated.
- **A row with no confirmed value is not rendered.** Never "TBC", never a dash.
- Maximum six rows per block. If more facts exist, they belong in the text.

### 1.6 Surfaces

| Surface | Secondary-page use |
|---|---|
| Paper | Default for every page, page head and text section |
| Ink | **Media bands only**: the Work index project list, the case-study cover and gallery, the case-study "Next project" band, and the footer. Ink means "look at the work" |
| TechPi Blue | Not used as a surface on secondary pages. Blue appears only as the primary pill, link hover and focus. The Blue surface stays the homepage's ending |
| Cyan | Focus and hover on Ink only, as on the homepage |

### 1.7 Images

- Product captures shown flat on Ink or on a restrained client-colour field (as approved in `design-system.md` section 9). No device mockups, no perspective, no shadows, no frames, radius 0.
- Two widths only: **wide** (columns 1 to 12, inside the margins) and **full bleed**. Plus the Work index image column (columns 1 to 8). No small inline images.
- Aspect ratios: 16:10 desktop, 4:3 mobile, re-cropped per breakpoint rather than scaled. Captures that cannot be cropped (tall phone screens) are shown at their own ratio, centred on the field.
- Captions: 15 px, Fog on Ink, below the image, only when they add information.
- Until imagery exists: the homepage's typographic placeholder (a tinted field with the project name cropped large and faint). Honest and neutral.

### 1.8 Closer and footer handoff

Every secondary page except Contact ends with the same quiet closer on Paper:

```
1440
  ──────────────────────────────────────────────────────── hairline
  Have something worth building?        [ Start a project → ]
  (display-m, cols 1–8)                  (pill, right-aligned, baseline)

390
  ────────────────────────
  Have something worth
  building?
  [   Start a project →   ]  (full width)
```

- Top hairline, 104 px padding top and bottom. Then the Ink footer with a hard edge.
- It repeats the homepage question without the Blue surface or the circle. The homepage ending stays unique.
- The pill links to `/contact`. On the Contact page the closer is omitted.

### 1.9 Links and actions

- The approved arrow rule applies unchanged: "View case study →", "Start a project →", "Next project →", and a diagonal arrow for external links with an accessible name. Nothing else carries an arrow.
- Capability names inside project rows and case studies link to the matching anchor on `/capabilities`. They are plain text links, never pills or tags.

---

## 2. Work index (`/work`)

A project archive, not a portfolio grid. Each project is a large row. The rows are identical in structure so the page reads as a list of evidence, and they scale by repetition.

### 2.1 Structure

1. Page head. h1 "Work". Lead: draft "Products, platforms and systems, each built around a specific business problem." **[copy to approve]**
2. Project list on Ink (a media band, full width), one row per published case study, in `order`.
3. Closer. Footer.

### 2.2 Project row

```
1440 (Ink band)
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────┐                         │
│  │                                     │   HEALTHCARE PLATFORM   │
│  │   image, cols 1–8, 16:10            │   cAIrelink             │
│  │                                     │   ← display-m           │
│  │                                     │   One-sentence summary. │
│  │                                     │   ─────────────────     │
│  │                                     │   Capabilities  Digital │
│  │                                     │     products, Intel…    │
│  │                                     │   Year [only if conf.]  │
│  └─────────────────────────────────────┘   ─────────────────     │
│                                            View case study →     │
│  ────────────────────────────────────────────────────────────── │
│  (next row, 104 px later)                                        │
└──────────────────────────────────────────────────────────────────┘
```

- Image columns 1 to 8, text columns 9 to 12, text bottom-aligned with a lift of about 10vh, matching the approved homepage Selected Work.
- Text order: category (metadata label), name (display-m), summary (text-lead), fact rows (Capabilities always; Client and Year only when confirmed), "View case study →".
- The whole image is also a link to the case study (one link target per row for assistive technology; the image link is `aria-hidden` and `tabindex="-1"`).
- **Not** viewport-height. Rows are content height, about 70vh at 1440 × 900, so the index reads faster than the homepage.
- Rows do not alternate sides. Alternation is an agency trope and makes scanning harder.
- No filters at launch (three projects). See 2.4.

### 2.3 Mobile (390)

```
┌──────────────────────────┐
│ ┌──────────────────────┐ │ image full bleed, 4:3
│ │                      │ │
│ └──────────────────────┘ │
│ HEALTHCARE PLATFORM      │
│ cAIrelink                │
│ One-sentence summary.    │
│ ──────────────────────── │
│ Capabilities             │
│ Digital products, Intel… │
│ ──────────────────────── │
│ View case study →        │
└──────────────────────────┘
  64 px between projects
```

### 2.4 Scaling (design guidance only)

This table records the intended direction as the archive grows. **It is not implementation logic in Phase 3C.** The first build renders every published project as a large row, with no count thresholds, text index or filter. The thresholds are revisited when there are enough real projects to need them.

| Projects | Layout |
|---|---|
| 1 to 8 | Large rows only |
| 9 or more | The most recent or featured eight stay as large rows. The rest follow as a **ruled text index** (name, category, capabilities, year) on Paper, one line each, no images |
| 12 or more | A capability filter (four plain text toggles, no pills) is added above the list. Not before |

---

## 3. Case-study template (`/work/[slug]`)

Substantial for enterprise and EU readers, built from blocks that are each optional except the core. Length follows content.

### 3.1 Block order

| # | Block | Surface | Required | Notes |
|---|---|---|---|---|
| 1 | Project hero | Paper | yes | Back link "Work", category label, h1 project name (display-l), summary (text-lead), fact rows right |
| 2 | Cover image | Ink, full bleed | yes | One image. 16:10 desktop, 4:3 mobile |
| 3 | Overview | Paper, index section | yes | "Overview": what the product is and who it serves. Reading text |
| 4 | Purpose | Paper, index section | yes | "The business problem": why it was needed. Business before technology, as on the homepage |
| 5 | Scope | Paper, index section | yes | "What we did": a ruled list of TechPi's scope (product, design, engineering, operation…) |
| 6 | Capabilities | Paper, inside Scope | yes | Plain text links to the capability anchors |
| 7 | Gallery | Ink band | optional | 1 to 6 images, wide or full bleed, with captions |
| 8 | Technology and implementation | Paper, index section | optional | Short text and/or fact rows. Confirmed technology only |
| 9 | Outcome | Paper, index section | **only when real** | Text only, with the source of each claim. No KPI tiles, no big-number blocks |
| 10 | EU project | Paper, fact rows | only when `eu` data exists | Programme, role, coordinator, period, project site, funding statement and emblem as the grant requires |
| 11 | External link | Paper | optional | "Visit the live product ↗" |
| 12 | Next project | Ink band | yes | See 3.3 |

Minimum publishable case study: blocks 1 to 6 and 12. The placeholder build guard in `content-model.md` already enforces that unconfirmed fields cannot ship.

### 3.2 Project hero

```
1440 (Paper)
  ← Work
  HEALTHCARE PLATFORM
  cAIrelink                                    Client     [if allowed]
  ← display-l, cols 1–7                        Year       [if confirmed]
                                               Sector     Healthcare
  One-sentence summary,                        Capabilities  Digital
  text-lead, cols 1–6                            products, Intelligence
                                               (fact rows, cols 9–12)
┌──────────────────────────────────────────────────────────────────┐
│ cover image, full bleed, Ink                                     │
└──────────────────────────────────────────────────────────────────┘

390
  ← Work
  HEALTHCARE PLATFORM
  cAIrelink
  Summary.
  ─── fact rows, label above value ───
  [ cover image, full bleed 4:3 ]
```

- The h1 is display-l, not display-xl. The project name is the subject, not a brand moment.
- Fact rows in the hero hold only identity facts (client, year, sector, capabilities). Scope and technology live in their own sections, where they can be explained.

### 3.3 Next project

```
Paper section
╭────── the curved Ink edge (the homepage's Selected Work edge, re-cropped) ──────╮
Ink band:
  Next project
  SOWISE+                     ← display-l
  EU-funded digital platform
  Next project →
```

- The **only geometry on a case study**: the curved edge that the homepage uses to bring in Selected Work, reused once to bring in the next project. It does structural work (it is the hand-off into the next piece of work) and it is already part of the system.
- The whole band is one link. Wraps from the last project to the first.
- Mobile: no curved edge (as on the homepage), a straight cut to Ink.
- A hairline separates the Next project band from the Ink footer, so the two Ink surfaces do not merge.

### 3.4 cAIrelink and demo imagery

- `imageryPolicy: demo-only`. Every image uses demo, mock or redacted data, signed off before publication.
- Proposed: one visible line under the cover, "All screens shown use demo data." **[decision]** It is honest, and in healthcare it builds trust rather than weakening the work.

### 3.5 Variable length

Projects will not have equal material. The template handles this by omission:

- Short case study: hero, cover, overview, purpose, scope, next. About four screens.
- Full case study: all blocks. About eight to ten screens.
- No block is ever padded to match another project.

---

## 4. Capabilities (`/capabilities`)

The homepage capability index, opened up: what each capability means, what sits inside it, and and which projects it appears in. Positioned around problems, not deliverables.

### 4.1 Structure

1. Page head. h1 "What we build." (reuses the approved homepage heading). Lead: draft "Four capabilities. Most real problems need more than one." **[copy to approve]**
2. **In-page index**: the four names as plain text anchor links in one row (wraps on mobile). Not numbered, not boxed.
3. Four capability sections, each an index section with the anchor id from `routes.md`:

```
1440
  ──────────────────────────────────────────────────────────────── hairline
  Digital products            Custom web applications, SaaS products and
  ← display-m, cols 1–4       platforms, from first idea to a system that
                              runs every day.            ← text-lead
                              Longer body: what this means in practice,
                              two short paragraphs, max 640 px [copy to write]

                              What it covers       ← fact-label style
                              ─────────────────────────────────────────
                              Product strategy     one line of explanation
                              ─────────────────────────────────────────
                              UX and UI design     one line
                              ─────────────────────────────────────────
                              …

                              Seen in  cAIrelink, Arman's Ethnic Street Food
                              ← plain text links, generated from case-study data
```

4. Closer. Footer.

**Deferred, not part of v1:** a "How they combine" capability table or matrix. It needs enough real, confirmed case studies to say something true, so it is deferred until they exist. For v1 each capability carries only its "Seen in" project links. (The disposable study in `explorations/phase-3/secondary-pages/capabilities.html` still shows an early draft of that table as an illustration. It is not a requirement.)

### 4.2 Rules

- The item lists are the approved homepage lists. Each item gains one explanatory line **[copy to write]**.
- "Seen in" is generated from published case studies only: plain text links to the projects. A capability with no published project shows no "Seen in" line.
- Digital visibility stays last and stays technical: structure, search, GEO, AI visibility, performance and measurement. Never campaigns, ads or lead generation.
- Intelligence keeps the homepage's restraint: capability language, never a claim that each area has been delivered.

### 4.3 Mobile

Heading above content. The in-page index wraps to two lines. "What it covers" rows become label above line.

---

## 5. EU Projects (`/eu-projects`)

For programme officers, coordinators and consortium partners. They want facts quickly: what TechPi builds for EU projects, on which projects, in which role. Credibility comes from precise fact rows, not from institutional styling.

### 5.1 Structure

1. Page head. h1 "EU projects." Lead: **[to confirm]** one sentence on TechPi's EU-funded work. Nothing is drafted here, because any wording makes a claim.
2. **"What we build for EU projects"**: index section with a ruled list of the kinds of work, phrased as capability, not as a record:
   - Project websites
   - Communication and dissemination platforms
   - Digital tools and products built within a project
   Each with one line of description **[copy to write]**. Which of these TechPi has actually delivered is **[to confirm]** and decides which items stay.
3. **Selected projects**: one block per project with `eu` data. Fact-led:

```
1440
  ──────────────────────────────────────────────────────────────── hairline
  SOWISE+                     Programme        [to confirm]
  ← display-m, cols 1–4       Role             [to confirm]
  EU-funded digital platform  Coordinator      [to confirm]
                              Period           [to confirm]
  The digital platform of     Project site     [to confirm] ↗
  an EU-funded project.       ─────────────────────────────
                              View case study →
                              [funding statement and emblem, if required]
```

   Optional small image (columns 1 to 4, 4:3) under the summary, when imagery exists.
4. **"Working in a consortium"**: short reading text on how TechPi works with coordinators and partners **[to confirm, nothing drafted]**. Candidate topics, only if true: deliverable schedules, visibility and funding acknowledgement, accessibility, data protection, handover and maintenance after the project ends.
5. Closer. Footer.

### 5.2 Rules

- No EU blue and yellow styling, no flag banner, no stars motif. The EU emblem appears **only** where a grant requires it, at the required size, next to the project it belongs to, with its funding statement.
- No programme names, funding values, roles, coordinators or outcomes are written until confirmed.
- The page does not duplicate case studies. It links to them.
- The page is unpublished until at least the SOWISE+ facts and the lead are confirmed. The build guard enforces this.

### 5.3 Mobile

Project name and summary first, then fact rows (label above value), then "View case study →".

---

## 6. About (`/about`)

Short and forward-looking. Not a traditional agency About page: no team grid, no timeline, no numbers. An evolution statement and a set of principles is stronger, because the principles are already visible in the homepage and the work.

### 6.1 Structure

1. **Page head with the arc.** h1 "TechPi is the evolution of pigiota314." (approved). Lead "The name changed as the work evolved." (approved). **One cropped arc**, the same 1.25 px Ink line as the homepage hero, wide desktop only (1280px and up, the 12-column grid). Unlike the homepage it does not cross the header: it enters from the right edge below the header and leaves through the bottom of the page head, to the right of the lead. This is the only secondary page that carries the arc, because this is the page about the Pi.
2. **"What stayed, what changed"**: the homepage Brand Statement pair layout (two columns, hairline above each):
   - Stayed: the Pi, the circular mark, the blue family, the client relationships and the people (from `techpi-brand-brief.md` section 8, approved).
   - Changed: a name that reads in any European language, a scope stated as technology and products, a refined visual language (same source).
   - One line on the name: "Pi stays. Tech says where we are going." (approved homepage copy).
3. **"How we work"**: four principles as an index list, headings as approved (**approved final wording; do not restyle**):
   - The business problem first. (supporting line: "We start with how an organisation actually works, and choose technology after that.")
   - AI where it creates value. Not where it creates noise.
   - Built to run every day.
   - Technology built around real business needs.
   Only the first carries supporting copy. No principle on European or international work, and none about imagery or results, is published.
4. **Facts**, fact rows, **only if supplied**: founded, based in, languages, legal entity. If none are supplied, the section is omitted.
5. Closer. Footer.

### 6.2 Not included

Founder biography, team section, office photography, "our journey" timeline, client logo wall, company statistics. Any of these can be added later if real material is supplied, using the existing index-section pattern.

### 6.3 Mobile

**No arc on mobile.** The study showed there is no position clear of the collapsed header, the h1 and the lead at 390 px, so it is removed rather than squeezed. The pair becomes one column.

---

## 7. Contact (`/contact`)

Calmer than the homepage ending: Paper, not Blue, and no circle. A page to act on, not a moment.

### 7.1 Structure

```
1440 (Paper)
  Have something                              ← h1 display-l, cols 1–8
  worth building?
                          Tell us about the problem you need to solve.
                          ← lead, cols 7–11 [copy to approve]

  ──────────────────────────────────────────────────────────────── hairline
  Start a project         [enquiry form, Phase 3C build]
  ← display-m, cols 1–4   Fields: name, organisation, email,
                          what you need to solve (long text),
                          timeframe (optional) [decision]
                          [ Send enquiry ]  ← the pill

  ──────────────────────────────────────────────────────────────── hairline
  Direct                  Email      [to confirm]
                          Phone      [to confirm]
                          Location   Greece and Europe
                          Languages  English, Ελληνικά
```

- No closer (the page is the closer). Footer follows.
- The form is not designed as a card: fields sit directly on Paper, 1 px Slate underline or outline per `design-system.md` section 7, 2 px Blue on focus, labels above fields, radius 2 px.
- Until the form exists, the "Start a project" section shows only the direct contact methods, and the page waits for a confirmed email before publishing.
- Location shows only what is intentionally public. "Greece and Europe" is already approved on the homepage. A street address appears only if TechPi wants it public.
- Languages row: only if TechPi confirms it handles enquiries in both.

### 7.2 Mobile

h1, lead, then form fields at full width, the pill full width, then direct contact as label-above-value rows. Email and phone are tap targets of at least 44 px.

---

## 8. The Constant on secondary pages

| Element | Homepage | Secondary pages |
|---|---|---|
| Hairline arc | Hero | **About page head only**, once, desktop only, never crossing the header |
| Curved Ink edge | Into Selected Work | **Case study "Next project" only**, once per case study, desktop only |
| Full circle | Contact, resolving into the symbol | **Never** |
| TechPi symbol | Contact, once the vector master exists | **Never**. The header stays typographic |
| Arc in imagery, masks, bullets, dividers, backgrounds | No | **Never** |

Most secondary-page sections have no geometry at all. If a later page seems to need the arc, the default answer is no.

---

## 9. Desktop and mobile principles

1. **One column on mobile, composed for reading**, not a stacked desktop. The desktop asymmetry (offset lead, heading column) becomes a vertical rhythm: heading, then a 24 px gap, then content.
2. **Images go full bleed on mobile** in media bands; text keeps the 20 px margin.
3. **Fact rows switch to label above value** below 768 px.
4. **Section spacing 104 px** on mobile (168 px desktop), page head top padding about 128 px.
5. **The header collapses at 900 px** as it already does in production.
6. **Order never changes** between breakpoints.
7. **No horizontal overflow** at 320 px and at 200% zoom. Greek text 25% longer must fit.
8. Arcs and curved edges are re-cropped by hand per breakpoint, or removed, never scaled.

---

## 10. Content inputs

### 10.1 Confirmed (usable now)

| Item | Source |
|---|---|
| Project names and categories: cAIrelink, Healthcare platform; Arman's Ethnic Street Food, Direct ordering platform; SOWISE+, EU-funded digital platform | Approved homepage |
| One-sentence summaries for the three projects, as on the homepage | Approved homepage |
| The four capabilities, their homepage summaries and item lists | Approved homepage |
| The five Intelligence areas | Approved homepage |
| "TechPi is the evolution of pigiota314." / "The name changed as the work evolved." / "Pi stays. Tech says where we are going…" | Approved homepage |
| What was kept and what changed in the rebrand | `techpi-brand-brief.md` section 8 |
| "Greece and Europe" | Approved homepage contact |
| Case-study slugs: `cairelink`, `armans`, `sowise-plus` | `routes.md` |
| cAIrelink imagery is demo-only | `content-model.md` |

### 10.2 To confirm

**Per case study (cAIrelink, Arman's, SOWISE+)**

- Permission to name and show the project publicly, and to name the client
- Overview: what the product is, who uses it
- Purpose: the business problem
- Scope: what TechPi did
- Capabilities per project (the homepage values are themselves marked "to confirm" in the prototype)
- Technology (only what may be stated publicly)
- Year or period
- Imagery: the captures, who supplies them, who signs off demo-only images for cAIrelink
- Public URL of the live product, if any
- Outcomes: only if real, with a source and client approval
- Greek text (Phase 3D)

**SOWISE+ EU data**

- Programme, official project title, acronym, grant number
- TechPi's role in the consortium, coordinator
- Period
- Official project site
- Funding statement and whether the emblem must be displayed on TechPi's site (to be confirmed with the coordinator)

**Company**

- Email and phone for the Contact page and footer
- Location to publish (city, or "Greece and Europe" only)
- Whether enquiries are handled in English and Greek
- Legal entity name, registered address, registration and VAT numbers (footer, Privacy page)
- Founding year, only if it is to be stated
- Whether there are other EU-funded projects that may be listed
- The EU Projects lead sentence and the "Working in a consortium" content
- Optional About principle on European and international work

**Copy to approve** (drafted in this spec): Work lead, Capabilities lead, Contact lead, capability item explanations and longer body text (to be written).

### 10.3 Not needed

Team size, number of delivered projects, countries served, client logos, testimonials, performance metrics, awards, founder biography, office photography, a company timeline, social media follower numbers. None is required for these pages. Any can be added later if supplied.

---

## 11. Self-critique

| Question | Assessment | Action taken |
|---|---|---|
| Do secondary pages still feel premium? | Yes, if the imagery is real and large and the space is kept. The risk is the period before imagery exists, when the Work index and case studies rely on typographic placeholders | Keep the placeholders large and deliberate. Do not publish a case study without its cover image |
| Are they too plain compared with the homepage? | They are deliberately plainer. The offset lead, the Ink media bands and the next-project edge give each page one considered moment | Accepted. Nothing further added |
| Are they imitating the homepage? | An earlier draft gave every page head an arc and the Contact page a circle. That would have made the homepage ending ordinary | Removed. Arc on About only, circle nowhere |
| Is the geometry overused? | Two uses across six templates, each structural | Accepted |
| Does Work read as case-study evidence rather than an agency portfolio? | Large identical rows, no grid, no alternation, scope not results, plain-text capabilities | Accepted. Filters deferred until there are twelve projects |
| Is EU Projects credible without looking like an EU template? | Credibility rests on fact rows and links to case studies. No EU colours or flag styling | The page stays unpublished until the facts exist, rather than going live vague |
| Does About avoid agency language? | It uses only approved statements and principles already shown in the work. No "passionate team", no journey | Principles limited to four, the fifth only if confirmed |
| Is Contact simple enough? | h1, one lead, form, direct details. No process diagram, no FAQ, no map | A "what happens next" block was considered and removed: it would describe a process nobody has confirmed |

---

## 12. Approved decisions and revisions

Approved after review of the Phase 3C design pass:

1. **Arc only on About, desktop only.** Curved edge only on the case-study "Next project" band. No circle or symbol on any secondary page.
2. **No Blue full sections on secondary pages.** A quiet Paper closer with the homepage question on every page except Contact.
3. **Ink only where proposed:** the Work index list, case-study cover, gallery and Next project band, and the footer.
4. **Work index direction** as specified in section 2: large non-alternating rows. The 8 / 9 / 12-project scaling idea stays as **design guidance only**, not implementation logic in Phase 3C (section 2.4).
5. **Case-study structure** and the minimum publishable set (section 3).
6. **cAIrelink demo-data disclosure** under the cover image ("All screens shown use demo data.").
7. **Capabilities, revised:** the "How they combine" table is **removed from v1** and deferred until there are enough real case studies. For v1 each capability uses "Seen in" project links only (section 4).
8. **EU Projects stays unpublished** until its facts are confirmed (section 5).
9. **About direction:** evolution plus principles, no team, timeline or statistics (section 6).
10. **Contact form fields:** name, organisation, email, what you need to solve, optional timeframe. **No budget field.**
11. **Header:** desktop keeps the approved plain Contact link. The mobile "Menu" link is a temporary fallback. The final mobile navigation is a production requirement (section 13). The full-screen panel and Contact pill in `design-system.md` section 13 are superseded by this.

Still open: the draft lead copy for Work, Capabilities and Contact, and all content inputs in section 10.

---

## 13. Production requirement: mobile navigation

The current mobile "Menu" link, which jumps to the footer navigation, is a **temporary Phase 3B fallback and not the final navigation.** It is documented here as a requirement. **It is not designed or implemented in this step.**

The final production system uses an accessible mobile navigation overlay or drawer with these requirements:

- A semantic `<button>` opens it, with `aria-expanded` and `aria-controls`, and an accessible name.
- Fully keyboard accessible: logical tab order, and visible focus using the existing surface-aware focus colours.
- Focus management: focus moves into the menu on open and returns to the button on close. Focus does not escape the open menu.
- Escape closes it. A visible close button also does.
- Body scroll is handled while open and restored on close, without layout shift.
- No dependency on heavy JavaScript: a small script or progressive enhancement. The links must remain reachable if the script fails (the footer navigation is the fallback).
- Visually consistent with the Paper / Ink system: same type, hairlines and focus rules. No new colours or effects.
- No unnecessary animation. Reduced motion respected.
- Contains the same five items in the same order as the desktop header, plus the language switch.

Scheduling (3C build or 3E) is a separate decision.
