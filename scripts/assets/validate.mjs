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

console.log(`\nAsset validation: ${checks} checks, ${failures.length} failures.`);
for (const f of failures) console.log('  FAIL ' + f);
process.exit(failures.length ? 1 : 0);
