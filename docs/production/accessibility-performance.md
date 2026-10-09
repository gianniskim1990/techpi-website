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

## 11. Addendum: the first-visit homepage intro (2026-10-09)

Branch `feat/homepage-intro-flight`. Design and lifecycle: `docs/design/motion-system.md`, section 14. Storage:
`security.md`, section 11. Same tools as section 1 (Chromium only), against `main` at `768c0a0` built and served the
same way. A = `main`; B = first eligible visit (the intro plays); C = returning visit (the intro already seen).

### What the intro costs, honestly

The intro deliberately holds the homepage for about 3 s on a first visit. Chrome's LCP does not show that cost: on
desktop it counts the hero headline as painted at first paint, under the overlay (LCP ignores occlusion), and on
phones it reports the intro's symbol image as the LCP element. Lighthouse Speed Index does not capture it either. So
the table also gives **when the headline is actually visible**: the first compositor frame (CDP screencast) in which
the hero h1 shows 90% of its final ink.

| Median of 5 (3 for /el/ visible) | A main | B first visit | C returning |
|---|---|---|---|
| Headline visible, `/` 1440, no throttling | 864 ms | **3415 ms** (+2.55 s) | 878 ms |
| Headline visible, `/` 390, CPU 4× | 996 ms | **3725 ms** (+2.73 s) | 1039 ms |
| Headline visible, `/el/` 390, CPU 4× (noisy) | 2141 ms | 4141 ms | 1395 ms |
| Chrome LCP, `/` phone 4× + slow network | 2004 ms (h1) | 2248 ms (symbol image) | 2124 ms (h1) |
| Chrome LCP, `/el/` phone 4× + slow network | 2284 ms | 2372 ms (symbol image) | 2320 ms |
| Chrome LCP, `/` desktop 4× | 680 ms | 664 ms | 680 ms |
| CLS (all runs) | 0 to 0.0004 | 0 | 0 to 0.0006 |
| TBT, `/` phone 4× | 972 ms | 1008 ms | 1040 ms |
| Lighthouse mobile, `/` and `/el/` (3 runs) | perf 99-100, a11y 100 | perf 100, **a11y 96-97** | (not run: Lighthouse clears storage) |

- **Returning visits (C)** are unchanged within run-to-run noise (headline 878 vs 864 ms, 1039 vs 996 ms; LCP and TBT
  inside the spread of A).
- **The Lighthouse accessibility score on a first visit** drops to 96-97 because axe runs while the intro is still on
  screen and catches the header name mid-fade-in (1.15 to 1.36:1 for one frame). Before and after that moment there is
  no violation; the settled name is 7.67:1 on the blue and 16.6:1 on Paper. A transient state of an animation, not a
  content failure, but the score a first-visit Lighthouse run shows is lower.
- **Bytes.** Homepage HTML +5.1 KB (+1.95 KB gzip: the hashed inline module is 1.5 KB gzip). Homepage CSS +2.6 KB.
  The symbol, first visits only: 16 KB (240 px, desktop) or 26 KB (360 px, phones at 2×). The other 18 pages: one extra
  hash in their CSP meta (Astro lists the site's inline scripts on every page), nothing else. Fonts: the same two
  requests. No new dependency.
- **Frames.** During the flight and handoff (1.95 to 3.05 s), 0 frames over 33 ms at 1440 (1× and 4× CPU) and 2 at 390
  with 4× CPU (worst 67 ms, main thread). The flight and every fade run on the compositor, scheduled on the document
  timeline when the module starts, so even at 4× and 6× CPU the intro ends 3.01 to 3.03 s after its first frame.

**Recommendation if the cost is judged too high** (not applied; the 3.2 s budget is approved): the smallest change that
keeps the concept is to start the hero entrance at 2.3 s, when the name appears, instead of 2.6 s. The headline would
show about 0.3 s sooner and the timeline would not change. Shortening the hold before the flight (1.9 s) is the next
lever. Neither changes LCP as Chrome reports it.

### Tests

| Area | Result |
|---|---|
| Intro matrix (Playwright, 53 checks): plays on a fresh first visit at 1440, 1280, 768, 390, 360 in EN and EL, ends at 3.00 to 3.04 s, the symbol lands on the centre of the name (under 1 px), ends clean (no class, overlay, animation or listener left; header z-index, name colour and opacity back; hero fully visible; no overflow; no CSP violation; no error) | 53/53 |
| Never plays: reload, EN to EL, EL to EN, reduced motion, Save-Data, `#work`, JavaScript off, reload of a scrolled page with cleared storage, back/forward, blocked storage, all 16 other pages and both 404s (no markup, no storage write) | all pass |
| Skip: Escape at once and during the flight, any key, click (nothing underneath activated), tap (touch), wheel (the page scrolls natively), Tab (focus lands on the skip link, visible), interaction after skip, before the symbol has loaded | all instant and clean |
| Failure: symbol request fails (ends on time), intro module missing (head fail-safe: page back after exactly 2.5 s), module throws (page back at once), fonts 2.5 s late (ends on time, lands on the name), width resize before and during the flight (skips), height-only resize (keeps playing), orientation change (skips) | all pass |
| After the intro: mobile menu (open, Escape, focus return), header hide on scroll down and return on scroll up, Tab to the skip link and the name with a visible ring | all pass |
| Visual regression against `main`: homepage after a full first-visit intro, 5 sizes × EN/EL | 10/10 identical |
| Visual regression: returning visit, 18 pages × 1440/390 (motion), and reduced motion (static) | 36/36 identical; static 36/36 apart from one lazy-image timing flake, clean on rerun |
| axe 4.14, 20 pages × 3 sizes, reduced motion and motion | 0 violations (as before) |
| Phase 6 keyboard suites: forward Tab, backward Tab, focus under the header | unchanged: 0 issues, 0/307 covered |
| Mobile dialog (EN, EL; 360, 390, 768) | all pass |
| JS off, responsive (6 sizes × 20 pages), resting motion states | identical findings to `main` (the known design-intentional items, section 3.3) |
| `astro check`, build, asset, security (336), SEO (1138) validators | pass; 20 pages, 18 sitemap URLs, all noindex |

### Not covered

- **Firefox and Safari.** Not available to automate here. Most at risk: `measureText` metrics for the landing point,
  the WAAPI `startTime` alignment with a CSS animation, lazy loading inside a hidden overlay (Safari has loaded lazy
  images in `display: none` containers in some versions). Test on real Safari (iOS and macOS) and Firefox before launch.
- **Screen readers.** The overlay is `aria-hidden` and the h1 never leaves the tree, but no screen reader was run.
- **Field data.** None. The first-visit cost above is a lab measurement.
- **The look of the motion** was reviewed from captured frames, not at full frame rate on real devices; the owner
  should watch it on a phone and a desktop on the Preview.
