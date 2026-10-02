# TechPi design system: initial proposal

Status: updated after the Phase 1 review. The palette philosophy is approved. **Exact colour values and the typeface are not final.** Values below are provisional starting points.
Date: 2026-10-02 (revised after approval)

## 1. Colour roles

**Provisional values.** The approved philosophy is blue-black ink, warm off-white paper, neutral greys, TechPi blue and restrained cyan. The exact blue and cyan will not be finalised until the real logo files are inspected. As of 2026-10-02 the folder `public/brand/` is empty, so nothing has been inspected yet.

When the logo arrives, the values are fixed in this order:

1. Read the blue and cyan directly from the vector logo files (SVG preferred). The real logo is the source of truth.
2. Tune Ink and Paper to sit with the logo's hue.
3. If the logo blue does not reach 4.5:1 on Paper, keep it as the identity colour (logo, large surfaces) and define a darker interactive blue for links, buttons and focus rings.
4. Check the dark and white logo versions on Ink, Paper and Blue, and the symbol alone at favicon size.
5. Recompute every contrast pair below and replace this table.

| Name | Hex (provisional) | Role |
|---|---|---|
| Ink | `#0A1420` | Primary text on light. Background of dark sections. A blue-black taken from the brand hue |
| Paper | `#EFEEEA` | Default page background. Off-white, leaning grey rather than cream |
| Sheet | `#FAFAF8` | Raised or alternate light surface, form fields |
| Graphite | `#3A424C` | Secondary text on light |
| Slate | `#5F6871` | Tertiary text and labels on light. Borders of form controls |
| Rule | `#D3D2CC` | Decorative hairlines on light only |
| Fog | `#9AA4AE` | Secondary text on Ink |
| TechPi Blue | `#1B4DDB` | Brand surface, links, primary action, focus on light |
| Blue Deep | `#0C2466` | Optional deeper brand surface |
| Cyan | `#2CC8E8` | Emphasis on dark surfaces only: links, focus, the arc |

### Surfaces

Three surface modes. Every component is specified on all three.

| Surface | Background | Text | Secondary text | Link and focus | Arc |
|---|---|---|---|---|---|
| Light | Paper | Ink | Graphite, Slate | TechPi Blue | Ink at low opacity, or Blue |
| Dark | Ink | Paper | Fog | Cyan | Cyan |
| Blue | TechPi Blue | Sheet | Sheet | Sheet, underlined | Sheet |

### Contrast of the provisional values (WCAG 2.x ratio)

Calculated for the provisional hex values only. To be recalculated from the real logo colours.

| Pair | Ratio | Result |
|---|---|---|
| Ink on Paper | 15.95 | AAA |
| Graphite on Paper | 8.77 | AAA |
| Slate on Paper | 4.88 | AA |
| TechPi Blue on Paper | 5.78 | AA |
| Paper on Ink | 15.95 | AAA |
| Fog on Ink | 7.32 | AAA |
| Cyan on Ink | 9.29 | AAA |
| Sheet on TechPi Blue | 6.42 | AA |
| Paper on TechPi Blue | 5.78 | AA |
| Cyan on TechPi Blue | 3.36 | Large text and graphics only |
| Cyan on Paper | 1.72 | **Fail. Never used** |
| TechPi Blue on Ink | 2.76 | **Fail as text. Never used** |
| Rule on Paper | 1.31 | Decorative only. Not for control borders |

Rules that follow:

- Cyan never appears on a light surface.
- On dark surfaces, links and focus are cyan, never blue.
- Anything a user must perceive to operate (input borders, icons with meaning) uses Slate or stronger.
- Proportion on a typical page: about 70% Paper and Sheet, 20% Ink, 8% Blue, 2% Cyan.

## 2. Typography direction

**Status: not finalised. No typeface is recommended yet.** Three directions go forward to a visual comparison in Phase 2 (`phase-2-proposal.md`). The comparison is limited to three on purpose.

The sans-only approach from the Phase 1 brief remains the working assumption. The serif pairing (alternative B) is not carried into Phase 2 unless you ask for it.

### Requirements

- Complete modern Greek (monotonic), drawn with the same care as the Latin, including accented capitals and the combined accent and dieresis forms.
- Latin coverage for English and the other European languages TechPi may serve.
- A wide weight range, ideally variable, so one family covers label, text and display.
- Strong at very large display sizes with tight leading, and clear at 14 to 18 px for interface and body text.
- A licence that covers self-hosting on `techpi.eu` (and any future use on `techpi.gr`).
- Not chosen because it is common in SaaS websites.

### What was verified (2026-10-02)

Sources: the foundries' own product pages and, for Commissioner, the project repository. A third-party aggregator site claimed Commissioner is a paid font not available on Google Fonts. That contradicts Google Fonts, Adobe Fonts and the repository, so it was not relied on.

| | PF Grand Gothik Variable | Greta Sans | Commissioner |
|---|---|---|---|
| Designer and foundry | Panos Vassiliou, Parachute Type Foundry. Published 2018 | Peter Biľak with Nikola Djurek, Typotheque | Kostas Bartsokas. Developed with financial support from Google |
| Character (as described by the maker) | Postmodern multi-width grotesque drawing on late 19th and early 20th century grotesques. Three stylistic alternates | A humanist sans, "for online and offline publishing" | Low-contrast humanist sans with almost classical proportions. Three "voices": straight grotesque, flared, wedge-serifed |
| Latin | Yes | Yes | Yes (Latin Plus and Latin Pro sets) |
| Greek, as stated | Yes. Listed under supported scripts (Windows code page 1253) and supported languages | Yes. Greek was designed by Peter Biľak and added in 2015, after the original Latin system | Yes. "Greek Core" set, monotonic modern Greek |
| Greek, glyph-level quality | **Not verified** | **Not verified** | **Not verified** |
| Variable | Yes. Web variable woff2 | Yes. "Greta Sans Variable" is offered | Yes. Axes: weight 100 to 900, slant 0 to −12, flare 0 to 100, volume 0 to 100 |
| Range | 5 widths (Compressed, Condensed, normal, Wide, Extended) across weights from XThin to Black, with italics. Extended goes to UBlack | 10 weights across 4 widths (Compressed, Condensed, normal, Extended), with italics. The foundry's 2015 announcement counted 80 styles and 148 languages | 9 named weights, with italics, plus flare and volume axes |
| OpenType features seen | Lining, oldstyle, tabular and proportional figures. Case-sensitive forms. Localised forms. Stylistic sets 1 to 3 | Numeral variants selectable at licensing. Details not confirmed | Tabular figures (since v1.012). A Greek OpenType feature fix is noted in v1.012 |
| Licence model | Commercial. Web licence is a self-hosting licence for one domain and its subdomains, priced by pageview tier. Separate licences for desktop, app and digital ad. 50% off each additional licence type | Commercial. **Terms could not be retrieved from the product page** | SIL Open Font License 1.1. Free for commercial use, self-hosting and embedding. Check `OFL.txt` for reserved font name rules before subsetting |
| Cost indication | The shop showed €1,750 for the entire variable family before a licence type was selected. That is not a confirmed web price | Quote needed | None |
| Test access | Free trial fonts exist but contain only Latin A to Z, a to z, digits, comma and full stop. **No Greek can be tested from the trial.** Ask the foundry for a Greek-capable test file | Not confirmed. Ask Typotheque | Downloadable now from Google Fonts or GitHub |

Corrections to Phase 1: it described PF Grand Gothik as "a Greek foundry in Athens" with Greek "native, not an add-on", and described Greta Sans as a safe, systematic option with strong Greek. None of that was verified at the time. The product page lists Greek support but does not say where the foundry is based or how the Greek was developed, and Greta Sans's Greek is documented as a 2015 extension. Both statements are withdrawn until tested.

### Three directions

**Direction 1: PF Grand Gothik.** The most distinctive of the three. The width axis from Compressed to Extended could give a tall, tight display voice for statements and a wide voice for rare emphasis, both from one family. Extended widths could echo the circular geometry. Risks: it leans historical, which may read as retro rather than technology-led. Its text performance at 14 to 18 px is unknown. It carries the heaviest licence process and cost, and a web licence covers one domain, so the position of `techpi.gr` must be clarified with the foundry.

**Direction 2: Greta Sans.** The most editorial and the most European in tone. A humanist sans with a long record in publishing, which suits the long-form case-study pages as well as headlines. The Compressed and Condensed widths give a display voice. Risks: humanist warmth may feel less technology-led. Greek was added later, so its fit with the Latin must be checked closely. Licence terms and cost are unknown.

**Direction 3: Commissioner.** The only one that can be tested immediately and the lowest-risk to adopt. It is free and self-hostable, and was drawn by a Greek designer. The flare and volume axes give it a controllable personality, from neutral to flared, which could be tuned to the brand. Risks: it is available to anyone, so it is less ownable. The flared and wedge voices may feel too literary for a technology brand, so the usable range may be narrower than the axes suggest. Its largest display weights need testing.

### Preliminary expectations (hypotheses to test, not findings)

| Criterion | Grand Gothik | Greta Sans | Commissioner |
|---|---|---|---|
| Very large display | Expected strongest, from width range | Expected strong, from Compressed and Condensed widths | Expected good at heavy weights. Designer notes the voices suit larger sizes |
| UI and body at 14 to 18 px | Unknown. Needs testing | Expected strong. Family is aimed at publishing | Expected strong. Designer says Light to Bold work at text sizes |
| Ownable, not SaaS-generic | High | Medium | Medium to low |
| Licence and cost simplicity | Lowest | Unknown | Highest |

### Open verification (Phase 2, before any recommendation)

1. Obtain Greek-capable test fonts for Grand Gothik and Greta Sans, and download Commissioner.
2. Run the Greek and Latin test sheet (see `phase-2-proposal.md`) in all three.
3. Request written web licence quotes for `techpi.eu` for the two commercial options, and ask whether a redirecting `techpi.gr` needs a separate licence.
4. Measure subset woff2 file sizes for Latin only and Latin plus Greek.

### Typographic rules

- **Sentence case is the main editorial language.** Headlines, body text, buttons, links, captions and statements are set in sentence case.
- **Uppercase is selective.** It is permitted for:
  - small labels (a case study's sector, for example)
  - metadata (a year, a status)
  - header navigation, where appropriate. To be tested in Phase 2, and the mobile menu stays in sentence case
  - occasional emphasis, at most one use per screen
- Uppercase is never used for headlines, statements, body text or buttons. It is limited to short strings of about three words, at 14 px minimum, medium weight, with tracking of about +0.06em.
- An uppercase label is not placed above every heading. It appears only where it tells the reader something the heading does not.
- **Greek uppercase.** Greek capitals conventionally drop accents. Set `lang="el"` so the browser applies this when uppercasing text with CSS. Check that each candidate's Greek capitals look right with and without accents.
- Display: weight around 500, leading 0.95 to 1.05, letter-spacing slightly negative, tuned per size.
- Text: weight 400, leading 1.5, measure 55 to 70 characters.
- No italic or coloured single words inside headlines.
- Numerals: lining, tabular in fact blocks.
- Hyphenation off for display. Greek display lines are broken manually where needed.
- Fonts are subset per language: English pages load the Latin subset, Greek pages load Greek and Latin.
- Commercial font files must not be committed to the repository or deployed without a licence. Trial fonts are used only in local explorations and are git-ignored.

## 3. Type scale

Fluid between a 360 px and a 1600 px viewport. Ratio roughly 1.33 on text sizes, larger steps for display.

| Token | Mobile | Desktop | Use |
|---|---|---|---|
| display-xl | 44 px | 152 px | Hero statement, contact statement |
| display-l | 36 px | 104 px | Section statements |
| display-m | 30 px | 64 px | Case-study titles, capability names |
| heading | 24 px | 36 px | Sub-headings |
| lead | 20 px | 26 px | Supporting sentence under a statement |
| body | 17 px | 18 px | Running text |
| small | 15 px | 15 px | Captions, facts, footer |
| label | 14 px | 14 px | Labels, navigation |

Greek display text uses the same tokens with a multiplier of about 0.88 on display-xl and display-l, to hold the same number of lines.

Minimum text size anywhere: 14 px.

## 4. Grid

| Breakpoint | Columns | Gutter | Outer margin |
|---|---|---|---|
| 360 to 767 | 4 | 16 px | 20 px |
| 768 to 1279 | 8 | 24 px | 40 px |
| 1280 and up | 12 | 24 px | 64 px |
| 1600 and up | 12 | 32 px | fluid, content capped |

Layout is asymmetric and left-weighted. Typical compositions: statement in columns 1 to 9 with an empty right margin. Support text in columns 7 to 11. Images in columns 1 to 8 or full bleed.

## 5. Max widths

| Container | Width |
|---|---|
| Page content | 1600 px |
| Display text | 14 to 16 words per block, no fixed width |
| Reading text | 640 px (about 65 characters) |
| Full-bleed surfaces and images | 100% of viewport |

## 6. Spacing philosophy

Base unit 8 px. A short scale with large steps: 8, 16, 24, 40, 64, 104, 168, 272.

- Space between sections: 168 px desktop, 104 px mobile.
- Space inside a group: 16 to 24 px.
- The step between "inside a group" and "between groups" is always at least three times. Proximity does the grouping, so boxes are not needed.
- Empty columns are a deliberate part of every composition.

## 7. Borders

- Hairline, 1 px, Rule colour on light, Paper at 16% on dark.
- Used to separate rows of facts and list items, and under the header after scroll.
- No boxed cards. No borders around images.
- Form controls: 1 px Slate, 2 px Blue on focus.

## 8. Radii

| Element | Radius |
|---|---|
| Surfaces, sections, images, panels | 0 |
| Form fields, small tags | 2 px |
| Buttons | Full pill |

The pill is the only rounded element in the interface. It echoes the circle, and it makes the primary action unmistakable against a square page.

## 9. Imagery treatment

- **Product interfaces:** real captures of the delivered product, shown flat and large on a solid Ink, Paper or client-colour field. No device mockups with perspective, no floating screens, no drop shadows beyond a faint contact shadow.
- **Photography:** real client contexts and real team, natural light, unposed. Full colour, slightly desaturated for consistency across sources.
- **The arc:** the only abstract graphic. A 1 to 1.5 px line or a solid curved edge. Never a gradient, never glowing. Used sparingly and only where it does structural work. The complete circle is shown once, in the contact section, and nowhere before it. Its curvature and weight are derived from the real logo symbol (see `phase-2-proposal.md`).
- **Not used:** stock technology imagery, AI-generated illustration, 3D renders, icon illustrations, abstract gradients.
- All informative images carry alt text in both languages. Decorative arcs are hidden from assistive technology.

## 10. Buttons

| Type | Form | Use |
|---|---|---|
| Primary | Pill, solid. Blue on light, Paper on dark, Sheet on blue. Label weight 500. Height 52 px desktop, 48 px mobile | One per viewport at most. "Start a project" |
| Secondary | Pill, 1 px outline in current text colour | Alternative action beside a primary |
| Text action | Text with a persistent underline offset 4 px | In-content actions: "View case study" |

States: hover (background shifts one step, 150 ms), focus-visible (2 px outline with 3 px offset, Blue on light, Cyan on dark, Sheet on blue), active, disabled.

Labels say what happens: "Start a project", "View case study", "See all work". The same action keeps the same label everywhere.

**Arrow rule (approved).** The arrow glyph is limited to primary actions and to places where it communicates direction. Concretely:

| Allowed | Example |
|---|---|
| Primary button | "Start a project →" |
| Entry into a deeper page of the same story | "View case study →" |
| Next and previous controls in a sequence | The work sequence controls |
| Links that leave the site (a diagonal arrow, with an accessible name that says so) | An external project site |

Not allowed: in-text links, navigation items, labels, and the plain text actions that close a section ("How we work", "All capabilities", "About TechPi"). If every link has an arrow, none of them means anything.

## 11. Links

- Inline links: current text colour with a 1 px underline, Blue on hover (Cyan on dark). Never colour alone.
- Navigation links: no underline at rest. Underline on hover and for the current page.
- External links are indicated in text or with a small glyph and an accessible name.

## 12. Labels

Two kinds of label.

- **Metadata labels** (case-study sector, year, status): uppercase, 14 px, weight 500, tracking about +0.06em, Slate on light and Fog on dark. Short, about three words at most.
- **Fact-row labels** (inside a fact block): sentence case, 14 px, weight 500, same colours.

Rules:

- Used only when they tell the reader something the heading does not: the type of project, the client sector, the year.
- Not placed above every heading as decoration.
- Occasional uppercase emphasis is allowed, at most once per screen.
- In fact blocks: label on the left, value on the right, hairline between rows.

## 13. Navigation

**Desktop**

- Logo wordmark left. Approved items: **Work, Capabilities, EU Projects, About, Contact**. Nothing else is added.
- Work, Capabilities, EU Projects and About are text links in the centre-right. Contact is the small pill at the far right.
- Language switch (EN / ΕΛ) sits beside the pill, as utility text and not as a sixth navigation item.
- Case: header navigation may be set in small uppercase (WORK, CAPABILITIES, EU PROJECTS, ABOUT). Both options are tested in Phase 2. In sentence case the item reads "EU projects", for consistency with the rest of the site.
- Transparent over the hero. After the first scroll it becomes a compact bar with the surface colour and a hairline.
- Hides on scroll down, returns on scroll up. Always visible when focused by keyboard.
- Adapts its colours to the surface beneath it.

**Mobile**

- Logo and a "Menu" text button. The menu is a full-screen panel with the same items (Work, Capabilities, EU projects, About, Contact) in display-m type and sentence case, then the language switch.
- Focus is trapped in the open menu. Escape and a visible close button dismiss it.

**Footer**

- Ink surface. Wordmark, navigation, contact details, legal entity details, language switch, "TechPi, formerly pigiota314".

A "Skip to content" link is the first focusable element on every page.

## 14. Case-study presentation

On the homepage:

- One case per viewport-height panel. Three cases.
- Image takes about two thirds of the panel. Text block takes one third.
- Text block order: sector label (uppercase metadata), project name (display-m), one sentence on what was built, a three-row fact block, one text action.
- Fact rows describe **scope, not results**: business purpose, TechPi's scope (product, design, engineering), and technology **[to confirm per project]**.
- **No performance metrics or business results are shown.** None are invented, and none appear unless TechPi and the client supply and confirm them. Until then the panels communicate scope, complexity, product thinking, technology, design and business purpose.
- Initial three cases and their sector labels: cAIrelink, Healthcare platform. Arman's Ethnic Street Food, Direct ordering platform. SOWISE+, EU-funded digital platform.
- Each panel may take a restrained field colour from the client's identity behind the image, to give each case its own presence.

On the Work index (later phase): a vertical list of large rows, not a thumbnail grid.

## 15. Responsive principles

1. Fluid type and spacing between breakpoints. No sudden jumps.
2. Mobile layouts are a single column, composed for reading. Images go full width, text follows.
3. Order of content never changes between breakpoints.
4. Display type wraps naturally. It is never scaled to fit a line and never clipped.
5. Arcs are re-cropped per breakpoint by hand. They are not simply scaled.
6. Hover effects exist only as enhancements on pointer devices.
7. Layout tolerates text 25% longer than the English, for Greek.
8. Everything works at 320 px wide and at 200% zoom without horizontal scrolling.
