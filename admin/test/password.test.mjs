// Email and password sign-in for the single administrator (Task AUTH-P1): the verifier, the form login, sessions, CSRF,
// the Durable Object rate limiter, misconfiguration, and that GitHub sign-in keeps working beside it. Test values only.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import worker from '../worker/index.js';
import {
  ADMIN_EMAIL, LIMITS, LoginLimiter, MAX_ITERATIONS, MIN_ITERATIONS, makeVerifier, parseVerifier, passwordConfig, verifyPassword,
} from '../worker/password.js';
import { seal, SESSION_COOKIE, SESSION_TTL } from '../worker/session.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyKeys, deployConfigProblems, parseArgs, weakness, withSecretsFile } from '../scripts/set-admin-password.mjs';
import { authEnv, SESSION_SECRET, sessionCookie, ctxFor } from './support/auth.mjs';
import { createMockGitHub } from './support/mock-github.mjs';

const ORIGIN = 'https://admin.example.test';
const PASSWORD = 'correct horse battery staple 42!';
// Low iterations keep the suite fast; the production default is MAX_ITERATIONS.
const VERIFIER = await makeVerifier(PASSWORD, MIN_ITERATIONS);
const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

/** An in-memory stand-in for the Durable Object namespace, running the real LoginLimiter class. */
function limiterBinding(clock) {
  const map = new Map();
  const storage = {
    get: async (k) => structuredClone(map.get(k)),
    put: async (k, v) => { if (typeof k === 'object') for (const [a, b] of Object.entries(k)) map.set(a, structuredClone(b)); else map.set(k, structuredClone(v)); },
    delete: async (k) => map.delete(k),
  };
  const instance = new LoginLimiter({ storage }, {}, clock);
  const names = [];
  return {
    map, names,
    idFromName: (n) => { names.push(n); return n; },
    get: () => ({ fetch: (url, init) => instance.fetch(new Request(url, init)) }),
  };
}

let now;
let gh;
const env = (over = {}) => ({
  ...authEnv, CONTENT_BASE_BRANCH: 'feat/x', ADMIN_PASSWORD_HASH: VERIFIER, LOGIN_LIMITER: limiterBinding(() => now),
  ASSETS: { fetch: async () => new Response('<!doctype html>admin app', { headers: { 'Content-Type': 'text/html' } }) },
  ...over,
});
beforeEach(() => {
  now = Date.UTC(2026, 9, 21, 12);
  gh = createMockGitHub({ publicKey });
  globalThis.fetch = gh.fetch;
});

const form = (fields) => new URLSearchParams(fields).toString();
function login(e, { email = ADMIN_EMAIL, password = PASSWORD, ip = '203.0.113.7', headers = {}, body } = {}) {
  return worker.fetch(new Request(`${ORIGIN}/auth/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': ip, ...headers },
    body: body ?? form({ email, password }),
  }), e);
}
const sessionOf = (res) => res.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`) && !c.startsWith(`${SESSION_COOKIE}=;`))?.split(';')[0];
const get = (path, e, cookie, headers = {}) => worker.fetch(new Request(`${ORIGIN}${path}`, { headers: { ...(cookie ? { Cookie: cookie } : {}), ...headers } }), e);
const api = { 'X-TechPi-Admin': '1' };

// ---------- the verifier ----------
test('verifier: salted PBKDF2-SHA256, unique per run, verified in constant time; malformed values rejected', async () => {
  const a = await makeVerifier(PASSWORD, MIN_ITERATIONS);
  const b = await makeVerifier(PASSWORD, MIN_ITERATIONS);
  assert.match(a, /^pbkdf2-sha256\$10000\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, b, 'a fresh salt every time');
  assert.ok(!a.includes(PASSWORD));
  assert.equal(await verifyPassword(a, PASSWORD), true);
  for (const wrong of ['', 'correct horse battery staple 42', PASSWORD.toUpperCase(), `${PASSWORD} `]) assert.equal(await verifyPassword(a, wrong), false, wrong);
  assert.match(await makeVerifier('x'.repeat(16)), new RegExp(`^pbkdf2-sha256\\$${MAX_ITERATIONS}\\$`), 'production default: the Workers maximum');
  const [, , salt, hash] = a.split('$');
  for (const bad of ['', 'plaintext-password', `pbkdf2-sha1$10000$${salt}$${hash}`, `pbkdf2-sha256$9999$${salt}$${hash}`, `pbkdf2-sha256$100001$${salt}$${hash}`, `pbkdf2-sha256$10000$${salt}$${hash.slice(1)}`, `pbkdf2-sha256$10000$short$${hash}`]) {
    assert.equal(parseVerifier(bad), null, bad);
    assert.equal(await verifyPassword(bad, PASSWORD), false);
  }
});

test('setup rules: short, repetitive or guessable passwords are refused', () => {
  for (const p of ['short', 'a'.repeat(20), 'abcabcabcabcabcabc', 'my-techpi-admin-2026!', 'MyPassword-Is-Long-1']) assert.ok(weakness(p), p);
  assert.equal(weakness(PASSWORD), null);
  assert.ok(weakness('x'.repeat(257) + 'abcdefgh'));
});

// ---------- signing in ----------
test('the right email and password: a session for info@techpi.eu only, with the hardened cookie, and the API works', async () => {
  const e = env();
  for (const email of [ADMIN_EMAIL, ' INFO@TechPi.eu ']) {
    const res = await login(e, { email });
    assert.equal(res.status, 303, email);
    assert.equal(res.headers.get('Location'), '/');
    const set = res.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`) && !c.includes('Max-Age=0'));
    for (const attr of ['; Path=/', '; HttpOnly', '; Secure', '; SameSite=Lax', `Max-Age=${SESSION_TTL}`]) assert.ok(set.includes(attr), attr);
    assert.doesNotMatch(set, /domain=/i);
    const me = await get('/api/session', e, sessionOf(res), api);
    assert.equal(me.status, 200);
    const data = await me.json();
    assert.equal(data.login, ADMIN_EMAIL);
    assert.equal(data.signedInWith, 'password');
    assert.equal((await get('/', e, sessionOf(res))).status, 200);
    const payload = Buffer.from(sessionOf(res).split('=')[1].split('.')[0], 'base64url').toString();
    assert.ok(!payload.includes(PASSWORD) && !payload.includes(VERIFIER.split('$')[3]), 'the cookie holds neither the password nor the verifier');
  }
  assert.deepEqual([...new Set(e.LOGIN_LIMITER.names)], ['admin-login'], 'one limiter instance for everyone');
});

test('a wrong email or password gets the same refusal, no session, and nothing is reflected or logged', async () => {
  const logged = [];
  const original = console.error;
  console.error = (...a) => logged.push(a.join(' '));
  try {
    const e = env();
    const bodies = [];
    for (const [email, password, ip] of [
      ['someone@example.test', PASSWORD, '198.51.100.1'], ['info@techpi.eu.evil', PASSWORD, '198.51.100.2'], ['', PASSWORD, '198.51.100.3'],
      [ADMIN_EMAIL, 'wrong password, long enough', '198.51.100.4'], [ADMIN_EMAIL, '', '198.51.100.5'], [ADMIN_EMAIL, 'x'.repeat(300), '198.51.100.6'],
    ]) {
      const res = await login(e, { email, password, ip });
      assert.equal(res.status, 401, `${email} / ${password.length}`);
      assert.equal(sessionOf(res), undefined);
      const body = await res.text();
      assert.match(body, /The email or password is incorrect\./);
      assert.ok(!body.includes(password) || password === '', 'the password is not reflected');
      bodies.push(body);
    }
    assert.equal(new Set(bodies).size, 1, 'wrong email and wrong password look identical');
    assert.ok(logged.every((l) => !l.includes(PASSWORD) && !l.includes('wrong password') && !l.includes('@')), 'no email or password in the logs');
  } finally {
    console.error = original;
  }
});

test('unauthorised requests: no session, a forged or foreign session, and password sessions after the password changes', async () => {
  const e = env();
  const good = sessionOf(await login(e));
  for (const p of ['/', '/assets/index.js', '/api/session']) assert.equal((await get(p, e, undefined, api)).status, 401, p);
  const forged = await seal('another-secret-another-secret-another-secret', 'session', { sid: 's', m: 'password', login: ADMIN_EMAIL, pv: 'x' }, 600);
  const noTag = await seal(SESSION_SECRET, 'session', { sid: 's', m: 'password', login: ADMIN_EMAIL }, 600);
  const otherLogin = await seal(SESSION_SECRET, 'session', { sid: 's', m: 'password', login: 'someone@example.test', pv: 'x' }, 600);
  for (const [name, c] of [['forged', `${SESSION_COOKIE}=${forged}`], ['no verifier tag', `${SESSION_COOKIE}=${noTag}`], ['other email', `${SESSION_COOKIE}=${otherLogin}`]]) {
    assert.equal((await get('/api/session', e, c, api)).status, 401, name);
  }
  assert.equal((await get('/api/session', e, good, api)).status, 200);
  const rotated = env({ ADMIN_PASSWORD_HASH: await makeVerifier('a completely new password 77', MIN_ITERATIONS) });
  assert.equal((await get('/api/session', rotated, good, api)).status, 401, 'a new password ends the old sessions');
  assert.equal((await get('/api/session', env({ ADMIN_PASSWORD_HASH: '', LOGIN_LIMITER: undefined }), good, api)).status, 401, 'disabling password sign-in ends password sessions');
  assert.equal((await get('/api/session', env({ SESSION_SECRET: 'a-rotated-session-key-0123456789abcdefABCDEF' }), good, api)).status, 401, 'rotating SESSION_SECRET ends them too');
});

test('session expiry: an 8-hour-old password session is refused', async () => {
  const e = env();
  const res = await login(e);
  const pv = JSON.parse(Buffer.from(sessionOf(res).split('=')[1].split('.')[0], 'base64url').toString()).pv;
  const t = Math.floor(Date.now() / 1000);
  const old = await seal(SESSION_SECRET, 'session', { sid: 's', m: 'password', login: ADMIN_EMAIL, pv }, SESSION_TTL, t - SESSION_TTL - 1);
  const fresh = await seal(SESSION_SECRET, 'session', { sid: 's', m: 'password', login: ADMIN_EMAIL, pv }, SESSION_TTL, t - SESSION_TTL + 60);
  assert.equal((await get('/api/session', e, `${SESSION_COOKIE}=${old}`, api)).status, 401);
  assert.equal((await get('/api/session', e, `${SESSION_COOKIE}=${fresh}`, api)).status, 200);
});

test('logout ends a password session in the browser', async () => {
  const e = env();
  const cookie = sessionOf(await login(e));
  const out = await worker.fetch(new Request(`${ORIGIN}/auth/logout`, { method: 'POST', headers: { Cookie: cookie, ...api, 'Content-Type': 'application/json', Origin: ORIGIN }, body: '{}' }), e);
  assert.equal(out.status, 200);
  assert.ok(out.headers.getSetCookie().some((c) => c.startsWith(`${SESSION_COOKIE}=;`) && c.includes('Max-Age=0')));
});

test('CSRF: the form is accepted only from this admin\'s own page', async () => {
  const e = env();
  const cases = {
    'no Origin': { Origin: '' },
    'another origin': { Origin: 'https://evil.example' },
    'a sibling origin': { Origin: 'https://admin.example.test.evil.example' },
    'cross-site fetch metadata': { 'Sec-Fetch-Site': 'cross-site' },
    'same-site fetch metadata': { 'Sec-Fetch-Site': 'same-site' },
    'JSON instead of the form': { 'Content-Type': 'application/json' },
    'plain text': { 'Content-Type': 'text/plain' },
  };
  for (const [name, headers] of Object.entries(cases)) {
    const h = Object.fromEntries(Object.entries(headers).filter(([, v]) => v !== ''));
    const res = await worker.fetch(new Request(`${ORIGIN}/auth/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(headers.Origin === '' ? {} : { Origin: ORIGIN }), 'Sec-Fetch-Site': 'same-origin', ...h },
      body: form({ email: ADMIN_EMAIL, password: PASSWORD }),
    }), e);
    assert.equal(res.status, 403, name);
    assert.equal(sessionOf(res), undefined, name);
  }
  assert.equal(e.LOGIN_LIMITER.map.size, 0, 'refused before any attempt is counted');
  assert.equal((await get('/auth/password', e)).status, 405, 'GET is not a sign-in');
  assert.equal((await login(e, { body: 'email=a&password=' + 'x'.repeat(5000) })).status, 413, 'oversized form');
});

test('rate limit: 5 attempts per client per 15 minutes, 20 in total per hour, shared state, and the owner is not punished for success', async () => {
  const e = env();
  for (let i = 0; i < LIMITS.client.max; i++) assert.equal((await login(e, { password: `wrong password number ${i}` })).status, 401, `attempt ${i + 1}`);
  const blocked = await login(e);
  assert.equal(blocked.status, 429, 'even the right password is refused while blocked');
  assert.equal(sessionOf(blocked), undefined);
  assert.equal(Number(blocked.headers.get('Retry-After')), 15 * 60);
  assert.match(await blocked.text(), /Too many sign-in attempts/);
  assert.equal((await login(e, { ip: '198.51.100.20' })).status, 303, 'another client is not blocked by one client');
  now += LIMITS.client.window;
  assert.equal((await login(e)).status, 303, 'the window passes');
  // A success clears that client's count.
  for (let i = 0; i < LIMITS.client.max - 1; i++) await login(e, { password: 'wrong password again!!' });
  assert.equal((await login(e)).status, 303);
  assert.equal((await login(e, { password: 'wrong password again!!' })).status, 401, 'counting starts again after a success');

  // Many clients together: at most 20 attempts per hour in total.
  const f = env();
  let n = 0;
  for (let ip = 1; n < LIMITS.all.max; ip++) for (let k = 0; k < 4 && n < LIMITS.all.max; k++, n++) assert.equal((await login(f, { ip: `192.0.2.${ip}`, password: 'wrong password from many places' })).status, 401);
  const global = await login(f, { ip: '192.0.2.200' });
  assert.equal(global.status, 429, 'a new client is blocked once the total is reached');
  assert.ok(Number(global.headers.get('Retry-After')) > 0);
  now += LIMITS.all.window;
  assert.equal((await login(f, { ip: '192.0.2.200' })).status, 303);
  assert.ok([...f.LOGIN_LIMITER.map.keys()].every((k) => k === 'all' || /^client:[A-Za-z0-9_-]{22}$/.test(k)), 'client IPs are stored only as hashes');
  assert.ok(![...f.LOGIN_LIMITER.map.keys()].some((k) => k.includes('192.0.2')));
});

test('misconfiguration fails closed for the password only: no form, sign-in refused, no session; GitHub sign-in keeps working', async () => {
  const githubSession = await sessionCookie(ctxFor());
  for (const over of [{ ADMIN_PASSWORD_HASH: 'plaintext-password' }, { ADMIN_PASSWORD_HASH: 'pbkdf2-sha256$1000$abc$def' }, { LOGIN_LIMITER: undefined }, { LOGIN_LIMITER: {} }]) {
    const name = JSON.stringify(Object.keys(over));
    const e = env(over);
    assert.equal(passwordConfig(e).enabled, false, name);
    assert.ok(passwordConfig(e).problems.length > 0, name);
    const page = await get('/', e);
    assert.equal(page.status, 401, `${name}: the sign-in page is still served`);
    const html = await page.text();
    assert.doesNotMatch(html, /<form/, `${name}: no password form`);
    assert.match(html, /Sign in with GitHub/);
    const res = await login(e);
    assert.equal(res.status, 503, name);
    assert.equal(sessionOf(res), undefined);
    assert.match(await res.text(), /Password sign-in is not available/);
    assert.equal((await get('/api/session', e, githubSession, api)).status, 200, `${name}: GitHub sessions work`);
    const start = await worker.fetch(new Request(`${ORIGIN}/auth/login`, { redirect: 'manual' }), e);
    assert.equal(start.status, 303, `${name}: GitHub sign-in starts`);
  }
  // A password session cannot be used while the password sign-in is misconfigured (for example, the binding is missing).
  const good = sessionOf(await login(env()));
  assert.equal((await get('/api/session', env({ LOGIN_LIMITER: undefined }), good, api)).status, 401);
  const broken = env({ LOGIN_LIMITER: { idFromName: (n) => n, get: () => ({ fetch: async () => { throw new Error('down'); } }) } });
  const res = await login(broken);
  assert.equal(res.status, 503);
  assert.equal(sessionOf(res), undefined);
  const bad = env({ LOGIN_LIMITER: { idFromName: (n) => n, get: () => ({ fetch: async () => new Response('x', { status: 500 }) }) } });
  assert.equal((await login(bad)).status, 503);
});

test('without ADMIN_PASSWORD_HASH: no form, /auth/password is 404, GitHub sign-in unchanged', async () => {
  const e = env({ ADMIN_PASSWORD_HASH: '', LOGIN_LIMITER: undefined });
  const page = await (await get('/', e)).text();
  assert.doesNotMatch(page, /<form/);
  assert.match(page, /Sign in with GitHub/);
  assert.equal((await login(e)).status, 404);
  assert.equal((await get('/api/session', e, await sessionCookie(ctxFor()), api)).status, 200, 'GitHub sessions work');
});

test('with password sign-in enabled: the page offers both, posts only to itself, and GitHub sign-in still works', async () => {
  const e = env();
  const res = await get('/', e);
  const page = await res.text();
  assert.match(page, /<form method="post" action="\/auth\/password">/);
  assert.match(page, /type="email" autocomplete="username"/);
  assert.match(page, /type="password" autocomplete="current-password"/);
  assert.match(page, /Sign in with GitHub/);
  assert.doesNotMatch(page, /<script/i);
  assert.match(res.headers.get('Content-Security-Policy'), /form-action 'self'/);
  const gh1 = await get('/api/session', e, await sessionCookie(ctxFor()), api);
  assert.equal(gh1.status, 200);
  assert.equal((await gh1.json()).signedInWith, 'github');
  const start = await worker.fetch(new Request(`${ORIGIN}/auth/login`, { redirect: 'manual' }), e);
  assert.equal(start.status, 303);
  assert.match(start.headers.get('Location'), /^https:\/\/github\.com\/login\/oauth\/authorize\?/);
});

// ---------- AUTH-P1 corrections: the setup and upload workflow ----------
const adminDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('a verifier with a byte-order mark, trailing newline or spaces (as a Windows shell pipe adds) still works, for sign-in and sessions', async () => {
  // Windows PowerShell 5.1 adds a byte-order mark and CRLF to text piped between programs (checked on Windows 11).
  for (const [prefix, suffix] of [['', '\r\n'], ['', '\n'], ['', '  '], ['﻿', '\r\n']]) {
    const e = env({ ADMIN_PASSWORD_HASH: prefix + VERIFIER + suffix });
    assert.equal(passwordConfig(e).enabled, true, JSON.stringify(suffix));
    const res = await login(e, { ip: `198.51.100.${prefix.length * 10 + suffix.length + 50}` });
    assert.equal(res.status, 303, JSON.stringify(suffix));
    assert.equal((await get('/api/session', env(), sessionOf(res), api)).status, 200, 'the same verifier tag as without the suffix');
  }
});

test('setup options: --iterations bounded (Workers Free: 20000), --deploy needs --config, unknown options refused, no password argument', () => {
  assert.deepEqual(parseArgs([]), { deploy: false, config: undefined, iterations: MAX_ITERATIONS });
  assert.deepEqual(parseArgs(['--iterations=20000']), { deploy: false, config: undefined, iterations: 20000 });
  assert.deepEqual(parseArgs(['--deploy', '--config', 'wrangler.production.local.jsonc', '--iterations=20000']), { deploy: true, config: 'wrangler.production.local.jsonc', iterations: 20000 });
  assert.deepEqual(parseArgs(['--deploy', '--config=wrangler.production.local.jsonc']).config, 'wrangler.production.local.jsonc');
  for (const bad of [['--iterations=500'], ['--iterations=200000'], ['--iterations=abc'], ['--deploy'], ['--config', 'x.jsonc'], ['--stdout'], ['--password=hunter2hunter2hunter2'], ['hunter2hunter2hunter2']]) {
    const r = parseArgs(bad);
    assert.ok(r.error, bad.join(' '));
    assert.ok(!r.error.includes('hunter2'), 'a stray value is never echoed');
  }
});

test('hidden input: Enter (CR or LF), Backspace, Ctrl+C, pasted text and control characters', () => {
  assert.deepEqual(applyKeys('', 'abc\r'), { value: 'abc', done: true, cancelled: false });
  assert.deepEqual(applyKeys('', 'abc\n'), { value: 'abc', done: true, cancelled: false });
  assert.deepEqual(applyKeys('', 'a long pasted passphrase\r\n'), { value: 'a long pasted passphrase', done: true, cancelled: false });
  assert.deepEqual(applyKeys('abc', '\u0008'), { value: 'ab', done: false, cancelled: false });
  assert.deepEqual(applyKeys('abc', '\u007f\u007fx'), { value: 'ax', done: false, cancelled: false });
  assert.deepEqual(applyKeys('ab€', '\u0008'), { value: 'ab', done: false, cancelled: false }, 'one character, not one UTF-16 unit');
  assert.deepEqual(applyKeys('secret', '\u0003'), { value: '', done: true, cancelled: true });
  assert.deepEqual(applyKeys('', 'a\u001b[Ab\tc'), { value: 'a[Abc', done: false, cancelled: false }, 'control characters are dropped');
});

test('deploy guard: refused without the LOGIN_LIMITER binding and migration, outside production, or with a secret as a variable', () => {
  const example = fs.readFileSync(path.join(adminDir, 'wrangler.production.example.jsonc'), 'utf8');
  assert.deepEqual(deployConfigProblems(example), [], 'the production template is ready');
  const c = JSON.parse(example.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
  const variant = (f) => { const x = structuredClone(c); f(x); return JSON.stringify(x); };
  assert.match(deployConfigProblems(variant((x) => delete x.durable_objects)).join(' '), /LOGIN_LIMITER/);
  assert.match(deployConfigProblems(variant((x) => { x.durable_objects.bindings[0].class_name = 'Other'; })).join(' '), /LOGIN_LIMITER/);
  assert.match(deployConfigProblems(variant((x) => delete x.migrations)).join(' '), /migration/);
  assert.match(deployConfigProblems(variant((x) => { x.vars.CONTENT_MODE = 'development'; })).join(' '), /production/);
  assert.match(deployConfigProblems(variant((x) => { x.workers_dev = true; })).join(' '), /workers_dev/);
  assert.match(deployConfigProblems(variant((x) => { x.vars.ADMIN_PASSWORD_HASH = VERIFIER; })).join(' '), /ADMIN_PASSWORD_HASH must not be a plain variable/);
  assert.ok(deployConfigProblems(fs.readFileSync(path.join(adminDir, 'wrangler.local.example.jsonc'), 'utf8')).length, 'the local template is not a production deploy');
  assert.deepEqual(deployConfigProblems('{ not json'), ['The configuration is not valid JSONC.']);
});

test('secrets file: only ADMIN_PASSWORD_HASH (existing secrets are kept by --secrets-file), owner-only, outside the repo, always deleted', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-p1-test-'));
  try {
    let seen;
    const restricted = [];
    const result = await withSecretsFile(VERIFIER, (file) => {
      seen = { file, content: JSON.parse(fs.readFileSync(file, 'utf8')) };
      return 0;
    }, { tmp, restrict: (dir, file) => restricted.push(dir, file) });
    assert.equal(result, 0);
    assert.deepEqual(seen.content, { ADMIN_PASSWORD_HASH: VERIFIER }, 'no other secret is replaced');
    assert.ok(!path.resolve(seen.file).startsWith(path.resolve(adminDir, '..')), 'outside the repository');
    assert.deepEqual(restricted.map((p) => path.basename(p)).slice(1), ['secrets.json']);
    assert.equal(fs.existsSync(seen.file), false, 'deleted after success');
    let failedFile;
    await assert.rejects(withSecretsFile(VERIFIER, (file) => { failedFile = file; throw new Error('deploy failed'); }, { tmp, restrict: () => {} }), /deploy failed/);
    assert.equal(fs.existsSync(failedFile), false, 'deleted after failure');
    await assert.rejects(withSecretsFile(VERIFIER, () => 0, { tmp, restrict: () => { throw new Error('icacls failed'); } }), /icacls failed/);
    assert.deepEqual(fs.readdirSync(tmp), [], 'nothing is left behind, even when restricting fails');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
