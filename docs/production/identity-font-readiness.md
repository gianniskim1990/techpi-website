# Identity and fonts: production state

Status: **integrated in Phase 3G.2 (2026-10-07).** The approved 3D TechPi identity and self-hosted Commissioner are in production code. The remote Google Fonts loader is removed. The site is still `noindex`.
Phase 3G.1 (the audit and the contract that preceded this) is in git history at `c56b872`.
Related: `launch-blockers.md` (what still blocks launch), `architecture.md` sections 6 and 7, `motion-implementation.md` (Phase 3E).

---

## A. Summary

| Area | State |
|---|---|
| Identity direction | **Approved:** the four 3D raster assets. The identity concept is final |
| Source masters | `brand-source/final/3d/`. Never published |
| Header and footer | Typographic `TECHPI`, by decision. The glossy wordmark is not used in the interface |
| Homepage Contact | The approved white 3D symbol resolves the arc → circle → TechPi narrative, static, tone on tone on TechPi Blue |
| Elsewhere | No symbol. Secondary pages, cards, headings, header and footer stay calm |
| Browser icons | PNG favicons (32, 192) and a 180 × 180 Apple touch icon, from the approved app icon. The `data:,` workaround is gone. No web manifest |
| Fonts | Commissioner 1.001, self-hosted: two official WOFF2 files (Latin, Greek), variable weight. Zero requests to any font CDN |
| Flat vector identity | **Does not exist, and none was fabricated.** A future brand-system deliverable (section B.7), not a launch blocker |
| Indexing | Unchanged: every page `noindex`. The TemporaryFonts guard is gone with the component, so an explicit indexing build now succeeds. See section E |

---

## B. Identity

### B.1 Approved source assets

Approved by the owner on 2026-10-07 as the official identity direction. Inspected by content, not by file name: two of the old names did not describe what they contain.

| Final file (`brand-source/final/3d/`) | Was (`brand-source/provisional/`) | Content | Size | SHA-256 (start) |
|---|---|---|---|---|
| `techpi-symbol-blue-3d.png` | `techpi-symbol-color.png` | Blue and cyan 3D ribbon symbol: a T inside interlocking rings | 1254 × 1254, RGBA | `3f34e05f4c0c` |
| `techpi-symbol-white-3d.png` | `techpi-symbol-white.png` | The same symbol in white and grey | 1254 × 1254, RGBA | `775f6db957ee` |
| `techpi-app-icon-3d.png` | `techpi-monogram.png` | Blue rounded-square app icon with a 3D ribbon "P" | 1254 × 1254, RGBA | `153c1a76e9e6` |
| `techpi-wordmark-3d.png` | `techpi-wordmark.png` | Glossy `TECHPI` wordmark, `TECH` in white chrome, `PI` in blue to cyan | 2172 × 724, RGBA | `7d30648acdee` |

Moved with `git mv`, so their history is kept. Notes from the inspection:

- The transparency comes from background removal: the solid areas sit at alpha 253, not 255, and the edges carry a faint light halo. The white symbol also has faint specks (4.2% of pixels below alpha 64) in its open areas. None of this is visible at the sizes and opacity used. The masters are kept exactly as approved, not cleaned.
- The symbols' outer form is very slightly taller than wide (white about 1055 × 1070 px, blue about 1045 × 1055 px), as a 3D ribbon would be.
- The 3D assets have their own blue and cyan tonal range. It is part of the artwork and is not mapped to tokens.

The archived Phase 2 board and prototype in `explorations/` load these files, so only their image paths were updated. Their wording is historical and was left as it was.

### B.2 Production derivatives

Made by `scripts/brand/derive-identity.mjs` (run from the repository root after a master changes). It only crops, resizes and, for iOS, adds a background. It never redraws, traces or recolours. It uses `sharp`, which Astro already installs, so no dependency was added. Re-running it produces byte-identical files.

| Derivative | From | How | Size |
|---|---|---|---|
| `src/assets/brand/techpi-symbol-white.png` | white symbol | Lossless square crop centred on the outer ring, 1% margin, 1091 × 1091 | 965 KB (source only, never shipped) |
| `src/assets/brand/techpi-symbol-blue.png` | blue symbol | The same, 1076 × 1076 | 1.2 MB (source only, never shipped) |
| `public/favicon-32.png` | app icon | Cropped to the rounded square, Lanczos resize, transparent, 256-colour palette with dithering | 2.1 KB |
| `public/favicon-192.png` | app icon | The same at 192 | 15 KB |
| `public/apple-touch-icon.png` | app icon | 164 px icon on a 180 × 180 opaque Ink square, palette PNG | 12 KB |

The palette PNGs are about a fifth of the full-colour size. At 3× zoom they show faint dither grain and no banding. At real size they are indistinguishable.

On the page, Astro encodes the white crop to WebP (quality 88) at 480, 720 and 1080 px, plus a 1091 px `src` fallback. Measured requests: one 69 KB file on a 1440 × 900 desktop, one 123 KB file on a 390 px phone at 3×. Both are lazy-loaded at the end of the homepage. No crop or master reaches `dist/` (checked by content hash).

### B.3 `BrandSymbol.astro`

The one place the 3D symbol is rendered. Props: `symbol` (an imported variant), `alt`, `sizes`, `widths`, `loading`, `class`.

- **Variants.** The caller imports the variant it renders: `techpi-symbol-white.png` for Blue and Ink surfaces, `techpi-symbol-blue.png` for Paper. This is deliberate. Astro emits every image module it compiles and only drops originals it has transformed, so a component that imported both variants would ship the unused one's 1.2 MB PNG. This was observed in the first build and fixed this way.
- **Accessibility.** Decorative by default (`alt=""`, ignored by assistive technology). Pass `alt="TechPi"` only where the symbol carries meaning on its own.
- **Loading.** Lazy by default, with responsive WebP and an honest `sizes`.

### B.4 Where the identity appears

| Surface | Decision |
|---|---|
| Header, desktop and mobile menu | Typographic `TECHPI` (real text, weight 600). The glossy wordmark would be too heavy for the editorial header |
| Footer | Typographic `TECHPI` |
| Homepage Contact | The white 3D symbol (B.5). The one identity moment |
| Hero arc | CSS geometry, unchanged |
| Secondary pages, case studies, cards, headings | No symbol |
| Browser tab, bookmarks, iOS home screen | The app-icon derivatives (B.6) |
| Glossy wordmark | Kept as an official source asset for campaign graphics, social identity, presentations and branded media. Not used on the website |

### B.5 Homepage Contact: the static resolution

The page's geometry ends here: the arc that crosses the page has closed into a circle, and the circle has resolved into the TechPi symbol.

- **One symbol**, the white 3D variant, decorative, behind the question, in `.mark`. `.mark` has the exact box and position the hairline ring had (`min(760px, 78vh, 88vw)`, centred at 47%, and on phones `100vw − 32px` from 112 px). The symbol's outer ring fills that box, so the circle and the symbol are the same circle.
- **The hairline is absorbed**, as in the approved storyboard (stage 4, "TechPi"). A separate ring on top was tried and rejected: the symbol's outer form is not a perfect circle, so a second edge doubles it.
- **Tone on tone at 16% opacity.** The prototype used 14% for a flat silhouette. The 3D shading averages darker than flat white, so 16% gives the same visual weight. 20% and a screen blend were compared and read as too present.
- **Why white:** the blue variant loses its outer edge on TechPi Blue. White gives the strongest restrained result.
- **Contrast:** Sheet text on TechPi Blue is 7.67:1. Over the brightest part of the symbol it is 5.40:1 at worst, above AA for body text. The heading is display-size.
- **Unchanged:** the approved copy, the button and the foot line. No glow, no animation, no second symbol.

**What Phase 3E animates:** this exact resting state is the end frame. The arc travels through the page, closes into the circle as Contact enters, the inner geometry appears, and the composition settles here. Motion must end on this frame and add nothing to it. Under `prefers-reduced-motion`, this static state is the whole experience. Because the symbol is raster, 3E reveals it with opacity, masks or clip-paths on the image. Drawing the inner paths stroke by stroke needs the flat vector master (B.7).

### B.6 Browser icons

```html
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- Chromium requests `/favicon-32.png` only (200). It does not request `/favicon.ico`.
- **No `favicon.ico`.** No existing local tool can write one (ImageMagick is not installed, and Windows' `convert` is the disk tool), and no package is added for it. A client that asks for `/favicon.ico` directly, ignoring the link tags, gets the 404 page. If that matters later, create a PNG-in-ICO from `favicon-32.png` with a proper tool.
- **No web manifest and no `theme-color`.** There is no app or PWA requirement.
- Legibility: the ribbon "P" on the blue tile reads at 32 px on light and dark tab bars.

### B.7 Flat vector identity: a future deliverable

No flat or SVG version of the identity exists. None was traced, auto-vectorised or approximated, and none may be presented as a production vector.

The website does not need one to launch: the header and footer are typographic, the Contact moment uses the approved raster, and the browser icons come from the approved square icon.

A clean flat master (symbol, single-colour versions, `currentColor` SVG, and optionally a lockup) remains a **brand-system deliverable**. It would add a crisp mark at very small sizes, an SVG favicon, a structured-data logo, and stroke-level drawing for the Contact motion. The SVG rules from Phase 3G.1 still apply when it arrives: a tight `viewBox`, no embedded raster, no fonts, no external references, no editor metadata, no ids, and under 10 KB.

---

## C. Fonts

### C.1 Source, version, licence

| | |
|---|---|
| Typeface | Commissioner, by Kostas Bartsokas |
| Version | 1.001 (`Version 1.001;gftools[0.9.23]`) |
| Source | Official Google Fonts: the web files from the Google Fonts API (`fonts.gstatic.com/s/commissioner/v24/`), checked against the master in the official repository `github.com/google/fonts`, `ofl/commissioner/` |
| Retrieved | 2026-10-07 |
| Licence | SIL Open Font License 1.1, `src/assets/fonts/OFL.txt` (verbatim from the repository). No Reserved Font Name is declared |
| Record | `src/assets/fonts/SOURCE.md`: checksums, the master's git blob, the upstream commit, the coverage check |

The master downloaded from the repository matches its git blob in the repository listing (`2ac22fba…`). It was used for verification only and is not committed. The served files report the same version.

### C.2 Strategy: option B, two official files, unmodified

| File | Subset | Size | Weight axis |
|---|---|---|---|
| `src/assets/fonts/commissioner-latin.woff2` | Google `latin` | 36.7 KB | `wght` 100–900, declared `400 600` |
| `src/assets/fonts/commissioner-greek.woff2` | Google `greek` | 15.4 KB | the same |

- **Why not one file:** merging or re-subsetting needs font tooling that is not installed (no Python or fontTools), and would add a dependency or a custom build step to save little. The official files are already instanced to the upright design (slant, flare and volume at their defaults), already compressed by Google, and they are byte-identical to what the site loaded before, so the rendering cannot change.
- **`unicode-range`:** Google's own ranges for the two subsets, in `src/styles/fonts.css`.
- **English pages also fetch the Greek file (15.4 KB),** because the language switch shows "ΕΛ". Avoiding it would need a custom Latin subset with U+0395 and U+039B, so it is accepted (C.6).
- **Not shipped:** the latin-ext, cyrillic, cyrillic-ext and vietnamese subsets, and the 742 KB master. The site uses none of their characters.
- **Hashed URLs:** the files are imported through CSS, so Vite content-hashes them (`/_astro/commissioner-latin.BAwLJtOy.woff2`). The preload imports the same file with `?url` and gets the same URL, so there is never a second download.

### C.3 Glyph verification (the actual files, not assumptions)

Each file's `cmap` was read and compared with every character the built site renders: 141, including the uppercase forms produced by `text-transform`.

| Check | Result |
|---|---|
| Latin in use (69 ASCII characters, `’` U+2019) | All present in the Latin file |
| Monotonic Greek in use: both cases, ά έ ή ί ό ύ ώ, ϊ, ς, the accented capitals, and the unaccented capitals used by uppercase labels | All present in the Greek file |
| Ε U+0395, Λ U+039B | Present (Greek file) |
| ← U+2190, → U+2192, ↗ U+2197 | **Missing from every file, including the full master.** Commissioner 1.001 has no arrows at all (not even ↑ ↓). Accepted decision: system fallback for these glyphs, no font modification |
| Weights | One variable axis covers 400, 450, 500 and 600. In Chromium every text role reports Commissioner at its intended computed weight, so there is no synthetic bold |

In Chromium, the arrows render in Segoe UI on Windows, exactly as they did with Google's delivery. The fallback faces in C.4 are limited to Commissioner's own ranges, so the arrows keep going to `system-ui`.

### C.4 `@font-face`, fallback and stack

```
--font-sans: 'Commissioner', 'Commissioner Fallback', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

- Commissioner faces: `font-weight: 400 600`, `font-style: normal`, `font-display: swap`.
- `Commissioner Fallback`: local Arial (or Helvetica), metric-matched so the swap does not reflow. The values were measured in Chromium on the site's own copy at weight 400, as the Commissioner / Arial width ratio: 1.0025 for English, 1.029 for Greek. So there are two faces, split by script: Latin with `size-adjust: 100.3%`, Greek with `102.9%`. Ascent, descent and line gap are Commissioner's (1.017 em, 0.206 em, 0) divided by `size-adjust`.
- Throttled measurement: **CLS 0.000** on `/`, `/el/`, `/work` and `/el/about` during the fallback-to-Commissioner swap.

### C.5 Preload: measured, one file per page

Measured with Chromium on a slow 4G profile (150 ms RTT, 1.6 Mbps), with the cache disabled, taking the median of three runs:

| Page | Preload | First paint | Primary-script font arrives |
|---|---|---|---|
| `/` | none | 440 ms | Latin 831 ms (391 ms of fallback) |
| `/` | Latin | 528 ms | Latin 598 ms (70 ms of fallback) |
| `/` | Latin and Greek | 552 ms | Latin 667 ms |
| `/el/` | none | 448 ms | Greek 708 ms |
| `/el/` | Latin | 536 ms | Greek 664 ms |
| `/el/` | **Greek** | 548 ms | **Greek 477 ms, before first paint (no swap for Greek text)** |
| `/el/` | Latin and Greek | 556 ms | Greek 571 ms, Latin 665 ms |

**Decision:** preload exactly one file, the one for the script the page is mostly written in: Latin on English pages, Greek on `/el/` pages. Preloading both delays first paint and the file that matters. The other file loads normally through `unicode-range`. Chromium logs no preload warnings and makes no duplicate requests.

### C.6 Remote fonts removed

`TemporaryFonts.astro` and its use are deleted. Verified:

- Built pages and CSS contain no `fonts.googleapis.com`, `fonts.gstatic.com` or other font CDN.
- In 24 Chromium page loads (12 pages, desktop and mobile), the only host requested is the site itself.
- With every third-party host blocked, Commissioner still loads. With the network cut after load, the page keeps rendering Commissioner, including a newly added weight-600 Greek and Latin string.

---

## D. Integration points (as built)

| File | Role |
|---|---|
| `src/styles/fonts.css` (new) | The two Commissioner faces and the two fallback faces |
| `src/assets/fonts/` (new) | `commissioner-latin.woff2`, `commissioner-greek.woff2`, `OFL.txt`, `SOURCE.md` |
| `src/styles/tokens.css` | `--font-sans` gains `'Commissioner Fallback'`. Palette marked approved |
| `src/layouts/BaseLayout.astro` | Imports `fonts.css`, one font preload per locale, the three icon links. `TemporaryFonts` removed |
| `src/components/BrandSymbol.astro` (new) | The 3D symbol, optimised |
| `src/components/home/ContactSection.astro` | `.ring` replaced by `.mark` with the white symbol |
| `src/assets/brand/` (new) | The two lossless symbol crops |
| `public/` | `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` (plus `_redirects`) |
| `scripts/brand/derive-identity.mjs` (new) | Regenerates every derivative from the masters |
| `brand-source/final/3d/` | The approved masters (moved from `provisional/`) |
| `src/components/TemporaryFonts.astro` | Deleted |

Unchanged: `Header.astro`, `Footer.astro` and the hero arc. Also unchanged: every route, redirect and dictionary, and `package.json` and the lockfile.

---

## E. Indexing behaviour now

- **Normal builds (production and previews):** all 20 pages carry `noindex, nofollow`. Nothing changed here.
- **The TemporaryFonts guard is gone,** because its reason (remote fonts) no longer exists. An explicit `PUBLIC_ALLOW_INDEXING=true` test build now **succeeds**, as intended. In that test build, the 14 content pages become indexable, while `/eu-projects`, `/el/eu-projects`, `/404` and `/el/404` stay `noindex`. Verified in a throwaway build outside `dist/`, followed by a clean rebuild. No indexable output was left behind.
- **`PUBLIC_ALLOW_INDEXING` is now the only switch.** It must not be set in any deployed environment until the launch milestone. Whether it is set in the Cloudflare dashboard cannot be seen from the repository: confirm it is unset (`launch-blockers.md`, blocker 14).
- Open recommendations from 3G.1, not done here: a single module for the flag, and an `X-Robots-Tag: noindex` response header on preview hostnames, as a second layer.
- `robots.txt` is unchanged (none exists yet; launch blocker 12).

---

## F. QA record (2026-10-07)

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm run build` | 20 pages |
| Static audit (extended for identity and fonts) | 39 / 39. A negative test (an icon removed) fails as it should |
| Wrangler route and redirect matrix | 97 / 97, unchanged |
| Visual regression against `main` | 14 pages × 6 viewports (1440, 1280, 1024, 768, 390, 360), compared tile by tile at the real viewport size. **Pixel-identical everywhere except the homepage Contact section**, the intended change. A few small differences on image tiles were traced to the test's own image-decode cache: they disappear with a fresh browser per page |
| Contact composition | EN and EL at all six sizes: no overlap between heading, button and foot line; no horizontal overflow; the symbol stays inside the viewport |
| Fonts in use | Every probed role (header name, navigation, current language, display h1/h2, project names, body, uppercase labels, buttons, footer) renders in Commissioner at 400, 450, 500 or 600, in EN and EL. The only other font is the system arrow |
| Console, images, overflow | No errors or warnings, no broken images, no horizontal overflow on any audited page at 1440 or 390 |
| Third parties | None |
| Dependencies | None added. `package.json` and `package-lock.json` unchanged |
| Performance | Fonts: 51 KB on every page (unchanged bytes, now first-party, no extra DNS/TLS to two Google origins). Homepage gains one lazy symbol image (69 KB desktop, 123 KB phone at 3×). Icons 2 KB. Throttled LCP is the hero heading at about 440 ms. CLS 0 |

---

## G. Later, not in this milestone

- The Contact motion (Phase 3E), from the resting state in B.5.
- A flat vector master (B.7).
- Open Graph images and the structured-data logo, from the approved identity.
- Long-lived cache headers for `/_astro/*` (content-hashed). Cloudflare revalidates on every load by default. A performance pass, not a correctness issue.
- The 4 high-severity `npm audit` advisories: the dedicated pre-launch security milestone. Not touched here.
