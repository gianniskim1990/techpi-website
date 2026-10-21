// Task M3: edits to the website pages build. Runs the real public build twice (baseline and edited) into the OS temp
// folder, with edits the admin accepts in five pages and both languages, including a legal page whose references are
// moved. Then every validator that reads a build directory runs on the edited build, the page output check compares it
// with the edited files, and the diff must be exactly the edited pages. The content files are restored in `finally`.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEditable, editableOf, serializeDocument } from '../shared/page-content.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-pages-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const file = (key) => path.join(repo, 'content', 'pages', key, 'index.json');
const run = (args) => spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8' });
const build = (outDir) => { const r = run([path.join(repo, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', outDir]); assert.equal(r.status, 0, (r.stdout + r.stderr).slice(-1500)); };
const list = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(dir, path.join(e.parentPath, e.name)).replace(/\\/g, '/')).sort();
const html = (dist, rel) => fs.readFileSync(path.join(dist, rel), 'utf8');

const NEW = {
  homeSupport: 'Technology built for',
  aboutLead: 'Από ιστοσελίδες σε ειδικές πλατφόρμες, ψηφιακά προϊόντα και ευφυή συστήματα.',
  euStep: ' This sentence was added in a test edit.',
  workTitle: 'Work — Client Projects & Platforms | TechPi',
  privacyEmail: 'Telephone: {{phone}}. Email: {{email}}.',
};
const EDITS = {
  home: (c) => { c.en.hero.support[0] = NEW.homeSupport; },
  about: (c) => { c.el.lead = NEW.aboutLead; },
  'eu-projects': (c) => { c.en.process.steps[0].text += NEW.euStep; },
  work: (c) => { c.en.seo.title = NEW.workTitle; },
  privacy: (c) => {
    const who = c.en.sections.findIndex((s) => s.id === 'who-we-are');
    const b = c.en.sections[who].blocks.findIndex((x) => x.p?.includes('{{email}}'));
    c.en.sections[who].blocks[b].p = NEW.privacyEmail;
  },
};

test('page edits accepted by the admin build, pass every validator, and change only the edited pages', { timeout: 900_000 }, () => {
  const baseline = path.join(tmp, 'baseline');
  const edited = path.join(tmp, 'edited');
  build(baseline);
  const originals = Object.fromEntries(Object.keys(EDITS).map((k) => [k, fs.readFileSync(file(k), 'utf8')]));
  let outputCheck;
  try {
    for (const [key, fn] of Object.entries(EDITS)) {
      const doc = JSON.parse(originals[key]);
      const c = structuredClone(editableOf(doc));
      fn(c);
      const v = validateEditable(c, doc, key);
      assert.ok(v.ok, `${key}: ${JSON.stringify(v.errors)}`);
      fs.writeFileSync(file(key), serializeDocument(doc, v.value));
    }
    build(edited);
    outputCheck = run([path.join(repo, 'admin', 'scripts', 'verify-pages-output.mjs'), '--dist', edited]);
  } finally {
    for (const [key, text] of Object.entries(originals)) fs.writeFileSync(file(key), text);
  }
  for (const [key, text] of Object.entries(originals)) assert.equal(fs.readFileSync(file(key), 'utf8'), text, `${key} restored byte for byte`);

  // Every validator that reads a build directory passes on the edited build.
  for (const v of ['scripts/content/validate.mjs', 'scripts/content/validate-legal.mjs', 'scripts/content/validate-insights.mjs', 'scripts/content/validate-redirects.mjs', 'scripts/seo/validate.mjs', 'scripts/security/validate.mjs']) {
    const r = run([path.join(repo, v), '--dist', edited]);
    assert.equal(r.status, 0, `${v} fails on the edited build:\n${r.stdout.slice(-1200)}`);
  }
  assert.equal(outputCheck.status, 0, `page output check (titles, descriptions, canonical, hreflang, Open Graph, JSON-LD, sitemap):\n${outputCheck.stdout}`);

  // Exactly the edited pages changed, and nothing else in the build.
  assert.deepEqual(list(edited), list(baseline));
  const changed = list(baseline).filter((f) => !fs.readFileSync(path.join(baseline, f)).equals(fs.readFileSync(path.join(edited, f))));
  assert.deepEqual(changed, ['el/about.html', 'eu-projects.html', 'index.html', 'privacy.html', 'work.html']);

  // The edits are where they belong.
  assert.ok(html(edited, 'index.html').includes(NEW.homeSupport) && !html(baseline, 'index.html').includes(`>${NEW.homeSupport}<`));
  assert.ok(html(edited, 'el/about.html').includes(NEW.aboutLead) && !html(edited, 'about.html').includes(NEW.aboutLead));
  assert.ok(html(edited, 'eu-projects.html').includes(NEW.euStep.trim()) && !html(edited, 'el/eu-projects.html').includes(NEW.euStep.trim()));
  assert.ok(html(edited, 'work.html').includes(`<title>${NEW.workTitle.replace('&', '&amp;')}</title>`));
  // The moved legal references were resolved from site.ts, as links, in the new order.
  const privacy = html(edited, 'privacy.html');
  assert.match(privacy, /Telephone: <a[^>]*href="tel:\+306975946984"[^>]*>\+30 697 594 6984<\/a>\. Email: <a[^>]*href="mailto:info@techpi\.eu"[^>]*>info@techpi\.eu<\/a>\./);
  assert.ok(!privacy.includes('{{'), 'no unresolved reference in the built page');
});
