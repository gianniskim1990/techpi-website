# TechPi accessibility and performance audit

Status: Phase 6 (2026-10-09), on `phase-6-accessibility-performance`, starting from `main` at `36efa91`. The site is
still `noindex`. This is an engineering audit with automated and scripted manual checks. It is **not** a WCAG
conformance certification or an accessibility statement, and it contains **no field data** (the site is not public).

## 1. Method and tools

| Item | Value |
|---|---|
| Browser | Chrome 154.0.8037.98, headless, driven by Playwright-core 1.64.0 |
| Automated accessibility | axe-core 4.14.0 (WCAG 2.0/2.1/2.2 A and AA, best-practice tags) |
| Lab performance | Lighthouse 13.5.0 (mobile and desktop presets), plus Chrome-trace and `PerformanceObserver` runs |
| Serving | `wrangler dev` (Wrangler 4.147.0) so `_headers` and `_redirects` apply, as on Cloudflare |
| Baseline | `main` at `36efa91`, built separately and served next to the working build, same browser and settings |
| Pages | All 20 (9 EN, 9 GR, one test 404 each) |
| Viewports | 1440×900, 1280×800, 1024×768, 768×1024, 390×844, 360×800, plus 320 CSS px (400% zoom), 640 (200% zoom) |

The test harness is throwaway and lives outside the repository. The only tooling added to the repository is
`scripts/assets/validate.mjs` (section 7).

Known limits of this audit:

- **Chromium only.** No Firefox or WebKit/Safari was available to automate. Cross-browser behaviour (notably Safari
  scroll-driven rendering, `100svh`, `clip-path` masks and font loading) is untested and listed in section 9.
- **No screen reader was run** (NVDA, JAWS, VoiceOver, TalkBack). Names, roles and states were checked through the
  accessibility tree and axe, which is not the same as listening to the page.
- **axe cannot decide `color-contrast` for text over images or gradients.** Contrast was therefore measured separately
  from rendered pixels (section 3.3).
- **All performance numbers are lab numbers** from a fast desktop CPU with throttling applied, over loopback. They are
  not Core Web Vitals field data, which only exist once real users visit.

## 2. Result in one table

| Area | Baseline (`main`) | This branch |
|---|---|---|
| axe violations, 20 pages × 3 viewports, reduced motion | 1 rule: `label-content-name-mismatch` (258 nodes) | **0** |
| axe violations, motion mode (after scrolling through) | not run on baseline | **0** (one dim-text violation found and fixed, 3.2) |
| Focus hidden under the auto-hiding header (WCAG 2.4.11) | 135 of 307 sampled focus stops | **0 of 307** |
| Forced-colors: link underline and CTA pill | both disappear | both visible |
| Lighthouse accessibility | 100, with `label-content-name-mismatch` failing | 100, nothing failing |
| `dist` size | 3316 KB, 67 files | ≈2025 KB (byte sum), 62 files |

## 3. Accessibility

### 3.1 Confirmed defects and what was done

| # | Finding | Criterion | Fix |
|---|---|---|---|
| 1 | Language-switch links had `aria-label` "English"/"Ελληνικά" while their visible text is "EN"/"ΕΛ". The case-study "next project" link had an `aria-label` that did not contain its visible words. 258 nodes. | 2.5.3 Label in Name | Switch label is now "EN, English" / "ΕΛ, Ελληνικά" (visible text first). The next-project link now takes its name from its visible text. |
| 2 | A backward Tab walk could focus an element sitting under the header that slides back in on scroll-up. 135 of 307 sampled stops at 390 px, headline items at `top: 12px`. | 2.4.11 Focus Not Obscured (Minimum) | `src/scripts/motion.ts`: the header stays hidden while the focused element is under it, and a `focusin` handler hides it if focus lands under it. Skip link and the header's own descendants are ignored. After the fix: 0 of 307, and 14 backward walks across both languages and two widths found no issue. |
| 3 | In forced-colors mode the gradient underline on text links and the pill on the primary CTA are dropped, so links look like plain text. | 1.4.1 Use of Color (and general operability) | `src/styles/base.css`: inside `@media (forced-colors: active)` only, links get a real 1px underline and the CTA a 1px `currentColor` border. Normal rendering is byte-identical. |
| 4 | The second line of the Intelligence heading fades to 45% opacity while the scene is pinned, **2.45:1** on Ink at 93 px, under the 3:1 large-text minimum. Found by axe in motion mode (reduced-motion rendering is not affected). | 1.4.3 Contrast (Minimum) | `Intelligence.astro`: the fade stops at 60% opacity, ≈3.4:1. The intent (the "noise" line recedes) is kept. |

Defects 1 to 4 are real, were reproduced before the fix, and were verified after it. Nothing else was changed for
accessibility.

### 3.2 What passed

- **axe**: 60 page loads in each of two modes (reduced motion, and motion after scrolling through) return no
  violations. `color-contrast` stays "needs review" (875 and 1109 nodes) because of gradients and layered backgrounds,
  which is why 3.3 exists.
- **Landmarks, headings, names, alt text, skip link, `lang`, duplicate ids, ARIA**: a static pass over all 20 `dist`
  pages (360 checks) found only harness artefacts (a closed dialog's navigation counted as a second "Primary" nav, and
  `alt` serialised as a boolean attribute, which is a valid empty alt). EN and GR structure is identical across all 10
  page pairs.
- **Language of parts (3.1.2)**: English phrases inside Greek pages are proper names or technical terms, which are
  exempt. No Greek runs appear in English pages.
- **Keyboard (2.1.1, 2.1.2, 2.4.3, 2.4.7)**: forward Tab through all 20 pages at 1440 and 390: every stop shows a
  visible indicator, none is off-screen or covered, no trap. Focus ring contrast: blue on paper 6.96:1, cyan on ink
  11.73:1, white on blue 7.67:1.
- **Mobile menu dialog**, English and Greek at 360, 390 and 768, on `/work` and `/`: opens by keyboard, `aria-expanded`
  updates, focus moves into the dialog, the page behind is inert, scroll is locked under wheel input, Tab stays inside,
  Escape closes and returns focus, Space and Enter work, resizing to desktop closes it, the language link points to
  the exact counterpart page, and navigating closes it.
- **Target size (2.5.8)**: 690 pointer targets at 1440 and 390; 48 are under 24×24 CSS px and 44 of those are inline
  links in running text or have a clear 24 px circle. The remaining 4 are inline links in a comma-separated sentence
  ("Seen in Rocketeer, Arman's…"), which the inline exception covers. No failure.
- **Reflow and resize (1.4.4, 1.4.10, 1.4.12)**: at 320 px and at 640 px (200% zoom) no page scrolls horizontally and
  no text is clipped. Text spacing at 1440 and 390 produced no loss of content. The "overlap" flags in the raw output
  are bounding boxes of wrapped inline links and tight display-heading leading, checked on screenshots.
- **Contrast, measured from pixels** (text colour × opacity against the rendered background): 1390 text runs at 1440
  and 1310 at 390, lowest ratio 5.00:1, none below AA, in the resting state of each scene.
- **No horizontal overflow, clipped text or broken images** across 6 viewports × 20 pages, in motion and reduced-motion
  modes.

### 3.3 Needs human judgment (not failures)

1. **Text-only 200% (not browser zoom) at a 390 px viewport** makes the long single words in the largest headings
   ("Logotherapia Xanthi", "Τεχνολογία για ευρωπαϊκά…") 6 to 130 px wider than the screen on a few pages, giving a
   sideways scroll. Browser zoom (the usual route, and the 1.4.10 test) is clean. Not changed: wrapping the display
   headings would alter the design.
2. **Transformation-map labels are 11 px at ≤390 px.** The map is `aria-hidden` decoration, so there is no WCAG
   failure, but it is below the design system's 14 px minimum.
3. **Alt text** on the case-study cover and the "whole picture" image is identical, so a screen reader hears it twice.
   Not a failure; an editorial choice for the launch copy review.
4. **Greek and English screen-reader output, and any assistive-technology behaviour of the pinned scroll scenes, need a
   real run with NVDA and VoiceOver.**
5. **Accessibility statement.** `launch-blockers.md` already holds the open decision on committing to WCAG 2.2 AA; this
   audit does not settle it.

## 4. Motion

- Reveals, sequences, masked headings, parallax, hover captures, header, contact circle and transformation map were
  tested at rest at many stationary scroll positions: the homepage in both languages (41 to 68 positions per
  viewport at 1440, 1024 and 390) and content pages at 1440 and 768. **No content stays permanently hidden.** The
  only hits are `[data-sequence]` sections that clip themselves by design, and a 0.9-opacity paragraph.
- **Native scroll stays native**: nothing intercepts wheel, touch or keyboard scrolling; scenes read the scroll
  position and write CSS custom properties.
- **Reduced motion**: nothing is hidden. **JavaScript off** at 1440, 1024 and 390: all content visible and navigation
  reachable. The only flags are intentional (EU Projects text at 0.85 to 0.9 opacity, and the desktop-only hero CTA).
- **"Greek desktop Contact heading mid-reveal"** (recorded earlier): confirmed **transient, not a defect**. After the
  section enters, about 0.9 s of the heading is mid-transition, then it settles fully, in both languages.
  No change made.

## 5. Performance (lab)

All figures: median of 5 runs, cold cache, loopback. Throttling is Chrome DevTools CPU throttling. "Phone" is a
390×844 viewport with mobile emulation. LCP target 2.5 s, CLS 0.1, INP 200 ms.

### 5.1 Lighthouse (3 runs each)

| Page | Preset | Baseline perf / FCP / LCP / TBT | This branch perf / FCP / LCP / TBT |
|---|---|---|---|
| `/` | mobile | 100 / 958 / 1302 / 0 | 100 / 931 to 1243 / 1306 / 0 |
| `/el/` | mobile | 100 / 968 / 1158 / 0 | 99 to 100 / 967 / 1229 / 0 |
| `/work` | mobile | 100 / 947 / 1671 / 0 to 41 | 100 / 949 / 1672 / 0 |
| `/eu-projects` | mobile | 95 to 100 / 992 / 1276 / 0 to 235 | 100 / 1226 / 1368 / 0 |
| `/` | desktop | 100 / 338 / 409 / 0 | 100 / 336 / 407 / 0 |

Accessibility is 100 on every run. Best practices 100. SEO is 66 to 69 on both sides only because every page is
`noindex`, which is intended. CLS 0 on all pages except 0.0004 on `/el/` (unchanged). Transfer: 269 KB on `/`, 74 KB
on `/eu-projects`.

The baseline's 95/96 on `/eu-projects` mobile (TBT 235 ms) was a sporadic first-run long task, not seen on this
branch's three runs.

### 5.2 Throttled lab runs (`PerformanceObserver`, 5 runs)

| Page and profile | Baseline LCP / max long task | This branch LCP / max long task |
|---|---|---|
| `/` desktop, no throttle | 440 ms / 193 ms | 356 ms / 150 ms |
| `/work` desktop | 300 ms / 111 ms | 212 ms / 79 ms |
| `/` phone, CPU 4× | 1828 ms / 882 ms | 1816 ms / 846 ms |
| `/el/` phone, CPU 4× | 2176 ms / 968 ms | 2104 ms / 928 ms |
| `/eu-projects` phone, CPU 4× | 2124 ms / 666 ms | 2072 ms / 671 ms |
| `/` phone, CPU 6× | 2460 ms / 1488 ms | 2672 ms / 1516 ms |
| `/eu-projects` phone, CPU 6× | 3004 ms / 1250 ms | 2820 ms / 1167 ms |

Reading it honestly:

- **Desktop improved** (about 80 ms less LCP, shorter long tasks). The baseline was run first in each sequence, so a
  part of that may be warm-up; do not claim it as a win.
- **Phone 4× is statistically the same** (differences of 1 to 6%, inside run spread).
- **Phone 6× on `/` is slightly worse in this run** (+2%), inside the spread (baseline range 2368 to 2592 ms, this
  branch 2376 to 2728 ms). 6× is harsher than Lighthouse's own mobile profile and is shown for stress only.
- **CLS is 0 everywhere except 0.0004 on the homepage**, same as baseline.
- INP cannot be measured honestly in a lab without real interaction patterns. Interaction handlers are light (menu
  toggle, scroll scenes in `requestAnimationFrame`), but **INP has no value here**; collect it in the field after
  launch.

### 5.3 Scroll frame timing (full-page programmatic scroll, 3 runs, 60 Hz)

| Page | CPU | Baseline frames over 33 ms / over 50 ms | This branch |
|---|---|---|---|
| `/` | 1× | 0 / 0 | 1 / 0 |
| `/` | 4× | 12 / 4 | **4 / 1** |
| `/el/` | 4× | 15 / 3 | **4 / 1** |

The scene `measure()` change (a performance change, not an accessibility one) reads every rect first and then writes
every custom property, instead of interleaving. Output was compared across 2322 scene values on 5 pages and viewports:
identical. Under 4× throttling it removes about two thirds of the dropped frames during scroll.

### 5.4 The hero long task (about 450 to 480 ms at 4×)

Investigated with traces and init timing:

- It is **not script**. Initialisation at 4× totals about 57 ms (hero map ≈20, scenes ≈32, reveals ≈4, header ≈2,
  cursor ≈1).
- It is **the first Layout of the page**, which is expensive and sporadic: 187 to 633 ms at 4× in traces, with a
  typical ≈85 ms long task and spikes of 300 to 860 ms in about 1 of 4 to 5 runs. The spikes also occur on `/about`
  and `/work`, so they are **not hero-specific**.
- **Fonts do not cause it.** Variants of the font stack (with and without the metric-adjusted fallbacks) changed
  nothing.
- **Fixed**: the scene thrash (interleaved reads and writes) in `measure()`.
- **Not changed**: the hero map's `tidy()` write/read interleaving. Its layout depends on `.cut { display: none }` and
  touching it risks the design for a few milliseconds.

On a normal desktop CPU the long task is 150 ms or less; on a throttled phone it is the main cost and does not block
LCP (LCP stays under the 2.5 s target at 4× on every page).

## 6. Fonts

Two self-hosted Commissioner variable WOFF2 files (latin 35.8 KB, greek 15.0 KB), `font-display: swap`, with
metric-adjusted local fallback faces. One preload (the page's own script's primary file, with `crossorigin`).
Verified: exactly two font requests per page, no duplicate fetches, no "preloaded but unused" warning in a normal load,
FCP 212 to 368 ms on desktop. No change needed.

## 7. Images and the five unreferenced originals

Astro marks an original image as "referenced" the moment `.width` or `.height` is read from its metadata, and then
emits the full-size file into `dist` even though only the WebP variants are used. That was the ≈1.3 MB of PNG/JPG
originals.

**Fix, using the public API only:** each project capture in `src/content/projects.ts` now declares its intrinsic
`width` and `height`, and `Crop.astro` and `ProjectMedia.astro` read those instead of `image.src.width`. Result:
`dist` falls from 3316 KB / 67 files to ≈2025 KB / 62 files (−1291 KB). The 25 WebP files (1195 KB) are unchanged and
nothing visible changes (visual regression, section 8).

New `scripts/assets/validate.mjs` (no dependencies, 28 checks, also negative-tested): declared dimensions must match
the PNG/JPEG headers, and no original from `src/assets/projects` may appear in `dist/_astro`. Run it after `build`.

The only private-API route (a `clone` key) was rejected on purpose.

Remaining image note: at 2× DPR the project captures are served at 0.5 to 0.6× of the pixels shown (for example 921 px
natural for 867 CSS px, so about 1.06× at 1× DPR but soft at 2×). This follows from the available source files (2612 px
max) and the existing WebP widths; sharper captures would need new source images, which is a content decision.

## 8. Visual regression, security and SEO regression

- **Visual regression** against the baseline build, 1440×900 and 390×844, 18 pages × 2 viewports = 36 comparisons in
  each of two modes: **reduced-motion 36/36 identical** (one comparison differed once because a lazy-loaded image had
  not yet decoded; three reruns showed 0 diffs), **motion mode 36/36 identical**. The Intelligence line fade change in
  3.1 (#4) is intentional and only appears mid-scroll, so it does not show in resting captures.
- **SEO validator**: 1138 checks, 0 failures; every page `noindex`; 18 sitemap entries; canonicals, hreflang, JSON-LD,
  Open Graph and `robots.txt` unchanged.
- **Security validator**: 334 checks, 0 failures. The inline script hashes in the meta CSP still match, and `_headers`
  is unchanged (the bundled script grew by 0.4 KB; it is external, so it needs no hash).
- Final build: `astro check` 0/0/0, 20 pages built, JS 6.2 KB (2.4 KB gzip), CSS 4 files 75.3 KB.

## 9. Not covered, and what to do next

1. **Firefox, Safari/WebKit and real mobile browsers** were not tested. Run at least iOS Safari and Firefox on the
   homepage scroll scenes and the mobile menu before launch.
2. **Screen readers** (NVDA, VoiceOver iOS, TalkBack) in English and Greek, especially the mobile dialog and the
   pinned scenes.
3. **Field Core Web Vitals** (LCP, CLS, INP) after launch, from real users (for example Cloudflare Web Analytics or CrUX
   once there is traffic). Lab numbers above predict LCP well under 2.5 s and CLS ≈0; they say nothing about INP.
4. **Decision on the WCAG 2.2 AA commitment and an accessibility statement** (already in `launch-blockers.md`).
5. **Text-only 200% on phones** (3.3 item 1) if the design owner wants no sideways scroll there.
6. Cloudflare transport-level performance (HTTP/3, compression, caching of `_astro` immutable assets) can only be
   measured on the deployed domain.

## 10. Reproducing

```
npm ci
npm run check
npm run build
node scripts/assets/validate.mjs
node scripts/seo/validate.mjs
node scripts/security/validate.mjs
```

The axe, keyboard, responsive, motion, JS-off and performance harnesses are not kept in the repository; they were
throwaway Playwright scripts and the tables above are their output.

## 11. Addendum: the homepage intro (2026-10-09)

Branch `feat/homepage-intro-flight`. Design and lifecycle: `docs/design/motion-system.md`, section 14. Storage (none):
`security.md`, section 11.

**Owner's decision, 2026-10-09: the intro plays on every entry to the homepage** (direct load, reload, link, language
switch, back/forward), not only on a first visit. Its cost is therefore recurring: see "Every entry" below. The
measurements in the first table were taken while it still played once per browser; column C is what every entry now
costs on a cold cache, and column D is now what a homepage visit costs only when the intro does not play (reduced
motion, Save-Data, a `#fragment`, a restored scroll position).

### Every entry: the recurring cost

Same browser profile, a first (cold-cache) load and then a new navigation to the same homepage (median of 5):

| | Headline readable | FCP | Bytes transferred | Intro media transferred |
|---|---|---|---|---|
| `/` 1440, cold | 3.27 s | 412 ms | 267 KB | symbol 38 KB, footage 120 KB, mask 24 KB |
| `/` 1440, repeat entry | 3.04 s | 160 ms | 1 KB | none: all from the browser cache |
| `/el/` 390, CPU 4×, cold | 3.89 s | 996 ms | 262 KB | symbol 23 KB, footage 120 KB, mask 24 KB |
| `/el/` 390, CPU 4×, repeat entry | 3.17 s | 276 ms | 1 KB | none |

- Against `main` (headline readable at 1.83 s desktop and 1.36 s on the throttled phone), **every homepage entry now
  costs about 1.2 to 1.8 s** before the headline can be read. That is the approved 3-second intro, now on each entry.
- **Repeat entries download nothing new.** `/_astro/*` (content-hashed build output) is now served
  `Cache-Control: public, max-age=31536000, immutable` (`public/_headers`). Before that, Cloudflare's default
  `max-age=0, must-revalidate` made every entry re-ask for the symbol, the mask and the footage (about 6 KB of 304
  answers and one round trip each), which on a slow phone could push the footage past its 1.0 s window.
- No other page is affected, and the intro still loads nothing on any visit where it does not play. Same tools as section 1, against `main` at `768c0a0` and the first version of the intro (PR
#13 at `14e4ff1`), built and served the same way. A = `main`; B = the first intro (solid blue overlay); C = the refined
intro on a first visit (blurred backdrop, footage inside the symbol, type in front); D = the refined intro's returning
visit.

### What the intro costs, honestly

Chrome's LCP does not show what an intro costs: it ignores what covers the page, and on phones it reports the intro's
symbol as the LCP element. So the table also gives **when the hero headline is readable**: the first moment, polled every
frame, at which every line of the h1 is at rest and nothing of the intro covers it.

| Median of 5 (3 for `/el/`) | A main | B first intro | C refined, first visit | D refined, returning |
|---|---|---|---|---|
| Headline readable, `/` 1440 | 1.83 s | 4.12 s | **3.18 s** | 1.60 s |
| Headline readable, `/el/` 1440 | 1.70 s | 4.27 s | **3.31 s** | 1.66 s |
| Headline readable, `/` 390, CPU 4× | 1.36 s | 4.04 s | **3.56 s** | 1.31 s |
| Chrome LCP, `/` phone 4× + slow network | 2100 ms (h1) | 2264 ms (symbol) | 2352 ms (symbol; 2004 to 3476) | 2100 ms (h1) |
| Chrome LCP, `/el/` phone 4× + slow network | 2300 ms | 2448 ms | 2408 ms | 2380 ms |
| FCP, `/` phone 4× + slow network | 1720 ms | 1708 ms | 1900 ms | 1760 ms |
| CLS | ≤ 0.0004 | 0 | ≤ 0.0004 | ≤ 0.0004 |
| TBT, `/` phone 4× | 1071 ms | 1047 ms | 1088 ms | 1100 ms |
| Lighthouse mobile, `/` and `/el/` | perf 98-100, a11y 100 | perf 72-100, **a11y 97** in 4 of 6 runs | perf 95-100, **a11y 100** in every run | (not run: Lighthouse clears storage) |

- **The refined intro gives the headline back about 0.5 to 1 s sooner than the first one**, because the hero's entrance
  now plays under the blurred backdrop instead of waiting for it. Against `main` a cold-cache entry still costs about 1.3 s
  on desktop and 2.2 s on a throttled phone. Returning visits are unchanged within run-to-run noise.
- **Cold-cache LCP on a throttled phone was 2.81 s before optimisation**, above the 2.5 s line: the mask, poster and
  video competed with the symbol on a slow connection. Fixed by preloading the symbol from the head script (only when
  the intro will play), starting the footage only after the symbol has loaded, and dropping the poster, which was never
  visible. In a dedicated A/B run afterwards: 1.97 to 2.06 s against B's 2.08 s. FCP stays 100 to 200 ms later than B.
- **The Lighthouse accessibility failure of the first intro is gone**: B's name faded in through low contrast; C's name
  rises out of a mask at full colour and hands over to Ink in one frame (see Contrast below).
- **Bytes, cold cache** (Lighthouse transfer): 455 KB against B's 298 KB and A's 269 KB. Video 120 KB (VP9 WebM; MP4
  108 KB for Safari), mask 24 KB, the symbol 23 to 57 KB by screen (B: 16 to 26 KB), intro module 5.2 KB. No extra byte on
  any visit where the intro does not play, or on any other page.

### Frame pacing and the backdrop blur

Two very different results, depending on whether the browser composites on a GPU:

| 3 runs, rAF intervals during the intro | B first intro | C refined |
|---|---|---|
| 1440, software compositing (SwiftShader, the test harness default) | 503 frames, 0 over 50 ms | **148 frames, 65 over 50 ms, worst 167 ms** |
| 1440, GPU (NVIDIA GTX 1650, D3D11), CPU 4× | 494 frames | 476 frames, 0 over 33 ms in the flight and handoff |
| 390, CPU 4×, software compositing | 500 frames | 437 frames, 0 over 50 ms |
| 390, CPU 4×, GPU | | 493 frames, 0 over 33 ms in the flight and handoff |

- On a GPU, the 28 px full-window blur is cheap and the intro is as smooth as the first version; the flight and the
  handoff run on the compositor. Without GPU compositing (software rendering, some locked-down or very old machines,
  virtual machines), a full-window blur at desktop size is expensive and the intro stutters, though it still ends on
  time (the timeline is on the compositor clock). Phones use an 18 px blur over a smaller window and stay smooth even in
  software.
- In a freshly started browser, one or two frames of 67 to 183 ms occur between 0.35 and 0.8 s, when the video element
  loads and its decoder starts (B: 33 to 67 ms at its fade). The flight and handoff stay smooth.
- The intro ends 3.02 to 3.05 s after its first frame at 1×, 4× and 6× CPU.

**If the software-compositing case matters** (not applied): lower the desktop blur to about 12 px, or drop
`backdrop-filter` when the browser reports no GPU (no reliable signal exists; a frame-time probe in the first 300 ms
could switch to the plain Ink tint).

### Contrast

Measured from rendered pixels, not from colour values, stepping the paused timeline:

- **Header name**, 10 ms steps from 2.3 to 3.0 s: lowest 5.34:1 (1440, 768, 390, 320, both languages). Before the fix
  the step was placed from an estimate and the name reached 4.25:1 just before it; it is now placed from measurement.
- **The flying symbol never covers a letter while visible**: its dissolve ends one frame before its path touches the name, computed from the measured flight (checked at 1440, 768, 390, 320).
- **Navigation and language links** through the handoff: lowest 4.65:1. The inactive language (Slate) first measured
  2.33:1 and now arrives once the background is light enough for it.
- **The intro's line of type** against the moving footage and blurred page, every glyph pixel against the brightest
  rendered pixel beside it, over all 19 footage frames: median 10 to 13:1; minimum 4.52 to 6.22:1 by size and language,
  except where the 1 px decorative circle touches a letter's edge (a hairline counted as "background"; with the circle
  hidden every case is at least 4.5:1).

### Tests

| Area | Result |
|---|---|
| Every entry (Playwright, 80 checks), EN/EL at 1440, 390, 360: plays on a direct load, on three reloads in a row, on a language switch both ways, from the Work page through the home link, on Back and on Forward-then-Back; does not replay when the tab is hidden and shown or frozen and resumed; does not play over a page reloaded while scrolled down (the scroll is restored); an old `techpi-intro-seen` value and blocked storage change nothing; never with reduced motion, Save-Data, `#work`, on the Work page or a 404; JavaScript off shows the normal page. Each run: lands within 2 px, masked footage, ends at 3.0 to 3.05 s, clean, no CSP violation | 80/80 |
| Back/forward cache (Chrome with its cache enabled; Playwright disables it by default): Back to the homepage twice per size at 1440, 390, 360, the same document restored each time: the intro restarts from its first frame with masked footage, one video player, and ends clean; Back to a homepage left scrolled down: no intro, position kept | 7/7 |
| Intro matrix (Playwright, 62 checks; reload, language switch, back/forward and blocked storage now expect the intro to play): plays and lands on the name at 1440, 1280, 768, 390, 360 in EN and EL (3.01 to 3.03 s, symbol within 1 px of the name's centre), never plays where it must not (reload, language switch, reduced motion, Save-Data, `#work`, JS off, scroll restoration, back/forward, blocked storage, other pages and 404s), skips instantly (Escape before and during the flight, any key, click, tap, wheel, Tab), survives failures (symbol fails, intro module missing: page back after 2.5 s, module throws, slow fonts, resize, orientation), footage plays inside the symbol on a first visit, no video, mask or poster request on returning, reduced-motion, Save-Data or other-page visits, video failure, autoplay refusal and a 2 s late video all fall back to the static symbol on time, nothing left behind (classes, overlay, name twin, video sources, animations) | 62/62 |
| Visual regression: homepage at rest after a full first-visit intro, 5 sizes × EN/EL, against B and against A | identical (10/10 each; one capture flake against A, clean on rerun) |
| Visual regression: returning visit (motion) and reduced motion, 18 pages × 1440/390, against A | identical (lazy-image capture flakes clean on rerun) |
| Type fit: 320 to 1440 and landscape phone, EN/EL | no clipping, no horizontal scroll, at least 16 px margin |
| Redirects (35) and routes (23) against A | identical |
| `astro check`, build, asset (28), security (334), SEO (1138), `derive-intro-media.mjs` | pass; 20 pages, 18 sitemap URLs, all noindex, no tracking, no dependency, header or config change |
| Phase 6 regression suites on this build: axe (20 pages × 3 sizes, reduced motion and motion), forward and backward Tab, focus under the header, mobile dialog, JavaScript off, responsive (6 sizes × 20 pages) | axe 0 violations; keyboard 0 issues, 0/307 covered; dialog all pass; JS-off and responsive findings the same known, design-intentional items as `main` |
| axe while the intro is on screen | no intro element flagged; at 0.8 s the hero's own entrance (meta and support lines mid-fade) is flagged exactly as on `main` at 0.8 s |

### Not covered

- **Safari and Firefox.** WebKit and Firefox are not installed here and were not downloaded. Most at risk in Safari:
  `-webkit-mask-image` on `<video>` (supported, but untested here), `backdrop-filter` performance, autoplay rules (Low
  Power Mode refuses autoplay; the static symbol is the designed fallback), and MP4 selection. Test on iOS and macOS
  Safari before launch.
- **Real phones and GPUs other than the one above.** The GPU frame figures come from one desktop GPU.
- **Screen readers.** The overlay, video and name twin are `aria-hidden`; no screen reader was run.
- **Field data.** None.
