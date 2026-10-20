// Unit tests for the admin Worker's server-side authorisation. Run: npm test (in admin/).
// Uses only test identities on the reserved .test domain; no real credentials.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const AUD = 'test-aud-0001';
const ADMIN = 'admin@example.test';
const env = (over = {}) => ({
  ACCESS_AUD: AUD,
  ADMIN_EMAILS: ADMIN,
  ASSETS: { fetch: async () => new Response('<!doctype html>admin app', { status: 200, headers: { 'Content-Type': 'text/html' } }) },
  ...over,
});
const access = (email, aud = AUD) => ({ access: { aud, getIdentity: async () => (email === undefined ? undefined : { email }) } });
const get = (method = 'GET') => new Request('https://admin.example.test/', { method });

test('authorised administrator gets the app, with security headers', async () => {
  const res = await worker.fetch(get(), env(), access(ADMIN));
  assert.equal(res.status, 200);
  assert.match(await res.text(), /admin app/);
  assert.match(res.headers.get('Content-Security-Policy'), /script-src 'self'/);
  assert.match(res.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

test('email match is case-insensitive and trims the allowlist', async () => {
  const res = await worker.fetch(get(), env({ ADMIN_EMAILS: ' other@example.test , ADMIN@Example.TEST ' }), access('Admin@example.test'));
  assert.equal(res.status, 200);
});

test('no Cloudflare Access (ctx.access undefined) is refused', async () => {
  for (const ctx of [{}, undefined, { access: undefined }, { access: null }]) {
    const res = await worker.fetch(get(), env(), ctx);
    assert.equal(res.status, 403);
    assert.doesNotMatch(await res.text(), /admin app/);
  }
});

test('wrong Access audience is refused', async () => {
  const res = await worker.fetch(get(), env(), access(ADMIN, 'another-app'));
  assert.equal(res.status, 403);
});

test('a signed-in user who is not on the allowlist is refused', async () => {
  for (const email of ['intruder@example.test', 'admin@example.test.evil', '', undefined]) {
    const res = await worker.fetch(get(), env(), access(email));
    assert.equal(res.status, 403, `email ${email}`);
  }
});

test('identity lookup failure is refused', async () => {
  const ctx = { access: { aud: AUD, getIdentity: async () => { throw new Error('network'); } } };
  const res = await worker.fetch(get(), env(), ctx);
  assert.equal(res.status, 403);
});

test('unconfigured admin fails closed, even with a valid Access sign-in', async () => {
  for (const over of [{ ACCESS_AUD: '' }, { ADMIN_EMAILS: '' }, { ADMIN_EMAILS: ' , ' }, { ACCESS_AUD: undefined, ADMIN_EMAILS: undefined }]) {
    const res = await worker.fetch(get(), env(over), access(ADMIN));
    assert.equal(res.status, 503);
  }
});

test('write methods are refused even for the administrator outside the API (writes exist only under /api, see api.test.mjs)', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const res = await worker.fetch(get(method), env(), access(ADMIN));
    assert.equal(res.status, 405, method);
  }
});

test('refusals carry the security headers and never reach the assets', async () => {
  let reached = false;
  const res = await worker.fetch(get(), env({ ASSETS: { fetch: async () => { reached = true; return new Response('x'); } } }), {});
  assert.equal(res.status, 403);
  assert.equal(reached, false);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.match(res.headers.get('Content-Security-Policy'), /default-src 'none'/);
});
