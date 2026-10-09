# TechPi motion system

Status: approved direction (Phase 1 review). Design intent only. No library or implementation is chosen yet.
Date: 2026-10-02 (revised after approval)

Revision note: the arc is the signature device and must stay rare. The whole circle is revealed fully only once, near the end of the experience. Arc geometry will be derived from the real logo, which has not been supplied yet.

## 1. Motion philosophy

**Motion is how the page turns.** It exists to move the reader from one idea to the next and to show which idea matters now. If a motion cannot be described in a sentence beginning "this shows that", it is removed.

Four principles:

1. **One circle.** All large movement is the same oversized circle from the Pi symbol shifting position. This gives the site one physical logic.
2. **Uncover, do not fly.** Things appear by being revealed from behind an edge. Nothing travels far. (One approved
   exception: the first-visit homepage intro, section 14.)
3. **The reader drives.** Structural motion follows scroll position. Nothing loops or plays by itself.
4. **Calm.** Slow starts are avoided, endings are soft, nothing bounces or overshoots.

The motion budget for the homepage:

| Motion | Count |
|---|---|
| Pinned sequences | 2 (hero, selected work) |
| Arc handoffs between surfaces | 3 (a maximum, not a target. Reduce if any one fails the "this shows that" test) |
| Moments where the whole circle is visible | 1 (contact section only) |
| Text line reveals | One per section statement |
| Image reveals | Case-study imagery only |
| Autoplaying or looping motion | 0 (except the one-time first-visit intro, section 14; it never loops) |

## 2. Scroll behaviours

- Native scrolling always. Scroll input is never intercepted, smoothed, snapped or slowed.
- No scroll-snap on the page. No horizontal scrolling sequences.
- Two kinds of scroll-linked behaviour:
  - **Scrubbed:** progress is tied directly to scroll position. Used for the arc and for surface handoffs. Reversible.
  - **Triggered:** plays once at its own tempo when the element enters the viewport. Used for text and image reveals. Does not replay on re-entry.
- Trigger point: when the top of the element reaches about 80% of the viewport height.
- Anchor links and keyboard navigation land on the final, fully revealed state of a section.

## 3. Text reveal system

One reveal for statements.

- The text is split into **lines**. Each line sits inside a clipping box and rises from 100% below its baseline to rest. Opacity stays at 1.
- Lines follow in reading order with a fixed stagger.
- No per-character or per-word animation.
- Used for: display statements only (level-1 text). Supporting text and labels fade in as one block, 20 px rise at most.
- Body text in long-form pages is not animated.

Requirements:

- The accessible text is a single unsplit string. Visual line wrappers are hidden from assistive technology.
- Lines are computed after fonts load and recomputed on resize and on language change.
- Text is visible by default. The hidden starting state is applied only once scripting is confirmed to be running, so a script failure leaves a readable page.
- The hero statement is exempt from waiting. It is the first paint and it reveals with a CSS-only version or not at all.

## 4. Pinned section rules

- At most two pinned sequences on any page.
- A pin holds for a fixed, short scroll distance:
  - Hero: about 100% of viewport height of extra scroll, two states.
  - Selected work: one viewport height per case study.
- Each scroll step during a pin must deliver new content. No empty scroll.
- Pinning is done with normal document flow and sticky positioning in principle, so content order, keyboard focus order and find-in-page keep working.
- A visible indication of progress is shown in the work sequence ("1 of 3").
- No pin on viewports below 1024 px wide, on short viewports (below 640 px high), or with reduced motion.
- The header remains usable during a pin.

## 5. Image reveal rules

- **Case-study images:** revealed by a circular clip that expands from the direction of the arc until it clears the frame. Scale settles from 1.06 to 1.0 during the reveal.
- One reveal style for all case imagery. No alternating directions.
- Other images (About, inner pages): opacity fade only.
- Images never move with parallax faster or slower than 8% relative to scroll.
- Image space is reserved before load. No layout shift.

## 6. The arc

- A single circle with a radius of roughly 1.5 to 2 times the viewport width, positioned mostly off-canvas.
- Rendered as a hairline, or as the curved edge of the next surface.
- Scrubbed to scroll: it rotates or translates by a small amount (a few degrees over a full section).
- **Arc handoff:** the incoming surface is clipped by the circle. As the reader scrolls, the circle's edge sweeps across the viewport and the new surface replaces the old one. Used at three boundaries on the homepage: into Selected work, into Intelligence, into Contact.
- Text is never positioned under the moving edge. The edge crosses empty space, and the incoming section's text reveal begins after the edge has passed.
- In the contact section the circle completes once, resolving into the symbol.

**Rarity.** The arc must not become repetitive decoration. Before any use is accepted it must pass three checks: it marks a real change of section or surface, it appears nowhere else in the same screen, and removing it would make the transition less clear. Before the contact section, the circle is only ever seen as a segment.

Final geometry (curvature, line weight, the angle of the opening, the direction of travel) is to be derived from the real logo symbol. Until the logo files are inspected, all arc values in these documents are placeholders. See `phase-2-proposal.md`.

## 7. Easing philosophy

Two curves for the whole site.

| Name | Curve | Use |
|---|---|---|
| Reveal | `cubic-bezier(0.16, 1, 0.3, 1)` | Things arriving: line reveals, image reveals, menu opening. Fast start, long soft landing |
| Shift | `cubic-bezier(0.65, 0, 0.35, 1)` | Things changing state in place: header, accordions, hover |

- Scrubbed motion is linear to scroll. No added smoothing lag beyond a very short catch-up (under 100 ms) if any.
- No bounce, elastic or spring overshoot.

## 8. Durations

| Token | Value | Use |
|---|---|---|
| instant | 100 ms | Pressed states |
| fast | 150 to 200 ms | Hover, focus, small UI changes |
| base | 400 ms | Header changes, block fades |
| reveal | 700 ms | One line of a text reveal |
| slow | 1000 ms | Image reveal |
| max | 1200 ms | Upper limit for any triggered motion |

Interface feedback always responds in under 200 ms.

## 9. Stagger rules

- Between lines of a statement: 80 ms.
- Between sibling blocks (label, lead, action): 100 ms, at most three items.
- Total sequence, from first movement to last element at rest: no more than 1.4 s.
- List rows (capabilities, facts) do not cascade one by one. A list appears as a single block.

## 10. Reduced-motion behaviour

When the user requests reduced motion:

| Feature | Behaviour |
|---|---|
| Pinned sequences | Off. Sections stack as a normal page |
| Arc handoffs | Off. Surfaces change at a straight edge |
| Arc | Static, in a composed position |
| Line reveals | Off. Text is simply present |
| Image reveals | Off, or a 200 ms opacity fade |
| Parallax and scale | Off |
| Hover and focus transitions | Kept, 150 ms or less |
| Smooth scrolling to anchors | Off. Instant jump |

The reduced-motion page is designed and reviewed as a layout in its own right, not treated as a fallback.

## 11. Mobile simplification

Below 1024 px:

- No pinning. Hero is a single state. Case studies are stacked panels.
- No arc handoffs. Surface changes are straight. The arc appears as a static cropped line in the hero and contact sections.
- Line reveals are kept for section statements, with shorter duration (500 ms) and 60 ms stagger.
- Image reveals become a simple fade.
- No hover-dependent behaviour.
- Nothing reacts to device orientation or tilt.

## 12. Performance constraints

Targets on a mid-range phone on a 4G connection:

| Metric | Target |
|---|---|
| Largest Contentful Paint | under 2.0 s |
| Cumulative Layout Shift | under 0.05 |
| Interaction to Next Paint | under 200 ms |
| Frame rate during scroll | 60 fps, no long frames over 50 ms |
| Script for motion | about 60 KB compressed or less |

Rules:

- Animate only transform, opacity and clip-path. Never layout properties.
- No blur, backdrop-filter or large shadows in motion.
- No scroll event handlers doing layout work. Use observers and scroll-linked timelines.
- At most one clipped full-viewport layer animating at a time.
- Off-screen sections do no work.
- Motion code loads after first paint. The page is complete and readable before it arrives.
- Images are responsive, modern formats, lazy-loaded below the first screen, with reserved dimensions.
- Fonts: self-hosted, subset per language, hero weight preloaded, with a metrics-matched fallback to avoid shift.
- If the device reports low power or frames drop, scrubbed effects switch off and the reduced set is used.

## 13. Accessibility requirements for motion

- Nothing flashes.
- Nothing moves for more than five seconds without user input, so no pause control is needed.
- All content is available without motion and without scripting.
- Focus is never moved by an animation. Focused elements are always fully visible and unclipped.
- Keyboard users who tab into a pinned sequence see the focused content in its final state.

## 14. Intro: the symbol becomes the name

Approved 2026-10-09 (Option A, typographic handoff). The one long-distance flight on the site, and the one motion that
plays without the reader's input. It shows that the TechPi symbol and the TechPi name are the same thing.

Implementation: `src/components/home/Intro.astro` (markup, the CSS half of the choreography), `src/scripts/intro.ts`
(the flight and the handoff, Web Animations API), the homepage-only head script in `src/layouts/BaseLayout.astro`
(eligibility), and one rule in `src/components/home/Hero.astro` (the hero entrance waits).

**When it plays.** On the homepage only (`/` and `/el/`), once per browser, on the first visit to either language.
Never on another page or a 404. Not with reduced motion, Save-Data, a `#fragment` in the URL, on a reload, on
back/forward or a prerender, and not when scripting is off. Decided by a homepage-only inline script in the head, before
first paint: a returning visitor never sees the overlay, a first visitor never sees the hero first.

**Storage.** `localStorage` key `techpi-intro-seen` = `1`, written as the intro starts, shared by both languages. It
is a one-time visual preference: no identifier, never sent anywhere, no cookie. If storage cannot be read or written
(blocked, private modes that throw), the intro does not play: it cannot promise to play only once, so it does not play.

**Timeline** (from the first frame of the overlay; target 3.0 s, measured 3.01 to 3.02 s at every tested size):

| Time | What happens | How |
|---|---|---|
| 0 | TechPi Blue overlay over the page; a Sheet hairline circle (42% opacity) draws clockwise from the top, 700 ms, Reveal curve | CSS, `pathLength="1"` dash offset, as the hero arc |
| 0.3 s | The white 3D symbol fades in and settles from 0.94 to 1, 600 ms, Reveal curve, centred in the circle | CSS, transform and opacity |
| 0.6 s | One line rises out of a mask under the circle: "Digital Products & Technology" / "Ψηφιακά προϊόντα & τεχνολογία", 800 ms | CSS; copy in `home.en.ts` / `home.el.ts` (`intro.line`) |
| 1.9 s | Line and circle fade out, 300 ms. The destination is measured | CSS; script |
| 2.0 s | The symbol flies to the header name, 600 ms, `cubic-bezier(0.55, 0, 0.75, 0)` (accelerating, no overshoot) | WAAPI, one transform |
| 2.3 s | The real header name appears in Sheet on the blue, 200 ms | WAAPI, opacity |
| 2.52 s | The symbol dissolves into the name, 240 ms | WAAPI, opacity |
| 2.6 s | The overlay fades, 400 ms, Shift curve; the navigation and language links fade in; the hero entrance starts | WAAPI; class `intro-hold` removed |
| 2.767 s | The name turns Ink, in one step, when the fading blue behind it is exactly between Sheet and Ink (about 4.3:1 against either; a gradual change would pass through a grey that matches the background) | WAAPI |
| 3.0 s | `finishIntro()`: every temporary class, animation and listener removed | script |

The script places all of its animations on the document timeline as soon as it starts, timed from the overlay's first
frame, so the compositor plays the flight and the fades on time even while the main thread is busy with the page's
first layout (measured: 3.01 to 3.03 s at 1×, 4× and 6× CPU throttling). Just before the flight the destination is
measured again and the flight updated. A script that starts after 1.9 s shifts the rest so the flight still plays
whole; one that starts after 2.6 s ends the intro.

**Geometry.** Measured just before the flight, never from fixed coordinates: the text of `.site-header > .site-name`
(never the menu dialog's copy), through a Range (the letters, not the padded link box). The landing point is the
centre of the capitals: the baseline is one font ascent below the top of the text box, and the cap height comes from
`measureText()` on the name's own computed font. The letter-spacing after the last letter is excluded. The symbol
lands 1.6 × the cap height wide (19 px at the 16 px name). This follows the viewport, browser zoom, device pixel ratio
and both languages' header layouts. The wait for the name's font is bounded at 120 ms. Measured landing error: under
1 px at all five tested sizes in both languages.

**Header.** While `html.intro` is set (homepage only), the header sits above the overlay, its name and controls at
opacity 0 but still in place, in the accessibility tree and reachable. No other header state is involved: the intro
ends on any scroll, so the compact and hidden states never meet it. When it ends, the header is exactly the resting
typographic header.

**Hero.** Its CSS entrance (lines, rule, support, arc, map) is paused at its first frame under `html.intro-hold` and
starts, whole, as the overlay clears. Nothing is removed or duplicated: the same animations run as on any other visit.

**Skip.** Any key, pointer press or tap, wheel, scroll, focus, a resize to another width (a height-only change, such as
a mobile address bar, does not count), an orientation change, leaving the page, the tab going to the background, or
reduced motion switching on: `finishIntro()` runs at once. It never prevents the input: the key, tap or scroll still
does its job, and a tap on the overlay never activates the page under it. Focus is never moved.

**Fail-safes.** The head script removes both classes if the module has not started within 2.5 s (measured: exactly
2.5 s with the module removed). The module ends the intro 3.6 s after the overlay's first frame whatever happens (4.5 s
after its own start if that frame cannot be found), and at once on any error. Without scripting, or without its stylesheet, the
overlay markup is `hidden`. A page restored from the back/forward cache never resumes it.

**Images.** The symbol is a lazy `<img>` (BrandSymbol, 240/360/480 px WebP): inside a hidden overlay it is never
requested, so returning visitors and every other page download nothing extra. On a first visit it costs 16 KB (desktop)
or 26 KB (phones at 2×). The 480 px file is the one the Contact section also uses.

**Accessibility.** The overlay is `aria-hidden` and has nothing focusable. The hero h1 stays in the document and is the
page heading throughout. Screen-reader and keyboard users are never held: the first key or focus ends it.

**Performance cost (first visit only, measured, see the PR record).** The reader sees the headline about 2.6 s later on
desktop and about 3.1 s later on a 4× throttled phone. Chrome's LCP does not show this: it counts the headline as painted
under the overlay at first paint (desktop), or reports the symbol image as LCP (phones, +0.1 to 0.25 s). Lighthouse
Speed Index does not capture it either. Returning visits are unchanged within run-to-run noise.

**Visual constraints.** Brand colours only (TechPi Blue, Sheet, Ink, Paper). No rotation, bounce, blur, glow, shadow,
particles or sound. One circle, one symbol, one line, one flight.
