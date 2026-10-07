# Final identity and self-hosted font readiness

Status: audit of 2026-10-07 (Phase 3G.1). Documentation only. Nothing in this milestone changed the site, a route, indexing or a dependency.
Audited: `main` at `155e882`, Node 24.18.0, a clean build of 20 pages.
Related: `launch-blockers.md` (what blocks launch), `architecture.md` sections 6 and 7 (the original plan), `seo-i18n.md`.

---

## A. Current state

### A.1 Identity

| Item | State |
|---|---|
| Final identity files | **None exist.** No SVG, favicon, manifest or app icon anywhere in the production tree |
| Provisional rasters | Four PNGs in `brand-source/provisional/`: `techpi-symbol-color`, `techpi-symbol-white`, `techpi-wordmark`, `techpi-monogram`. RGBA, 1254×1254 (wordmark 2172×724), with edge fringing. Reference only |
| `public/` | Only `_redirects`. No brand file is published |
| Header | Typographic `TECHPI`. No symbol |
| Contact | A plain CSS ring. The inner symbol is **not** built. The raster was deliberately not traced or approximated |
| Favicon | `<link rel="icon" href="data:,">`. An empty icon that stops the browser requesting `/favicon.ico` |
| `<head>` metadata | No `apple-touch-icon`, manifest, `theme-color`, Open Graph or Twitter tags, and no structured data |
| Build output | 52 files, all HTML, CSS, `_redirects` and 29 project screenshots (WebP, from `src/assets/projects/`). **No font, SVG, icon, manifest, script or map file** |

The earlier architecture document describes two things that do not exist: `Wordmark` and `Symbol` components, and a CSS-mask rendering of the symbol on Contact. See D.5 for the correction.

### A.2 Fonts

| Item | State |
|---|---|
| Family | Commissioner, loaded by `TemporaryFonts.astro` from Google Fonts: `family=Commissioner:wght@400..600&display=swap` |
| Where | All 20 pages: two `preconnect` links and one stylesheet link to `fonts.googleapis.com`, with the files served from `fonts.gstatic.com` |
| Own CSS | No `@font-face`, no `font-display`, no `url(http…)`. The only declaration is `font-family: var(--font-sans)` |
| Stack | `'Commissioner', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`. No metrics-matched fallback yet |
| Privacy | Each visitor's IP address reaches Google before any consent. This is why it must not ship |

**Weights in use: four, not three.**

| Token | Value | Used for |
|---|---|---|
| `--weight-body` | 400 | Body text |
| `--weight-display` | 450 | Statements and headings |
| `--weight-ui` | 500 | Navigation, labels, buttons, fact labels, text links |
| `--weight-name` | **600** | The `TECHPI` name (header, footer), the current language, project names |

A variable weight axis of **400 to 600** covers all four. 450 is not a standard static weight, so a variable file is required. No italic, bold markup, `<strong>` or `<em>` is used anywhere.

**Characters the site needs** (taken from the visible text of all 20 pages):

| Group | In use now |
|---|---|
| ASCII | 69 distinct characters |
| Punctuation | `’` U+2019 only |
| Arrows | `←` U+2190 (6×), `→` U+2192 (28×), `↗` U+2197 (6×) |
| Greek | 57 distinct: all lower-case with the accented vowels ά έ ή ί ϊ ό ύ ώ, capitals including Ά Έ Ό Ώ, and final sigma ς. No polytonic (U+1F00–1FFF) |
| Greek on **English** pages | `Ε` U+0395 and `Λ` U+039B on all 10 English pages, from the language switch "ΕΛ" |
| Uppercase | `text-transform: uppercase` on three category labels (weight 500). On Greek it needs the unaccented capitals |

Two consequences:

1. **The Greek file would download on every English page,** because "ΕΛ" is visible there. Put `Ε` and `Λ` in the Latin face's `unicode-range` so English pages need only one font file (see C).
2. **The arrows are a verified risk.** In Phase 2, `→` fell back to a system font under Google's delivery. Whether the real Commissioner file contains U+2190, U+2192 and U+2197 must be checked against the actual file (see C and E).

### A.3 Environment

- Node on this machine is now **24.18.0** (npm 11.16.0), installed with `nvm-windows` from nodejs.org. It matches `.node-version` (`24`) and `engines` (`^24.0.0`), and Cloudflare's build image. The old 22.12.0 is still installed, not active.
- `npm ci` succeeded and `package-lock.json` is byte-identical. `npm run check` (57 files) and `npm run build` pass with 0 errors, 0 warnings, 0 hints.
- npm 11 prints one new notice: install scripts of `esbuild` and `workerd` are "not yet covered by allowScripts". The build is unaffected.
- `npm audit` reports 4 high-severity advisories, which are new since Phase 3A. In the shipped tree only `http-cache-semantics` (an Astro build-time dependency) appears. The `sharp` advisory comes through Wrangler, which is dev-only. The site is static HTML and none of these code paths ship. No `audit fix` was run, to avoid lockfile drift. Handle as a separate dependency-update step.

---

## B. Final identity files required

Do **not** create stand-ins. Nothing below may be traced from, or "cleaned up" from, the provisional rasters.

### B.1 Files

| File | Purpose | Notes |
|---|---|---|
| `techpi-symbol-dark.svg` | Symbol on Paper and other light surfaces | Single colour, Ink or the approved dark |
| `techpi-symbol-white.svg` | Symbol on Ink and TechPi Blue | Single colour, white |
| `techpi-symbol-blue.svg` | Symbol on Paper where the blue version is wanted | TechPi Blue, final value from the master |
| `techpi-lockup-horizontal-dark.svg`, `…-white.svg` | Symbol and wordmark together | Must work on Paper (dark) and on Ink and Blue (white). The provisional wordmark fails on light surfaces and on blue |
| `techpi-wordmark-dark.svg`, `…-white.svg` | Only if the wordmark is used apart from the lockup | Skip if the lockup is the only form |
| `techpi-symbol.svg` (inline master) | One symbol using `fill="currentColor"` | So one inline copy serves every surface from CSS. Same artwork as the three static files |
| `favicon.svg` | Browser tab icon | Legible at 16 px on light and dark tab bars. If the full symbol is not legible small, a purpose-drawn small-size variant |
| `favicon.ico` | Legacy fallback, also answers direct `/favicon.ico` requests | 32×32, optionally 16 and 48 in the same file |
| `apple-touch-icon.png` | iOS home screen | 180×180, opaque background, no transparency, no pre-rounded corners |
| App icon | High-resolution square icon | 512×512 PNG, opaque. Also 192×192. A maskable 512 with a safe zone only if a web manifest is wanted |
| Open Graph source | Social identity image | 1200×630 composition as an editable source (vector, Figma or similar), plus exports. English and Greek variants, since text inside an image is language-specific. Roughly 300 KB or less each |
| Written approval | Provenance and colour | Confirmation that these are the approved final masters, drawn from the original design, plus the final hex for TechPi Blue and Ink. Contrast is then recalculated |

### B.2 SVG requirements

- **`viewBox` is required** and tight to the artwork, with no padding baked in. Clear space is defined in CSS, not in the file. Omit fixed `width` and `height`, so CSS sizes it.
- **Transparent background** for the symbol, wordmark and lockup. The apple touch icon and app icon are the exceptions: opaque.
- **No embedded raster.** No `<image>`, no `data:` bitmap, no `<foreignObject>`.
- **No font dependency.** All text is converted to outlines. No `<text>`, no `@import`, no `@font-face`.
- **No external references:** no `xlink:href` or `href` to a URL, no remote `<style>`, no scripts.
- **No unnecessary metadata:** no editor comments, no `<metadata>`, no `<desc>`, no `sodipodi:`, `inkscape:`, `sketch:` or `data-name` attributes. Keep `xmlns`.
- **Flat fills, presentation attributes.** Avoid gradients, filters and masks, unless the approved master needs them. In that case also supply a flat one-colour version.
- **No `id` attributes**, or only unique ones. The header and the mobile menu may each inline the same SVG, and duplicate ids on one page are invalid.
- **Small.** Optimised and well under 10 KB each. The build already includes `svgo`.

### B.3 Accessible name strategy

| Use | Markup |
|---|---|
| Logo as the only content of a link (header) | The **link** carries the name: `aria-label="TechPi, Home"` (already present). The SVG inside is `aria-hidden="true" focusable="false"`, with no `<title>`, so it is not announced twice |
| Logo as standalone meaningful content | `role="img"` with `aria-labelledby` pointing at a `<title>` inside the SVG ("TechPi"), or `aria-label="TechPi"`. For `<img>`, `alt="TechPi"` |
| Decorative (the Contact ring and symbol) | `aria-hidden="true" focusable="false"`. For `<img>`, `alt=""` |

### B.4 Where each file is used

Sparse and intentional. The symbol is **not** repeated as decoration.

| Surface | File | Decision |
|---|---|---|
| Header, desktop and the mobile menu | Lockup or wordmark | Replaces the text `TECHPI`. Keep the link and its `aria-label` |
| Footer | Typographic `TECHPI` by default | Recommended: keep it as text, so the identity is not repeated. Decide at 3G.2 |
| Contact, end of the narrative | Symbol (inline SVG, `currentColor`) | The ARC → CIRCLE → TECHPI resolution. The one large symbol moment on the site |
| Homepage hero arc | None | The arc stays CSS geometry. Its curvature should be **re-checked against the vector master**, since it was derived from the provisional raster |
| Favicon, app icon | Favicon set | Replaces the empty icon |
| Open Graph | OG source, exported | Added with metadata |
| Structured data | A square or wide raster export of the mark | `logo` field, added with the schema milestone |

---

## C. Final font files required

Do not download fonts from third-party mirrors or font-aggregator sites. Official sources only.

| Decision | Requirement |
|---|---|
| Family name in CSS | `Commissioner`, unchanged, so `--font-sans` needs no edit |
| Format | **WOFF2.** No TTF, OTF or WOFF fallback needed for current browsers |
| Files | Two: Latin and Greek, both **variable** |
| Suggested names | `commissioner-latin-wght.woff2`, `commissioner-greek-wght.woff2` |
| Weights | One variable `wght` axis, **400 to 600**, declared `font-weight: 400 600`. Covers 400, 450, 500 and 600. Do not add other weights |
| Other axes | Remove. Pin slant, flare (`FLAR`) and volume (`VOLM`) at 0. They are not used, and a flared voice would change the approved look |
| Style | `normal` only. **No italic file** |
| `font-display` | `swap`, paired with a metrics-matched fallback |
| Fallback stack | `'Commissioner', 'Commissioner Fallback', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`. `Commissioner Fallback` is a local face with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` computed from the real font's metrics |
| Preload | Latin file on every page. Greek file on `/el/` pages only. Nothing else |
| Private source path | `src/assets/fonts/` (processed and hashed by the build, so they cache for a long time). Not `public/` |
| Size target | About 35 KB Latin and about 30 KB Greek, compressed. Estimates, to be measured |

**Latin file `unicode-range` (required now):** U+0020–007E, U+2019, U+2190, U+2192, U+2197, **and U+0395 and U+039B** (so English pages never download the Greek file).
**Recommended headroom for new content:** U+00A0–00FF, U+2013–2014, U+2018, U+201C–201D, U+2026, U+20AC, U+0131, U+0152–0153.
**Greek file `unicode-range`:** U+0370–03FF. This covers the tonos and dialytika forms, final sigma, the ano teleia U+0387 and the Greek question mark U+037E.

**Glyph checks against the actual file, before it is accepted:**
1. U+2190, U+2192 and U+2197 are present in the font and not drawn by a system fallback. If any is missing, a decision is needed: accept a system arrow, draw the arrow as inline SVG, or change the copy.
2. Every Greek character above exists at weights 400, 450, 500 and 600, including the unaccented capitals needed by the three uppercase labels.
3. The tight space before an accented Greek capital after a full stop (". Όχι") is checked, and fixed in CSS or copy if it persists.

**Source and licence confirmation required:**
- Commissioner is under the SIL Open Font License 1.1. Official sources are Google Fonts and the author's repository, `github.com/kosbarts/Commissioner`. The repository's README names v1.012.
- Record the version, the exact source URL, the date retrieved and the SHA-256 of the original files. Keep the licence file verbatim beside the fonts (`src/assets/fonts/OFL.txt`).
- Reserved Font Name: the repository's `OFL.txt` (checked 2026-10-07) carries no Reserved Font Name in its copyright line, so subsetting and instancing are permitted. **Re-check the licence file that ships with the version actually downloaded.**
- Document each modification (subset, pinned axes) next to the files.

**Astro's built-in fonts feature** (stable since Astro 6, present in the installed 7.3.5) offers a `local` provider with `weights`, `styles`, `unicodeRange`, `preload`, `display` and `optimizedFallbacks`. It could generate the `@font-face`, the preloads and the metrics-matched fallback. Decide at 3G.2 between that and a hand-written `@font-face`. Not chosen here. Astro's `google` provider would self-host at build time, but it would use Google's own subsets, which omit the arrows, and it makes every build depend on Google. It is not recommended without approval.

---

## D. Exact integration points

### D.1 Fonts

| File | Change at 3G.2 |
|---|---|
| `src/components/TemporaryFonts.astro` | Delete, together with its guard |
| `src/layouts/BaseLayout.astro` lines 6 and 67 | Remove the import and the `<TemporaryFonts />` use. Add the `@font-face` and the preloads, or the Astro font tag |
| `src/styles/tokens.css` line 24 | `--font-sans`: add `'Commissioner Fallback'` after `'Commissioner'`. Update the comment at lines 21–22 |
| `src/styles/base.css` | No change. It already reads `var(--font-sans)` |
| Possibly a new `src/styles/fonts.css` | `@font-face` rules and the fallback face |
| `public/_headers` (new) | Optional: long-lived cache for hashed assets. No headers file exists yet |

### D.2 Identity

| File | Place | Change |
|---|---|---|
| `src/components/Header.astro` | line 30 (desktop) and line 55 (mobile menu) | Replace the `{t.site.name}` text inside `.site-name` with the lockup or wordmark. Keep `aria-label`. Drop the text-only font rules in `.site-name` |
| `src/components/Footer.astro` | line 25 (`.name`) | Keep as text, or the lockup (a decision) |
| `src/components/home/ContactSection.astro` | lines 14–16 (`PRODUCTION TODO`) and `.ring` | Resolve the ring into the inline symbol. Layer the Contact motion (3E) on top |
| `src/components/home/Hero.astro` | `.arc` (lines 81–128) | Re-check curvature against the vector master |
| `src/i18n/en.ts`, `el.ts` | line 9, `site.name: 'TECHPI'` | Stays. It remains the accessible and text fallback name |
| `src/layouts/BaseLayout.astro` | lines 65–66 | Replace the `data:,` icon with the real icon links (D.3) |
| New component | `src/components/Brand…astro` | One small component for the inline symbol, so the SVG exists in one place |

### D.3 Favicon and head metadata

Replace the empty icon in `BaseLayout.astro` with:

```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<!-- only if a manifest is wanted -->
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="…final colour…" />
```

Files that go in `public/` (published as-is): `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, optionally `icon-192.png`, `icon-512.png` and `site.webmanifest`. Published brand SVGs go in `public/brand/`. Masters and sources go in a new, never-deployed `brand-source/final/`.

Today `/favicon.ico` returns the 404 page. Once a real file exists, direct requests for it succeed too.

### D.4 Open Graph and structured data

Added with the metadata and schema milestones, from the OG source and the mark export. Nothing in this milestone adds them.

### D.5 Corrections to the older architecture text

- `architecture.md` 4.2 and 7.3 describe `Wordmark` and `Symbol` components as the only identity references. They do not exist. Identity is currently referenced in the places listed in D.2.
- `architecture.md` 7.1 says Contact uses a CSS mask of the symbol. Production does not. That was a prototype technique.

---

## E. Temporary blockers

| # | Blocker | Effect |
|---|---|---|
| 1 | No final identity files | Header, Contact symbol, favicon, OG and the schema logo all stay provisional |
| 2 | No self-hosted Commissioner files | `TemporaryFonts` stays, so the site stays `noindex` |
| 3 | Arrow glyphs unverified in the real font | Possible visible fallback glyphs on `←`, `→`, `↗` |
| 4 | `Ε` and `Λ` on English pages | The Greek file downloads everywhere unless U+0395 and U+039B are in the Latin range |
| 5 | Final colours not confirmed against the master | Contrast figures stay provisional |
| 6 | Dependency advisories | Separate update step (A.3) |

### E.1 The indexing guard, reviewed (not changed)

`TemporaryFonts.astro` throws if `PUBLIC_ALLOW_INDEXING === 'true'`. `BaseLayout.astro` uses the same strict comparison to decide whether a page is indexable, so the two always agree. An indexable build fails while remote fonts are present (verified again on a clean build). Behaviour is correct. Recommendations, **documented only**:

1. **One source for the flag.** The variable name is repeated in two files. A single small module read by both would stop them drifting.
2. **The guard disappears with the component.** That is the intended hand-over, but nothing then confirms the remote fonts are really gone. At launch preparation, add a check that an indexable build contains no `fonts.googleapis.com` or `fonts.gstatic.com` in `dist/`.
3. **The variable lives outside the repo.** Whether `PUBLIC_ALLOW_INDEXING` is set in the Cloudflare dashboard cannot be seen from here. Confirm it is **unset** for production and previews today. If it is later set at project level, preview builds would also become indexable, so set it only for the production environment, and consider an `X-Robots-Tag` header on preview hostnames.
4. **No CI in the repository.** There is no `.github` directory. Builds run on Cloudflare Workers Builds, so the guard is enforced only there.

---

## F. Launch transition checklist

Fonts and identity are independent. Either can be done first.

1. Receive the files in B and C, with their source and licence records.
2. Place fonts in `src/assets/fonts/` with `OFL.txt` and a source note. Place identity masters in `brand-source/final/` and published outputs in `public/`.
3. Run the glyph checks in C (arrows, Greek at 400, 450, 500, 600).
4. Integrate fonts (D.1). Remove `TemporaryFonts`. Build.
5. Confirm `dist/` has no `fonts.googleapis.com` or `fonts.gstatic.com` and no third-party font request.
6. Measure: font weight on English and Greek pages, no layout shift on first paint, the English page does not fetch the Greek file.
7. Integrate identity (D.2, D.3). Re-check the hero arc against the master. Recalculate contrast from the final colours.
8. Confirm the provisional PNGs are still absent from `dist/` and `public/`.
9. Only then, during launch preparation, enable indexing (`PUBLIC_ALLOW_INDEXING=true` for the production environment only), after the other blockers in `launch-blockers.md`.
10. Re-run the full check: type check, build, route and redirect matrix, `noindex` or indexable state as intended, no third-party requests.
