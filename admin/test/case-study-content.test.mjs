// Task M1B: the 18 committed case-study files and the content rules for every shape they have. No GitHub involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDocument, validateEditable, serializeDocument, editableOf, structureOf, CONNECTED_SLUGS, FIELDS } from '../shared/case-study-content.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(repo, 'content', 'case-studies');
const read = (slug) => fs.readFileSync(path.join(dir, slug, 'index.json'), 'utf8').replace(/\r\n/g, '\n');
const DOCS = Object.fromEntries(CONNECTED_SLUGS.map((s) => [s, JSON.parse(read(s))]));
const edit = (slug, fn) => { const c = structuredClone(editableOf(DOCS[slug])); fn(c); return validateEditable(c, DOCS[slug]); };

test('exactly 18 case studies: the allowlist, the folders and the public site list agree', () => {
  assert.equal(CONNECTED_SLUGS.length, 18);
  assert.deepEqual(fs.readdirSync(dir).sort(), [...CONNECTED_SLUGS].sort());
  const listed = [...fs.readFileSync(path.join(repo, 'src', 'content', 'case-studies.ts'), 'utf8').matchAll(/\{ slug: '([a-z0-9-]+)', doc:/g)].map((m) => m[1]);
  assert.deepEqual(listed.sort(), [...CONNECTED_SLUGS].sort());
  const orders = CONNECTED_SLUGS.map((s) => DOCS[s].facts.order).sort((a, b) => a - b);
  assert.deepEqual(orders, Array.from({ length: 18 }, (_, i) => i + 1), 'display positions 1..18, no gaps or repeats');
  assert.deepEqual([...CONNECTED_SLUGS].sort((a, b) => DOCS[a].facts.order - DOCS[b].facts.order), CONNECTED_SLUGS, 'allowlist is in Work-page order');
});

for (const slug of CONNECTED_SLUGS) {
  test(`${slug}: valid, canonical, same structure in English and Greek, every image described`, () => {
    const doc = DOCS[slug];
    assert.deepEqual(validateDocument(doc, slug).problems, []);
    assert.equal(serializeDocument(doc, editableOf(doc)), read(slug), 'an unchanged save reproduces the file byte for byte');
    assert.deepEqual(structureOf(doc.el), structureOf(doc.en), 'same sections in both languages');
    for (const [k, rule] of Object.entries(FIELDS)) if (rule.kind !== 'text' && doc.en[k]) assert.equal(doc.el[k].length, doc.en[k].length, `${k}: same number of items`);
    assert.equal(Boolean(doc.en.imageAlt), Boolean(doc.images.image));
    assert.equal(Boolean(doc.en.coverAlt), Boolean(doc.images.cover));
    assert.equal(doc.en.galleryAlts?.length ?? 0, doc.images.gallery?.length ?? 0);
    assert.ok(/[Α-Ωα-ω]/.test(doc.el.summary + doc.el.overview.join(' ')), 'Greek text is in Greek');
    const assets = fs.readdirSync(path.join(repo, 'src', 'assets', 'projects'));
    for (const im of [doc.images.image, doc.images.cover, ...(doc.images.gallery ?? [])].filter(Boolean)) {
      assert.ok(assets.some((f) => f.replace(/\.[a-z]+$/i, '') === im.id), `image file for ${im.id}`);
    }
    assert.ok(validateEditable(editableOf(doc), doc).ok, 'its own content passes the save rules');
  });
}

test('every content shape is covered by the files', () => {
  const has = (pred) => CONNECTED_SLUGS.filter((s) => pred(DOCS[s]));
  const shapes = {
    'gallery': has((d) => d.images.gallery), 'cover caption': has((d) => d.en.coverCaption), 'no images': has((d) => !d.images.image && !d.images.cover),
    'highlights': has((d) => d.en.highlights), 'disciplines': has((d) => d.en.disciplines), 'services': has((d) => d.en.services),
    'intro only': has((d) => d.en.builtIntro && !d.en.builtItems), 'items only': has((d) => d.en.builtItems && !d.en.builtIntro), 'intro and items': has((d) => d.en.builtIntro && d.en.builtItems),
    'no technology': has((d) => !d.en.technology), 'no outcome': has((d) => !d.en.outcome), 'no client': has((d) => !d.facts.client),
    'Greek client name': has((d) => d.facts.clientEl), 'no live URL': has((d) => !d.facts.liveUrl), 'no capabilities': has((d) => d.facts.capabilities.length === 0),
    'earlier work': has((d) => d.facts.workGroup === 'earlier'), 'featured': has((d) => d.facts.featured),
  };
  for (const [name, list] of Object.entries(shapes)) assert.ok(list.length > 0, `some case study has: ${name}`);
});

// ---------- rules per shape ----------
test('sections cannot be added: services, highlights, disciplines, an introduction, a caption', () => {
  assert.ok(edit('rocketeer', (c) => { c.en.services = ['x']; c.el.services = ['x']; }).errors['en.services']);
  assert.ok(edit('mavie', (c) => { c.en.highlights = ['x']; c.el.highlights = ['x']; }).errors['en.highlights']);
  assert.ok(edit('saloon', (c) => { c.en.disciplines = ['x']; c.el.disciplines = ['x']; }).errors['en.disciplines']);
  assert.ok(edit('rocketeer', (c) => { c.en.builtIntro = 'An intro.'; c.el.builtIntro = 'Εισαγωγή.'; }).errors['en.builtIntro']);
  assert.ok(edit('rocketeer', (c) => { c.en.coverCaption = 'A caption.'; c.el.coverCaption = 'Λεζάντα.'; }).errors['en.coverCaption']);
  assert.ok(edit('juliette-coffee-roasters', (c) => { c.en.technology = ['x']; c.el.technology = ['x']; }).errors['en.technology']);
});

test('sections cannot be removed: services, outcome, intro, caption, highlights, disciplines', () => {
  assert.ok(edit('mavie', (c) => { delete c.en.services; delete c.el.services; }).errors['en.services']);
  assert.ok(edit('mavie', (c) => { c.en.outcome = []; c.el.outcome = []; }).errors['en.outcome']);
  assert.ok(edit('emoved', (c) => { c.en.builtIntro = ''; c.el.builtIntro = ''; }).errors['en.builtIntro']);
  assert.ok(edit('logotherapia-xanthi', (c) => { delete c.el.coverCaption; }).errors['el.coverCaption']);
  assert.ok(edit('saloon', (c) => { delete c.el.highlights; }).errors['el.highlights']);
  assert.ok(edit('apox-fc', (c) => { delete c.en.disciplines; }).errors['en.disciplines']);
});

test('alt text exists exactly for the images a case study has', () => {
  assert.ok(edit('mavie', (c) => { c.en.imageAlt = 'An image that does not exist.'; c.el.imageAlt = 'Εικόνα.'; }).errors['en.imageAlt']);
  assert.ok(edit('armans', (c) => { delete c.el.coverAlt; }).errors['el.coverAlt']);
  assert.ok(edit('rantevo', (c) => { c.en.galleryAlts = []; }).errors['en.galleryAlts']);
  assert.ok(edit('rantevo', (c) => { c.en.galleryAlts.push('extra'); c.el.galleryAlts.push('extra'); }).errors['en.galleryAlts']);
  assert.ok(edit('logotherapia-xanthi', (c) => { c.en.galleryAlts = ['No gallery here.']; c.el.galleryAlts = ['x']; }).errors['en.galleryAlts']);
  assert.ok(edit('rantevo', (c) => { c.el.galleryAlts[0] = ' '; }).errors['el.galleryAlts.0']);
});

test('text in every kind of section can be edited, and list sizes may change in both languages together', () => {
  const ok = (slug, fn) => { const r = edit(slug, fn); assert.ok(r.ok, `${slug}: ${JSON.stringify(r.errors)}`); return r.value; };
  ok('saloon', (c) => { c.en.highlights[0] = 'Edited highlight'; c.el.highlights[0] = 'Επεξεργασμένο'; c.en.services.push('New service'); c.el.services.push('Νέα υπηρεσία'); });
  ok('juliette-coffee-roasters', (c) => { c.en.disciplines.pop(); c.el.disciplines.pop(); c.en.builtIntro = 'Edited intro.'; });
  ok('logotherapia-xanthi', (c) => { c.en.coverCaption = 'Edited caption.'; c.el.coverCaption = 'Νέα λεζάντα.'; c.en.overview.reverse(); c.el.overview.reverse(); });
  ok('rantevo', (c) => { c.en.galleryAlts[0] = 'Edited gallery alt text.'; c.el.imageAlt = 'Νέο εναλλακτικό κείμενο.'; });
  const v = ok('armans', (c) => { c.en.builtItems[0] = '  Trimmed item  '; });
  assert.equal(v.en.builtItems[0], 'Trimmed item');
  assert.ok(!edit('saloon', (c) => { c.en.highlights.push('Only English'); }).ok, 'parity enforced');
  assert.ok(!edit('emoved', (c) => { c.en.services = Array(13).fill('x'); c.el.services = Array(13).fill('x'); }).ok, 'list maximum enforced');
});

test('locked facts: a client name in Greek, missing clients and missing live URLs are preserved as they are', () => {
  assert.equal(DOCS['logotherapia-xanthi'].facts.clientEl.length > 0, true);
  assert.ok(!('client' in DOCS['saloon'].facts));
  assert.ok(!('liveUrl' in DOCS['saloon'].facts));
  const r = validateEditable({ ...editableOf(DOCS.saloon), facts: { featured: true } }, DOCS.saloon);
  assert.ok(r.errors.entry, 'facts cannot be sent as editable content');
});
