// Task M2: the 7 committed Insights files and the article rules: English only, locked structure, notes, safe internal
// links, related articles and the SEO limits. No GitHub involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateDocument, validateEditable, serializeDocument, editableOf, structureOf, checkText, dateText,
  INSIGHT_SLUGS, INTERNAL_PATHS,
} from '../shared/insight-content.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(repo, 'content', 'insights');
const read = (slug) => fs.readFileSync(path.join(dir, slug, 'index.json'), 'utf8').replace(/\r\n/g, '\n');
const DOCS = Object.fromEntries(INSIGHT_SLUGS.map((s) => [s, JSON.parse(read(s))]));
const NOTE = 'how-analytics-can-support-dissemination-reporting';
const edit = (slug, fn) => { const c = structuredClone(editableOf(DOCS[slug])); fn(c.en, c); return validateEditable(c, DOCS[slug]); };

test('the 7 migrated articles: every folder exists, positions 1 to 7, and the public site reads the whole folder', () => {
  assert.equal(INSIGHT_SLUGS.length, 7);
  for (const s of INSIGHT_SLUGS) assert.ok(fs.existsSync(path.join(dir, s, 'index.json')), s);
  // Since Task M5 an article created in the admin is published by its file alone: the site lists the folder.
  assert.match(fs.readFileSync(path.join(repo, 'src', 'content', 'insights.ts'), 'utf8'), /import\.meta\.glob[^;]*'\.\.\/\.\.\/content\/insights\/\*\/index\.json'/);
  // Newest first by date is the migrated index order.
  assert.deepEqual([...INSIGHT_SLUGS].sort((a, b) => DOCS[b].facts.published.localeCompare(DOCS[a].facts.published)), INSIGHT_SLUGS);
  assert.deepEqual(INSIGHT_SLUGS.map((s) => DOCS[s].facts.order), [1, 2, 3, 4, 5, 6, 7]);
});

for (const slug of INSIGHT_SLUGS) {
  test(`${slug}: valid, canonical, English only, its own content passes the save rules`, () => {
    const doc = DOCS[slug];
    assert.deepEqual(validateDocument(doc, slug).problems, []);
    const v = validateEditable(editableOf(doc), doc);
    assert.ok(v.ok, JSON.stringify(v.errors));
    assert.equal(serializeDocument(doc, v.value), read(slug), 'an unchanged save reproduces the file byte for byte');
    assert.ok(!('el' in doc));
    assert.equal(doc.facts.publishedText, dateText(doc.facts.published));
    for (const r of doc.en.related) assert.ok(INSIGHT_SLUGS.includes(r) && r !== slug);
  });
}

test('every section shape and the note are covered by the files', () => {
  const shapes = new Set(INSIGHT_SLUGS.flatMap((s) => structureOf(DOCS[s].en).sections.map((p) => p.join('+'))));
  for (const want of ['paragraphs', 'paragraphs+list+after', 'paragraphs+list', 'list']) assert.ok(shapes.has(want), want);
  assert.deepEqual(INSIGHT_SLUGS.filter((s) => DOCS[s].en.note), [NOTE], 'only the analytics article has a note');
});

test('English only: a Greek version or any other language is refused', () => {
  const c = structuredClone(editableOf(DOCS[NOTE]));
  assert.match(validateEditable({ ...c, el: c.en }, DOCS[NOTE]).errors.entry, /English only/);
  assert.ok(validateEditable({ fr: c.en }, DOCS[NOTE]).errors['en.entry']);
  const withEl = { ...DOCS[NOTE], el: DOCS[NOTE].en };
  assert.ok(validateDocument(withEl, NOTE).problems.some((p) => /English only/.test(p)));
});

test('structure is locked: sections, parts and the note cannot be added or removed', () => {
  assert.match(edit('preparing-a-website-brief-during-the-proposal-stage', (en) => { en.sections.push({ heading: 'New', paragraphs: ['x'] }); }).errors['en.sections'], /cannot be added or removed/);
  assert.match(edit('common-mistakes-in-horizon-europe-project-websites', (en) => { en.sections.pop(); }).errors['en.sections'], /cannot be added or removed/);
  assert.ok(edit('common-mistakes-in-horizon-europe-project-websites', (en) => { en.sections[0].list = ['A new list']; }).errors['en.sections.0.list']);
  assert.ok(edit('what-every-eu-project-website-should-include', (en) => { delete en.sections[1].after; }).errors['en.sections.1.after']);
  assert.ok(edit('what-communication-partners-should-ask-a-web-development-supplier', (en) => { en.sections[0].paragraphs = ['Intro']; }).errors['en.sections.0.paragraphs']);
  assert.match(edit(NOTE, (en) => { delete en.note; }).errors['en.note'], /cannot be removed/);
  assert.match(edit('what-every-eu-project-website-should-include', (en) => { en.note = 'A new note.'; }).errors['en.note'], /cannot be added/);
  assert.ok(edit(NOTE, (en) => { en.sections[0].extra = ['x']; }).errors['en.sections.0.extra']);
});

test('text in every kind of part can be edited, and item counts may change within limits', () => {
  const ok = (slug, fn) => { const r = edit(slug, fn); assert.ok(r.ok, `${slug}: ${JSON.stringify(r.errors)}`); return r.value.en; };
  ok('what-every-eu-project-website-should-include', (en) => { en.title = 'An edited title for the checklist'; en.sections[1].list.push('A new list item'); en.sections[1].after[0] += ' Edited.'; en.sections[0].heading = 'An edited heading'; });
  ok('what-communication-partners-should-ask-a-web-development-supplier', (en) => { en.sections[1].list.pop(); en.sections[0].list[0] = 'Edited question?'; });
  ok('common-mistakes-in-horizon-europe-project-websites', (en) => { en.sections[2].paragraphs.push('A second paragraph.'); en.category = 'EU projects'; });
  const v = ok(NOTE, (en) => { en.note = '  An edited note. See the [Cookies Policy](/cookies) and [our EU work](/eu-projects).  '; });
  assert.equal(v.note, 'An edited note. See the [Cookies Policy](/cookies) and [our EU work](/eu-projects).');
  assert.ok(edit('preparing-a-website-brief-during-the-proposal-stage', (en) => { en.sections[0].list = []; }).errors['en.sections.0.list']);
  assert.ok(edit('preparing-a-website-brief-during-the-proposal-stage', (en) => { en.sections[0].list = Array(16).fill('x'); }).errors['en.sections.0.list']);
  assert.ok(edit('preparing-a-website-brief-during-the-proposal-stage', (en) => { en.sections[0].list[1] = '  '; }).errors['en.sections.0.list.1']);
});

test('links: only [label](/page) to known pages of this site, and only in the note', () => {
  const noteErr = (note) => edit(NOTE, (en) => { en.note = note; }).errors['en.note'];
  for (const href of ['https://evil.example', 'http://techpi.eu/cookies', '//evil.example/x', 'javascript:alert(1)', 'mailto:a@example.test', 'data:text/html,x', '/cookies?next=https://evil.example', '/insights/not-an-article', '/el/insights', '/admin', '/cookies#x', '../cookies']) {
    assert.ok(noteErr(`See [this](${href}).`), href);
  }
  assert.ok(noteErr('A [broken](/cookies link.'), 'malformed link');
  assert.ok(noteErr('Nested [a [b](/cookies)](/about).'), 'nested link');
  assert.ok(noteErr('An [empty]() link.'), 'empty target');
  assert.ok(noteErr('<a href="/cookies">markup</a>'), 'HTML');
  assert.equal(noteErr('See [the work](/work/rocketeer) and [an article](/insights/how-to-structure-deliverables-and-publications).'), undefined);
  assert.ok(edit(NOTE, (en) => { en.sections[0].paragraphs[0] = 'See [Cookies](/cookies).'; }).errors['en.sections.0.paragraphs.0'], 'no links in paragraphs: they would show as text');
  assert.ok(edit(NOTE, (en) => { en.lead = 'A [link](/cookies) in the lead.'; }).errors['en.lead']);
  assert.equal(checkText('Plain [brackets] are fine.', { max: 100 }), null);
});

test('every allowed internal link target is a real page of the site', () => {
  const pages = fs.readdirSync(path.join(repo, 'src', 'pages')).filter((f) => f.endsWith('.astro')).map((f) => f.replace(/\.astro$/, ''));
  for (const p of INTERNAL_PATHS) {
    if (p === '/') continue;
    const [, top, rest] = p.split('/');
    if (rest) assert.ok(fs.existsSync(path.join(repo, 'src', 'pages', top, '[slug].astro')), p);
    else assert.ok(pages.includes(top), p);
  }
});

test('plain text only, no draft markers, and the SEO limits of the site validator', () => {
  const e = (fn, key) => edit('accessibility-considerations-for-project-websites', fn).errors[key];
  assert.ok(e((en) => { en.title = 'Short'; }, 'en.title'));
  assert.ok(e((en) => { en.lead = 'Line one\nline two'; }, 'en.lead'));
  assert.ok(e((en) => { en.sections[0].heading = '<script>x</script>'; }, 'en.sections.0.heading'));
  assert.ok(e((en) => { en.sections[1].list[0] = 'TODO: write this'; }, 'en.sections.1.list.0'));
  assert.ok(e((en) => { en.sections[0].paragraphs[0] = 'Lorem ipsum dolor sit amet.'; }, 'en.sections.0.paragraphs.0'));
  assert.ok(e((en) => { en.meta.title = 'x'.repeat(71); }, 'en.meta.title'));
  assert.ok(e((en) => { en.meta.description = 'Too short to be a useful search description.'; }, 'en.meta.description'));
  assert.ok(e((en) => { en.meta.description = 'x'.repeat(201); }, 'en.meta.description'));
  assert.ok(e((en) => { en.meta.keywords = 'x'; }, 'en.meta.keywords'));
  assert.ok(e((en) => { en.author = 'Someone'; }, 'en.author'), 'no invented metadata fields');
  assert.ok(e((en) => { en.published = '2026-01-01'; }, 'en.published'), 'the date is not editable');
});

test('related articles: known slugs only, not itself, no duplicates, at most four, order kept', () => {
  const slug = 'how-to-structure-deliverables-and-publications';
  const r = (list) => edit(slug, (en) => { en.related = list; });
  assert.ok(r(['not-an-article']).errors['en.related.0']);
  assert.ok(r([slug]).errors['en.related.0']);
  assert.ok(r([INSIGHT_SLUGS[0], INSIGHT_SLUGS[0]]).errors['en.related.1']);
  assert.ok(r(INSIGHT_SLUGS.filter((s) => s !== slug).slice(0, 5)).errors['en.related']);
  assert.ok(r('x').errors['en.related']);
  const v = r([INSIGHT_SLUGS[6], INSIGHT_SLUGS[0]]);
  assert.ok(v.ok);
  assert.deepEqual(v.value.en.related, [INSIGHT_SLUGS[6], INSIGHT_SLUGS[0]]);
  assert.ok(r([]).ok, 'an article may have no related reading');
});

test('locked facts: slug, order, date and its text, and the legacy source are checked', () => {
  const bad = (fn) => { const d = structuredClone(DOCS[NOTE]); fn(d.facts); return validateDocument(d, NOTE).problems; };
  assert.ok(bad((f) => { f.slug = 'other'; }).length);
  assert.ok(bad((f) => { f.published = '2025-13-40'; }).length);
  assert.ok(bad((f) => { f.publishedText = '31 March 2025'; }).length, 'displayed date must match the ISO date');
  assert.ok(bad((f) => { f.source = 'https://evil.example/insights/x'; }).length);
  assert.ok(bad((f) => { f.modified = '2026-01-01'; }).length, 'no modified date');
  const c = { en: { ...structuredClone(DOCS[NOTE].en) }, facts: { published: '2020-01-01' } };
  assert.ok(validateEditable(c, DOCS[NOTE]).errors.entry, 'facts cannot be sent with a save');
});
