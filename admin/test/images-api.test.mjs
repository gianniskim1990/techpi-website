// Task M6: images of a new case study through the admin API (mocked GitHub): add, replace, remove and preview; every
// refusal; one commit per change; and the end-to-end publish of a case study with uploaded images (real build and every
// site validator, with the files placed in the repository).
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
import { CONNECTED_SLUGS, validateDocument } from '../shared/case-study-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m6-images';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const csFile = (slug) => `content/case-studies/${slug}/index.json`;
const DIR = 'src/assets/projects';
const SLUG = 'harbour-booking';
const BRANCH = `cms/case-studies/${SLUG}`;
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });

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

const CASE = {
  facts: { slug: SLUG, name: 'Harbour Booking', client: 'Harbour Ltd', year: 2026, workGroup: 'client', capabilities: ['web-experiences'] },
  en: { category: 'Booking platform', summary: 'A booking platform for a harbour business, with online reservations and an admin panel for staff.', overview: ['Harbour Ltd needed a simple way to take reservations online.'], need: ['Reservations were taken by phone and recorded on paper.'], builtIntro: 'We built a booking platform with a staff admin.' },
  el: { category: 'Πλατφόρμα κρατήσεων', summary: 'Μια πλατφόρμα κρατήσεων για επιχείρηση στο λιμάνι, με online κρατήσεις και διαχείριση για το προσωπικό.', overview: ['Η Harbour χρειαζόταν έναν απλό τρόπο για online κρατήσεις.'], need: ['Οι κρατήσεις γίνονταν τηλεφωνικά και καταγράφονταν σε χαρτί.'], builtIntro: 'Φτιάξαμε μια πλατφόρμα κρατήσεων με διαχείριση για το προσωπικό.' },
};
const picture = (w, h, fmt = 'webp', colour = '#1d4ed8') => sharp({ create: { width: w, height: h, channels: 3, background: colour } })[fmt]().toBuffer();
const ALT = { en: 'The reservation screen of the booking platform.', el: 'Η οθόνη κράτησης της πλατφόρμας.' };
let sha;
const add = async (slot, buf, extra = {}) => {
  const r = await call('POST', `/api/case-studies/${SLUG}/images`, { body: { expectedSha: sha, slot, data: buf.toString('base64'), alt: ALT, ...extra } });
  if (r.status === 200) sha = r.data.sha;
  return r;
};
const remove = async (slot, index) => {
  const r = await call('POST', `/api/case-studies/${SLUG}/images/remove`, { body: { expectedSha: sha, slot, index } });
  if (r.status === 200) sha = r.data.sha;
  return r;
};
const stored = () => JSON.parse(gh.fileOn(BRANCH, csFile(SLUG)));
const imagesOn = () => [...gh.state.branches[BRANCH].files.keys()].filter((p) => p.startsWith(`${DIR}/`)).sort();
const read = (p) => fs.readFileSync(path.join(repo, p), 'utf8').replace(/\r\n/g, '\n');

beforeEach(async () => {
  resetTokenCache();
  const files = {};
  for (const s of CONNECTED_SLUGS) files[csFile(s)] = read(csFile(s));
  for (const f of fs.readdirSync(path.join(repo, DIR))) files[`${DIR}/${f}`] = fs.readFileSync(path.join(repo, DIR, f));
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: files } });
  globalThis.fetch = gh.fetch;
  const r = await call('POST', '/api/case-studies', { body: { content: CASE } });
  assert.equal(r.status, 201, r.text);
  sha = r.data.sha;
});

test('adding a row image: one commit with the file and the updated case study; nothing else changes', async () => {
  const before = gh.state.writes.length;
  const buf = await picture(1600, 1000);
  const r = await add('image', buf);
  assert.equal(r.status, 200, r.text);
  const doc = stored();
  assert.deepEqual(doc.images.image, { id: `${SLUG}-image-1`, width: 1600, height: 1000 });
  assert.equal(doc.en.imageAlt, ALT.en);
  assert.equal(doc.el.imageAlt, ALT.el);
  assert.deepEqual(validateDocument(doc, SLUG).problems, []);
  assert.ok(Buffer.compare(gh.fileOn(BRANCH, `${DIR}/${SLUG}-image-1.webp`), buf) === 0, 'the exact bytes');
  assert.equal(r.data.sha, gitSha(gh.fileOn(BRANCH, csFile(SLUG))), 'the returned version is the stored file');
  const writes = gh.state.writes.slice(before);
  assert.deepEqual(writes.map((w) => `${w.method} ${w.branch}`), [`PATCH ${BRANCH}`], 'one ref update, on the draft branch only');
  assert.equal(gh.state.commits.size, 1, 'exactly one commit');
  assert.equal(gh.fileOn(BASE, `${DIR}/${SLUG}-image-1.webp`), undefined, 'the base is untouched');
  assert.equal(gh.fileOn('main', `${DIR}/${SLUG}-image-1.webp`), undefined);
  // The preview returns the file with its real type.
  const res = await call('GET', `/api/case-studies/${SLUG}/images/${SLUG}-image-1`, { raw: true });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'image/webp');
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.ok(Buffer.compare(Buffer.from(await res.arrayBuffer()), buf) === 0);
});

test('replacing the cover writes a new file and deletes the old one in the same commit; captions follow', async () => {
  assert.equal((await add('cover', await picture(2000, 900, 'png'), { caption: { en: 'The booking flow.', el: 'Η ροή κράτησης.' } })).status, 200);
  assert.equal(stored().en.coverCaption, 'The booking flow.');
  assert.deepEqual(imagesOn().filter((p) => p.includes(SLUG)), [`${DIR}/${SLUG}-cover-1.png`]);
  const r = await add('cover', await picture(1800, 800, 'jpeg'));
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(imagesOn().filter((p) => p.includes(SLUG)), [`${DIR}/${SLUG}-cover-2.jpg`]);
  const doc = stored();
  assert.equal(doc.images.cover.id, `${SLUG}-cover-2`);
  assert.ok(!('coverCaption' in doc.en) && !('coverCaption' in doc.el), 'a replacement without a caption has none');
  assert.deepEqual(validateDocument(doc, SLUG).problems, []);
});

test('gallery: add, remove (the file goes too), and the last removal removes the gallery', async () => {
  assert.equal((await add('gallery', await picture(1200, 900))).status, 200);
  assert.equal((await add('gallery', await picture(900, 1200), { alt: { en: 'Second screen of the platform.', el: 'Δεύτερη οθόνη της πλατφόρμας.' } })).status, 200);
  let doc = stored();
  assert.deepEqual(doc.images.gallery.map((g) => g.id), [`${SLUG}-gallery-1`, `${SLUG}-gallery-2`]);
  assert.equal(doc.el.galleryAlts[1], 'Δεύτερη οθόνη της πλατφόρμας.');
  assert.equal((await remove('gallery', 0)).status, 200);
  doc = stored();
  assert.deepEqual(doc.images.gallery.map((g) => g.id), [`${SLUG}-gallery-2`]);
  assert.deepEqual(doc.en.galleryAlts, ['Second screen of the platform.']);
  assert.deepEqual(imagesOn().filter((p) => p.includes(SLUG)), [`${DIR}/${SLUG}-gallery-2.webp`]);
  assert.equal((await remove('gallery', 0)).status, 200);
  doc = stored();
  assert.ok(!('gallery' in doc.images) && !('galleryAlts' in doc.en));
  assert.deepEqual(imagesOn().filter((p) => p.includes(SLUG)), []);
  assert.equal((await remove('gallery', 0)).status, 404);
});

test('alt texts of uploaded images are then edited like any other text, with a normal draft save', async () => {
  await add('image', await picture(1600, 1000));
  const g = await call('GET', `/api/case-studies/${SLUG}`);
  const c = { en: g.data.content.en, el: g.data.content.el };
  c.en.imageAlt = 'An updated description of the reservation screen.';
  const s = await call('POST', `/api/case-studies/${SLUG}/draft`, { body: { content: c, expectedSha: g.data.sha } });
  assert.equal(s.status, 200, s.text);
  assert.equal(stored().en.imageAlt, 'An updated description of the reservation screen.');
});

test('refused before anything is written: not an image, hidden data, wrong size, too large, missing alt text, bad requests', async () => {
  const commits = () => gh.state.commits.size;
  const cases = [
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), {}, /not a PNG, JPEG or WebP/],
    [Buffer.from('GIF89a........'), {}, /not a PNG, JPEG or WebP/],
    [await sharp({ create: { width: 800, height: 600, channels: 3, background: '#000' } }).jpeg().withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).toBuffer(), {}, /embedded data \(EXIF\)/],
    [await picture(200, 1000), {}, /320 to 8000 pixels/],
  ];
  for (const [buf, extra, re] of cases) {
    const r = await add('image', buf, extra);
    assert.equal(r.status, 422, String(re));
    assert.match(r.data.error.fields.file, re);
  }
  const noAlt = await add('image', await picture(1600, 1000), { alt: { en: 'Only English.' } });
  assert.equal(noAlt.status, 422);
  assert.ok(noAlt.data.error.fields['alt.el']);
  const markup = await add('image', await picture(1600, 1000), { alt: { en: '<img src=x>', el: 'Περιγραφή.' } });
  assert.ok(markup.data.error.fields['alt.en']);
  const huge = crypto.randomBytes(3_200_000);
  assert.ok([413, 422].includes((await add('image', huge)).status), 'more than 3 MB');
  assert.equal((await add('banner', await picture(1600, 1000))).status, 400, 'unknown place');
  assert.equal((await call('POST', `/api/case-studies/${SLUG}/images`, { body: { slot: 'image', data: 'AAAA', alt: ALT } })).status, 400, 'no version');
  assert.equal(commits(), 0);
  assert.equal(stored().images.image, undefined);
});

test('a stale version or a branch that moved meanwhile is refused, and nothing changes', async () => {
  const stale = sha;
  assert.equal((await add('image', await picture(1600, 1000))).status, 200);
  const old = sha;
  sha = stale;
  const r = await add('cover', await picture(1600, 1000));
  assert.equal(r.status, 409);
  assert.equal(r.data.error.conflict, true);
  sha = old;
  gh.failNext(/^PATCH \/repos\/[^/]+\/[^/]+\/git\/refs\/heads\//, 422);
  const raced = await add('cover', await picture(1600, 1000));
  assert.equal(raced.status, 409);
  assert.equal(stored().images.cover, undefined, 'the branch still has the previous version');
});

test('images of a published case study, a case study without a draft, and other entries are not touched', async () => {
  const rocket = JSON.parse(read(csFile('rocketeer')));
  const r = await call('POST', '/api/case-studies/rocketeer/images', { body: { expectedSha: gitSha(read(csFile('rocketeer'))), slot: 'gallery', data: (await picture(1600, 1000)).toString('base64'), alt: ALT } });
  assert.equal(r.status, 409);
  assert.match(r.data.error.message, /Create the case study first|already on the website/);
  assert.equal((await call('POST', '/api/case-studies/not-there/images/remove', { body: { expectedSha: sha, slot: 'image' } })).status, 409);
  // The preview serves only images the case study uses.
  assert.equal((await call('GET', `/api/case-studies/${SLUG}/images/rocketeer-sign-in`)).status, 404);
  assert.equal((await call('GET', `/api/case-studies/${SLUG}/images/..%2F..%2Fsecret`)).status, 400);
  assert.equal((await call('GET', '/api/case-studies/rocketeer/images/rocketeer-sign-in', { raw: true })).status, 200, 'a published image previews too');
  assert.equal(gh.state.commits.size, 0);
  assert.deepEqual(JSON.parse(gh.fileOn(BASE, csFile('rocketeer'))), rocket);
});

test('uploading needs the signed-in owner and the admin itself', async () => {
  const body = { expectedSha: sha, slot: 'image', data: (await picture(1600, 1000)).toString('base64'), alt: ALT };
  for (const ctx of [{}, ctxFor('intruder')]) assert.equal((await call('POST', `/api/case-studies/${SLUG}/images`, { ctx, body })).status, 401);
  assert.equal((await call('POST', `/api/case-studies/${SLUG}/images`, { body, headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await call('GET', `/api/case-studies/${SLUG}/images/x`, { headers: { 'X-TechPi-Admin': '' } })).status, 403);
  assert.equal(gh.state.commits.size, 0);
});

// ---------- publishing: the uploaded files build and pass every site validator ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-m6-images-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('a new case study with uploaded images publishes: the build and every site validator pass', { timeout: 180_000 }, async () => {
  assert.equal((await add('image', await picture(1600, 1000, 'webp', '#0841c8'))).status, 200);
  assert.equal((await add('cover', await picture(2400, 1000, 'png', '#080e1e'), { caption: { en: 'The booking flow.', el: 'Η ροή κράτησης.' } })).status, 200);
  assert.equal((await add('gallery', await picture(1200, 900, 'jpeg', '#1fddfc'))).status, 200);
  const placed = [...gh.state.branches[BRANCH].files.entries()].filter(([p]) => p === csFile(SLUG) || p.startsWith(`${DIR}/${SLUG}-`));
  assert.equal(placed.length, 4);
  try {
    for (const [p, content] of placed) {
      fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true });
      fs.writeFileSync(path.join(repo, p), content);
    }
    const out = path.join(tmp, 'dist');
    const node = (args) => spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
    const b = node([path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', out]);
    assert.equal(b.status, 0, b.stderr || b.stdout);
    for (const v of ['scripts/content/validate.mjs', 'scripts/content/validate-legal.mjs', 'scripts/content/validate-redirects.mjs', 'scripts/seo/validate.mjs', 'scripts/security/validate.mjs', 'scripts/assets/validate.mjs']) {
      const r = node([path.join(repo, v), '--dist', out]);
      assert.equal(r.status, 0, `${v}\n${r.stdout}${r.stderr}`);
    }
    const page = fs.readFileSync(path.join(out, 'work', `${SLUG}.html`), 'utf8');
    for (const id of [`${SLUG}-cover-2`, `${SLUG}-gallery-3`]) assert.match(page, new RegExp(`/_astro/${id}\\.[^"]+\\.webp`), id);
    assert.match(page, /The booking flow\./);
    assert.match(fs.readFileSync(path.join(out, 'el', 'work', `${SLUG}.html`), 'utf8'), /Η ροή κράτησης\./);
    assert.match(fs.readFileSync(path.join(out, 'work.html'), 'utf8'), new RegExp(`/_astro/${SLUG}-image-1\\.[^"]+\\.webp`), 'the row image on the Work page');
  } finally {
    for (const [p] of placed) fs.rmSync(path.join(repo, p), { force: true });
    fs.rmSync(path.join(repo, 'content', 'case-studies', SLUG), { recursive: true, force: true });
  }
});
