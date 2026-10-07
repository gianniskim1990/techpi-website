# Commissioner: source record

| | |
|---|---|
| Typeface | Commissioner, by Kostas Bartsokas |
| Version | 1.001 (name table: `Version 1.001;gftools[0.9.23]`) |
| Licence | SIL Open Font License 1.1, in `OFL.txt` next to this file. No Reserved Font Name is declared. |
| Copyright | Copyright 2019 The Commissioner Project Authors (github.com/kosbarts/Commissioner) |
| Retrieved | 2026-10-07 |
| Designer's project | https://github.com/kosbarts/Commissioner |

## The files used by the site

Both are the official Google Fonts web builds, served by the Google Fonts API (`fonts.gstatic.com/s/commissioner/v24/`) for `css2?family=Commissioner:wght@400..600`. They are committed unmodified.

| File | Google subset | Size | SHA-256 |
|---|---|---|---|
| `commissioner-latin.woff2` | latin | 36,700 B | `e3d539b926881fbb3592788297eee24d6d179c1c06dbad36805fc722775247ce` |
| `commissioner-greek.woff2` | greek | 15,380 B | `75d4734b1d207892feee610186e34fe02912d604025906fdeca5c7b8c295a622` |

Each is variable on `wght` (100 to 900). The other master axes (slnt, FLAR, VOLM) are fixed at their defaults, which is the standard upright design. The `unicode-range` values in `src/styles/fonts.css` are Google's own for these subsets.

## The master they were checked against

From the official Google Fonts repository, `github.com/google/fonts`, `ofl/commissioner/`:

| File | Git blob | SHA-256 |
|---|---|---|
| `Commissioner[FLAR,VOLM,slnt,wght].ttf` (742,232 B, not committed) | `2ac22fba70bcf5d36052dfa604b43333b826996f` | `db01279a6eb8676ee62675a4d7e5edbfe5f08fbc109358e2f49760b70c0447d3` |
| `OFL.txt` (committed here) | `eaa7c1c436f0303948dd0d6ec51cfce14bf376e8` | `4a7d88c77b4bc39ff84f2e058ba8f015636c50ce33588a86d9da97defe519933` |

The repository's `METADATA.pb` names the build source as `github.com/m4rc1e/Commissioner`, commit `7f7dc8e9ed7ffeb3f7a91261f2b9549436ab3d02` (the Google Fonts onboarding fork of the designer's project). The two web files report the same version string as the master.

## Verified coverage (2026-10-07)

Checked by reading each file's `cmap` against every character the built site renders (141, including uppercase forms):

- Latin file: all Latin letters, digits and punctuation in use, including `’` (U+2019).
- Greek file: all monotonic Greek in use, including the accented vowels, `ϊ`, `ς`, and the capitals Ε and Λ used by the language switch.
- Neither file, and not the full master either, contains the arrows ← (U+2190), → (U+2192) or ↗ (U+2197). By decision, those characters use the system fallback font. The font is not modified to add them.

## Not committed

The master TTF (742 KB, four axes) and the other Google subsets (latin-ext, cyrillic, cyrillic-ext, vietnamese). The site uses none of their characters.
