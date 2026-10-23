// Task M8: the media library through the admin API (mocked GitHub): uploads, the library list, details edits and
// removal, all on the one library draft branch; a new case study or article using a library image; every refusal; and the
// end-to-end publish (real build and every site validator, with the files placed in the repository): a used library
// image is built, an unused one is not.
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
import { INSIGHT_SLUGS } from '../shared/insight-content.js';
import { newMediaId, isMediaId, serializeDetails, validateDetails } from '../shared/media-content.js';

const ORIGIN = 'https://admin.example.test';
const BASE = 'feat/techpi-admin-m8-media';
const LIB = 'cms/media/library';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs1', format: 'pem' });
const today = new Date().toISOString().slice(0, 10);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-m8-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

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

const picture = (w, h, fmt = 'webp', colour = '#0841c8') => sharp({ create: { width: w, height: h, channels: 3, background: colour } })[fmt]().toBuffer();
const thumbOf = (w = 480, h = 320) => picture(w, h, 'webp', '#999999');
const read = (p) => fs.readFileSync(path.join(repo, p), 'utf8').replace(/\r\n/g, '\n');
const upload = async (title, extra = {}) => call('POST', '/api/media', { body: { data: (await picture(1600, 1000)).toString('base64'), thumb: (await thumbOf()).toString('base64'), title, ...extra } });
const list = async () => { const r = await call('GET', '/api/media'); assert.equal(r.status, 200, r.text); return r.data; };
const libFiles = (branch = LIB) => [...gh.state.branches[branch].files.keys()].filter((p) => p.startsWith('src/assets/media/') || p.startsWith('content/media/')).sort();

const CASE = {
  facts: { slug: 'harbour-booking', name: 'Harbour Booking', client: 'Harbour Ltd', year: 2026, workGroup: 'client', capabilities: ['web-experiences'] },
  en: { category: 'Booking platform', summary: 'A booking platform for a harbour business, with online reservations and an admin panel for staff.', overview: ['Harbour Ltd needed a simple way to take reservations online.'], need: ['Reservations were taken by phone and recorded on paper.'], builtIntro: 'We built a booking platform with a staff admin.' },
  el: { category: 'Πλατφόρμα κρατήσεων', summary: 'Μια πλατφόρμα κρατήσεων για επιχείρηση στο λιμάνι, με online κρατήσεις και διαχείριση για το προσωπικό.', overview: ['Η Harbour χρειαζόταν έναν απλό τρόπο για online κρατήσεις.'], need: ['Οι κρατήσεις γίνονταν τηλεφωνικά και καταγράφονταν σε χαρτί.'], builtIntro: 'Φτιάξαμε μια πλατφόρμα κρατήσεων με διαχείριση για το προσωπικό.' },
};
const ARTICLE = {
  facts: { slug: 'planning-a-project-website-launch', published: today },
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

// A library image already published on the base branch: "team-at-work".
let published;
beforeEach(async () => {
  resetTokenCache();
  const files = {};
  for (const s of CONNECTED_SLUGS) files[`content/case-studies/${s}/index.json`] = read(`content/case-studies/${s}/index.json`);
  for (const s of INSIGHT_SLUGS) files[`content/insights/${s}/index.json`] = read(`content/insights/${s}/index.json`);
  for (const f of fs.readdirSync(path.join(repo, 'src/assets/projects'))) files[`src/assets/projects/${f}`] = fs.readFileSync(path.join(repo, 'src/assets/projects', f));
  published = await picture(1200, 800, 'webp', '#334455');
  files['src/assets/media/team-at-work.webp'] = published;
  files['content/media/team-at-work/thumb.webp'] = await thumbOf();
  files['content/media/team-at-work/index.json'] = serializeDetails({ id: 'team-at-work', width: 1200, height: 800, ext: 'webp', thumb: 'thumb.webp', uploaded: '2026-10-01' }, { title: 'Team at work', alt: { en: 'The team at a whiteboard.', el: 'Η ομάδα σε έναν πίνακα.' } });
  gh = createMockGitHub({ publicKey, branches: { main: { 'README.md': 'main' }, [BASE]: files } });
  globalThis.fetch = gh.fetch;
});

test('ids: made from the title (Greek too), unique, never shaped like an entry upload', () => {
  const none = () => false;
  assert.equal(newMediaId('Office at the harbour!', none), 'office-at-the-harbour');
  assert.equal(newMediaId('Γραφείο στο λιμάνι', none), 'grafeio-sto-limani');
  assert.equal(newMediaId('***', none), 'image');
  assert.equal(newMediaId('Team at work', (id) => id === 'team-at-work'), 'team-at-work-2');
  assert.equal(newMediaId('harbour cover 1', none), 'harbour-cover-1-img');
  assert.ok(!isMediaId('harbour-booking-gallery-3'));
  assert.ok(isMediaId('team-at-work'));
  assert.ok(validateDetails(JSON.parse(serializeDetails({ id: 'a-b', width: 1, height: 1, ext: 'png', thumb: 'thumb.jpg', uploaded: '2026-10-23' }, { title: 'A' })), 'a-b').ok);
});

test('uploads go to one library draft: one branch, one draft pull request, a commit per image, the base untouched', async () => {
  const baseBefore = gh.state.branches[BASE].head;
  const a = await upload('Harbour office', { alt: { en: 'The harbour office from the quay.', el: 'Το γραφείο στο λιμάνι.' }, caption: { en: 'Our harbour office.' } });
  assert.equal(a.status, 201, a.text);
  assert.equal(a.data.item.id, 'harbour-office');
  assert.equal(a.data.item.status, 'new');
  assert.equal(a.data.pending.branch, LIB);
  const b = await upload('Harbour office');
  assert.equal(b.status, 201, b.text);
  assert.equal(b.data.item.id, 'harbour-office-2', 'the same title gets a new id');
  assert.equal(b.data.pending.number, a.data.pending.number, 'one draft pull request for the library');
  assert.equal(gh.state.prs.filter((p) => p.head.ref === LIB).length, 1);
  const pr = gh.state.prs.find((p) => p.head.ref === LIB);
  assert.equal(pr.draft, true);
  assert.equal(pr.base.ref, BASE);
  assert.equal(gh.state.branches[BASE].head, baseBefore, 'the base branch is not changed');
  assert.ok(gh.state.writes.every((w) => w.branch === LIB), 'every write is on the library branch');
  assert.deepEqual(libFiles(), [
    'content/media/harbour-office-2/index.json', 'content/media/harbour-office-2/thumb.webp',
    'content/media/harbour-office/index.json', 'content/media/harbour-office/thumb.webp',
    'content/media/team-at-work/index.json', 'content/media/team-at-work/thumb.webp',
    'src/assets/media/harbour-office-2.webp', 'src/assets/media/harbour-office.webp', 'src/assets/media/team-at-work.webp',
  ]);
  const details = JSON.parse(gh.fileOn(LIB, 'content/media/harbour-office/index.json'));
  assert.deepEqual(details, { id: 'harbour-office', title: 'Harbour office', width: 1600, height: 1000, ext: 'webp', thumb: 'thumb.webp', uploaded: today, alt: { en: 'The harbour office from the quay.', el: 'Το γραφείο στο λιμάνι.' }, caption: { en: 'Our harbour office.' } });
  assert.equal(gh.state.commits.get(gh.state.branches[LIB].head).message, 'Draft: add harbour-office-2 to the media library (TechPi Admin)');
});

test('the library lists its images and the images case studies use, with where each is used', async () => {
  await upload('Harbour office');
  const data = await list();
  assert.equal(data.pending.branch, LIB);
  const byId = Object.fromEntries(data.items.map((x) => [x.id, x]));
  assert.equal(byId['harbour-office'].status, 'new');
  assert.equal(byId['harbour-office'].library, true);
  assert.equal(byId['team-at-work'].status, 'published');
  assert.equal(byId['team-at-work'].title, 'Team at work');
  assert.deepEqual(byId['team-at-work'].alt, { en: 'The team at a whiteboard.', el: 'Η ομάδα σε έναν πίνακα.' });
  assert.match(byId['team-at-work'].sha, /^[0-9a-f]{40}$/);
  const site = data.items.filter((x) => !x.library);
  assert.equal(site.length, fs.readdirSync(path.join(repo, 'src/assets/projects')).length, 'every project image is listed');
  for (const x of site) {
    assert.equal(x.folder, 'projects');
    assert.ok(x.usedBy.length >= 1 && x.usedBy[0].collection === 'case-studies' && x.usedBy[0].published, `${x.id} shows its case study`);
    assert.ok(x.width > 0 && x.height > 0);
  }
  assert.ok(data.items.findIndex((x) => !x.library) > data.items.findIndex((x) => x.id === 'team-at-work'), 'library images first');
  // Thumbnails and files are served with their real type.
  const t = await call('GET', '/api/media/team-at-work/thumb', { raw: true });
  assert.equal(t.status, 200);
  assert.equal(t.headers.get('Content-Type'), 'image/webp');
  assert.equal((await sharp(Buffer.from(await t.arrayBuffer())).metadata()).width, 480);
  const f = await call('GET', '/api/media/team-at-work/file', { raw: true });
  assert.equal((await sharp(Buffer.from(await f.arrayBuffer())).metadata()).width, 1200);
  const s = await call('GET', `/api/media/${site[0].id}/thumb`, { raw: true });
  assert.equal(s.status, 200, 'a project image has no small copy: the image itself is served');
  assert.equal((await call('GET', '/api/media/no-such-image/file')).status, 404);
  // By content hash, as the library view loads them: images only.
  const byHash = await call('GET', `/api/media/blobs/${byId['team-at-work'].thumb}`, { raw: true });
  assert.equal(byHash.status, 200);
  assert.equal((await sharp(Buffer.from(await byHash.arrayBuffer())).metadata()).width, 480);
  assert.equal(byId['team-at-work'].file, gitSha(published));
  assert.equal(byId['harbour-office'].thumb, gitSha(gh.fileOn(LIB, 'content/media/harbour-office/thumb.webp')));
  assert.equal((await call('GET', `/api/media/blobs/${byId['team-at-work'].sha}`)).status, 404, 'a details file is not served');
  assert.equal((await call('GET', `/api/media/blobs/${'0'.repeat(40)}`)).status, 404);
});

test('details are edited on the library draft, against the version opened', async () => {
  const before = (await list()).items.find((x) => x.id === 'team-at-work');
  const stale = await call('POST', '/api/media/team-at-work', { body: { expectedSha: '0'.repeat(40), title: 'Team' } });
  assert.equal(stale.status, 409);
  const bad = await call('POST', '/api/media/team-at-work', { body: { expectedSha: before.sha, title: '', alt: { en: 'a<b' } } });
  assert.equal(bad.status, 422);
  assert.ok(bad.data.error.fields.title && bad.data.error.fields['alt.en']);
  const same = await call('POST', '/api/media/team-at-work', { body: { expectedSha: before.sha, title: 'Team at work', alt: before.alt } });
  assert.equal(same.status, 200);
  assert.equal(same.data.changed, false);
  assert.equal(gh.state.branches[LIB], undefined, 'nothing written when nothing changed');
  const r = await call('POST', '/api/media/team-at-work', { body: { expectedSha: before.sha, title: 'The team at work', alt: { en: 'The team planning at a whiteboard.' }, caption: { el: 'Η ομάδα.' } } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.data.changed, true);
  const d = JSON.parse(gh.fileOn(LIB, 'content/media/team-at-work/index.json'));
  assert.equal(d.title, 'The team at work');
  assert.deepEqual(d.alt, { en: 'The team planning at a whiteboard.' });
  assert.deepEqual(d.caption, { el: 'Η ομάδα.' });
  assert.equal(d.width, 1200, 'fixed details are kept');
  const after = (await list()).items.find((x) => x.id === 'team-at-work');
  assert.equal(after.edited, true);
  assert.equal(after.sha, r.data.sha);
  // A case study's image is not edited in the library.
  const site = (await list()).items.find((x) => !x.library);
  assert.equal((await call('POST', `/api/media/${site.id}`, { body: { expectedSha: before.sha, title: 'x' } })).status, 404);
});

test('a new case study and a new article use library images: the reference is saved, the file brought into the draft only when needed', async () => {
  await upload('Harbour office', { alt: { en: 'The harbour office.', el: 'Το γραφείο.' } });
  // A new case study.
  const cs = structuredClone(CASE);
  const c = await call('POST', '/api/case-studies', { body: { content: cs } });
  assert.equal(c.status, 201, c.text);
  const slug = cs.facts.slug;
  const branch = `cms/case-studies/${slug}`;
  let sha = c.data.sha;
  const use = async (id, slot, extra = {}) => {
    const r = await call('POST', `/api/case-studies/${slug}/images/use`, { body: { expectedSha: sha, slot, id, alt: { en: 'The harbour office.', el: 'Το γραφείο.' }, ...extra } });
    if (r.status === 200) sha = r.data.sha;
    return r;
  };
  // The library image is only in the library's draft: it is brought into the case study's draft in the same commit.
  const u = await use('harbour-office', 'cover');
  assert.equal(u.status, 200, u.text);
  assert.deepEqual(u.data.content.images.cover, { id: 'harbour-office', width: 1600, height: 1000 });
  assert.ok(Buffer.from(gh.fileOn(branch, 'src/assets/media/harbour-office.webp')).equals(Buffer.from(gh.fileOn(LIB, 'src/assets/media/harbour-office.webp'))), 'the same file, unchanged');
  assert.equal(gh.state.commits.get(gh.state.branches[branch].head).message, `Draft: use harbour-office from the media library as a cover of ${slug} (TechPi Admin)`);
  // A published library image needs no copy.
  const p = await use('team-at-work', 'image');
  assert.equal(p.status, 200, p.text);
  assert.equal(gh.fileOn(branch, 'src/assets/media/team-at-work.webp') !== undefined, true, 'already on the branch from the base');
  // The library shows where they are used, and refuses to delete them.
  const items = Object.fromEntries((await list()).items.map((x) => [x.id, x]));
  assert.deepEqual(items['harbour-office'].usedBy.map((u2) => [u2.collection, u2.slug, u2.draft]), [['case-studies', slug, true]]);
  const del = await call('POST', '/api/media/harbour-office/delete', { body: {} });
  assert.equal(del.status, 409);
  assert.match(del.data.error.message, /is used by/);
  // Replacing the cover with an upload removes the brought-in library file from the case study's draft (it is still in the library).
  const up = await call('POST', `/api/case-studies/${slug}/images`, { body: { expectedSha: sha, slot: 'cover', data: (await picture(1400, 900)).toString('base64'), alt: { en: 'A new cover.', el: 'Νέο εξώφυλλο.' } } });
  assert.equal(up.status, 200, up.text);
  sha = up.data.sha;
  assert.equal(gh.fileOn(branch, 'src/assets/media/harbour-office.webp'), undefined);
  assert.ok(gh.fileOn(LIB, 'src/assets/media/harbour-office.webp'));
  assert.ok(gh.fileOn(branch, 'src/assets/media/team-at-work.webp'), 'a published library image is never removed');
  // A preview of a library image the case study uses.
  const pv = await call('GET', `/api/case-studies/${slug}/images/team-at-work`, { raw: true });
  assert.equal(pv.status, 200);
  // Refusals: no such image, missing alt, stale version, a published case study.
  assert.equal((await use('no-such-image', 'gallery')).status, 422);
  const noAlt = await use('team-at-work', 'gallery', { alt: { en: 'Only English.' } });
  assert.equal(noAlt.status, 422);
  assert.ok(noAlt.data.error.fields['alt.el']);
  assert.equal((await call('POST', `/api/case-studies/${slug}/images/use`, { body: { expectedSha: '0'.repeat(40), slot: 'gallery', id: 'team-at-work', alt: { en: 'a', el: 'b' } } })).status, 409);
  assert.equal((await call('POST', `/api/case-studies/${CONNECTED_SLUGS[0]}/images/use`, { body: { expectedSha: '0'.repeat(40), slot: 'gallery', id: 'team-at-work', alt: { en: 'a', el: 'b' } } })).status, 409);

  // A new article uses a case study's published image: nothing is copied.
  const art = structuredClone(ARTICLE);
  art.facts.published = today;
  const a = await call('POST', '/api/insights', { body: { content: art } });
  assert.equal(a.status, 201, a.text);
  const projectImage = fs.readdirSync(path.join(repo, 'src/assets/projects'))[0].replace(/\.[a-z]+$/, '');
  const writes = gh.state.writes.length;
  const ua = await call('POST', `/api/insights/${art.facts.slug}/images/use`, { body: { expectedSha: a.data.sha, slot: 'cover', id: projectImage, alt: 'A screen from one of our projects.' } });
  assert.equal(ua.status, 200, ua.text);
  assert.equal(ua.data.content.images.cover.id, projectImage);
  assert.equal(gh.state.writes.length, writes + 1, 'one commit');
  const tree = [...gh.state.commits.get(gh.state.branches[`cms/insights/${art.facts.slug}`].head).files.keys()];
  assert.ok(!tree.some((p) => p.startsWith('src/assets/insights/')), 'no file added for an existing image');
});

test('removing: an unused library image is removed on the library draft; images in use, of entries or unknown are refused', async () => {
  // A published library image: its removal waits in the library draft.
  const r = await call('POST', '/api/media/team-at-work/delete', { body: {} });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.data.published, true);
  assert.deepEqual(libFiles(), []);
  assert.ok(gh.fileOn(BASE, 'src/assets/media/team-at-work.webp'), 'still on the base until the draft is merged');
  const it = (await list()).items.find((x) => x.id === 'team-at-work');
  assert.equal(it.status, 'removing');
  assert.equal((await call('POST', '/api/media/team-at-work/delete', { body: {} })).status, 409, 'already being removed');
  // A new library image: removed from the draft again.
  await upload('Harbour office');
  assert.equal((await call('POST', '/api/media/harbour-office/delete', { body: {} })).status, 200);
  assert.ok(!(await list()).items.some((x) => x.id === 'harbour-office'));
  // A case study's image, and an unknown one.
  const site = fs.readdirSync(path.join(repo, 'src/assets/projects'))[0].replace(/\.[a-z]+$/, '');
  assert.equal((await call('POST', `/api/media/${site}/delete`, { body: {} })).status, isMediaId(site) ? 409 : 404);
  assert.equal((await call('POST', '/api/media/nothing-here/delete', { body: {} })).status, 404);
});

test('refused before anything is written: bad files and previews, bad text, a leftover branch, no sign-in', async () => {
  const exif = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#123456' } }).jpeg().withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).toBuffer();
  const cases = [
    [{ data: Buffer.from('<svg/>').toString('base64'), thumb: (await thumbOf()).toString('base64'), title: 'x' }, 'file'],
    [{ data: exif.toString('base64'), thumb: (await thumbOf()).toString('base64'), title: 'x' }, 'file'],
    [{ data: (await picture(200, 200)).toString('base64'), thumb: (await thumbOf(200, 200)).toString('base64'), title: 'x' }, 'file'],
    [{ data: (await picture(800, 600)).toString('base64'), thumb: (await thumbOf(900, 600)).toString('base64'), title: 'x' }, 'file'],
    [{ data: (await picture(800, 600)).toString('base64'), thumb: (await picture(480, 320, 'png')).toString('base64'), title: 'x' }, 'file'],
    [{ data: (await picture(800, 600)).toString('base64'), thumb: (await thumbOf()).toString('base64'), title: '' }, 'title'],
    [{ data: (await picture(800, 600)).toString('base64'), thumb: (await thumbOf()).toString('base64'), title: 'x', alt: { en: 'a\nb' } }, 'alt.en'],
  ];
  for (const [body, field] of cases) {
    const r = await call('POST', '/api/media', { body });
    assert.equal(r.status, 422, `${field}: ${r.text}`);
    assert.ok(r.data.error.fields[field], `${field}: ${r.text}`);
  }
  assert.equal(gh.state.writes.length, 0);
  // A leftover library branch that no closed pull request accounts for is never overwritten.
  gh.state.branches[LIB] = { head: 'f'.repeat(40), files: new Map() };
  const blocked = await upload('Harbour office');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.data.error.blocked, true);
  assert.equal(gh.state.writes.length, 0);
  // A closed library draft's branch is started again from the base.
  delete gh.state.branches[LIB];
  assert.equal((await upload('First')).status, 201);
  gh.closePr(gh.state.prs.find((p) => p.head.ref === LIB).number);
  const again = await upload('Second');
  assert.equal(again.status, 201, again.text);
  assert.ok(!gh.fileOn(LIB, 'src/assets/media/first.webp'), 'the closed draft’s upload is not carried over');
  assert.equal(gh.state.prs.filter((p) => p.head.ref === LIB && p.state === 'open').length, 1);
  // No sign-in, and not the admin's own request.
  assert.equal((await call('GET', '/api/media', { ctx: {} })).status, 401);
  assert.equal((await call('POST', '/api/media', { body: {}, headers: { 'X-TechPi-Admin': '' } })).status, 403);
  assert.equal((await call('GET', '/api/media/..%2Fx/file')).status, 400);
});

test('a library image used by a new article publishes; an unused one is not built: the build and every site validator pass', { timeout: 180_000 }, async () => {
  await upload('Harbour office', { alt: { en: 'The harbour office.' } });
  await upload('Unused photo');
  const art = structuredClone(ARTICLE);
  art.facts.published = today;
  const a = await call('POST', '/api/insights', { body: { content: art } });
  assert.equal(a.status, 201, a.text);
  const slug = art.facts.slug;
  const u = await call('POST', `/api/insights/${slug}/images/use`, { body: { expectedSha: a.data.sha, slot: 'cover', id: 'harbour-office', alt: 'The harbour office.' } });
  assert.equal(u.status, 200, u.text);
  // What merging both drafts brings: the library's files and the article.
  const placed = [
    ...[...gh.state.branches[LIB].files.entries()].filter(([p]) => (p.startsWith('src/assets/media/') || p.startsWith('content/media/')) && !p.includes('team-at-work')),
    [`content/insights/${slug}/index.json`, gh.fileOn(`cms/insights/${slug}`, `content/insights/${slug}/index.json`)],
  ];
  assert.equal(placed.length, 7);
  try {
    for (const [p, content] of placed) {
      fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true });
      fs.writeFileSync(path.join(repo, p), content);
    }
    const out = path.join(tmp, 'dist');
    const node = (args) => spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
    const b = node([path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', out]);
    assert.equal(b.status, 0, b.stderr || b.stdout);
    for (const v of ['scripts/content/validate.mjs', 'scripts/content/validate-legal.mjs', 'scripts/content/validate-insights.mjs', 'scripts/content/validate-redirects.mjs', 'scripts/content/validate-cms-media.mjs', 'scripts/seo/validate.mjs', 'scripts/security/validate.mjs', 'scripts/assets/validate.mjs']) {
      const r = node([path.join(repo, v), '--dist', out]);
      assert.equal(r.status, 0, `${v}\n${r.stdout}${r.stderr}`);
    }
    const page = fs.readFileSync(path.join(out, 'insights', `${slug}.html`), 'utf8');
    assert.match(page, /src="\/_astro\/harbour-office\.[^"]+\.webp"/);
    assert.match(page, /alt="The harbour office\."/);
    const built = fs.readdirSync(path.join(out, '_astro'));
    assert.ok(built.some((f) => f.startsWith('harbour-office.')), 'the used library image is built');
    assert.ok(!built.some((f) => f.startsWith('unused-photo.')), 'the unused library image is not');
    assert.ok(!fs.readdirSync(out).includes('content'), 'the library details are not published');
  } finally {
    for (const [p] of placed) fs.rmSync(path.join(repo, p), { force: true });
    fs.rmSync(path.join(repo, 'content', 'insights', slug), { recursive: true, force: true });
    fs.rmSync(path.join(repo, 'content', 'media'), { recursive: true, force: true });
    fs.rmSync(path.join(repo, 'src', 'assets', 'media'), { recursive: true, force: true });
  }
});
