/**
 * The contact form endpoint: /api/contact. The only server code of the public website (docs/production/contact-form.md).
 *
 *   GET  /api/contact  The public form configuration: the Turnstile site key, or 503 when the form is not configured.
 *   POST /api/contact  One enquiry, as JSON. It is checked in this order, and stops at the first failure:
 *     1. same origin: Origin must equal this site's origin, and Sec-Fetch-Site (when sent) must be same-origin; JSON only
 *     2. size: at most MAX_BODY bytes, whatever Content-Length claims
 *     3. configuration: every secret and the rate-limit binding present (fail closed, 503)
 *     4. rate limit per client IP (Workers Rate Limiting binding, required; if it fails, 503, never a bypass)
 *     5. the fields: types, lengths, allowed values, no control characters in single-line fields, and the honeypot
 *     6. Cloudflare Turnstile, verified server-side (action and hostname included)
 *     7. delivery through Resend, to the fixed RECIPIENT, with Reply-To set to the visitor's validated address
 *   Only a 2xx answer from Resend with a message id is reported to the visitor as sent.
 *
 * The recipient is a constant: no request can choose it. Secrets come only from the Worker's environment (Cloudflare
 * secrets). Nothing personal is logged: failures log a fixed code and, for providers, the HTTP status only.
 */

export const RECIPIENT = 'info@techpi.eu';
export const MAX_BODY = 16 * 1024;
export const LIMITS = { name: 100, email: 254, organisation: 150, message: 5000, token: 2048 };
export const TIMEFRAMES = ['', 'asap', '1-3-months', '3-6-months', 'later'];
const LOCALES = ['en', 'el'];

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_SEND = 'https://api.resend.com/emails';
const TURNSTILE_ACTION = 'contact';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

/** A JSON answer. `error` is a fixed code the page translates; it never echoes input. */
const json = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
const fail = (status, error, extra) => json(status, { ok: false, error, ...extra });

// The sender must be an address on techpi.eu or one of its subdomains (the domain verified in Resend), optionally with a
// display name: "TechPi website <website@notify.techpi.eu>".
const FROM = /^(?:[^<>\r\n"]{1,80} )?<?[a-z0-9._%+-]{1,64}@(?:[a-z0-9-]{1,63}\.)*techpi\.eu>?$/i;

/**
 * The complete configuration, or null when anything is missing: the form then fails closed. The rate-limit binding
 * (wrangler.jsonc, CONTACT_RATE_LIMITER) is part of it: without it the form is unavailable, never unlimited.
 */
export function contactConfig(env) {
  const from = typeof env.CONTACT_FROM === 'string' ? env.CONTACT_FROM.trim() : '';
  const limiter = env.CONTACT_RATE_LIMITER;
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY || !FROM.test(from)) return null;
  if (!limiter || typeof limiter.limit !== 'function') return null;
  return { from, limiter, resendKey: env.RESEND_API_KEY, turnstileSecret: env.TURNSTILE_SECRET_KEY, siteKey: env.TURNSTILE_SITE_KEY };
}

/**
 * The GET/HEAD response contains only a public Turnstile site key. It must also work when opened directly in the
 * browser (Sec-Fetch-Site: none) or via a link from another site (cross-site).
 * Sending a message (POST) stays strictly same-origin: Origin must match and Fetch Metadata must not be cross-site.
 */
function crossOrigin(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return false;
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return true;
  return request.headers.get('Origin') !== new URL(request.url).origin;
}

/** Reads at most `limit` bytes of the body; null when it is longer. */
async function readBody(request, limit) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

// Single-line fields may contain no control character at all (this is what keeps them out of mail headers); the
// message may contain line breaks and tabs, and nothing else below U+0020.
const LINE_BREAKERS = /[\u0000-\u001f\u007f-\u009f\u{2028}\u{2029}]/u;
const MESSAGE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u{2028}\u{2029}]/u;
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const chars = (s) => [...s].length;

/**
 * Validates the parsed body. Returns { fields } with the names of the invalid fields, or { value } with clean values.
 * `bot` is set when the honeypot is filled.
 */
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { fields: ['form'] };
  const str = (k) => (typeof body[k] === 'string' ? body[k].normalize('NFC').trim() : body[k] === undefined ? '' : null);
  const name = str('name');
  const email = str('email');
  const organisation = str('organisation');
  const message = str('message');
  const timeframe = str('timeframe');
  const locale = str('locale');
  const token = str('token');
  const website = str('website');
  const fields = [];
  if (name === null || !name || chars(name) > LIMITS.name || LINE_BREAKERS.test(name)) fields.push('name');
  if (email === null || !email || email.length > LIMITS.email || !EMAIL.test(email)) fields.push('email');
  if (organisation === null || chars(organisation) > LIMITS.organisation || LINE_BREAKERS.test(organisation)) fields.push('organisation');
  const text = message === null ? null : message.replace(/\r\n?/g, '\n');
  if (text === null || !text || chars(text) > LIMITS.message || MESSAGE_CONTROLS.test(text)) fields.push('message');
  if (timeframe === null || !TIMEFRAMES.includes(timeframe)) fields.push('timeframe');
  if (locale === null || (locale && !LOCALES.includes(locale))) fields.push('locale');
  if (token === null || !token || token.length > LIMITS.token) fields.push('token');
  if (fields.length) return { fields };
  return { value: { name, email, organisation, message: text, timeframe, locale: locale || 'en', token }, bot: Boolean(website) };
}

/** Cloudflare Turnstile, server-side. True only for a fresh, successful token for this action and this hostname. */
async function verifyTurnstile(token, cfg, request) {
  const form = new URLSearchParams({ secret: cfg.turnstileSecret, response: token, idempotency_key: crypto.randomUUID() });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.set('remoteip', ip);
  const res = await fetch(TURNSTILE_VERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`turnstile status ${res.status}`);
  const out = await res.json();
  return out.success === true && out.action === TURNSTILE_ACTION && out.hostname === new URL(request.url).hostname;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const TIMEFRAME_TEXT = { '': 'Not decided', asap: 'As soon as possible', '1-3-months': 'In 1–3 months', '3-6-months': 'In 3–6 months', later: 'Later' };
const LOCALE_TEXT = { en: 'English (/contact)', el: 'Greek (/el/contact)' };

/** The email TechPi receives. Every value is escaped for HTML; the subject is built from a single-line, checked name. */
export function composeEmail(v, from) {
  const subject = `Website enquiry: ${[...v.name].slice(0, 80).join('')}`;
  const rows = [
    ['Name', v.name],
    ['Email', v.email],
    ['Organisation', v.organisation || '(not given)'],
    ['Timeframe', TIMEFRAME_TEXT[v.timeframe]],
    ['Form', LOCALE_TEXT[v.locale]],
  ];
  const text = [
    'New enquiry from the contact form on techpi.eu.',
    '',
    ...rows.map(([k, val]) => `${k}: ${val}`),
    '',
    'Message:',
    v.message,
    '',
    'Reply to this email to answer the sender directly.',
  ].join('\n');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#080e1e">
<p>New enquiry from the contact form on techpi.eu.</p>
<table cellpadding="4" cellspacing="0" style="border-collapse:collapse">${rows
    .map(([k, val]) => `<tr><td style="color:#5e6672;vertical-align:top">${esc(k)}</td><td>${esc(val)}</td></tr>`)
    .join('')}</table>
<p style="color:#5e6672;margin-bottom:4px">Message</p>
<div style="white-space:pre-wrap">${esc(v.message)}</div>
<p style="color:#5e6672">Reply to this email to answer the sender directly.</p>
</body></html>`;
  return { from, to: [RECIPIENT], reply_to: v.email, subject, text, html };
}

/** Sends through Resend. True only when Resend accepted the message (2xx with an id). */
async function send(payload, cfg) {
  const res = await fetch(RESEND_SEND, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error(`contact: resend status ${res.status}`);
    return false;
  }
  const out = await res.json().catch(() => null);
  return Boolean(out && typeof out.id === 'string' && out.id);
}

export async function handleContact(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') {
    return json(405, { ok: false, error: 'method' }, { Allow: 'GET, HEAD, POST' });
  }
  if (crossOrigin(request)) return fail(403, 'forbidden');
  const cfg = contactConfig(env);

  if (request.method !== 'POST') return cfg ? json(200, { ok: true, siteKey: cfg.siteKey }) : fail(503, 'unavailable');

  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return fail(415, 'invalid');
  const raw = await readBody(request, MAX_BODY);
  if (raw === null) return fail(413, 'too_large');
  if (!cfg) {
    console.error('contact: not configured');
    return fail(503, 'unavailable');
  }

  // The rate limit is required: contactConfig() refuses a missing binding, and a limiter that fails or answers anything
  // but { success: true } stops the request. Nothing is ever sent without it.
  let limited;
  try {
    limited = await cfg.limiter.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
  } catch {
    console.error('contact: rate limiter unavailable');
    return fail(503, 'unavailable');
  }
  if (!limited || limited.success !== true) return fail(429, 'rate_limited');

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'invalid', { fields: ['form'] });
  }
  const checked = validate(body);
  if (checked.fields) {
    // A missing or malformed Turnstile token is a failed check, not a field the visitor can correct.
    const fields = checked.fields.filter((f) => f !== 'token');
    return fields.length ? fail(400, 'invalid', { fields }) : fail(403, 'verification_failed');
  }
  // The honeypot is invisible to people and skipped by keyboards. A filled one is refused, never reported as sent.
  if (checked.bot) return fail(400, 'rejected');

  try {
    if (!(await verifyTurnstile(checked.value.token, cfg, request))) return fail(403, 'verification_failed');
  } catch {
    console.error('contact: turnstile unavailable');
    return fail(502, 'send_failed');
  }

  try {
    if (!(await send(composeEmail(checked.value, cfg.from), cfg))) return fail(502, 'send_failed');
  } catch {
    console.error('contact: resend unavailable');
    return fail(502, 'send_failed');
  }
  return json(200, { ok: true });
}
