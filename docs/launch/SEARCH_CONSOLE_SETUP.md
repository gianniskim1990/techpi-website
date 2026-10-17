# Google Search Console setup and migration monitoring

Owner-facing procedure. Prepared 2026-10-13. **Status 2026-10-16 (owner-confirmed):** sections 1 to 3 are done: the
`techpi.eu` Domain property is verified, the `pigiota314.eu` and `pigiota314.gr` properties are accessible, and their
historical data has been exported. **No sitemap has been submitted and indexing is not enabled.** Steps marked
**[WAIT FOR LAUNCH]** must not be done until the owner has authorised indexing (`TECHPI_LAUNCH_CHECKLIST.md`).
Google's interface changes from time to time; menu names below are the current English ones.

## 0. Before you start

- Sign in with the Google account that should own TechPi's properties (a company account, not a personal one if
  possible). Plan a second owner (another account you control) so access is never tied to one login.
- Have Cloudflare dashboard access to the `techpi.eu` zone (DNS edit).
- Verifying a property is safe while the site is `noindex`: verification does not request indexing.

## 1. Create and verify the `techpi.eu` Domain property (can be done now)

A Domain property covers `https://techpi.eu`, `https://www.techpi.eu`, `http://` and every subdomain
(including a future `proposal.techpi.eu`), so it is the right property type.

1. Search Console → property selector → **Add property** → **Domain** → enter `techpi.eu` → Continue.
2. Google shows a TXT record, `google-site-verification=…`. Copy it. (Search Console may offer a Cloudflare shortcut;
   the manual TXT record below is equivalent and keeps the change visible.)
3. Cloudflare → `techpi.eu` zone → **DNS** → **Records** → **Add record**:
   - Type `TXT`, Name `@` (the apex), Content: the full `google-site-verification=…` value, TTL Auto. Save.
   - Do not edit or remove the existing SPF (`v=spf1 …`), DMARC or DKIM records: a second TXT record at the apex is
     normal and does not affect mail.
4. Back in Search Console → **Verify**. If it fails, wait a few minutes (DNS propagation) and retry; check with
   `nslookup -type=TXT techpi.eu 1.1.1.1`.
5. **Settings → Users and permissions**: add the second owner.
6. Keep the TXT record permanently (removing it removes verification).

Optional: verify `techpi.gr` as a Domain property the same way, to see how Google treats the redirect-only domain.

## 2. Check access to the legacy properties (can be done now)

| Property | Evidence found | What to check |
|---|---|---|
| `pigiota314.eu` | DNS TXT `google-site-verification=hNBI4…` exists | Is it in your property list? As a Domain property? Which account is owner? |
| `pigiota314.gr` | Google Site Kit plugin on the WordPress site | Is there a Domain property, or a URL-prefix property `https://pigiota314.gr/`? Site Kit usually creates a URL-prefix property under the WordPress admin's Google account |

If a legacy property is missing or owned by another account, verify it now (Domain property via a TXT record at
that domain's current DNS host). **Change of Address requires verified ownership of both the old and the new
property in the same account.**

## 3. Export historical data from both legacy properties (do now, before any redirect)

For each legacy property:

1. **Performance → Search results**: Date range **Last 16 months**. Enable Clicks, Impressions, CTR, Position.
   **Export** (Google Sheets or CSV) with the **Queries**, **Pages**, **Countries** and **Devices** tabs.
2. Repeat for the **last 3 months** (a shorter, comparable baseline for the 30/60/90-day reviews).
3. **Links**: export **Top linked pages** and **Top linking sites**. These decide which legacy URLs most need a precise
   redirect (`migration-audit/REDIRECT_MAPPING.md`).
4. **Indexing → Pages**: export the list of indexed pages.
5. Store the exports privately (not in this public repository). Note the export date.

## 4. Before indexing is enabled

- Do **not** submit `https://techpi.eu/sitemap.xml` yet: every page is `noindex`, and a sitemap of noindex pages
  produces "Excluded by noindex" reports that only add noise.
- Optional check: **URL Inspection** of `https://techpi.eu/` should show "Excluded by 'noindex' tag" in the live test.
  This confirms the safeguard, not an error.

## 5. When indexing is approved [WAIT FOR LAUNCH]

Pre-conditions: `TECHPI_LAUNCH_CHECKLIST.md` P0 items done; production rebuilt with `PUBLIC_ALLOW_INDEXING=true`
for the **production** environment only; live check shows 48 (or more, with legal pages) URLs without a robots
meta tag and the 404 pages still `noindex`.

1. **Sitemaps** → add `sitemap.xml` (full URL `https://techpi.eu/sitemap.xml`) → Submit. Status should become
   "Success" with the number of discovered URLs equal to the sitemap count.
2. **URL Inspection** → `https://techpi.eu/`, `https://techpi.eu/el/`, one case study in each language,
   `/eu-projects` → **Test live URL** (should say "URL is available to Google") → **Request indexing**. Do not request
   indexing for every page; the sitemap does that.
3. Do **not** use the Removals tool on legacy URLs; redirects handle them.

## 6. Change of Address (only after the legacy redirects are live) [WAIT FOR LAUNCH]

Prerequisites, per legacy domain: the new site is indexable; the old homepage and the mapped URLs return a single
**301** to `techpi.eu` (tested with the smoke tests in `migration-audit/MIGRATION_EXECUTION_PLAN.md` §5); you are a
verified owner of the old property and of `techpi.eu`.

1. Open the **old** property (e.g. `pigiota314.eu`) → **Settings** → **Change of address**.
2. Select `techpi.eu` as the new site → **Validate & update**. Google checks the homepage redirect and a sample of URLs.
   If validation fails, fix the redirect it names and retry.
3. Confirm. The notice stays active for 180 days; keep the redirects in place far longer.
4. Repeat for the second legacy property. Do this per property; the tool works for root-level properties only.
5. Keep both legacy properties verified to keep watching their "Page with redirect" counts.

`proposal.pigiota314.gr` is **not** part of a Change of Address: it is a separate application (Decision A) and is not
moving yet.

## 7. Monitoring after launch

| When | Where | What to check |
|---|---|---|
| Days 1–7, daily | techpi.eu → Pages (indexing), Sitemaps, URL Inspection | Indexed count rising; no unexpected "Excluded by noindex" on content pages; no 404s from legacy paths |
| Weekly, weeks 2–8 | Legacy properties → Pages | "Page with redirect" rising, "Not found (404)" not rising; compare with the exported indexed list |
| Weekly | techpi.eu → Performance, filter by page and by country (Greece vs others) | Impressions for the new URLs replacing the legacy URLs' impressions; Greek queries landing on `/el/` pages |
| Day 30, 60, 90 | Both, against the exports from §3 | Clicks and impressions by query and page; brand queries ("TechPi", "pigiota314"); hreflang issues (International targeting is retired; check in URL Inspection and the HTML instead) |
| Ongoing | techpi.eu → Experience → Core Web Vitals; Enhancements | Field performance; structured data (Breadcrumbs) without errors |

Optional: **Bing Webmaster Tools** → Import from Google Search Console (one click), then submit the sitemap there at
launch.
