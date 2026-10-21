# TechPi admin: Task M1B, all 18 case studies connected

Status: **implemented and tested locally against a mocked GitHub** (branch `feat/techpi-admin-m1b-all-case-studies`,
based on M1A). Nothing is deployed or merged; no real draft was saved. The public website's build output is
**byte-identical to `main`**.

## 1. What M1B does

Every one of the 18 published case studies is now managed through the custom admin, as Rocketeer was in M1A
([M1A.md](M1A.md)). For each one the admin loads the real content from GitHub, edits its English and Greek text, lists
and image alt texts, validates, detects conflicts, and saves a draft to the case study's own branch
`cms/case-studies/<slug>` with one draft pull request into `feat/techpi-admin-m1b-all-case-studies`. Saving never
changes techpi.eu. Publish stays disabled, and so does "New case study" (adding case studies is not built).

## 2. Content migration

`src/content/projects.ts` and `projects.el.ts` no longer contain content: the 18 entries were extracted
**programmatically** (no value retyped) into `content/case-studies/<slug>/index.json`. `src/content/case-studies.ts`
lists the 18 files explicitly; `projects.ts` keeps the types, the image registry and the functions the pages use, and
orders the projects by each file's locked `facts.order` (the build fails unless the positions are exactly 1 to 18).

Case studies legitimately differ, and each file keeps its own shape. Optional parts (highlights, disciplines, row image,
cover, cover caption, gallery, introduction, items, services, technology, outcome, client, Greek client name, live URL)
are present exactly where they were before. That shape is locked: in the admin, text and the number of items inside
existing sections can change, but sections cannot be added or removed, because that would change the page layout.

### Completeness checklist

| # | Case study | Group | Featured | Images | Optional sections | Facts | Migrated, parity-checked |
|---|---|---|---|---|---|---|---|
| 1 | `rocketeer` | Client | ✓ | row, cover, gallery 1 | items, technology, outcome | client, live URL | ✓ |
| 2 | `armans` | Client | ✓ | row, cover, gallery 1 | intro, items, technology, outcome | client, live URL | ✓ |
| 3 | `logotherapia-xanthi` | Client | ✓ | row, cover | caption, items, technology | client (Greek name), live URL | ✓ |
| 4 | `level-up-education-app` | Client | – | none | intro, services, technology, outcome | no client, live URL | ✓ |
| 5 | `saloon` | Client | – | none | highlights, intro, services, technology, outcome | no client | ✓ |
| 6 | `physio` | Client | – | none | highlights, intro, services, technology, outcome | no client | ✓ |
| 7 | `project4you` | Client | – | none | highlights, intro, services, technology | no client, live URL | ✓ |
| 8 | `rantevo` | Client | – | row, cover, gallery 1 | highlights, caption, intro, services, technology, outcome | no client | ✓ |
| 9 | `mavie` | Client | – | none | intro, services, technology, outcome | client, live URL | ✓ |
| 10 | `iliastech` | Client | – | none | intro, services, technology, outcome | client, live URL | ✓ |
| 11 | `alexandra-apartment` | Client | – | none | intro, services, technology, outcome | client | ✓ |
| 12 | `blackjack-streetwear` | Client | – | none | intro, services, technology, outcome | client | ✓ |
| 13 | `level-up-education` | Earlier | – | none | disciplines, intro, services, technology, outcome | client, live URL | ✓ |
| 14 | `itsallaboutxanthi` | Earlier | – | none | disciplines, intro, services, technology, outcome | client | ✓ |
| 15 | `local-xanthi` | Earlier | – | none | disciplines, intro, services, technology, outcome | client | ✓ |
| 16 | `juliette-coffee-roasters` | Earlier | – | none | disciplines, intro, services, outcome | client | ✓ |
| 17 | `apox-fc` | Earlier | – | none | disciplines, intro, services, outcome | client | ✓ |
| 18 | `emoved` | Earlier | – | none | disciplines, intro, services, technology, outcome | client | ✓ |

All 18: overview and the need in both languages; English and Greek have the same sections and the same number of items
in every list; every image has alt text in both languages; image sizes are checked against the files.

## 3. Parity and output

- **Data parity:** before the change, every project was dumped as the pages see it (English, and Greek after the merge in
  `toGreek`). After the change the same dump is **deep-equal for all 18 projects in both languages** (36 of 36), as are
  the Work order, the case-study order and the featured list.
- **Output parity:** `dist` (123 files) is byte-identical to the `main` reference build.
- **Live loading:** editing a file changes only the pages that show that text (Rocketeer summary: home, Work and the case
  study in both languages; Emoved outcome and services: its two case-study pages). The edits were reverted.
- **SEO:** the admin's generated title and description match the built `<title>` and meta description on all 36
  case-study pages. Canonical, hreflang, sitemap and redirects are unchanged (byte-identical output).

## 4. Backend

The allowlist in `admin/shared/case-study-content.js` is exactly the 18 slugs. Unknown slugs, path tricks, a publish
or create endpoint, and other collections are refused before GitHub is contacted. The rest is unchanged from M1A:
Access identity and allowlist, same-origin checks, the GitHub App token limited to this repository, blob-SHA conflict
checks, writes only to `cms/case-studies/<slug>`, `main` refused as a base, facts and images taken from the stored file.
A save to one case study cannot touch another one's file or branch.

## 5. Admin interface

The Case studies list marks all 18 as Connected and shows each one's real status from GitHub (open draft pull request
or saved version, with the PR number), refreshed whenever the list or the Dashboard is opened. The Dashboard lists the
open case-study drafts. The editor shows only the sections that case study has; locked details include the Greek client
name where there is one, the capabilities and the position.

## 6. Local test with real GitHub (owner)

Nothing below has been run. In the local, git-ignored `admin/wrangler.local.jsonc`, change `CONTENT_BASE_BRANCH` to
`feat/techpi-admin-m1b-all-case-studies` (the branch must be pushed; it is, with this pull request). `.dev.vars` is not
touched. Then in `admin/`:

```bash
node scripts/check-local-config.mjs --github
npm run build
npx wrangler dev --config wrangler.local.jsonc
```

Open `http://127.0.0.1:8787/#/case-studies`. Loading is read-only. Each **Save draft** creates or updates one public
draft pull request for that case study into the M1B branch; close them without merging when the test is done.

## 7. Not in M1B

New case studies, media uploads, Insights articles, website pages, publishing, image or fact editing, and adding or
removing sections.
