# TechPi Admin: M4, production readiness and go-live runbook

Status: **prepared, not activated.** Nothing in this document has been done. Every step that changes `main`, DNS,
Cloudflare, GitHub settings or deploys anything needs the owner's separate approval, at the step where it is marked.

## 1. What M4 changed

| Area | Change |
|---|---|
| Production content workflow | `CONTENT_MODE` (`development` / `production`) and `CONTENT_BASE_BRANCH` ([admin/worker/config.js](../../admin/worker/config.js)). No default base: unset means the content API answers 503. `main` is accepted **only** with `CONTENT_MODE=production`, and production accepts **only** `main`. A base without the admin content (for example `main` before the release is merged) is reported, not shown as empty. |
| Writes | Every write goes through `assertDraftBranch`: only `cms/<collection>/<slug>` branches are created, reset or committed to; never `main`, never the base. The browser cannot choose the repository, base, branch, file or permissions. There is no publish, merge or delete endpoint. |
| Leftover branches | A `cms/*` branch is reused while its draft PR into the base is open. A leftover branch is reset to the base only when it is exactly the head of a **closed** PR (a finished test or draft). An **open** PR for another base, or commits that no closed PR accounts for, **block** the save (409) and nothing is overwritten; the editor warns before anything is typed. The five current leftover branches (from test PRs #30, #32, #34, #36, #38, all closed) are at their closed PR's head, so they are handled safely. |
| Production host and settings | In production mode the Worker serves nothing (503) unless the request is for `ADMIN_HOSTNAME` over HTTPS, and refuses local-test settings: the GitHub API override, `ENABLE_TEST_CONTENT`, reserved test identities (`example.*`, `*.test`), test audience tags. This runs before Access, for the app, its files and the API alike. |
| Publishing | Manual, on GitHub. No Publish button. With an open draft, editors and the Dashboard show **Review & publish on GitHub**, opening that pull request, and explain: saving is not publishing; the owner reviews; required checks must pass; the owner merges into `main`; Cloudflare then builds and deploys the site from `main`. |
| Prototype removed | The legacy Sveltia page (`/sveltia-m0.html`), its config, test and the `@sveltia/cms` dependency; TipTap; the prototype snapshot (data, list, editor, placeholder screens for Media, SEO and Settings); the M0 dummy content and its Astro collection (`content/m0-demo`, `src/content.config.ts`, neither on `main`). The M0 test collection stays in the Worker for development tests only (`ENABLE_TEST_CONTENT=true`, refused in production). |
| Dashboard and lists | Live data only: the 33 managed items (8 pages, 18 case studies, 7 articles) read from the content branch, the open draft PRs with their review links, and where the content comes from (development branch or `main`). No deployment date, version or history is invented. |
| Configuration files | `admin/wrangler.jsonc` stays in **development** mode on the M4 branch (it must not point at `main` before the release is merged). `admin/wrangler.production.example.jsonc` holds the go-live values: production mode, `main`, `ADMIN_HOSTNAME=admin.techpi.eu`, the Custom Domain route, empty Access and GitHub values, no secrets, no `access.dev`. |

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

### E. Configure Cloudflare Access *(approval required; Cloudflare account change)*
In Cloudflare Zero Trust:
1. Settings → Authentication: enable a login method for the owner (One-time PIN to the owner's email, or Google).
2. Access → Applications → Add an application → **Self-hosted**: application domain **admin.techpi.eu** (whole host, all
   paths); session duration as preferred (for example 24 hours).
3. Policy: **Allow**, include **Emails** = the owner's email address only. No "Everyone", no bypass, no service-token
   rule.
4. Save, then copy the application's **Audience (AUD) tag** (Application → Overview).
Access then protects the hostname before any request reaches the Worker, and the Worker checks the same AUD tag and the
email again.

### F. Configure the admin Worker and the GitHub App secret *(approval required)*
In `admin/`, fill the empty values of `wrangler.production.example.jsonc` locally (do not commit the owner's email or
the AUD tag to this public repository if that is not wanted; they are not secrets, but keep them out of Git by applying
them at deploy time):
- `ACCESS_AUD`: the AUD tag from step E; `ADMIN_EMAILS`: the owner's email;
- `GITHUB_APP_ID` and `GITHUB_APP_INSTALLATION_ID`: the values from the A1 setup (they are in the owner's local,
  git-ignored `admin/wrangler.local.jsonc`);
- `CONTENT_MODE` `production`, `CONTENT_BASE_BRANCH` `main`, `ADMIN_HOSTNAME` `admin.techpi.eu` (already set).
Upload the private key as a Worker secret, from the file, without displaying it:
```bash
npx wrangler secret put GITHUB_APP_PRIVATE_KEY --config wrangler.production.example.jsonc
```
(paste the PEM at the prompt, or in PowerShell: `Get-Content C:\path\to\key.pem -Raw | npx wrangler secret put GITHUB_APP_PRIVATE_KEY --config wrangler.production.example.jsonc`).
The GitHub App keeps its current permissions (Metadata read, Contents and Pull requests read and write) on this
repository only; `main`'s ruleset stays as it is: the admin never writes to `main`, it only opens PRs.

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
- In a private window: `https://admin.techpi.eu` → the Cloudflare Access sign-in page (not the admin).
- Sign in with another email → Access denies it.
- `curl -sI https://admin.techpi.eu/` and `curl -sI https://admin.techpi.eu/api/session` → a redirect to Cloudflare
  Access (302), never the admin or JSON.
- Sign in as the owner → the admin loads, the sidebar shows the owner's email, the Dashboard says "Published content:
  main" and shows no configuration warning.
- The Workers dashboard shows no workers.dev route and no preview URLs for `techpi-admin`.

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
| The admin deployment | `npx wrangler rollback` (to the previous admin version) or, to take the admin offline: remove the `admin.techpi.eu` Custom Domain from the `techpi-admin` Worker (this removes its DNS record), or `npx wrangler delete --name techpi-admin`. Access continues to protect the hostname meanwhile. |
| Access | Disable or delete the Access application; with no Access, the Worker itself refuses every request (no `ctx.access`: 403). |
| GitHub App credentials | GitHub → Settings → Developer settings → GitHub Apps → the App → revoke the private key (generate a new one), or suspend/uninstall the installation. The admin then answers "not configured" or GitHub errors; nothing can be written. |
| DNS for the admin | Removing the Custom Domain removes the record; otherwise delete the `admin.techpi.eu` record in the `techpi.eu` zone. No other record is involved. |

## 5. Remaining owner-only activation steps

A (code approval), C (merge into `main`, after confirming the Workers Builds deploy setting), E (Access application and
policy), F (fill production values, upload the private key), G (deploy the admin; creates the DNS record), H to L
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
