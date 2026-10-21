// M2 correction: Insights section headings are editable. These tests run the real public build.
//
//  1. A heading-only edit is accepted by the admin rules, builds successfully, passes the site's Insights validator,
//     shows on the right article page only, and changes nothing else in the output.
//  2. The validator no longer pins the original wording but still rejects what it must: a missing or extra section, an
//     empty or duplicate heading, a stub or placeholder body, a wrong date, a missing article, a wrong card order.
//  3. The admin's rules (the same ones the Worker applies on save) reject the same things before anything is written.
//
// The build runs twice (baseline and edited) into the OS temp folder. The edited content file is restored in `finally`.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEditable, editableOf, INSIGHT_SLUGS } from '../shared/insight-content.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const astro = path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs');
const validator = path.join(repo, 'scripts', 'content', 'validate-insights.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-insight-headings-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const A = 'what-every-eu-project-website-should-include'; // three sections
const B = 'preparing-a-website-brief-during-the-proposal-stage'; // one section
const file = (slug) => path.join(repo, 'content', 'insights', slug, 'index.json');
const doc = (slug) => JSON.parse(fs.readFileSync(file(slug), 'utf8'));
const build = (outDir) => {
  const r = spawnSync(process.execPath, [astro, 'build', '--outDir', outDir], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0, `astro build failed:\n${(r.stdout + r.stderr).slice(-1500)}`);
};
const validate = (dist) => spawnSync(process.execPath, [validator, '--dist', dist], { cwd: repo, encoding: 'utf8' });
const list = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(dir, path.join(e.parentPath, e.name)).replace(/\\/g, '/')).sort();
const page = (dist, slug) => fs.readFileSync(path.join(dist, 'insights', `${slug}.html`), 'utf8');
const copyDist = (from, name) => { const to = path.join(tmp, name); fs.cpSync(from, to, { recursive: true }); return to; };

// ---------- 1. a heading-only edit builds ----------
test('a heading-only edit builds, passes the validator, shows on the right pages only, and changes nothing else', { timeout: 600_000 }, () => {
  const baseline = path.join(tmp, 'baseline');
  const edited = path.join(tmp, 'edited');
  build(baseline);
  assert.equal(validate(baseline).status, 0, 'the unedited site passes the new validator');

  const NEW_A = 'Start from the objectives in the proposal';
  const NEW_B = 'Describe the website as a working tool for the project';
  const originals = { [A]: fs.readFileSync(file(A), 'utf8'), [B]: fs.readFileSync(file(B), 'utf8') };
  const oldA = doc(A).en.sections[0].heading;
  const oldB = doc(B).en.sections[0].heading;
  try {
    for (const [slug, idx, heading] of [[A, 0, NEW_A], [B, 0, NEW_B]]) {
      const d = doc(slug);
      d.en.sections[idx].heading = heading;
      // The admin accepts exactly this edit.
      const check = validateEditable(editableOf(d), d);
      assert.ok(check.ok, JSON.stringify(check.errors));
      fs.writeFileSync(file(slug), JSON.stringify(d, null, 2) + '\n');
    }
    build(edited);
  } finally {
    for (const [slug, text] of Object.entries(originals)) fs.writeFileSync(file(slug), text);
  }
  for (const [slug, text] of Object.entries(originals)) assert.equal(fs.readFileSync(file(slug), 'utf8'), text, `${slug} content file restored byte for byte`);
  assert.equal(doc(A).en.sections[0].heading, oldA, 'content file restored');

  const result = validate(edited);
  assert.equal(result.status, 0, `the validator accepts changed headings:\n${result.stdout}`);
  assert.match(result.stdout, /0 failures/);

  // The changed heading appears on its own article page, and the old one is gone from it.
  assert.match(page(edited, A), new RegExp(`<h2 id="s1-h"[^>]*>${NEW_A}</h2>`));
  assert.ok(!page(edited, A).includes(`>${oldA}<`));
  assert.match(page(edited, B), new RegExp(`<h2 id="s1-h"[^>]*>${NEW_B}</h2>`));
  assert.ok(!page(edited, B).includes(`>${oldB}<`));
  // ...and on no other page.
  for (const slug of INSIGHT_SLUGS.filter((s) => s !== A && s !== B)) assert.equal(page(edited, slug), page(baseline, slug), `${slug} unchanged`);

  // Nothing else in the build differs: exactly the two article pages.
  assert.deepEqual(list(edited), list(baseline), 'the same files are built');
  const changed = list(baseline).filter((f) => !fs.readFileSync(path.join(baseline, f)).equals(fs.readFileSync(path.join(edited, f))));
  assert.deepEqual(changed, [`insights/${A}.html`, `insights/${B}.html`].sort());

  // Title, description, canonical, Open Graph and structured data of an edited article are untouched by a heading edit.
  const strip = (h) => h.replace(/<section[\s\S]*?<\/section>/g, '');
  for (const slug of [A, B]) assert.equal(strip(page(edited, slug)).replace(/data-astro-cid-\w+/g, ''), strip(page(baseline, slug)).replace(/data-astro-cid-\w+/g, ''), `${slug}: only the body sections differ`);
});

// ---------- 2. the validator still rejects what it must ----------
// Uses a copy of the baseline build, which the test above has already produced.
function mutated(name, fn) {
  const dist = copyDist(path.join(tmp, 'baseline'), name);
  fn(dist);
  return validate(dist);
}
const rewrite = (dist, slug, fn) => { const f = path.join(dist, 'insights', `${slug}.html`); fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8'))); };
const section = (n) => new RegExp(`<section aria-labelledby="s${n}-h"[^>]*>[\\s\\S]*?</section>`);
const expectFail = (result, pattern) => {
  assert.equal(result.status, 1, `the validator must fail:\n${result.stdout}`);
  assert.match(result.stdout, pattern);
};

test('validator: a missing section, an extra section, an empty or duplicate heading and a stub body are rejected', { timeout: 120_000 }, () => {
  expectFail(mutated('m-missing', (d) => rewrite(d, A, (h) => h.replace(section(3), ''))), /2 body sections, expected 3/);
  expectFail(mutated('m-extra', (d) => rewrite(d, B, (h) => h.replace(section(1), (s) => s + s.replace(/s1-h/g, 's2-h')))), /2 body sections, expected 1/);
  expectFail(mutated('m-empty', (d) => rewrite(d, A, (h) => h.replace(/(<h2 id="s2-h"[^>]*>)[\s\S]*?(<\/h2>)/, '$1$2'))), /section 2 has a non-empty heading/);
  expectFail(mutated('m-blank', (d) => rewrite(d, A, (h) => h.replace(/(<h2 id="s2-h"[^>]*>)[\s\S]*?(<\/h2>)/, '$1  <!-- -->  $2'))), /section 2 has a non-empty heading/);
  expectFail(mutated('m-noh2', (d) => rewrite(d, A, (h) => h.replace(/<h2 id="s2-h"[^>]*>[\s\S]*?<\/h2>/, ''))), /section 2 has an h2 with its own id/);
  expectFail(mutated('m-wrongid', (d) => rewrite(d, A, (h) => h.replace('id="s2-h"', 'id="s9-h"'))), /section 2 has an h2 with its own id/);
  expectFail(mutated('m-dup', (d) => rewrite(d, A, (h) => h.replace(/(<h2 id="s2-h"[^>]*>)[\s\S]*?(<\/h2>)/, '$1Start from the project’s communication objectives$2'))), /section headings are distinct/);
  expectFail(mutated('m-stub', (d) => rewrite(d, A, (h) => h.replace(section(1), (s) => s.replace(/<p[\s\S]*?<\/p>/g, '<p>Short.</p>')))), /section 1 has real text under its heading/);
});

test('validator: placeholder text, a wrong date, a missing article, a changed order and a Greek page are still rejected', { timeout: 120_000 }, () => {
  expectFail(mutated('m-lorem', (d) => rewrite(d, A, (h) => h.replace(/(<section aria-labelledby="s1-h"[^>]*>[\s\S]*?<p[^>]*>)/, '$1Lorem ipsum dolor sit amet. '))), /no draft or placeholder text/);
  expectFail(mutated('m-todo', (d) => rewrite(d, B, (h) => h.replace(/<h2 id="s1-h"([^>]*)>/, '<h2 id="s1-h"$1>TODO '))), /no draft or placeholder text/);
  expectFail(mutated('m-date', (d) => rewrite(d, A, (h) => h.replace('<time datetime="2025-09-12"', '<time datetime="2025-09-13"'))), /the source date 2025-09-12 shown/);
  expectFail(mutated('m-gone', (d) => fs.rmSync(path.join(d, 'insights', `${B}.html`))), /holds exactly the seven articles/);
  expectFail(mutated('m-order', (d) => { const f = path.join(d, 'insights.html'); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(`/insights/${A}"`, '/insights/TMP"').replace(`/insights/${B}"`, `/insights/${A}"`).replace('/insights/TMP"', `/insights/${B}"`)); }), /seven cards in source order/);
  expectFail(mutated('m-el', (d) => fs.writeFileSync(path.join(d, 'el', 'insights.html'), '<html lang="el"></html>')), /no Greek Insights page is built/);
  expectFail(mutated('m-canon', (d) => rewrite(d, A, (h) => h.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://techpi.eu/insights/other">'))), /self-referencing canonical/);
  expectFail(mutated('m-hreflang', (d) => rewrite(d, A, (h) => h.replace('</head>', '<link rel="alternate" hreflang="el" href="https://techpi.eu/el/insights/x"></head>'))), /no hreflang in the head/);
  expectFail(mutated('m-tracker', (d) => rewrite(d, A, (h) => h.replace('</head>', '<script src="https://www.googletagmanager.com/gtag/js"></script></head>'))), /no analytics or tag manager|no third-party script/);
});

// ---------- 3. the admin rules ----------
const doc7 = Object.fromEntries(INSIGHT_SLUGS.map((s) => [s, doc(s)]));
const edit = (slug, fn) => { const c = structuredClone(editableOf(doc7[slug])); fn(c.en); return validateEditable(c, doc7[slug]); };

test('admin rules: a heading edit is accepted; missing sections, empty headings and invalid content are rejected', () => {
  const ok = edit(A, (en) => { en.sections[0].heading = 'A reworded first heading'; en.sections[2].heading = 'Dissemination that lasts beyond the launch'; });
  assert.ok(ok.ok, JSON.stringify(ok.errors));
  assert.equal(ok.value.en.sections[0].heading, 'A reworded first heading');
  assert.ok(edit(A, (en) => { en.sections[1].heading = '  '; }).errors['en.sections.1.heading'], 'empty heading');
  assert.ok(edit(A, (en) => { en.sections[1].heading = ''; }).errors['en.sections.1.heading']);
  assert.ok(edit(A, (en) => { en.sections[1].heading = 'x'.repeat(121); }).errors['en.sections.1.heading'], 'too long');
  assert.ok(edit(A, (en) => { en.sections[1].heading = '<b>Bold</b> heading'; }).errors['en.sections.1.heading'], 'markup');
  assert.ok(edit(A, (en) => { en.sections[1].heading = 'TODO write this heading'; }).errors['en.sections.1.heading'], 'placeholder');
  assert.ok(edit(A, (en) => { en.sections[1].heading = 'See [this](/cookies)'; }).errors['en.sections.1.heading'], 'no links in headings');
  assert.match(edit(A, (en) => { en.sections.pop(); }).errors['en.sections'], /cannot be added or removed/);
  assert.match(edit(A, (en) => { en.sections.push({ heading: 'Another', paragraphs: ['x'] }); }).errors['en.sections'], /cannot be added or removed/);
  assert.ok(edit(A, (en) => { en.sections[2].heading = en.sections[0].heading; }).errors['en.sections.2.heading'], 'duplicate heading (case-insensitive too)');
  assert.ok(edit(A, (en) => { en.sections[2].heading = en.sections[0].heading.toUpperCase(); }).errors['en.sections.2.heading']);
  assert.ok(edit(B, (en) => { en.sections[0].paragraphs = ['Too short.']; en.sections[0].list = ['x']; }).errors['en.sections.0.paragraphs'], 'a stub body is refused');
  assert.match(edit(B, (en) => { en.sections[0].paragraphs = ['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']; }).errors['en.sections.0.paragraphs.0'], /placeholder/);
});
