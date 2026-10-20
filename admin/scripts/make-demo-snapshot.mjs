// Builds the read-only DEMO snapshot used by the admin UI prototype: the live website's case studies, articles and
// pages (list metadata plus EN/EL text for the demo editor), the latest commits on main, and small thumbnails of the
// existing project captures. It imports the real content modules with esbuild (image imports become file paths) and
// changes nothing. Run from admin/: node scripts/make-demo-snapshot.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const admin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(admin, '..');
const require = createRequire(path.join(repo, 'package.json'));
const esbuild = require('esbuild');
const sharp = require('sharp');
const out = path.join(admin, 'src', 'app', 'demo');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'media'), { recursive: true });
const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' });

// Bundle the content modules into one temporary ES module and import it.
const bundle = path.join(os.tmpdir(), `techpi-demo-${process.pid}.mjs`);
await esbuild.build({
  stdin: {
    contents: `export { projects } from './src/content/projects.ts';
export { projectsEl } from './src/content/projects.el.ts';
export { insights } from './src/content/insights.ts';`,
    resolveDir: repo,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'error',
  plugins: [{
    name: 'images-as-paths',
    setup(b) {
      b.onResolve({ filter: /\.(png|jpe?g|webp|avif)$/ }, (a) => ({ path: path.relative(repo, path.resolve(a.resolveDir, a.path)).replace(/\\/g, '/'), namespace: 'img' }));
      b.onLoad({ filter: /.*/, namespace: 'img' }, (a) => ({ contents: `export default ${JSON.stringify(a.path)};`, loader: 'js' }));
    },
  }],
});
const { projects, projectsEl, insights } = await import(pathToFileURL(bundle).href);
fs.rmSync(bundle, { force: true });

// Thumbnails of every project image in use (480 px WebP), for the demo media picker.
const media = new Map();
const thumb = async (src) => {
  if (!src) return null;
  if (media.has(src)) return media.get(src).file;
  const file = path.basename(src).replace(/\.[a-z]+$/i, '.webp');
  const buf = fs.readFileSync(path.join(repo, src));
  const meta = await sharp(buf).metadata();
  const info = await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(out, 'media', file));
  media.set(src, { file, original: src, width: meta.width, height: meta.height, bytes: buf.length, thumb: { width: info.width, height: info.height } });
  return file;
};

const caseStudies = [];
for (const [i, p] of projects.entries()) {
  const el = projectsEl[p.slug] ?? {};
  for (const img of [p.image, p.caseStudy?.cover, ...(p.caseStudy?.gallery ?? [])]) if (img) await thumb(img.src);
  caseStudies.push({
    slug: p.slug,
    order: i + 1,
    group: p.workGroup,
    featured: p.featured,
    capabilities: p.capabilities,
    hasCaseStudy: Boolean(p.caseStudy),
    hasGreek: Boolean(projectsEl[p.slug]),
    image: p.image ? media.get(p.image.src).file : null,
    imageAlt: { en: p.image?.alt ?? '', el: el.imageAlt ?? '' },
    status: 'published',
    url: { en: `https://techpi.eu/work/${p.slug}`, el: `https://techpi.eu/el/work/${p.slug}` },
    text: {
      en: { name: p.name, category: p.category, summary: p.summary, overview: [...(p.caseStudy?.overview ?? [])] },
      el: { name: p.name, category: el.category ?? '', summary: el.summary ?? '', overview: [...(el.caseStudy?.overview ?? [])] },
    },
  });
}

const articles = insights.map((a) => ({
  slug: a.slug, title: a.title, category: a.category, published: a.published, lead: a.lead,
  hasGreek: false, status: 'published', url: { en: `https://techpi.eu/insights/${a.slug}` },
  seo: { title: a.meta.title, description: a.meta.description },
}));

const pages = [
  ['home', 'Home', '/'], ['work', 'Work', '/work'], ['capabilities', 'Capabilities', '/capabilities'], ['euProjects', 'EU Projects', '/eu-projects'],
  ['about', 'About', '/about'], ['contact', 'Contact', '/contact'], ['privacy', 'Privacy Policy', '/privacy'], ['cookies', 'Cookies Policy', '/cookies'],
].map(([key, name, p]) => ({ key, name, url: { en: `https://techpi.eu${p}`, el: `https://techpi.eu${p === '/' ? '/el/' : '/el' + p}` }, status: 'published' }));

const history = git('log', '--format=%h|%ad|%s', '--date=iso-strict', '-8', 'origin/main').trim().split('\n').map((l) => {
  const [sha, date, ...s] = l.split('|');
  return { sha, date, message: s.join('|') };
});

const snapshot = {
  notice: 'DEMO SNAPSHOT for the admin UI prototype. Read from the repository; not connected; nothing is saved.',
  source: `origin/main @ ${git('rev-parse', '--short', 'origin/main').trim()}`,
  generated: new Date().toISOString(),
  caseStudies, articles, pages, media: [...media.values()], history,
};
fs.writeFileSync(path.join(out, 'snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');
const c = caseStudies;
console.log(`case studies ${c.length} (client ${c.filter((x) => x.group === 'client').length}, earlier ${c.filter((x) => x.group === 'earlier').length}, featured ${c.filter((x) => x.featured).length}, Greek ${c.filter((x) => x.hasGreek).length}) | articles ${articles.length} | pages ${pages.length} | media ${media.size} | commits ${history.length}`);
console.log(`text coverage: EN summary ${c.filter((x) => x.text.en.summary).length}/18, EL summary ${c.filter((x) => x.text.el.summary).length}/18, EN overview ${c.filter((x) => x.text.en.overview.length).length}/18, EL overview ${c.filter((x) => x.text.el.overview.length).length}/18`);
