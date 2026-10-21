// Unit tests for the admin Worker's server-side authorisation (GitHub sign-in sessions, Task AUTH-G1). Run: npm test.
// Uses only test values; no real credentials. The OAuth flow itself is tested in oauth.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { seal, SESSION_COOKIE } from '../worker/session.js';

const env = (over = {}) => ({
  ...authEnv,
  ASSETS: { fetch: async () => new Response('<!doctype html>admin app', { status: 200, headers: { 'Content-Type': 'text/html' } }) },
  ...over,
});
const req = (path = '/', { method = 'GET', cookie } = {}) => new Request(`https://admin.example.test${path}`, { method, headers: cookie ? { Cookie: cookie } : {} });
const owner = () => sessionCookie(ctxFor());
const now = () => Math.floor(Date.now() / 1000);

test('the signed-in owner gets the app and its static files, with security headers', async () => {
  for (const path of ['/', '/case-studies/rocketeer', '/assets/index-abc.js']) {
    const res = await worker.fetch(req(path, { cookie: await owner() }), env());
    assert.equal(res.status, 200, path);
    assert.match(await res.text(), /admin app/);
    assert.match(res.headers.get('Content-Security-Policy'), /script-src 'self'/);
    assert.match(res.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
  }
});

test('without a session, pages get the sign-in page and static files get 401; the app is never served', async () => {
  let reached = false;
  const e = env({ ASSETS: { fetch: async () => { reached = true; return new Response('admin app'); } } });
  for (const path of ['/', '/case-studies', '/insights/x', '/index.html']) {
    const res = await worker.fetch(req(path), e);
    assert.equal(res.status, 401, path);
    const body = await res.text();
    assert.doesNotMatch(body, /admin app/);
    if (path.endsWith('.html')) continue;
    assert.match(body, /Sign in with GitHub/);
    assert.match(body, /href="\/auth\/login"/);
    assert.doesNotMatch(body, /<script/i, 'the sign-in page runs no script');
  }
  for (const path of ['/assets/index-abc.js', '/assets/index-abc.css', '/favicon.svg']) {
    const res = await worker.fetch(req(path), e);
    assert.equal(res.status, 401, path);
    assert.doesNotMatch(res.headers.get('Content-Type'), /html/);
  }
  assert.equal(reached, false, 'nothing reached the static assets');
});

test('expired, tampered, forged, other-purpose and other-account sessions are refused', async () => {
  const t = now();
  const good = (await owner()).split('=')[1];
  const [payload, sig] = good.split('.');
  const flip = (s) => s.slice(0, -2) + (s.at(-2) === 'A' ? 'B' : 'A') + s.at(-1);
  const bad = {
    expired: await seal(SESSION_SECRET, 'session', { sid: 's', uid: authEnv.ADMIN_GITHUB_USER_ID, login: 'x' }, 60, t - 120),
    'issued in the future': await seal(SESSION_SECRET, 'session', { sid: 's', uid: authEnv.ADMIN_GITHUB_USER_ID, login: 'x' }, 60, t + 3600),
    'tampered payload': `${flip(payload)}.${sig}`,
    'tampered signature': `${payload}.${flip(sig)}`,
    'no signature': payload,
    forged: (await sessionCookie(ctxFor('owner', 'forged'))).split('=')[1],
    'another GitHub account': (await sessionCookie(ctxFor('intruder'))).split('=')[1],
    'an OAuth round-trip token': await seal(SESSION_SECRET, 'oauth', { sid: 's', uid: authEnv.ADMIN_GITHUB_USER_ID, state: 'x', verifier: 'y' }, 600),
    'no session id': await seal(SESSION_SECRET, 'session', { uid: authEnv.ADMIN_GITHUB_USER_ID }, 600),
    garbage: 'not-a-token',
  };
  for (const [name, token] of Object.entries(bad)) {
    for (const path of ['/', '/assets/index-abc.js']) {
      const res = await worker.fetch(req(path, { cookie: `${SESSION_COOKIE}=${token}` }), env());
      assert.equal(res.status, 401, `${name} ${path}`);
    }
  }
  // A cookie with a similar name is not the session cookie.
  assert.equal((await worker.fetch(req('/', { cookie: `techpi_session=${good}` }), env())).status, 401);
});

test('changing the session secret or the allowed user ID ends every session', async () => {
  const cookie = await owner();
  assert.equal((await worker.fetch(req('/', { cookie }), env())).status, 200);
  assert.equal((await worker.fetch(req('/', { cookie }), env({ SESSION_SECRET: 'a-rotated-session-key-0123456789abcdefABCDEF' }))).status, 401, 'rotated secret');
  assert.equal((await worker.fetch(req('/', { cookie }), env({ ADMIN_GITHUB_USER_ID: '99' }))).status, 401, 'another allowed user');
});

test('an incomplete sign-in configuration fails closed (503), even with a valid session, and before the sign-in flow', async () => {
  const cookie = await owner();
  for (const over of [
    { GITHUB_OAUTH_CLIENT_ID: '' }, { GITHUB_OAUTH_CLIENT_SECRET: '' }, { GITHUB_OAUTH_CLIENT_SECRET: 'short' },
    { ADMIN_GITHUB_USER_ID: '' }, { ADMIN_GITHUB_USER_ID: 'techpi-owner' }, { ADMIN_GITHUB_USER_ID: 'owner@example.test' }, { ADMIN_GITHUB_USER_ID: '0' },
    { SESSION_SECRET: '' }, { SESSION_SECRET: 'too-short-secret' }, { SESSION_SECRET: undefined },
  ]) {
    for (const path of ['/', '/api/session', '/auth/login']) {
      const res = await worker.fetch(req(path, { cookie }), env(over));
      assert.equal(res.status, 503, `${JSON.stringify(over)} ${path}`);
      assert.doesNotMatch(await res.text(), /admin app|GITHUB_OAUTH_CLIENT_SECRET=|mock-client-secret/);
    }
  }
});

test('write methods are refused even for the owner outside the API (writes exist only under /api, see api.test.mjs)', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const res = await worker.fetch(req('/', { method, cookie: await owner() }), env());
    assert.equal(res.status, 405, method);
  }
});

test('refusals carry the security headers and never reach the assets', async () => {
  let reached = false;
  const res = await worker.fetch(req('/'), env({ ASSETS: { fetch: async () => { reached = true; return new Response('x'); } } }));
  assert.equal(res.status, 401);
  assert.equal(reached, false);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.match(res.headers.get('Content-Security-Policy'), /default-src 'none'/);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});
