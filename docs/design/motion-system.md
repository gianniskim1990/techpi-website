# TechPi motion system

Status: approved direction (Phase 1 review). Design intent only. No library or implementation is chosen yet.
Date: 2026-10-02 (revised after approval)

Revision note: the arc is the signature device and must stay rare. The whole circle is revealed fully only once, near the end of the experience. Arc geometry will be derived from the real logo, which has not been supplied yet.

## 1. Motion philosophy

**Motion is how the page turns.** It exists to move the reader from one idea to the next and to show which idea matters now. If a motion cannot be described in a sentence beginning "this shows that", it is removed.

Four principles:

1. **One circle.** All large movement is the same oversized circle from the Pi symbol shifting position. This gives the site one physical logic.
2. **Uncover, do not fly.** Things appear by being revealed from behind an edge. Nothing travels far. (One approved
   exception: the homepage intro, section 14.)
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
| Autoplaying or looping motion | 0 (except the homepage intro, section 14, on each entry to the homepage; it never loops) |

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

Approved 2026-10-09 (Option A, typographic handoff), refined the same day: blurred backdrop, original footage inside
the symbol, type in front. The one long-distance flight on the site, and the one motion that plays without the
reader's input. It shows that the TechPi symbol and the TechPi name are the same thing.

Implementation: `src/components/home/Intro.astro` (markup, the CSS half of the choreography), `src/scripts/intro.ts`
(footage, flight and handoff, Web Animations API), the homepage-only head script in `src/layouts/BaseLayout.astro`
(eligibility). Media: `src/assets/intro/`, made by `scripts/brand/intro-footage.html` and
`scripts/brand/derive-intro-media.mjs`.

**When it plays.** On every entry to the homepage (`/` and `/el/`). Owner's decision, 2026-10-09, replacing the
first version's once-per-browser rule: a direct load, every reload, a link from another page, a switch between the
English and Greek homepages, and back/forward, including a page restored from the back/forward cache (the module
restarts the intro on `pageshow`). Not when a tab merely comes back into view. Never on another page or a 404.

Not with reduced motion, Save-Data, a `#fragment` in the URL, for a prerendered page, or when scripting is off. Not
when a reload or Back would restore a scrolled-down page: the module records each homepage history entry's scroll
position in that entry's own `history.state` (as scrolling settles and on `pagehide`), and the head script reads it
before first paint; a page restored from the cache is checked directly. Decided by a homepage-only inline script in
the head, before first paint, so the page is never seen bare first.

**No storage.** Nothing is kept in `localStorage`, `sessionStorage` or cookies. A `techpi-intro-seen` value left by
the first version is ignored, and blocked storage changes nothing. The only state is the scroll offset above, in the
browser's own session history for that page.

**Backdrop.** The real homepage stays visible under the intro, blurred (`backdrop-filter: blur(28px)`, 18 px on phones)
under an Ink tint (84%) with a faint TechPi Blue light behind the symbol. Not a solid colour, not a frosted card. Where
`backdrop-filter` is not supported, the tint deepens to 95% Ink. The hero's own entrance plays under the blur, so the
page behind is the real page settling, and it is at rest when the backdrop clears. The backdrop leaves by opacity only.

**Footage.** About 2 s of original footage, made for this intro: hairline threads drift in from scattered points, bend
into one connected line through the centre and branch out again to a few outputs, while arcs of the one circle turn
slowly and cyan light travels through the nodes; a slow camera move gives depth. It is the homepage's own idea
(fragmented to connected) in motion, in TechPi colours only (Ink, TechPi Blue, Cyan, Sheet), darker in its lower part
where the type crosses. Rendered offline, frame by frame, from a seeded scene on a canvas in Chrome
(`scripts/brand/intro-footage.html`) and encoded by Chrome's own MediaRecorder: 640 × 640, 24 fps, 2.0 s, no audio.
VP9 WebM (120 KB) with an H.264 MP4 fallback (108 KB), and a WebP poster of its first frame (17 KB). No stock media, no
external source, no runtime generator.

**Mask.** The footage is visible only inside the symbol: CSS `mask-image` with `src/assets/intro/techpi-symbol-mask.webp`,
the alpha channel of the approved `techpi-symbol-white.png` itself at 800 px (24 KB), with the artwork's invisible alpha
dither (246 to 254, 1 to 9) set to exactly opaque and transparent. Nothing traced or redrawn: the derive script checks
that the mask's coverage equals the artwork's (59.60%). Over the footage, the same 3D symbol in `soft-light` at 55%
keeps the ribbons' depth. The mask moves with the symbol, so it holds at any scale.

**Timeline** (from the first frame of the overlay; target 3.0 s, measured 3.01 to 3.03 s at every tested size, and at
1×, 4× and 6× CPU throttling):

| Time | What happens | How |
|---|---|---|
| 0 | Blurred, tinted backdrop over the page; a Sheet hairline circle (32%) draws clockwise from the top, 700 ms | CSS, `pathLength="1"` in pixel units, as the hero arc |
| 0.3 s | The symbol settles from 0.94 to 1, 600 ms; the footage plays inside it if it is playing by 1.0 s | CSS; script |
| 0.6 s | "Digital Products / & Technology" (EL "Ψηφιακά προϊόντα / & τεχνολογία") rises line by line in front of the symbol, 800 ms, 120 ms apart | CSS masked lines; copy in `home.*.ts` (`intro.line`) |
| 1.7 s | The white 3D symbol returns over the footage, 250 ms | WAAPI |
| 1.82 s | The type sinks back into its masks; the circle fades | CSS |
| 2.0 s | The symbol flies onto the header's own symbol, 600 ms, `cubic-bezier(0.55, 0, 0.25, 1)`: it leaves as slowly as before and decelerates into place | WAAPI, one transform |
| 2.5 s | The name rises out of a mask (240 ms), in Sheet, beside the arriving symbol, on the dark backdrop | WAAPI on a decorative twin of the name |
| 2.6 s | The symbol has settled exactly over the header's symbol (same centre, same size) | (end of the flight) |
| 2.6 s | The backdrop fades, 400 ms | WAAPI, opacity |
| 2.768 s | In one frame: the backdrop steps across the luminance band where neither Sheet nor Ink reaches 4.5:1, the twin and the white symbol leave, the real Ink name with its blue symbol and the navigation arrive (the navigation uncovered from the left) | WAAPI, all on the compositor |
| 2.95 s | The language switch arrives (its inactive language is Slate, which needs the lighter background) | WAAPI |
| 3.0 s | `finishIntro()`: every temporary element, class, animation, listener and video source removed | script |

The script places its animations on the document timeline as soon as it starts, so the compositor plays them on time
even while the main thread is busy with the page's first layout. Just before the flight the destination is measured
again. A script that starts after 1.9 s shifts the rest so the flight still plays whole; one that starts after 2.6 s
ends the intro.

**Geometry.** Measured just before the flight, never from fixed coordinates: the header's own symbol
(`.site-header > .site-name .site-mark`, never the menu dialog's copy) through `getBoundingClientRect()`. The overlay's
symbol is translated so its centre is the target's centre and scaled to the target's width (28 px), so it lands exactly
over the blue symbol. The name's Sheet twin is placed over the word beside it, from the measured rectangle.

**Contrast.** Measured from rendered pixels, not from colour values: the header name, at 10 ms steps from 2.3 to 3.0 s,
never drops below 5.34:1, and the navigation never below 4.65:1, at 1440, 768, 390 and 320 in both languages. The
intro's type against the moving footage and the blurred page: every glyph at 4.5:1 or more against the pixels beside
it, over all footage frames, with one exception: where the 1 px decorative circle touches the edge of a letter.

**Skip.** Any key, pointer press or tap, wheel, scroll, focus, a resize to another width (a height-only change, such as
a mobile address bar, does not count), an orientation change, leaving the page, the tab going to the background, or
reduced motion switching on: `finishIntro()` runs at once. It never prevents the input, a tap on the overlay never
activates the page under it, and focus is never moved.

**Fail-safes and fallbacks.** The head script removes the class if the module has not started within 2.5 s. The module
ends the intro 3.6 s after the overlay's first frame whatever happens, and at once on any error. The footage is never
waited for: if the video fails, autoplay is refused or it is not playing by 1.0 s, the static 3D symbol stays and the
intro keeps its time. Without scripting, or without its stylesheet, the overlay markup is `hidden`. A page restored from
the back/forward cache never resumes it.

**What loads, and when.** Nothing extra on any visit that does not play the intro: the video has no source and no
poster in the markup (the script attaches them), the symbol images are lazy, and the mask is the CSS image of a hidden
element. A homepage entry that plays the intro uses the mask, one video file, the symbol and the intro module; the
first time they are downloaded, after that they come from the browser cache (`/_astro/*` is served `immutable`, see
`docs/production/security.md`, section 3), so a repeat entry transfers about 1 KB (sizes and timings in
`docs/production/accessibility-performance.md`, section 11).

**Accessibility.** The overlay, the video and the twin of the name are `aria-hidden`, and nothing in them is focusable.
The hero h1 stays in the document and is the page heading throughout. Screen-reader and keyboard users are never held:
the first key or focus ends it.

**Visual constraints.** Brand colours only (Ink, TechPi Blue, Cyan, Sheet, Paper). No rotation, bounce, glow, large
shadows, particles or sound. The only blur is the backdrop's. One circle, one symbol, one line, one flight.
