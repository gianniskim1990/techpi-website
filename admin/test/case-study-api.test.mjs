// Task M1A: the Rocketeer case study through the admin API (mocked GitHub). Covers load, edit, save, repeated saves,
// conflicts, the locked facts and images, the one-case-study allowlist, validation and parity, and "never main".
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';
import { validateDocument, serializeDocument, editableOf, CONNECTED_SLUGS } from '../shared/case-study-content.js';

const ORIGIN = 'https://admin.example.test';
const AUD = 'test-aud-0001';
const ADMIN = 'admin@example.test';
const BASE = 'feat/techpi-admin-m1a-rocketeer';
const FILE = 'content/case-studies/rocketeer/index.json';
const DRAFT = 'cms/case-studies/rocketeer';
const here = path.dirname(fileURLToPath(import.meta.url));
const COMMITTED = fs.readFileSync(path.join(here, '..', '..', FILE), 'utf8').replace(/\r\n/g, '\n');
const DOC = JSON.parse(COMMITTED);
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
const load = async () => (await call('GET', '/api/case-studies/rocketeer')).data;
const save = (content, expectedSha, extra = {}) => call('POST', '/api/case-studies/rocketeer/draft', { body: { content, expectedSha, ...extra } });
const edit = (doc, fn) => { const c = structuredClone(editableOf(doc)); fn(c); return c; };
const fileOn = (branch) => JSON.parse(gh.fileOn(branch, FILE));

beforeEach(() => {
  resetTokenCache();
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { [FILE]: COMMITTED, 'content/case-studies/armans/index.json': '{}' } } });
  globalThis.fetch = gh.fetch;
});

// ---------- the committed content ----------
test('the committed Rocketeer file is valid, canonical and complete in both languages', () => {
  const v = validateDocument(DOC, 'rocketeer');
  assert.deepEqual(v.problems, []);
  assert.equal(serializeDocument(DOC, editableOf(DOC)), COMMITTED, 'saving it unchanged reproduces the file byte for byte');
  for (const key of Object.keys(DOC.en)) {
    assert.ok(key in DOC.el, `Greek has ${key}`);
    if (Array.isArray(DOC.en[key])) assert.equal(DOC.el[key].length, DOC.en[key].length, `EN/EL parity of ${key}`);
  }
  assert.equal(DOC.en.galleryAlts.length, DOC.images.gallery.length);
  assert.ok([DOC.en.imageAlt, DOC.en.coverAlt, DOC.el.imageAlt, DOC.el.coverAlt, ...DOC.en.galleryAlts, ...DOC.el.galleryAlts].every((a) => a.length > 20), 'every image has real alt text in both languages');
  assert.ok(/[Α-Ωα-ω]/.test(DOC.el.summary) && !/[Α-Ωα-ω]/.test(DOC.en.summary), 'Greek text is Greek, English is English');
  assert.deepEqual(CONNECTED_SLUGS, ['rocketeer'], 'only Rocketeer is connected');
});

test('every image id in the file has a file with the declared size (also checked by scripts/assets)', () => {
  const dir = path.join(here, '..', '..', 'src', 'assets', 'projects');
  for (const im of [DOC.images.image, DOC.images.cover, ...DOC.images.gallery]) assert.ok(fs.existsSync(path.join(dir, `${im.id}.png`)), im.id);
});

// ---------- load, edit, save ----------
test('connected list and load return Rocketeer with its locked facts and both languages', async () => {
  const list = await call('GET', '/api/case-studies');
  assert.equal(list.status, 200);
  assert.deepEqual(list.data.entries.map((x) => x.slug), ['rocketeer']);
  assert.equal(list.data.entries[0].name, 'Rocketeer');
  const r = await call('GET', '/api/case-studies/rocketeer');
  assert.equal(r.status, 200);
  assert.equal(r.data.source, 'published');
  assert.equal(r.data.sha, gitSha(COMMITTED));
  assert.equal(r.data.content.facts.featured, true);
  assert.equal(r.data.content.facts.order, 1);
  assert.ok(r.data.content.en && r.data.content.el);
  const s = await call('GET', '/api/session');
  assert.deepEqual(s.data.connected.caseStudies, ['rocketeer']);
  assert.equal(s.data.publishing, false);
});

test('edit English and Greek, save: one draft branch and one draft PR into the M1A branch; main and the base untouched', async () => {
  const loaded = await load();
  const c = edit(loaded.content, (x) => {
    x.en.summary = 'A custom web application that organises delivery requests, drivers and assignments in one place. Edited.';
    x.el.summary = 'Web εφαρμογή που οργανώνει σε ένα σημείο αιτήματα διανομής, οδηγούς και αναθέσεις. Επεξεργασμένο.';
    x.en.outcome[0] = 'Businesses, drivers and requests are managed in one place, edited.';
    x.el.outcome[0] = 'Επιχειρήσεις, οδηγοί και αιτήματα διαχειρίζονται από ένα σημείο, επεξεργασμένο.';
    x.en.galleryAlts[0] = 'The Rocketeer sign-in screen, with the logo above an email and password form, edited.';
    x.el.galleryAlts[0] = 'Η οθόνη σύνδεσης του Rocketeer, με το λογότυπο πάνω από τη φόρμα, επεξεργασμένο.';
  });
  const r1 = await save(c, loaded.sha);
  assert.equal(r1.status, 200, r1.text);
  assert.equal(r1.data.changed, true);
  assert.equal(r1.data.draft.branch, DRAFT);
  assert.equal(r1.data.draft.draft, true);
  assert.equal(gh.state.prs.length, 1);
  assert.equal(gh.state.prs[0].base.ref, BASE);
  assert.match(gh.state.prs[0].body, /publicly visible/);
  assert.match(gh.state.prs[0].body, /does not change techpi\.eu/);

  const saved = fileOn(DRAFT);
  assert.deepEqual(saved.facts, DOC.facts, 'facts unchanged');
  assert.deepEqual(saved.images, DOC.images, 'images unchanged');
  assert.equal(saved.el.outcome[0], 'Επιχειρήσεις, οδηγοί και αιτήματα διαχειρίζονται από ένα σημείο, επεξεργασμένο.');
  assert.deepEqual(saved.en.need, DOC.en.need, 'untouched fields unchanged');

  // A second save updates the same draft.
  c.en.category = 'Delivery operations platform (edited)';
  const r2 = await save(c, r1.data.sha);
  assert.equal(r2.status, 200);
  assert.equal(gh.state.prs.length, 1, 'no duplicate pull request');
  assert.equal(r2.data.draft.number, r1.data.draft.number);
  const again = await load();
  assert.equal(again.source, 'draft');
  assert.equal(again.content.en.category, 'Delivery operations platform (edited)');

  assert.equal(gh.fileOn('main', 'README.md'), 'main');
  assert.equal(gh.fileOn(BASE, FILE), COMMITTED, 'the base branch is unchanged');
  assert.ok(gh.state.writes.every((w) => w.branch === DRAFT), 'every write is on the draft branch');
  const files = gh.state.writes.filter((w) => w.path.startsWith('/contents/')).map((w) => w.path);
  assert.ok(files.every((p) => p === `/contents/${FILE}`), 'only the Rocketeer content file is written');
});

test('an unchanged save does nothing', async () => {
  const loaded = await load();
  const r = await save(editableOf(loaded.content), loaded.sha);
  assert.equal(r.status, 200);
  assert.equal(r.data.changed, false);
  assert.equal(gh.state.writes.length, 0);
});

// ---------- locked facts, images and the allowlist ----------
test('facts and images sent by the browser are refused; other request keys are ignored, never applied', async () => {
  const loaded = await load();
  for (const locked of [{ facts: { featured: false, order: 9 } }, { images: { image: { id: 'x', width: 1, height: 1 } } }]) {
    const c = edit(loaded.content, (x) => { x.en.summary = 'Trying to change a locked value.'; Object.assign(x, locked); });
    const r = await save(c, loaded.sha);
    assert.equal(r.status, 422, JSON.stringify(locked));
    assert.ok(r.data.error.fields.entry);
  }
  assert.equal(gh.state.writes.length, 0);
  const c = edit(loaded.content, (x) => { x.en.summary = 'A normal edit with extra request keys.'; });
  const r = await save(c, loaded.sha, { branch: 'main', repo: 'evil/other', path: 'src/pages/index.astro', slug: 'armans', facts: { featured: false } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(fileOn(DRAFT).facts, DOC.facts);
  assert.deepEqual(fileOn(DRAFT).images, DOC.images);
  assert.ok(gh.state.writes.every((w) => w.branch === DRAFT));
});

test('only Rocketeer is connected: every other case study, and other paths, are refused', async () => {
  for (const slug of ['armans', 'logotherapia-xanthi', 'emoved', 'nonexistent']) {
    assert.equal((await call('GET', `/api/case-studies/${slug}`)).status, 404, slug);
    assert.equal((await call('POST', `/api/case-studies/${slug}/draft`, { body: { content: editableOf(DOC), expectedSha: gitSha(COMMITTED) } })).status, 404, slug);
  }
  for (const p of ['/api/case-studies/..%2F..%2Fsrc', '/api/case-studies/Bad_Slug', '/api/case-studies/a.b']) assert.equal((await call('GET', p)).status, 400, p);
  assert.equal((await call('POST', '/api/case-studies/rocketeer/publish', { body: {} })).status, 404, 'no publish endpoint');
  assert.equal((await call('DELETE', '/api/case-studies/rocketeer', { body: {} })).status, 405);
  assert.equal(gh.state.writes.length, 0);
  assert.ok(!gh.state.log.some((l) => /armans/.test(l)), 'no GitHub request for another case study');
});

test('the same authorisation applies: no identity, wrong audience, non-allowlisted user and cross-origin are refused', async () => {
  const c = editableOf(DOC);
  for (const ctx of [{}, ctxFor(ADMIN, 'other-app'), ctxFor('intruder@example.test')]) {
    assert.equal((await call('GET', '/api/case-studies/rocketeer', { ctx })).status, 403);
    assert.equal((await call('POST', '/api/case-studies/rocketeer/draft', { ctx, body: { content: c, expectedSha: gitSha(COMMITTED) } })).status, 403);
  }
  assert.equal((await call('POST', '/api/case-studies/rocketeer/draft', { headers: { Origin: 'https://evil.example' }, body: { content: c, expectedSha: gitSha(COMMITTED) } })).status, 403);
  assert.equal(gh.state.log.length, 0);
});

test('main is never the draft base', async () => {
  for (const b of ['main', 'cms/case-studies/x']) assert.equal((await call('GET', '/api/case-studies', { e: env({ CONTENT_BASE_BRANCH: b }) })).status, 503);
  assert.equal(gh.state.writes.length, 0);
});

// ---------- conflicts ----------
test('stale saves are refused: draft changed elsewhere, or the base moved before the first save', async () => {
  const loaded = await load();
  const c = edit(loaded.content, (x) => { x.en.summary = 'First edit of the Rocketeer summary.'; });
  const s1 = await save(c, loaded.sha);
  const other = JSON.parse(gh.fileOn(DRAFT, FILE) ?? gh.fileOn(DRAFT, FILE));
  other.en.summary = 'Changed elsewhere on GitHub.';
  gh.externalEdit(DRAFT, FILE, JSON.stringify(other, null, 2) + '\n');
  c.en.summary = 'Second edit based on an old version.';
  const stale = await save(c, s1.data.sha);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.error.conflict, true);
  assert.equal(fileOn(DRAFT).en.summary, 'Changed elsewhere on GitHub.', 'the newer change is kept');

  gh = createMockGitHub({ publicKey, branches: { main: {}, [BASE]: { [FILE]: COMMITTED } } });
  globalThis.fetch = gh.fetch;
  resetTokenCache();
  const l2 = await load();
  const moved = structuredClone(DOC); moved.en.summary = 'The base branch moved.';
  gh.externalEdit(BASE, FILE, JSON.stringify(moved, null, 2) + '\n');
  const r = await save(edit(l2.content, (x) => { x.en.summary = 'My edit.'; }), l2.sha);
  assert.equal(r.status, 409);
  assert.equal(gh.state.branches[DRAFT], undefined, 'no branch created');
});

test('GitHub reporting a conflict on the write is a conflict, and GitHub failures are friendly', async () => {
  const loaded = await load();
  const c = edit(loaded.content, (x) => { x.en.summary = 'An edit that loses a race on GitHub.'; });
  gh.failNext(/^PUT \/repos\/.*\/contents\//, 409);
  assert.equal((await save(c, loaded.sha)).status, 409);
  assert.equal(gh.state.prs.length, 0);
  gh.failNext(/^GET \/repos\/.*\/contents\//, 500);
  const f = await call('GET', '/api/case-studies/rocketeer');
  assert.equal(f.status, 502);
  assert.match(f.data.error.message, /GitHub had a problem/);
});

// ---------- validation and parity ----------
test('invalid text is refused with field errors and nothing is written', async () => {
  const loaded = await load();
  const cases = [
    [(x) => { x.en.summary = ''; }, 'en.summary'],
    [(x) => { x.en.summary = 'x'.repeat(221); }, 'en.summary'],
    [(x) => { x.en.category = 'Has <b>markup</b>'; }, 'en.category'],
    [(x) => { x.el.summary = 'Line one\nline two'; }, 'el.summary'],
    [(x) => { x.en.technology[0] = '   '; }, 'en.technology.0'],
    [(x) => { x.en.overview = []; x.el.overview = []; }, 'en.overview'],
    [(x) => { x.en.need[0] = 'x'.repeat(1501); }, 'en.need.0'],
    [(x) => { x.en.imageAlt = ''; }, 'en.imageAlt'],
    [(x) => { x.el.coverAlt = ''; }, 'el.coverAlt'],
    [(x) => { x.el.galleryAlts = []; }, 'el.galleryAlts'],
    [(x) => { x.en.galleryAlts = ['one', 'two']; }, 'en.galleryAlts'],
    [(x) => { x.en.unknownField = 'x'; }, 'en.unknownField'],
    [(x) => { delete x.el; }, 'el.entry'],
    [(x) => { x.de = {}; }, 'entry'],
  ];
  for (const [mutate, field] of cases) {
    const r = await save(edit(loaded.content, mutate), loaded.sha);
    assert.equal(r.status, 422, field);
    assert.ok(r.data.error.fields[field], `${field}: ${JSON.stringify(r.data.error.fields)}`);
  }
  assert.equal(gh.state.writes.length, 0);
});

test('English and Greek must keep the same structure', async () => {
  const loaded = await load();
  const r = await save(edit(loaded.content, (x) => { x.en.outcome.push('A sixth English outcome.'); }), loaded.sha);
  assert.equal(r.status, 422);
  assert.match(r.data.error.fields['el.outcome'], /same number/);
  const both = await save(edit(loaded.content, (x) => { x.en.outcome.push('A sixth English outcome.'); x.el.outcome.push('Ένα έκτο ελληνικό αποτέλεσμα.'); }), loaded.sha);
  assert.equal(both.status, 200, both.text);
  assert.equal(fileOn(DRAFT).en.outcome.length, 6);
  const intro = await save(edit(loaded.content, (x) => { x.en.builtIntro = 'Only English has an intro.'; }), both.data.sha);
  assert.equal(intro.status, 422);
  assert.ok(intro.data.error.fields['el.builtIntro']);
});

test('an invalid file on the base branch is not loaded or saved over', async () => {
  const broken = structuredClone(DOC); broken.facts.slug = 'other';
  gh.externalEdit(BASE, FILE, JSON.stringify(broken));
  assert.equal((await call('GET', '/api/case-studies/rocketeer')).status, 502);
  const list = await call('GET', '/api/case-studies');
  assert.deepEqual(list.data.entries, []);
  assert.equal(gh.state.writes.length, 0);
});

test('no response contains a credential', async () => {
  const loaded = await load();
  const r = await save(edit(loaded.content, (x) => { x.en.summary = 'Credential check edit.'; }), loaded.sha);
  assert.ok(!/ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer /.test(r.text + JSON.stringify(loaded)));
});
