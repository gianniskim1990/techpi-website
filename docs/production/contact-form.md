# Contact form

Status: built 2026-10-22, **not live until the production setup below is done**. Until then the form fails closed: it
shows "the form is not available, please email info@techpi.eu", and the email address and phone stay on the page.

## 1. What it is

| Part | File | What it does |
|---|---|---|
| Form | `src/components/secondary/ContactForm.astro` | On `/contact` and `/el/contact`. Name, email, organisation (optional), timeframe (optional), message. No budget field. Browser validation, loading, success and error states, in English and Greek (`src/i18n/en.ts`, `el.ts`, `contactForm`) |
| Page CSP | `src/components/pages/ContactPage.astro` | Allows `https://challenges.cloudflare.com` for scripts and frames on the two contact pages only |
| Endpoint | `worker/contact.js`, `worker/index.js` | `GET /api/contact` (public config), `POST /api/contact` (one enquiry) |
| Routing | `wrangler.jsonc` | `main: worker/index.js`, `run_worker_first: ["/api/*"]`. Everything else is served by the static files first, as before |
| Tests | `worker/test/contact.test.mjs` (`npm test`) | 42 tests, every provider mocked |
| Checks | `scripts/security/validate.mjs` | The Turnstile origin only on the contact pages, no other origin or frame anywhere |

The recipient is the constant `RECIPIENT = 'info@techpi.eu'` in `worker/contact.js`. No request field can change it.
The sender comes from `CONTACT_FROM` (`wrangler.jsonc`), which must be an address on `techpi.eu` or a subdomain;
anything else disables the form. Reply-To is the visitor's validated email, so replying in the mailbox answers them.

## 2. Request flow and controls

`POST /api/contact`, in this order; the first failure answers and stops:

| # | Check | Answer on failure |
|---|---|---|
| 1 | `Origin` equals the site's own origin, `Sec-Fetch-Site` (when sent) is `same-origin` | 403 `forbidden` |
| 2 | `Content-Type: application/json` (a cross-site HTML form cannot send it, and a cross-site `fetch` needs a CORS preflight this endpoint never grants) | 415 |
| 3 | Body at most 16 KB, counted while reading, whatever `Content-Length` says | 413 |
| 4 | All three secrets, a valid `CONTACT_FROM` and the `CONTACT_RATE_LIMITER` binding present (fail closed; `GET` also answers 503, so the page keeps the form disabled) | 503 `unavailable` |
| 5 | Rate limit: about 5 requests a minute per client IP (Workers Rate Limiting binding `CONTACT_RATE_LIMITER`). Required: if the binding throws, the request is refused (503 `unavailable`), and any answer other than `{ success: true }` counts as limited. It is never skipped | 429 `rate_limited` |
| 6 | Fields: strings only; name 1–100, email (one address, ≤ 254), organisation ≤ 150, message 10–5000 characters, timeframe from a fixed list; no control characters in single-line fields (no CR/LF: no header injection); message line breaks normalised | 400 `invalid` + field names |
| 7 | Honeypot field (`website`) empty. A filled one is refused, never reported as sent | 400 `rejected` |
| 8 | Cloudflare Turnstile `siteverify`, server-side, with the client IP; `success`, action `contact` and the request's hostname must all match | 403 `verification_failed` |
| 9 | Resend `POST /emails`; only a 2xx answer with a message id counts as sent | 502 `send_failed` |

- The email is built server-side: every value is HTML-escaped in the HTML part; the subject uses only the checked,
  single-line name. Any unexpected field in the request (for example `to`) is ignored.
- Answers are JSON with fixed error codes, never echoed input. Headers: `no-store`, `nosniff`, `X-Robots-Tag: noindex`,
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. No CORS headers.
- Logging: only fixed codes and provider HTTP status codes (`contact: resend status 401`). No name, email, message,
  IP or key is ever logged (a test checks this).
- The page says "sent" only after the endpoint returns `{ ok: true }`, which it does only after Resend accepted the
  message. After any failure the Turnstile widget is reset, because a token is single-use.
- Without JavaScript the form cannot pass Turnstile; a `<noscript>` note gives the email address instead.
- Turnstile runs in `interaction-only` mode: invisible unless Cloudflare needs the visitor to act.
- **The rate limit is approximate.** Cloudflare Workers Rate Limiting counts per Cloudflare location (data centre), not
  globally, and its counters are eventually consistent, so the effective limit can be somewhat higher than 5 a minute,
  especially for a client whose requests reach several locations. It is a brake on abuse from one source, not an
  exact quota. Turnstile is the main defence against automated submissions; the honeypot and validation come before
  any email is sent.

## 3. Configuration

| Name | Kind | Where | Value |
|---|---|---|---|
| `CONTACT_FROM` | variable | `wrangler.jsonc` | `TechPi website <website@techpi.eu>` (owner-verified `techpi.eu` domain on Resend) |
| `RESEND_API_KEY` | secret | Cloudflare | Resend API key, sending access, restricted to the sending domain |
| `TURNSTILE_SECRET_KEY` | secret | Cloudflare | Turnstile widget secret key |
| `TURNSTILE_SITE_KEY` | secret | Cloudflare | Turnstile widget site key (public, sent to the page by `GET /api/contact`; kept as a secret only so it survives deploys and stays out of the repository) |
| `CONTACT_RATE_LIMITER` | binding | `wrangler.jsonc` | `namespace_id` `1001`, limit 5 per 60 s, counted per Cloudflare location and approximate (section 2). Required: without it the form is unavailable. The id must be unique among rate-limit namespaces in the Cloudflare account |

Secrets are never in the repository and never in `wrangler.jsonc`. `wrangler deploy` keeps existing secrets.

## 4. Production setup (owner progress, 2026-10-22)

Owner-confirmed completed: Resend `techpi.eu` domain verified with Ireland (eu-west-1) selected, Resend
Receiving disabled, a successful external-to-`info@techpi.eu` delivery test at the existing Pointer inbox, a sending-only
Resend API key created, and a Cloudflare Turnstile widget created for `techpi.eu`. No API keys belong in GitHub or chat.
**Still required:** store the three Worker secrets, confirm the live `CONTACT_FROM` value, and verify one actual submission.
Do not modify the Pointer mailbox, apex MX/SPF records or DNS just for this form.

### 4.1 Resend: verified `techpi.eu` sender

Use the existing verified `techpi.eu` sending domain, not the originally proposed `notify.techpi.eu` subdomain.
The sender is `TechPi website <website@techpi.eu>` and the fixed recipient is `info@techpi.eu`.
Resend Receiving must stay disabled to avoid competing with the existing incoming Pointer service.
The user's external email test passed. If email delivery issues arise, review the real Cloudflare DNS records,
especially apex MX/SPF/DKIM, rather than guessing or changing them pre-emptively.
The API key should have sending-only permission scoped to the verified `techpi.eu` domain.

### 4.2 Cloudflare Turnstile

1. Cloudflare dashboard → **Turnstile → Add widget**. Name: `techpi.eu contact form`.
2. Hostnames: `techpi.eu`. (Add `www.techpi.eu` only if the site is ever served there without redirecting.)
3. Widget mode: **Managed**. Pre-clearance: off.
4. Copy the **site key** and the **secret key**.

The endpoint requires the token's hostname to equal the request's host, so the form works on hostnames listed in the
widget. On a `*.workers.dev` preview it answers `verification_failed` unless that preview hostname is added to the
widget; production is unaffected.

### 4.3 Cloudflare secrets for the `techpi-website` Worker

Use Cloudflare dashboard → Workers & Pages → **techpi-website** → Settings → Variables and Secrets → Add, type **Secret**. Do not put secret values in chat, source control, screenshots or deployment commands.

Alternatively, from an up-to-date repository root with a confirmed Wrangler login, use:

```bash
npx wrangler secret put RESEND_API_KEY
```

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

```bash
npx wrangler secret put TURNSTILE_SITE_KEY
```

Each command prompts for its secret value. Confirm the account and target Worker before changing production settings.

### 4.4 Check after deploying

1. `https://techpi.eu/api/contact` answers `{"ok":true,"siteKey":"…"}` (503 means a secret, `CONTACT_FROM` or the rate-limit binding is missing).
2. `/contact`: the Send button is enabled; there is no CSP error in the browser console.
3. One real test message, **only after the owner approves it**: it arrives at info@techpi.eu from
   `website@techpi.eu`, and Reply goes to the address typed in the form. Check the headers show DKIM `pass`.
4. Resend dashboard → Logs: one delivered email.

## 5. Tests run (2026-10-22)

- `npm test`: 50 unit tests of the endpoint, every provider mocked (origin, content type, size, method, config, each
  field, header injection, honeypot, Turnstile failure/hostname/action/outage, Resend 401/500/no id/outage, rate
  limit, escaping, fixed recipient, no personal data in logs). The rate-limit binding (2026-10-22 correction): missing,
  without `limit()`, throwing (async and sync) and malformed answers all fail closed with nothing sent, and the limit
  is keyed on the client IP.
- Browser, both languages, against the build with the real Worker module and mocked providers: empty submit,
  invalid email, provider failure, success (mocked Resend payload checked), failed verification, honeypot,
  missing configuration (Turnstile not loaded, button disabled), mobile layout. Real Turnstile widget with
  Cloudflare's always-pass test site key.
- `wrangler dev` (workerd): static pages, redirects, trailing-slash handling, `_headers` and asset caching unchanged;
  `/api/contact` 503 without secrets, 403 cross-origin, 404 on other `/api` paths; real Turnstile `siteverify` with
  Cloudflare's always-fail test secret answers `verification_failed`; the rate limiter answers 429 after five posts.
- No real email was sent.
