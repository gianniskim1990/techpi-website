# C1: clients and billing

Status: built 2026-11-03. A small private ledger in the admin: clients, their domains and subscriptions with expiry
dates, what each was charged, what each paid, and what is still owed.

## What the owner can do

A **Clients** page in the admin:

- **Overview**: money owed to you (and how many clients owe it), money paid in advance, payments in the last 30 days,
  services past their expiry date, and services expiring within 60 days, listed under **Renewals**.
- **Client list**: name and company, domains, next expiry (with "in 17 days" or "4 days ago"), charged, paid and
  balance. Search by name, domain, email or VAT number; show only clients who owe money or have a renewal within 60
  days; sort by name, balance or next expiry.
- **New client**: name (required), company, email, phone, VAT number (ΑΦΜ), notes.
- **One client**: details (edit; delete only when nothing was charged or paid), **services and domains**, and the
  **account**: every charge and payment in date order, with the running balance.
- **Services**: a domain (optional), what it is (hosting, domain registration, maintenance, a website build…), how often
  it is billed (monthly, every 3 months, yearly, every 2 years, or one-off), its price, start date and expiry date. A new
  service's expiry is filled in from its start date and period. Adding one charges its first period (or the one-off
  price), dated the start date, unless you untick that.
- **Renew**: moves the expiry one period on from the old expiry (so no days are lost or gained) and charges the price,
  which can be changed for this and later renewals. Cancelled and one-off services are not renewed.
- **Record payment**: amount (prefilled with what is owed), date, method (bank transfer, card, cash, other), and a note
  such as a receipt number. **Charge**: any other amount owed, optionally tied to a service.
- Charges and payments entered by mistake can be deleted (two clicks). A service that has charges is kept: mark it
  cancelled instead.
- **Export CSV**: every client, service, charge and payment, with balances, for a backup or the accountant. The file
  opens in Excel and LibreOffice with Greek text intact, and text that starts like a formula is neutralised.

Amounts are typed the Greek or English way (`1.234,50`, `1234.50`, `€ 80`) and shown as `1.234,50 €`. Balance = charges −
payments; a negative balance is money paid in advance.

## Where the data lives, and why

**Not on GitHub.** Everything else in the admin is stored in the public website repository; client names, contacts and
amounts must not be. They are kept in a **SQLite database inside the admin Worker**: one SQLite-backed Durable Object,
`ClientBook` (binding `CLIENT_BOOK`), like the `LoginLimiter` the password sign-in already uses. It is private to the
Cloudflare account, free on the Workers Free plan, and created automatically by the next admin deployment (Wrangler
migration `v2`). No new account, service or secret is needed.

- Only the signed-in owner reaches it, through the same session, admin-header and same-origin checks as the rest of the
  API. Nothing about clients is logged, and nothing goes to GitHub or the website.
- One Durable Object handles one request at a time, and every change runs in a transaction, so totals are always
  consistent. Money is stored in cents.
- Cloudflare keeps 30 days of point-in-time recovery for SQLite Durable Objects. Exporting a CSV now and then is still
  the simplest backup the owner holds.
- This is personal data under the GDPR (clients' names, emails, phones). Keep only what the business needs; the privacy
  notice on the website covers the site's visitors, not this client list.

## Code

| File | |
|---|---|
| `admin/shared/clients-content.js` | Rules shared by the Worker and the app: fields, amounts, dates, periods, domains |
| `admin/worker/clients.js` | The `ClientBook` Durable Object (schema, ledger, CSV) and the `/api/clients` routes |
| `admin/src/app/views/ClientsList.svelte`, `ClientView.svelte` | The pages |

Routes: `GET/POST /api/clients`, `GET /api/clients/export.csv`, `GET/POST /api/clients/<id>`, `POST …/delete`,
`POST …/services[/<sid>[/renew|/delete]]`, `POST …/charges[/<cid>/delete]`, `POST …/payments[/<pid>/delete]`.

## Tests

- `admin/test/clients-api.test.mjs` (8 tests): the real `ClientBook` class on a real SQLite database (`node:sqlite`)
  behind the Worker's real checks. Amount formats, month ends, domains; a yearly service charged, paid in part, renewed
  twice (once at a new price), overpaid, a payment and a charge deleted; services not charged, edited, cancelled,
  one-off, monthly renewal at a month end, deletion rules; the overview (owed, credit, expired, expiring, last 30 days);
  client editing and deletion rules, field errors with nothing saved; one client's records unreachable through another;
  the CSV (byte order mark, quoting, formulas neutralised, download headers); refusals without the owner's session, the
  admin header, the same origin or the database, unknown routes, wrong methods, invalid and oversized bodies.
- Local end-to-end (`admin/test/access-e2e.mjs`): the same flow on the real Durable Object in Cloudflare's local
  runtime, an invalid payment refused, the CSV, and no GitHub write.
- Admin 217/217; end-to-end 0 failures. Browser (local admin): a client created, a yearly service with its expiry filled
  in, a partial payment with the amount prefilled from the balance, a renewal, the overview, and the phone layout.

## Deploy note

Redeploy the admin (`docs/admin/M4-GO-LIVE.md`). The committed Wrangler configurations declare the `CLIENT_BOOK`
binding and the `v2` migration; **the local production configuration (`admin/wrangler.production.local.jsonc`, not in
git) must get the same two lines** before that deployment:

```jsonc
"durable_objects": { "bindings": [{ "name": "LOGIN_LIMITER", "class_name": "LoginLimiter" }, { "name": "CLIENT_BOOK", "class_name": "ClientBook" }] },
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["LoginLimiter"] }, { "tag": "v2", "new_sqlite_classes": ["ClientBook"] }],
```

Without the binding the Clients page says the database is not set up (503); nothing else in the admin is affected.
