# Homepage hero visuals: what each language shows, sources, licences and edits

| | English homepage (`/`) | Greek homepage (`/el/`) |
|---|---|---|
| Theme | EU projects: digital solutions for EU-funded projects, across their thematic breadth | Digital services for businesses: websites, web design, dashboards, web and mobile apps, online stores, automation |
| Visual | **A large layered background of six photographs**, one for each thematic area of EU-funded projects, overlapping, masked and softened into the Paper behind the headline and diagram; plus the line "Digital solutions for EU-funded projects" and a link "Explore EU Project Solutions" to `/eu-projects` (`src/components/home/EuHeroBackdrop.astro`, `eu-themes.ts`) | **A large layered background of six photographs** of those services, in the same visual language but its own arrangement, with a line "Ψηφιακές λύσεις για επιχειρήσεις" and a link "Δείτε τις δυνατότητές μας" to `/el/capabilities` (`src/components/home/BizHeroBackdrop.astro`, `biz-themes.ts`) |
| Chosen | At build time from the page's `locale` (never from the referrer, the browser's language or a redirect) | The same |

All twelve photographs (six per language) are **free to use under the [Unsplash License](https://unsplash.com/license)**: irrevocable, worldwide, for
commercial use, **without permission from or attribution to** the photographer or Unsplash (attribution is appreciated, not required).
Each Unsplash page was checked on 2026-10-22 and reads "Free to use under the Unsplash License" (none is an Unsplash+ photograph).
They are real photographs: each page lists the camera that took it (a Nikon, Canon, Sony, Panasonic, Fujifilm or DJI drone; NASA's for
the station), none is a 3D render or generated image, and none shows an identifiable face. "Date" below is the upload date (English:
read from the photograph's Unsplash file id; Greek: as shown on the page). Unsplash does not provide model or property releases; none of
these shows a brand mark or a private building's name (a few show a hand or an arm).

## English: the six thematic areas
The names are the thematic areas under which European research and innovation work is commonly grouped. They name a **kind of work,
not a programme**: nothing in the hero says or implies that TechPi works under, or is endorsed by, any EU programme, and there is no EU
flag, emblem, logo or funding statement (`src/content/eu.ts` lists what must never be claimed). The photographs are decorative
background (empty `alt`, `aria-hidden`); the area names are not shown, only recorded here and in `eu-themes.ts`.

**Composition (desktop):** a skyline across the top (digital, culture, climate, left to right), health down the right edge, security and
food in the lower right; the left and lower left are left to the diagram and headline. Each layer has an oval mask intersected with a
fade on all four sides, so no edge is ever visible; a Paper veil gathers behind the headline, the navigation and "Selected work".
Tablet and phone recompose the same six layers for a tall narrow stage.

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
  muted, lifted grade (saturation 0.72, contrast 0.94, brightness 1.08), per-layer opacity (0.34 to 0.92), masks and a Paper veil.

### Why these, and what was left out
- Chosen for subject, a calm cool palette (blue sky, deep blue and black, glass and stone), no faces, and an obvious real photographer
  or agency behind them. Two are European places (Prague, Hvide Sande in Denmark); the rest are generic subjects.
- Not used: an earlier laboratory photograph that carried a small **EU-funding label** on the equipment (it would have read as a funding
  claim); "satellite" images that are 3D renders or Unsplash+ (paid); recent "coding desk" images that look generated.
- The English homepage no longer uses a photograph of a single laboratory (`hero-en.jpg` was removed earlier), the illustrative
  EU-projects card, or the six-tile grid with labels (superseded by this background).

## Greek: the six service areas
The photographs show the tools and work Greek business visitors come to TechPi for: a website on a laptop, a dashboard, a web design
wireframe board, a mobile app, an online payment, a workflow sketch. They are decorative background (empty `alt`, `aria-hidden`; the area
names are only recorded here and in `biz-themes.ts`). They show **tools and work, never a client, a brand or a result**: nothing says or
implies that TechPi made what is pictured, and there are no logos, awards or funding claims. Incidental hardware (a laptop, an iMac, a
phone) appears without a visible brand mark after the crops and under the heavy softening. No face is shown.

**Composition (desktop):** the website on its laptop is the large layer at the top right; the wireframe board and the dashboard form a band
across the top; the phone runs down the right edge; the card payment and the workflow sketch sit in the lower right. The left and lower
left are left to the diagram and headline. Same masks, grade, veil and motion as the English hero (a related family, a different picture).
Tablet and phone recompose the layers. A small chip (the line "Ψηφιακές λύσεις για επιχειρήσεις", "Digital solutions for businesses", and a
link "Δείτε τις δυνατότητές μας" to `/el/capabilities`) sits top right on desktop and above the diagram on tablet and phone.

| # | Area | Photograph | Photographer | Place | Date | Camera | Page |
|---|---|---|---|---|---|---|---|
| 1 | Websites, business software | "A MacBook with lines of code on its screen on a busy desk" | Christopher Gower (@cgower) | not stated | 2017-06-21 | Panasonic DMC-G7 | https://unsplash.com/photos/a-macbook-with-lines-of-code-on-its-screen-on-a-busy-desk-m_HRfLhgABo |
| 2 | Web design and web applications | "Person working on blue and white paper on board" (a wireflow of an app) | Alvaro Reyes (@alvarordesign) | Las Condes, Chile | 2018-07-12 | Canon EOS 60D | https://unsplash.com/photos/person-working-on-blue-and-white-paper-on-board-qWwpHwip31M |
| 3 | Dashboards and digital tools | "Graphs of performance analytics on a laptop screen" | Luke Chesser (@lukechesser) | not stated | 2019-02-27 | Fujifilm X-Pro1 | https://unsplash.com/photos/graphs-of-performance-analytics-on-a-laptop-screen-JKUTrJ4vK00 |
| 4 | Mobile and web apps | "Smartphone displaying environmental data dashboard" | Balázs Kétyi (@balazsketyi) | Budapest, Hungary | 2019-03-03 | Sony ILCE-5000 | https://unsplash.com/photos/smartphone-displaying-environmental-data-dashboard-sScmok4Iq1o |
| 5 | Online stores | "Person using laptop computer holding card" (hands only) | rupixen (@rupixen) | not stated | 2019-07-13 | Canon EOS 1300D | https://unsplash.com/photos/person-using-laptop-computer-holding-card-Q59HmzK38eQ |
| 6 | Automation and digital workflows | "A person drawing a diagram on a piece of paper" (a flowchart) | Kelly Sikkema (@kellysikkema) | not stated | 2022-03-07 | Nikon D500 | https://unsplash.com/photos/a-person-drawing-a-diagram-on-a-piece-of-paper-lFtttcsx5Vk |

Photographers are the "Photo by" names in each page's title. Each page was checked on 2026-10-22 and reads "Free to use under the Unsplash
License" (none is Unsplash+). All six list the camera that took them and are dated 2017 to 2022.

| # | File | Original (CDN id) | Crop |
|---|---|---|---|
| 1 | `src/assets/hero/el-website.jpg` | `photo-1498050108023-c5249f4df085`, 2400 × 1598 | full width, 3:2 |
| 2 | `src/assets/hero/el-design.jpg` | `photo-1531403009284-440f080d1e12`, 2400 × 1600 | whole frame |
| 3 | `src/assets/hero/el-dashboard.jpg` | `photo-1551288049-bebda4e38f71`, 2400 × 1600 | whole frame |
| 4 | `src/assets/hero/el-app.jpg` | `photo-1551650975-87deedd944c3`, 2400 × 1800 | 1800 × 1200 from (600, 600): the lower part of the phone and the hand. Chosen so the app's on-screen greeting (a first name) and the iMac's logo are outside the frame |
| 5 | `src/assets/hero/el-store.jpg` | `photo-1563013544-824ae1b704d3`, 2400 × 1600 | whole frame |
| 6 | `src/assets/hero/el-workflow.jpg` | `photo-1646617747563-4f080bddf282`, 2400 × 1600 | whole frame |

**Edits:** crops only (the rest is CSS: muted lifted grade, per-layer opacity 0.26 to 0.9, masks, a Paper veil). Re-encoded as JPEG
(quality 82); Astro converts them to WebP (640, 960 and 1280 px wide) at build time. Not used: a saturated rainbow-lit laptop
(out of palette), a card-payment photograph with a face, and recent images that look generated.

The earlier single Greek photograph (`hero-el.jpg`, Safar Safarov, a developer's monitor, clipped by the hero arc) was retired in this
change, together with `hero-visual.ts` and the `.visual` hero markup.

## Replacing a photograph
Overwrite the file in `src/assets/hero/` (3:2, at least 1800 px wide) and, if the subject moves, adjust its `focus` (CSS
`object-position`) in `src/components/home/eu-themes.ts` (English) or `biz-themes.ts` (Greek); placement and opacity are in
`EuHeroBackdrop.astro` and `BizHeroBackdrop.astro` (`.ph-<key>`). Then update the tables above. `node scripts/assets/validate.mjs` fails
if either homepage has other than six background photographs, one without a WebP file, a decorative image with alt text, the wrong line
or link, or any programme, Commission, funding, endorsement, award or flag wording; or if either homepage carries the other's
background, or any other page carries a hero visual.

## Screenshots (local build)
English (unchanged by the Greek work): `en-desktop-1440.jpg`, `en-tablet-768.jpg`, `en-mobile-375.jpg`. Greek: `el-desktop-1440.jpg`,
`el-tablet-768.jpg`, `el-mobile-375.jpg`.
