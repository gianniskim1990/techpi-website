# Analytics recommendation

Status: recommendation for owner decision (launch blocker 3). **Nothing is installed.** 2026-10-13.

## Current state (verified)

- techpi.eu loads **no analytics** and sets **no cookies**; the Content Security Policy allows only same-origin scripts.
- Legacy analytics still running on the old sites (not TechPi): `pigiota314.eu` loads GA4 `G-EXVJQWWD57` (without a
  consent step, contrary to its cookie policy); `pigiota314.gr` has the Google tag `GT-NGSDZMV` via Site Kit. Their
  historical data stays in those Google Analytics properties after the domains redirect.
- Cloudflare already records **zone-level traffic analytics** for techpi.eu (requests, bandwidth, countries, status
  codes, cache) from the edge, without any script on the page. Available in the dashboard today at no cost
  `[access needed to confirm what the plan shows]`.

## Options

| | A. Search Console only | B. Search Console + privacy-conscious web analytics | C. Search Console + GA4 |
|---|---|---|---|
| **Measures** | Google search: impressions, clicks, CTR, position per query and page and country; indexing coverage; redirects seen; Core Web Vitals (field data); links. Plus Cloudflare edge traffic totals | All of A, plus visits, pages, referrers, countries, devices and simple goals (e.g. clicks on the email link), without personal profiles | All of A, plus detailed behaviour, sessions, engagement, audiences, conversions, Google Ads links |
| **Cost** | Free | Cloudflare Web Analytics: free. Plausible / Fathom / Simple Analytics: paid, roughly EUR 9–19 per month at this traffic level (check current pricing) | Free (Google), but more implementation and compliance work |
| **Cookies / device storage** | None | None (these tools are designed to work without cookies or persistent identifiers) | Yes (`_ga`, `_ga_*` cookies, persistent identifiers) |
| **Consent banner** | Not needed | Generally not needed for a cookieless tool, but the legal position depends on the tool's exact technique and the Greek DPA's view; confirm with the legal review before relying on it | **Required** before GA4 runs (ePrivacy consent for cookies), plus Consent Mode v2 if Google features are used |
| **Privacy policy impact** | No change (Search Console processes no visitor data on the site) | Add the provider as a processor, describe the data | Add Google as processor/controller, transfers, retention, consent; Cookies Policy rewritten |
| **Technical work** | None on the site. DNS TXT verification | One script tag, CSP update (`script-src` and `connect-src` for the provider's domain, or a self-proxied path), privacy-page update, validator update | GA4 tag, consent banner (a new UI component), Consent Mode, CSP changes for Google domains, cookie policy, testing in EN and EL; the banner is a visible design change |
| **SEO migration monitoring** | **Covers the essentials**: old vs. new URLs in search, redirect processing, indexing, queries by language | Adds referral and direct-traffic trends after the redirects (people arriving from old links and bookmarks) | Same as B for migration purposes; extra depth is not needed to monitor a site move |
| **Performance** | No effect | One small script (about 1 KB to a few KB) | Larger script and the banner; measurable effect on a fast static site |

## Recommendation

**Launch with Option A** (Search Console for techpi.eu and both legacy properties, plus Cloudflare's built-in
edge analytics), and **decide on Option B after about 60 days** if the owner wants on-site visit and referral data.

Why, for a small technology company migrating two sites:

1. Search Console is the tool that actually measures a site migration (index coverage, redirects, queries, Change of
   Address). It needs no code, no cookies and no banner.
2. The site currently has a strong, verifiable privacy position (no cookies, no third parties, hashed CSP). Option A
   keeps it, which is also a credible signal for a company that sells digital visibility and technology.
3. Adding a consent banner (Option C) is a design and legal project on its own and degrades performance; GA4's depth
   is not needed to run the migration.
4. If Option B is chosen later, **Cloudflare Web Analytics** is the lowest-friction start (free, cookieless, same
   provider as the hosting). It needs a deliberate CSP change: the automatic injection from the dashboard would be
   blocked by the current hash-based CSP, so it must be added as an explicit, reviewed script.

## If the owner chooses B or C later (implementation outline, not done)

1. Owner approval of the tool and of the policy text (`LEGAL_CONTENT_DRAFTS.md` §1 L10).
2. Branch: add the script, adjust `astro.config.mjs` CSP (`script-src`, `connect-src`) and the security validator's
   expectations; for C, add a consent banner and block GA4 until consent.
3. Update the Privacy and Cookies pages first, then deploy.
4. Verify in a browser: no request to the analytics provider before consent (C), no cookies (B), no CSP violations.

## Legacy analytics (separate decisions)

- Before the legacy sites are redirected, note the retention setting of both GA properties and export the reports the
  owner wants to keep (GA4 retains aggregated reports; exploration-level data follows the retention setting).
- Consider removing the GA4 tag from `pigiota314.eu`, or adding a consent step, while it is still live: its cookie policy
  currently says no analytics is loaded (`migration-audit/LAUNCH_READINESS_AUDIT.md` §6).
