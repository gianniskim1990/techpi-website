// Asset validator. Run after a build:  node scripts/assets/validate.mjs
//
// 1. Project images (src/assets/projects, read as a whole by src/content/projects.ts; the admin uploads into it, Task M6),
//    and article images (src/assets/insights, read by src/content/insights.ts, Task M7), each against its own content:
//    every file is a real PNG, JPEG or WebP (read from its bytes, admin/shared/image-info.js), at most MAX_IMAGE_BYTES,
//    with a unique id (its name without the extension); every image a case study references exists, with exactly the
//    declared size (declared, not read from the import, so the full-size originals are not copied into dist/ unused; a
//    replaced capture with stale numbers would otherwise be shown with the wrong proportions); and every file is used by
//    some case study, so no unused upload is published with the repository.
// 2. dist/ must not contain a full-size original of any file in src/assets/projects: every page uses
//    optimised WebP derivatives, so an original in dist/ is dead weight that is still uploaded to Cloudflare.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageInfo } from '../../admin/shared/image-info.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// The build to check: dist/ by default, or `--dist <dir>` like the other validators.
const distArg = process.argv.indexOf('--dist');
const distAstro = path.join(distArg >= 0 ? path.resolve(process.argv[distArg + 1]) : path.join(root, 'dist'), '_astro');
/** The same limit the admin applies to an upload (admin/worker/images.js). */
const MAX_IMAGE_BYTES = 3_000_000;
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

// 1. Each image folder: the files, by id, and every reference to them with its declared size.
const caseStudyRefs = (doc) => [doc.images?.image, doc.images?.cover, ...(doc.images?.gallery ?? [])];
const articleRefs = (doc) => [doc.images?.cover, ...Object.values(doc.images?.sections ?? {})];
const GROUPS = [
  { folder: 'src/assets/projects', content: 'content/case-studies', refs: caseStudyRefs, user: 'case study', required: true },
  { folder: 'src/assets/insights', content: 'content/insights', refs: articleRefs, user: 'article', required: false },
];
for (const g of GROUPS) {
  const dir = path.join(root, g.folder);
  if (!fs.existsSync(dir)) { check(!g.required, `${g.folder} not found`); continue; }
  const images = {};
  for (const f of fs.readdirSync(dir)) {
    const bytes = fs.readFileSync(path.join(dir, f));
    const info = imageInfo(bytes);
    const id = f.replace(/\.[a-z]+$/i, '');
    check(Boolean(info) && /\.(png|jpe?g|webp)$/.test(f), `${g.folder}/${f}: not a PNG, JPEG or WebP image`);
    check(!info || (info.ext === 'jpg' ? /\.jpe?g$/ : new RegExp(`\\.${info.ext}$`)).test(f), `${g.folder}/${f}: the extension does not match the content (${info?.type})`);
    check(bytes.length <= MAX_IMAGE_BYTES, `${g.folder}/${f}: ${bytes.length} bytes, at most ${MAX_IMAGE_BYTES}`);
    check(!images[id], `${g.folder}: two files share the id "${id}"`);
    images[id] = { file: f, info, used: false };
  }
  if (g.required) check(Object.keys(images).length > 0, `no images found in ${g.folder}`);
  const contentDir = path.join(root, g.content);
  for (const d of fs.existsSync(contentDir) ? fs.readdirSync(contentDir) : []) {
    const file = path.join(contentDir, d, 'index.json');
    if (!fs.existsSync(file)) continue;
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const im of g.refs(doc).filter(Boolean)) {
      const found = images[im.id];
      check(Boolean(found), `${g.content}/${d}: image "${im.id}" has no file in ${g.folder}`);
      if (!found) continue;
      found.used = true;
      const real = found.info;
      check(Boolean(real) && real.width === im.width && real.height === im.height, `${found.file}: declared ${im.width}x${im.height}, file is ${real ? `${real.width}x${real.height}` : 'unreadable'}`);
    }
  }
  for (const { file, used } of Object.values(images)) check(used, `${g.folder}/${file}: no ${g.user} uses this image`);
}

// 2. No original in dist/_astro (dist/ must exist: run a build first). Astro names an original <name>.<8-character hash>.<ext>
// and a derivative <name>.<hash>_<hash>.<ext>; a hash may itself contain _ or -.
check(fs.existsSync(distAstro), 'dist/_astro not found: run `npm run build` first');
if (fs.existsSync(distAstro)) {
  for (const f of GROUPS.flatMap((g) => (fs.existsSync(path.join(root, g.folder)) ? fs.readdirSync(path.join(root, g.folder)) : []))) {
    const base = path.parse(f).name;
    const leaked = fs.readdirSync(distAstro).filter((d) => d.startsWith(base + '.') && /^\.[A-Za-z0-9_-]{8}\.(png|jpe?g|webp)$/i.test(d.slice(base.length)));
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
