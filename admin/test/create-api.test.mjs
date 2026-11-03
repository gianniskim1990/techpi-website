// Task M5: creating case studies and Insights articles through the admin API (mocked GitHub), and publishing them by
// their file alone (the real public build and every site validator, with the created files placed in content/).
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { createMockGitHub } from './support/mock-github.mjs';
import { CONNECTED_SLUGS, validateDocument as validateCaseStudy } from '../shared/case-study-content.js';
import { INSIGHT_SLUGS, validateDocument as validateInsight } from '../shared/insight-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m5-create';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const csFile = (slug) => `content/case-studies/${slug}/index.json`;
const inFile = (slug) => `content/insights/${slug}/index.json`;
const read = (p) => fs.readFileSync(path.join(repo, p), 'utf8').replace(/\r\n/g, '\n');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });
const today = new Date().toISOString().slice(0, 10);

let gh;
const env = (over = {}) => ({
  ...authEnv, GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM,
  CONTENT_BASE_BRANCH: BASE, ASSETS: { fetch: async () => new Response('app') }, ...over,
});
async function call(method, p, { body, headers = {}, ctx = ctxFor(), e = env() } = {}) {
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  const sessionHeader = await sessionCookie(ctx, { secret: e.SESSION_SECRET || SESSION_SECRET });
  if (sessionHeader && !h.Cookie) h.Cookie = sessionHeader;
  const res = await worker.fetch(new Request(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), e, ctx);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

const NEW_CASE = () => ({
  facts: { slug: 'harbour-booking', name: 'Harbour Booking', client: 'Harbour Ltd', clientEl: 'Harbour ΕΠΕ', year: 2026, liveUrl: 'https://example.com', workGroup: 'client', capabilities: ['web-experiences', 'digital-products'] },
  en: {
    category: 'Booking platform',
    summary: 'A booking platform for a harbour business, with online reservations and an admin panel for staff.',
    highlights: ['Online reservations', 'Staff admin'],
    overview: ['Harbour Ltd needed a simple way to take reservations online.'],
    need: ['Reservations were taken by phone and recorded on paper.'],
    builtIntro: 'We built a booking platform with a staff admin.',
    builtItems: ['Reservation flow', 'Staff admin'],
    services: ['Web development'],
  },
  el: {
    category: 'Πλατφόρμα κρατήσεων',
    summary: 'Μια πλατφόρμα κρατήσεων για επιχείρηση στο λιμάνι, με online κρατήσεις και διαχείριση για το προσωπικό.',
    highlights: ['Online κρατήσεις', 'Διαχείριση προσωπικού'],
    overview: ['Η Harbour χρειαζόταν έναν απλό τρόπο για online κρατήσεις.'],
    need: ['Οι κρατήσεις γίνονταν τηλεφωνικά και καταγράφονταν σε χαρτί.'],
    builtIntro: 'Φτιάξαμε μια πλατφόρμα κρατήσεων με διαχείριση για το προσωπικό.',
    builtItems: ['Ροή κράτησης', 'Διαχείριση προσωπικού'],
    services: ['Ανάπτυξη web'],
  },
});
const NEW_ARTICLE = () => ({
  facts: { slug: 'planning-a-project-website-launch', published: today },
  en: {
    category: 'Project websites',
    title: 'Planning a project website launch',
    lead: 'What to prepare in the weeks before an EU project website goes live.',
    sections: [
      { heading: 'Agree the first content', paragraphs: ['Decide which pages and documents must be ready on day one, and who signs them off before launch.'] },
      { heading: 'Check the basics', list: ['Accessibility statement and contact details.', 'Privacy notice for any form on the site.'], after: ['A short checklist like this avoids most of the late surprises on launch day.'] },
    ],
    note: 'See also the [EU Projects](/eu-projects) page and [Rocketeer](/work/rocketeer).',
    related: ['what-every-eu-project-website-should-include'],
    meta: { title: 'Planning a project website launch | TechPi', description: 'What to prepare in the weeks before an EU project website goes live: first content, sign-off and the basic checks.' },
  },
});
const create = (col, content, opts) => call('POST', `/api/${col}`, { body: { content }, ...opts });

beforeEach(() => {
  resetTokenCache();
  const files = {};
  for (const s of CONNECTED_SLUGS) files[csFile(s)] = read(csFile(s));
  for (const s of INSIGHT_SLUGS) files[inFile(s)] = read(inFile(s));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: files } });
  globalThis.fetch = gh.fetch;
});

// ---------- case studies ----------
test('creating a case study writes one new file on its own draft branch and opens one draft pull request', async () => {
  const r = await create('case-studies', NEW_CASE());
  assert.equal(r.status, 201, r.text);
  assert.equal(r.data.slug, 'harbour-booking');
  assert.equal(r.data.isNew, true);
  assert.equal(r.data.draft.branch, 'cms/case-studies/harbour-booking');
  const doc = JSON.parse(gh.fileOn('cms/case-studies/harbour-booking', csFile('harbour-booking')));
  assert.deepEqual(validateCaseStudy(doc, 'harbour-booking').problems, []);
  assert.equal(doc.facts.order, 19, 'the next free Work-page position');
  assert.equal(doc.facts.featured, false);
  assert.deepEqual(doc.images, {});
  assert.ok(!('source' in doc.facts));
  assert.deepEqual(doc.facts.capabilities, ['digital-products', 'web-experiences'], 'canonical order');
  // Only that file and that branch: the base, main and every other entry are untouched.
  assert.equal(gh.fileOn(BASE, csFile('harbour-booking')), undefined);
  assert.ok(gh.state.writes.every((w) => w.branch === 'cms/case-studies/harbour-booking'));
  assert.deepEqual(gh.state.writes.map((w) => w.method), ['POST', 'PUT', 'POST']);
  const pr = gh.state.prs.at(-1);
  assert.ok(pr.draft && pr.base.ref === BASE && pr.head.ref === 'cms/case-studies/harbour-booking');
  assert.match(pr.title, /New case study: Harbour Booking/);
  assert.match(pr.body, /\/work\/harbour-booking and \/el\/work\/harbour-booking/);
});

test('a new case study is listed (marked new, at the end), opens in the editor and saves to the same draft', async () => {
  await create('case-studies', NEW_CASE());
  const list = await call('GET', '/api/case-studies');
  assert.equal(list.data.entries.length, 19);
  const last = list.data.entries.at(-1);
  assert.equal(last.slug, 'harbour-booking');
  assert.equal(last.isNew, true);
  assert.ok(last.draft?.number);
  const g = await call('GET', '/api/case-studies/harbour-booking');
  assert.equal(g.status, 200);
  assert.equal(g.data.source, 'draft');
  assert.equal(g.data.isNew, true);
  const c = { en: g.data.content.en, el: g.data.content.el };
  c.en.overview[0] += ' Edited.';
  const s = await call('POST', '/api/case-studies/harbour-booking/draft', { body: { content: c, expectedSha: g.data.sha } });
  assert.equal(s.status, 200, s.text);
  assert.equal(s.data.draft.number, last.draft.number, 'the same pull request');
  assert.equal(gh.state.prs.length, 1);
  assert.match(gh.fileOn('cms/case-studies/harbour-booking', csFile('harbour-booking')), /Edited\./);
});

test('a second new case study takes the next position after the open draft', async () => {
  await create('case-studies', NEW_CASE());
  const second = NEW_CASE();
  second.facts.slug = 'harbour-booking-app';
  const r = await create('case-studies', second);
  assert.equal(r.status, 201, r.text);
  assert.equal(JSON.parse(gh.fileOn('cms/case-studies/harbour-booking-app', csFile('harbour-booking-app'))).facts.order, 20);
});

test('taken, reserved and invalid addresses and invalid content are refused with field errors, and nothing is written', async () => {
  for (const [slug, re] of [['rocketeer', /already exists/], ['index', /reserved/], ['Bad Slug', /Lower-case/], ['', /Required/]]) {
    const c = NEW_CASE();
    c.facts.slug = slug;
    const r = await create('case-studies', c);
    assert.equal(r.status, 422, slug);
    assert.match(r.data.error.fields['facts.slug'], re, slug);
  }
  const bad = NEW_CASE();
  bad.facts.featured = true;
  bad.facts.name = 'x'.repeat(51);
  bad.facts.year = 1900;
  bad.facts.liveUrl = 'http://example.com';
  bad.en.summary = 'Too short.';
  bad.el.highlights = ['Μόνο ένα'];
  bad.en.builtIntro = '<script>';
  const r = await create('case-studies', bad);
  assert.equal(r.status, 422);
  for (const k of ['facts.featured', 'facts.name', 'facts.year', 'facts.liveUrl', 'en.summary', 'el.highlights', 'en.builtIntro']) assert.ok(r.data.error.fields[k], k);
  assert.equal(gh.state.writes.length, 0);
  // An address with an open draft is taken too.
  assert.equal((await create('case-studies', NEW_CASE())).status, 201);
  const again = await create('case-studies', NEW_CASE());
  assert.equal(again.status, 422);
  assert.match(again.data.error.fields['facts.slug'], /open draft/);
});

test('a leftover branch is reused only when it is a closed draft; otherwise nothing is overwritten', async () => {
  await create('case-studies', NEW_CASE());
  gh.closePr(gh.state.prs[0].number);
  const r = await create('case-studies', NEW_CASE());
  assert.equal(r.status, 201, 'an abandoned draft can be started again');
  gh.closePr(gh.state.prs.at(-1).number);
  gh.externalEdit('cms/case-studies/harbour-booking', 'notes.txt', 'someone else');
  const blocked = await create('case-studies', NEW_CASE());
  assert.equal(blocked.status, 409);
  assert.equal(gh.fileOn('cms/case-studies/harbour-booking', 'notes.txt'), 'someone else');
});

// ---------- articles ----------
test('creating an article writes one new file on its own draft branch, dated, positioned and without a legacy source', async () => {
  const r = await create('insights', NEW_ARTICLE());
  assert.equal(r.status, 201, r.text);
  const doc = JSON.parse(gh.fileOn('cms/insights/planning-a-project-website-launch', inFile('planning-a-project-website-launch')));
  assert.deepEqual(validateInsight(doc, 'planning-a-project-website-launch', { insights: [...INSIGHT_SLUGS, 'planning-a-project-website-launch'], caseStudies: CONNECTED_SLUGS }).problems, []);
  assert.equal(doc.facts.order, 8);
  assert.equal(doc.facts.published, today);
  assert.ok(doc.facts.publishedText.length > 8);
  assert.ok(!('source' in doc.facts) && !('el' in doc));
  assert.ok(gh.state.writes.every((w) => w.branch === 'cms/insights/planning-a-project-website-launch'));
  // Newest first: today's article leads the list.
  const list = await call('GET', '/api/insights');
  assert.equal(list.data.entries[0].slug, 'planning-a-project-website-launch');
  assert.equal(list.data.entries[0].isNew, true);
  assert.equal(list.data.entries.length, 8);
});

test('an article may relate and link only to what is on the content branch, and cannot be dated in the future', async () => {
  await create('case-studies', NEW_CASE()); // exists only as a draft
  const a = NEW_ARTICLE();
  a.en.related = ['not-an-article'];
  a.en.note = 'See [the new case study](/work/harbour-booking).';
  a.facts.published = '2999-01-01';
  const r = await create('insights', a);
  assert.equal(r.status, 422);
  assert.ok(r.data.error.fields['en.related.0']);
  assert.ok(r.data.error.fields['en.note']);
  assert.match(r.data.error.fields['facts.published'], /future/);
  const el = NEW_ARTICLE();
  el.el = { title: 'Greek' };
  assert.equal((await create('insights', el)).status, 422, 'English only');
});

test('creating needs the signed-in owner and the admin itself; there is no create for pages', async () => {
  for (const ctx of [{}, ctxFor('owner', 'forged'), ctxFor('intruder')]) assert.equal((await create('case-studies', NEW_CASE(), { ctx })).status, 401);
  assert.equal((await create('insights', NEW_ARTICLE(), { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await create('pages', { key: 'new' })).status, 405);
  assert.equal(gh.state.writes.length, 0);
});

// ---------- publishing: the created files alone build and pass every site validator ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-m5-create-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('the created files publish with no code change: the public build and every site validator pass', { timeout: 180_000 }, async () => {
  assert.equal((await create('case-studies', NEW_CASE())).status, 201);
  assert.equal((await create('insights', NEW_ARTICLE())).status, 201);
  const placed = [
    [csFile('harbour-booking'), gh.fileOn('cms/case-studies/harbour-booking', csFile('harbour-booking'))],
    [inFile('planning-a-project-website-launch'), gh.fileOn('cms/insights/planning-a-project-website-launch', inFile('planning-a-project-website-launch'))],
  ];
  try {
    for (const [p, text] of placed) {
      fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true });
      fs.writeFileSync(path.join(repo, p), text);
    }
    const out = path.join(tmp, 'dist');
    const node = (args) => spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
    const b = node([path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', out]);
    assert.equal(b.status, 0, b.stderr || b.stdout);
    for (const page of ['work/harbour-booking.html', 'el/work/harbour-booking.html', 'insights/planning-a-project-website-launch.html']) assert.ok(fs.existsSync(path.join(out, page)), page);
    for (const v of ['scripts/content/validate.mjs', 'scripts/content/validate-legal.mjs', 'scripts/content/validate-insights.mjs', 'scripts/content/validate-redirects.mjs', 'scripts/seo/validate.mjs', 'scripts/security/validate.mjs']) {
      const r = node([path.join(repo, v), '--dist', out]);
      assert.equal(r.status, 0, `${v}\n${r.stdout}${r.stderr}`);
    }
    const rules = fs.readFileSync(path.join(out, '_redirects'), 'utf8');
    for (const p of ['/work/harbour-booking', '/el/work/harbour-booking', '/insights/planning-a-project-website-launch']) {
      assert.ok(rules.includes(`${p}/ ${p}  301`) && rules.includes(`${p}.html ${p}  301`), p);
    }
    const article = fs.readFileSync(path.join(out, 'insights/planning-a-project-website-launch.html'), 'utf8');
    assert.ok(!article.includes('First published under the pigiota314 name'), 'no legacy provenance on a new article');
  } finally {
    for (const [p] of placed) fs.rmSync(path.dirname(path.join(repo, p)), { recursive: true, force: true });
  }
});
