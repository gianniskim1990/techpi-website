/**
 * Clients and billing (Task C1): the owner's own record of clients, their domains and subscriptions, what they were
 * charged and what they paid. Private business data: it is kept in the admin Worker's own SQLite database
 * (worker/clients.js), never in the public GitHub repository, and is never published.
 *
 *   client        name (required), company, email, phone, VAT number (ΑΦΜ), notes
 *   service       a subscription or one-off job for a client: domain, description, billing period, price, start date,
 *                 expiry date (when it must be renewed), active or cancelled
 *   charge        an amount the client owes, with its date and description (optionally for one service)
 *   payment       an amount the client paid, with its date and method
 *
 * Balance = charges − payments. Money is kept in cents (whole numbers), in euro. Dates are YYYY-MM-DD.
 * These checks are shared by the Worker (which enforces them) and the admin app (which shows the messages).
 */
export const PERIODS = { monthly: 'Monthly', quarterly: 'Every 3 months', yearly: 'Yearly', biennial: 'Every 2 years', 'one-off': 'One-off' };
export const PERIOD_MONTHS = { monthly: 1, quarterly: 3, yearly: 12, biennial: 24, 'one-off': 0 };
export const METHODS = { bank: 'Bank transfer', card: 'Card', cash: 'Cash', other: 'Other' };
export const STATUSES = ['active', 'cancelled'];
export const MAX_CENTS = 100_000_000; // € 1,000,000.00 for one amount
const BAD = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/;
const LINE = /[\r\n]/;

/** "1.234,50", "1234.5", "€ 80" → cents; null when not a positive amount with at most two decimals. */
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input * 100) : null;
  if (typeof input !== 'string') return null;
  let s = input.replace(/[€\s]/g, '');
  if (!s) return null;
  // The last , or . followed by one or two digits is the decimal mark; other separators group thousands.
  const m = s.match(/^(.*?)(?:[.,](\d{1,2}))?$/);
  const whole = m[1].replace(/[.,](?=\d{3}(?:[.,]|$))/g, '');
  if (!/^\d+$/.test(whole)) return null;
  const cents = Number(whole) * 100 + (m[2] ? Number(m[2].padEnd(2, '0')) : 0);
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}
export const formatCents = (cents) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);

export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/** A date `months` later, clamped to the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date, months) {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

function text(value, { max, required = false, multiline = false }, errors, key) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) { if (required) errors[key] = 'Required.'; return null; }
  if (BAD.test(v) || (!multiline && LINE.test(v))) { errors[key] = multiline ? 'Plain text only: no < > characters.' : 'One line of plain text: no line breaks or < > characters.'; return null; }
  if (v.length > max) { errors[key] = `At most ${max} characters (now ${v.length}).`; return null; }
  return v;
}
function date(value, errors, key, required = true) {
  if ((value === undefined || value === null || value === '') && !required) return null;
  if (!isDate(value)) { errors[key] = 'Choose a date.'; return null; }
  return value;
}
function amount(value, errors, key) {
  const c = parseAmount(value);
  if (c === null) errors[key] = 'Enter an amount in euro, more than 0 (for example 120 or 120,50).';
  return c;
}
const done = (errors, value) => (Object.keys(errors).length ? { ok: false, errors } : { ok: true, value });
const object = (input) => (input && typeof input === 'object' && !Array.isArray(input) ? input : {});

export function validateClient(input) {
  const i = object(input);
  const errors = {};
  const email = text(i.email, { max: 200 }, errors, 'email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Not a valid email address.';
  const vat = text(i.vatNumber, { max: 20 }, errors, 'vatNumber');
  return done(errors, {
    name: text(i.name, { max: 120, required: true }, errors, 'name'),
    company: text(i.company, { max: 160 }, errors, 'company'),
    email,
    phone: text(i.phone, { max: 40 }, errors, 'phone'),
    vatNumber: vat,
    notes: text(i.notes, { max: 4000, multiline: true }, errors, 'notes'),
  });
}

/** A domain name, without scheme or path: "example.gr", "www.example.com.cy". Lower-cased. */
export function normalizeDomain(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
}
const DOMAIN = /^(?=.{3,253}$)(?:[a-z0-9à-῿](?:[a-z0-9à-῿-]{0,61}[a-z0-9à-῿])?\.)+[a-zà-῿]{2,63}$/;

export function validateService(input) {
  const i = object(input);
  const errors = {};
  const domain = normalizeDomain(i.domain);
  if (domain && !DOMAIN.test(domain)) errors.domain = 'Not a domain name (for example example.gr).';
  const period = Object.hasOwn(PERIODS, i.period) ? i.period : null;
  if (!period) errors.period = 'Choose how often it is billed.';
  const startDate = date(i.startDate, errors, 'startDate');
  // A subscription must say when it runs out; a one-off job may not have an end.
  const expiresOn = date(i.expiresOn, errors, 'expiresOn', period !== 'one-off');
  if (startDate && expiresOn && expiresOn < startDate) errors.expiresOn = 'The expiry date is before the start date.';
  const status = i.status === undefined ? 'active' : STATUSES.includes(i.status) ? i.status : null;
  if (!status) errors.status = 'Not valid.';
  return done(errors, {
    domain: domain || null,
    description: text(i.description, { max: 200, required: true }, errors, 'description'),
    period,
    priceCents: amount(i.price, errors, 'price'),
    startDate,
    expiresOn,
    status,
    notes: text(i.notes, { max: 2000, multiline: true }, errors, 'notes'),
  });
}

export function validateCharge(input) {
  const i = object(input);
  const errors = {};
  return done(errors, {
    date: date(i.date, errors, 'date'),
    description: text(i.description, { max: 200, required: true }, errors, 'description'),
    amountCents: amount(i.amount, errors, 'amount'),
    serviceId: Number.isInteger(i.serviceId) && i.serviceId > 0 ? i.serviceId : null,
  });
}

export function validatePayment(input) {
  const i = object(input);
  const errors = {};
  const method = Object.hasOwn(METHODS, i.method) ? i.method : null;
  if (!method) errors.method = 'Choose how it was paid.';
  return done(errors, {
    date: date(i.date, errors, 'date'),
    amountCents: amount(i.amount, errors, 'amount'),
    method,
    note: text(i.note, { max: 300 }, errors, 'note'),
  });
}

/** Days from `today` to `date` (negative when past). */
export const daysUntil = (date, today) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
