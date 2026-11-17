# pigiota314.gr → techpi.eu/el/ redirect

Status: live since 2026-11-03 (owner uploaded the block; `check.mjs`: 453 checks, 0 failures). `pigiota314.eu` already redirects page by page to `techpi.eu` (checked
2026-11-03), so `pigiota314.gr` is the last legacy domain.

## How

A block of Apache rules at the top of the WordPress site's `.htaccess` on the current server (owner decision: no DNS
change). Mail for `@pigiota314.gr`, the DNS zone and every subdomain (`saloon.`, `physio.`, `aesthetic.`, `business.`,
`agents.`, `airbnb.`, `proposal.`, `demo.`, `hair.`, …) are untouched: the rules only apply to `pigiota314.gr` and
`www.pigiota314.gr`.

| File | |
|---|---|
| `scripts/legacy-redirects/pigiota314-gr.tsv` | The map: path, 301 or 410, target. From `migration-audit/REDIRECT_MAPPING.md` (pigiota314.gr table), with the recommended answers to decisions D3–D7 |
| `scripts/legacy-redirects/build-htaccess.mjs` | Writes `pigiota314-gr.htaccess` from the map |
| `scripts/legacy-redirects/pigiota314-gr.htaccess` | The block to paste (generated; do not edit by hand) |
| `scripts/legacy-redirects/check.mjs` | Checks the live result |

What the block does:

- 138 old pages: **one 301** straight to their final `techpi.eu` URL, with or without the trailing slash, any ASCII
  case, query string dropped; `http`/`https` and `www` alike.
- 43 demo, lorem-ipsum and archive pages, and every other unmapped path: **410 Gone** (no blanket redirect to the
  homepage, decision D7). `robots.txt` too: a 4xx tells crawlers "no restrictions", while the old WordPress sometimes
  answers it with a 500, which would stop search engines from crawling and seeing the redirects.
- Still served, so the old WordPress can be signed into and backed up: `/wp-admin/`, `/wp-login.php`, `/wp-content/`,
  `/wp-includes/`, `/wp-json/`, `wp-cron.php`, the old sitemaps (they list the old URLs, so crawlers find the redirects
  sooner), `/.well-known/` (certificate renewals).

## Upload (owner, cPanel)

1. File Manager → the site's root folder (usually `public_html`) → show hidden files → open `.htaccess`.
2. Download a copy of it first (rollback).
3. Paste the whole of `pigiota314-gr.htaccess` at the **very top**, above `# BEGIN WordPress` and above any rules a
   plugin added (SSL, cache). Save.
4. Run `node scripts/legacy-redirects/check.mjs`. It must end with `0 failures`.

**Rollback:** delete the block (from `# BEGIN pigiota314.gr -> techpi.eu` to `# END pigiota314.gr -> techpi.eu`), or
restore the saved copy. The old site serves again immediately.

**2026-11-16:** `/website-for-airbnb/` now goes to the new page `/el/accommodation-websites` (it went to the
Alexandra Apartment case study). Replace the block on the server after that page is live.

## After

- Search Console, `pigiota314.gr` property → Settings → Change of address → `techpi.eu`.
- Keep the WordPress server, the domain and its mail running; keep the redirect for as long as the domain is owned
  (at least a year).
- Changing the map: edit the TSV, run `node scripts/legacy-redirects/build-htaccess.mjs`, replace the block.
