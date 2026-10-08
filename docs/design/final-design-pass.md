# Phase 3: final design pass

Status: **design complete and frozen** (final design release QA passed 2026-10-08, section 11). Implemented on
`phase-3-final-design`.
Date: 2026-10-08

This pass changes presentation only. Content, routes, redirects, canonicals, hreflang, the language architecture,
`noindex`, the self-hosted fonts, the favicons, contact facts and project facts are unchanged (verified against the
`main` build: identical page set, identical `<head>` on all 20 pages, identical language-switch targets, identical
external and contact links, identical Wrangler route and redirect matrix).

## 1. The one geometric idea: ARC → CIRCLE → TECHPI

One very large circle, derived from the outer sweep of the symbol, runs through the homepage and becomes more complete
as the reader goes down:

| Section | State of the circle |
|---|---|
| Hero | A hairline arc, far larger than the screen. It draws itself once on load |
| Into Selected work | The arc has become a surface: the Ink section rises behind the circle's edge |
| Evolution | A half circle, from `pigiota314` to `TechPi`: a diagram of the sentence, not a logo morph |
| Contact | The circle closes for the only time on the site and resolves into the approved 3D symbol |

The arc no longer appears on secondary pages (the About page arc was removed). The curved edge before "Next project"
on case studies is the only geometric echo there.

## 2. Decisions

- **Contact is Ink, with the blue 3D symbol at full strength**, beside the question rather than behind it. It was
  TechPi Blue with the white symbol at 16%. The symbol is the destination of the page, so it is shown, not hinted.
- **Intelligence is Ink**, the strongest typographic moment. The second line is set quieter. The visual is a row of
  hairlines of uneven height (noise) that settles into one straight cyan line (clarity). No AI imagery.
- **Cyan** is used at rest only as the single geometry accent of an Ink section: the clarity line and the closing
  circle while it draws. Still never text, never on Paper.
- **Selected work**: each project is a full-screen composition that follows its capture (a very wide capture spans
  the width; the others alternate sides). On tall desktop screens with motion allowed, each project holds and the next
  slides over it (sticky positioning, no scroll hijacking). Elsewhere they stack.
- **Work index**: projects with imagery are large editorial rows; the four without imagery are typographic index
  lines instead of placeholder pictures.
- **Case studies**: a strong head with a fact strip, a full-bleed Ink cover band, numbered sections with a sticky
  heading column, numbered "What we built" items, and a next project with its capture.
- **Header**: fixed when scripting runs. Transparent at the top, leaves on scroll down, returns as a compact Paper bar
  on scroll up, always visible when focused. Without scripting it scrolls away as before.
- **Narrow-screen crop** (`src/components/projectCrops.ts`): the Rocketeer dashboard (2.7:1) is cropped to its title
  and first cards below 1024px, at a size where the interface reads. Presentation only; nothing is redrawn.

## 3. Motion

CSS first, with one small first-party module (`src/scripts/motion.ts`, no dependency):

- Hidden starting states apply only under `html.mo`, set inline when scripting runs and reduced motion is not
  requested. If the module does not confirm itself within 3 s, `mo` is removed and everything shows.
- One IntersectionObserver adds `.in` once per element: block fades, statement masks, line reveals, hairlines that
  draw in, and a circular image uncover from the direction of the arc (a plain fade below 1024px). A bounding-box
  check backs it up for the two reveals that clip themselves to nothing while waiting (`mask` and `image`): a clipped
  element leaves the observer only a zero-area overlap, whose result depends on sub-pixel rounding (section 11).
- The hero statement animates with CSS only and never waits for the script.
- Scroll-linked geometry (hero arc drift, the edge, the Intelligence field, the Evolution half circle, the closing
  circle) uses scroll-driven CSS timelines on desktop where supported. Elsewhere the same states play once as a timed
  sequence. Both end at the static resting state.
- Reduced motion, no scripting and print all show the resting state. No pinning below 1024px wide or 740px high.

## 4. Scroll scenes (second pass, 2026-10-08)

Reference: the pacing of https://ecbf.vc/ (docs/research/ecbf-reference.md), reinterpreted, not copied. What was
taken is the craft: tall sections with a sticky stage that scrubs one transformation, geometry at different depths,
and sections that overlap instead of stacking. Nothing of its layout, colour, type, assets or timings.

Scenes run only on desktop-sized windows (1024px wide, 700px high or more) with motion allowed (`html.sc`). The
first-party module writes each scene's scroll position as custom properties (`--in`, `--out`, `--pin`, `--cov`) and
CSS turns them into geometry with the individual `translate`, `scale` and `rotate` properties, so scene motion never
competes with the one-shot reveals. Values follow the scroll position directly: no smoothing, easing, snapping or
interception. Scrolling stays native.

| Moment | What happens |
|---|---|
| Hero leaves | Its layers part at different depths: the statement lines lift faster than the page, each less than the one above; the arc, furthest back, drifts down |
| Statement | The sentence arrives on the page's tempo; the two steps trail behind it |
| Into Selected work, Intelligence, Contact | **The horizon.** The Ink section's own top edge is the arc of a circle far wider than the screen. It enters low and strongly curved, rises more slowly than the page and flattens: the arc becomes a surface. Empty Ink comes first, so the edge never cuts through text |
| Selected work | Inside a project, the capture travels further than the text. Between projects, the one being covered settles back, smaller and darker, while the next slides over it. The last one settles back as Capabilities arrives |
| Intelligence | The one hold in the middle of the page (85svh): the statement stays while the noise settles, from the right, into the clean line, and the second sentence recedes |
| Evolution | The half circle draws from the old name to the new one as the section rises; the diagram sits deeper than the heading |
| Contact | A short hold (75svh): a cyan arc, wider than the figure, closes into a circle and contracts onto it; the symbol turns and settles into place; the quiet ring remains |

Pinning: two short holds on the whole page (Intelligence, Contact) plus the project handoff. Tablet, phones,
short windows, reduced motion and no scripting keep the simpler behaviour of the first pass. The resting state at the
end of every scene is the static layout.

The `scroll-timeline` CSS used in the first pass was replaced by this driver, so the experience is the same in every
current browser, not only in Chromium.

## 5. Hover (third pass, 2026-10-08)

Pointer devices only (`hover: hover`). Nothing essential depends on hover; touch and keyboard users lose nothing.

| Element | Hover |
|---|---|
| Buttons | A circle grows from the centre and fills the pill (Ink on Paper, cyan on Ink); the arrow leans forward |
| Text links | The hairline underline runs out to the right and redraws from the left; the arrow leans forward |
| Project captures (homepage, Work, next project) | The capture leans in slowly (1.035) and a small hairline circle with an arrow appears at its top right, turning from ↗ to → |
| Homepage capabilities | Each statement now links to its section on the Capabilities page. On hover the hairline above redraws in TechPi Blue, the name steps forward and an arrow appears |
| Contact call to action | The symbol turns a few degrees and the quiet ring lights up in cyan |
| Next project | The name steps forward with the capture |

Arrows written in the copy ("Start a project →") are rendered as a separate decorative span (`Arrowed.astro`), so
they can move on their own and screen readers read only the words. No copy changed.

## 6. Hero transformation map (2026-10-08, refined)

The upper half of the hero is a hairline map (`TransformationMap.astro`) built into the hero's structure:

- **Its bottom edge is the line above the headline**, the twin of the rule below it, so the statement sits between
  two hairlines. Left of the turning point the line is broken (manual work); from there it is whole.
- **Three broken threads** (websites, ordering, visibility) start apart in the upper left and turn down into it.
- **On the hero grid:** "Fragmented" sits over the descriptor (column 1) and "Connected" and the turning point over
  the supporting line (column 5), with a fine dotted marker between them.
- **It ends on the arc.** The whole line runs through automation, AI and systems and stops exactly where it meets the
  hero arc; the blue circle sits on the arc and "Digital products" is labelled inside the TechPi circle. The arc is
  placed from the right and the line from the headline, so the motion module measures the meeting point (`--hit`).
  It also drops any caption that would cross the arc and any node label that would collide (systems first, then
  AI's label). Without scripting the line ends at a resting position.
- **Hover (pointer devices):** the broken wires draw whole and the threads darken, a short stretch of TechPi Blue
  travels along the line to the arc, each node lights as it passes, the end circle opens, and the hero arc turns blue
  while the pointer stays. About a second and a half, once per hover; leaving resets quietly. Touch: static.
- **Motion:** draws in from left to right after the headline on load. In the scroll scene it leaves just ahead of the
  headline and fades early, so the headline never passes over it. Reduced motion: static, hover is a plain change of
  colour.
- **Responsive:** full map from 1200px; "Systems" drops where the line is short; phones keep only the threads, the line
  and the outcome.
- Accessible as one image with a sentence label (EN and EL in `home.*.ts`); its parts are hidden from assistive
  technology.

## 7. EU-funded projects (2026-10-08)

A service offering, not a portfolio (copy in `src/content/eu.ts`, rules in `launch-blockers.md`, section 4).

- **Homepage**, between Capabilities and Intelligence (`home/EuProjects.astro`): a top hairline with a small label
  and "Explore EU Projects", one large sentence, the supporting line, and what can be built as a single typographic
  run with small hairline circles between items. No cards, no EU flag, stars or blue and yellow.
- **EU Projects page** (`pages/EuProjectsPage.astro`), expanded 2026-10-08 from the services described on
  pigiota314.eu (approved source; adapted, not copied). More information-rich than the other secondary pages, but
  in the same editorial system, and paced by surface changes rather than by cards:
  1. Page head: h1, lead, a smaller context line and a quiet "Discuss your project" link.
  2. **01** A digital infrastructure for the full project lifecycle: what the site may need to support, as one
     typographic run, and who it is for.
  3. **Ink band:** the lifecycle, Launch → Communicate → Publish → Engage → Measure → Sustain, as a hairline timeline
     with six nodes (the last a Cyan ring). On reveal the line draws and the stages follow; vertical below 1024.
  4. **02** EU project websites: "Structure before visuals" beside a small content-model tree (Project → partners,
     work packages, deliverables, results, events, stakeholders), then the twelve capabilities in three ruled groups.
  5. **03** When a project needs more than a website: eight platform types and three principles. No interface
     mock-up, so nothing reads as a client system.
  6. **TechPi Blue band:** for communication and dissemination partners: who, the ten-part offer, "Discuss a
     partnership".
  7. **05** Programmes and project types, as a plain ruled list with the independence disclaimer.
  8. **06** Technical priorities (3×3), **07** the six-step process, **08** before the project / throughout and after.
  9. Closing question with a supporting sentence (`ClosingCTA` gained an optional `text`).
  Motion is calmer than the homepage: reveals and the lifecycle line only, no pinning, no scroll scenes.
- **Navigation:** EU Projects restored to header, mobile menu and footer, in both languages; checked against the hero
  arc at every desktop width in Greek, the longest labels.
- Hyphenated words in large headings ("EU-funded") never break at the hyphen (`Unbroken.astro`; Commissioner has no
  non-breaking hyphen glyph).

## 8. QA record (2026-10-08)

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm run build` | 20 pages |
| Static audit against the `main` build | 1039 / 1039 (heads, noindex, single h1, links and anchors, images, alt and dimensions, no third parties, no SOWISE+, language switch, favicons, two self-hosted fonts). A negative test fails as it should |
| Wrangler route and redirect matrix against the `main` build | 70 / 70 identical |
| Visual review | 18 pages × 1440, 1280, 1024, 768, 390, 360, EN and EL; reduced motion; scripting disabled |
| Scroll scenes | Frame sequences of the whole homepage at 1440 × 900 (EN), 1280 × 800 (EL) and 1024 × 768 (EN) |
| Horizontal overflow, console errors | None on any reviewed page and width |
| Mobile dialog | Opens, traps focus, closes on Escape, returns focus to the Menu button |

### EU Projects expansion QA (2026-10-08)

`/eu-projects` and `/el/eu-projects` at 1440, 1280, 1024, 768, 390 and 360: no horizontal overflow, no console
errors, one h1, mobile menu opens and closes (Escape) with EU Projects marked current, Greek wraps cleanly. Fixes
made in review: programmes moved from a large wrapping run to a ruled list; the closing question no longer breaks
"EU-funded" at the hyphen; the three platform principles stay in one row on tablet. The homepage teaser was
re-checked in both languages. Static audit: the only differences from the baseline are the new meta descriptions on
the two EU pages; `noindex` unchanged.

## 9. Final art-direction pass (2026-10-08)

Goal: remove what made the site read as generated, and leave a smaller number of stronger, authored ideas.

**What read as generated.** Template chrome applied everywhere: tracked uppercase eyebrows over every block, a
trailing "→" on every link and button, 01–08 numbering on content that is not a sequence, a hairline above every
section, and the same fade-up on every block. Every section followed one formula (giant headline, hairline, offset
paragraph, whitespace). The arc motif had turned into decoration: three curved Ink entrances, a ring, a badge circle,
a circle-fill button. Three sticky or pinned sequences. Three projects shown as one image-left / image-right
template.

**Removed.** Uppercase labels (all labels are sentence case now); trailing arrows (`Arrowed.astro` deleted; ↗ for
external links and ← for "back" stay, because they carry meaning); numbering where there is no sequence (homepage
capabilities, EU section indices, principles, case-study sections and feature lists); the curved horizon entrances;
the hover badge, the circle-fill button, the redrawing underline and the symbol spin on hover; the fade, mask-line
and image-uncover reveals (only a secondary page's h1 still uncovers on load); the sticky project stack and the
Intelligence pin; scroll drift on Evolution; the EU content-model reveal.

**The visual language that remains.**
1. *Precision against one fluid line.* Technical notation (small sentence-case annotations, hollow and filled points,
   hairline spines) set against the single hero arc. The arc appears only where it means something: the hero, the
   Evolution half circle, the closing circle around the symbol. Every other section is free of it.
2. *Real interface as material.* Project captures are cropped to the part worth reading (`Crop.astro`,
   `workCompositions.ts`) and composed at contrasting scales; nothing is redrawn.
3. *Loud and quiet.* Very large type is reserved for a few moments (hero, Work page name, Intelligence, contact);
   everything else is set a size or two down, with dense index typography in between.
4. *Colour as meaning.* Paper for reading, Ink for work and intelligence, TechPi Blue for the invitation to work
   together (homepage contact, every secondary page's closing band, the EU partners band).

**Homepage chapters.** Hero (Paper, the transformation map) → statement (quiet: smaller sentence, two steps drawn
as a hollow point joined to a blue point) → Selected work (Ink; three compositions: layered Rocketeer interface,
Arman's capture bleeding off the page with a management detail, Logotherapia as a full-width strip) → capabilities
(Paper; a dense index, read across) with EU-funded projects as its last, heavier row → Intelligence (Ink; noise
settles as the field rises, no pin) → Evolution (Paper; the half circle) → contact (TechPi Blue, white symbol; the
one pinned moment, shortened to 45svh). Contact moved from Ink to Blue so the page ends on the brand colour and the
Ink footer reads as a separate band.

**Secondary pages.** Work is a catalogue: a one-word name set very large, then every project on one index with 3:2
crops for the case studies. Case studies open with a cropped cover band, use small section heads so the text carries
the story, and close with the whole capture beside the project's other real screens. EU Projects lost its section
numbers; short heads sit beside their leads; the lifecycle band is the page's one drawn motion. Capabilities and
About lost their numbering. Closing calls are a compact TechPi Blue band.

**QA.** Homepage, Work, case studies and EU Projects in English and Greek at 1440, 1280, 1024, 768, 390 and 360: no
horizontal overflow, no console errors, one h1 per page, mobile menu opens and closes with the current page marked.
The hero map's end label now moves above its circle when it would run off a narrow window. `npm run check` and
`npm run build` clean; static audit unchanged apart from the EU meta descriptions; wrangler route matrix identical
in status and redirects.

## 10. Scroll and hover restored (2026-10-08, at the owner's request)

The owner asked for the scroll and hover effects of the earlier passes back, on top of the art-directed layouts.
Native scroll throughout; everything follows the scroll position and settles at rest; reduced motion shows the
resting state.

- **Scroll:** the curved horizon entrance on Selected work, Intelligence, the contact band, the EU lifecycle band and
  the case-study "whole picture" band; the Selected work heading set far larger than the page and sliding across as
  the section passes; each project capture uncovered from the left and settling from a slight zoom, with a laid-over
  screen travelling faster than the one beneath it; the statement's spine drawing from problem to technology; the
  Intelligence hold restored; the contact hold back to 60svh; heading masks and block fades on every page; the EU
  blue rule drawing in; the case-study cover uncovered on load.
- **Hover:** a cyan circle with the case-study label follows the pointer over a project capture, which leans in;
  capability and Work index rows fill with an Ink band from the left and turn to Paper; the text-link underline
  redraws; buttons fill with a growing circle and their arrow leans forward (arrows only on buttons); the hero map's
  connect sequence; next-project crop leans in.

## 11. Final design release QA (2026-10-08)

Design frozen: nothing was redesigned, restyled or reworded. Checked as built, in a real Chromium, on the Wrangler
runtime, in English and Greek.

**One defect found and fixed.** At a window about 768px wide (tablet portrait), the page heading of About, Contact,
Capabilities and EU Projects stayed invisible, in both languages. A hidden `data-reveal="mask"` heading is clipped to
nothing, so the IntersectionObserver saw only a zero-area overlap along one edge. Whether the browser counts that as
intersecting depends on sub-pixel rounding, and at that width it did not, so `.in` was never added. Fix:
`src/scripts/motion.ts` adds a bounding-box check (which ignores `clip-path`) for the two self-clipping reveals,
`mask` and `image`. It only looks at elements still waiting, uses the observer's own threshold, and removes its listeners
when none is left. Verified on 1,248 loads (39 window widths, 4 heights, 8 pages): 0 unrevealed elements in the first
window. The unfixed commit fails the same grid at 768px (6 of 54 loads), so the test is sensitive. A second comparison of the
revealed state at identical scroll positions (192 combinations) found the same fault at desktop widths, on other mask
headings: the homepage statement heading, the EU Projects "Six stages" and "Programmes" headings and the Greek Evolution
heading were each left invisible while on screen at some scroll positions. The fix reveals them, and revealed nothing
below the window early.

**Results.**

| Check | Result |
|---|---|
| `npm run check`, `npm run build` | 0 errors, 0 warnings, 0 hints; 20 pages |
| Static audit (updated for the five-item navigation and the Contact scene) | 39 / 39 |
| Wrangler route and redirect matrix | 97 / 97, identical to `main` |
| Indexing | Every page `noindex, nofollow`. `PUBLIC_ALLOW_INDEXING` unset. Canonical, hreflang, x-default, `lang` unchanged |
| Page sweep (20 pages, 6 viewports, EN and EL) | No overflow, broken image, clipped text, console error or layout shift (CLS at most 0.0007), every page scrolls to the bottom and back |
| Native scroll (real wheel input, 18 pages, 1440, 1024, 390) | Every 100px notch moves exactly 100px. No easing, snapping or capture. No section holds the reader |
| Reduced motion (20 pages, 4 sizes) | No motion states applied, nothing animating, nothing hidden, nothing changes on scroll |
| JavaScript off (scripts blocked by CSP; 20 pages, 5 sizes) | Everything visible, navigation reachable (full nav on desktop, Menu link to the footer below 900px) |
| Mobile menu (EN and EL, 390 and 360) | 130 checks per size, all pass: open and close, Escape, focus trap, focus return, scroll lock, inert background, language switch to the exact counterpart, `aria-expanded`, closes on resize |
| Accessibility smoke | One `h1` per page, no skipped levels; no unnamed control, missing alt or duplicate id; skip link and landmarks; no hover-only function. Keyboard: visible focus on every stop, none covered by the header, document order, no trap. Contrast: 1,316 text elements, 0 below AA, lowest margin 1.11x |
| Network (20 pages, 2 sizes) | 297 requests, all to the site itself. 2 font files. No third party, cookie or storage. No analytics, tag manager, pixel or consent code |
| Dependencies | `package.json` and `package-lock.json` identical to `main`. One runtime dependency (`astro`) |

**Performance (static `main` against this branch).** JavaScript added: one 5.8 KB module (about 2 KB over the wire), no
library. CSS on the homepage 5 KB to 11 KB. CLS about 0. LCP: desktop 0.25 s, throttled phone (4x CPU, slow 4G)
0.74 to 1.43 s. Scroll frames: p50 16.7 ms; on a desktop slowed 4x, p95 33 ms and at most one frame at the 50 ms mark.
At load the English homepage has one long task of 450 to 480 ms on a desktop slowed 4x in all three runs (834 ms on the
throttled phone profile), where `main` has none or 53 ms. The Greek homepage is comparable on both (branch 136 to 633
ms, `main` 177 to 437 ms). Unthrottled, no run showed one on the English homepage. It is the cost of the hero map and
the scroll scenes, recorded as a watch item, not a blocker.

**Not changed, recorded for the owner.**

- At 1440x900 and 1280x800 the Greek hero is taller than the window (978px and 890px), because the Greek headline runs to
  three lines. Nothing is clipped, but the supporting line sits 38 to 50px below the first screen, where the English
  one fits exactly. Fixing it means giving up some hero spacing or Greek display size, which is a design decision.
- The five original project captures (1.3 MB) are emitted into `dist/` but no page references them: the aspect-ratio code
  in `Crop` and `ProjectMedia` reads `image.src.width`, which makes Astro keep the original. Visitors never download
  them. Remove by reading the dimensions another way, in a later cleanup.
- In a browser with a warm cache, Chromium logs "preloaded but not used" for the font preload on later page views. It is
  identical on `main`, absent on a cold load, and harmless.
