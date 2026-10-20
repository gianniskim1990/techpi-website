// Task M2: the 7 Insights articles through the admin API (mocked GitHub). Covers load, edit, save and repeated saves for
// structurally different articles, isolation between articles (and from case studies), conflicts, locked facts and
// structure, the allowlist, English only, safe links, authorisation, and "never main".
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';
import { editableOf, INSIGHT_SLUGS } from '../shared/insight-content.js';

const ORIGIN = 'https://admin.example.test';
const AUD = 'test-aud-0001';
const ADMIN = 'admin@example.test';
const BASE = 'feat/techpi-admin-m2-insights';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fileOf = (slug) => `content/insights/${slug}/index.json`;
const draftOf = (slug) => `cms/insights/${slug}`;
const TEXT = Object.fromEntries(INSIGHT_SLUGS.map((s) => [s, fs.readFileSync(path.join(repo, fileOf(s)), 'utf8').replace(/\r\n/g, '\n')]));
const DOC = Object.fromEntries(INSIGHT_SLUGS.map((s) => [s, JSON.parse(TEXT[s])]));
const CS = 'content/case-studies/rocketeer/index.json';
const CS_TEXT = fs.readFileSync(path.join(repo, CS), 'utf8').replace(/\r\n/g, '\n');
const NOTE = 'how-analytics-can-support-dissemination-reporting';
const LIST_ONLY = 'what-communication-partners-should-ask-a-web-development-supplier';
const MIXED = 'what-every-eu-project-website-should-include';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });

let gh;
const env = (over = {}) => ({
  ACCESS_AUD: AUD, ADMIN_EMAILS: ADMIN, GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM,
  CONTENT_BASE_BRANCH: BASE, ASSETS: { fetch: async () => new Response('app') }, ...over,
});
const ctxFor = (email = ADMIN, aud = AUD) => ({ access: { aud, getIdentity: async () => ({ email }) } });
async function call(method, p, { body, headers = {}, ctx = ctxFor(), e = env() } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  const res = await worker.fetch(new Request(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), e, ctx);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}
const load = async (slug) => (await call('GET', `/api/insights/${slug}`)).data;
const save = (slug, content, expectedSha, extra = {}) => call('POST', `/api/insights/${slug}/draft`, { body: { content, expectedSha, ...extra } });
const edit = (doc, fn) => { const c = structuredClone(editableOf(doc)); fn(c.en, c); return c; };
const saved = (slug) => JSON.parse(gh.fileOn(draftOf(slug), fileOf(slug)));

beforeEach(() => {
  resetTokenCache();
  const base = Object.fromEntries(INSIGHT_SLUGS.map((s) => [fileOf(s), TEXT[s]]));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { ...base, [CS]: CS_TEXT } } });
  globalThis.fetch = gh.fetch;
});

// ---------- load ----------
test('the list shows the 7 articles in index order with dates, English only, no drafts yet', async () => {
  const r = await call('GET', '/api/insights');
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.entries.map((x) => x.slug), INSIGHT_SLUGS);
  assert.ok(r.data.entries.every((x) => x.draft === null && x.hasGreek === false && x.title && x.published));
  const s = await call('GET', '/api/session');
  assert.deepEqual(s.data.connected.insights, INSIGHT_SLUGS);
  assert.equal(s.data.connected.caseStudies.length, 18, 'case studies still connected');
});

test('every one of the 7 loads with its real content and version', async () => {
  for (const slug of INSIGHT_SLUGS) {
    const r = await call('GET', `/api/insights/${slug}`);
    assert.equal(r.status, 200, slug);
    assert.equal(r.data.sha, gitSha(TEXT[slug]));
    assert.deepEqual(r.data.content, DOC[slug]);
    assert.equal(r.data.source, 'published');
  }
  assert.equal(gh.state.writes.length, 0);
});

// ---------- save ----------
const EDITS = {
  [NOTE]: (en) => { en.note = en.note.replace('Cookies Policy](/cookies)', 'Cookies Policy](/cookies) and [EU Projects](/eu-projects)'); en.meta.title = 'Analytics for dissemination reporting | TechPi'; },
  [LIST_ONLY]: (en) => { en.sections[0].list[0] = 'An edited supplier question?'; en.sections[1].list.push('A new question about accessibility?'); },
  [MIXED]: (en) => { en.sections[1].after[0] += ' Edited.'; en.related = [...en.related].reverse(); en.lead += ' Edited.'; },
};

test('saves to three structurally different articles: one branch and one draft PR each, only their own file', async () => {
  const prs = {};
  for (const [slug, fn] of Object.entries(EDITS)) {
    const l = await load(slug);
    const r = await save(slug, edit(l.content, fn), l.sha);
    assert.equal(r.status, 200, `${slug}: ${r.text}`);
    assert.equal(r.data.draft.branch, draftOf(slug));
    prs[slug] = r.data.draft.number;
    assert.deepEqual(saved(slug).facts, DOC[slug].facts, `${slug}: facts unchanged`);
    assert.ok(!('el' in saved(slug)), 'still English only');
  }
  assert.equal(gh.state.prs.length, 3);
  assert.ok(gh.state.prs.every((p) => p.base.ref === BASE && p.draft && /English Insights article/.test(p.body) && /publicly visible/.test(p.body)));
  for (const w of gh.state.writes) {
    const slug = w.branch.replace('cms/insights/', '');
    assert.ok(EDITS[slug], `write on ${w.branch}`);
    if (w.path.startsWith('/contents/')) assert.equal(w.path, `/contents/${fileOf(slug)}`);
  }
  for (const slug of INSIGHT_SLUGS) assert.equal(gh.fileOn(BASE, fileOf(slug)), TEXT[slug], `${slug} unchanged on the base`);
  for (const slug of Object.keys(EDITS)) {
    for (const other of INSIGHT_SLUGS.filter((s) => s !== slug)) assert.equal(gh.fileOn(draftOf(slug), fileOf(other)), TEXT[other]);
    assert.equal(gh.fileOn(draftOf(slug), CS), CS_TEXT, 'case studies are untouched by an article draft');
  }
  assert.equal(gh.fileOn('main', 'README.md'), 'main');
  assert.deepEqual(saved(MIXED).en.related, [...DOC[MIXED].en.related].reverse(), 'related order saved as edited');
  const list = await call('GET', '/api/insights');
  assert.deepEqual(Object.fromEntries(list.data.entries.filter((x) => x.draft).map((x) => [x.slug, x.draft.number])), prs);
});

test('repeated saves update the same draft PR for that article', async () => {
  const l1 = await load(NOTE);
  const r1 = await save(NOTE, edit(l1.content, (en) => { en.title += ' (1)'; }), l1.sha);
  const l2 = await load(NOTE);
  assert.equal(l2.source, 'draft');
  const r2 = await save(NOTE, edit(l2.content, (en) => { en.title = en.title.replace('(1)', '(2)'); }), l2.sha);
  const r3 = await save(NOTE, edit(l2.content, (en) => { en.title = en.title.replace('(1)', '(3)'); }), r2.data.sha);
  assert.equal(r2.data.draft.number, r1.data.draft.number);
  assert.equal(r3.data.draft.number, r1.data.draft.number);
  assert.equal(gh.state.prs.length, 1);
  assert.match(saved(NOTE).en.title, /\(3\)$/);
});

test('an unchanged save writes nothing', async () => {
  for (const slug of [NOTE, LIST_ONLY]) {
    const l = await load(slug);
    const r = await save(slug, editableOf(l.content), l.sha);
    assert.equal(r.data.changed, false);
  }
  assert.equal(gh.state.writes.length, 0);
});

// ---------- conflicts ----------
test('conflicts: a newer draft, a moved base, another article’s version and a GitHub-side race are refused', async () => {
  const l = await load(MIXED);
  const s1 = await save(MIXED, edit(l.content, (en) => { en.lead += ' First.'; }), l.sha);
  const other = saved(MIXED); other.en.lead = 'Changed elsewhere on GitHub, a newer lead.';
  gh.externalEdit(draftOf(MIXED), fileOf(MIXED), JSON.stringify(other, null, 2) + '\n');
  const stale = await save(MIXED, edit(l.content, (en) => { en.lead += ' Second.'; }), s1.data.sha);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.error.conflict, true);
  assert.equal(saved(MIXED).en.lead, 'Changed elsewhere on GitHub, a newer lead.');

  const l2 = await load(LIST_ONLY);
  const moved = structuredClone(DOC[LIST_ONLY]); moved.en.lead = 'The base moved before the first save.';
  gh.externalEdit(BASE, fileOf(LIST_ONLY), JSON.stringify(moved, null, 2) + '\n');
  assert.equal((await save(LIST_ONLY, edit(l2.content, (en) => { en.title += '!'; }), l2.sha)).status, 409);
  assert.equal(gh.state.branches[draftOf(LIST_ONLY)], undefined);

  const a = await load(NOTE);
  assert.equal((await save('accessibility-considerations-for-project-websites', editableOf(DOC['accessibility-considerations-for-project-websites']), a.sha)).status, 409);
  gh.failNext(/^PUT \/repos\/.*\/contents\//, 409);
  assert.equal((await save(NOTE, edit(a.content, (en) => { en.title += '!'; }), a.sha)).status, 409);
});

// ---------- locked parts, English only, links, allowlist ----------
test('facts, structure, a Greek version and unsafe links cannot be saved', async () => {
  const l = await load(NOTE);
  const bad = [
    (en, c) => { c.facts = { published: '2026-01-01' }; },
    (en, c) => { c.el = structuredClone(en); },
    (en) => { en.sections.push({ heading: 'New section', paragraphs: ['x'] }); },
    (en) => { delete en.note; },
    (en) => { en.note = 'See [this](https://evil.example).'; },
    (en) => { en.note = 'See [this](javascript:alert(1)).'; },
    (en) => { en.note = 'See [this](/insights/not-an-article).'; },
    (en) => { en.related = ['not-an-article']; },
    (en) => { en.related = [NOTE]; },
    (en) => { en.meta.description = 'Too short.'; },
    (en) => { en.published = '2020-01-01'; },
  ];
  for (const fn of bad) assert.equal((await save(NOTE, edit(l.content, fn), l.sha)).status, 422, fn.toString());
  assert.equal(gh.state.writes.length, 0);
  const r = await save(NOTE, edit(l.content, (en) => { en.title += ' ok'; }), l.sha, { branch: 'main', repo: 'evil/other', path: 'src/pages/index.astro', slug: MIXED, facts: { published: '2020-01-01' } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(saved(NOTE).facts, DOC[NOTE].facts);
  assert.ok(gh.state.writes.every((w) => w.branch === draftOf(NOTE)));
});

test('only the 7 existing articles exist; everything else is refused before GitHub is asked', async () => {
  for (const slug of ['new-article', 'main', 'rocketeer', 'm0-sample-article']) {
    assert.equal((await call('GET', `/api/insights/${slug}`)).status, 404, slug);
    assert.equal((await save(slug, editableOf(DOC[NOTE]), gitSha(TEXT[NOTE]))).status, 404, slug);
  }
  for (const p of ['/api/insights/..%2F..%2Fsrc', '/api/insights/Bad_Slug', '/api/insights/a.b']) assert.equal((await call('GET', p)).status, 400, p);
  assert.equal((await call('POST', `/api/insights/${NOTE}/publish`, { body: {} })).status, 404, 'no publish endpoint');
  assert.equal((await call('POST', `/api/insights/${NOTE}/merge`, { body: {} })).status, 404, 'no merge endpoint');
  assert.equal((await call('DELETE', `/api/insights/${NOTE}`, { body: {} })).status, 405, 'no delete');
  assert.equal((await call('POST', '/api/insights', { body: {} })).status, 405, 'no create');
  assert.ok(!gh.state.log.some((l) => /new-article|m0-sample|insights\/rocketeer/.test(l)));
  assert.equal(gh.state.writes.length, 0);
});

test('authorisation and same-origin checks apply to every article', async () => {
  for (const slug of [NOTE, LIST_ONLY]) {
    for (const ctx of [{}, ctxFor(ADMIN, 'other-app'), ctxFor('intruder@example.test')]) {
      assert.equal((await call('GET', `/api/insights/${slug}`, { ctx })).status, 403);
      assert.equal((await call('POST', `/api/insights/${slug}/draft`, { ctx, body: { content: editableOf(DOC[slug]), expectedSha: gitSha(TEXT[slug]) } })).status, 403);
    }
    assert.equal((await call('POST', `/api/insights/${slug}/draft`, { headers: { Origin: 'https://evil.example' }, body: { content: editableOf(DOC[slug]), expectedSha: gitSha(TEXT[slug]) } })).status, 403);
    assert.equal((await call('GET', '/api/insights', { headers: { 'X-TechPi-Admin': '' } })).status, 403);
  }
  assert.equal(gh.state.log.length, 0);
});

test('main is never the draft base, and an invalid file on the base is not loaded or saved over', async () => {
  for (const b of ['main', 'cms/insights/x']) assert.equal((await call('GET', '/api/insights', { e: env({ CONTENT_BASE_BRANCH: b }) })).status, 503);
  const broken = structuredClone(DOC[NOTE]); broken.el = broken.en;
  gh.externalEdit(BASE, fileOf(NOTE), JSON.stringify(broken));
  assert.equal((await call('GET', `/api/insights/${NOTE}`)).status, 502);
  assert.equal((await call('GET', '/api/insights')).data.entries.length, 6);
  assert.equal(gh.state.writes.length, 0);
});

test('GitHub failures are friendly and no response contains a credential', async () => {
  gh.failNext(/^GET \/repos\/.*\/contents\//, 500);
  const f = await call('GET', `/api/insights/${LIST_ONLY}`);
  assert.equal(f.status, 502);
  const l = await load(LIST_ONLY);
  const r = await save(LIST_ONLY, edit(l.content, (en) => { en.title += ' check'; }), l.sha);
  assert.ok(!/ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer /.test(r.text + f.text + JSON.stringify(l)));
});
