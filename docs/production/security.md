# TechPi security and technical hardening

Status: Phase 5 (2026-10-08), on `phase-5-security-hardening`. The site is still `noindex`; nothing here changes
indexing, routing, design or content. This is a review and hardening of a static site, not a penetration test.

## 1. Threat model

What the site is, as built and deployed:

| Part | What it is | Security relevance |
|---|---|---|
| Build | Astro 7 static output (`output: 'static'`), 20 HTML pages | All HTML is generated once, at build time, from files in this repository |
| Hosting | Cloudflare Workers Static Assets (`wrangler.jsonc`): no Worker script, `404-page` not-found handling, `auto-trailing-slash` | Nothing executes on the server per request. Only GET and HEAD are served (other methods: 405) |
| Server-side features | None: no SSR, database, login, API, contact form, upload, search, comments or cookies | No server-side injection, authentication or session surface |
| Client JavaScript | One first-party module (motion and the mobile menu, 5.8 KB), one inline head bootstrap, Astro's inlined menu module; on the homepage also the intro's head check and its hashed inline module (3.3 KB, 1.5 KB gzip) | No third-party script. No `eval`. Nothing reads URL parameters or user input into the DOM |
| Other inline content | JSON-LD (`application/ld+json`), not executed | Built from repository data; `<` is escaped (`src/seo/schema.ts`) |
| Assets | Self-hosted Commissioner (2 WOFF2), local images, PNG icons and sharing images | No third-party font, CDN or tracker |
| Outbound links | `mailto:`, `tel:`, three client websites | Plain links |

Realistic risks, in order:

1. **Supply chain at build time.** A compromised or vulnerable package runs during `npm ci` and `astro build` on the
   build machine. Mitigated by the lockfile, `npm ci`, few dependencies (one runtime: `astro`) and the audit below.
2. **Content injection into a page** (a future change that renders untrusted text or adds a third-party script).
   Mitigated by the Content Security Policy (section 4), which blocks inline scripts and styles that are not part of
   the build, `eval`, third-party scripts and images, `<base>` hijacking and plugins.
3. **Framing (clickjacking).** No forms or account actions exist, but the policy forbids framing anyway.
4. **Indexing the wrong host.** The workers.dev and preview hosts must never be indexed (section 6).
5. **Shipping something private.** Covered by the output audit (section 7).

Not applicable, so not built: rate limiting, WAF rules, CSRF tokens, session hardening, input validation, CORS policy,
authentication. Add them only with a feature that needs them (for example a contact form).

## 2. Dependency advisories

Audited with `npm ci`, `npm audit --json`, `npm ls` and the advisories and package sources themselves.

### At the start of Phase 5: 4 high

| Advisory | Package, installed | Patched | Path | Exposure |
|---|---|---|---|---|
| GHSA-ch52-4w7c-c8xp, CVE-2026-93748: max-stale handling can disclose cross-user cached responses | `http-cache-semantics` 4.2.0 | **None upstream** (GitHub lists no patched version) | `astro` | Build-time only, not reachable (below) |
| GHSA-wq5f-xc86-pv6w, CVE-2026-96889: librsvg memory flaw, possible RCE on glibc Linux | `sharp` 0.35.4 | 0.35.5 | `wrangler` > `miniflare` (pinned exactly) | Development only (`wrangler dev`) |
| (same sharp advisory, reported again on the parents) | `miniflare` 5.20261001.0-alpha, `wrangler` 4.147.0 | - | - | - |

`npm audit` counts the sharp advisory three times (sharp, miniflare, wrangler). There were two distinct issues.

### Decisions

**sharp: fixed.** Astro's own `sharp` was already 0.35.5. The vulnerable copy came only from `miniflare`, which pins
`sharp` to exactly 0.35.4 in every release, including the one in the current `wrangler` 4.148.0, so updating Wrangler
would not help. `npm audit`'s suggested fix (`wrangler` 4.15.2) is a downgrade by over a hundred releases and was not
used. Instead an npm `overrides` entry (`package.json`) lifts miniflare's copy to the same patch release:

```json
"overrides": { "miniflare": { "sharp": "0.35.5" } }
```

One deduplicated `sharp` 0.35.5 remains; the lockfile lost 569 lines (the second copy and its platform binaries).
miniflare only loads `sharp` for the Images binding, which this project does not use. Remove the override when a
Wrangler release pins 0.35.5 or later.

**http-cache-semantics: not changed, documented.** `npm audit` reports the range as `<=4.2.0` and offers 4.3.0, but
the published 4.3.0 does not change the max-stale code path (compared line by line: 4.3.0 only adds a `status`
accessor and a Vary-header fix), and GitHub's advisory lists no patched version. Moving to 4.3.0 would turn the audit
green without fixing anything, so it was not done. The vulnerable code is also not reachable here: Astro uses the
library only in `assets/build/remote.js`, to cache **remote** images fetched **during the build**. The site has no
remote images (no `image.domains` or `remotePatterns`, every image is a local import), and a build is one process
for one user, with no shared cache and no Set-Cookie responses. Re-check when Astro or the library publishes a fix.

### After Phase 5

```
npm audit: 1 high (http-cache-semantics, as above). 0 critical, 0 moderate, 0 low.
```

`npm ci` from the new lockfile, `npm run check` (0 errors, 0 warnings, 0 hints) and `npm run build` (20 pages) pass.
The build output is byte-identical to `main` apart from the CSP meta element and `_headers` (section 10).

Other observations, not advisories:

- npm 11 reports that the install scripts of `workerd` and `esbuild` were not run (its new script-approval
  default). It was so before this phase; both packages ship platform binaries as dependencies and work without
  them. Nothing was approved or changed.
- `astro` 7.3.7 and `wrangler` 4.148.0 exist. Neither fixes an advisory here, so neither was taken in this milestone.

## 3. Security headers (`public/_headers`)

Applied by Cloudflare to every static asset response and redirect. **Not to the 404 responses on Cloudflare** (see
below). Verified on real responses (section 8).

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Responses are only ever interpreted as their declared type |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Outbound links (client sites) receive the origin only, never the path |
| `Content-Security-Policy` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` | `frame-ancestors` only works as a header. The structural directives are repeated so they also cover the head bootstrap that precedes the meta policy |
| `X-Frame-Options` | `DENY` | Framing protection for browsers without `frame-ancestors` |
| `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()` | Features the site never uses. Only features Chromium recognises, so no console warnings |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the window from any page that opens it. The site opens no windows |
| `X-Robots-Tag` | `noindex`, **only on `https://:worker.:account.workers.dev/*`** | Section 6 |

**404 responses get none of these on Cloudflare.** On the deployed preview, a 404 (served from `404.html` by
`not_found_handling: "404-page"`) carries only Cloudflare's own headers (on workers.dev, its `X-Robots-Tag: noindex`).
The local Wrangler runtime does add them, so this is a difference between local and deployed behaviour, found only by
testing the deployment. The 404 pages still carry their own meta CSP (scripts, styles, `default-src`), so the
practical gap is framing protection and `nosniff` on a page with nothing but a heading and a link home. Closing it
would need a Worker script, which this static setup deliberately does not have. Accepted; re-test after launch on
`techpi.eu`.

Deliberately not sent:

- **HSTS** (`Strict-Transport-Security`). workers.dev is already safe (the whole `.dev` TLD is on browsers' HSTS
  preload list). For `techpi.eu` it is a launch decision (section 9). No `includeSubDomains` or `preload` before the
  domain's subdomains are known.
- **`Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy`.** CORP `same-origin` could stop services that
  hotlink the sharing images; COEP isolation is not needed.
- **CORS headers.** Nothing needs cross-origin reads.
- **`X-XSS-Protection`.** Obsolete; the CSP is the protection.

## 4. Content Security Policy

Two policies apply to every page; browsers enforce both, so a resource must pass each.

**1. The page policy: a `<meta http-equiv="content-security-policy">` written by Astro** (`security.csp` in
`astro.config.mjs`, stable since Astro 6). Astro computes a SHA-256 hash of every inline script and every inline
`<style>` block it emits, page by page, so the hashes cannot drift from the build:

```
default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
script-src 'self' 'sha256-…' …;  style-src 'self' 'sha256-…' …;  style-src-attr 'unsafe-inline'
```

- Scripts: same-origin files and the hashed inline module only. No `'unsafe-inline'`, no `'unsafe-eval'`, no host.
- Styles: same-origin stylesheets and hashed `<style>` blocks. No `'unsafe-inline'` for style elements.
- **The one relaxation: `style-src-attr 'unsafe-inline'`.** The markup uses inline `style` attributes for
  build-time layout values (`--i`, `--n`, `--delay`, crop coordinates, and a few `left`, `top`, `width` and
  `white-space` values). Hashing attributes needs `'unsafe-hashes'` and a hash per distinct value, which would break
  whenever content changes. The allowance is limited to attributes: it cannot run script, load anything, or add a
  `<style>` element, and every value is written at build time from repository data. Removing it would mean moving
  those values into classes, a markup change outside this milestone.
- Images, fonts, connections, media, frames, workers and manifests fall back to `default-src 'self'`.
- JSON-LD is a data block. Browsers do not execute it, so it needs no hash.
- `markdown.syntaxHighlight` is off (Astro's Shiki highlighter uses inline styles). Nothing is rendered from Markdown.

**2. The header policy** (section 3) adds `frame-ancestors 'none'`, which a meta policy cannot carry.

**Known limitation: the head bootstrap precedes the meta policy.** A meta CSP governs only what the parser meets after
it, and Astro places it at the end of `<head>`. Before it are only static build-time head tags, the short motion
bootstrap and, on the homepage only, the first-visit intro check (both in `BaseLayout.astro`, static text written at
build time, reading nothing from the URL except whether it has a `#fragment`). Nothing in the page body and no script
or style Astro injects is outside the policy. The intro's own module (`src/scripts/intro.ts`) is inlined by Astro
after the policy and hashed like every other inline module.
Moving the whole policy into a header would need the per-page hashes copied into `_headers` after every build (a
post-build script and a single shared hash list), which is more fragile than the gap it closes. Revisit if Astro adds
header output for static sites.

Astro prints one build warning about this configuration: that `'self'` in `style-src` does not extend to
`style-src-attr`. That is the intent.

### Browser tests (real Chromium, Wrangler runtime)

- **20 pages × 1440, 768, 390:** 0 CSP violations, 0 console errors (apart from the 404 status line on the 404
  pages), 0 exceptions, 0 failed or third-party requests. Motion ran (`mo-ready`), all images and Commissioner
  loaded, inline `<style>` blocks and style attributes applied, no horizontal overflow, no cookie or storage.
- **Mobile menu (EN, EL; 390, 360):** every check passes (open, close, Escape, focus return, resize, language switch).
- **Reduced motion, JavaScript off (20 pages × 3 sizes each), keyboard tab-through:** 0 problems.
- **Negative tests on a live page:** an injected inline script did not run; `eval`, `new Function` and a string
  `setTimeout`, called from a same-origin script, were refused (`EvalError`, violation `script-src eval`); an
  unhashed `<style>` did not apply; a script and an image from another origin were blocked; a `<base>` to another
  origin was refused; the site framed in itself was refused. A new inline `style` attribute still applies, by design.
  (A temporary test script was placed in `dist/` for the `eval` test and removed. It was never committed.)

## 5. Validation

```bash
npm run build && node scripts/security/validate.mjs && node scripts/seo/validate.mjs
```

`scripts/security/validate.mjs` (no dependency, about 330 checks) fails the build output if a page lacks its CSP meta,
the policy gains an unsafe or wildcard script or style source, an inline script or `<style>` is not hashed, an
inline event handler or third-party script appears, `_headers` loses a header, gains HSTS or CORS, or sends
`X-Robots-Tag` on any rule other than the workers.dev host rule, or the output contains a source map, env file,
Markdown, TypeScript or a brand master. Run against `main`'s build it fails (21 failures), so it does detect a
missing policy.

## 6. Preview and production indexing

| Host | Today | After launch |
|---|---|---|
| `techpi.eu` (not connected yet) | - | Indexable only through `PUBLIC_ALLOW_INDEXING=true` in the production build |
| `techpi-website.<account>.workers.dev` (production on workers.dev) | Meta `noindex` (every page) + `X-Robots-Tag: noindex` (new) | `X-Robots-Tag: noindex` stays: the duplicate host is never indexed |
| Branch and version previews (`<alias>-techpi-website.<account>.workers.dev`) | Meta `noindex` + `X-Robots-Tag: noindex` (sent by Cloudflare itself, and by the new rule) | Unchanged |

- The rule `https://:worker.:account.workers.dev/*` uses host placeholders, which never match a dot. Tested in the
  Workers runtime with the `Host` header: it matches the production workers.dev host and preview hosts, and does
  **not** match `techpi.eu`, `www.techpi.eu`, `127.0.0.1`, a four-label `a.b.c.workers.dev`, or
  `evil.workers.dev.techpi.eu`.
- On Cloudflare the rule does not reach 404 responses (section 3). Those pages carry `noindex, nofollow` in every
  build, independent of headers.
- There is no global `X-Robots-Tag`, so nothing in `_headers` can keep `techpi.eu` out of search after launch. The
  security validator fails if one is added.
- `PUBLIC_ALLOW_INDEXING` was not set and no Cloudflare variable was changed. It remains the only route to indexing.

## 7. Output and repository exposure

- **`dist/` contents:** 20 HTML, 4 CSS, 1 JS, 2 WOFF2, 25 WebP, 10 PNG, 1 JPG, `sitemap.xml`, `robots.txt`,
  `_headers`, `_redirects`. No source map (no `sourceMappingURL`), env file, Markdown, TypeScript, log, test output,
  development screenshot, `node_modules` or brand master. `_headers` and `_redirects` are not served (404).
- **Deployed:** Wrangler uploads only `./dist` (`wrangler.jsonc`). `docs/`, `scripts/`, `brand-source/` and
  `explorations/` are never uploaded.
- **Unreferenced originals (deferred, not a security issue).** Five original project captures (about 1.3 MB:
  `armans-devices.png`, `logotherapia-site.jpg`, `armans-admin.png`, `rocketeer-sign-in.png`,
  `rocketeer-admin-dashboard.png`) are emitted to `dist/_astro/` and referenced by no page. They are the approved
  images, at full resolution, not private material. Cause: `Crop.astro` and `ProjectMedia.astro` read
  `image.src.width` and `height`, and any property read on Astro's image proxy marks the original as used. The only
  read that avoids it is the proxy's undocumented `clone` key, an Astro internal; the documented `getImage()` would
  emit another derivative instead. Deferred until Astro offers a supported way, or the dimensions move into content data.
- **Repository (public):** 141 tracked files and the full history scanned for credentials (cloud, GitHub, npm, Stripe,
  Slack and Google key formats, private keys, `CLOUDFLARE_API_TOKEN`, password assignments): none. No `.env`,
  `.dev.vars`, `.npmrc` or key file is tracked; `.gitignore` covers them. The Cloudflare account ID is not in the
  repository. Repository visibility is unchanged (owner decision, `launch-blockers.md` section 6).

## 8. Cloudflare verification

Tested with real requests against Wrangler 4.147 (`wrangler dev`) and, after the push, on the branch Preview URL:

- Every header in section 3 on HTML (200), JS, PNG, `sitemap.xml`, `robots.txt` and redirect responses (301), locally
  and on the Preview URL. On the 404 responses (404) only locally: the deployed preview does not apply `_headers` to
  them (section 3).
- The Preview URL in a real browser (20 pages at 1440 and 390): no CSP violation, console error or failed request;
  menu, motion, images and font all working; the same negative-test results as locally.
- `X-Robots-Tag: noindex` on the Preview URL, on every response.
- Downloads and images unaffected: content types unchanged (`image/png`, `text/javascript`, `application/xml`).
- All 97 route and redirect assertions unchanged (`url-matrix`, Phase 3).

Observed on the existing workers.dev production host (before this branch is deployed): TLS 1.1 refused, TLS 1.2
accepted; `POST`, `PUT`, `DELETE`, `OPTIONS` and `TRACE` return 405; no CORS headers; plain `http://` is served without a
redirect (harmless on `.dev`, which browsers only ever reach over HTTPS).

**Not inspected (no dashboard access in this phase), to check by hand:** see section 9.

## 9. Launch recommendations

1. **Connect `techpi.eu`, then in the zone:** "Always Use HTTPS" on, minimum TLS 1.2, automatic HTTPS rewrites on.
   Confirm `http://techpi.eu/` redirects to `https://`.
2. **HSTS for `techpi.eu`:** once HTTPS is confirmed on the apex and `www`, start with
   `Strict-Transport-Security: max-age=31536000` (zone setting or a host-specific `_headers` rule for
   `https://techpi.eu/*`). Add `includeSubDomains` only after every subdomain that will ever exist serves HTTPS
   (including mail-related hosts), and `preload` only after that has run without problems. Preload is hard to undo.
3. Confirm in the dashboard that `PUBLIC_ALLOW_INDEXING` is unset for previews (launch blocker 14), and that the
   production workers.dev host keeps `X-Robots-Tag: noindex` after launch.
4. If a contact form or any server feature is added, write its threat model then (validation, rate limiting, spam,
   `form-action` and `connect-src` changes).
5. Re-run `npm audit` before launch. Remove the `sharp` override when Wrangler pins `sharp` 0.35.5 or later. Update
   `http-cache-semantics` when a real fix is published.

## 10. Phase 5 results

| Check | Result |
|---|---|
| `npm audit` | 4 high → 1 high (not reachable; no upstream fix) |
| `npm run check`, `npm run build` | 0 errors, 0 warnings, 0 hints; 20 pages |
| Security validator / SEO validator | 334 checks, 0 failures / 1,138 checks, 0 failures, 20 of 20 `noindex` |
| Static audit, Wrangler route and redirect matrix | 39 / 39, 97 / 97 |
| Output against `main` | 20 page bodies byte-identical, CSS and JS identical; each page gains only the CSP meta (about 1.1 KB) |
| Performance (desktop and throttled phone, 4 pages) | No measurable change: CLS 0, LCP and long tasks within run-to-run noise, scroll p50 16.7 ms. Each response carries about 0.6 KB more headers (compressed by HTTP/2 and HTTP/3) |
| Dependencies | No package added. One `overrides` entry. One fewer `sharp` copy installed |

## 11. Browser storage (2026-10-09)

The homepage intro (`docs/design/motion-system.md`, section 14) stores one value in `localStorage`:
`techpi-intro-seen` = `1`, so the intro plays once per browser. It is set on the first eligible homepage visit and never
read anywhere else. No identifier, no timestamp, nothing sent to a server, no cookie, no third party. Every access is
inside `try`/`catch`; when storage is blocked the intro does not play and the site works normally.

Before this, the site stored nothing in the browser (section 4 tests: "no cookie or storage"). This entry is a strictly
functional preference about presentation, which is generally treated as not needing consent; whether the privacy and
cookie pages should mention it is a question for the launch review (`launch-blockers.md`, blocker 2). No consent banner
was added.
