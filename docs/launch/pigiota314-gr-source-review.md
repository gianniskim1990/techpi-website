# Historical Greek legacy paths mapped to TechPi routes

The `pigiota314.gr` historic audit contains **181 legacy path rows** (2026-10-16) with **eight additional GSC aliases** missing from that mapping. The combined review register below is **189 distinct source paths**, **not** a deployed rule set and **not** a full 2026-10-19 live inventory (that later crawl recorded 206 .gr sources but the detailed CSV is not attached).

This file contains **public URLs and draft decisions only**; private GSC click counts and impressions are intentionally excluded. Every destination is a proposed `techpi.eu` URL. Before creating executable rules, verify target HTTP 200, canonical/locale, old URL's purpose, and every human editorial choice.

* `PROPOSE_301` = candidate permanent redirect; `PROPOSE_410` = candidate intentional retirement (do not deploy without explicit approval); `UNDECIDED` = no reliable target.
* `OWNER_DECISION_D3`, `OWNER_DECISION_D4`, `OWNER_DECISION_D5`, `OWNER_DECISION_D6` remain unresolved where indicated. Do not automatically turn all marketing or historical portfolio URLs into generic redirects.
* For the 2026-10-19 crawl, 43 historic theme/demo entries were proposed for 410, and some creative-service pages require owner confirmation; no 410 is enabled in the current snippet.
* The `.gr` source currently has SpeedyCache. Any eventual host-guarded 301/410 block belongs **above the first SpeedyCache marker** in the old `/public_html/.htaccess`, with backup and a canary test before the full rule set.
* Exclude `/wp-admin`, `/wp-json`, `/wp-content`, Search Console HTML verification files, sitemap and robots; never add a blanket catch-all or match subdomains.
* Keep the old `.gr` property verified by its HTML file; preserve old domain mail, apps, image assets and product subdomains. `pigiota314.eu` migration has a separate sequence to protect old `.gr` image dependencies.

The review register is in [`pigiota314-gr-source-review.csv`](pigiota314-gr-source-review.csv).
