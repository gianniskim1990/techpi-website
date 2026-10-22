// Asset validator. Run after a build:  node scripts/assets/validate.mjs
//
// 1. The sizes declared in src/content/projects.ts must equal the real pixel size of each project capture.
//    They are declared (not read from the import) so the full-size originals are not copied into dist/ unused.
//    A capture that is replaced without updating its numbers would otherwise be shown with the wrong proportions.
// 2. dist/ must not contain a full-size original of any file in src/assets/projects: every page uses
//    optimised WebP derivatives, so an original in dist/ is dead weight that is still uploaded to Cloudflare.
//
// No dependencies: PNG and JPEG sizes are read from the file headers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const assetsDir = path.join(root, 'src/assets/projects');
const distAstro = path.join(root, 'dist/_astro');
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

function size(file) {
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

// Map each import name to its file, then check every `src: name, width: W, height: H` in projects.ts.
const src = fs.readFileSync(path.join(root, 'src/content/projects.ts'), 'utf8');
const files = Object.fromEntries([...src.matchAll(/^import (\w+) from '\.\.\/assets\/projects\/([^']+)';/gm)].map((m) => [m[1], m[2]]));
check(Object.keys(files).length > 0, 'no project image imports found in projects.ts');
const uses = [...src.matchAll(/src: (\w+),\s*width: (\d+),\s*height: (\d+),/g)];
// Admin-managed case studies declare their image sizes in content/case-studies/<slug>/index.json, by image id; the id to
// import mapping is the managedImages object in projects.ts.
const managedIds = Object.fromEntries([...(src.match(/const managedImages = \{([\s\S]*?)\};/)?.[1] ?? '').matchAll(/'([a-z0-9-]+)':\s*(\w+)/g)].map((m) => [m[1], m[2]]));
const caseStudiesDir = path.join(root, 'content/case-studies');
if (fs.existsSync(caseStudiesDir)) {
  for (const d of fs.readdirSync(caseStudiesDir)) {
    const doc = JSON.parse(fs.readFileSync(path.join(caseStudiesDir, d, 'index.json'), 'utf8'));
    for (const im of [doc.images.image, doc.images.cover, ...(doc.images.gallery ?? [])].filter(Boolean)) {
      const name = managedIds[im.id];
      check(Boolean(name), 'content/case-studies/' + d + ': image id "' + im.id + '" is not in managedImages in projects.ts');
      if (name) uses.push([null, name, String(im.width), String(im.height)]);
    }
  }
}
for (const [, name, w, h] of uses) {
  const file = files[name];
  check(Boolean(file), `projects.ts uses an unknown image import: ${name}`);
  if (!file) continue;
  const real = size(path.join(assetsDir, file));
  check(real !== null && real[0] === +w && real[1] === +h, `${file}: declared ${w}x${h}, file is ${real ? real.join('x') : 'unreadable'}`);
}
for (const name of Object.keys(files)) check(uses.some((u) => u[1] === name), `${files[name]}: imported but never given a declared size`);

// No original in dist/_astro (dist/ must exist: run a build first).
check(fs.existsSync(distAstro), 'dist/_astro not found: run `npm run build` first');
if (fs.existsSync(distAstro)) {
  for (const f of fs.readdirSync(assetsDir)) {
    const base = path.parse(f).name;
    const leaked = fs.readdirSync(distAstro).filter((d) => d.startsWith(base + '.') && /\.(png|jpe?g)$/i.test(d));
    check(leaked.length === 0, `dist/_astro contains an unused original of ${f}: ${leaked.join(', ')}`);
  }
}

// The homepage hero visual. Greek (src/components/home/hero-visual.ts): one decorative WebP photograph, chosen at build time.
// English (src/components/home/EuHeroGrid.astro, eu-themes.ts): a grid of six decorative WebP photographs, one for each
// thematic area of EU-funded projects, each with a label, plus the line and the link to /eu-projects. Neither homepage ships
// the other's visual, and no other page carries a hero visual.
{
  const root = path.resolve(distAstro, '..');
  const page = (p) => (fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : '');

  const el = page('el/index.html');
  const photo = (el.match(/<div class="visual"[\s\S]*?<\/div><\/div>/) || [''])[0];
  check(photo.includes('aria-hidden="true"'), 'el/index.html: the hero photograph is not hidden from assistive technology');
  check(/src="\/_astro\/hero-el\.[^"]+\.webp"/.test(photo) && /srcset="[^"]*\.webp \d+w/.test(photo), 'el/index.html: the Greek hero photograph (hero-el) is missing or not WebP');
  check(/ alt[ =>]/.test(photo) && !/alt="[^"]+"/.test(photo), 'el/index.html: the hero photograph must be decorative (empty alt)');
  check(!/class="eu-unit/.test(el), 'el/index.html: carries the English EU themes grid');

  const en = page('index.html');
  const unit = (en.match(/<div class="eu-unit[\s\S]*?<\/a><\/div><\/div>/) || [''])[0];
  check(unit !== '', 'index.html: the EU themes grid (eu-unit) is missing from the English hero');
  const tiles = unit.match(/<li class="tile"[\s\S]*?<\/li>/g) || [];
  check(tiles.length === 6, `index.html: the EU themes grid must have six tiles, found ${tiles.length}`);
  const THEMES = [
    ['health', 'Health'],
    ['culture', 'Culture, Creativity and Inclusive Society'],
    ['security', 'Civil Security for Society'],
    ['digital', 'Digital, Industry and Space'],
    ['climate', 'Climate, Energy and Mobility'],
    ['food', 'Food, Bioeconomy, Natural Resources, Agriculture and Environment'],
  ];
  THEMES.forEach(([key, name], i) => {
    const t = tiles[i] || '';
    check(new RegExp(`<img[^>]+src="/_astro/eu-${key}\\.[^"]+\\.webp"`).test(t) && /srcset="[^"]*\.webp \d+w/.test(t), `index.html: tile ${i + 1} (${key}) has no WebP photograph`);
    check(/ alt[ =>]/.test(t.match(/<img[^>]*>/)?.[0] ?? '') && !/alt="[^"]+"/.test(t.match(/<img[^>]*>/)?.[0] ?? ''), `index.html: tile ${i + 1} (${key}) photograph must be decorative (empty alt)`);
    check(t.includes(`>${name}</span>`), `index.html: tile ${i + 1} must carry the full name "${name}" for assistive technology`);
    check(/class="lbl" aria-hidden="true"/.test(t), `index.html: tile ${i + 1} (${key}) has no visible label`);
  });
  check(unit.includes('Digital solutions for EU-funded projects'), 'index.html: the supporting line "Digital solutions for EU-funded projects" is missing');
  check(/<a class="eu-cta[^"]*" href="\/eu-projects"[^>]*>Explore EU Project Solutions/.test(unit), 'index.html: the call to action must read "Explore EU Project Solutions" and link to /eu-projects');
  check(!/<div class="visual"/.test(en) && !/hero-(en|el)\./.test(en), 'index.html: the English hero must not carry the Greek photograph');
  // The grid names kinds of work, not programmes: no programme, Commission, funding or EU-emblem wording beyond the line.
  check(!/(European Commission|Horizon|Erasmus|Interreg|co-funded|funded by|flag|stars|endorse|official)/i.test(unit.replace('Digital solutions for EU-funded projects', '')), 'index.html: the EU themes grid carries a programme, funding, endorsement or EU-emblem claim');

  for (const p of ['about.html', 'contact.html', 'work.html', 'capabilities.html', 'eu-projects.html', 'privacy.html', 'el/about.html']) {
    check(!/(hero-(en|el)|eu-(health|culture|security|digital|climate|food))\./.test(page(p)) && !/class="eu-unit/.test(page(p)), `${p}: carries a homepage hero visual`);
  }
}

console.log(`\nAsset validation: ${checks} checks, ${failures.length} failures.`);
for (const f of failures) console.log('  FAIL ' + f);
process.exit(failures.length ? 1 : 0);
