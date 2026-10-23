# M7: images for new Insights articles

Status: built 2026-10-23. Builds on M5 (creating articles) and M6 (images for new case studies), and uses the same
upload path. Nothing is published until the article's draft pull request is merged on GitHub.

## What the owner can do

In the editor of a **new** article (created in the admin, draft not merged), an Images card offers:

| Place | Shown on the article page | Actions |
|---|---|---|
| Cover | Between the head (title, lead, date) and the text, a little wider than the text | Upload, Replace, Remove |
| Section N | After that section's text, at the text's width | Upload, Replace, Remove |

Each upload asks for the file, its **alt text** (required) and an optional **caption**, in English (articles are English
only). Afterwards the alt text and caption appear in the editor (under the lead for the cover, in each section's card for
its image) and are edited with the rest of the text; an emptied caption is removed, an emptied alt text is refused.
Image controls are disabled while the text has unsaved changes. Published articles' images are not changed in the admin,
and the 7 migrated articles have none.

The article's structured data (`Article`) and its sharing image stay as they were: the SEO rules for this site keep the
`Article` node without an image and every page's sharing image as the site's own (`scripts/seo/validate.mjs`).

## How it works

Exactly as for case studies (`M6-IMAGES.md`): the browser resizes to at most 2560 pixels and re-encodes (removing EXIF,
location, XMP and text); the Worker checks the bytes (real PNG, JPEG or WebP, at most 3 MB, 320 to 8000 pixels a side, no
embedded metadata), and writes the image file `src/assets/insights/<slug>-<cover|section>-<n>.<ext>`, the updated
`content/insights/<slug>/index.json` and the deletion of any image no longer used in **one commit** on the draft branch,
moving the branch only as a fast-forward. `admin/worker/images.js` now serves both collections from one implementation.

Content format (`admin/shared/insight-content.js`): an optional `images` { `cover`, `sections`: { "<section index>": … } }
of { id, width, height }; `en.coverAlt` / `en.coverCaption`; `imageAlt` / `imageCaption` on a section. Alt text is
required exactly when the image exists. Files without images are written exactly as before.

## Site

- `src/content/insights.ts` reads every image in `src/assets/insights` by folder (id = file name), like project images.
- `src/components/pages/InsightPage.astro` shows the cover after the head and a section's image at the end of the
  section, each in a `<figure>` with its caption, through the same `ProjectMedia` component as case studies (WebP
  derivatives at several widths, declared sizes, lazy except the cover).
- `scripts/assets/validate.mjs` checks `src/assets/insights` like `src/assets/projects`: real images, sizes as declared,
  no unused file, no full-size original in `dist/`.
- Regression: against #57, all 62 pages have identical markup; only the site-wide CSP list of inline-style hashes gained
  one entry (the `ProjectMedia` style, now also used by the article template).

## Tests

- `admin/test/article-images-api.test.mjs` (5): cover and section image (files, ids, sizes, alt text, captions, one
  commit each, base untouched, preview type); replace and remove (old files deleted in the same commit, the `images`
  entry removed with the last image, canonical file again); alt and caption edits via a normal save (emptied caption
  removed, emptied alt and alt without an image refused); refusals (SVG, EXIF JPEG, too small, a section that does not
  exist, missing alt, a case-study-style alt object, a gallery, a stale version, a published article, no sign-in); and an
  **end-to-end publish**: the real build and every site validator pass, the cover with its alt and caption and the
  section image inside its section are on the page, and the Article data still has no image.
- Admin 201/201; local workerd end-to-end passes; site check, build and all validators pass.
- Browser (local admin + mock): cover and section image uploaded with previews; their text fields appear; a caption
  cleared and another added through Save draft; controls locked while text is unsaved; published articles show no
  Images card. Also fixed: the editor's "Position 8 of 7" (a fixed count from before articles could be created) now
  shows the real place on the Insights page.
