# TechPi website design brief

Status: approved with revisions (Phase 1 review). Design only. Section 12 records the decisions.
Date: 2026-10-02 (revised after approval)
Related: `docs/brand/techpi-brand-brief.md`, `docs/design/design-system.md`, `docs/design/motion-system.md`, `docs/design/homepage-spec.md`

## 1. Creative direction: The Constant

Pi is a constant. It describes every circle, at every size. The site takes that literally.

**One circle, far larger than the screen, sits behind the whole homepage.** The visitor only ever sees a shallow arc of it: as a hairline crossing the hero, as the curved edge of a dark section arriving, as the mask that uncovers a case-study image. The circle is never shown whole until the final section, where the symbol resolves next to the call to action.

Everything else is quiet. Large sans-serif type on a light page, deep blue-black and blue sections for weight, real product imagery, long margins.

The direction in one line: **an editorial technology site with one architectural gesture.**

Why this direction:

- It comes from TechPi's own mark, so it cannot belong to anyone else.
- It gives the motion system a reason. Every large transition is the same circle moving.
- It is restrained. One device, used three or four times, is easier to do well than ten effects.
- It works without motion. A static arc is still a strong composition.

### Three rules that define the direction

1. **The arc is structure.** It is always a segment of a very large circle (radius greater than the viewport width). No small circles, no rings, no orbiting dots, no spinning logo.
2. **The arc appears at most once per section,** and in no more than four sections of the homepage. This is a ceiling. Phase 2 tests fewer, and any use that does not clearly earn its place is removed.
3. **Everything that is not the arc is straight.** Rectangular images, square corners on large surfaces, straight rules. The curve reads because nothing else curves.
4. **The whole circle is rare.** It is revealed fully once, near the end of the experience, in the contact section. Everywhere before that it is a segment. If it appears repeatedly it becomes decoration, and that breaks the direction.
5. **The real logo decides the geometry.** Curvature, line weight and the angle of the opening are derived from the actual TechPi symbol, not drawn independently. Nothing about the arc is final until the logo files in `public/brand/` have been inspected.

## 2. Alternatives considered

Only one major decision needed a comparison: how the typography carries the editorial tone. **Status after review:** the approval did not choose between A and B. Phase 2 proceeds on A (sans only). The typeface itself is open, with three candidates under comparison. See `design-system.md`, section 2.

| | A. Sans only (recommended) | B. Sans with a serif reading voice |
|---|---|---|
| Idea | One sans family in a wide weight and width range does everything | Sans for display and UI. A serif for long statements and case-study prose |
| Feels | Technical, architectural, current | Warmer, more magazine-like |
| Greek | One family to verify and license | Two families that must both have excellent Greek |
| Risk | Can feel cold if spacing is mean | Serif on off-white is the most common generated "editorial" look |
| Fit | Strong for "technology-led" | Strong for "editorial", weaker for "technology" |

Working assumption: A. The editorial quality comes from scale, pacing and whitespace.

## 3. UX goals

1. A decision-maker understands what TechPi is within the first screen, without scrolling.
2. Within three scrolls, they see real work of a comparable size to their own project.
3. An institutional partner finds EU project experience in one click from any page (EU Projects in the navigation).
4. Contact is reachable from every screen in one action.
5. The site works fully with keyboard, with a screen reader, with motion reduced, and with JavaScript failing.
6. Greek and English are equal. Switching language keeps the visitor on the same page.

## 4. Site structure (information architecture)

Approved top-level structure. Only the homepage is designed in this phase.

```
techpi.eu/                  Home (English)
├── work/                   Selected work (index)
│   └── work/[project]/     Case study
├── capabilities/           Digital products · Web experiences · Intelligence · Digital visibility
├── eu-projects/            Funded project experience, roles, partner information
├── about/                  Company, people, the move from pigiota314
└── contact/                Start a project

techpi.eu/el/…              Greek mirror of every page
```

Slugs shown are working names. Whether Greek pages use English slugs or Greek ones is open (see 4.3).

### 4.1 Navigation (approved)

**Work · Capabilities · EU Projects · About · Contact**

Minimal on purpose. Five items, no sub-menus, no mega-menu.

- Contact is presented as the action pill, the other four as text links.
- The language switch is utility text beside the pill. It is not a navigation item.
- "EU Projects" appears as "EU projects" wherever the site is in sentence case, and as "EU PROJECTS" if the header is set in uppercase. See design system, section 13.

Reasoning:

- Grouped by what visitors come to decide, not by TechPi's internal teams.
- EU Projects is a top-level item because institutional partners are a distinct audience with distinct questions (role in consortium, past programmes, entity details). Hiding it inside Work would make them hunt.
- Intelligence is a capability, not a top-level item. Giving AI its own navigation slot would position TechPi as an AI company.
- Nouns, two words at most.

### 4.2 Capabilities (approved revision)

Four capabilities. "Growth" is replaced by **Digital Visibility**.

| Capability | Scope |
|---|---|
| Digital products | Custom web applications, SaaS products, platforms |
| Web experiences | Corporate websites, e-commerce |
| Intelligence | Practical AI and automation inside real workflows |
| Digital visibility | SEO, GEO, AI visibility, search strategy and relevant digital performance work |

Boundaries, so that Digital Visibility does not turn TechPi into a marketing agency:

1. It stays last in order and is never the lead of a homepage section.
2. It is described as part of how a product is found and understood, in terms of structure, performance and measurement. It is not described as campaigns, awareness, social media or lead generation.
3. It is kept distinct from Intelligence. Intelligence is AI inside a product. Digital visibility is how products and organisations are found by search engines and AI systems.
4. The homepage shows no Digital Visibility case study.
5. GEO and AI visibility are spelled out on first use ("generative engine optimisation"), since not every visitor knows the terms.

### 4.3 Language architecture (documented only, not implemented)

| Item | Decision |
|---|---|
| English | `techpi.eu/` |
| Greek | `techpi.eu/el/` |
| Language identifiers | `en` and `el`, used for the `lang` attribute, `hreflang` and metadata. `gr` is a country code and is not used as a language identifier |
| hreflang | Every page declares `en`, `el` and `x-default`, reciprocally. `x-default` points to the English page |
| Canonical | Each language version is its own canonical. Pages are not canonicalised across languages |
| Switching | The language switch always goes to the same page in the other language, never to the homepage |
| Automatic redirection | None based on browser language. A visitor may be offered a suggestion, never forced |
| Locale metadata | Open Graph locale set per language (for example `en_GB` and `el_GR`, to be confirmed) |
| Greek domain | `techpi.gr` may eventually redirect to `techpi.eu/el/`, ideally keeping the path. Nothing is configured now |
| Existing pigiota314 sites | Not touched. No redirects, migrations or DNS changes are part of this work |
| Greek page slugs | **Open decision.** English slugs under `/el/` (simpler to maintain) or Greek-language slugs (more natural for Greek visitors and search) |
| Greek copy | Written, not machine-translated. Reviewed by a native speaker before launch **[to confirm who]** |
| Fonts | Subset per language so English pages do not load Greek glyphs |

## 5. Visual hierarchy

Three levels, with large steps between them.

| Level | Role | Treatment |
|---|---|---|
| 1. Statement | The one thing this screen says | Display type, very large, tight leading, ink or paper colour |
| 2. Support | The sentence that makes the statement credible | Text at a comfortable reading size, limited to about 60 characters per line |
| 3. Reference | Labels, facts, links, navigation | Small, medium weight, secondary colour |

Rules:

- One level-1 element per viewport.
- Colour is not used for hierarchy within text. Size, weight and position do that work.
- Blue marks interaction and brand surfaces. It is not used to highlight single words in headlines.
- Left-aligned throughout. Centred text only in the final contact section.

## 6. Homepage narrative

Seven sections, one argument:

| # | Section | What the visitor concludes |
|---|---|---|
| 1 | Hero | "They design and build digital products." |
| 2 | Statement | "They start from the business, not the technology." |
| 3 | Selected work | "They have done this, at a serious level, for organisations like mine." |
| 4 | Capabilities | "They cover the whole job." |
| 5 | Intelligence | "They use AI with judgement." |
| 6 | Evolution | "They have history. This is pigiota314, grown up." |
| 7 | Contact | "I should talk to them." |

Rhythm of surfaces: light, light, **dark**, light, **dark**, light, **blue**. Details in `homepage-spec.md`.

## 7. Desktop and mobile philosophy

**Desktop is the cinematic version.** Two pinned sequences, arc handoffs between surfaces, masked line reveals, large imagery.

**Mobile is the reading version.** Same content and order, same typography and colour, no pinning, static arcs, simple reveals. It should feel like a well-set article, not a reduced desktop site.

Shared rules:

- Content parity. Nothing is desktop-only.
- No information depends on hover.
- Touch targets at least 44 by 44 px.
- Designed at 360, 768, 1280 and 1600 px wide. Tested at 320 px and at 200% zoom.

## 8. Proposed emotional experience

| Moment | Feeling |
|---|---|
| Arrival | Calm and clarity. "This is a serious company." |
| First scroll | Small surprise as the arc moves. "This is considered." |
| Work | Respect. "This is real, and larger than I expected." |
| Capabilities and AI | Reassurance. "They are sensible about technology." |
| Evolution | Familiarity, for those who knew pigiota314 |
| Contact | Invitation, without pressure |

The site should feel slower and quieter than competitors, and more certain.

## 9. Design constraints

- **Bilingual, Greek first-class.** Typefaces need complete, well-drawn modern monotonic Greek, including accented capitals and the combined tonos and dialytika forms. Claimed Greek support is not accepted until it has been tested glyph by glyph (see `design-system.md`, section 2). Greek copy runs roughly 15 to 25% longer than English and has longer words, so all display sizes are checked in Greek.
- **Accessibility:** WCAG 2.2 AA as the baseline. This also matches expectations under the European Accessibility Act and those of public and institutional clients.
- **Motion:** full reduced-motion alternative. No motion plays on its own in a loop.
- **Performance:** defined in the motion system. The hero text is the largest element on first paint and must render without waiting for scripts.
- **Content honesty:** no invented metrics, no fake dashboards, no stock "technology" imagery. If a real asset does not exist, the layout uses type.
- **Legal:** GDPR-compliant consent, no third-party trackers loaded before consent, fonts self-hosted.
- **Scope of this phase:** documentation only. No framework, components or production code.

## 10. Self-critique

Reviewed against Nielsen's heuristics, the Laws of UX, WCAG 2.2 AA and a check for generated-site defaults.

### Does it risk looking like a generic AI-generated website?

Yes, in specific places, and the brief's own preferences are part of the risk.

| Risk | Where it comes from | Mitigation in this proposal |
|---|---|---|
| Off-white page, near-black text, hairline rules, big type | The brief's palette, and the commonest generated "editorial" look | No serif display. Ink is a blue-black derived from the brand hue, not a neutral near-black. Paper is a grey-leaning off-white, not cream. The arc gives the page an element no template has |
| Uppercase labels over every heading | Approved selective uppercase (small labels, metadata, navigation, occasional emphasis) | Uppercase appears only where it carries information: a case study's sector, a year, the header navigation. It is never an eyebrow above every heading, never in headlines or buttons, and at most one emphasis use per screen. In Greek, capitals drop accents, so Greek uppercase is tested in the specimen and set with `lang="el"` |
| Arrow appended to every link | The brief's "Start a project →" | Approved rule: arrows only on primary actions and where they communicate direction (case-study entry, next and previous controls, links that leave the site). Never on in-text links, navigation or section-closing text actions. See design system, section 10 |
| The circle repeated until it is wallpaper | Success of the idea. A device that works gets reused | Rarity rule: segment only until the contact section, whole circle once, every use must pass the three checks in the motion system. Phase 2 tests fewer arc moments than the ceiling of four |
| A "Digital Visibility" section reading as an agency service list | The approved fourth capability | It stays last, is described in technical terms, never leads a section and has no homepage case study. See section 4.2 |
| Numbered sections (01, 02, 03) | Habit | Not used. The homepage sections are not a sequence the reader needs to count. The work sequence shows "1 of 3" because that is real status |
| Fade-and-rise on every block | Habit | One reveal type for text, one for case imagery, arc handoffs at three points. Everything else is static |
| Four capability cards | Habit | A typographic index with a sticky heading. No cards. The four are Digital products, Web experiences, Intelligence and Digital visibility |

### Other weaknesses found

1. **The arc could become decoration.** It is controlled by the three rules in section 1. If a use cannot be described as "this shows that the next section is arriving" or similar, it is removed.
2. **The direction depends on the final logo.** The logo files have not been supplied. The arc's radius, stroke and behaviour must be derived from the real symbol. Until then the geometry is a placeholder.
3. **The work section depends on real assets.** Three full-height case panels need high-quality interface captures and confirmed descriptions of scope, technology and purpose. No performance metrics or business results are used. If they are not supplied and confirmed, none appear, and the panels lean on scope, complexity and product thinking. Without good captures the section falls back to type-led panels, which is acceptable but weaker.
4. **Storytelling pace versus impatient evaluators.** Mitigated by a short hero pin, persistent navigation, and facts placed in predictable positions.
5. **Curved clip edges and text.** Text must never sit under a moving curved edge. Handoffs happen over empty margin space, and text reveals start after the edge has passed.
6. **Sans-only could feel cold.** Mitigated by a warm-leaning paper, generous leading in body text, and human photography on the About and case-study pages.
7. **Minimalism can hide information.** Capabilities and EU Projects must carry real detail one click down. The homepage is allowed to be sparse because the inner pages are not.

### Accessibility check of the direction

| Area | Finding |
|---|---|
| Contrast | All provisional text pairs pass AA. Cyan is unusable on light surfaces (1.7:1) and brand blue is unusable as text on ink (2.8:1). Both restrictions are written into the design system. All ratios are recalculated once the real logo colours are known |
| Pinned sections | Content stays in normal document order and is reachable by keyboard. Pins never capture or alter scroll input |
| Line reveals | Text is split visually only. The accessible text remains a single readable string |
| Motion | No autoplaying or looping motion, so there is nothing to pause. Reduced-motion users get a static page with simple fades or none |
| Focus | Visible focus on every interactive element, on all three surface colours |
| Zoom and reflow | Display type uses fluid sizes with a floor, wraps freely and is never clipped. Checked at 320 px and 200% zoom |
| Language | `lang` set per page and on inline language-switch labels |
| Hover | No content revealed by hover only |

## 11. Skills used

| Skill | How it was used |
|---|---|
| frontend-design | Direction, palette and type reasoning, and the check against generated-site defaults |
| information-architect | Site structure, navigation labels and grouping rationale |
| content-copy-designer | Tone of voice, headline directions, action labels |
| design-critique | Self-critique framework (heuristics, Laws of UX) |
| accessibility-auditor | WCAG criteria applied to the proposal, contrast checks |
| design-pipeline | Read for its sequence. Not run, because it requires interactive research stages and produces HTML prototypes, which are out of scope for this phase |

Not used in this phase: wireframe-agent and page-designer (layout concepts are described in text and simple diagrams, visual wireframes belong to the next phase), ux-heuristics (covered by design-critique here, more useful once there is a prototype to evaluate), product-designer (aimed at data-management software).

Revision pass: frontend-design (re-checking the uppercase and arrow decisions against generated-site defaults), information-architect (navigation and capability grouping), content-copy-designer (Digital Visibility copy and guardrails), accessibility-auditor (Greek uppercase, contrast recomputation rules). Planned for Phase 2: wireframe-agent, page-designer, design-critique, ux-heuristics, accessibility-auditor.

## 12. Approved decisions (Phase 1 review, 2026-10-02)

| # | Topic | Decision |
|---|---|---|
| 1 | Creative direction | "The Constant" approved. The arc is the signature device, used sparingly. The whole circle stays rare and is revealed fully only near the end |
| 2 | Case | Sentence case is the main language. Uppercase only for small labels, metadata, navigation where appropriate and occasional emphasis. No all-uppercase site |
| 3 | Arrows | Limited to primary actions and places where they communicate direction |
| 4 | Typography | Not final. A comparison of at most three directions, with Greek and Latin support verified, licensing documented and display and UI performance assessed. PF Grand Gothik is one candidate |
| 5 | Colour | Palette philosophy approved. Exact blue and cyan wait for the real logo in `public/brand/` |
| 6 | Navigation | Work, Capabilities, EU Projects, About, Contact. Minimal |
| 7 | Capabilities | Digital Products, Web Experiences, Intelligence, Digital Visibility (replaces Growth). Must not reposition TechPi as a marketing agency |
| 8 | Language architecture | `techpi.eu/` English, `techpi.eu/el/` Greek. Identifiers `en` and `el`. `techpi.gr` may later redirect to the Greek site. Documented only |
| 9 | Case studies | cAIrelink (Healthcare platform), Arman's Ethnic Street Food (Direct ordering platform), SOWISE+ (EU-funded digital platform). No invented metrics or results. Communicate scope, complexity, product thinking, technology, design and business purpose |
| 10 | Company facts | Unconfirmed facts stay marked **[to confirm]**. Nothing is invented |

## 13. Still open

- Typeface (three candidates, see design system).
- Exact blue and cyan, and the arc geometry (waiting for the logo).
- Header navigation in uppercase or sentence case (tested in Phase 2).
- Greek page slugs: English or Greek-language.
- Greek copy author and reviewer.
- Whether serif pairing (alternative B) is formally dropped.
- Real case-study captures, confirmed descriptions, permissions and company facts.
