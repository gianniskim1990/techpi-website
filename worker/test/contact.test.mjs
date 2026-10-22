// Tests for the contact form endpoint (worker/contact.js). Run: npm test
// Every provider is mocked: no request leaves this process, and no email is sent.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import worker from '../index.js';
import { MAX_BODY, RECIPIENT } from '../contact.js';

const ORIGIN = 'https://techpi.eu';
const ENV = {
  RESEND_API_KEY: 're_test_key',
  TURNSTILE_SECRET_KEY: 'ts_secret',
  TURNSTILE_SITE_KEY: 'ts_site',
  CONTACT_FROM: 'TechPi website <website@notify.techpi.eu>',
  CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
const VALID = {
  name: 'Maria Papadopoulou',
  email: 'maria@example.gr',
  organisation: 'Example SA',
  message: 'We need a new booking system for our clinic.',
  timeframe: '1-3-months',
  locale: 'el',
  token: 'turnstile-token',
  website: '',
};

let calls;
let turnstile;
let resend;
let logs;
const realFetch = globalThis.fetch;
const realError = console.error;

beforeEach(() => {
  calls = [];
  logs = [];
  turnstile = () => Response.json({ success: true, action: 'contact', hostname: 'techpi.eu' });
  resend = () => Response.json({ id: 'email_123' });
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith('https://challenges.cloudflare.com/turnstile/v0/siteverify')) return turnstile(init);
    if (String(url) === 'https://api.resend.com/emails') return resend(init);
    throw new Error(`unexpected fetch ${url}`);
  };
  console.error = (...a) => logs.push(a.join(' '));
});
afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

function post(body, { headers = {}, env = ENV, raw } = {}) {
  const request = new Request(`${ORIGIN}/api/contact`, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body: raw ?? JSON.stringify(body),
  });
  return worker.fetch(request, env);
}
const read = async (res) => ({ status: res.status, body: await res.json(), headers: res.headers });
const resendCalls = () => calls.filter((c) => c.url === 'https://api.resend.com/emails');

describe('configuration', () => {
  it('GET returns the public site key only', async () => {
    const r = await read(await worker.fetch(new Request(`${ORIGIN}/api/contact`), ENV));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true, siteKey: 'ts_site' });
    assert.equal(r.headers.get('Cache-Control'), 'no-store');
    assert.ok(!JSON.stringify(r.body).includes('re_test_key') && !JSON.stringify(r.body).includes('ts_secret'));
  });
  for (const missing of ['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'TURNSTILE_SITE_KEY', 'CONTACT_FROM', 'CONTACT_RATE_LIMITER']) {
    it(`fails closed without ${missing}`, async () => {
      const env = { ...ENV, [missing]: undefined };
      assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/contact`), env)).status, 503);
      const r = await read(await post(VALID, { env }));
      assert.equal(r.status, 503);
      assert.equal(r.body.error, 'unavailable');
      assert.equal(calls.length, 0);
    });
  }
  it('refuses a sender outside techpi.eu', async () => {
    const env = { ...ENV, CONTACT_FROM: 'Someone <noreply@example.com>' };
    assert.equal((await post(VALID, { env })).status, 503);
  });
});

describe('request checks', () => {
  it('rejects another origin', async () => {
    const r = await read(await post(VALID, { headers: { Origin: 'https://evil.example' } }));
    assert.equal(r.status, 403);
    assert.equal(calls.length, 0);
  });
  it('rejects a missing Origin', async () => {
    const request = new Request(`${ORIGIN}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    assert.equal((await worker.fetch(request, ENV)).status, 403);
  });
  it('rejects a cross-site fetch even with a matching Origin', async () => {
    assert.equal((await post(VALID, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  });
  it('rejects a cross-site GET of the configuration', async () => {
    const request = new Request(`${ORIGIN}/api/contact`, { headers: { 'Sec-Fetch-Site': 'cross-site' } });
    assert.equal((await worker.fetch(request, ENV)).status, 403);
  });
  it('rejects a plain HTML form post (not JSON)', async () => {
    const r = await post(null, { raw: 'name=a&email=b', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    assert.equal(r.status, 415);
  });
  it('rejects a body larger than the limit (declared)', async () => {
    const big = JSON.stringify({ ...VALID, message: 'x'.repeat(MAX_BODY) });
    assert.equal((await post(null, { raw: big })).status, 413);
    assert.equal(calls.length, 0);
  });
  it('rejects a body larger than the limit (streamed, no length)', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(4096));
    let sent = 0;
    const stream = new ReadableStream({
      pull(c) {
        if (sent++ < 10) c.enqueue(chunk);
        else c.close();
      },
    });
    const request = new Request(`${ORIGIN}/api/contact`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    });
    assert.equal((await worker.fetch(request, ENV)).status, 413);
  });
  it('rejects other methods', async () => {
    const r = await worker.fetch(new Request(`${ORIGIN}/api/contact`, { method: 'PUT', headers: { Origin: ORIGIN } }), ENV);
    assert.equal(r.status, 405);
    assert.equal(r.headers.get('Allow'), 'GET, HEAD, POST');
  });
  it('answers 404 for any other /api path and serves static files otherwise', async () => {
    assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/other`), ENV)).status, 404);
    const env = { ...ENV, ASSETS: { fetch: async () => new Response('static') } };
    assert.equal(await (await worker.fetch(new Request(`${ORIGIN}/contact`), env)).text(), 'static');
  });
  it('applies the rate limit', async () => {
    const env = { ...ENV, CONTACT_RATE_LIMITER: { limit: async ({ key }) => ({ success: key !== '203.0.113.7' }) } };
    const r = await read(await post(VALID, { env }));
    assert.equal(r.status, 429);
    assert.equal(r.body.error, 'rate_limited');
    assert.equal(calls.length, 0);
  });
  it('keys the limit on the client IP', async () => {
    const keys = [];
    await post(VALID, { env: { ...ENV, CONTACT_RATE_LIMITER: { limit: async ({ key }) => (keys.push(key), { success: true }) } } });
    assert.deepEqual(keys, ['203.0.113.7']);
  });
});

describe('rate-limit binding: fails closed, never bypassed', () => {
  const noSend = async (env, status, error) => {
    const r = await read(await post(VALID, { env }));
    assert.equal(r.status, status);
    assert.equal(r.body.error, error);
    assert.equal(calls.length, 0, 'no Turnstile or Resend call');
  };
  it('a binding without a limit() method disables the form', async () => {
    const env = { ...ENV, CONTACT_RATE_LIMITER: {} };
    assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/contact`), env)).status, 503);
    await noSend(env, 503, 'unavailable');
  });
  it('a limiter that throws answers 503 and sends nothing', async () => {
    await noSend({ ...ENV, CONTACT_RATE_LIMITER: { limit: async () => { throw new Error('binding down'); } } }, 503, 'unavailable');
    assert.ok(logs.some((l) => l.includes('rate limiter unavailable')));
    assert.ok(!logs.join('\n').includes('203.0.113.7'), 'the IP is not logged');
  });
  it('a limiter that rejects synchronously answers 503', async () => {
    await noSend({ ...ENV, CONTACT_RATE_LIMITER: { limit: () => { throw new TypeError('not a function'); } } }, 503, 'unavailable');
  });
  for (const [label, answer] of [['undefined', undefined], ['an empty object', {}], ['success: "true" (a string)', { success: 'true' }]]) {
    it(`a limiter answering ${label} is treated as limited`, async () => {
      await noSend({ ...ENV, CONTACT_RATE_LIMITER: { limit: async () => answer } }, 429, 'rate_limited');
    });
  }
});

describe('validation', () => {
  const invalid = [
    ['empty name', { name: '  ' }, 'name'],
    ['name with a line break (header injection)', { name: 'Eve\r\nBcc: victim@example.com' }, 'name'],
    ['name too long', { name: 'a'.repeat(101) }, 'name'],
    ['malformed email', { email: 'not-an-email' }, 'email'],
    ['email with injected header', { email: 'eve@example.com\r\nBcc: victim@example.com' }, 'email'],
    ['email with two addresses', { email: 'a@example.com,b@example.com' }, 'email'],
    ['organisation with a control character', { organisation: 'Org\u0000' }, 'organisation'],
    ['message too short', { message: 'Hi' }, 'message'],
    ['message too long', { message: 'x'.repeat(5001) }, 'message'],
    ['unknown timeframe', { timeframe: 'yesterday' }, 'timeframe'],
    ['non-string field', { name: { $ne: 1 } }, 'name'],
  ];
  for (const [label, change, field] of invalid) {
    it(`rejects ${label}`, async () => {
      const r = await read(await post({ ...VALID, ...change }));
      assert.equal(r.status, 400);
      assert.equal(r.body.error, 'invalid');
      assert.ok(r.body.fields.includes(field), `fields: ${r.body.fields}`);
      assert.equal(calls.length, 0);
    });
  }
  it('rejects malformed JSON', async () => {
    assert.equal((await post(null, { raw: '{"name":' })).status, 400);
  });
  it('treats a missing Turnstile token as a failed check', async () => {
    const r = await read(await post({ ...VALID, token: '' }));
    assert.equal(r.status, 403);
    assert.equal(r.body.error, 'verification_failed');
  });
  it('refuses a filled honeypot without sending, and never reports success', async () => {
    const r = await read(await post({ ...VALID, website: 'https://spam.example' }));
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'rejected');
    assert.equal(calls.length, 0);
  });
});

describe('Turnstile', () => {
  it('rejects a failed token before any email', async () => {
    turnstile = () => Response.json({ success: false, 'error-codes': ['invalid-input-response'] });
    const r = await read(await post(VALID));
    assert.equal(r.status, 403);
    assert.equal(r.body.error, 'verification_failed');
    assert.equal(resendCalls().length, 0);
  });
  it('rejects a token for another action or hostname', async () => {
    turnstile = () => Response.json({ success: true, action: 'login', hostname: 'techpi.eu' });
    assert.equal((await post(VALID)).status, 403);
    turnstile = () => Response.json({ success: true, action: 'contact', hostname: 'evil.example' });
    assert.equal((await post(VALID)).status, 403);
    assert.equal(resendCalls().length, 0);
  });
  it('sends the secret, the token and the client IP to siteverify', async () => {
    await post(VALID);
    const form = new URLSearchParams(String(calls[0].init.body));
    assert.equal(form.get('secret'), 'ts_secret');
    assert.equal(form.get('response'), 'turnstile-token');
    assert.equal(form.get('remoteip'), '203.0.113.7');
  });
  it('reports a failure when siteverify is unreachable', async () => {
    turnstile = () => {
      throw new TypeError('network down');
    };
    const r = await read(await post(VALID));
    assert.equal(r.status, 502);
    assert.equal(r.body.ok, false);
    assert.equal(resendCalls().length, 0);
  });
});

describe('delivery', () => {
  it('sends to the fixed recipient with Reply-To set to the visitor, and reports success', async () => {
    const r = await read(await post({ ...VALID, to: 'attacker@example.com', recipient: 'attacker@example.com' }));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true });
    const [call] = resendCalls();
    assert.equal(call.init.headers.Authorization, 'Bearer re_test_key');
    const payload = JSON.parse(call.init.body);
    assert.deepEqual(payload.to, [RECIPIENT]);
    assert.equal(RECIPIENT, 'info@techpi.eu');
    assert.equal(payload.reply_to, 'maria@example.gr');
    assert.equal(payload.from, ENV.CONTACT_FROM);
    assert.equal(payload.subject, 'Website enquiry: Maria Papadopoulou');
    assert.ok(!JSON.stringify(payload).includes('attacker@example.com'));
    assert.match(payload.text, /Timeframe: In 1–3 months/);
    assert.match(payload.text, /Form: Greek/);
  });
  it('escapes HTML in the email', async () => {
    await post({ ...VALID, name: '<b>Eve</b>', message: '<script>alert(1)</script> & "quotes"' });
    const payload = JSON.parse(resendCalls()[0].init.body);
    assert.ok(!payload.html.includes('<script>') && !payload.html.includes('<b>Eve'));
    assert.ok(payload.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;'));
  });
  it('keeps line breaks in the message, normalised', async () => {
    await post({ ...VALID, message: 'First line\r\nSecond line\rThird line' });
    assert.match(JSON.parse(resendCalls()[0].init.body).text, /First line\nSecond line\nThird line/);
  });
  for (const [label, reply] of [
    ['a provider error', () => new Response('{"message":"invalid key"}', { status: 401 })],
    ['a server error', () => new Response('oops', { status: 500 })],
    ['an answer without a message id', () => Response.json({})],
    ['a network failure', () => {
      throw new TypeError('network down');
    }],
  ]) {
    it(`never reports success after ${label}`, async () => {
      resend = reply;
      const r = await read(await post(VALID));
      assert.equal(r.status, 502);
      assert.deepEqual(r.body, { ok: false, error: 'send_failed' });
    });
  }
  it('logs no personal data or credentials', async () => {
    resend = () => new Response('{"message":"bad"}', { status: 422 });
    await post(VALID);
    await post({ ...VALID, email: 'bad' });
    const all = logs.join('\n');
    for (const secret of [VALID.name, VALID.email, VALID.message, 're_test_key', 'ts_secret', '203.0.113.7']) assert.ok(!all.includes(secret), secret);
  });
});
