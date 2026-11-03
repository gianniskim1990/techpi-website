# M6: images for new case studies

Status: built 2026-10-23. Builds on M5 (creating case studies). As with every admin change, nothing is published until
the case study's draft pull request is merged on GitHub.

## What the owner can do

In the editor of a **new** case study (created in the admin, draft not merged yet), the Images card offers:

| Place | Shown | Actions |
|---|---|---|
| Row image | On the Work page, beside the project | Upload, Replace, Remove |
| Cover | At the top of the case-study page, edge to edge; optional caption | Upload, Replace, Remove |
| Gallery | After the case-study text, up to 8 | Add image, Remove |

Each upload asks for the file and its alt text in English and Greek (both required); the cover also takes an optional
caption in both languages. Alt texts are then edited like any other text and saved with **Save draft**. Image controls
are disabled while the text has unsaved changes (save or discard first), so an image change never conflicts with them.

Images of case studies that are already on the website are not changed in the admin (the card shows them, with editable
alt text, as before). New case studies are still not featured on the homepage: the homepage's crops are composed by hand
(`src/components/workCompositions.ts`).

## How an upload works

1. **In the browser** (`admin/src/app/lib/images.js`): the picture is drawn onto a canvas at most 2560 pixels on its longer
   side and encoded again as WebP (JPEG where the browser cannot write WebP), under 3 MB. This applies the photo's
   orientation and removes everything else in the file: EXIF (camera, location), XMP and text. Smaller than 320 pixels on
   a side is refused.
2. **In the Worker** (`admin/worker/images.js`), checked from the bytes, not the name (`admin/shared/image-info.js`): a
   real PNG, JPEG or WebP; at most 3 MB; 320 to 8000 pixels a side; no embedded EXIF, XMP or text; alt text present and
   plain; only for a new case study with an open draft; the version being edited is the current one.
3. **One commit** on the case study's draft branch (GitHub Git Data API): the image file
   `src/assets/projects/<slug>-<place>-<n>.<ext>`, the updated `content/case-studies/<slug>/index.json` (image id and its
   real width and height, alt texts, caption), and the deletion of any image file the case study no longer uses. The
   branch is moved only if nobody changed it meanwhile (no forced update); otherwise nothing changes and the editor asks
   to reload. Nothing is ever written to the base branch or `main`.

Previews in the editor are fetched from the draft (`GET /api/case-studies/<slug>/images/<id>`, only images the case study
uses, served with their real type) and shown as `data:` URLs, which the admin's Content Security Policy already allows.

## What changed on the site

- `src/content/projects.ts` reads every PNG, JPEG or WebP in `src/assets/projects` (`import.meta.glob`) instead of a
  hand-kept import list; an image's id is its file name. So a merged case study's images are published with no code
  change. The 62 pages and the 87 generated image files are identical to before.
- `scripts/assets/validate.mjs` now checks every file in that folder from its bytes (type, extension, at most 3 MB, unique
  id), that each referenced image exists with exactly its declared size, and that **every file is used** by a case study.
  It accepts `--dist` like the other validators. Its check for full-size originals leaking into `dist/` now also catches
  Astro hashes containing `_` (it missed those before).

## Tests

- `admin/test/images-api.test.mjs` (9): add a row image (exact bytes, real size, alt texts, one commit, one ref move on the
  draft branch only, base and `main` untouched, preview with its real type); replace the cover (new file, old file deleted
  in the same commit, captions); gallery add and remove (files and alt texts follow, the last removal removes the
  gallery); alt texts then edited with a normal save; refusals before anything is written (SVG with a script, GIF, JPEG
  with EXIF, too small, too large, missing or marked-up alt text, unknown place, no version); stale versions and a branch
  that moved meanwhile; published case studies refused; auth and same-origin; and an **end-to-end publish**: a case study
  with an uploaded WebP row image, PNG cover and JPEG gallery image builds, every site validator passes, and the pages
  carry the images and the captions in both languages.
- The GitHub mock gained the Git Data API (blobs, trees, commits, fast-forward-only ref updates) and SHAs in directory
  listings, as GitHub returns them.
- Admin suite 196/196; local workerd end-to-end passes; browser check of the dialog: a 5.2 MB 3200 × 2000 PNG became a
  2560 × 1600 WebP of 38 KB, saved, previewed after reload; too-small and missing-alt errors; gallery add and remove;
  controls locked while text is unsaved; no upload controls on a published case study.
