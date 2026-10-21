// Task M4: the production content workflow (GitHub mocked). main becomes the published-content branch only with an
// explicit production configuration; the admin reads the 33 items from main, writes only to cms/* draft branches, opens
// draft PRs that target main, never writes to main, handles leftover branches from closed test PRs safely, and refuses
// requests on the wrong host or with local-test settings. Sign-in fails closed for anything unauthorised.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { assertDraftBranch, WriteRefused } from '../worker/api.js';
import { contentConfig, productionProblems } from '../worker/config.js';
import { resetTokenCache } from '../worker/github.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';
import { CONNECTED_SLUGS } from '../shared/case-study-content.js';
import { INSIGHT_SLUGS } from '../shared/insight-content.js';
import { PAGE_KEYS, editableOf as pageEditable } from '../shared/page-content.js';

const HOST = 'admin.techpi.eu';
const ORIGIN = `https://${HOST}`;
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(repo, rel), 'utf8').replace(/\r\n/g, '\n');
const FILES = Object.fromEntries([
  ...CONNECTED_SLUGS.map((s) => `content/case-studies/${s}/index.json`),
  ...INSIGHT_SLUGS.map((s) => `content/insights/${s}/index.json`),
  ...PAGE_KEYS.map((k) => `content/pages/${k}/index.json`),
].map((f) => [f, read(f)]));
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });

let gh;
const prodEnv = (over = {}) => ({
  CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main', ADMIN_HOSTNAME: HOST,
  ...authEnv, SESSION_SECRET: 'prod-like-secret-for-tests-only-9f8e7d6c5b4a39281706', GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM,
  ASSETS: { fetch: async () => new Response('<!doctype html><title>TechPi Admin</title>') }, ...over,
});
async function call(method, p, { body, headers = {}, ctx = ctxFor(), e = prodEnv(), origin = ORIGIN } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: origin, 'Content-Type': 'application/json' }), ...headers };
  const sessionHeader = await sessionCookie(ctx, { secret: e.SESSION_SECRET || SESSION_SECRET });
  if (sessionHeader && !h.Cookie) h.Cookie = sessionHeader;
  const res = await worker.fetch(new Request(origin + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), e, ctx);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

beforeEach(() => {
  resetTokenCache();
  // main holds the admin content (as it will after the consolidated release is merged), and an old development branch.
  gh = createMockGitHub({ publicKey, branches: { main: { ...FILES }, 'feat/techpi-admin-m3-website-pages': { ...FILES } } });
  globalThis.fetch = gh.fetch;
});

// ---------- configuration: fail closed ----------
test('main is accepted as the base only with an explicit production configuration', () => {
  assert.equal(contentConfig({}).ok, false, 'no base branch: fail closed (no default)');
  assert.match(contentConfig({}).problems.join(' '), /CONTENT_BASE_BRANCH is not set/);
  assert.equal(contentConfig({ CONTENT_BASE_BRANCH: 'main' }).ok, false, 'main in development mode is refused');
  assert.equal(contentConfig({ CONTENT_MODE: 'development', CONTENT_BASE_BRANCH: 'main' }).ok, false);
  assert.equal(contentConfig({ CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'feat/x' }).ok, false, 'production publishes through main only');
  assert.equal(contentConfig({ CONTENT_MODE: 'prod', CONTENT_BASE_BRANCH: 'main' }).ok, false, 'unknown mode');
  for (const b of ['cms/pages/home', '../main', 'a b', '/main', 'main/']) assert.equal(contentConfig({ CONTENT_BASE_BRANCH: b }).ok, false, b);
  assert.deepEqual(contentConfig({ CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main' }), { ok: true, mode: 'production', base: 'main', testContent: false, problems: [] });
  assert.equal(contentConfig({ CONTENT_BASE_BRANCH: 'feat/x' }).base, 'feat/x');
  assert.equal(contentConfig({ CONTENT_MODE: 'production', CONTENT_BASE_BRANCH: 'main', ENABLE_TEST_CONTENT: 'true' }).testContent, false);
});

test('production refuses the wrong host, plain HTTP and every local-test setting, before anything is served', () => {
  const ok = prodEnv();
  assert.deepEqual(productionProblems(ok, new URL(ORIGIN + '/')), []);
  for (const u of ['https://techpi-admin.example.workers.dev/', 'https://abc123-techpi-admin.example.workers.dev/', 'http://127.0.0.1:8787/', 'http://admin.techpi.eu/', 'https://techpi.eu/']) {
    assert.ok(productionProblems(ok, new URL(u)).length, u);
  }
  assert.ok(productionProblems(prodEnv({ ADMIN_HOSTNAME: '' }), new URL(ORIGIN)).length);
  assert.ok(productionProblems(prodEnv({ GITHUB_API_BASE: 'http://127.0.0.1:8920' }), new URL(ORIGIN)).length, 'the local GitHub mock override');
  assert.ok(productionProblems(prodEnv({ ENABLE_TEST_CONTENT: 'true' }), new URL(ORIGIN)).length);
  assert.ok(productionProblems(prodEnv({ SESSION_SECRET }), new URL(ORIGIN)).length, 'the local test session secret');
  assert.ok(productionProblems(prodEnv({ GITHUB_OAUTH_BASE: 'http://127.0.0.1:8920' }), new URL(ORIGIN)).length, 'the local OAuth mock override');
  assert.deepEqual(productionProblems({ CONTENT_BASE_BRANCH: 'feat/x' }, new URL('http://127.0.0.1:8787/')), [], 'development is unaffected');
});

test('sign-in fails closed in production: no session, forged session, other GitHub users, wrong host, and no static bypass', async () => {
  for (const ctx of [{}, ctxFor('owner', 'forged'), ctxFor('intruder')]) {
    for (const p of ['/', '/assets/index.js', '/api/session', '/api/pages']) assert.equal((await call('GET', p, { ctx })).status, 401, p);
  }
  for (const origin of ['https://techpi-admin.example.workers.dev', 'http://127.0.0.1:8787']) {
    for (const p of ['/', '/api/session']) assert.equal((await call('GET', p, { origin })).status, 503, `${origin}${p}`);
  }
  assert.equal((await call('GET', '/', { e: prodEnv({ SESSION_SECRET }) })).status, 503, 'the test session secret is not usable in production');
  assert.equal((await call('GET', '/')).status, 200, 'the owner gets the app');
  assert.equal(gh.state.log.length, 0, 'nothing reached GitHub');
});

// ---------- reading: the 33 items from main ----------
test('production reads all 33 items from main and reports the mode', async () => {
  const s = await call('GET', '/api/session');
  assert.equal(s.data.mode, 'production');
  assert.equal(s.data.baseBranch, 'main');
  assert.equal(s.data.connected.testContent, false);
  const counts = {};
  for (const [col, keys] of [['case-studies', CONNECTED_SLUGS], ['insights', INSIGHT_SLUGS], ['pages', PAGE_KEYS]]) {
    const list = await call('GET', `/api/${col}`);
    assert.equal(list.status, 200, col);
    assert.equal(list.data.baseBranch, 'main');
    assert.deepEqual(list.data.entries.map((e) => e.slug), keys);
    counts[col] = list.data.entries.length;
    for (const k of keys) {
      const r = await call('GET', `/api/${col}/${k}`);
      assert.equal(r.status, 200, `${col}/${k}`);
      assert.equal(r.data.source, 'published');
      assert.equal(r.data.sha, gitSha(FILES[Object.keys(FILES).find((f) => f.includes(`/${col}/${k}/`))]));
    }
  }
  assert.deepEqual(counts, { 'case-studies': 18, insights: 7, pages: 8 });
  assert.ok(gh.state.log.filter((l) => l.includes('/contents/')).every((l) => l.includes('ref=main')), 'every published read is from main');
  assert.equal(gh.state.writes.length, 0);
});

test('a main without the admin content is reported, not shown as empty', async () => {
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' } } });
  globalThis.fetch = gh.fetch;
  resetTokenCache();
  for (const col of ['case-studies', 'insights', 'pages']) {
    const r = await call('GET', `/api/${col}`);
    assert.equal(r.status, 503, col);
    assert.match(r.data.error.message, /not on main yet/);
  }
});

// ---------- writing: only cms/*, PRs into main ----------
test('a save writes only to its cms/* draft branch and opens a draft PR into main; main is untouched', async () => {
  const l = await call('GET', '/api/pages/about');
  const c = pageEditable(l.data.content);
  c.en.changeHeading = 'What stayed and what changed';
  const r = await call('POST', '/api/pages/about/draft', { body: { content: c, expectedSha: l.data.sha } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.data.draft.branch, 'cms/pages/about');
  const pr = gh.state.prs[0];
  assert.equal(pr.base.ref, 'main');
  assert.equal(pr.draft, true);
  assert.match(pr.body, /Saving in the admin is not publishing/);
  assert.match(pr.body, /required checks/);
  assert.ok(gh.state.writes.every((w) => w.branch === 'cms/pages/about'), JSON.stringify(gh.state.writes));
  assert.deepEqual(Object.fromEntries(Object.entries(FILES).map(([f]) => [f, gh.fileOn('main', f)])), FILES, 'main unchanged');
  // English then Greek: the same PR.
  const l2 = await call('GET', '/api/pages/about');
  assert.equal(l2.data.source, 'draft');
  const c2 = pageEditable(l2.data.content);
  c2.el.changeHeading = 'Τι έμεινε και τι άλλαξε';
  const r2 = await call('POST', '/api/pages/about/draft', { body: { content: c2, expectedSha: l2.data.sha } });
  assert.equal(r2.data.draft.number, r.data.draft.number);
  assert.equal(gh.state.prs.length, 1);
});

test('no API request can write to main: no endpoint, no client-chosen branch, and the write guard', async () => {
  const l = await call('GET', '/api/case-studies/rocketeer');
  const c = { en: l.data.content.en, el: l.data.content.el };
  c.en.summary += ' Edited.';
  const r = await call('POST', '/api/case-studies/rocketeer/draft', { body: { content: c, expectedSha: l.data.sha, branch: 'main', base: 'main', repo: 'other/repo', path: 'src/pages/index.astro' } });
  assert.equal(r.status, 200);
  assert.ok(gh.state.writes.every((w) => w.branch.startsWith('cms/')));
  for (const p of ['/api/main', '/api/case-studies/rocketeer/publish', '/api/case-studies/rocketeer/merge', '/api/pages/home/publish', '/api/git/refs/heads/main', '/api/repos/gianniskim1990/techpi-website/contents/README.md']) {
    assert.ok([404, 405].includes((await call('POST', p, { body: {} })).status), p);
  }
  for (const m of ['PUT', 'PATCH', 'DELETE']) assert.ok([404, 405].includes((await call(m, '/api/pages/home', { body: {} })).status), m);
  // The guard itself.
  for (const b of ['main', 'feat/techpi-admin-m3-website-pages', 'cms/pages/../main', 'cms/unknown/home', 'cms/pages/Home', 'refs/heads/main']) assert.throws(() => assertDraftBranch(b, 'main'), WriteRefused, b);
  assert.throws(() => assertDraftBranch('cms/pages/home', 'cms/pages/home'), WriteRefused, 'never the base');
  assert.equal(assertDraftBranch('cms/pages/eu-projects', 'main'), 'cms/pages/eu-projects');
  assert.equal(gh.fileOn('main', 'content/case-studies/rocketeer/index.json'), FILES['content/case-studies/rocketeer/index.json']);
});

test('the M0 test collection does not exist in production', async () => {
  for (const p of ['/api/m0-demo', '/api/m0-demo/m0-sample-article']) assert.equal((await call('GET', p)).status, 404, p);
});

// ---------- leftover branches from the development test PRs ----------
test('a leftover branch at the head of a closed test PR is reset to main and used for a new PR into main', async () => {
  const branch = 'cms/pages/contact';
  gh.state.branches[branch] = { head: 'c'.repeat(40), files: new Map([...Object.entries(FILES)].map(([f, t]) => [f, f.endsWith('contact/index.json') ? t.replace('Have something worth building?', 'An old test edit') : t])) };
  const old = gh.addPr({ head: branch, base: 'feat/techpi-admin-m3-website-pages', state: 'closed' });
  const l = await call('GET', '/api/pages/contact');
  assert.equal(l.data.source, 'published', 'the old test edit is not shown as a draft');
  assert.equal(l.data.elsewhere, null);
  const c = pageEditable(l.data.content);
  c.en.lead = 'Tell us about the problem you need to solve, briefly.';
  const r = await call('POST', '/api/pages/contact/draft', { body: { content: c, expectedSha: l.data.sha } });
  assert.equal(r.status, 200, r.text);
  const saved = JSON.parse(gh.fileOn(branch, 'content/pages/contact/index.json'));
  assert.equal(saved.en.heading, 'Have something worth building?', 'the stale test edit is gone: the branch started over from main');
  assert.equal(saved.en.lead, 'Tell us about the problem you need to solve, briefly.');
  const pr = gh.state.prs.find((p) => p.number === r.data.draft.number);
  assert.notEqual(pr.number, old);
  assert.equal(pr.base.ref, 'main');
});

test('a branch with an open PR for another base is never reset; the editor is told before saving', async () => {
  const branch = 'cms/insights/what-every-eu-project-website-should-include';
  gh.state.branches[branch] = { head: 'd'.repeat(40), files: new Map(Object.entries(FILES)) };
  const open = gh.addPr({ head: branch, base: 'feat/techpi-admin-m3-website-pages', state: 'open' });
  const l = await call('GET', '/api/insights/what-every-eu-project-website-should-include');
  assert.deepEqual({ number: l.data.elsewhere?.number, base: l.data.elsewhere?.base }, { number: open, base: 'feat/techpi-admin-m3-website-pages' });
  const c = { en: { ...l.data.content.en, title: `${l.data.content.en.title} (edited)` } };
  const r = await call('POST', '/api/insights/what-every-eu-project-website-should-include/draft', { body: { content: c, expectedSha: l.data.sha } });
  assert.equal(r.status, 409);
  assert.equal(r.data.error.blocked, true);
  assert.match(r.data.error.message, new RegExp(`#${open}`));
  assert.equal(gh.state.branches[branch].head, 'd'.repeat(40), 'not reset');
  assert.equal(gh.state.writes.length, 0);
});

test('a branch with commits no closed PR accounts for is never overwritten', async () => {
  const branch = 'cms/case-studies/rocketeer';
  gh.state.branches[branch] = { head: 'b'.repeat(40), files: new Map(Object.entries(FILES)) };
  gh.addPr({ head: branch, base: 'feat/techpi-admin-m1a-rocketeer', state: 'closed' });
  gh.state.branches[branch].head = 'a'.repeat(40); // a commit after the PR was closed
  const l = await call('GET', '/api/case-studies/rocketeer');
  const c = { en: { ...l.data.content.en, summary: `${l.data.content.en.summary} Edited.` }, el: l.data.content.el };
  const r = await call('POST', '/api/case-studies/rocketeer/draft', { body: { content: c, expectedSha: l.data.sha } });
  assert.equal(r.status, 409);
  assert.equal(r.data.error.blocked, true);
  assert.equal(gh.state.branches[branch].head, 'a'.repeat(40));
  assert.equal(gh.state.writes.length, 0);
});

test('an open draft PR into main is reused, and a conflict on it is still detected', async () => {
  const l = await call('GET', '/api/pages/work');
  const c = pageEditable(l.data.content);
  c.en.filterAll = 'All projects';
  const s1 = await call('POST', '/api/pages/work/draft', { body: { content: c, expectedSha: l.data.sha } });
  const stale = await call('POST', '/api/pages/work/draft', { body: { content: c, expectedSha: l.data.sha } });
  assert.equal(stale.status, 409, 'the version from before the first save is stale');
  const l2 = await call('GET', '/api/pages/work');
  const c2 = pageEditable(l2.data.content);
  c2.el.filterAll = 'Όλα τα έργα μας';
  const s2 = await call('POST', '/api/pages/work/draft', { body: { content: c2, expectedSha: l2.data.sha } });
  assert.equal(s2.data.draft.number, s1.data.draft.number);
  gh.closePr(s1.data.draft.number); // the owner merged or closed it on GitHub
  const l3 = await call('GET', '/api/pages/work');
  assert.equal(l3.data.source, 'published', 'after the PR is closed the admin shows main again');
});

test('no response contains a credential', async () => {
  const bodies = [];
  for (const p of ['/api/session', '/api/pages', '/api/pages/privacy', '/api/case-studies/emoved']) bodies.push((await call('GET', p)).text);
  assert.ok(!/ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer |GITHUB_APP_PRIVATE_KEY/.test(bodies.join('\n')));
});

// ---------- the committed configuration files ----------
const jsonc = (file) => JSON.parse(fs.readFileSync(path.join(repo, 'admin', file), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
test('the committed configurations: no public hostnames, no Access, no secrets; main only in the production template', () => {
  const dev = jsonc('wrangler.jsonc');
  const prod = jsonc('wrangler.production.example.jsonc');
  for (const c of [dev, prod]) {
    assert.equal(c.workers_dev, false, 'no workers.dev hostname');
    assert.equal(c.preview_urls, false, 'no preview URLs');
    assert.equal(c.assets.run_worker_first, true, 'static files go through the Worker checks');
    assert.ok(!('access' in c), 'no Access configuration');
    for (const secret of ['GITHUB_APP_PRIVATE_KEY', 'GITHUB_OAUTH_CLIENT_SECRET', 'SESSION_SECRET', 'GITHUB_API_BASE', 'GITHUB_OAUTH_BASE', 'ENABLE_TEST_CONTENT', 'ACCESS_AUD', 'ADMIN_EMAILS']) assert.ok(!(secret in c.vars), `${secret} is not committed`);
    assert.equal(c.vars.GITHUB_OAUTH_CLIENT_ID, '', 'no client ID committed');
    assert.equal(c.vars.ADMIN_GITHUB_USER_ID, '', 'no user ID committed');
  }
  assert.deepEqual(contentConfig(dev.vars).mode, 'development');
  assert.notEqual(dev.vars.CONTENT_BASE_BRANCH, 'main', 'the committed config does not point at main before the release is merged');
  assert.deepEqual([prod.vars.CONTENT_MODE, prod.vars.CONTENT_BASE_BRANCH, prod.vars.ADMIN_HOSTNAME], ['production', 'main', 'admin.techpi.eu']);
  assert.ok(contentConfig(prod.vars).ok);
  const text = ['wrangler.jsonc', 'wrangler.production.example.jsonc', 'wrangler.local.example.jsonc'].map((f) => fs.readFileSync(path.join(repo, 'admin', f), 'utf8')).join('\n');
  assert.ok(!/BEGIN (RSA )?PRIVATE KEY|ghs_|ghp_|github_pat_/.test(text));
});
