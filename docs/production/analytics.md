# Analytics: Google Analytics 4 with consent

Status: built 2026-11-03 (owner decision, replacing O16 "Search Console only"). Property `G-M3FF84P32D`.

## Behaviour

| Visitor | What happens |
|---|---|
| No choice yet | The banner shows at the bottom of every page. Nothing from Google is loaded and no cookie is set |
| **Accept** | The choice is kept in `localStorage` (`techpi-analytics-consent`) for 12 months. `gtag.js` loads with `analytics_storage` granted and `ad_storage`, `ad_user_data`, `ad_personalization` denied, `allow_google_signals: false`, `allow_ad_personalization_signals: false`. Cookies: `_ga`, `_ga_M3FF84P32D` |
| **Reject** | The choice is kept the same way. Nothing loads |
| **Cookie settings** (footer, every page) | Shows the banner again. Rejecting after accepting turns measurement off at once (`ga-disable-<id>`) and deletes the `_ga` cookies |
| No JavaScript, or storage blocked | No banner and nothing loads; with storage blocked the banner asks again on each page |

Accept and Reject are the same kind of button, side by side (Hellenic DPA guidance on cookies). The banner is not a
modal: the page stays usable.

## Code

| File | |
|---|---|
| `src/content/site.ts` | `analyticsFacts.measurementId` |
| `src/components/Consent.astro` | The banner (in `BaseLayout`, every page) |
| `src/scripts/consent.ts` | Choice, loading, withdrawal |
| `src/components/Footer.astro` | The "Cookie settings" button |
| `astro.config.mjs` | CSP: `script-src https://www.googletagmanager.com`; `connect-src` and `img-src` for `*.google-analytics.com`, `*.analytics.google.com`, `*.googletagmanager.com` (Google's documented GA4 hosts) |
| `content/pages/cookies`, `content/pages/privacy` | The policies (version 3 November 2026) |

Checks: `scripts/security/validate.mjs` allows exactly these origins and finds Google Analytics only in the CSP policy
and the consent script, with one hidden banner per page; `scripts/content/validate-insights.mjs` the same for trackers.

## Owner settings in Google Analytics (Admin), which the policies rely on

- **Data retention:** 2 months (the default). The Privacy Policy says 2 months; change both together.
- **Google signals:** off. **Ads personalisation / Google Ads links:** none.
- **Data processing terms** accepted for the account (Admin → Account settings).
