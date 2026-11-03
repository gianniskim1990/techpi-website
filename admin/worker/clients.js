/**
 * Clients and billing (Task C1): a small private ledger in the admin, kept in ONE SQLite-backed Durable Object
 * (ClientBook, binding CLIENT_BOOK), not in the public GitHub repository. Only the signed-in owner reaches it, through
 * the same session and same-origin checks as the rest of the API (index.js). Nothing here is ever published.
 *
 *   GET  /api/clients                                   every client with totals, and the overview (balances, expiries)
 *   POST /api/clients                                   new client
 *   GET  /api/clients/export.csv                        everything, as CSV (for a backup or the accountant)
 *   GET  /api/clients/<id>                              one client with services, charges, payments and totals
 *   POST /api/clients/<id>                              edit the client
 *   POST /api/clients/<id>/delete                       delete a client that has no charges or payments
 *   POST /api/clients/<id>/services                     new service (optionally charging its first period)
 *   POST /api/clients/<id>/services/<sid>               edit a service
 *   POST /api/clients/<id>/services/<sid>/renew         renew: move the expiry one period on and charge the price
 *   POST /api/clients/<id>/services/<sid>/delete        delete a service no charge refers to
 *   POST /api/clients/<id>/charges                      new charge
 *   POST /api/clients/<id>/charges/<cid>/delete
 *   POST /api/clients/<id>/payments                     new payment
 *   POST /api/clients/<id>/payments/<pid>/delete
 *
 * The Durable Object runs one request at a time, so totals are always consistent. Amounts are cents; see
 * shared/clients-content.js for the rules. The SQL logic (`ledger`) takes any `sql.exec` compatible with the Durable
 * Object storage API, so the tests run it on node:sqlite.
 */
import * as rules from '../shared/clients-content.js';

const MAX_BODY = 32 * 1024;
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, company TEXT, email TEXT, phone TEXT, vat_number TEXT, notes TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), domain TEXT, description TEXT NOT NULL,
    period TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK (price_cents > 0), start_date TEXT NOT NULL, expires_on TEXT,
    status TEXT NOT NULL DEFAULT 'active', notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS charges (
    id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), service_id INTEGER REFERENCES services(id),
    date TEXT NOT NULL, description TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), date TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), method TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS services_client ON services(client_id)',
  'CREATE INDEX IF NOT EXISTS charges_client ON charges(client_id)',
  'CREATE INDEX IF NOT EXISTS payments_client ON payments(client_id)',
];

class Refused extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
const invalid = (errors) => new Refused(422, 'Some fields need attention.', errors);

/** The ledger's operations on a SQLite database: `sql.exec(query, ...bindings)` returns a cursor with toArray(). */
export function ledger(sql, { today = () => new Date().toISOString().slice(0, 10), now = () => new Date().toISOString() } = {}) {
  for (const s of SCHEMA) sql.exec(s);
  const rows = (q, ...b) => sql.exec(q, ...b).toArray();
  const one = (q, ...b) => rows(q, ...b)[0] ?? null;
  const lastId = () => one('SELECT last_insert_rowid() AS id').id;

  const clientOut = (r) => ({ id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone, vatNumber: r.vat_number, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at });
  const serviceOut = (r) => ({ id: r.id, clientId: r.client_id, domain: r.domain, description: r.description, period: r.period, priceCents: r.price_cents, startDate: r.start_date, expiresOn: r.expires_on, status: r.status, notes: r.notes });
  const chargeOut = (r) => ({ id: r.id, clientId: r.client_id, serviceId: r.service_id, date: r.date, description: r.description, amountCents: r.amount_cents });
  const paymentOut = (r) => ({ id: r.id, clientId: r.client_id, date: r.date, amountCents: r.amount_cents, method: r.method, note: r.note });

  const getClient = (id) => {
    const r = one('SELECT * FROM clients WHERE id = ?', id);
    if (!r) throw new Refused(404, 'There is no such client.');
    return r;
  };
  const getService = (clientId, id) => {
    const r = one('SELECT * FROM services WHERE id = ? AND client_id = ?', id, clientId);
    if (!r) throw new Refused(404, 'There is no such service.');
    return r;
  };
  const totalsOf = (clientId) => {
    const charged = one('SELECT COALESCE(SUM(amount_cents), 0) AS c FROM charges WHERE client_id = ?', clientId).c;
    const paid = one('SELECT COALESCE(SUM(amount_cents), 0) AS c FROM payments WHERE client_id = ?', clientId).c;
    return { chargedCents: charged, paidCents: paid, balanceCents: charged - paid };
  };

  function list() {
    const t = today();
    const clients = rows(`
      SELECT c.*,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM charges WHERE client_id = c.id) AS charged,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE client_id = c.id) AS paid,
        (SELECT MAX(date) FROM payments WHERE client_id = c.id) AS last_payment
      FROM clients c ORDER BY c.name COLLATE NOCASE`);
    const services = rows("SELECT * FROM services WHERE status = 'active' ORDER BY expires_on IS NULL, expires_on");
    const byClient = new Map();
    for (const s of services) byClient.set(s.client_id, [...(byClient.get(s.client_id) ?? []), s]);
    const out = clients.map((c) => {
      const own = byClient.get(c.id) ?? [];
      const next = own.find((s) => s.expires_on);
      return {
        ...clientOut(c),
        domains: [...new Set(own.map((s) => s.domain).filter(Boolean))],
        activeServices: own.length,
        nextExpiry: next ? { serviceId: next.id, description: next.description, domain: next.domain, date: next.expires_on, days: rules.daysUntil(next.expires_on, t) } : null,
        chargedCents: c.charged,
        paidCents: c.paid,
        balanceCents: c.charged - c.paid,
        lastPayment: c.last_payment,
      };
    });
    const names = new Map(clients.map((c) => [c.id, c.name]));
    const expiring = services
      .filter((s) => s.expires_on)
      .map((s) => ({ ...serviceOut(s), clientName: names.get(s.client_id), days: rules.daysUntil(s.expires_on, t) }))
      .filter((s) => s.days <= 60);
    return {
      today: t,
      clients: out,
      overview: {
        outstandingCents: out.reduce((n, c) => n + Math.max(0, c.balanceCents), 0),
        creditCents: out.reduce((n, c) => n + Math.max(0, -c.balanceCents), 0),
        clientsOwing: out.filter((c) => c.balanceCents > 0).length,
        expired: expiring.filter((s) => s.days < 0),
        expiringSoon: expiring.filter((s) => s.days >= 0),
        paidLast30Cents: one('SELECT COALESCE(SUM(amount_cents), 0) AS c FROM payments WHERE date > ?', addDays(t, -30)).c,
      },
    };
  }

  function get(id) {
    const c = getClient(id);
    const t = today();
    return {
      today: t,
      client: clientOut(c),
      services: rows('SELECT * FROM services WHERE client_id = ? ORDER BY status, expires_on IS NULL, expires_on, id', id).map((s) => ({ ...serviceOut(s), days: s.expires_on ? rules.daysUntil(s.expires_on, t) : null })),
      charges: rows('SELECT * FROM charges WHERE client_id = ? ORDER BY date, id', id).map(chargeOut),
      payments: rows('SELECT * FROM payments WHERE client_id = ? ORDER BY date, id', id).map(paymentOut),
      totals: totalsOf(id),
    };
  }

  function createClient(input) {
    const v = rules.validateClient(input);
    if (!v.ok) throw invalid(v.errors);
    const c = v.value;
    const at = now();
    sql.exec('INSERT INTO clients (name, company, email, phone, vat_number, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', c.name, c.company, c.email, c.phone, c.vatNumber, c.notes, at, at);
    return get(lastId());
  }
  function updateClient(id, input) {
    getClient(id);
    const v = rules.validateClient(input);
    if (!v.ok) throw invalid(v.errors);
    const c = v.value;
    sql.exec('UPDATE clients SET name = ?, company = ?, email = ?, phone = ?, vat_number = ?, notes = ?, updated_at = ? WHERE id = ?', c.name, c.company, c.email, c.phone, c.vatNumber, c.notes, now(), id);
    return get(id);
  }
  function deleteClient(id) {
    getClient(id);
    const used = one('SELECT (SELECT COUNT(*) FROM charges WHERE client_id = ?) + (SELECT COUNT(*) FROM payments WHERE client_id = ?) AS n', id, id).n;
    if (used) throw new Refused(409, 'This client has charges or payments, so it is kept for your records. Delete those first if they were entered by mistake.');
    sql.exec('DELETE FROM services WHERE client_id = ?', id);
    sql.exec('DELETE FROM clients WHERE id = ?', id);
    return { deleted: true };
  }

  function addCharge(clientId, serviceId, date, description, cents) {
    sql.exec('INSERT INTO charges (client_id, service_id, date, description, amount_cents, created_at) VALUES (?, ?, ?, ?, ?, ?)', clientId, serviceId, date, description, cents, now());
  }
  const periodText = (s, from, to) => `${s.description}${s.domain ? ` (${s.domain})` : ''}${from && to ? `, ${from} to ${to}` : ''}`;

  function createService(clientId, input) {
    getClient(clientId);
    const v = rules.validateService(input);
    if (!v.ok) throw invalid(v.errors);
    const s = v.value;
    const at = now();
    sql.exec('INSERT INTO services (client_id, domain, description, period, price_cents, start_date, expires_on, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', clientId, s.domain, s.description, s.period, s.priceCents, s.startDate, s.expiresOn, s.status, s.notes, at, at);
    const id = lastId();
    // Usually the first period is owed at once: charged on the start date, unless the owner says otherwise.
    if (input?.chargeNow !== false) addCharge(clientId, id, s.startDate, periodText(s, s.period === 'one-off' ? null : s.startDate, s.expiresOn), s.priceCents);
    return get(clientId);
  }
  function updateService(clientId, id, input) {
    getService(clientId, id);
    const v = rules.validateService(input);
    if (!v.ok) throw invalid(v.errors);
    const s = v.value;
    sql.exec('UPDATE services SET domain = ?, description = ?, period = ?, price_cents = ?, start_date = ?, expires_on = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?', s.domain, s.description, s.period, s.priceCents, s.startDate, s.expiresOn, s.status, s.notes, now(), id);
    return get(clientId);
  }
  /** Renewal: the expiry moves one period on (from the old expiry, so no days are lost or gained) and the price is charged. */
  function renewService(clientId, id, input) {
    const s = getService(clientId, id);
    const months = rules.PERIOD_MONTHS[s.period];
    if (!months) throw new Refused(409, 'A one-off service is not renewed. Add a charge instead.');
    if (s.status !== 'active') throw new Refused(409, 'This service is cancelled. Make it active again before renewing it.');
    if (!s.expires_on) throw new Refused(409, 'This service has no expiry date. Set one first.');
    const errors = {};
    const date = input?.date === undefined ? today() : rules.isDate(input.date) ? input.date : (errors.date = 'Choose a date.', null);
    let cents = s.price_cents;
    if (input?.price !== undefined && input.price !== '') { cents = rules.parseAmount(input.price); if (cents === null) errors.price = 'Enter an amount in euro, more than 0.'; }
    if (Object.keys(errors).length) throw invalid(errors);
    const next = rules.addMonths(s.expires_on, months);
    sql.exec('UPDATE services SET expires_on = ?, price_cents = ?, updated_at = ? WHERE id = ?', next, cents, now(), id);
    addCharge(clientId, id, date, periodText({ description: s.description, domain: s.domain }, s.expires_on, next), cents);
    return get(clientId);
  }
  function deleteService(clientId, id) {
    getService(clientId, id);
    if (one('SELECT COUNT(*) AS n FROM charges WHERE service_id = ?', id).n) throw new Refused(409, 'Charges refer to this service, so it is kept for your records. Mark it cancelled instead.');
    sql.exec('DELETE FROM services WHERE id = ?', id);
    return get(clientId);
  }

  function createCharge(clientId, input) {
    getClient(clientId);
    const v = rules.validateCharge(input);
    if (!v.ok) throw invalid(v.errors);
    if (v.value.serviceId) getService(clientId, v.value.serviceId);
    addCharge(clientId, v.value.serviceId, v.value.date, v.value.description, v.value.amountCents);
    return get(clientId);
  }
  function deleteCharge(clientId, id) {
    getClient(clientId);
    if (!one('SELECT id FROM charges WHERE id = ? AND client_id = ?', id, clientId)) throw new Refused(404, 'There is no such charge.');
    sql.exec('DELETE FROM charges WHERE id = ?', id);
    return get(clientId);
  }
  function createPayment(clientId, input) {
    getClient(clientId);
    const v = rules.validatePayment(input);
    if (!v.ok) throw invalid(v.errors);
    const p = v.value;
    sql.exec('INSERT INTO payments (client_id, date, amount_cents, method, note, created_at) VALUES (?, ?, ?, ?, ?, ?)', clientId, p.date, p.amountCents, p.method, p.note, now());
    return get(clientId);
  }
  function deletePayment(clientId, id) {
    getClient(clientId);
    if (!one('SELECT id FROM payments WHERE id = ? AND client_id = ?', id, clientId)) throw new Refused(404, 'There is no such payment.');
    sql.exec('DELETE FROM payments WHERE id = ?', id);
    return get(clientId);
  }

  /** Every client, service, charge and payment as one CSV (UTF-8 with BOM, so spreadsheet programs read Greek). */
  function exportCsv() {
    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      // A leading = + - @ would be run as a formula by a spreadsheet: quote it as text.
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const euro = (c) => (c / 100).toFixed(2);
    const lines = [['record', 'client', 'company', 'email', 'phone', 'vat_number', 'date', 'description', 'domain', 'period', 'expires_on', 'status', 'amount_eur', 'method', 'balance_eur'].join(',')];
    const names = new Map();
    for (const c of rows('SELECT * FROM clients ORDER BY name COLLATE NOCASE')) {
      names.set(c.id, c.name);
      const t = totalsOf(c.id);
      lines.push(['client', c.name, c.company, c.email, c.phone, c.vat_number, c.created_at.slice(0, 10), c.notes, '', '', '', '', '', '', euro(t.balanceCents)].map(cell).join(','));
    }
    for (const s of rows('SELECT * FROM services ORDER BY client_id, id')) lines.push(['service', names.get(s.client_id), '', '', '', '', s.start_date, s.description, s.domain, s.period, s.expires_on, s.status, euro(s.price_cents), '', ''].map(cell).join(','));
    for (const c of rows('SELECT * FROM charges ORDER BY date, id')) lines.push(['charge', names.get(c.client_id), '', '', '', '', c.date, c.description, '', '', '', '', euro(c.amount_cents), '', ''].map(cell).join(','));
    for (const p of rows('SELECT * FROM payments ORDER BY date, id')) lines.push(['payment', names.get(p.client_id), '', '', '', '', p.date, p.note, '', '', '', '', euro(p.amount_cents), p.method, ''].map(cell).join(','));
    return `\uFEFF${lines.join('\r\n')}\r\n`;
  }

  return { list, get, createClient, updateClient, deleteClient, createService, updateService, renewService, deleteService, createCharge, deleteCharge, createPayment, deletePayment, exportCsv };
}

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The routes above, as operations on the ledger: { op, args } or null when the route does not exist. */
function route(method, parts) {
  const [, a, b, c, d] = parts; // parts[0] === 'clients'
  const id = (s) => (/^[1-9]\d{0,9}$/.test(s ?? '') ? Number(s) : null);
  if (parts.length === 1) return method === 'GET' ? { op: 'list', args: [] } : method === 'POST' ? { op: 'createClient', args: ['body'] } : 'method';
  if (parts.length === 2 && a === 'export.csv') return method === 'GET' ? { op: 'exportCsv', args: [] } : 'method';
  const cid = id(a);
  if (!cid) return null;
  if (parts.length === 2) return method === 'GET' ? { op: 'get', args: [cid] } : method === 'POST' ? { op: 'updateClient', args: [cid, 'body'] } : 'method';
  if (method !== 'POST') return 'method';
  if (parts.length === 3 && b === 'delete') return { op: 'deleteClient', args: [cid] };
  const kinds = { services: 'Service', charges: 'Charge', payments: 'Payment' };
  if (!Object.hasOwn(kinds, b)) return null;
  if (parts.length === 3) return { op: `create${kinds[b]}`, args: [cid, 'body'] };
  const sub = id(c);
  if (!sub) return null;
  if (parts.length === 4 && b === 'services') return { op: 'updateService', args: [cid, sub, 'body'] };
  if (parts.length === 5 && d === 'delete') return { op: `delete${kinds[b]}`, args: [cid, sub] };
  if (parts.length === 5 && d === 'renew' && b === 'services') return { op: 'renewService', args: [cid, sub, 'body'] };
  return null;
}
const WRITES = new Set(['createClient', 'updateClient', 'deleteClient', 'createService', 'updateService', 'renewService', 'deleteService', 'createCharge', 'deleteCharge', 'createPayment', 'deletePayment']);

/** The Durable Object that holds the ledger. One instance ("clients") for the whole admin. */
export class ClientBook {
  constructor(state, env, options) {
    this.storage = state.storage;
    this.book = ledger(state.storage.sql, options);
  }
  async fetch(request) {
    const { op, args } = await request.json().catch(() => ({}));
    if (typeof op !== 'string' || !Object.hasOwn(this.book, op) || !Array.isArray(args)) return Response.json({ error: { message: 'Bad request.' } }, { status: 400 });
    try {
      // A write either happens completely or not at all.
      const result = WRITES.has(op) ? this.storage.transactionSync(() => this.book[op](...args)) : this.book[op](...args);
      return op === 'exportCsv' ? new Response(result, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } }) : Response.json(result);
    } catch (err) {
      if (err instanceof Refused) return Response.json({ error: { message: err.message, ...(err.fields ? { fields: err.fields } : {}) } }, { status: err.status });
      console.error('client book error:', err?.name ?? 'Error');
      return Response.json({ error: { message: 'Something went wrong. Nothing was saved.' } }, { status: 500 });
    }
  }
}

/** /api/clients…, after the API's sign-in and same-origin checks (api.js). */
export async function handleClients(request, env, parts) {
  const json = (status, data) => Response.json(data, { status });
  if (!env.CLIENT_BOOK) return json(503, { error: { message: 'The clients database is not set up for this admin (the CLIENT_BOOK binding is missing).' } });
  const r = route(request.method, parts);
  if (r === 'method') return json(405, { error: { message: 'Method not allowed.' } });
  if (!r) return json(404, { error: { message: 'Not found.' } });
  let body;
  if (r.args.includes('body')) {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json(413, { error: { message: 'Too much text.' } });
    try { body = JSON.parse(raw); } catch { return json(400, { error: { message: 'The request is not valid JSON.' } }); }
  }
  const stub = env.CLIENT_BOOK.get(env.CLIENT_BOOK.idFromName('clients'));
  const res = await stub.fetch('https://client-book/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: r.op, args: r.args.map((x) => (x === 'body' ? body : x)) }) });
  if (r.op !== 'exportCsv' || !res.ok) return new Response(res.body, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' } });
  return new Response(res.body, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="techpi-clients-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
