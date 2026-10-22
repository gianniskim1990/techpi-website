# Homepage hero visuals: what each language shows, sources, licences and edits

| | English homepage (`/`) | Greek homepage (`/el/`) |
|---|---|---|
| Theme | EU projects: digital solutions for EU-funded projects, across their thematic breadth | Websites, web applications and digital solutions |
| Visual | **A grid of six photographs**, one for each thematic area of EU-funded projects, with a label on each tile, the line "Digital solutions for EU-funded projects" and a link "Explore EU Project Solutions" to `/eu-projects` (`src/components/home/EuHeroGrid.astro`, `eu-themes.ts`) | **One photograph** (`src/assets/hero/hero-el.jpg`) in the corner the hero arc opens, clipped by the arc (`hero-visual.ts`) |
| Chosen | At build time from the page's `locale` (never from the referrer, the browser's language or a redirect) | The same |

All seven photographs are **free to use under the [Unsplash License](https://unsplash.com/license)**: irrevocable, worldwide, for
commercial use, **without permission from or attribution to** the photographer or Unsplash (attribution is appreciated, not required).
Each Unsplash page was checked on 2026-10-22 and reads "Free to use under the Unsplash License" (none is an Unsplash+ photograph).
They are real photographs: each page lists the camera that took it (a Nikon, Canon, Sony or DJI drone; NASA's for the station), none is
a 3D render or generated image, and none shows an identifiable face. "Date" below is the upload date, read from the photograph's
Unsplash file id. Unsplash does not provide model or property releases; none of these shows a person, a brand mark or a private
building's name.

## English: the six thematic areas
The names are the thematic areas under which European research and innovation work is commonly grouped. They name a **kind of work,
not a programme**: nothing in the hero says or implies that TechPi works under, or is endorsed by, any EU programme, and there is no EU
flag, emblem, logo or funding statement (`src/content/eu.ts` lists what must never be claimed). Each tile has a short label, and the full
name appears on hover and is always available to assistive technology (the pictures themselves are decorative: empty `alt`).

| # | Area (full name) | Photograph | Photographer | Place | Date | Camera | Page |
|---|---|---|---|---|---|---|---|
| 01 | Health | "White microscope on top of black table" (a row of microscopes on a laboratory bench) | Ousa Chea | not stated | 2018-02-09 | Nikon D7100 | https://unsplash.com/photos/white-microscope-on-top-of-black-table-gKUC4TMhOiY |
| 02 | Culture, Creativity and Inclusive Society | "Strahov Monastery library hall in Prague" (baroque library, painted ceiling) | Reza Madani (@qarqa_) | Strahov Monastery, Prague, Czechia | 2026-10-14 | Sony ILCE-6500 | https://unsplash.com/photos/strahov-monastery-library-hall-in-prague-QejlSe1jA-M |
| 03 | Civil Security for Society | "Search and rescue helicopter in flight" | Szcze hoo (@szczehoo) | not stated | 2026-09-29 | Canon EOS 600D | https://unsplash.com/photos/search-and-rescue-helicopter-in-flight-QLwQ4R-W2Z4 |
| 04 | Digital, Industry and Space | "International Space Station orbits earth" | NASA | in orbit | 2021-02-26 | Nikon D2Xs (as listed) | https://unsplash.com/photos/international-space-station-orbits-earth-wAkLQnT2TC0 |
| 05 | Climate, Energy and Mobility | "Wind turbines on a beach under a blue sky" | Wolfgang Weiser (@hamburgmeinefreundin) | Hvide Sande, Denmark | 2025-11-01 | Sony ILCE-7M3 | https://unsplash.com/photos/wind-turbines-on-a-beach-under-a-blue-sky-fkw8M38KTzA |
| 06 | Food, Bioeconomy, Natural Resources, Agriculture and Environment | "Overhead view of long rows of covered crops" (aerial) | Bernd Dittrich (@hdbernd) | not stated | 2026-06-13 | DJI FC9184 (drone) | https://unsplash.com/photos/overhead-view-of-long-rows-of-covered-crops-XCwXhqV99Qs |

| # | File | Original (CDN id) |
|---|---|---|
| 01 | `src/assets/hero/eu-health.jpg` | `photo-1518152006812-edab29b069ac`, 2400 × 1600 |
| 02 | `src/assets/hero/eu-culture.jpg` | `photo-1791947208205-74d5fbc10f2b`, 2400 × 3600 (portrait) |
| 03 | `src/assets/hero/eu-security.jpg` | `photo-1790693599788-6ec3bb05a901`, 2400 × 1600 |
| 04 | `src/assets/hero/eu-digital.jpg` | `photo-1614314007212-0257d6e2f7d8`, 2400 × 1800 |
| 05 | `src/assets/hero/eu-climate.jpg` | `photo-1762006221255-bbc5fc546b56`, 2400 × 1600 |
| 06 | `src/assets/hero/eu-food.jpg` | `photo-1781332151189-90c7f9869b4b`, 2400 × 1800 |

### Edits (the licence allows modification)
- **Crops only, to 3:2 and 1800 × 1200:** 01, 03 and 05 are whole frames; 02 is a 3:2 band of the portrait original starting 170 px from
  the top (the painted ceiling and the upper shelves); 04 and 06 are 3:2 bands starting 100 px from the top. Re-encoded as JPEG (quality
  82); Astro converts them to WebP (320, 480 and 640 px wide) at build time.
- **No retouching in the files.** The shared look is applied by the site's CSS, so the originals stay untouched and replaceable: a
  muted grade (saturation 0.72, a touch more contrast), an Ink wash that carries the label, and a hairline edge. On hover a tile returns
  to the photograph's own colours.

### Why these, and what was left out
- Chosen for subject, a calm cool palette (blue sky, deep blue and black, glass and stone), no faces, and an obvious real photographer
  or agency behind them. Two are European places (Prague, Hvide Sande in Denmark); the rest are generic subjects.
- Not used: an earlier laboratory photograph that carried a small **EU-funding label** on the equipment (it would have read as a funding
  claim); "satellite" images that are 3D renders or Unsplash+ (paid); recent "coding desk" images that look generated.
- The English homepage no longer uses a photograph of a single laboratory; `hero-en.jpg` was removed in an earlier change.

## Greek: the photograph
Free to use under the Unsplash License (checked 2026-10-22). A real photograph (Canon EOS 60D); no face is shown.

| | |
|---|---|
| File | `src/assets/hero/hero-el.jpg` |
| Photograph | "A computer monitor and laptop displaying Swift code and a programming tutorial" (a developer's monitor with code, in blue light) |
| Photographer | Safar Safarov |
| Page | https://unsplash.com/photos/computer-monitor-and-laptop-programming-workspace-koOdUvfGr4c |
| Published | 3 March 2021 (as shown on the page) |
| Original (CDN id) | `photo-1614741118887-7a4ee193a5fa`, 1920 px wide |

**Edit:** cropped to a 16:9 band at the top of the portrait original (1920 × 1080): the monitor with the code. The crop drops the
monitor's brand mark and the laptop screen with its web address. Re-encoded as JPEG; Astro converts it to WebP. No grading or retouching.
Decorative (empty `alt`, `aria-hidden`). The Greek homepage is unchanged by the English grid.

## Replacing a photograph
Overwrite the file in `src/assets/hero/` (English tiles: 3:2, at least 1800 px wide; Greek: landscape, at least 1920 px wide) and, if
the subject moves, adjust its `focus` (CSS `object-position`) in `src/components/home/eu-themes.ts` or `hero-visual.ts`. Then update the
table above. `node scripts/assets/validate.mjs` (part of the checks) fails if the English homepage has other than six tiles, a tile
without a WebP photograph, a decorative image with alt text, a missing full name or label, the wrong line or link, or any programme,
Commission, funding, endorsement or flag wording in the grid; or if the Greek homepage loses its photograph or gains the grid.

## Screenshots (local build)
English: `en-desktop-1440.jpg`, `en-tablet-768.jpg`, `en-mobile-375.jpg`. Greek (unchanged): `el-desktop-1440.jpg`, `el-mobile-375.jpg`.
