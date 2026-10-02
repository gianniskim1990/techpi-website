# TechPi motion system

Status: approved direction (Phase 1 review). Design intent only. No library or implementation is chosen yet.
Date: 2026-10-02 (revised after approval)

Revision note: the arc is the signature device and must stay rare. The whole circle is revealed fully only once, near the end of the experience. Arc geometry will be derived from the real logo, which has not been supplied yet.

## 1. Motion philosophy

**Motion is how the page turns.** It exists to move the reader from one idea to the next and to show which idea matters now. If a motion cannot be described in a sentence beginning "this shows that", it is removed.

Four principles:

1. **One circle.** All large movement is the same oversized circle from the Pi symbol shifting position. This gives the site one physical logic.
2. **Uncover, do not fly.** Things appear by being revealed from behind an edge. Nothing travels far.
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
| Autoplaying or looping motion | 0 |

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
