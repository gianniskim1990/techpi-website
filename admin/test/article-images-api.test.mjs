// Task M7: images of a new Insights article through the admin API (mocked GitHub): a cover and an image after a section,
// with English alt text and optional captions; one commit per change; refusals; and the end-to-end publish (real build
// and every site validator, with the files placed in the repository).
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import worker from '../worker/index.js';
import { resetTokenCache } from '../worker/github.js';
import { authEnv, ctxFor, SESSION_SECRET, sessionCookie } from './support/auth.mjs';
import { createMockGitHub, gitSha } from './support/mock-github.mjs';
import { CONNECTED_SLUGS } from '../shared/case-study-content.js';
import { INSIGHT_SLUGS, validateDocument } from '../shared/insight-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m7-article-images';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const inFile = (slug) => `content/insights/${slug}/index.json`;
const DIR = 'src/assets/insights';
const SLUG = 'planning-a-project-website-launch';
const BRANCH = `cms/insights/${SLUG}`;
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });
const today = new Date().toISOString().slice(0, 10);

let gh;
const env = () => ({ ...authEnv, GITHUB_APP_ID: '123456', GITHUB_APP_INSTALLATION_ID: '7890', GITHUB_APP_PRIVATE_KEY: PEM, CONTENT_BASE_BRANCH: BASE, ASSETS: { fetch: async () => new Response('app') } });
async function call(method, p, { body, headers = {}, ctx = ctxFor(), raw = false } = {}) {
  const e = env();
  const h = { 'X-TechPi-Admin': '1', 'Sec-Fetch-Site': 'same-origin', ...(method === 'GET' ? {} : { Origin: ORIGIN, 'Content-Type': 'application/json' }), ...headers };
  const sessionHeader = await sessionCookie(ctx, { secret: e.SESSION_SECRET || SESSION_SECRET });
  if (sessionHeader && !h.Cookie) h.Cookie = sessionHeader;
  const res = await worker.fetch(new Request(ORIGIN + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), e, ctx);
  if (raw) return res;
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

const ARTICLE = {
  facts: { slug: SLUG, published: today },
  en: {
    category: 'Project websites',
    title: 'Planning a project website launch',
    lead: 'What to prepare in the weeks before an EU project website goes live.',
    sections: [
      { heading: 'Agree the first content', paragraphs: ['Decide which pages and documents must be ready on day one, and who signs them off before launch.'] },
      { heading: 'Check the basics', list: ['Accessibility statement and contact details for the whole project team.', 'Privacy notice for any form on the site.'] },
    ],
    related: ['what-every-eu-project-website-should-include'],
    meta: { title: 'Planning a project website launch | TechPi', description: 'What to prepare in the weeks before an EU project website goes live: first content, sign-off and the basic checks.' },
  },
};
const picture = (w, h, fmt = 'webp', colour = '#0841c8') => sharp({ create: { width: w, height: h, channels: 3, background: colour } })[fmt]().toBuffer();
let sha;
const add = async (slot, buf, extra = {}) => {
  const r = await call('POST', `/api/insights/${SLUG}/images`, { body: { expectedSha: sha, slot, data: buf.toString('base64'), alt: 'A launch checklist on a project team’s screen.', ...extra } });
  if (r.status === 200) sha = r.data.sha;
  return r;
};
const remove = async (slot, index) => {
  const r = await call('POST', `/api/insights/${SLUG}/images/remove`, { body: { expectedSha: sha, slot, index } });
  if (r.status === 200) sha = r.data.sha;
  return r;
};
const stored = () => JSON.parse(gh.fileOn(BRANCH, inFile(SLUG)));
const imagesOn = () => [...gh.state.branches[BRANCH].files.keys()].filter((p) => p.startsWith(`${DIR}/`)).sort();
const read = (p) => fs.readFileSync(path.join(repo, p), 'utf8').replace(/\r\n/g, '\n');
const known = { insights: [...INSIGHT_SLUGS, SLUG], caseStudies: CONNECTED_SLUGS };

beforeEach(async () => {
  resetTokenCache();
  const files = {};
  for (const s of CONNECTED_SLUGS) files[`content/case-studies/${s}/index.json`] = read(`content/case-studies/${s}/index.json`);
  for (const s of INSIGHT_SLUGS) files[inFile(s)] = read(inFile(s));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: files } });
  globalThis.fetch = gh.fetch;
  const r = await call('POST', '/api/insights', { body: { content: ARTICLE } });
  assert.equal(r.status, 201, r.text);
  sha = r.data.sha;
});

test('a cover and a section image: one commit each, files under src/assets/insights, alt text and captions in place', async () => {
  const cover = await picture(2000, 1000);
  assert.equal((await add('cover', cover, { caption: 'The team’s launch board.' })).status, 200);
  const r = await add('section', await picture(1200, 800, 'png'), { index: 1, alt: 'The accessibility checklist.' });
  assert.equal(r.status, 200, r.text);
  const doc = stored();
  assert.deepEqual(doc.images, { cover: { id: `${SLUG}-cover-1`, width: 2000, height: 1000 }, sections: { 1: { id: `${SLUG}-section-2`, width: 1200, height: 800 } } });
  assert.equal(doc.en.coverAlt, 'A launch checklist on a project team’s screen.');
  assert.equal(doc.en.coverCaption, 'The team’s launch board.');
  assert.equal(doc.en.sections[1].imageAlt, 'The accessibility checklist.');
  assert.ok(!('imageAlt' in doc.en.sections[0]));
  assert.deepEqual(validateDocument(doc, SLUG, known).problems, []);
  assert.deepEqual(imagesOn(), [`${DIR}/${SLUG}-cover-1.webp`, `${DIR}/${SLUG}-section-2.png`]);
  assert.ok(Buffer.compare(gh.fileOn(BRANCH, `${DIR}/${SLUG}-cover-1.webp`), cover) === 0);
  assert.equal(r.data.sha, gitSha(gh.fileOn(BRANCH, inFile(SLUG))));
  assert.equal(gh.state.commits.size, 2, 'one commit per change');
  assert.equal(gh.fileOn(BASE, `${DIR}/${SLUG}-cover-1.webp`), undefined);
  const res = await call('GET', `/api/insights/${SLUG}/images/${SLUG}-section-2`, { raw: true });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'image/png');
});

test('replacing and removing: old files are deleted in the same commit; the last removal removes the images entry', async () => {
  await add('cover', await picture(2000, 1000), { caption: 'A caption.' });
  assert.equal((await add('cover', await picture(1800, 900, 'jpeg'))).status, 200);
  assert.deepEqual(imagesOn(), [`${DIR}/${SLUG}-cover-2.jpg`]);
  assert.ok(!('coverCaption' in stored().en), 'a replacement without a caption has none');
  await add('section', await picture(1200, 800), { index: 0 });
  assert.equal((await remove('cover')).status, 200);
  assert.ok(!('coverAlt' in stored().en) && !stored().images.cover);
  assert.equal((await remove('section', 0)).status, 200);
  const doc = stored();
  assert.ok(!('images' in doc) && !('imageAlt' in doc.en.sections[0]));
  assert.deepEqual(imagesOn(), []);
  assert.equal((await remove('section', 0)).status, 404);
  assert.equal(gh.fileOn(BRANCH, inFile(SLUG)), JSON.stringify(doc, null, 2) + '\n', 'canonical file again');
});

test('alt text and captions are then edited with a normal draft save; an emptied caption is removed, an emptied alt refused', async () => {
  await add('cover', await picture(2000, 1000), { caption: 'A caption.' });
  const g = await call('GET', `/api/insights/${SLUG}`);
  const en = structuredClone(g.data.content.en);
  en.coverAlt = 'An updated description of the launch board.';
  en.coverCaption = '';
  const s = await call('POST', `/api/insights/${SLUG}/draft`, { body: { content: { en }, expectedSha: g.data.sha } });
  assert.equal(s.status, 200, s.text);
  assert.equal(stored().en.coverAlt, 'An updated description of the launch board.');
  assert.ok(!('coverCaption' in stored().en));
  const g2 = await call('GET', `/api/insights/${SLUG}`);
  const en2 = structuredClone(g2.data.content.en);
  en2.coverAlt = ' ';
  en2.sections[0].imageAlt = 'There is no image here.';
  const bad = await call('POST', `/api/insights/${SLUG}/draft`, { body: { content: { en: en2 }, expectedSha: g2.data.sha } });
  assert.equal(bad.status, 422);
  assert.ok(bad.data.error.fields['en.coverAlt'] && bad.data.error.fields['en.sections.0.imageAlt']);
});

test('refused before anything is written: bad files, a missing section, missing alt text, Greek text, stale versions, published articles', async () => {
  const exif = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#000' } }).jpeg().withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).toBuffer();
  for (const [buf, re] of [[Buffer.from('<svg/>'), /not a PNG/], [exif, /embedded data/], [await picture(300, 300), /320 to 8000/]]) {
    const r = await add('cover', buf);
    assert.equal(r.status, 422);
    assert.match(r.data.error.fields.file, re);
  }
  assert.match((await add('section', await picture(1200, 800), { index: 5 })).data.error.fields.file, /no such section/);
  assert.equal((await add('section', await picture(1200, 800), { index: 'x' })).status, 422);
  assert.ok((await add('cover', await picture(1200, 800), { alt: '' })).data.error.fields.alt);
  assert.ok((await add('cover', await picture(1200, 800), { alt: { en: 'An object, as for case studies.' } })).data.error.fields.alt, 'articles take a plain English string');
  assert.equal((await add('gallery', await picture(1200, 800))).status, 400, 'articles have no gallery');
  const stale = sha;
  sha = '0'.repeat(40);
  assert.equal((await add('cover', await picture(1200, 800))).status, 409);
  sha = stale;
  const published = 'what-every-eu-project-website-should-include';
  const r = await call('POST', `/api/insights/${published}/images`, { body: { expectedSha: gitSha(read(inFile(published))), slot: 'cover', data: (await picture(1200, 800)).toString('base64'), alt: 'x' } });
  assert.equal(r.status, 409);
  assert.equal(gh.state.commits.size, 0);
  for (const ctx of [{}, ctxFor('intruder')]) assert.equal((await call('POST', `/api/insights/${SLUG}/images`, { ctx, body: {} })).status, 401);
});

// ---------- publishing ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-m7-images-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('a new article with a cover and a section image publishes: the build and every site validator pass', { timeout: 180_000 }, async () => {
  assert.equal((await add('cover', await picture(2000, 1000, 'webp', '#080e1e'), { caption: 'The team’s launch board.' })).status, 200);
  assert.equal((await add('section', await picture(1200, 800, 'png', '#1fddfc'), { index: 1, alt: 'The accessibility checklist.' })).status, 200);
  const placed = [...gh.state.branches[BRANCH].files.entries()].filter(([p]) => p === inFile(SLUG) || p.startsWith(`${DIR}/${SLUG}-`));
  assert.equal(placed.length, 3);
  try {
    for (const [p, content] of placed) {
      fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true });
      fs.writeFileSync(path.join(repo, p), content);
    }
    const out = path.join(tmp, 'dist');
    const node = (args) => spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
    const b = node([path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', out]);
    assert.equal(b.status, 0, b.stderr || b.stdout);
    for (const v of ['scripts/content/validate.mjs', 'scripts/content/validate-legal.mjs', 'scripts/content/validate-insights.mjs', 'scripts/content/validate-redirects.mjs', 'scripts/seo/validate.mjs', 'scripts/security/validate.mjs', 'scripts/assets/validate.mjs']) {
      const r = node([path.join(repo, v), '--dist', out]);
      assert.equal(r.status, 0, `${v}\n${r.stdout}${r.stderr}`);
    }
    const page = fs.readFileSync(path.join(out, 'insights', `${SLUG}.html`), 'utf8');
    assert.match(page, new RegExp(`<img[^>]+src="/_astro/${SLUG}-cover-1\\.[^"]+\\.webp"[^>]*alt="A launch checklist on a project team’s screen\\."|alt="A launch checklist on a project team’s screen\\."[^>]+src="/_astro/${SLUG}-cover-1\\.`));
    assert.match(page, /<figcaption[^>]*>The team’s launch board\.<\/figcaption>/);
    const s2 = page.match(/<section aria-labelledby="s2-h"[\s\S]*?<\/section>/)[0];
    assert.match(s2, new RegExp(`/_astro/${SLUG}-section-2\\.`), 'the section image is inside its section');
    const graph = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    assert.ok(!('image' in graph.find((n) => n['@type'] === 'Article')), 'the Article data still has no image');
  } finally {
    for (const [p] of placed) fs.rmSync(path.join(repo, p), { force: true });
    fs.rmSync(path.join(repo, 'content', 'insights', SLUG), { recursive: true, force: true });
    if (fs.existsSync(path.join(repo, DIR)) && !fs.readdirSync(path.join(repo, DIR)).length) fs.rmdirSync(path.join(repo, DIR));
  }
});
