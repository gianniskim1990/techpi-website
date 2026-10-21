// Admin API tests (Task A1) with a mocked GitHub: authorisation, same-origin protection, GitHub App configuration and
// token handling, the draft workflow, conflicts, failures, and that nothing is ever written to main.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';

const ORIGIN = 'https://admin.example.test';
const AUD = 'test-aud-0001';
const ADMIN = 'admin@example.test';
const BASE = 'feat/techpi-admin-m0';
const FILE = 'content/m0-demo/m0-sample-article/index.json';
const SAMPLE = JSON.stringify({ en: { title: 'M0 sample article for the admin proof of concept', summary: 'Dummy content.', body: 'Placeholder.' } }, null, 2) + '\n';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM_PKCS1 = privateKey.export({ type: 'pkcs1', format: 'pem' });

let gh;
const env = (over = {}) => ({
  ACCESS_AUD: AUD, ADMIN_EMAILS: ADMIN, GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM_PKCS1,
  CONTENT_BASE_BRANCH: BASE, ENABLE_TEST_CONTENT: 'true', ASSETS: { fetch: async () => new Response('app') }, ...over,
});
const ctxFor = (email = ADMIN, aud = AUD) => ({ access: { aud, getIdentity: async () => ({ email }) } });
const bodies = [];
async function call(method, path, { body, headers = {}, ctx = ctxFor(), e = env() } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  for (const [k, v] of Object.entries(h)) if (v === null) delete h[k];
  const res = await worker.fetch(new Request(ORIGIN + path, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), e, ctx);
  const text = await res.text();
  bodies.push(text);
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, headers: res.headers };
}
const githubRequests = () => gh.state.log.length;

beforeEach(() => {
  resetTokenCache();
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { [FILE]: SAMPLE } } });
  globalThis.fetch = gh.fetch;
});

// ---------- authorisation ----------
test('session: identity comes from Cloudflare Access only; client-sent values are ignored', async () => {
  const r = await call('GET', '/api/session', { headers: { 'X-Email': 'evil@example.test', 'Cf-Access-Authenticated-User-Email': 'evil@example.test' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.email, ADMIN);
  assert.equal(r.data.repository, 'gianniskim1990/techpi-website');
  assert.equal(r.data.github.configured, true);
  assert.equal(r.data.publishing, 'github', 'publishing is manual, on GitHub');
  assert.equal(r.data.mode, 'development');
});

test('API refuses missing Access, wrong audience and non-allowlisted users, before contacting GitHub', async () => {
  for (const ctx of [{}, ctxFor(ADMIN, 'other-app'), ctxFor('intruder@example.test')]) {
    for (const [m, p] of [['GET', '/api/session'], ['GET', '/api/m0-demo'], ['POST', '/api/m0-demo/m0-sample-article/draft']]) {
      const r = await call(m, p, { ctx, body: m === 'POST' ? { content: {}, expectedSha: gitSha(SAMPLE) } : undefined });
      assert.equal(r.status, 403, `${m} ${p}`);
    }
  }
  assert.equal(githubRequests(), 0);
});

test('unconfigured admin fails closed on the API too', async () => {
  const r = await call('GET', '/api/m0-demo', { e: env({ ACCESS_AUD: '' }) });
  assert.equal(r.status, 503);
  assert.equal(githubRequests(), 0);
});

// ---------- same-origin and CSRF ----------
test('cross-origin and CSRF-style write attempts are refused', async () => {
  const save = { content: JSON.parse(SAMPLE), expectedSha: gitSha(SAMPLE) };
  const cases = [
    [{ Origin: 'https://evil.example' }, 403],
    [{ Origin: null }, 403],
    [{ 'X-TechPi-Admin': null }, 403],
    [{ 'Sec-Fetch-Site': 'cross-site' }, 403],
    [{ 'Sec-Fetch-Site': 'same-site' }, 403],
    [{ 'Content-Type': 'text/plain' }, 415],
    [{ 'Content-Type': 'application/x-www-form-urlencoded' }, 415],
  ];
  for (const [headers, status] of cases) {
    const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { headers, body: save });
    assert.equal(r.status, status, JSON.stringify(headers));
  }
  const get = await call('GET', '/api/m0-demo', { headers: { 'X-TechPi-Admin': null } });
  assert.equal(get.status, 403, 'reads also need the admin header');
  assert.equal(gh.state.writes.length, 0);
});

// ---------- GitHub App configuration and tokens ----------
test('missing GitHub App configuration is reported by name and nothing is called', async () => {
  const s = await call('GET', '/api/session', { e: env({ GITHUB_APP_PRIVATE_KEY: '', GITHUB_APP_ID: '' }) });
  assert.equal(s.data.github.configured, false);
  assert.deepEqual(s.data.github.missing.sort(), ['GITHUB_APP_ID', 'GITHUB_APP_PRIVATE_KEY']);
  const r = await call('GET', '/api/m0-demo', { e: env({ GITHUB_APP_PRIVATE_KEY: '' }) });
  assert.equal(r.status, 503);
  assert.match(r.data.error.message, /not configured/);
  assert.equal(githubRequests(), 0);
});

test('an unreadable private key, a wrong App ID and a wrong installation give clear errors', async () => {
  const bad = await call('GET', '/api/m0-demo', { e: env({ GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----' }) });
  assert.equal(bad.status, 503);
  assert.match(bad.data.error.message, /private key/);
  resetTokenCache();
  const wrongApp = await call('GET', '/api/m0-demo', { e: env({ GITHUB_APP_ID: '999' }) });
  assert.equal(wrongApp.status, 503);
  assert.match(wrongApp.data.error.message, /App ID and private key/);
  resetTokenCache();
  const wrongInst = await call('GET', '/api/m0-demo', { e: env({ GITHUB_APP_INSTALLATION_ID: '1' }) });
  assert.equal(wrongInst.status, 503);
  assert.match(wrongInst.data.error.message, /not installed/);
});

test('installation token is narrowed to this repository and three permissions, cached, and refreshed when expired', async () => {
  await call('GET', '/api/m0-demo');
  await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(gh.state.tokenRequests, 1, 'token reused while valid');
  gh.expireAllTokens();
  const r = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(r.status, 200, 'expired token is replaced transparently');
  assert.equal(gh.state.tokenRequests, 2);
});

test('GitHub failures become clear messages; nothing is saved', async () => {
  gh.failNext(/^GET \/repos\/.*\/contents\//, 500);
  const a = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(a.status, 502);
  assert.match(a.data.error.message, /GitHub had a problem/);
  gh.failNetworkNext(/^GET \/repos\/.*\/pulls/);
  const b = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(b.status, 502);
  assert.match(b.data.error.message, /could not be reached/);
  gh.failNext(/^GET \/repos\/.*\/pulls/, 403);
  const c = await call('GET', '/api/m0-demo');
  assert.equal(c.status, 503);
  assert.match(c.data.error.message, /permission/);
  assert.equal(gh.state.writes.length, 0);
});

// ---------- the draft workflow ----------
test('load, edit, save: commits to a draft branch and opens ONE draft PR into the base branch; main untouched', async () => {
  const list = await call('GET', '/api/m0-demo');
  assert.equal(list.status, 200);
  assert.deepEqual(list.data.entries.map((e) => e.slug), ['m0-sample-article']);
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(loaded.data.source, 'published');
  assert.equal(loaded.data.sha, gitSha(SAMPLE));

  const edited = structuredClone(loaded.data.content);
  edited.en.title = 'M0 sample article, edited in the custom admin';
  const s1 = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: edited, expectedSha: loaded.data.sha } });
  assert.equal(s1.status, 200, JSON.stringify(s1.data));
  assert.equal(s1.data.changed, true);
  assert.equal(s1.data.draft.branch, 'cms/m0-demo/m0-sample-article');
  assert.equal(s1.data.draft.draft, true);
  assert.match(s1.data.draft.url, /\/pull\/\d+$/);
  assert.equal(gh.state.prs.length, 1);
  assert.equal(gh.state.prs[0].base.ref, BASE);
  assert.match(gh.state.prs[0].body, /publicly visible/);

  // Second save updates the same draft.
  edited.en.summary = 'Edited again: the same draft pull request is updated.';
  const s2 = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: edited, expectedSha: s1.data.sha } });
  assert.equal(s2.status, 200);
  assert.equal(gh.state.prs.length, 1, 'no duplicate pull request');
  assert.equal(s2.data.draft.number, s1.data.draft.number);

  // Loading now returns the draft version.
  const again = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(again.data.source, 'draft');
  assert.equal(again.data.content.en.summary, 'Edited again: the same draft pull request is updated.');

  // main and the base branch are unchanged; every write went to the draft branch.
  assert.equal(gh.fileOn('main', 'README.md'), 'main');
  assert.equal(gh.fileOn(BASE, FILE), SAMPLE);
  assert.ok(gh.state.writes.every((w) => w.branch === 'cms/m0-demo/m0-sample-article'), JSON.stringify(gh.state.writes));
  assert.ok(!gh.state.log.some((l) => /merge/i.test(l)), 'nothing is merged');
});

test('stale saves are refused: the draft changed on GitHub, or the base changed before the first save', async () => {
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  const c = structuredClone(loaded.data.content);
  c.en.title = 'A first edit of the demo article';
  const s1 = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: loaded.data.sha } });
  gh.externalEdit('cms/m0-demo/m0-sample-article', FILE, SAMPLE.replace('Dummy content.', 'Changed elsewhere.'));
  c.en.title = 'A second edit based on an old version';
  const stale = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: s1.data.sha } });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.error.conflict, true);
  assert.match(stale.data.error.message, /changed since you opened it/);
  assert.equal(gh.fileOn('cms/m0-demo/m0-sample-article', FILE).includes('Changed elsewhere.'), true, 'the newer change is kept');

  // Fresh repository: the base changes between loading and the first save.
  gh = createMockGitHub({ publicKey, branches: { main: {}, [BASE]: { [FILE]: SAMPLE } } });
  globalThis.fetch = gh.fetch;
  resetTokenCache();
  const l2 = await call('GET', '/api/m0-demo/m0-sample-article');
  gh.externalEdit(BASE, FILE, SAMPLE.replace('Dummy content.', 'Base moved.'));
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: l2.data.content, expectedSha: l2.data.sha } });
  assert.equal(r.status, 409);
  assert.equal(gh.state.branches['cms/m0-demo/m0-sample-article'], undefined, 'no branch created');
});

test('a save is refused if the GitHub write itself reports a conflict', async () => {
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  const c = structuredClone(loaded.data.content);
  c.en.title = 'Edited while someone else saves too';
  gh.failNext(/^PUT \/repos\/.*\/contents\//, 409);
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: loaded.data.sha } });
  assert.equal(r.status, 409);
  assert.equal(gh.state.prs.length, 0);
});

test('an unchanged save does nothing: no branch, no commit, no pull request', async () => {
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: loaded.data.content, expectedSha: loaded.data.sha } });
  assert.equal(r.status, 200);
  assert.equal(r.data.changed, false);
  assert.equal(gh.state.writes.length, 0);
});

test('a leftover branch at the head of a closed pull request starts over from the base version', async () => {
  gh.state.branches['cms/m0-demo/m0-sample-article'] = { head: 'f'.repeat(40), files: new Map([[FILE, 'stale leftover']]) };
  gh.addPr({ head: 'cms/m0-demo/m0-sample-article', base: BASE, state: 'closed' });
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  assert.equal(loaded.data.source, 'published');
  const c = structuredClone(loaded.data.content);
  c.en.title = 'Fresh draft after a closed one';
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: loaded.data.sha } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.ok(gh.state.writes.some((w) => w.method === 'PATCH'));
  assert.ok(gh.fileOn('cms/m0-demo/m0-sample-article', FILE).includes('Fresh draft after a closed one'));
});

test('a leftover branch holding work no closed pull request accounts for is never overwritten', async () => {
  gh.state.branches['cms/m0-demo/m0-sample-article'] = { head: 'e'.repeat(40), files: new Map([[FILE, 'unexpected work']]) };
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  const c = structuredClone(loaded.data.content);
  c.en.title = 'An edit that must not destroy other work';
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: loaded.data.sha } });
  assert.equal(r.status, 409);
  assert.equal(r.data.error.blocked, true);
  assert.equal(gh.fileOn('cms/m0-demo/m0-sample-article', FILE), 'unexpected work', 'the branch is untouched');
  assert.equal(gh.state.writes.length, 0);
});

// ---------- server-side scope ----------
test('client-supplied repository, branch and path are ignored; only known collections exist', async () => {
  const loaded = await call('GET', '/api/m0-demo/m0-sample-article');
  const c = structuredClone(loaded.data.content);
  c.en.title = 'Trying to redirect the write elsewhere';
  const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: c, expectedSha: loaded.data.sha, branch: 'main', repo: 'evil/other', path: 'src/pages/index.astro' } });
  assert.equal(r.status, 200);
  assert.ok(gh.state.writes.every((w) => w.branch === 'cms/m0-demo/m0-sample-article' && (!w.path.startsWith('/contents/') || w.path === `/contents/${FILE}`)));
  for (const p of ['/api/m0-demo/..%2F..%2Fsrc', '/api/m0-demo/Bad_Slug', '/api/m0-demo/a.b']) assert.equal((await call('GET', p)).status, 400, p);
  for (const p of ['/api/media', '/api/m0-demo/x/y/z', '/api/repos/gianniskim1990/techpi-website/contents/README.md']) assert.equal((await call('GET', p)).status, 404, p);
  assert.equal((await call('DELETE', '/api/m0-demo/m0-sample-article', { body: {} })).status, 405);
  assert.equal((await call('POST', '/api/m0-demo/m0-sample-article/publish', { body: {} })).status, 404, 'no publish endpoint exists');
});

test('main can never be the draft base in this version', async () => {
  for (const b of ['main', 'cms/m0-demo/x', '../main', 'a b']) {
    const r = await call('GET', '/api/m0-demo', { e: env({ CONTENT_BASE_BRANCH: b }) });
    assert.equal(r.status, 503, b);
  }
  assert.equal(gh.state.writes.length, 0);
});

test('invalid content is refused with field errors before anything is written', async () => {
  const sha = gitSha(SAMPLE);
  const cases = [
    { en: { title: 'Short', summary: 'x', body: 'y' } },
    { en: { title: 'A long enough title here', summary: 'x', body: 'y', script: '<script>' } },
    { el: { title: 'Μόνο ελληνικά εδώ τώρα', summary: 'x', body: 'y' } },
    { en: { title: 'A long enough title here', summary: 'x', body: 'y', cover: 'cover.webp' } },
    { en: { title: 'A long enough title here', summary: 'x', body: 'y', seoTitle: 'x'.repeat(71) } },
    'not an object',
  ];
  for (const content of cases) {
    const r = await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content, expectedSha: sha } });
    assert.equal(r.status, 422, JSON.stringify(content));
    assert.ok(r.data.error.fields);
  }
  assert.equal((await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: '{not json' })).status, 400);
  assert.equal((await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: { content: JSON.parse(SAMPLE) } })).status, 400, 'missing version');
  assert.equal((await call('POST', '/api/m0-demo/m0-sample-article/draft', { body: 'x'.repeat(70_000) })).status, 413);
  assert.equal(gh.state.writes.length, 0);
});

test('no response ever contains a credential', () => {
  const leaked = bodies.filter((b) => /ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer /.test(b));
  assert.equal(leaked.length, 0, leaked.slice(0, 2).join('\n'));
});
