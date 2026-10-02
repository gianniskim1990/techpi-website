# TechPi Phase 2 proposal: visual exploration

Status: **proposal for approval. Nothing in this document has been started.**
Date: 2026-10-02
Builds on: the approved Phase 1 documents in `docs/brand`, `docs/research` and `docs/design`.

## 1. What Phase 2 is for

Phase 1 settled the direction. Phase 2 answers the questions that words cannot:

1. Which typeface works, in Greek and in Latin, from a 152 px statement down to a 14 px label?
2. What exactly is the arc, once it comes from the real TechPi symbol and not from a placeholder?
3. Do the signature moments (hero, selected work, contact) look and feel like a premium European technology company, on desktop and on mobile, in both languages?
4. Does the motion hold up as calm and fast, not just as a description?

It is **visual exploration only**. It does not include:

- initialising any framework, creating `src/`, or installing dependencies
- production HTML, CSS or JavaScript
- deploying anything, changing DNS, or touching the pigiota314 sites
- migrations or redirects

## 2. Recommended first artifact: the Foundation Board

**Create first: one static, local HTML page called the Foundation Board.** It holds the three decisions that everything else depends on:

| Part | Answers | Blocked by |
|---|---|---|
| A. Type comparison | Which typeface, from three candidates | Greek-capable test files for two of the three |
| B. Logo and geometry sheet | What the arc is, derived from the real symbol | The logo files in `public/brand/` (empty as of 2026-10-02) |
| C. Colour from the logo | The exact blue, cyan, ink and paper | The same logo files |

Why this first, and not a homepage mock-up:

- A hero composed before the typeface and the arc are fixed would be composed around guesses. Every later frame would have to be redone.
- It is small. It can be reviewed in one sitting and decided in one go.
- Two of the three parts have outside dependencies (logo, test fonts). Starting them early surfaces any problem while it is cheap.
- If the logo has not arrived, the type comparison can still go ahead. Part B waits and is explicitly marked "placeholder, not for approval".

**Format: plain HTML and CSS, opened locally in a browser.** Reasons:

- Type is judged in the real rendering engine: Greek shaping, hinting, variable axes, fluid sizes, font loading. A design tool's text rendering differs.
- The same files can be screenshotted at any breakpoint.
- Tokens and decisions carry forward as numbers, not as artwork.

Figma remains available through the connected plugin and can be used later for an annotated overview if you want one. It is not the primary tool for type or motion decisions.

**Where the files live:** `explorations/phase-2/`, at the repository root, clearly outside `src/` and `public/`. They are throwaway. See section 9 for the rules.

## 3. How typography will be compared

Three directions, no more: **PF Grand Gothik, Greta Sans, Commissioner.** Verified facts and open questions are in `design-system.md`, section 2. No typeface is recommended until the test below has run.

### 3.1 Same content in all three

Every candidate gets exactly the same specimen, side by side and switchable, on both light and dark surfaces:

| Test | Content | What it reveals |
|---|---|---|
| Hero statement | "We design and build digital products." and a draft Greek line, at 152 px, 104 px and 44 px | Display character, tight leading, line breaks |
| Section statement | "AI where it creates value. Not where it creates noise." and a Greek draft | Rhythm of a long statement at display-l |
| Reading text | A two-sentence paragraph at 18 px and 17 px, then a long block at 62 characters | Text colour, spacing, fatigue |
| Interface | Navigation, a primary button, a metadata label in uppercase, a fact row with numerals, a form label | Performance at 14 px, the uppercase rules, tabular figures |
| Arrows | → and ↗ in the type, next to the button label | Whether the glyphs exist and align, or fall back to another font |
| Mixed script | "SaaS, e-commerce και AI" | How Latin and Greek sit together in one line |
| Axes | Weight steps at 152 px. Width steps for Grand Gothik and Greta Sans. Flare and volume steps for Commissioner | The usable range of each, not the theoretical one |

All Greek strings in the specimen are **test copy only**. Final Greek copy is written and reviewed by a native speaker **[to confirm who]**.

### 3.2 Greek and Latin gate (pass or fail)

A candidate that fails any item is eliminated, whatever else it offers.

- All lower-case and capital letters, with the accented vowels ά έ ή ί ό ύ ώ and capitals Ά Έ Ή Ί Ό Ύ Ώ.
- Dialytika forms ϊ ϋ and the combined tonos and dialytika forms ΐ ΰ, and capitals Ϊ Ϋ.
- Final sigma ς, the Greek question mark ; the ano teleia · and guillemets « ».
- Uppercase Greek set without accents, as convention requires, including with `text-transform` and `lang="el"`.
- The Greek pangram "Ξεσκεπάζω την ψυχοφθόρα βδελυγμία" and a full-alphabet line, checked for weight and spacing match against the Latin.
- Latin: the full English alphabet, figures, ampersand, punctuation, and the accented letters needed for the other European languages TechPi may serve.

Glyph presence and shaping are checked mechanically. Whether the Greek is well drawn is a judgement that needs a Greek reader, so **you review the Greek at Gate A.**

### 3.3 Scoring

A weighted matrix, scored by me and decided by you:

| Criterion | Weight |
|---|---|
| Greek quality (after the gate) | 25% |
| Display performance at very large sizes | 20% |
| UI and body performance at 14 to 18 px | 20% |
| Distinctiveness and fit with "premium European technology", not SaaS-common | 15% |
| Licence terms and cost | 10% |
| Performance: file size and loading | 10% |

### 3.4 Licensing and performance tasks

- Request Greek-capable test files from Parachute (the free trial has Latin only) and from Typotheque. I will draft both requests for you to send. Nothing is sent without your approval.
- Request written web licence quotes for `techpi.eu` from both. Ask whether a redirect-only `techpi.gr` needs a licence. Expected traffic tier **[to confirm]**. A desktop licence for design files may also be needed.
- Check `OFL.txt` for Commissioner's reserved font name rules before any subsetting.
- Measure woff2 size for the Latin subset and the Latin plus Greek subset, and the layout shift with a metrics-matched fallback.
- Rendering is checked in Chrome, Edge and Firefox on Windows. Safari, iOS and Android need a real-device check by someone with those devices **[to confirm]**.

Output: a Typography Recommendation note with the scores, the evidence and one recommendation, for your decision.

## 4. How the real TechPi logo will influence the geometry

**The logo is the source of truth.** The arc is not drawn independently and then matched to the logo. It is derived from the logo.

### 4.1 What I need

In `public/brand/`: the symbol alone, the wordmark, the full lockup, dark and white versions, in **vector format (SVG preferred)**, plus any official colour values. If only raster files exist, vector versions are requested. I will not redraw or "improve" the logo.

### 4.2 Analysis steps

1. **Inventory.** Formats, viewBox, strokes or fills, colours, gradients, number of shapes.
2. **Measure, not eyeball.** From the vector paths: the main circle's radius, stroke weight and its ratio to the radius, the sweep angle of each arc, the position and angle of any opening or gap, where the Pi letterform meets the circle, and any implied direction of motion.
3. **Derive the site circle.** The same ring at a much larger scale (radius of 1.5 to 2 times the viewport width). Curvature scales with it. Line weight does not. It stays a hairline in line mode, and in surface mode the edge is a clip with no stroke.
4. **Derive the crops.** Decide which angular segments of the circle are used for the hero hairline, the section handoff and the image mask, so each crop still reads as part of this symbol and not as a generic circle.
5. **Derive the motion.** The direction of rotation and the opening angle set which way the arc travels, and where the contact section's circle closes.
6. **Prove it.** At the contact section the whole circle must resolve into the real symbol with no visual jump. This is tested by overlaying the scaled site circle on the symbol.
7. **Small sizes.** The symbol alone at 16, 32 and 48 px, for favicon, avatar and app mark.

### 4.3 Colour from the same files

Blue and cyan are read from the vector files. Ink and paper are tuned to sit with them. If the logo blue does not reach 4.5:1 on paper as text, it stays the identity colour and a darker interactive blue is defined for links and buttons. Every contrast pair is recalculated and published in `design-system.md`. See section 1 of that document.

### 4.4 Output and fallback

Output: a Geometry Sheet with the measured values, the three crops and the overlay proof.

If the logo is not available at the time, the board shows a clearly labelled neutral circle, geometry is deferred, and Gate A approves typography only.

## 5. How desktop and mobile exploration will be handled

**Mobile is designed in the same step as desktop, not at the end.** Each frame is a single responsive HTML file, so the two are reviewed side by side.

| Context | Sizes |
|---|---|
| Large desktop | 1920 × 1080 |
| Desktop (primary composition) | 1440 × 900 |
| Pin breakpoint | 1024 wide. Pinned sequences switch off below it |
| Tablet | 768 × 1024 |
| Mobile | 390 × 844 |
| Small mobile stress test | 360 and 320 wide, and 200% zoom |

Every key frame is shown:

- in **English and Greek**, since Greek runs longer and will break display lines differently
- on **its real surface** (light, dark, blue)
- with a **reduced-motion** version where the section has motion

**Key frames, in two tiers.**

- Tier 1, the three that decide the direction: **Hero, one Selected work panel, Contact with the full circle.** Desktop and mobile, English and Greek.
- Tier 2, after Tier 1 is approved: the Statement, the Capabilities index (with Digital visibility), Intelligence, Evolution, the header, the mobile menu and the footer.

**Motion is explored in two steps.**

1. **Storyboards:** four to six annotated key states per sequence, inside the board. This is enough to judge composition and timing intent.
2. **One live micro-study,** a single page limited to: the hero arc scrubbed to scroll, one arc handoff, the line reveal, the circle-clip image reveal, and the contact circle completing. It is built only after the Tier 1 frames are approved, and it is used to check feel and performance: frame timing, layout shift, and behaviour with native scroll.

The mobile versions follow the simplification rules in `motion-system.md`, section 11. The reduced-motion layout is reviewed as its own layout.

## 6. What stays conceptual and what is production-ready

| Item | Status at the end of Phase 2 |
|---|---|
| Information architecture, navigation, language architecture | **Ready to carry forward** (approved) |
| Motion rules: budget, durations, easing, stagger, reduced-motion and performance constraints | **Ready to carry forward**, with numbers adjusted by the micro-study |
| Colour roles and contrast rules | **Ready** as a method. **Values final only after the logo is inspected** |
| Type scale logic, spacing scale, grid, button, link and label rules | **Ready to carry forward**, with sizes tuned to the chosen typeface |
| Accessibility requirements | **Ready to carry forward** |
| Typeface | **Conceptual until Gate A** |
| Arc geometry | **Conceptual until derived from the logo and approved** |
| Layouts of the key frames | **Conceptual.** They show intent and composition. They are not a build spec |
| English copy | **Draft.** Reviewed before use |
| Greek copy | **Draft, test copy only.** Written and reviewed by a native speaker |
| Case-study panels | **Conceptual until real captures and confirmed descriptions exist** |
| Company facts | **[to confirm]**. None assumed |
| All exploration code in `explorations/` | **Throwaway.** Never reused as production code |

The production stack is not decided in Phase 2. That is a separate decision with its own proposal and its own approval.

## 7. Workflow and approval gates

```
2.0  Intake and checks
       logo into public/brand/ · test-font and quote requests drafted · Greek reviewer named
2.1  Logo analysis → Geometry Sheet
2.2  Foundation Board: type comparison + colour from logo + geometry
       ▼
     GATE A  you decide: typeface · colour values · arc geometry principles
       ▼
2.3  Tier 1 key frames (hero · selected work · contact), desktop + mobile, EN + EL
       critique and accessibility pass on the frames
       ▼
     GATE B  you approve the visual direction
       ▼
2.4  Live micro-study of the motion, with reduced-motion and mobile
       measured for performance, critique and accessibility pass
       ▼
     GATE C  you approve the motion
       ▼
2.5  Tier 2 frames · documentation updated with final tokens · Phase 3 proposal (build approach)
       ▼
     Stop for approval before any production work
```

At every gate I stop and wait. No gate is skipped, and nothing at a later step starts early.

## 8. Skills

| Skill | Used for | When |
|---|---|---|
| frontend-design | Type and layout decisions, checking each frame against generated-site defaults | 2.2, 2.3 |
| wireframe-agent | Low-fidelity structure of the Tier 1 and Tier 2 frames before they are styled | 2.3, 2.5 |
| page-designer | Section and page composition in the grid | 2.3, 2.5 |
| content-copy-designer | English copy refinement, labels, Digital visibility wording | 2.3 |
| design-critique | Structured critique of each frame set | After 2.3 and 2.4 |
| ux-heuristics | Heuristic review of the frames and the micro-study | After 2.3 and 2.4 |
| accessibility-auditor | Contrast, focus, zoom, reduced motion, Greek uppercase, keyboard order | After 2.3 and 2.4 |

Not planned: design-pipeline (it assumes interactive research and full prototype stages), product-designer, component-builder.

## 9. Rules for the exploration files

- Location: `explorations/phase-2/`. Not in `src/`, not in `public/`.
- Plain HTML and CSS, and plain JavaScript only in the micro-study. No framework, no build step, no installed packages.
- Commercial font files (Grand Gothik, Greta Sans) are **never committed and never deployed**. Trial and test fonts live in a git-ignored local folder and are used only on this machine. Commissioner is OFL and could be committed, but is kept with the rest for simplicity.
- Nothing is published. Review happens locally, and in the in-app browser.
- Real brand files stay in `public/brand/` and are referenced, not copied.

## 10. What I need from you

| # | Need | Used for |
|---|---|---|
| 1 | Approve the Foundation Board as the first artifact, and HTML as its format | Step 2.2 |
| 2 | Place the logo files in `public/brand/`: symbol, wordmark, lockup, dark and white, vector preferred, plus any official colour values | Steps 2.1 to 2.2 |
| 3 | Approve me drafting the test-font and quote requests to Parachute and Typotheque. You send them | Step 2.0 |
| 4 | Expected traffic tier for the web licence **[to confirm]** | Licence quotes |
| 5 | Name the Greek copy reviewer, and agree that you review Greek glyph quality at Gate A | Gate A |
| 6 | Confirm sans-only, which formally drops the serif pairing | Step 2.2 |
| 7 | Case-study captures, confirmed descriptions and permissions for cAIrelink, Arman's and SOWISE+ | Step 2.3 |
| 8 | Someone with Safari, iOS and Android devices for a real-device check **[to confirm]** | Step 2.4 |

## 11. Risks in this plan

1. **The logo may not arrive in time.** Mitigation: Part A of the board runs without it, and Gate A can approve typography alone.
2. **Test fonts may be slow to arrive.** Commissioner can be tested at once, but a three-way comparison needs all three. If one is missing at Gate A, the comparison is marked incomplete and not decided on partial evidence.
3. **Greek quality is partly a matter of taste,** and my checking is mechanical. Your judgement at Gate A is part of the process, not a formality.
4. **Throwaway code can become production code by accident.** Mitigation: separate folder, no framework, and an explicit rule that production starts clean.
5. **A polished static frame can hide motion problems.** Mitigation: the live micro-study is a gate of its own.
6. **Windows-only testing here.** Safari and mobile browsers can differ in scroll-linked behaviour and clipping. A real-device check is required before Gate C.
