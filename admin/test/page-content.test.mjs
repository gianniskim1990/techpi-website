// Task M3: the 8 committed page files and the page rules: locked structure and facts, every page editable in both
// languages, SEO limits, approved-identity mentions, the EU claim guard, and the legal tokens and integrity rules.
// Also checks that these rules agree with the site's validators. No GitHub involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateDocument, validateEditable, serializeDocument, editableOf, PAGES, PAGE_KEYS, PATHS, SCHEMA, GSC, RETIRED, LIMITS, SEO_DESCRIPTION,
} from '../shared/page-content.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (key) => fs.readFileSync(path.join(repo, 'content', 'pages', key, 'index.json'), 'utf8').replace(/\r\n/g, '\n');
const DOCS = Object.fromEntries(PAGE_KEYS.map((k) => [k, JSON.parse(read(k))]));
const edit = (key, fn) => { const c = structuredClone(editableOf(DOCS[key])); fn(c); return validateEditable(c, DOCS[key], key); };
const ok = (key, fn) => { const r = edit(key, fn); assert.ok(r.ok, `${key}: ${JSON.stringify(r.errors)}`); return r.value; };
const bad = (key, fn, field) => { const r = edit(key, fn); assert.ok(!r.ok, `${key}: expected a refusal at ${field}`); if (field) assert.ok(r.errors[field], `${key}: ${field} not refused: ${JSON.stringify(r.errors)}`); return r.errors; };

test('exactly 8 pages: the allowlist, the folders, the site loader and the routes agree', () => {
  assert.deepEqual(PAGE_KEYS, ['home', 'work', 'capabilities', 'eu-projects', 'about', 'contact', 'privacy', 'cookies']);
  assert.deepEqual(fs.readdirSync(path.join(repo, 'content', 'pages')).sort(), [...PAGE_KEYS].sort());
  const loader = fs.readFileSync(path.join(repo, 'src', 'content', 'pages-content.ts'), 'utf8');
  for (const k of PAGE_KEYS) assert.ok(loader.includes(`content/pages/${k}/index.json`), k);
  const routes = fs.readFileSync(path.join(repo, 'src', 'i18n', 'routes.ts'), 'utf8');
  for (const p of PAGES) assert.ok(routes.includes(p.pageKey), p.pageKey);
  for (const k of PAGE_KEYS) assert.deepEqual(DOCS[k].facts.paths, PATHS[k]);
});

for (const { key } of PAGES) {
  test(`${key}: valid, canonical, fully covered by the schema, EN and EL present`, () => {
    const doc = DOCS[key];
    assert.deepEqual(validateDocument(doc, key).problems, []);
    const v = validateEditable(editableOf(doc), doc, key);
    assert.ok(v.ok, JSON.stringify(v.errors));
    assert.equal(serializeDocument(doc, v.value), read(key), 'an unchanged save reproduces the file byte for byte');
    assert.ok(doc.en.seo.title && doc.el.seo.title && /[Α-Ωα-ω]/.test(doc.el.seo.description));
  });
}

// ---------- every page, both languages ----------
const EDITS = {
  home: (c) => { c.en.hero.statement[0] = 'We design and engineer'; c.el.intelligence.lead += ' Δοκιμή.'; },
  work: (c) => { c.en.lead = 'Client projects with their own case studies, and earlier work by pigiota314.'; c.el.groups.client.heading = 'Έργα για πελάτες'; },
  capabilities: (c) => { c.en.lead = 'Four capabilities, combined around the problem.'; c.el.seenIn = 'Θα το δείτε στα'; },
  'eu-projects': (c) => { c.en.lifecycle.stages[0].text += ' Edited.'; c.el.websites.groups[1].items[0] += ' (δοκιμή)'; },
  about: (c) => { c.en.principles[0].text = 'We start with how an organisation works, then choose the technology.'; c.el.stayed.text += ' Δοκιμή.'; },
  contact: (c) => { c.en.heading = 'Something worth building?'; c.el.lead = 'Πείτε μας ποιο πρόβλημα θέλετε να λύσετε, σύντομα.'; },
  privacy: (c) => { c.en.sections[2].heading = 'The data we process'; c.el.lead += ' Δοκιμή.'; },
  cookies: (c) => { c.en.contentsLabel = 'Contents'; c.el.sections[0].heading += ' (δοκιμή)'; },
};
test('every page accepts an edit in English and in Greek, and keeps everything else as it was', () => {
  for (const [key, fn] of Object.entries(EDITS)) {
    const v = ok(key, fn);
    const before = DOCS[key];
    assert.notDeepEqual(v.en, before.en, `${key}: English changed`);
    assert.notDeepEqual(v.el, before.el, `${key}: Greek changed`);
    assert.deepEqual(JSON.parse(serializeDocument(before, v)).facts, before.facts, `${key}: facts unchanged`);
  }
});

test('list items can be reordered; the home hero keeps its own line count per language', () => {
  ok('eu-projects', (c) => { c.en.before.items.reverse(); c.el.before.items.reverse(); });
  assert.equal(DOCS.home.en.hero.statement.length, 2);
  assert.equal(DOCS.home.el.hero.statement.length, 3, 'Greek breaks the headline over three lines');
  bad('home', (c) => { c.en.hero.statement.push('A third line'); }, 'en.hero.statement');
  bad('home', (c) => { c.el.hero.statement.pop(); }, 'el.hero.statement');
});

test('structure is locked: no list items, fields or sections added or removed', () => {
  bad('eu-projects', (c) => { c.en.programmes.list.push('Another programme'); }, 'en.programmes.list');
  bad('eu-projects', (c) => { c.el.lifecycle.stages.pop(); }, 'el.lifecycle.stages');
  bad('home', (c) => { c.en.euTeaser.items.push('More'); }, 'en.euTeaser.items');
  bad('about', (c) => { c.en.principles[1].text = 'Adding text to a principle that has none.'; }, 'en.principles.1.text');
  bad('about', (c) => { delete c.en.principles[0].text; }, 'en.principles.0.text');
  bad('work', (c) => { c.en.extra = 'x'; }, 'en.extra');
  bad('privacy', (c) => { c.en.sections.pop(); }, 'en.sections');
  bad('privacy', (c) => { c.en.sections[0].blocks.push({ p: 'More.' }); }, 'en.sections.0.blocks');
  bad('privacy', (c) => { c.en.sections[3].blocks[0] = { p: 'Turning a list into a paragraph.' }; });
  bad('home', (c) => { c.de = c.en; }, 'entry');
  bad('home', (c) => { c.facts = { paths: { en: '/new' } }; }, 'entry');
});

test('locked values: the contact town, the EU disclaimer, legal titles, anchors, dynamic blocks and addresses', () => {
  bad('contact', (c) => { c.en.locationValue = 'Athens, Greece'; }, 'en.locationValue');
  bad('eu-projects', (c) => { c.el.programmes.disclaimer = 'Χωρίς αποποίηση.'; }, 'el.programmes.disclaimer');
  bad('privacy', (c) => { c.en.heading = 'Privacy'; }, 'en.heading');
  bad('cookies', (c) => { c.el.sections[1].id = 'renamed'; }, 'el.sections.1.id');
  const dyn = DOCS.privacy.en.sections[0].blocks.findIndex((b) => b.dynamic);
  bad('privacy', (c) => { c.en.sections[0].blocks[dyn] = { dynamic: 'registration' }; }, `en.sections.0.blocks.${dyn}.dynamic`);
  const dpa = DOCS.privacy.en.sections.findIndex((s) => s.blocks.some((b) => b.address));
  const ai = DOCS.privacy.en.sections[dpa].blocks.findIndex((b) => b.address);
  bad('privacy', (c) => { c.en.sections[dpa].blocks[ai].address[1] = 'Another street'; }, `en.sections.${dpa}.blocks.${ai}.address.1`);
});

test('text rules: plain text, no draft markers, no markup outside the legal pages, length limits', () => {
  bad('home', (c) => { c.en.hero.meta = 'Line one\nline two'; }, 'en.hero.meta');
  bad('home', (c) => { c.en.hero.meta = '<b>Bold</b>'; }, 'en.hero.meta');
  bad('about', (c) => { c.en.lead = 'TODO: write the lead'; }, 'en.lead');
  bad('about', (c) => { c.el.lead = 'Lorem ipsum dolor sit amet.'; }, 'el.lead');
  bad('work', (c) => { c.en.lead = 'See [the work](/work).'; }, 'en.lead');
  bad('work', (c) => { c.en.lead = '**Bold** lead'; }, 'en.lead');
  bad('contact', (c) => { c.en.lead = 'Write to {{email}}.'; }, 'en.lead');
  bad('capabilities', (c) => { c.en.covers = ''; }, 'en.covers');
  bad('home', (c) => { c.en.hero.statement[0] = 'x'.repeat(LIMITS.line + 1); }, 'en.hero.statement.0');
  bad('eu-projects', (c) => { c.en.hero.lead = 'x'.repeat(LIMITS.para + 1); }, 'en.hero.lead');
});

test('SEO: the title names TechPi in at most 70 characters; the description has 70 to 200', () => {
  bad('about', (c) => { c.en.seo.title = 'About us'; }, 'en.seo.title');
  bad('about', (c) => { c.en.seo.title = 'x'.repeat(66) + ' TechPi'; }, 'en.seo.title');
  bad('about', (c) => { c.el.seo.description = 'Πολύ σύντομη περιγραφή.'; }, 'el.seo.description');
  bad('about', (c) => { c.el.seo.description = 'α'.repeat(201); }, 'el.seo.description');
  ok('about', (c) => { c.en.seo.title = 'About TechPi — Technology Built Around Business Needs'; });
});

test('approved identity: TechPi and pigiota314 stay where the page states their relationship', () => {
  bad('about', (c) => { c.en.heading = 'TechPi builds digital products.'; }, 'en.heading');
  bad('home', (c) => { c.el.evolution.heading = 'Η εξέλιξη της εταιρείας.'; }, 'el.evolution.heading');
  bad('work', (c) => { c.en.groups.earlier.heading = 'Earlier work'; }, 'en.groups.earlier.heading');
  ok('about', (c) => { c.en.heading = 'TechPi, the evolution of pigiota314.'; });
});

test('EU Projects: no invented certifications, endorsements, guarantees or results', () => {
  bad('eu-projects', (c) => { c.en.hero.lead = 'Certified partner for Horizon Europe projects.'; }, 'en.hero.lead');
  bad('eu-projects', (c) => { c.en.partners.text = 'We have delivered dozens of projects with a proven track record.'; }, 'en.partners.text');
  bad('eu-projects', (c) => { c.el.hero.lead = 'Πιστοποιημένος συνεργάτης για ευρωπαϊκά έργα.'; }, 'el.hero.lead');
  bad('home', (c) => { c.en.euTeaser.text = 'Endorsed by the European Commission.'; }, 'en.euTeaser.text');
});

// ---------- legal ----------
const P = DOCS.privacy;
const whoWe = P.en.sections.findIndex((s) => s.id === 'who-we-are');
const emailBlock = P.en.sections[whoWe].blocks.findIndex((b) => b.p?.includes('{{email}}'));
test('legal: references to site facts stay references, can move within their section, and cannot be dropped', () => {
  ok('privacy', (c) => { c.en.sections[whoWe].blocks[emailBlock].p = 'Telephone: {{phone}}. Email: {{email}}.'; });
  bad('privacy', (c) => { c.en.sections[whoWe].blocks[emailBlock].p = 'Email: write to us.'; }, `en.sections.${whoWe}.references`);
  bad('privacy', (c) => { c.en.sections[whoWe].blocks[emailBlock].p += ' Also {{email}}.'; }, `en.sections.${whoWe}.references`);
  bad('privacy', (c) => { c.en.sections[whoWe].blocks[emailBlock].p += ' {{operator.vat}}'; }, `en.sections.${whoWe}.blocks.${emailBlock}.p`);
  for (const stale of ['Write to info@techpi.eu.', 'Call +30 697 594 6984.', 'GEMI 151838746000.', 'At Brokoumi Street.', '[mail](mailto:someone@example.test)']) {
    bad('privacy', (c) => { c.en.sections[1].blocks[0].p = stale; }, 'en.sections.1.blocks.0.p');
  }
});

test('legal: links only through known references; markup must be balanced', () => {
  const s = P.en.sections.findIndex((x) => JSON.stringify(x).includes('{{path.cookies}}'));
  const b = P.en.sections[s].blocks.findIndex((x) => x.p?.includes('{{path.cookies}}'));
  const err = `en.sections.${s}.blocks.${b}.p`;
  bad('privacy', (c) => { c.en.sections[s].blocks[b].p = c.en.sections[s].blocks[b].p.replace('({{path.cookies}})', '(https://evil.example)'); }, err);
  bad('privacy', (c) => { c.en.sections[s].blocks[b].p = c.en.sections[s].blocks[b].p.replace('({{path.cookies}})', '(/cookies)'); }, err);
  bad('privacy', (c) => { c.en.sections[s].blocks[b].p = c.en.sections[s].blocks[b].p.replace('({{path.cookies}})', '(javascript:alert(1))'); });
  bad('privacy', (c) => { c.en.sections[s].blocks[b].p = '**Unclosed bold ' + c.en.sections[s].blocks[b].p; }, err);
  ok('privacy', (c) => { c.en.sections[s].blocks[b].p = c.en.sections[s].blocks[b].p.replace('[Cookies Policy]', '[our Cookies Policy]'); });
});

test('legal: the Search Console statement, the operator name and the retired claims', () => {
  for (const locale of ['en', 'el']) {
    const s = DOCS.privacy[locale].sections.findIndex((x) => JSON.stringify(x).includes(GSC[locale]));
    assert.ok(s >= 0, `${locale}: the statement is in the file`);
    const b = DOCS.privacy[locale].sections[s].blocks.findIndex((x) => JSON.stringify(x).includes(GSC[locale]));
    const where = DOCS.privacy[locale].sections[s].blocks[b].p !== undefined ? 'p' : 'ul';
    bad('privacy', (c) => {
      const blk = c[locale].sections[s].blocks[b];
      if (where === 'p') blk.p = blk.p.replace('verified', 'checked').replace('επαληθευτεί', 'ελεγχθεί');
      else blk.ul = blk.ul.map((x) => x.replace('verified', 'checked').replace('επαληθευτεί', 'ελεγχθεί'));
    }, `${locale}.sections.${s}.references`);
  }
  const elWho = DOCS.cookies.el.sections.findIndex((x) => x.id === 'who-we-are');
  bad('cookies', (c) => { c.el.sections[elWho].blocks[0].p = c.el.sections[elWho].blocks[0].p.replace('Ιωάννη Κιμούντρη', 'Γιάννη Κιμούντρη'); }, `el.sections.${elWho}.references`);
  bad('privacy', (c) => { c.en.sections[1].blocks[0].p = 'We use Google Analytics to measure visits.'; }, 'en.sections.1.blocks.0.p');
  bad('privacy', (c) => { c.en.sections[1].blocks[0].p = 'We do not transfer your personal data outside the EU.'; }, 'en.sections.1.blocks.0.p');
});

// ---------- agreement with the site's validators ----------
test('the rules agree with the site validators (legal statements, retired claims, titles, SEO limits)', () => {
  const legal = fs.readFileSync(path.join(repo, 'scripts', 'content', 'validate-legal.mjs'), 'utf8');
  assert.ok(legal.includes(`const GSC_EN = '${GSC.en}'`), 'same English Search Console statement');
  assert.ok(legal.includes(`const GSC_EL = '${GSC.el}'`), 'same Greek Search Console statement');
  for (const r of RETIRED) assert.ok(legal.includes(r.toString()), `retired claim ${r} is in the validator`);
  for (const [file, h1] of [['privacy', 'Privacy Policy'], ['cookies', 'Cookies Policy']]) {
    assert.ok(legal.includes(`h1: '${h1}'`) && DOCS[file].en.heading === h1, `${file}: locked h1 is the one the validator expects`);
  }
  assert.ok(legal.includes("h1: 'Πολιτική Απορρήτου'") && DOCS.privacy.el.heading === 'Πολιτική Απορρήτου');
  assert.ok(legal.includes("h1: 'Πολιτική Cookies'") && DOCS.cookies.el.heading === 'Πολιτική Cookies');
  assert.equal(DOCS.privacy.facts.updated, DOCS.cookies.facts.updated, 'one version date for both policies (the validator requires it)');
  const seo = fs.readFileSync(path.join(repo, 'scripts', 'seo', 'validate.mjs'), 'utf8');
  assert.ok(seo.includes('p.title.length <= 70') && LIMITS['seo-title'] === 70);
  assert.ok(seo.includes(`p.description.length >= ${SEO_DESCRIPTION.min} && p.description.length <= ${SEO_DESCRIPTION.max}`));
  assert.ok(seo.includes('/TechPi/.test(p.title)'));
});

test('no shared fact is duplicated into the page files', () => {
  const all = PAGE_KEYS.map(read).join('\n');
  for (const fact of ['info@techpi.eu', '+30 697 594 6984', '6975946984', '151838746000', '142536715', 'Brokoumi', 'Μπρωκούμη']) assert.ok(!all.includes(fact), fact);
  const caps = fs.readFileSync(path.join(repo, 'src', 'content', 'capabilities.ts'), 'utf8');
  for (const summary of [...caps.matchAll(/summary:\s*'([^']{30,})'/g)].map((m) => m[1])) assert.ok(!all.includes(summary), 'capability copy stays in capabilities.ts');
  // The case-study labels and the secondary pages' closing line are shared: they stay in pages.*.ts, not in a page file.
  // (The EU Projects page has its own, different closing section, which belongs to that page.)
  for (const key of PAGE_KEYS) {
    assert.ok(!('caseStudy' in DOCS[key].en), `${key}: no case-study labels`);
    if (key !== 'eu-projects') assert.ok(!('closer' in DOCS[key].en), `${key}: no shared closing line`);
  }
  const pagesEn = fs.readFileSync(path.join(repo, 'src', 'content', 'pages.en.ts'), 'utf8');
  assert.ok(/caseStudy: \{/.test(pagesEn) && /closer: \{/.test(pagesEn));
  assert.ok(SCHEMA['eu-projects'].some(([p]) => p === 'closer.heading'));
});
