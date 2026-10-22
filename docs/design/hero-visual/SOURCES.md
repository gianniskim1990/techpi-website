# Homepage hero visuals: what each language shows, sources, licences and edits

| | English homepage (`/`) | Greek homepage (`/el/`) |
|---|---|---|
| Theme | EU projects: digital solutions for EU-funded projects | Websites, web applications and digital solutions |
| Visual | **An illustration** of an EU project website (`src/components/home/EuHeroPanel.astro`), with the line "Digital solutions for EU-funded projects" and a link "Explore EU Project Solutions" to `/eu-projects` | **A photograph** (`src/assets/hero/hero-el.jpg`) in the corner the hero arc opens, clipped by the arc |
| Chosen | At build time from the page's `locale` (never from the referrer, the browser's language or a redirect) | The same |

## English: the EU projects panel (an illustration, not a photograph)
The first version showed a laboratory photograph (Trnava University, Unsplash). The curved frame cropped it to a small fragment of
equipment, and visitors could not tell that TechPi builds digital solutions for EU-funded projects, so it was retired and its file
removed. The panel replaces it.

- **What it is:** a drawing in markup (HTML and CSS, no image file, so no licence and no download): a project website with its
  header, navigation, a headline, a partner network and three tiles. The section names are the ones the EU Projects page uses for
  a project website's content model (`euCopy.en.page.websites.model`: Partners, Work packages, Deliverables, Results, Events,
  Stakeholders).
- **What it is not:** it is **not a real project**. TechPi has no verified EU project work to show (`src/content/eu.ts` lists that
  no specific EU project, partner, result or programme may be claimed), so nothing here is a screenshot of client work. It is
  labelled "Illustrative example", uses the placeholder "Project name", and contains no logo, partner, number, programme name,
  funding statement, EU flag, stars or blue-and-yellow. Hidden from assistive technology (`aria-hidden`); the line and the link
  beside it carry the meaning.
- **If a real project is approved later:** replace the drawing with a screenshot only once the project's owner has confirmed in
  writing that it may be shown, and the display rights are recorded here.
- **Guarded by a check:** `node scripts/assets/validate.mjs` fails if the English homepage loses the line, the link (it must read
  "Explore EU Project Solutions" and point to `/eu-projects`) or the drawing's `aria-hidden`, gains a photograph, or mentions a
  programme, the Commission, funding or a flag inside the panel.

## Greek: the photograph
Free to use under the [Unsplash License](https://unsplash.com/license): irrevocable, worldwide, for commercial use, **without
permission from or attribution to** the photographer or Unsplash. Checked on its Unsplash page on 2026-10-22 ("Free to use under
the Unsplash License", not Unsplash+). A real photograph from before 2022 (not generated); no face is shown.

| | |
|---|---|
| File | `src/assets/hero/hero-el.jpg` |
| Photograph | "A computer monitor and laptop displaying Swift code and a programming tutorial" (a developer's monitor with code, in blue light) |
| Photographer | Safar Safarov |
| Page | https://unsplash.com/photos/computer-monitor-and-laptop-programming-workspace-koOdUvfGr4c |
| Published | 3 March 2021 (as shown on the page) |
| Camera | Canon EOS 60D |
| Original (CDN id) | `photo-1614741118887-7a4ee193a5fa`, 1920 px wide |

**Edit (the licence allows modification):** cropped to a 16:9 band at the top of the portrait original (1920 × 1080): the monitor
with the code. The crop drops the monitor's brand mark and the laptop screen with its web address. Re-encoded as JPEG; Astro
converts it to WebP (16 to 51 KB per size). No colour grading, retouching or added text. Decorative (empty `alt`, `aria-hidden`).

**Replacing it:** overwrite `src/assets/hero/hero-el.jpg` (a landscape photograph at least 1920 px wide) and, if the important part
moves, adjust `focus` in `src/components/home/hero-visual.ts`.

## Screenshots (local build)
English: `en-desktop-1440.jpg`, `en-tablet-768.jpg`, `en-mobile-375.jpg`. Greek (unchanged): `el-desktop-1440.jpg`,
`el-mobile-375.jpg`.
