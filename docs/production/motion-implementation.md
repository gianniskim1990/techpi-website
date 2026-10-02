# TechPi motion implementation

Status: **locked** after the Phase 3 review. Planning only. No animation code is written.
Date: 2026-10-02 (revised after approval)
Source of truth: `docs/design/motion-system.md` and the locked Gate B prototype.

## 1. Position

The approved motion is small. The prototype already runs five of the six interactions with CSS and about thirty lines of script. Production should keep that proportion.

**Locked rules**

- GSAP is not installed at project setup.
- At the motion stage, the approved interactions are first attempted with CSS, sticky positioning and minimal JavaScript.
- GSAP and ScrollTrigger are used only if the Contact arc → circle → TechPi sequence genuinely benefits from them. The library must be justified by the final motion requirement, not added pre-emptively.
- CSS scroll-driven animations are never a critical dependency. They are a progressive enhancement, used only if appropriate and sufficiently supported at implementation time.
- Scrolling is native.

**The critical narrative must work with only:**

- sticky positioning
- CSS transitions
- minimal JavaScript

and must remain complete with reduced motion and in browsers that do not support scroll-linked CSS.

**Order of preference for every interaction:**

1. CSS only.
2. CSS, with a class toggled by a small first-party script.
3. A scroll-linked CSS timeline, as an enhancement only.
4. A library, only for the Contact sequence, and only where the first three cannot do the job cleanly.

## 2. Interaction by interaction

| # | Interaction | Technique | Library needed |
|---|---|---|---|
| 1 | Hero supporting-line reveal | CSS transition on a line mask, started by one class | No |
| 2 | Short hero hold | CSS `position: sticky` inside a taller wrapper | No |
| 3 | Hero arc movement | Scroll-linked CSS timeline, enhancement only | No |
| 4 | Selected work viewport handoffs | CSS `position: sticky`, stacked panels | No |
| 5 | Sticky Capabilities heading | CSS `position: sticky` | No |
| 6 | Image reveal by mask | CSS `clip-path` transition, started once by an intersection observer | No |
| 7 | Edge into Selected work | Static CSS shape. Scroll-linked version is an optional enhancement | No |
| 8 | Arc → circle → TechPi at Contact | To be decided at the motion phase. See section 4 | Possibly |

### 2.1 Hero supporting-line reveal

- The statement is the `h1`. It is never hidden, never animated and never waits for a script, because it is the largest paint.
- The supporting statement sits beneath it in a line mask. It is visible by default. The hidden starting position is applied only after the script has confirmed it is running, so a script failure leaves the text readable.
- One class on the root element starts a CSS transition. The class is set when the page has scrolled a short distance into the hold.
- It plays once. Scrolling back does not need to replay it, though it may reverse.

### 2.2 Short hero hold

- A wrapper one and a half viewports tall, with the hero stuck to the top inside it. Half a viewport of hold.
- The header stays with the hero during the hold and leaves with it.
- No scroll input is intercepted. This is ordinary sticky positioning.

### 2.3 Selected work handoffs

- Each project panel is one viewport tall and sticks to the top. The next panel slides over it in normal document flow.
- Keyboard order, reading order and find-in-page all follow the document.
- The counter ("1 / 3") is static text per panel.

### 2.4 Image reveal

- When a project panel becomes current, its image is uncovered by a circular `clip-path` that grows from the direction of the arc, then rests as a plain rectangle.
- One observer, one class, one CSS transition. It plays once per image.
- The image's space is reserved in advance, so nothing shifts.

### 2.5 Arc movement and the edge

- Where the browser supports scroll-linked CSS timelines, the hero arc moves slightly with the scroll, and the edge into Selected work can be tied to scroll position.
- Where it is not supported, both are static. The composition is designed to work static, as the prototype shows.
- Browser support for scroll-linked CSS timelines is not universal. It is treated strictly as an enhancement and nothing depends on it. Support is checked again at the motion stage, and if it is not good enough the enhancement is simply left out.
- Neither of these two effects carries the narrative. The hero's meaning is in the statement and its supporting line. The handoff into Selected work is carried by the change of surface and the sticky panels.

## 3. The first-party script

One small module, loaded after first paint, with three jobs:

| Job | Mechanism |
|---|---|
| Decide whether motion runs at all | Media queries, evaluated once and on change |
| Start one-shot reveals | One intersection observer shared by all revealing elements |
| Set the hero state | One passive scroll listener that only compares a number and toggles a class |

No layout is read or written inside a scroll handler. Target size: a few kilobytes at most.

## 4. The Contact sequence: the one open question

This is the only interaction with real choreography: the arc closes into a circle, the inner geometry appears, and the form resolves into the flat symbol, all tied to scroll position.

It also **cannot be built properly until the vector symbol exists**, because the inner geometry has to be drawn from real paths.

Plan in two steps:

**Step 1, without the vector master.** The resting state from the prototype: the flat symbol at 14% behind the question, with a simple one-shot reveal. This is launch-acceptable if the master arrives late.

**Step 2, with the vector master.** The full sequence, built from the SVG paths. Three ways to do it, in order of preference:

| Option | Fit | Cost |
|---|---|---|
| A. A small scroll-progress script that writes one custom property, with CSS doing the rest | Works everywhere. The baseline | About forty lines |
| B. Scroll-linked CSS timeline driving stroke and opacity | An enhancement on top of A where supported. Never the only path | No extra script |
| C. GSAP with ScrollTrigger, scrubbed | Easiest to choreograph and tune | A library of tens of kilobytes for one section |

**Locked order:** build it with A first. Add B only as an enhancement. Choose C only if, with the real SVG in hand, the sequence genuinely benefits from timeline control that A makes awkward. The reason is written down before the library is installed.

If GSAP is adopted, these conditions apply:

- It is loaded only when the Contact section approaches the viewport, never in the initial bundle.
- It runs only on desktop, with motion allowed.
- It is used for this sequence only. The other interactions stay as specified above.
- The licence terms are checked at the time of adoption.

## 5. When scripted and scroll-linked motion must not run

Motion beyond simple hover and focus transitions is switched off entirely when any of these is true:

| Condition | Result |
|---|---|
| The user prefers reduced motion | Static page. No hold, no reveals, no arc movement, no masks. Surfaces change at straight edges |
| Viewport narrower than 1024 px | No hold, no sticky panels, no scroll-linked effects. One-shot reveals may remain, shortened |
| Viewport shorter than 700 px | No hold and no sticky panels, whatever the width |
| The user has asked to save data | No scroll-linked effects and no late-loaded motion library |
| Scripting is unavailable or fails | Everything is visible and static |
| The browser does not support scroll-linked CSS | The enhancements are absent. Sticky positioning, transitions and the small script still deliver the full narrative |
| Printing | Static |
| The tab is hidden | Nothing runs |

The reduced-motion page is reviewed as a layout in its own right.

## 6. Mobile simplification

- No hero hold. The supporting statement is simply present under the statement.
- No sticky project panels. Projects are stacked, image first.
- The hero arc is static. There is no curved edge. Surfaces change at straight edges.
- Image reveals become a short fade, or nothing.
- The Contact symbol is static at rest.
- Nothing depends on hover, and nothing reacts to device tilt.

## 7. Performance constraints

- Animate only `transform`, `opacity` and `clip-path`.
- No blur, backdrop filter or animated shadow.
- One animating full-viewport layer at a time.
- `will-change` is set only for the duration of an animation and removed afterwards.
- No frame over 50 ms during scroll on a mid-range phone.
- Text is never hidden while waiting for a script.
- Motion code loads after first paint and is not render-blocking.
- If any performance target in `architecture.md` fails because of a motion, the motion is simplified.

## 8. Timing values carried from the design

| Token | Value |
|---|---|
| Reveal easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| State easing | `cubic-bezier(0.65, 0, 0.35, 1)` |
| Hover and focus | 150 ms |
| Line reveal | 800 to 900 ms |
| Stagger between lines | 80 ms |
| Image reveal | about 1000 ms |
| Longest triggered motion | 1200 ms |

These live as custom properties beside the other tokens.

## 9. Lessons from the prototype, recorded so they are not rediscovered

- A sticky element stops working inside an ancestor with `overflow: hidden`. Use `overflow: clip`.
- Use small-viewport height units for full-height panels, so mobile browser bars do not cause jumps.
- A curved edge sized in fractional units leaves a sub-pixel seam against the next section. Overlap by one pixel.
- Two full-size statements exchanging in place read as theatrical. The approved behaviour keeps the statement still.
- Greek display type needs looser leading, or descenders touch the accents on the line below. Line masks must leave room for accents and descenders.
- A circular mask on the raster symbol clips if the mask is sized exactly to the ring. Leave a margin.
- The arc must cross the header only in the gap between the name and the navigation, at every width.

## 10. Acceptance checks for the motion phase

1. With reduced motion on, every page is complete, readable and correctly ordered.
2. With scripting disabled, every page is complete and readable.
3. Keyboard focus order matches reading order through the hold and the sticky panels.
4. No horizontal scrolling at any width.
5. The performance targets hold with motion on.
6. Scrolling feels native: no delay, no easing applied to the scroll itself, no snapping.

7. In a browser without scroll-linked CSS, the narrative is complete: statement and supporting line, project handoffs, and the Contact resolution at rest.

## 11. Status

Locked: CSS-first motion, no library at setup, GSAP considered at the motion stage for the Contact sequence only, scroll-linked CSS as enhancement only, native scrolling.

One point follows from the brand asset plan and is not an open architecture decision: if the vector master is late, the Contact section launches in its resting state (step 1) and the full sequence follows when the master exists.
