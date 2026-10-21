// The GitHub sign-in flow (Task AUTH-G1), end to end inside the Worker, against the GitHub mock (test values only):
// state and PKCE, the round-trip cookie, replay and fixation, the allowed GitHub user ID, GitHub failures, logout,
// cookie attributes, and that no token or secret ever reaches the browser.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import worker from '../worker/index.js';
import { callbackUrl } from '../worker/auth.js';
import { seal, OAUTH_COOKIE, SESSION_COOKIE, SESSION_TTL, OAUTH_TTL } from '../worker/session.js';
import { createMockGitHub, MOCK_OAUTH } from './support/mock-github.mjs';
import { authEnv, SESSION_SECRET } from './support/auth.mjs';
import { resetTokenCache } from '../worker/github.js';

const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ORIGIN = 'https://admin.example.test';
const env = (over = {}) => ({
  ...authEnv, CONTENT_BASE_BRANCH: 'feat/x', GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: 'unused',
  ASSETS: { fetch: async () => new Response('<!doctype html>admin app', { headers: { 'Content-Type': 'text/html' } }) },
  ...over,
});
let gh;
beforeEach(() => {
  resetTokenCache();
  gh = createMockGitHub({ publicKey });
  globalThis.fetch = gh.fetch;
});

const setCookies = (res) => res.headers.getSetCookie();
const cookieValue = (res, name) => {
  const c = setCookies(res).find((x) => x.startsWith(`${name}=`));
  return c === undefined ? undefined : c.slice(name.length + 1).split(';')[0];
};
async function get(path, { cookie, e = env(), method = 'GET', headers = {} } = {}) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, { method, redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...headers } }), e);
}
/** Starts sign-in; returns the GitHub authorize URL and the round-trip cookie. */
async function start(opts) {
  const res = await get('/auth/login', opts);
  assert.equal(res.status, 303);
  return { res, authorize: new URL(res.headers.get('Location')), oauth: cookieValue(res, OAUTH_COOKIE) };
}
/** "Signs in" at the mock GitHub and returns the callback path GitHub redirects to. */
async function atGitHub(authorize) {
  const r = await gh.fetch(authorize.toString());
  assert.equal(r.status, 302);
  const back = new URL(r.headers.get('Location'));
  return `${back.pathname}${back.search}`;
}
async function signIn(opts = {}) {
  const { authorize, oauth } = await start(opts);
  const cb = await atGitHub(authorize);
  return { cb, oauth, res: await get(cb, { cookie: `${OAUTH_COOKIE}=${oauth}`, e: opts.e }) };
}
const leaks = (text) => /ghu_|ghs_|mock-client-secret|client_secret|code_verifier|test-session-secret|BEGIN .*PRIVATE KEY/.test(text);

test('the full sign-in: state and PKCE S256 to GitHub, the owner gets a session, the GitHub token is revoked', async () => {
  const { res: login, authorize, oauth } = await start();
  assert.equal(`${authorize.origin}${authorize.pathname}`, 'https://github.com/login/oauth/authorize');
  const q = authorize.searchParams;
  assert.equal(q.get('client_id'), MOCK_OAUTH.clientId);
  assert.equal(q.get('redirect_uri'), `${ORIGIN}/auth/callback`);
  assert.equal(q.get('code_challenge_method'), 'S256');
  assert.match(q.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
  assert.match(q.get('state'), /^[A-Za-z0-9_-]{43}$/, '32 random bytes');
  assert.equal(q.get('allow_signup'), 'false');
  assert.ok(!q.has('client_secret') && !q.has('code_verifier'), 'no secret in the URL');
  assert.ok(oauth, 'the round-trip cookie is set');
  assert.equal(cookieValue(login, SESSION_COOKIE), '', 'any old session is cleared when sign-in starts');

  const cb = await atGitHub(authorize);
  const res = await get(cb, { cookie: `${OAUTH_COOKIE}=${oauth}` });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), '/');
  const session = cookieValue(res, SESSION_COOKIE);
  assert.ok(session);
  assert.equal(cookieValue(res, OAUTH_COOKIE), '', 'the round-trip cookie is cleared');
  assert.deepEqual(gh.state.oauthLog.map((l) => `${l.step}:${l.ok}`), ['authorize:true', 'token:true', 'revoke:true']);
  assert.ok([...gh.state.userTokens.values()].every((t) => t.revoked), 'the GitHub user token is revoked straight away');

  const app = await get('/', { cookie: `${SESSION_COOKIE}=${session}` });
  assert.equal(app.status, 200);
  const me = await get('/api/session', { cookie: `${SESSION_COOKIE}=${session}`, headers: { 'X-TechPi-Admin': '1' } });
  assert.equal(me.status, 200);
  const data = await me.json();
  assert.equal(data.login, MOCK_OAUTH.user.login);
  assert.equal(data.signedInWith, 'github');
  // Nothing in any response or URL carries a token or a secret.
  for (const text of [login.headers.get('Location'), cb, setCookies(login).join('\n'), setCookies(res).join('\n'), JSON.stringify(data), Buffer.from(session.split('.')[0], 'base64url').toString()]) {
    assert.ok(!leaks(text), text);
  }
});

test('cookies are __Host-, HttpOnly, Secure, SameSite=Lax, Path=/, host-only, and short-lived', async () => {
  const { res: login } = await start();
  const { res } = await signIn();
  const all = [...setCookies(login), ...setCookies(res)];
  assert.ok(all.length >= 4);
  for (const c of all) {
    assert.match(c, /^__Host-techpi_(oauth|session)=/);
    for (const attr of ['; Path=/', '; HttpOnly', '; Secure', '; SameSite=Lax']) assert.ok(c.includes(attr), `${attr} in ${c}`);
    assert.doesNotMatch(c, /domain=/i, 'host-only');
  }
  assert.ok(setCookies(login).some((c) => c.startsWith(`${OAUTH_COOKIE}=`) && c.includes(`Max-Age=${OAUTH_TTL};`)));
  assert.ok(setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE}=`) && c.includes(`Max-Age=${SESSION_TTL};`)));
  assert.equal(SESSION_TTL, 8 * 3600);
  assert.equal(OAUTH_TTL, 600);
});

test('callback: missing or invalid state is refused before GitHub is contacted', async () => {
  const { authorize, oauth } = await start();
  const cb = new URL(await atGitHub(authorize), ORIGIN);
  const code = cb.searchParams.get('code');
  const state = cb.searchParams.get('state');
  const other = (await start()).authorize.searchParams.get('state');
  const cases = {
    'no state': `/auth/callback?code=${code}`,
    'empty state': `/auth/callback?code=${code}&state=`,
    'malformed state': `/auth/callback?code=${code}&state=${encodeURIComponent('<script>alert(1)</script>xxxxxxxxxxxx')}`,
    'another sign-in\'s state': `/auth/callback?code=${code}&state=${other}`,
    'no code': `/auth/callback?state=${state}`,
    'malformed code': `/auth/callback?code=${encodeURIComponent('a b"c')}&state=${state}`,
  };
  const before = gh.state.oauthLog.length;
  for (const [name, p] of Object.entries(cases)) {
    const res = await get(p, { cookie: `${OAUTH_COOKIE}=${oauth}` });
    assert.equal(res.status, 400, name);
    assert.equal(cookieValue(res, SESSION_COOKIE), undefined, `${name}: no session`);
    assert.equal(cookieValue(res, OAUTH_COOKIE), '', `${name}: the round-trip cookie is cleared`);
    const body = await res.text();
    assert.doesNotMatch(body, /<script>alert/, 'nothing from the request is reflected');
    assert.match(body, /Sign in with GitHub/);
  }
  assert.equal(gh.state.oauthLog.length, before, 'no code exchange happened');
});

test('callback: a missing, tampered, expired, forged or other-purpose round-trip cookie is refused', async () => {
  const { authorize, oauth } = await start();
  const cb = await atGitHub(authorize);
  const state = new URL(cb, ORIGIN).searchParams.get('state');
  const t = Math.floor(Date.now() / 1000);
  const [payload, sig] = oauth.split('.');
  const cookies = {
    missing: undefined,
    tampered: `${payload.slice(0, -1)}${payload.at(-1) === 'A' ? 'B' : 'A'}.${sig}`,
    expired: await seal(SESSION_SECRET, 'oauth', { state, verifier: 'v'.repeat(64) }, OAUTH_TTL, t - OAUTH_TTL - 1),
    forged: await seal('another-secret-another-secret-another-secret', 'oauth', { state, verifier: 'v'.repeat(64) }, OAUTH_TTL),
    'a session token': await seal(SESSION_SECRET, 'session', { state, verifier: 'v'.repeat(64), sid: 's', uid: authEnv.ADMIN_GITHUB_USER_ID }, OAUTH_TTL),
  };
  for (const [name, value] of Object.entries(cookies)) {
    const res = await get(cb, { cookie: value === undefined ? undefined : `${OAUTH_COOKIE}=${value}` });
    assert.equal(res.status, 400, name);
    assert.equal(cookieValue(res, SESSION_COOKIE), undefined, name);
  }
  assert.ok(!gh.state.oauthLog.some((l) => l.step === 'token'), 'no code exchange happened');
});

test('PKCE: a code exchanged with the wrong verifier is rejected by GitHub, and no session is issued', async () => {
  const { authorize } = await start();
  const cb = await atGitHub(authorize);
  const state = new URL(cb, ORIGIN).searchParams.get('state');
  // A validly sealed cookie with the right state but another verifier (as if the code had been intercepted).
  const wrong = await seal(SESSION_SECRET, 'oauth', { state, verifier: crypto.randomBytes(48).toString('base64url') }, OAUTH_TTL);
  const res = await get(cb, { cookie: `${OAUTH_COOKIE}=${wrong}` });
  assert.equal(res.status, 403);
  assert.equal(cookieValue(res, SESSION_COOKIE), undefined);
  assert.equal(gh.state.oauthLog.at(-1).reason, 'bad_verification_code (PKCE)');
});

test('replay: a used callback cannot be replayed, with or without the round-trip cookie', async () => {
  const { cb, oauth, res } = await signIn();
  assert.equal(res.status, 303);
  const withCookie = await get(cb, { cookie: `${OAUTH_COOKIE}=${oauth}` });
  assert.equal(withCookie.status, 403, 'GitHub refuses the used code');
  assert.equal(cookieValue(withCookie, SESSION_COOKIE), undefined);
  assert.equal(gh.state.oauthLog.at(-1).reason, 'bad_verification_code');
  const without = await get(cb);
  assert.equal(without.status, 400, 'the browser no longer has the round-trip cookie');
  assert.equal(cookieValue(without, SESSION_COOKIE), undefined);
});

test('session fixation: sign-in clears any existing session and always issues a new, random one', async () => {
  const planted = 'attacker-chosen-value';
  const { res: login } = await start({ cookie: `${SESSION_COOKIE}=${planted}` });
  assert.equal(cookieValue(login, SESSION_COOKIE), '');
  const a = cookieValue((await signIn({ cookie: `${SESSION_COOKIE}=${planted}` })).res, SESSION_COOKIE);
  const b = cookieValue((await signIn()).res, SESSION_COOKIE);
  assert.ok(a && b && a !== planted && a !== b);
  const sid = (v) => JSON.parse(Buffer.from(v.split('.')[0], 'base64url').toString()).sid;
  assert.notEqual(sid(a), sid(b));
  assert.match(sid(a), /^[A-Za-z0-9_-]{22}$/);
});

test('another GitHub account is refused (by numeric user ID, not by name), and its token is revoked', async () => {
  for (const user of [{ id: 7654321, login: 'someone-else' }, { id: 7654321, login: MOCK_OAUTH.user.login }]) {
    gh.state.oauthUser = user;
    const { res } = await signIn();
    assert.equal(res.status, 403, user.login);
    assert.equal(cookieValue(res, SESSION_COOKIE), undefined);
    assert.match(await res.text(), /not allowed/);
  }
  assert.ok([...gh.state.userTokens.values()].every((t) => t.revoked));
  // The owner's ID with a different username (a renamed account) is still the owner.
  gh.state.oauthUser = { id: MOCK_OAUTH.user.id, login: 'renamed-owner' };
  assert.equal((await signIn()).res.status, 303);
});

test('cancelled sign-in, GitHub errors and revoked tokens fail closed', async () => {
  gh.state.oauthDeny = true;
  let r = (await signIn()).res;
  assert.equal(r.status, 403, 'access_denied');
  gh.state.oauthDeny = false;

  gh.failNext(/^POST \/login\/oauth\/access_token$/, 500);
  r = (await signIn()).res;
  assert.equal(r.status, 502, 'token endpoint error');

  gh.failNetworkNext(/^POST \/login\/oauth\/access_token$/);
  r = (await signIn()).res;
  assert.equal(r.status, 502, 'token endpoint unreachable');

  gh.failNext(/^GET \/user$/, 401);
  r = (await signIn()).res;
  assert.equal(r.status, 403, 'revoked or invalid user token');

  gh.failNext(/^GET \/user$/, 500);
  r = (await signIn()).res;
  assert.equal(r.status, 502, '/user error');

  gh.failNetworkNext(/^GET \/user$/);
  r = (await signIn()).res;
  assert.equal(r.status, 502, '/user unreachable');

  // A wrong client secret: GitHub answers 200 with an error.
  r = (await signIn({ e: env({ GITHUB_OAUTH_CLIENT_SECRET: 'not-the-client-secret-000' }) })).res;
  assert.equal(r.status, 403, 'incorrect client credentials');

  for (const res of [r]) assert.equal(cookieValue(res, SESSION_COOKIE), undefined);
  // A failed revocation does not block the owner's sign-in (the token expires on its own).
  gh.failNetworkNext(/^DELETE \/applications\//);
  assert.equal((await signIn()).res.status, 303);
});

test('revocation: non-success HTTP responses are reported by status only, never block sign-in, and never log credentials', async () => {
  const logged = [];
  const original = console.error;
  console.error = (...a) => logged.push(a.join(' '));
  try {
    for (const status of [401, 403, 422, 500, 503]) {
      logged.length = 0;
      gh.failNext(/^DELETE \/applications\//, status);
      const { res } = await signIn();
      assert.equal(res.status, 303, `sign-in still succeeds on revoke ${status}`);
      assert.ok(cookieValue(res, SESSION_COOKIE), `session issued on revoke ${status}`);
      const report = logged.filter((l) => l.includes('could not be revoked'));
      assert.equal(report.length, 1, `reported once on ${status}`);
      assert.ok(report[0].includes(`HTTP ${status}`), report[0]);
      assert.ok(!leaks(logged.join('\n')), 'no token, secret or code in the log');
    }
    // 204 (revoked) and 404 (already gone) are not failures; a network error is reported without a status.
    for (const status of [404]) {
      logged.length = 0;
      gh.failNext(/^DELETE \/applications\//, status);
      assert.equal((await signIn()).res.status, 303);
      assert.ok(!logged.some((l) => l.includes('could not be revoked')), `no report on ${status}`);
    }
    logged.length = 0;
    assert.equal((await signIn()).res.status, 303);
    assert.ok(!logged.some((l) => l.includes('could not be revoked')), 'no report on 204');
    gh.failNetworkNext(/^DELETE \/applications\//);
    assert.equal((await signIn()).res.status, 303);
    assert.ok(logged.some((l) => /could not be revoked \(it expires/.test(l)), 'network failure reported');
    assert.ok(!leaks(logged.join('\n')));
  } finally {
    console.error = original;
  }
});

test('logout: same-origin POST clears both cookies; GET and cross-site logout are refused', async () => {
  const session = cookieValue((await signIn()).res, SESSION_COOKIE);
  const cookie = `${SESSION_COOKIE}=${session}`;
  const json = { 'X-TechPi-Admin': '1', 'Content-Type': 'application/json', Origin: ORIGIN };
  assert.equal((await get('/auth/logout', { cookie })).status, 405);
  assert.equal((await get('/auth/logout', { cookie, method: 'POST', headers: { ...json, Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await get('/auth/logout', { cookie, method: 'POST', headers: { ...json, 'X-TechPi-Admin': '' } })).status, 403);
  assert.equal((await get('/auth/logout', { cookie, method: 'POST', headers: { ...json, 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  const out = await get('/auth/logout', { cookie, method: 'POST', headers: json });
  assert.equal(out.status, 200);
  assert.equal(cookieValue(out, SESSION_COOKIE), '');
  assert.equal(cookieValue(out, OAUTH_COOKIE), '');
  assert.ok(setCookies(out).every((c) => c.includes('Max-Age=0;')));
});

test('expired sessions are refused for pages, static files and the API', async () => {
  const t = Math.floor(Date.now() / 1000);
  const old = await seal(SESSION_SECRET, 'session', { sid: 's', uid: authEnv.ADMIN_GITHUB_USER_ID, login: 'x' }, SESSION_TTL, t - SESSION_TTL - 1);
  const cookie = `${SESSION_COOKIE}=${old}`;
  assert.equal((await get('/', { cookie })).status, 401);
  assert.equal((await get('/assets/index.js', { cookie })).status, 401);
  const api = await get('/api/session', { cookie, headers: { 'X-TechPi-Admin': '1' } });
  assert.equal(api.status, 401);
  assert.equal((await api.json()).error.signIn, '/auth/login');
});

test('only the sign-in endpoints are public: other /auth paths, the API and drafts need a session', async () => {
  for (const p of ['/auth', '/auth/', '/auth/token', '/auth/session']) assert.equal((await get(p)).status, 404, p);
  assert.equal((await get('/auth/login', { method: 'POST' })).status, 405);
  assert.equal((await get('/auth/callback', { method: 'POST' })).status, 405);
  const write = await get('/api/case-studies/rocketeer/draft', { method: 'POST', headers: { 'X-TechPi-Admin': '1', 'Content-Type': 'application/json', Origin: ORIGIN } });
  assert.equal(write.status, 401);
  assert.equal(gh.state.log.filter((l) => l.includes('/repos/')).length, 0, 'nothing reached the repository');
});

test('production: exact callback URL, github.com only, and the local overrides and test secret are refused', async () => {
  const prod = (over = {}) => env({ CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main', ADMIN_HOSTNAME: 'admin.techpi.eu', SESSION_SECRET: 'prod-like-secret-for-tests-only-9f8e7d6c5b4a39281706', ...over });
  assert.equal(callbackUrl(prod(), new URL('https://admin.techpi.eu/auth/login')), 'https://admin.techpi.eu/auth/callback');
  const login = await worker.fetch(new Request('https://admin.techpi.eu/auth/login'), prod());
  assert.equal(login.status, 303);
  const authorize = new URL(login.headers.get('Location'));
  assert.equal(authorize.origin, 'https://github.com');
  assert.equal(authorize.searchParams.get('redirect_uri'), 'https://admin.techpi.eu/auth/callback');
  // Wrong hosts, plain HTTP, the mock override and the test secret: nothing is served, not even the sign-in.
  for (const [u, e] of [
    ['https://techpi-admin.example.workers.dev/auth/login', prod()],
    ['http://admin.techpi.eu/auth/login', prod()],
    ['http://127.0.0.1:8787/auth/login', prod()],
    ['https://admin.techpi.eu/auth/login', prod({ GITHUB_OAUTH_BASE: 'http://127.0.0.1:8920' })],
    ['https://admin.techpi.eu/auth/login', prod({ SESSION_SECRET })],
    ['https://admin.techpi.eu/auth/callback?code=abcdefgh&state=' + 'a'.repeat(43), prod({ GITHUB_API_BASE: 'http://127.0.0.1:8920' })],
  ]) {
    const res = await worker.fetch(new Request(u), e);
    assert.equal(res.status, 503, u);
    assert.equal(setCookies(res).length, 0, `${u}: no cookie`);
  }
  // Development honours the local mock only on 127.0.0.1.
  for (const base of ['https://evil.example', 'http://localhost:8920', 'http://127.0.0.1.evil.example:80']) {
    const res = await get('/auth/login', { e: env({ GITHUB_OAUTH_BASE: base }) });
    assert.equal(new URL(res.headers.get('Location')).origin, 'https://github.com', base);
  }
});
