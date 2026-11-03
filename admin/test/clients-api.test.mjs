// Task C1: clients and billing through the admin API. The real ClientBook Durable Object class runs on a real SQLite
// database (node:sqlite standing in for the Durable Object's storage.sql), behind the Worker's real sign-in and
// same-origin checks: clients, services and renewals, charges, payments, balances, the overview, deletion rules, the CSV
// export, and every refusal.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/index.js';
import { ClientBook } from '../worker/clients.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { parseAmount, addMonths, validateService, validateClient } from '../shared/clients-content.js';

const ORIGIN = 'https://admin.example.test';
const TODAY = '2026-11-03';

/** The Durable Object storage API, on node:sqlite. */
function sqliteStorage() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    db,
    sql: { exec: (q, ...b) => { const rows = db.prepare(q).all(...b).map((r) => ({ ...r })); return { toArray: () => rows }; } },
    transactionSync(fn) {
      db.exec('BEGIN');
      try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}
let storage;
let book;
const namespace = () => ({ idFromName: (n) => n, get: (id) => ({ fetch: (url, init) => { assert.equal(id, 'clients'); return book.fetch(new Request(url, init)); } }) });
const env = (extra = {}) => ({ ...authEnv, CLIENT_BOOK: namespace(), ASSETS: { fetch: async () => new Response('app') }, ...extra });

async function call(method, p, { body, headers = {}, ctx = ctxFor(), e = env(), raw = false } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  const cookie = await sessionCookie(ctx, { secret: e.SESSION_SECRET || SESSION_SECRET });
  if (cookie && !h.Cookie) h.Cookie = cookie;
  const res = await worker.fetch(new Request(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), e, ctx);
  if (raw) return res;
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}
const ok = (r, status = 200) => { assert.equal(r.status, status, r.text); return r.data; };
const newClient = async (body = { name: 'Λιμάνι Α.Ε.', company: 'Limani SA', email: 'info@limani.gr', vatNumber: '099999999' }) => ok(await call('POST', '/api/clients', { body }));
const service = (overrides = {}) => ({ domain: 'limani.gr', description: 'Hosting and maintenance', period: 'yearly', price: '240', startDate: '2025-12-01', expiresOn: '2026-12-01', ...overrides });

beforeEach(() => {
  storage = sqliteStorage();
  book = new ClientBook({ storage }, {}, { today: () => TODAY, now: () => `${TODAY}T10:00:00.000Z` });
});

test('amounts, dates and fields: Greek and English number formats, month ends, domains', () => {
  assert.equal(parseAmount('1.234,50'), 123450);
  assert.equal(parseAmount('1,234.50'), 123450);
  assert.equal(parseAmount('€ 80'), 8000);
  assert.equal(parseAmount('80,5'), 8050);
  for (const bad of ['0', '-5', 'abc', '1,2,3,4', '', '12.345.6789']) assert.equal(parseAmount(bad), null, bad);
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-12-01', 12), '2027-12-01');
  assert.equal(validateService(service({ domain: 'https://WWW.Limani.GR/contact' })).value.domain, 'www.limani.gr');
  assert.equal(validateService(service({ domain: 'λιμάνι.gr' })).ok, true);
  assert.ok(validateService(service({ domain: 'not a domain' })).errors.domain);
  assert.ok(validateService(service({ expiresOn: '2025-01-01' })).errors.expiresOn, 'expiry before start');
  assert.ok(validateService(service({ expiresOn: '' })).errors.expiresOn, 'a subscription needs an expiry');
  assert.equal(validateService(service({ period: 'one-off', expiresOn: '' })).ok, true, 'a one-off job may have none');
  assert.ok(validateClient({ name: 'A', email: 'nope' }).errors.email);
  assert.ok(validateClient({ name: 'A\nB' }).errors.name);
});

test('a client with a yearly service: the first year is charged, a payment lowers the balance, renewal moves the expiry and charges again', async () => {
  const c = await newClient();
  assert.equal(c.client.name, 'Λιμάνι Α.Ε.');
  assert.deepEqual(c.totals, { chargedCents: 0, paidCents: 0, balanceCents: 0 });
  const id = c.client.id;
  let r = ok(await call('POST', `/api/clients/${id}/services`, { body: service() }));
  assert.equal(r.services.length, 1);
  assert.equal(r.services[0].days, 28, 'days until expiry');
  assert.deepEqual(r.charges.map((x) => [x.date, x.amountCents, x.description]), [['2025-12-01', 24000, 'Hosting and maintenance (limani.gr), 2025-12-01 to 2026-12-01']]);
  assert.equal(r.totals.balanceCents, 24000);
  r = ok(await call('POST', `/api/clients/${id}/payments`, { body: { date: '2026-01-10', amount: '100', method: 'bank', note: 'Πρώτη δόση' } }));
  assert.equal(r.totals.balanceCents, 14000);
  const sid = r.services[0].id;
  r = ok(await call('POST', `/api/clients/${id}/services/${sid}/renew`, { body: {} }));
  assert.equal(r.services[0].expiresOn, '2027-12-01', 'one period on from the old expiry');
  assert.equal(r.charges.at(-1).date, TODAY);
  assert.equal(r.charges.at(-1).amountCents, 24000);
  assert.equal(r.charges.at(-1).description, 'Hosting and maintenance (limani.gr), 2026-12-01 to 2027-12-01');
  assert.equal(r.totals.balanceCents, 38000);
  // Renewing at a new price changes the service's price from then on.
  r = ok(await call('POST', `/api/clients/${id}/services/${sid}/renew`, { body: { price: '260,00', date: '2026-11-20' } }));
  assert.equal(r.services[0].priceCents, 26000);
  assert.equal(r.services[0].expiresOn, '2028-12-01');
  assert.equal(r.totals.chargedCents, 24000 * 2 + 26000);
  // Overpaying leaves a credit (negative balance).
  r = ok(await call('POST', `/api/clients/${id}/payments`, { body: { date: TODAY, amount: '700', method: 'card' } }));
  assert.equal(r.totals.balanceCents, 74000 - 80000);
  // Deleting a payment entered by mistake.
  r = ok(await call('POST', `/api/clients/${id}/payments/${r.payments.at(-1).id}/delete`, { body: {} }));
  assert.equal(r.totals.balanceCents, 64000);
  // A manual charge, and its deletion.
  r = ok(await call('POST', `/api/clients/${id}/charges`, { body: { date: TODAY, description: 'Extra page', amount: '50', serviceId: sid } }));
  assert.equal(r.totals.balanceCents, 69000);
  r = ok(await call('POST', `/api/clients/${id}/charges/${r.charges.find((x) => x.description === 'Extra page').id}/delete`, { body: {} }));
  assert.equal(r.totals.balanceCents, 64000);
});

test('services: not charged when asked, edited, cancelled, one-off; renewal refused where it makes no sense', async () => {
  const id = (await newClient()).client.id;
  let r = ok(await call('POST', `/api/clients/${id}/services`, { body: { ...service(), chargeNow: false } }));
  assert.equal(r.charges.length, 0);
  const sid = r.services[0].id;
  r = ok(await call('POST', `/api/clients/${id}/services/${sid}`, { body: service({ description: 'Hosting', period: 'monthly', price: '20', status: 'cancelled' }) }));
  assert.equal(r.services[0].period, 'monthly');
  assert.equal(r.services[0].status, 'cancelled');
  assert.equal((await call('POST', `/api/clients/${id}/services/${sid}/renew`, { body: {} })).status, 409, 'cancelled');
  r = ok(await call('POST', `/api/clients/${id}/services`, { body: service({ period: 'one-off', description: 'Logo design', price: '300', expiresOn: '' }) }));
  const oneOff = r.services.find((s) => s.period === 'one-off');
  assert.equal(oneOff.expiresOn, null);
  assert.equal(r.charges.at(-1).description, 'Logo design (limani.gr)');
  assert.equal((await call('POST', `/api/clients/${id}/services/${oneOff.id}/renew`, { body: {} })).status, 409, 'one-off');
  // A monthly renewal moves by a month.
  r = ok(await call('POST', `/api/clients/${id}/services/${sid}`, { body: service({ period: 'monthly', price: '20', expiresOn: '2026-01-31' }) }));
  r = ok(await call('POST', `/api/clients/${id}/services/${sid}/renew`, { body: {} }));
  assert.equal(r.services.find((s) => s.id === sid).expiresOn, '2026-02-28');
  // Deletion rules: a service with charges is kept (cancel it instead); one without is deleted.
  assert.equal((await call('POST', `/api/clients/${id}/services/${sid}/delete`, { body: {} })).status, 409);
  r = ok(await call('POST', `/api/clients/${id}/services`, { body: { ...service({ description: 'Unused' }), chargeNow: false } }));
  const unused = r.services.find((s) => s.description === 'Unused').id;
  r = ok(await call('POST', `/api/clients/${id}/services/${unused}/delete`, { body: {} }));
  assert.ok(!r.services.some((s) => s.id === unused));
});

test('the overview: balances owed, credits, expired and soon-expiring services, payments in the last 30 days', async () => {
  const a = (await newClient({ name: 'Alpha' })).client.id;
  const b = (await newClient({ name: 'beta' })).client.id;
  const z = (await newClient({ name: 'Zeta, no services' })).client.id;
  ok(await call('POST', `/api/clients/${a}/services`, { body: service({ domain: 'alpha.gr', expiresOn: '2026-11-20' }) }));
  ok(await call('POST', `/api/clients/${a}/services`, { body: service({ domain: 'alpha.eu', expiresOn: '2027-06-01' }) }));
  ok(await call('POST', `/api/clients/${b}/services`, { body: service({ domain: 'beta.com', price: '100', expiresOn: '2026-10-30' }) }));
  ok(await call('POST', `/api/clients/${b}/payments`, { body: { date: '2026-10-15', amount: '150', method: 'cash' } }));
  ok(await call('POST', `/api/clients/${z}/payments`, { body: { date: '2025-01-01', amount: '10', method: 'other' } }));
  const r = ok(await call('GET', '/api/clients'));
  assert.equal(r.today, TODAY);
  assert.deepEqual(r.clients.map((c) => c.name), ['Alpha', 'beta', 'Zeta, no services'], 'by name, ignoring case');
  const alpha = r.clients[0];
  assert.deepEqual(alpha.domains.sort(), ['alpha.eu', 'alpha.gr']);
  assert.deepEqual(alpha.nextExpiry && [alpha.nextExpiry.domain, alpha.nextExpiry.days], ['alpha.gr', 17]);
  assert.equal(alpha.balanceCents, 48000);
  assert.equal(r.clients[1].balanceCents, -5000, 'beta paid more than charged');
  assert.equal(r.clients[1].lastPayment, '2026-10-15');
  assert.equal(r.overview.outstandingCents, 48000);
  assert.equal(r.overview.creditCents, 5000 + 1000);
  assert.equal(r.overview.clientsOwing, 1);
  assert.deepEqual(r.overview.expired.map((s) => [s.domain, s.days, s.clientName]), [['beta.com', -4, 'beta']]);
  assert.deepEqual(r.overview.expiringSoon.map((s) => s.domain), ['alpha.gr'], 'within 60 days; alpha.eu is later');
  assert.equal(r.overview.paidLast30Cents, 15000);
});

test('clients: edited; deleted only without charges or payments; bad input refused with field errors and nothing saved', async () => {
  const id = (await newClient()).client.id;
  let r = ok(await call('POST', `/api/clients/${id}`, { body: { name: 'Limani', phone: '+30 210 0000000', notes: 'Line one\nLine two' } }));
  assert.equal(r.client.name, 'Limani');
  assert.equal(r.client.email, null, 'fields left empty are cleared');
  assert.equal(r.client.notes, 'Line one\nLine two');
  for (const [p, body, field] of [
    ['/api/clients', { name: '' }, 'name'],
    ['/api/clients', { name: 'A', email: 'x@' }, 'email'],
    [`/api/clients/${id}/services`, service({ price: '0' }), 'price'],
    [`/api/clients/${id}/services`, service({ period: 'weekly' }), 'period'],
    [`/api/clients/${id}/payments`, { date: '2026-02-30', amount: '10', method: 'bank' }, 'date'],
    [`/api/clients/${id}/payments`, { date: TODAY, amount: '10', method: 'bitcoin' }, 'method'],
    [`/api/clients/${id}/charges`, { date: TODAY, amount: '10', description: '<script>' }, 'description'],
  ]) {
    const x = await call('POST', p, { body });
    assert.equal(x.status, 422, `${p} ${field}: ${x.text}`);
    assert.ok(x.data.error.fields[field], `${p} ${field}: ${x.text}`);
  }
  assert.equal(ok(await call('GET', '/api/clients')).clients.length, 1, 'nothing was added');
  ok(await call('POST', `/api/clients/${id}/payments`, { body: { date: TODAY, amount: '10', method: 'bank' } }));
  assert.equal((await call('POST', `/api/clients/${id}/delete`, { body: {} })).status, 409);
  const other = (await newClient({ name: 'Mistake' })).client.id;
  ok(await call('POST', `/api/clients/${other}/services`, { body: { ...service(), chargeNow: false } }));
  ok(await call('POST', `/api/clients/${other}/delete`, { body: {} }));
  assert.equal((await call('GET', `/api/clients/${other}`)).status, 404);
  assert.equal(storage.db.prepare('SELECT COUNT(*) AS n FROM services WHERE client_id = ?').get(other).n, 0, 'its services went with it');
});

test('one client’s records cannot be reached through another', async () => {
  const a = (await newClient({ name: 'A' })).client.id;
  const b = (await newClient({ name: 'B' })).client.id;
  const r = ok(await call('POST', `/api/clients/${a}/services`, { body: service() }));
  const sid = r.services[0].id;
  const cid = r.charges[0].id;
  const pid = ok(await call('POST', `/api/clients/${a}/payments`, { body: { date: TODAY, amount: '1', method: 'bank' } })).payments[0].id;
  assert.equal((await call('POST', `/api/clients/${b}/services/${sid}/renew`, { body: {} })).status, 404);
  assert.equal((await call('POST', `/api/clients/${b}/services/${sid}`, { body: service() })).status, 404);
  assert.equal((await call('POST', `/api/clients/${b}/charges/${cid}/delete`, { body: {} })).status, 404);
  assert.equal((await call('POST', `/api/clients/${b}/payments/${pid}/delete`, { body: {} })).status, 404);
  assert.equal((await call('POST', `/api/clients/${b}/charges`, { body: { date: TODAY, amount: '5', description: 'x', serviceId: sid } })).status, 404);
  assert.equal(ok(await call('GET', `/api/clients/${a}`)).totals.balanceCents, 23900, 'A unchanged');
});

test('CSV export: every record, Greek text readable, amounts in euro, spreadsheet formulas neutralised', async () => {
  const id = (await newClient({ name: '=HYPERLINK("http://x")', company: 'Λιμάνι, Α.Ε.' })).client.id;
  ok(await call('POST', `/api/clients/${id}/services`, { body: service() }));
  ok(await call('POST', `/api/clients/${id}/payments`, { body: { date: TODAY, amount: '99,90', method: 'bank', note: 'Μέρος "1"' } }));
  const res = await call('GET', '/api/clients/export.csv', { raw: true });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/csv/);
  assert.match(res.headers.get('Content-Disposition'), /^attachment; filename="techpi-clients-\d{4}-\d{2}-\d{2}\.csv"$/);
  assert.equal(res.headers.get('Cache-Control'), 'no-store', 'security headers on the download too');
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 byte order mark');
  const text = new TextDecoder().decode(bytes);
  const lines = text.trim().split('\r\n');
  assert.equal(lines.length, 5, 'header, client, service, its charge, payment');
  assert.match(lines[0], /^record,client,company/);
  assert.match(lines[1], /^client,'=HYPERLINK\(""http:\/\/x""\)|^client,"'=HYPERLINK\(""http:\/\/x""\)"/);
  assert.ok(lines[1].includes('"Λιμάνι, Α.Ε."'));
  assert.match(lines[1], /,140\.10$/, 'the balance');
  assert.match(lines[2], /^service,.*,limani\.gr,yearly,2026-12-01,active,240\.00,,$/);
  assert.match(lines[3], /^charge,.*,2025-12-01,.*240\.00,,$/);
  assert.match(lines[4], /^payment,.*,"Μέρος ""1""",.*99\.90,bank,$/);
});

test('refused outside the owner’s session, without the admin header, without the database, and on unknown routes', async () => {
  assert.equal((await call('GET', '/api/clients', { ctx: {} })).status, 401);
  assert.equal((await call('GET', '/api/clients', { ctx: ctxFor('intruder') })).status, 401);
  assert.equal((await call('POST', '/api/clients', { body: { name: 'X' }, headers: { 'X-TechPi-Admin': '' } })).status, 403);
  assert.equal((await call('POST', '/api/clients', { body: { name: 'X' }, headers: { Origin: 'https://evil.example' } })).status, 403);
  const none = await call('GET', '/api/clients', { e: env({ CLIENT_BOOK: undefined }) });
  assert.equal(none.status, 503);
  assert.match(none.data.error.message, /CLIENT_BOOK/);
  for (const p of ['/api/clients/0', '/api/clients/abc', '/api/clients/1/invoices', '/api/clients/1/services/x/renew', '/api/clients/1/services/1/2/3']) assert.equal((await call('POST', p, { body: {} })).status, 404, p);
  assert.equal((await call('DELETE', '/api/clients/1')).status, 405);
  assert.equal((await call('GET', '/api/clients/1/delete')).status, 405);
  assert.equal((await call('POST', '/api/clients', { body: undefined, headers: { 'Content-Type': 'application/json' } })).status, 400);
  assert.equal((await call('POST', '/api/clients', { body: { name: 'x'.repeat(40_000) } })).status, 413);
  assert.equal((await call('GET', '/api/clients/999')).status, 404);
  const r = await call('GET', '/api/clients');
  assert.equal(r.data.clients.length, 0, 'nothing was written by any of these');
});
