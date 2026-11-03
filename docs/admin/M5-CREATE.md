# M5: creating case studies and Insights articles

Status: built 2026-10-23. Nothing is published by creating: like every admin save, a new entry is a draft pull request,
and it reaches techpi.eu only when the owner reviews and merges it on GitHub.

## What the owner can do

| Where | What |
|---|---|
| Case studies → **New case study** | Address (`/work/<slug>`, follows the name until edited), project name, client (English and optionally Greek), year, live website, group (client projects or earlier work), capabilities, and which optional sections it has (highlights, disciplines, “what was built” introduction and/or list, services, technology, outcome). Then the English and the Greek text. |
| Articles → **New article** | Title, address (`/insights/<slug>`, follows the title until edited), publication date (today by default, never in the future), category, lead, any number of sections (1 to 12), each with paragraphs, a list and/or paragraphs after the list, an optional note, related articles, search title and description. English only. |

**Create draft** checks everything with the same rules the Worker and the site build use, then writes the entry's one
file on its own `cms/<collection>/<slug>` branch and opens one draft pull request. The admin then opens the normal editor
on it, marked “New, not on the website yet”; further saves update the same pull request. The lists show new drafts with a
**New** tag. Merging the pull request publishes the page; nothing else is needed.

Fixed at creation, like every existing entry: the address, the facts, the sections (case studies) and the section
structure and date (articles). A new case study starts with **no images**; until its draft is merged, images can be uploaded in
its editor (row image, cover, gallery: see `M6-IMAGES.md`). It is **not featured** on the homepage, and goes **at the
end of its group** on the Work page. A new article has no legacy source, so it shows no “first published under the
pigiota314 name” line.

## Rules worth knowing

- Addresses: lower-case Latin letters and digits, words joined by single hyphens; not one already on the content branch
  or held by an open draft; `index` is reserved.
- A case study's summary is also its search description, so it must be 70 to 200 characters (including the earlier-work
  note). This now applies to edits of existing case studies too; all 18 already comply. The name is at most 50 characters,
  so the page title stays within 70.
- An article may relate to, and its note may link to, only pages already on the content branch: a link to an entry that
  is still a draft is refused, because merging the article first would fail the build. Existing references in an article
  may stay when it is edited.
- Positions: a new case study takes the next free display position (after every published one and every open new
  draft); articles are listed newest first by date, with the position only breaking ties. Positions may now have gaps
  (for example after a new-entry draft is closed); two entries may never share one.

## What changed to make this work

Site (`src/content/case-studies.ts`, `insights.ts`): the lists of case studies and articles are read from
`content/case-studies/*/index.json` and `content/insights/*/index.json` at build time (`import.meta.glob`) instead of
hand-kept import lists, so a merged file is published with no code change. Every file is still validated on every
build. The output for the existing 18 case studies and 7 articles is unchanged: all 62 pages and the 119 redirect rules
were compared with a build of `main` and are identical.

Redirects (`scripts/redirects/page-rules.mjs`, `astro.config.mjs`): the `<path>/` and `<path>.html` 301 rules of every
case study and article are written into `dist/_redirects` from the finished build, instead of being kept by hand in
`public/_redirects` (the 86 removed rules are regenerated exactly). `scripts/content/validate-redirects.mjs` checks them
as before.

Validators: the page count (security), the expected routes and sitemap (SEO) and the article list (Insights) now take
the migrated entries as a pinned minimum plus whatever is in `content/`, so a page without its file, or a file without
its page, still fails.

Admin Worker (`admin/worker/api.js`): `POST /api/case-studies` and `POST /api/insights` create; the entry lists are read
from the content branch plus open new drafts; any valid address can be requested and a missing entry is a 404. Writes
still go only to `cms/<collection>/<slug>` branches (`assertDraftBranch`), never to the base or `main`; a leftover branch
is reused only if it is exactly a closed pull request's head; there is still no publish, merge or delete endpoint.

## Tests

- `admin/test/create-api.test.mjs` (9): create both kinds; one file on one branch and one draft PR; listing, editing
  and saving a new entry; next positions; taken, reserved and invalid addresses; invalid content; leftover branches;
  related and links only to published pages; no future dates; English only; sign-in and same-origin required; and an
  end-to-end publish: the created files alone build and pass every site validator, with their redirect rules.
- The existing admin suite (187 in all) passes; tests that pinned the fixed 18 and 7 were updated to the new rules.
- `test/access-e2e.mjs` (Cloudflare's local runtime, sign-in through the GitHub mock): passes.
- Browser check of both forms against the local admin: validation messages, address from the name, creation, the New
  tag in the lists, and editing and saving the new entries.
