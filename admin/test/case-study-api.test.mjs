// Tasks M1A/M1B: all 18 case studies through the admin API (mocked GitHub). Covers load, edit, save and repeated saves
// for different shapes, isolation between case studies, conflicts, locked facts and sections, the allowlist,
// validation and parity, authorisation, and "never main".
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';
import { editableOf, CONNECTED_SLUGS } from '../shared/case-study-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m1b-all-case-studies';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fileOf = (slug) => `content/case-studies/${slug}/index.json`;
const draftOf = (slug) => `cms/case-studies/${slug}`;
const TEXT = Object.fromEntries(CONNECTED_SLUGS.map((s) => [s, fs.readFileSync(path.join(repo, fileOf(s)), 'utf8').replace(/\r\n/g, '\n')]));
const DOC = Object.fromEntries(CONNECTED_SLUGS.map((s) => [s, JSON.parse(TEXT[s])]));
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });

let gh;
const env = (over = {}) => ({
  ...authEnv, GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM,
  CONTENT_BASE_BRANCH: BASE, ASSETS: { fetch: async () => new Response('app') }, ...over,
});
async function call(method, p, { body, headers = {}, ctx = ctxFor(), e = env() } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  const sessionHeader = await sessionCookie(ctx, { secret: e.SESSION_SECRET || SESSION_SECRET });
  if (sessionHeader && !h.Cookie) h.Cookie = sessionHeader;
  const res = await worker.fetch(new Request(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), e, ctx);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}
const load = async (slug) => (await call('GET', `/api/case-studies/${slug}`)).data;
const save = (slug, content, expectedSha, extra = {}) => call('POST', `/api/case-studies/${slug}/draft`, { body: { content, expectedSha, ...extra } });
const edit = (doc, fn) => { const c = structuredClone(editableOf(doc)); fn(c); return c; };
const saved = (slug) => JSON.parse(gh.fileOn(draftOf(slug), fileOf(slug)));

beforeEach(() => {
  resetTokenCache();
  const base = Object.fromEntries(CONNECTED_SLUGS.map((s) => [fileOf(s), TEXT[s]]));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: base } });
  globalThis.fetch = gh.fetch;
});

// ---------- load ----------
test('the list shows all 18 case studies in Work-page order, with no drafts yet', async () => {
  const r = await call('GET', '/api/case-studies');
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.entries.map((x) => x.slug), CONNECTED_SLUGS);
  assert.ok(r.data.entries.every((x) => x.draft === null && x.hasGreek && x.name));
  const s = await call('GET', '/api/session');
  assert.deepEqual(s.data.connected.caseStudies, CONNECTED_SLUGS);
});

test('every one of the 18 loads with its real content, version and locked facts', async () => {
  for (const slug of CONNECTED_SLUGS) {
    const r = await call('GET', `/api/case-studies/${slug}`);
    assert.equal(r.status, 200, slug);
    assert.equal(r.data.sha, gitSha(TEXT[slug]), slug);
    assert.deepEqual(r.data.content, DOC[slug], slug);
    assert.equal(r.data.source, 'published');
  }
  assert.equal(gh.state.writes.length, 0);
});

// ---------- save: different shapes, isolation, repeated saves ----------
const EDITS = {
  rocketeer: (c) => { c.en.summary += ' Edited.'; c.el.summary += ' Επεξεργασία.'; c.en.galleryAlts[0] += ' Edited.'; },
  'logotherapia-xanthi': (c) => { c.en.coverCaption = 'Edited caption.'; c.el.coverCaption = 'Νέα λεζάντα.'; },
  saloon: (c) => { c.en.highlights[0] = 'Edited highlight'; c.el.highlights[0] = 'Νέο'; c.en.services.push('New service'); c.el.services.push('Νέα υπηρεσία'); },
  'juliette-coffee-roasters': (c) => { c.en.disciplines[0] = 'Edited discipline'; c.el.builtIntro += ' Δοκιμή.'; },
};

test('saves to four differently shaped case studies: one branch and one draft PR each, each touching only its own file', async () => {
  const prs = {};
  for (const [slug, fn] of Object.entries(EDITS)) {
    const l = await load(slug);
    const r = await save(slug, edit(l.content, fn), l.sha);
    assert.equal(r.status, 200, `${slug}: ${r.text}`);
    assert.equal(r.data.draft.branch, draftOf(slug));
    prs[slug] = r.data.draft.number;
    const doc = saved(slug);
    assert.deepEqual(doc.facts, DOC[slug].facts, `${slug} facts unchanged`);
    assert.deepEqual(doc.images, DOC[slug].images, `${slug} images unchanged`);
  }
  assert.equal(gh.state.prs.length, 4);
  assert.equal(new Set(Object.values(prs)).size, 4, 'a separate PR per case study');
  assert.ok(gh.state.prs.every((p) => p.base.ref === BASE && p.draft));
  for (const w of gh.state.writes) {
    const slug = w.branch.replace('cms/case-studies/', '');
    assert.ok(EDITS[slug], `write on ${w.branch}`);
    if (w.path.startsWith('/contents/')) assert.equal(w.path, `/contents/${fileOf(slug)}`, 'a branch only receives its own file');
  }
  // Every other case study and the base are untouched.
  for (const slug of CONNECTED_SLUGS) assert.equal(gh.fileOn(BASE, fileOf(slug)), TEXT[slug], `${slug} unchanged on the base`);
  for (const slug of Object.keys(EDITS)) for (const other of CONNECTED_SLUGS.filter((s) => s !== slug)) {
    assert.equal(gh.fileOn(draftOf(slug), fileOf(other)), TEXT[other], `${other} unchanged on ${draftOf(slug)}`);
  }
  assert.equal(gh.fileOn('main', 'README.md'), 'main');

  // The list now shows exactly those four drafts.
  const list = await call('GET', '/api/case-studies');
  const withDraft = list.data.entries.filter((x) => x.draft).map((x) => [x.slug, x.draft.number]);
  assert.deepEqual(Object.fromEntries(withDraft), prs);
});

test('repeated saves update the same PR for that case study, never another one', async () => {
  const a1 = await load('mavie');
  const r1 = await save('mavie', edit(a1.content, (c) => { c.en.summary += ' One.'; }), a1.sha);
  const b1 = await load('emoved');
  const s1 = await save('emoved', edit(b1.content, (c) => { c.en.summary += ' One.'; }), b1.sha);
  const a2 = await load('mavie');
  assert.equal(a2.source, 'draft');
  const r2 = await save('mavie', edit(a2.content, (c) => { c.el.summary += ' Δύο.'; }), a2.sha);
  const r3 = await save('mavie', edit(a2.content, (c) => { c.el.summary += ' Δύο. Τρία.'; }), r2.data.sha);
  assert.equal(r2.data.draft.number, r1.data.draft.number);
  assert.equal(r3.data.draft.number, r1.data.draft.number);
  assert.notEqual(s1.data.draft.number, r1.data.draft.number);
  assert.equal(gh.state.prs.length, 2);
  assert.match(saved('mavie').el.summary, /Τρία\.$/);
  assert.match(saved('emoved').en.summary, /One\.$/);
});

test('an unchanged save writes nothing', async () => {
  for (const slug of ['rantevo', 'apox-fc']) {
    const l = await load(slug);
    const r = await save(slug, editableOf(l.content), l.sha);
    assert.equal(r.status, 200);
    assert.equal(r.data.changed, false);
  }
  assert.equal(gh.state.writes.length, 0);
});

// ---------- conflicts ----------
test('conflicts: a newer draft, a moved base, and a version from another case study are all refused', async () => {
  const l = await load('physio');
  const c = edit(l.content, (x) => { x.en.summary += ' First.'; });
  const s1 = await save('physio', c, l.sha);
  const other = saved('physio'); other.en.summary = 'Changed elsewhere.';
  gh.externalEdit(draftOf('physio'), fileOf('physio'), JSON.stringify(other, null, 2) + '\n');
  const stale = await save('physio', edit(l.content, (x) => { x.en.summary += ' Second.'; }), s1.data.sha);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.error.conflict, true);
  assert.equal(saved('physio').en.summary, 'Changed elsewhere.', 'the newer change is kept');

  const l2 = await load('iliastech');
  const moved = structuredClone(DOC.iliastech); moved.en.summary = 'Base moved.';
  gh.externalEdit(BASE, fileOf('iliastech'), JSON.stringify(moved, null, 2) + '\n');
  assert.equal((await save('iliastech', edit(l2.content, (x) => { x.en.summary += '!'; }), l2.sha)).status, 409);
  assert.equal(gh.state.branches[draftOf('iliastech')], undefined);

  const armans = await load('armans');
  const cross = await save('project4you', editableOf(DOC.project4you), armans.sha);
  assert.equal(cross.status, 409, 'the version of one case study is not accepted for another');

  gh.failNext(/^PUT \/repos\/.*\/contents\//, 409);
  const raced = await load('mavie');
  assert.equal((await save('mavie', edit(raced.content, (x) => { x.en.summary += '!'; }), raced.sha)).status, 409);
});

// ---------- locked facts, sections, the allowlist ----------
test('facts, images and sections cannot be changed through a save', async () => {
  const l = await load('saloon');
  for (const bad of [(c) => { c.facts = { featured: true }; }, (c) => { c.images = {}; }, (c) => { c.en.disciplines = ['x']; c.el.disciplines = ['x']; }, (c) => { delete c.en.highlights; delete c.el.highlights; }, (c) => { c.en.imageAlt = 'x'; c.el.imageAlt = 'x'; }]) {
    assert.equal((await save('saloon', edit(l.content, bad), l.sha)).status, 422);
  }
  assert.equal(gh.state.writes.length, 0);
  const r = await save('saloon', edit(l.content, (c) => { c.en.summary += ' Ok.'; }), l.sha, { branch: 'main', repo: 'evil/other', path: 'src/pages/index.astro', slug: 'armans', facts: { featured: true } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(saved('saloon').facts, DOC.saloon.facts);
  assert.ok(gh.state.writes.every((w) => w.branch === draftOf('saloon')));
});

test('only the 18 published case studies exist; everything else is refused before GitHub is asked', async () => {
  for (const slug of ['new-project', 'main', 'rocketeer-2', 'm0-sample-article']) {
    assert.equal((await call('GET', `/api/case-studies/${slug}`)).status, 404, slug);
    assert.equal((await save(slug, editableOf(DOC.rocketeer), gitSha(TEXT.rocketeer))).status, 404, slug);
  }
  for (const p of ['/api/case-studies/..%2F..%2Fsrc', '/api/case-studies/Bad_Slug', '/api/case-studies/a.b']) assert.equal((await call('GET', p)).status, 400, p);
  assert.equal((await call('POST', '/api/case-studies/rocketeer/publish', { body: {} })).status, 404, 'no publish endpoint');
  assert.equal((await call('DELETE', '/api/case-studies/rocketeer', { body: {} })).status, 405);
  assert.equal((await call('POST', '/api/case-studies', { body: {} })).status, 405, 'no create endpoint');
  assert.ok(!gh.state.log.some((l) => /new-project|rocketeer-2|m0-sample/.test(l)));
  assert.equal(gh.state.writes.length, 0);
});

test('authorisation applies to every case study', async () => {
  for (const slug of ['rocketeer', 'emoved']) {
    for (const ctx of [{}, ctxFor('owner', 'forged'), ctxFor('intruder')]) {
      assert.equal((await call('GET', `/api/case-studies/${slug}`, { ctx })).status, 401);
      assert.equal((await call('POST', `/api/case-studies/${slug}/draft`, { ctx, body: { content: editableOf(DOC[slug]), expectedSha: gitSha(TEXT[slug]) } })).status, 401);
    }
    assert.equal((await call('POST', `/api/case-studies/${slug}/draft`, { headers: { Origin: 'https://evil.example' }, body: { content: editableOf(DOC[slug]), expectedSha: gitSha(TEXT[slug]) } })).status, 403);
  }
  assert.equal(gh.state.log.length, 0);
});

test('main is never the draft base', async () => {
  for (const b of ['main', 'cms/case-studies/x']) assert.equal((await call('GET', '/api/case-studies', { e: env({ CONTENT_BASE_BRANCH: b }) })).status, 503);
  assert.equal(gh.state.writes.length, 0);
});

// ---------- validation ----------
test('invalid text is refused with field errors, for several shapes, and nothing is written', async () => {
  const cases = [
    ['rocketeer', (x) => { x.en.summary = ''; }, 'en.summary'],
    ['rocketeer', (x) => { x.en.category = 'Has <b>markup</b>'; }, 'en.category'],
    ['rantevo', (x) => { x.el.coverCaption = 'Line one\nline two'; }, 'el.coverCaption'],
    ['saloon', (x) => { x.en.highlights[0] = ' '; }, 'en.highlights.0'],
    ['level-up-education', (x) => { x.el.disciplines.push('Μόνο ελληνικά'); }, 'el.disciplines'],
    ['mavie', (x) => { x.en.need[0] = 'x'.repeat(1501); }, 'en.need.0'],
    ['armans', (x) => { x.el.galleryAlts = []; }, 'el.galleryAlts'],
    ['emoved', (x) => { delete x.el; }, 'el.entry'],
  ];
  for (const [slug, mutate, field] of cases) {
    const l = await load(slug);
    const r = await save(slug, edit(l.content, mutate), l.sha);
    assert.equal(r.status, 422, `${slug} ${field}`);
    assert.ok(r.data.error.fields[field], `${slug} ${field}: ${JSON.stringify(r.data.error.fields)}`);
  }
  assert.equal(gh.state.writes.length, 0);
});

test('an invalid or misplaced file on the base is not loaded or saved over', async () => {
  const misplaced = structuredClone(DOC.rocketeer); misplaced.facts.slug = 'armans';
  gh.externalEdit(BASE, fileOf('rocketeer'), JSON.stringify(misplaced));
  assert.equal((await call('GET', '/api/case-studies/rocketeer')).status, 502);
  const list = await call('GET', '/api/case-studies');
  assert.equal(list.data.entries.length, 17, 'the broken one is left out; the others still load');
  assert.equal(gh.state.writes.length, 0);
});

test('GitHub failures are friendly and no response contains a credential', async () => {
  gh.failNext(/^GET \/repos\/.*\/contents\//, 500);
  const f = await call('GET', '/api/case-studies/physio');
  assert.equal(f.status, 502);
  assert.match(f.data.error.message, /GitHub had a problem/);
  const l = await load('physio');
  const r = await save('physio', edit(l.content, (x) => { x.en.summary += ' Check.'; }), l.sha);
  assert.ok(!/ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer /.test(r.text + f.text + JSON.stringify(l)));
});
