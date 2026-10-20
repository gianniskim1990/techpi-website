# TechPi admin: Task M1A, the first real case study (Rocketeer)

Status: **implemented and tested locally against a mocked GitHub** (branch `feat/techpi-admin-m1a-rocketeer`).
Nothing is deployed or merged. The public website's build output is **byte-identical to `main`**. A real draft save
through the local admin must be started by the owner (section 6).

## 1. What M1A does

One published case study, **Rocketeer**, is now managed through the custom admin. Its English and Greek text can be
loaded, edited and saved as a GitHub draft (a draft branch and one draft pull request into the M1A branch). Saving
never changes techpi.eu: the public site only changes when a draft pull request is merged and that change later reaches
`main`, which is a separate decision. Publish stays disabled. The other 17 case studies and the Insights articles are
untouched and stay a read-only snapshot.

## 2. Where Rocketeer's content lives now

`content/case-studies/rocketeer/index.json`, extracted programmatically from `src/content/projects.ts` and
`projects.el.ts` (no value was retyped):

| Part | Contents | Editable in the admin |
|---|---|---|
| `en`, `el` | category, summary, overview paragraphs, the need paragraphs, what was built (optional introduction and items), technology, outcome, alt text of the row image, cover and gallery image | **Yes**, both languages |
| `facts` | name, client, year, live URL, group, featured flag, display order, capabilities, source | No (locked) |
| `images` | image ids (the files stay in `src/assets/projects`) and their declared pixel sizes | No (locked) |

Only the text is editable by design: facts and images carry URLs, ordering and layout. The URL `/work/rocketeer` and
all redirects are unchanged. SEO values are not stored separately: as before, the page title and description are
generated from the name, category and summary (`caseStudyMeta`), the canonical and hreflang links from the route, and the
sitemap from the case-study list. The editor shows these generated values and a search preview. Editing the category or
summary changes them, and nothing else does.

## 3. How the public site reads it

`src/content/case-study-loader.ts` validates the file on **every build** (with the same rules the admin uses) and builds
exactly the `Project` object (English) and the Greek text object that `projects.ts` and `projects.el.ts` previously
contained. Only the Rocketeer entry is read this way; it keeps position 1 in the portfolio (the recorded `order` is
checked against the real position, and the build fails if they differ). An invalid file fails the build, so it can never
reach the site. No page, component, route or style was changed.

`scripts/assets/validate.mjs` additionally checks the declared sizes of managed images against the files.

## 4. The admin backend (additions to A1)

New collection `case-studies` in `admin/worker/api.js`, using the existing GitHub App and Access checks (no change to
authentication, permissions or Access):

- `GET /api/case-studies`, `GET /api/case-studies/rocketeer`, `POST /api/case-studies/rocketeer/draft`.
- **Allowlist of one slug.** Any other case study returns 404; there is no publish, merge or delete endpoint.
- The browser sends only `{ en, el }`. The Worker takes `facts` and `images` from the current file, so they cannot be
  changed by a request; extra keys such as `facts`, `images`, `branch`, `repo` or `path` are refused or ignored.
- Server-side validation: required fields and lengths, plain text only (no line breaks or `<` `>`), list sizes, gallery
  alt text count, and **English/Greek parity** (same number of items in every list; the optional introduction in both or
  neither). The existing file must itself be valid to be loaded or saved over.
- Optimistic concurrency with the file's Git blob SHA: a stale draft or a moved base branch gives 409 and the editor
  offers to reload. Repeated saves update the same draft pull request.
- Writes only to `cms/case-studies/rocketeer`; the pull request targets the base branch (`CONTENT_BASE_BRANCH`, now
  `feat/techpi-admin-m1a-rocketeer`). `main` is refused as a base.
- The pull request body states that the repository is public and that merging into the development branch does not change
  techpi.eu.

## 5. The admin interface

The Case studies list marks Rocketeer as **Connected**; its editor shows English and Greek tabs, a repeatable list editor
for paragraphs and bullets (add, remove, reorder, per-item errors and counters), a live warning when the two languages
differ in structure, locked details, the generated SEO preview, the draft branch and pull request link, a conflict
dialog, a mobile save bar, and Publish disabled with an explanation and the public-repository notice.

| Genuinely working | Placeholder or not built |
|---|---|
| Load, edit, validate and Save Draft of Rocketeer EN and EL text and alt texts, repeated saves, conflict handling | Publish, preview of the draft site, unpublish |
| Locked facts and images displayed | Changing images, name, client, year, URL, featured flag or order |
| Draft branch and draft pull request | The other 17 case studies (read-only snapshot), pages, articles, media, SEO manager, settings |

## 6. Local preview and the first real draft (owner)

Push of the M1A branch is required first, because drafts are based on it (done with this pull request). Then, in
`admin/`, with the A1 local configuration (`wrangler.local.jsonc` and `.dev.vars`, see [A1.md](A1.md) section 6; set
`CONTENT_BASE_BRANCH` to `feat/techpi-admin-m1a-rocketeer`):

```bash
node scripts/check-local-config.mjs --github
npm run build
npx wrangler dev --config wrangler.local.jsonc
```

Open `http://127.0.0.1:8787/#/case-studies/rocketeer`. Nothing is written to GitHub until you press **Save draft**; that
creates one public draft pull request into `feat/techpi-admin-m1a-rocketeer`, which you can close without merging.

## 7. Verification (see the pull request for the exact results)

- Resolved English and Greek Rocketeer objects identical before and after the extraction; `dist` byte-identical to `main`.
- Astro typecheck, full build and the content, legal, insights, redirect, CMS-media, SEO, security and asset validators.
- Admin: 56 unit tests (incl. 15 for Rocketeer) and 33 workerd end-to-end checks, GitHub mocked.
- Browser check of the editor: load, edit EN and EL, save, repeated save, parity and validation errors, conflict dialog,
  reload, mobile layout, no console errors apart from the expected 409.
