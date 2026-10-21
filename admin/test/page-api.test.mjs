// Task M3: the 8 website pages through the admin API (mocked GitHub). Covers load in both languages, an English save
// then a Greek save into the SAME draft PR, repeated saves, isolation between pages and from the other collections,
// conflicts, locked facts and legal integrity, the allowlist, authorisation, and "never main". Case studies and
// Insights are checked to still work on the same base.
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
import { editableOf, PAGE_KEYS, PAGES, PATHS } from '../shared/page-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m3-website-pages';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fileOf = (key) => `content/pages/${key}/index.json`;
const draftOf = (key) => `cms/pages/${key}`;
const readRepo = (rel) => fs.readFileSync(path.join(repo, rel), 'utf8').replace(/\r\n/g, '\n');
const TEXT = Object.fromEntries(PAGE_KEYS.map((k) => [k, readRepo(fileOf(k))]));
const DOC = Object.fromEntries(PAGE_KEYS.map((k) => [k, JSON.parse(TEXT[k])]));
const CS = 'content/case-studies/rocketeer/index.json';
const IN = 'content/insights/how-analytics-can-support-dissemination-reporting/index.json';
const OTHER = { [CS]: readRepo(CS), [IN]: readRepo(IN) };
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
const load = async (key) => (await call('GET', `/api/pages/${key}`)).data;
const save = (key, content, expectedSha, extra = {}) => call('POST', `/api/pages/${key}/draft`, { body: { content, expectedSha, ...extra } });
const edit = (doc, fn) => { const c = structuredClone(editableOf(doc)); fn(c); return c; };
const saved = (key) => JSON.parse(gh.fileOn(draftOf(key), fileOf(key)));

beforeEach(() => {
  resetTokenCache();
  const base = Object.fromEntries(PAGE_KEYS.map((k) => [fileOf(k), TEXT[k]]));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: { ...base, ...OTHER } } });
  globalThis.fetch = gh.fetch;
});

test('the list shows exactly the 8 pages, in menu order, with names, URLs, both languages, and no drafts yet', async () => {
  const r = await call('GET', '/api/pages');
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.entries.map((x) => x.slug), PAGE_KEYS);
  for (const e of r.data.entries) {
    assert.equal(e.name, PAGES.find((p) => p.key === e.slug).name);
    assert.deepEqual(e.paths, PATHS[e.slug]);
    assert.equal(e.hasGreek, true);
    assert.equal(e.draft, null);
  }
  assert.deepEqual(r.data.entries.filter((e) => e.kind === 'legal').map((e) => e.slug), ['privacy', 'cookies']);
  const s = await call('GET', '/api/session');
  assert.deepEqual(s.data.connected.pages, PAGE_KEYS);
  assert.equal(s.data.connected.caseStudies.length, 18);
  assert.equal(s.data.connected.insights.length, 7);
});

test('every one of the 8 pages loads with its real English and Greek content and version', async () => {
  for (const key of PAGE_KEYS) {
    const r = await call('GET', `/api/pages/${key}`);
    assert.equal(r.status, 200, key);
    assert.equal(r.data.sha, gitSha(TEXT[key]));
    assert.deepEqual(r.data.content, DOC[key]);
    assert.ok(r.data.content.en && r.data.content.el);
  }
  assert.equal(gh.state.writes.length, 0);
});

test('an English save and then a Greek save of one page go into the SAME draft PR; both edits are kept', async () => {
  const l1 = await load('about');
  const r1 = await save('about', edit(l1.content, (c) => { c.en.lead = 'From websites to custom platforms, digital products and intelligent systems.'; }), l1.sha);
  assert.equal(r1.status, 200, r1.text);
  const l2 = await load('about');
  assert.equal(l2.source, 'draft');
  const r2 = await save('about', edit(l2.content, (c) => { c.el.lead = 'Από ιστοσελίδες σε ειδικές πλατφόρμες, ψηφιακά προϊόντα και ευφυή συστήματα.'; }), l2.sha);
  assert.equal(r2.status, 200, r2.text);
  assert.equal(r2.data.draft.number, r1.data.draft.number, 'the same PR');
  assert.equal(r2.data.draft.branch, draftOf('about'));
  assert.equal(gh.state.prs.length, 1);
  assert.equal(saved('about').en.lead, 'From websites to custom platforms, digital products and intelligent systems.');
  assert.equal(saved('about').el.lead, 'Από ιστοσελίδες σε ειδικές πλατφόρμες, ψηφιακά προϊόντα και ευφυή συστήματα.');
  assert.deepEqual(saved('about').facts, DOC.about.facts);
  const r3 = await save('about', edit(l2.content, (c) => { c.el.lead = 'Τρίτη αποθήκευση.'; c.en.lead = l2.content.en.lead; }), r2.data.sha);
  assert.equal(r3.data.draft.number, r1.data.draft.number, 'repeated saves reuse it too');
  assert.ok(gh.state.prs[0].base.ref === BASE && gh.state.prs[0].draft && /publicly visible/.test(gh.state.prs[0].body));
});

test('every page saves into its own branch and PR, touching only its own file; nothing else changes', async () => {
  const EDITS = {
    home: (c) => { c.en.hero.support[0] = 'Technology built for'; c.el.contact.region = 'Ελλάδα και Ευρώπη.'; },
    work: (c) => { c.en.filterAll = 'All projects'; },
    capabilities: (c) => { c.el.lead += ' Δοκιμή.'; },
    'eu-projects': (c) => { c.en.process.steps[0].text += ' Edited.'; c.el.after.items.reverse(); },
    about: (c) => { c.en.changeHeading = 'What stayed and what changed'; },
    contact: (c) => { c.el.heading = 'Έχετε κάτι που αξίζει να φτιαχτεί;'; },
    privacy: (c) => { c.en.sections[1].heading = 'What this policy is about'; },
    cookies: (c) => { c.el.contentsLabel = 'Περιεχόμενα σελίδας'; },
  };
  const prs = {};
  for (const [key, fn] of Object.entries(EDITS)) {
    const l = await load(key);
    const r = await save(key, edit(l.content, fn), l.sha);
    assert.equal(r.status, 200, `${key}: ${r.text}`);
    prs[key] = r.data.draft.number;
  }
  assert.equal(new Set(Object.values(prs)).size, 8, 'one PR per page');
  for (const w of gh.state.writes) {
    const key = w.branch.replace('cms/pages/', '');
    assert.ok(EDITS[key], `write on ${w.branch}`);
    if (w.path.startsWith('/contents/')) assert.equal(w.path, `/contents/${fileOf(key)}`);
  }
  for (const key of PAGE_KEYS) {
    assert.equal(gh.fileOn(BASE, fileOf(key)), TEXT[key], `${key} unchanged on the base`);
    for (const other of PAGE_KEYS.filter((k) => k !== key)) assert.equal(gh.fileOn(draftOf(key), fileOf(other)), TEXT[other]);
    for (const [f, t] of Object.entries(OTHER)) assert.equal(gh.fileOn(draftOf(key), f), t, 'case studies and Insights untouched');
  }
  const legalPr = gh.state.prs.find((p) => p.head.ref === draftOf('privacy'));
  assert.match(legalPr.body, /owner’s review before it is merged/);
  assert.doesNotMatch(gh.state.prs.find((p) => p.head.ref === draftOf('about')).body, /legal/i);
  const list = await call('GET', '/api/pages');
  assert.deepEqual(Object.fromEntries(list.data.entries.filter((x) => x.draft).map((x) => [x.slug, x.draft.number])), prs);
  assert.equal(gh.fileOn('main', 'README.md'), 'main');
});

test('legal: references survive a save as references; locked facts and anchors cannot change', async () => {
  const l = await load('privacy');
  const who = l.content.en.sections.findIndex((s) => s.id === 'who-we-are');
  const b = l.content.en.sections[who].blocks.findIndex((x) => x.p?.includes('{{email}}'));
  const r = await save('privacy', edit(l.content, (c) => { c.en.sections[who].blocks[b].p = 'Telephone: {{phone}}. Email: {{email}}.'; }), l.sha);
  assert.equal(r.status, 200, r.text);
  const doc = saved('privacy');
  assert.equal(doc.en.sections[who].blocks[b].p, 'Telephone: {{phone}}. Email: {{email}}.');
  assert.ok(!JSON.stringify(doc).includes('info@techpi.eu'), 'no literal email written');
  assert.deepEqual(doc.facts, DOC.privacy.facts);
  const l2 = await load('privacy');
  for (const fn of [
    (c) => { c.en.sections[who].blocks[b].p = 'Email: info@techpi.eu.'; },
    (c) => { c.en.sections[who].blocks[b].p = 'Write to us.'; },
    (c) => { c.el.sections[0].id = 'poioi-eimaste'; },
    (c) => { c.en.heading = 'Our privacy'; },
    (c) => { c.facts = { updated: '2027-01-01' }; },
    (c) => { c.en.sections[1].blocks[0].p = 'We use Google Analytics.'; },
  ]) assert.equal((await save('privacy', edit(l2.content, fn), l2.sha)).status, 422, fn.toString());
  assert.equal(gh.state.writes.filter((w) => w.path.startsWith('/contents/')).length, 1, 'only the valid save wrote');
});

test('conflicts: a newer draft, a moved base, and another page’s version are refused', async () => {
  const l = await load('work');
  const s1 = await save('work', edit(l.content, (c) => { c.en.filterAll = 'All projects'; }), l.sha);
  const other = saved('work'); other.en.filterAll = 'Changed elsewhere';
  gh.externalEdit(draftOf('work'), fileOf('work'), JSON.stringify(other, null, 2) + '\n');
  const stale = await save('work', edit(l.content, (c) => { c.el.filterAll = 'Όλα τα έργα μας'; }), s1.data.sha);
  assert.equal(stale.status, 409);
  assert.equal(stale.data.error.conflict, true);
  assert.equal(saved('work').en.filterAll, 'Changed elsewhere');

  const l2 = await load('contact');
  const moved = structuredClone(DOC.contact); moved.en.lead = 'The base moved.';
  gh.externalEdit(BASE, fileOf('contact'), JSON.stringify(moved, null, 2) + '\n');
  assert.equal((await save('contact', edit(l2.content, (c) => { c.en.heading = 'Something to build?'; }), l2.sha)).status, 409);
  assert.equal(gh.state.branches[draftOf('contact')], undefined);

  const home = await load('home');
  assert.equal((await save('cookies', editableOf(DOC.cookies), home.sha)).status, 409, 'another page’s version is not accepted');
});

test('only the 8 pages exist; everything else is refused before GitHub is asked; no publish, merge, create or delete', async () => {
  for (const key of ['new-page', 'euProjects', 'eu_projects', 'insights', 'main', 'el']) {
    const g = await call('GET', `/api/pages/${key}`);
    assert.ok([400, 404].includes(g.status), `${key}: ${g.status}`);
    assert.ok([400, 404].includes((await save(key, editableOf(DOC.home), gitSha(TEXT.home))).status), key);
  }
  for (const p of ['/api/pages/..%2F..%2Fsrc', '/api/pages/Home', '/api/pages/a.b']) assert.equal((await call('GET', p)).status, 400, p);
  for (const verb of ['publish', 'merge']) assert.equal((await call('POST', `/api/pages/home/${verb}`, { body: {} })).status, 404);
  assert.equal((await call('DELETE', '/api/pages/home', { body: {} })).status, 405);
  assert.equal((await call('POST', '/api/pages', { body: {} })).status, 405);
  assert.ok(!gh.state.log.some((l) => /new-page|eu_projects|euProjects/.test(l)));
  assert.equal(gh.state.writes.length, 0);
});

test('authorisation and same-origin checks apply to every page', async () => {
  for (const key of ['home', 'privacy']) {
    for (const ctx of [{}, ctxFor('owner', 'forged'), ctxFor('intruder')]) {
      assert.equal((await call('GET', `/api/pages/${key}`, { ctx })).status, 401);
      assert.equal((await call('POST', `/api/pages/${key}/draft`, { ctx, body: { content: editableOf(DOC[key]), expectedSha: gitSha(TEXT[key]) } })).status, 401);
    }
    assert.equal((await call('POST', `/api/pages/${key}/draft`, { headers: { Origin: 'https://evil.example' }, body: { content: editableOf(DOC[key]), expectedSha: gitSha(TEXT[key]) } })).status, 403);
  }
  assert.equal(gh.state.log.length, 0);
});

test('main is never the base; an invalid file is not loaded or saved over; an unchanged save writes nothing', async () => {
  for (const b of ['main', 'cms/pages/x']) assert.equal((await call('GET', '/api/pages', { e: env({ CONTENT_BASE_BRANCH: b }) })).status, 503);
  const l = await load('capabilities');
  assert.equal((await save('capabilities', editableOf(l.content), l.sha)).data.changed, false);
  const broken = structuredClone(DOC.capabilities); broken.facts.paths.en = '/caps';
  gh.externalEdit(BASE, fileOf('capabilities'), JSON.stringify(broken));
  assert.equal((await call('GET', '/api/pages/capabilities')).status, 502);
  assert.equal((await call('GET', '/api/pages')).data.entries.length, 7);
  assert.equal(gh.state.writes.length, 0);
});

test('case studies and Insights still load and save on the same base', async () => {
  const cs = await call('GET', '/api/case-studies/rocketeer');
  assert.equal(cs.status, 200);
  const c = structuredClone({ en: cs.data.content.en, el: cs.data.content.el });
  c.en.summary += ' Edited.';
  const r = await call('POST', '/api/case-studies/rocketeer/draft', { body: { content: c, expectedSha: cs.data.sha } });
  assert.equal(r.status, 200, r.text);
  const ins = await call('GET', '/api/insights/how-analytics-can-support-dissemination-reporting');
  assert.equal(ins.status, 200);
  const e = { en: structuredClone(ins.data.content.en) };
  e.en.title += ' (edited)';
  assert.equal((await call('POST', '/api/insights/how-analytics-can-support-dissemination-reporting/draft', { body: { content: e, expectedSha: ins.data.sha } })).status, 200);
  assert.ok(!/ghs_|BEGIN (RSA )?PRIVATE KEY|Bearer /.test(r.text + cs.text + ins.text));
});
