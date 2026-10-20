# TechPi admin: UI review, recommended architecture and plan

Status: **proposal, awaiting owner approval** (2026-10-20, branch `feat/techpi-admin-ui-prototype`). Nothing here is
deployed or connected. The prototype uses a read-only demo snapshot of the live site and saves nothing.

## 1. The "zero entries" report

**Root cause: branch, not format or path.** The CMS lists entries from one configured branch, `main`. The M0 demo
entry exists only on `feat/techpi-admin-m0` (PR #27 is unmerged), so on `main` there was nothing to list. Fixed on the
M0 branch (commit `327d50b`): the content branch is explicit per mode (`npm run dev:m0` reads the M0 branch; `main`
stays the default), and `admin/test/config.test.mjs` fails if the configured branch does not contain a collection's
entries.

## 2. Can Sveltia CMS carry a professional TechPi admin?

**No, not maintainably.** Its documented customisation is a logo, an app title, CSS hooks on edit fields, and custom
field and preview components. There is no theming, no custom dashboard, no custom navigation or sections, and its
internal markup and classes are not a public API. It releases almost daily (0.229 to 0.248 in two weeks), so restyling
its internals would break with every update. It stays useful as the M0 proof that the Git-backed workflow works.

## 3. Recommended architecture

A **custom TechPi admin** (the prototype in `admin/src/prototype`, Svelte 5 and TipTap) on the **same Git-backed
model** M0 proved, with one change: Git operations move from the browser to the admin Worker.

| Part | Choice |
|---|---|
| Interface | Custom single-page app, TechPi design system (Commissioner, Ink/Paper/Blue), served by the admin Worker |
| Sign-in | Cloudflare Access only (your email or Google). Already built and tested in M0: the Worker checks `ctx.access`, the audience and an allowlist, and refuses everything otherwise |
| Repository access | A GitHub App installed on this repository only. The Worker mints short-lived (1 hour) tokens server-side; its private key is a Worker secret. **You never handle a GitHub token** |
| Drafts | Each change set is its own branch with a draft pull request, as in M0 |
| Preview | The existing Cloudflare branch preview, protected by Access ("Previews only") |
| Publish | Merging the pull request. The `main` ruleset you created requires the passing Workers Builds check, so nothing unvalidated can go live; the App is not allowed to bypass it |
| History and rollback | Git history; "Undo this publish" opens and merges a revert |
| Content | JSON and Markdown files with Astro schemas (as in M0); the public site stays static |
| Cost | €0 (Workers, Access up to 50 users, GitHub App: all free) |

**Trade-off against keeping the M0 model (token pasted in the browser):**

| | Server-side GitHub App (recommended) | Token in the browser (M0) |
|---|---|---|
| Owner experience | One sign-in, no tokens | Create and renew a token, paste it into the admin |
| Credential exposure | No GitHub credential in the browser; App key only in the Worker | Token in the browser's local storage |
| Scope | App limited to this repository and to contents and pull requests | Same scope, but the token lasts up to a year |
| New risk | The Worker becomes the write path: it must authorise every write (Access identity), check same-origin, and validate content server-side | None new |
| Work | More: about 4 Worker endpoints (read, save draft, publish, revert) | Less |

This **changes authentication and publishing**, so it needs your approval before any of it is built.

## 4. Implementation plan (after approval)

1. **Content model (M1):** move the website's content from TypeScript into JSON and Markdown with schemas, keeping
   the built site byte-identical. Needed by any editor.
2. **Worker Git API:** GitHub App authentication, read content, save draft (commit to a draft branch with a pinned
   parent), open a draft pull request, publish (merge), undo (revert). Tests against a scratch repository first.
3. **Connect the UI:** case studies and articles first (the screens in the prototype), then website pages, media
   upload (server-side checks as in M0), the SEO overview and settings.
4. **Deploy:** the admin Worker behind Access on `admin.techpi.eu`, private draft previews, an end-to-end test with
   dummy content, then go live.

## 5. Decisions for the owner

1. Approve the custom admin replacing Sveltia.
2. Approve the server-side GitHub App (or keep token sign-in).
3. Approve the prototype's direction (screens in `docs/admin/prototype/`), with any design changes.
4. Repository visibility (unchanged question from M0): drafts in a public repository are public on GitHub.
