# M8: media library

Status: built 2026-10-23. Builds on M6 (images for new case studies) and M7 (images for new articles), and uses the same
upload checks. Nothing is published until a draft pull request is merged on GitHub.

## What the owner can do

A **Media** page in the admin, like the media library in WordPress:

- **Upload** images: several at once, from the file picker or dropped on the page. Each gets a title from its file name.
- **Browse** every image a page can use: the library's own uploads, and the images the case studies and articles
  already use. Search by title or alt text; filter by library uploads, unused library images, case-study images or
  article images. Each tile says where the image is used.
- **Edit** a library image's title, and the default alt text and caption (English and Greek, optional) that a page
  starts from when it uses the image.
- **Remove** a library image that no page uses (two clicks). An image in use, even only in a draft, cannot be removed.
- **Use** any of these images on a new case study or article: its image dialog now offers **Upload a file** or **Media
  library**. Picking a library image fills in its default alt text and caption wherever those fields are still empty.
  The page then refers to the image by name, and nothing is uploaded again.

The images of case studies and articles are read-only in the library: they are changed through their own entry, as
before. Published entries' images stay locked (M6/M7).

## How it is stored

| File | What |
|---|---|
| `src/assets/media/<id>.<ext>` | The image (PNG, JPEG or WebP), checked exactly like an M6/M7 upload |
| `content/media/<id>/index.json` | Its details: id, title, size, type, upload date, optional `alt` and `caption` per language |
| `content/media/<id>/thumb.<webp\|jpg>` | A copy of at most 480 pixels for the admin's library view; never used by the website |

The `<id>` comes from the title (Greek is transliterated, so "Γραφείο στο λιμάνι" becomes `grafeio-sto-limani`), with
`-2`, `-3` and so on added when needed. It is unique across `src/assets/projects`, `src/assets/insights` and
`src/assets/media`, and never ends like an entry's own upload (`<slug>-<slot>-<n>`), so the two can never collide.

**One draft pull request for the library.** Every library change (upload, details edit, removal) is a commit on one
branch, `cms/media/library`, with one draft pull request into the base branch, opened by the first change and reused
until it is merged or closed. A closed draft's branch is started again from the base; a branch holding commits that no
closed pull request accounts for is never overwritten (the same rules as entry drafts). The draft-branch guard in
`admin/worker/api.js` allows exactly this one extra branch name.

**Using a library image.** `POST /api/<collection>/<slug>/images/use` saves a reference `{ id, width, height }` (size read
from the file) in the entry's file, with its alt text and caption, in one commit. If the entry's draft branch does not have
the file yet (a library image not merged yet, or merged after the draft began), the same file is added to the draft,
unchanged and by its Git hash, so the draft builds on its own; merging both drafts then adds an identical file twice,
which is not a conflict. If the entry later stops using such an image, the file is taken out of its draft again. A
library image that is on the base branch, and another entry's image, are never touched by an entry.

## Site

- `src/content/image-files.ts` is the one registry of images by id, used by case studies and articles alike, so any entry
  may use an image from any of the three folders.
- **An unused library image is not published.** Astro copies every imported image into the build unless a page renders
  it, so `scripts/media/used-media.mjs` (a Vite plugin) serves `virtual:techpi-media` with only the library images a case
  study or article references. Unused uploads therefore add nothing to `dist/` (checked: no original, no derivative).
- `scripts/assets/validate.mjs` now checks the three folders together: real images, ids unique across folders, declared
  sizes exact, no unused file outside the library (library images may be unused), each `content/media/<id>` belongs to
  an image in `src/assets/media`, and no full-size original in `dist/`.
- `scripts/content/validate-cms-media.mjs` already accepts `content/media/` (JSON and raster images only).
- Regression: the built site is identical to #58's (all 62 pages, every file in `dist/`).

## API

| Route | |
|---|---|
| `GET /api/media` | Every image, with title, size, status (`published`, `new`, `removing`, `edited`), where it is used, and the content hashes of the image and its small copy |
| `POST /api/media` | Upload `{ data, thumb, title, alt?, caption? }` |
| `POST /api/media/<id>` | Edit `{ expectedSha, title, alt?, caption? }`, refused if the details changed meanwhile |
| `POST /api/media/<id>/delete` | Remove an unused library image |
| `GET /api/media/blobs/<sha>` | An image or small copy by content hash (one GitHub request; only image bytes are ever served) |
| `GET /api/media/<id>/file`, `/thumb` | The image or its small copy by name |

The library list reads one Git tree per branch and the entries' files, so it costs a few dozen GitHub requests at most
for this site's size.

## Tests

- `admin/test/media-api.test.mjs` (8): ids (Greek, duplicates, entry-like names); uploads (one branch, one draft pull
  request, a commit each, base untouched, exact details file); the list (library and site images, where used, sizes,
  small copies and files with their types, by-hash serving refuses non-images); details edits (stale version, invalid
  text, no-op writes nothing); a new case study and a new article using library images (file brought into the draft only
  when needed, removed again when replaced, never a published one; refusals); removal (published, new, in use, entry
  images, unknown); refusals before any write (SVG, EXIF, too small, bad small copy, empty title, line breaks, leftover
  branch, closed draft restarted, no sign-in, missing header, path tricks); and an **end-to-end publish**: the real
  build and every site validator pass, the used library image is on the page with its alt text, and the unused one is
  not in `dist/` at all.
- Admin 209/209 (one older test used `/api/media` as its example of a route that does not exist; it now uses
  `/api/uploads`); local workerd end-to-end passes; site check, build and all validators pass; worker tests 56/56.
- Browser (local admin + mock GitHub): two images uploaded at once (one with a Greek file name), a details edit, the
  library picker in a new case study's cover dialog (defaults filled in; a one-language cover caption refused, as
  before), an article section image taken from a case study, removal refused while in use and done in two clicks when
  not, the draft pull request banner, and the phone layout (no sideways scrolling).

## Deploy note

Admin redeploy after merge (`docs/admin/M4-GO-LIVE.md`). No new GitHub permission: the GitHub App already writes
contents and pull requests; the library only adds the branch name `cms/media/library`.
