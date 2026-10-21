# TechPi Admin: M4, production readiness and go-live runbook

Status: **prepared, not activated.** Nothing in this document has been done. Every step that changes `main`, DNS,
Cloudflare, GitHub settings or deploys anything needs the owner's separate approval, at the step where it is marked.

## 1. What M4 changed

| Area | Change |
|---|---|
| Production content workflow | `CONTENT_MODE` (`development` / `production`) and `CONTENT_BASE_BRANCH` ([admin/worker/config.js](../../admin/worker/config.js)). No default base: unset means the content API answers 503. `main` is accepted **only** with `CONTENT_MODE=production`, and production accepts **only** `main`. A base without the admin content (for example `main` before the release is merged) is reported, not shown as empty. |
| Writes | Every write goes through `assertDraftBranch`: only `cms/<collection>/<slug>` branches are created, reset or committed to; never `main`, never the base. The browser cannot choose the repository, base, branch, file or permissions. There is no publish, merge or delete endpoint. |
| Leftover branches | A `cms/*` branch is reused while its draft PR into the base is open. A leftover branch is reset to the base only when it is exactly the head of a **closed** PR (a finished test or draft). An **open** PR for another base, or commits that no closed PR accounts for, **block** the save (409) and nothing is overwritten; the editor warns before anything is typed. The five current leftover branches (from test PRs #30, #32, #34, #36, #38, all closed) are at their closed PR's head, so they are handled safely. |
| Production host and settings | In production mode the Worker serves nothing (503) unless the request is for `ADMIN_HOSTNAME` over HTTPS, and refuses local-test settings: the GitHub API and OAuth overrides, `ENABLE_TEST_CONTENT`, the tests' session secrets. This runs before sign-in, for the sign-in pages, the app, its files and the API alike. (Updated by AUTH-G1, section 7.) |
| Publishing | Manual, on GitHub. No Publish button. With an open draft, editors and the Dashboard show **Review & publish on GitHub**, opening that pull request, and explain: saving is not publishing; the owner reviews; required checks must pass; the owner merges into `main`; Cloudflare then builds and deploys the site from `main`. |
| Prototype removed | The legacy Sveltia page (`/sveltia-m0.html`), its config, test and the `@sveltia/cms` dependency; TipTap; the prototype snapshot (data, list, editor, placeholder screens for Media, SEO and Settings); the M0 dummy content and its Astro collection (`content/m0-demo`, `src/content.config.ts`, neither on `main`). The M0 test collection stays in the Worker for development tests only (`ENABLE_TEST_CONTENT=true`, refused in production). |
| Dashboard and lists | Live data only: the 33 managed items (8 pages, 18 case studies, 7 articles) read from the content branch, the open draft PRs with their review links, and where the content comes from (development branch or `main`). No deployment date, version or history is invented. |
| Configuration files | `admin/wrangler.jsonc` stays in **development** mode on the M4 branch (it must not point at `main` before the release is merged). `admin/wrangler.production.example.jsonc` holds the go-live values: production mode, `main`, `ADMIN_HOSTNAME=admin.techpi.eu`, the Custom Domain route, empty sign-in and GitHub values, no secrets. |

The public website build is **byte-identical to `main`** (123 files).

## 2. Release integration strategy

**The stack.** The admin work is a strictly linear chain on top of the current `main` (`4bf2201`), which has not moved
since the chain started:

| PR | Branch | Head | Base |
|---|---|---|---|
| #27 | `feat/techpi-admin-m0` | `327d50b` | `main` |
| #28 | `feat/techpi-admin-ui-prototype` | `53321a0` | `feat/techpi-admin-m0` |
| #29 | `feat/techpi-admin-a1` | `f97d419` | `feat/techpi-admin-ui-prototype` |
| #31 | `feat/techpi-admin-m1a-rocketeer` | `354f18a` | `feat/techpi-admin-a1` |
| #33 | `feat/techpi-admin-m1b-all-case-studies` | `6c033b2` | `feat/techpi-admin-m1a-rocketeer` |
| #35 | `feat/techpi-admin-m2-insights` | `0605648` | `feat/techpi-admin-m1b-all-case-studies` |
| #37 | `feat/techpi-admin-m3-website-pages` | `3baa988` | `feat/techpi-admin-m2-insights` |
| M4 | `feat/techpi-admin-m4-production-readiness` | this PR | `feat/techpi-admin-m3-website-pages` |

Each branch is an ancestor of the next (verified with `git merge-base --is-ancestor`), so the M4 head contains every
commit of M0 to M4 and nothing else: 16 commits, all "Admin …", none of them a `cms/*` test draft.

**Recommendation: one consolidated release PR**, not seven merges. Merging the stack PR by PR into `main` would publish
intermediate states (for example the Sveltia page and dummy content that M4 removes) and needs seven reviews and seven
production builds. Instead:

1. After the owner approves the M4 code (step A), create `release/techpi-admin-v1` from the approved M4 head, without
   rebasing or squashing (the history stays as reviewed):
   `git switch -c release/techpi-admin-v1 <approved M4 SHA>` then `git push -u origin release/techpi-admin-v1`.
2. Open one pull request `release/techpi-admin-v1` → `main` (step B). Its diff is the whole admin, M0 to M4.
3. Merge it only with the owner's separate approval (step C). A **merge commit** keeps the reviewed commits as they are
   (recommended); a squash also works, but loses the per-task history.
4. Afterwards: #27 is marked merged by GitHub automatically (its commits are in `main`); close #28, #29, #31, #33, #35,
   #37 and the M4 PR as **superseded by the release PR**, without merging. Keep the branches until the release is
   verified (step D), then delete them if wanted.

**What the release contains** (`git diff --stat origin/main...release/techpi-admin-v1`, at M4: 140 files):

- `admin/`: the TechPi Admin (app, Worker, shared rules, tests, scripts, configuration). Not part of the public build.
- `content/`: exactly 33 files, all added: 18 case studies, 7 articles, 8 pages. Only the extraction commits touched
  them (`62c6e5f`, `f8ff392`, `894d031`, `a368cd3`), so no test edit is in the release.
- `src/content/`: the loaders (`case-studies.ts`, `case-study-loader.ts`, `pages-content.ts`) and the modules that now
  read the content files (`projects*.ts`, `insights.ts`, `home*.ts`, `pages*.ts`, `eu.ts`, `seo.ts`, `legal.ts`).
- `scripts/`: the CMS media validator, the structural Insights validator, the asset validator's managed-image check;
  `package.json` (the media validator in `npm run build`); `.gitignore` (admin build and local files).
- `docs/admin/`: M0 to M4 documentation and the prototype screenshots.

**Checks before the release PR is merged** (step B):

- The PR's required check **Workers Builds: techpi-website** passes (the ruleset requires it).
- Locally, on the release branch: `npm ci && npm run check && npm run build` (all validators), then compare `dist`
  with a build of `main`: **byte-identical** (no public change at all). Then `node admin/scripts/verify-pages-output.mjs`
  and `node admin/scripts/verify-insights-output.mjs`.
- In `admin/`: `npm ci && npm test` (149 tests) and `npm run test:e2e` (53 checks).
- `git log --format='%s' origin/main..release/techpi-admin-v1` lists only "Admin …" commits, and
  `git log origin/main..release/techpi-admin-v1 -- content` lists only the four extraction commits.

**Cloudflare Workers Builds triggers** (observed on this repository's GitHub checks, to be confirmed in the dashboard):

- The `techpi-website` Worker is connected to Workers Builds. The check on `main`'s latest merge commit (`4bf2201`,
  PR #26) links to a build under **production/builds**, while branch pushes (for example `cms/pages/contact`) build under
  **production/previews/&lt;branch&gt;**. So: pushing the release branch or any `cms/*` draft branch triggers a
  **preview** build (noindex), and merging into `main` triggers the **production** build. Whether that build also runs
  the deploy step is a dashboard setting (Workers → techpi-website → Settings → Builds → Deploy command; production
  branch `main`): **verify it before step C**; do not assume it.
- The admin Worker (`techpi-admin`) is **not** connected to Workers Builds. Merging the release does not deploy the
  admin; it is deployed manually at step G.
- Because the release changes no public output, a production build of `main` after step C deploys a website identical to
  the current one.

## 3. Go-live sequence

Each step names who does it and whether it needs a separate approval. Do not skip ahead: in particular, the admin must
not be configured against `main` (step F) before the release is merged (step C) and verified (step D).

### A. Owner reviews and approves the final code
The owner reviews the M4 pull request (and, as needed, the stack it completes). Approval means "the code is ready to be
released", not "merge" or "deploy".

### B. Prepare and verify the consolidated release PR
Create `release/techpi-admin-v1` from the approved M4 SHA, open the PR into `main`, and run the checks in section 2. The
PR stays a draft until they all pass.

### C. Owner separately approves merging into main *(approval required)*
Before merging: confirm in the Cloudflare dashboard what a push to `main` triggers (section 2). The owner merges the
release PR (merge commit recommended). Nothing else changes in this step.

### D. Verify the website build and deployment
- The production build for the merge commit succeeds (GitHub check and Cloudflare dashboard).
- techpi.eu serves the same pages as before: spot-check `/`, `/el/`, `/work/rocketeer`, `/el/work/rocketeer`, `/insights`,
  one article, `/privacy`, `/el/cookies` (titles, copy, legal facts). The site stays `noindex` as before; do not enable
  indexing.
- Optional: build `main` locally and compare with the pre-merge reference: byte-identical.

### E. Configure "Sign in with GitHub" on the existing GitHub App *(approval required; GitHub App settings change, owner only)*
Sign-in uses the existing TechPi GitHub App's OAuth web flow (AUTH-G1, section 7). No Cloudflare Access, Zero Trust,
database or paid service is involved. On GitHub → Settings → Developer settings → GitHub Apps → the TechPi App → **General**:
1. **Callback URL**: add exactly `https://admin.techpi.eu/auth/callback` (HTTPS, no trailing slash, no query). Keep it
   the only production callback. For a local test against the real App only, a second callback
   `http://127.0.0.1:8787/auth/callback` may be added and removed afterwards.
2. **Expire user authorization tokens**: leave on. **Request user authorization (OAuth) during installation**: off.
   **Enable Device Flow**: off. Webhook, permissions and repository access: unchanged.
3. Note the **Client ID** (shown on the same page; not secret).
4. **Client secrets → Generate a new client secret.** Copy it once, straight into step F's prompt; never into a file, a
   chat, an issue or a commit.
5. The owner's **numeric GitHub user ID**: open `https://api.github.com/users/<owner-username>` in a browser and read
   `"id"`. The admin allows exactly this ID; usernames and emails are never used to decide access, so renaming the
   account does not lock the owner out, and someone who later takes a released username cannot get in.

### F. Configure the admin Worker and its secrets *(approval required)*
In `admin/`, fill the empty values of `wrangler.production.example.jsonc` locally (not secrets, but keep them out of this
public repository by applying them at deploy time):
- `GITHUB_OAUTH_CLIENT_ID`: the Client ID from step E; `ADMIN_GITHUB_USER_ID`: the numeric user ID from step E;
- `GITHUB_APP_ID` and `GITHUB_APP_INSTALLATION_ID`: the values from the A1 setup (they are in the owner's local,
  git-ignored `admin/wrangler.local.jsonc`);
- `CONTENT_MODE` `production`, `CONTENT_BASE_BRANCH` `main`, `ADMIN_HOSTNAME` `admin.techpi.eu` (already set).

Upload three Worker secrets. Each command prompts for the value; nothing is written to disk or shown:
```bash
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --config wrangler.production.example.jsonc
```
```bash
npx wrangler secret put SESSION_SECRET --config wrangler.production.example.jsonc
```
```bash
npx wrangler secret put GITHUB_APP_PRIVATE_KEY --config wrangler.production.example.jsonc
```
- `GITHUB_OAUTH_CLIENT_SECRET`: the client secret from step E.
- `SESSION_SECRET`: a new random value of at least 32 characters, generated on the owner's own computer and piped
  straight in, so it is never displayed (PowerShell or Bash):
  `node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'))" | npx wrangler secret put SESSION_SECRET --config wrangler.production.example.jsonc`
- `GITHUB_APP_PRIVATE_KEY`: from the file, without displaying it (paste the PEM at the prompt, or in PowerShell:
  `Get-Content C:\path\to\key.pem -Raw | npx wrangler secret put GITHUB_APP_PRIVATE_KEY --config wrangler.production.example.jsonc`).

The Worker refuses to serve anything (503) until all of these are set and valid. The GitHub App keeps its current
permissions (Metadata read, Contents and Pull requests read and write) on this repository only; `main`'s ruleset stays as
it is: the admin never writes to `main`, it only opens PRs.

### G. Owner separately approves the admin deployment *(approval required; creates the DNS record)*
```bash
cd admin
npm ci
npm run build
npx wrangler deploy --config wrangler.production.example.jsonc
```
The `admin.techpi.eu` Custom Domain route makes Cloudflare create the hostname's DNS record in the `techpi.eu` zone
(proxied) and its certificate. **DNS change required for the admin hostname:** one proxied record for `admin.techpi.eu`,
created by the Custom Domain (no manual record). No other DNS, redirect or mail setting changes. `workers_dev` and
`preview_urls` stay off.

### H. Test unauthorised and authorised access
- In a private window: `https://admin.techpi.eu` → the TechPi "Sign in" page with **Sign in with GitHub** (not the
  admin).
- `curl -si https://admin.techpi.eu/api/session` → `401` JSON "Sign in with GitHub to continue."; `curl -sI
  https://admin.techpi.eu/assets/` followed by any file name of the build → `401`; never the admin's script or data.
- Sign in with **another** GitHub account (in another private window) → GitHub asks to authorise the App, then the
  admin answers "This GitHub account is not allowed to use the TechPi Admin." and no session cookie is set. Optionally
  revoke that test authorisation afterwards (that account's GitHub → Settings → Applications → Authorized GitHub Apps).
- Sign in as the owner → GitHub's authorise screen the first time → the admin loads, the sidebar shows the owner's
  GitHub username and "Signed in with GitHub", the Dashboard says "Published content: main" and shows no configuration
  warning. In the browser's developer tools, the cookie `__Host-techpi_session` is `HttpOnly`, `Secure`,
  `SameSite=Lax`, with no Domain, and expires in 8 hours.
- **Sign out** in the sidebar → back on the sign-in page; `/api/session` answers 401.
- The Workers dashboard shows no workers.dev route and no preview URLs for `techpi-admin`, and the Worker's logs show
  no token, secret or code.

### I. Verify the 33 content entries
The Dashboard shows 8 website pages, 18 case studies and 7 articles, none "could not be read". Open a few in both
languages (one legal page, one case study with images, one article with a note): they load, nothing is marked as a
draft.

### J. Save one harmless draft against main
Make one small, harmless change (for example a typo-level edit you intend to keep, or one you will discard) and Save
draft. Check on GitHub: a draft PR from `cms/<collection>/<slug>` into **main**, one commit touching only that file, the
review note in its description, and a **preview** build (not production). `main` is unchanged. If the change is not
wanted, close the PR without merging (the admin will reuse the branch safely next time).

### K. Owner reviews and publishes a draft through GitHub *(separately authorised test)*
For a change the owner wants live: on the PR, check the diff and the preview build, wait for the required check, mark it
ready for review, and merge. This is the only way content is published.

### L. Verify live output, deployment and rollback
- The production build for the merge succeeds; the changed page on techpi.eu shows the change; nothing else changed.
- The admin shows the item as published (no open draft).
- Rehearse the rollback below on the test change if wanted (revert PR).

## 4. Rollback

| What | How |
|---|---|
| A published content change | On GitHub, open the merged PR → **Revert** → merge the revert PR (it goes through the same checks). The site is rebuilt from `main`. |
| The website deployment | Cloudflare dashboard → Workers → techpi-website → Deployments: roll back to the previous version (immediate), then fix `main` with a revert PR so the next build matches. |
| The release (step C) | Revert the release merge commit with a revert PR into `main`. The public output was identical, so the site does not change; the content files and loaders return to the TypeScript sources. |
| The admin deployment | `npx wrangler rollback` (to the previous admin version) or, to take the admin offline: remove the `admin.techpi.eu` Custom Domain from the `techpi-admin` Worker (this removes its DNS record), or `npx wrangler delete --name techpi-admin`. |
| Admin sessions | End every session at once: `npx wrangler secret put SESSION_SECRET --config wrangler.production.example.jsonc` with a new random value (step F). All session cookies become invalid immediately; the owner signs in again. |
| GitHub sign-in | GitHub App → General → **Client secrets**: delete the client secret (sign-in stops: the Worker answers "GitHub did not accept this sign-in"), or remove the callback URL. Generate a new client secret and upload it with `wrangler secret put GITHUB_OAUTH_CLIENT_SECRET` to restore. Deleting `SESSION_SECRET` or `GITHUB_OAUTH_CLIENT_SECRET` from the Worker takes the whole admin offline (503). |
| GitHub App credentials | GitHub → Settings → Developer settings → GitHub Apps → the App → revoke the private key (generate a new one), or suspend/uninstall the installation. The admin then answers "not configured" or GitHub errors; nothing can be written. |
| DNS for the admin | Removing the Custom Domain removes the record; otherwise delete the `admin.techpi.eu` record in the `techpi.eu` zone. No other record is involved. |

## 5. Remaining owner-only activation steps

A (code approval), C (merge into `main`, after confirming the Workers Builds deploy setting), E (the GitHub App's
callback URL and a client secret; the owner's numeric user ID), F (fill production values, upload the three secrets), G (deploy the admin; creates the DNS record), H to L
(tests and the first real publish). Nothing else is needed from the code.

## 6. Verification of M4 (local, GitHub mocked)

- Admin tests: **149/149** (production workflow 14, A1 security 18, plus all collection suites and the real-build tests).
- Workerd end-to-end: **53/53**, including a production configuration served on localhost being refused (503) for the
  page, a static file and the API.
- Public site: `astro check` 0 errors; every validator passes; `dist` **byte-identical to `main`** (123 files); page
  output 144 checks and Insights output 74 checks, 0 failures.
- Browser (local, mock GitHub): Dashboard with live counts 8 / 18 / 7 and open drafts; "Review & publish on GitHub" after
  a save, linking to that PR; no Publish button anywhere; lists live; legal note in the legal editors; menu without
  unbuilt sections; 375 px without overflow; no console errors.
- No credentials in the builds, configuration files or commits.

## 7. AUTH-G1: Sign in with GitHub (replaces Cloudflare Access)

Status: **prepared, not activated.** Steps E, F and H above describe the activation; nothing has been configured on
GitHub or Cloudflare. No paid service, Zero Trust subscription, database, KV namespace or Durable Object is used.

**Flow** ([admin/worker/auth.js](../../admin/worker/auth.js), [admin/worker/session.js](../../admin/worker/session.js)):

| Step | What happens |
|---|---|
| Any request | Production host and settings checks (503), then the sign-in configuration must be complete (503). Only then is anything served. |
| No valid session | Page requests get the minimal sign-in page (401; no script, no external resource, nothing reflected). Static files get 401 text, the API 401 JSON. Nothing of the app is served. |
| `GET /auth/login` | 32 random bytes of `state` and a 48-byte PKCE verifier are sealed into `__Host-techpi_oauth` (HMAC-signed, 10 minutes). Any existing session cookie is cleared. 303 to `https://github.com/login/oauth/authorize` with `client_id`, the exact `redirect_uri`, `state`, the S256 `code_challenge`, `allow_signup=false`. |
| `GET /auth/callback` | The round-trip cookie is cleared on every outcome (single use). `code` and `state` must be well-formed and `state` must equal the sealed one (constant time). The code is exchanged server-side with the client secret and the PKCE verifier; the account is read from the authenticated `GET https://api.github.com/user`; the GitHub user token is then **revoked** (`DELETE /applications/{client_id}/token`) and never stored. Only `ADMIN_GITHUB_USER_ID` (numeric) gets a session: a new random session ID in `__Host-techpi_session`, 303 to `/`. |
| Every later request | The session cookie's HMAC signature, purpose, expiry (8 hours absolute) and user ID are checked server-side before any static file or API call. The API also keeps its same-origin and CSRF checks (custom header, Origin, Fetch Metadata, JSON). |
| `POST /auth/logout` | Same-origin checks, then both cookies are cleared. |

**Cookies:** `__Host-` prefix, `Path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`, no `Domain` (host-only), `Max-Age` 600 s
(round trip) or 28 800 s (session). The value is `payload.signature` (base64url, HMAC-SHA256 over a purpose label and the
payload); it holds only a random session ID, the numeric user ID and the username, never a token.

**Only public resources:** the sign-in page and `/auth/login`, `/auth/callback`, `/auth/logout`. Every other `/auth/*`
path is 404. Draft saves, reads and the Dashboard remain behind the session and the existing same-origin checks; the
write guard (`cms/*` branches only, draft PRs into the base, no endpoint for `main`) is unchanged.

**Secrets:** `GITHUB_OAUTH_CLIENT_SECRET`, `SESSION_SECRET` and `GITHUB_APP_PRIVATE_KEY` are Worker secrets (locally:
the git-ignored `admin/.dev.vars`). The browser never receives a GitHub token, client secret, installation token or key;
no URL carries one; the Worker logs only fixed messages. Production refuses the tests' session secrets and the local
GitHub/OAuth overrides.

**Session-key rotation.** Rotate `SESSION_SECRET` (step F's command with a new random value): every session and every
sign-in in progress ends at once. Do it when a device that was signed in is lost, when the secret may have been exposed,
after removing an administrator, and otherwise periodically (for example every 6 months). Rotate the client secret on
GitHub (generate the new one, upload it, then delete the old one) if it may have been exposed. Changing
`ADMIN_GITHUB_USER_ID` also ends every session.

**Limitations (known, accepted for a single-owner admin):**
- Sessions are stateless: signing out clears the cookie in that browser, but a copied cookie stays valid until its
  8-hour expiry. Rotating `SESSION_SECRET` is the way to end all sessions immediately.
- The session is not re-checked against GitHub after sign-in: suspending the owner's GitHub account or revoking the App
  authorisation takes effect at the next sign-in (at most 8 hours later), or immediately with a `SESSION_SECRET` rotation.
- One administrator (one numeric ID). A second administrator would need a code change (an ID list), by design.
- `GET /auth/login` clears the current session; another site could link to it and sign the owner out (no data is exposed
  and no one else can sign in).
- Signing in requires GitHub to be reachable; when it is not, the admin explains this and does not fall back to anything.

**Verification (local, GitHub mocked, nothing configured on GitHub or Cloudflare):** see the AUTH-G1 pull request for the
exact numbers. The admin unit suite covers the OAuth flow (state, PKCE, round-trip cookie, replay, fixation, other
accounts by numeric ID, GitHub errors and revoked tokens, cookie attributes, logout, expiry, tampering, production
host and secrets); the workerd end-to-end signs in through the real redirects against the mock GitHub, runs the whole
draft workflow, signs out, and checks another account, no session, an unconfigured admin and a production configuration
on localhost.
