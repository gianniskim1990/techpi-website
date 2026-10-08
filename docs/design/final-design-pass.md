# Phase 3: final design pass

Status: implemented on `phase-3-final-design`, for review as one complete site.
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
  draw in, and a circular image uncover from the direction of the arc (a plain fade below 1024px).
- The hero statement animates with CSS only and never waits for the script.
- Scroll-linked geometry (hero arc drift, the edge, the Intelligence field, the Evolution half circle, the closing
  circle) uses scroll-driven CSS timelines on desktop where supported. Elsewhere the same states play once as a timed
  sequence. Both end at the static resting state.
- Reduced motion, no scripting and print all show the resting state. No pinning below 1024px wide or 740px high.

## 4. QA record (2026-10-08)

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm run build` | 20 pages |
| Static audit against the `main` build | 1039 / 1039 (heads, noindex, single h1, links and anchors, images, alt and dimensions, no third parties, no SOWISE+, language switch, favicons, two self-hosted fonts). A negative test fails as it should |
| Wrangler route and redirect matrix against the `main` build | 70 / 70 identical |
| Visual review | 18 pages × 1440, 1280, 1024, 768, 390, 360, EN and EL; homepage scroll states with motion; reduced motion; scripting disabled |
| Horizontal overflow, console errors | None on any reviewed page and width |
| Mobile dialog | Opens, traps focus, closes on Escape, returns focus to the Menu button |
