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

// The homepage hero visual. Each homepage has its own large background of six decorative WebP photographs, chosen at build time.
// English (src/components/home/EuHeroBackdrop.astro, eu-themes.ts): one for each thematic area of EU-funded projects, plus the line
// and the link to /eu-projects. Greek (BizHeroBackdrop.astro, biz-themes.ts): the services Greek businesses come for, plus a line and
// a link to the capabilities page. Neither homepage ships the other's visual, and no other page carries a hero visual.
{
  const root = path.resolve(distAstro, '..');
  const page = (p) => (fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : '');

  const el = page('el/index.html');
  const bizBg = (el.match(/<div class="biz-bg"[\s\S]*?<div class="veil"[^>]*><\/div><\/div>/) || [''])[0];
  check(bizBg !== '', 'el/index.html: the Greek background (biz-bg) is missing from the Greek hero');
  check(/class="biz-bg" aria-hidden="true"/.test(bizBg), 'el/index.html: the Greek background is not hidden from assistive technology');
  const bizFigs = bizBg.match(/<figure class="ph ph-[a-z]+"[\s\S]*?<\/figure>/g) || [];
  check(bizFigs.length === 6, `el/index.html: the Greek background must have six photographs, found ${bizFigs.length}`);
  for (const key of ['website', 'dashboard', 'design', 'app', 'store', 'workflow']) {
    const f = bizFigs.find((x) => x.includes(`ph-${key}"`)) || '';
    const img = f.match(/<img[^>]*>/)?.[0] ?? '';
    check(new RegExp(`src="/_astro/el-${key}\\.[^"]+\\.webp"`).test(img) && /srcset="[^"]*\.webp \d+w/.test(img), `el/index.html: the ${key} photograph is missing or not WebP`);
    check(/ alt[ =>]/.test(img) && !/alt="[^"]+"/.test(img), `el/index.html: the ${key} photograph must be decorative (empty alt)`);
  }
  const bizSay = (el.match(/<div class="biz-say[\s\S]*?<\/a><\/div>/) || [''])[0];
  check(bizSay.includes('Ψηφιακές λύσεις για επιχειρήσεις'), 'el/index.html: the Greek supporting line is missing');
  check(/<a class="biz-cta[^"]*" href="\/el\/capabilities"[^>]*>Δείτε τις δυνατότητές μας/.test(bizSay), 'el/index.html: the Greek call to action must read "Δείτε τις δυνατότητές μας" and link to /el/capabilities');
  check(!/<div class="visual"/.test(el) && !/hero-(en|el)\./.test(el), 'el/index.html: still carries the retired single hero photograph');
  check(!/class="(eu-(bg|say)|tile)/.test(el) && !/eu-(health|culture|security|digital|climate|food)\./.test(el), 'el/index.html: carries the English EU background');
  // The photographs show tools and work: no logo, client, programme, funding or endorsement wording in the Greek background.
  check(!/(European Commission|Horizon|Erasmus|Interreg|ΕΣΠΑ|co-funded|funded by|flag|endorse|official|βραβ|πιστοποιημ|award)/i.test(bizBg + bizSay), 'el/index.html: the Greek background carries a programme, funding, endorsement or award claim');

  const en = page('index.html');
  const bg = (en.match(/<div class="eu-bg"[\s\S]*?<div class="veil"[^>]*><\/div><\/div>/) || [''])[0];
  check(bg !== '', 'index.html: the EU background (eu-bg) is missing from the English hero');
  check(/class="eu-bg" aria-hidden="true"/.test(bg), 'index.html: the EU background is not hidden from assistive technology');
  const figs = bg.match(/<figure class="ph ph-[a-z]+"[\s\S]*?<\/figure>/g) || [];
  check(figs.length === 6, `index.html: the EU background must have six photographs, found ${figs.length}`);
  for (const key of ['health', 'culture', 'security', 'digital', 'climate', 'food']) {
    const f = figs.find((x) => x.includes(`ph-${key}"`)) || '';
    const img = f.match(/<img[^>]*>/)?.[0] ?? '';
    check(new RegExp(`src="/_astro/eu-${key}\\.[^"]+\\.webp"`).test(img) && /srcset="[^"]*\.webp \d+w/.test(img), `index.html: the ${key} photograph is missing or not WebP`);
    check(/ alt[ =>]/.test(img) && !/alt="[^"]+"/.test(img), `index.html: the ${key} photograph must be decorative (empty alt)`);
  }
  const say = (en.match(/<div class="eu-say[\s\S]*?<\/a><\/div>/) || [''])[0];
  check(say.includes('Digital solutions for EU-funded projects'), 'index.html: the supporting line "Digital solutions for EU-funded projects" is missing');
  check(/<a class="eu-cta[^"]*" href="\/eu-projects"[^>]*>Explore EU Project Solutions/.test(say), 'index.html: the call to action must read "Explore EU Project Solutions" and link to /eu-projects');
  check(!/<div class="visual"/.test(en) && !/hero-(en|el)\./.test(en) && !/class="biz-(bg|say)/.test(en) && !/el-(website|dashboard|design|app|store|workflow)\./.test(en), 'index.html: the English hero must not carry the Greek background');
  check(!/class="eu-unit|class="tile"/.test(en), 'index.html: still carries the retired six-tile grid');
  // The background names kinds of work, not programmes: no programme, Commission, funding or EU-emblem wording beyond the line.
  check(!/(European Commission|Horizon|Erasmus|Interreg|co-funded|funded by|flag|stars|endorse|official)/i.test((bg + say).replace('Digital solutions for EU-funded projects', '')), 'index.html: the EU background carries a programme, funding, endorsement or EU-emblem claim');

  for (const p of ['about.html', 'contact.html', 'work.html', 'capabilities.html', 'eu-projects.html', 'privacy.html', 'el/about.html']) {
    check(!/(hero-(en|el)|eu-(health|culture|security|digital|climate|food)|el-(website|dashboard|design|app|store|workflow))\./.test(page(p)) && !/class="(eu|biz)-(bg|say)/.test(page(p)), `${p}: carries a homepage hero visual`);
  }
}

console.log(`\nAsset validation: ${checks} checks, ${failures.length} failures.`);
for (const f of failures) console.log('  FAIL ' + f);
process.exit(failures.length ? 1 : 0);
