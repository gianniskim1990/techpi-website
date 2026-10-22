# Homepage hero photographs: sources, licences and edits

One photograph per language, chosen at build time from the page's `locale` (`src/components/home/hero-visual.ts`). Both are
**free to use under the [Unsplash License](https://unsplash.com/license)**: irrevocable, worldwide, for commercial use,
**without permission from or attribution to** the photographer or Unsplash (attribution is appreciated, not required).
Both were checked on their Unsplash pages on 2026-10-22 (the page says "Free to use under the Unsplash License", not
Unsplash+). Both are real photographs published before 2022 (no generated images), and neither shows a person's face.

| | English homepage (`/`) | Greek homepage (`/el/`) |
|---|---|---|
| Theme | EU projects, European research and innovation | Websites, web applications and digital solutions |
| File | `src/assets/hero/hero-en.jpg` | `src/assets/hero/hero-el.jpg` |
| Photograph | "A laboratory workbench with a microscope and analytical equipment in a bright room" (the pavilion of clinical and laboratory disciplines of Trnava University, Slovakia) | "A computer monitor and laptop displaying Swift code and a programming tutorial" (a developer's monitor with code, in blue light) |
| Photographer | Trnava University | Safar Safarov |
| Page | https://unsplash.com/photos/laboratory-workbench-with-microscope-and-equipment-_9xRHrMOjeg | https://unsplash.com/photos/computer-monitor-and-laptop-programming-workspace-koOdUvfGr4c |
| Published | 7 October 2020 | 3 March 2021 (as shown on the page) |
| Camera | Canon EOS 6D Mark II | Canon EOS 60D |
| Original (CDN id) | `photo-1602052577122-f73b9710adba`, 2400 px wide | `photo-1614741118887-7a4ee193a5fa`, 1920 px wide |

## Edits (the licence allows modification)
- **English:** cropped to the top 77% of the frame (2400 × 1232). The crop drops a small **EU-funding label** that is stuck on
  the base of the microscope in the original, so the page makes no funding claim and shows no EU emblem. Re-encoded as JPEG;
  Astro converts it to WebP (480, 720 and 960 px wide, 14 to 40 KB) at build time.
- **Greek:** cropped to a 16:9 band at the top of the portrait original (1920 × 1080): the monitor with the code. The crop drops
  the monitor's brand mark and the laptop screen with its web address. Re-encoded as JPEG; Astro converts it to WebP (16 to 51 KB).
- Nothing else: no colour grading, retouching or added text. Each picture has an empty `alt` and is `aria-hidden`, because the
  headline already says everything.

## What was deliberately not used
- No EU flag, EU emblem or funding statement, and no paid stock photograph (none could be licensed from here): the English image
  is a plain, authentic research laboratory in a European university.
- Several other candidates were rejected: recent "coding desk" images with neon lighting (they look generated and are garish for
  this identity), and one dark workspace image whose text and logos show it is a generated render.

## Replacing a photograph
Overwrite the file in `src/assets/hero/` (same name, a landscape photograph at least 1920 px wide), then adjust that language's
`focus` (CSS `object-position`) in `src/components/home/hero-visual.ts` if the important part moves. On desktop the picture shows as
a curved wedge about 660 px wide at the top and 200 px at the bottom; on tablets and phones, as a wide band (96 to 240 px tall).
`node scripts/assets/validate.mjs` (part of the checks) fails if a homepage ships the wrong language's file, a non-WebP file, or a
non-decorative image.

## Screenshots
`en-desktop-1440.jpg`, `el-desktop-1440.jpg`, `en-mobile-375.jpg`, `el-mobile-375.jpg` (local build, animations settled).
