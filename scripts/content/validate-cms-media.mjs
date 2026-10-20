// CMS content and media validator. Runs in `npm run build`, so an invalid upload fails the build (and with it the
// preview or production deployment) before anything is published. Admin M0: covers content/ (CMS-managed content).
//
// For every entry file (content/**/index.json):
//   1. It parses as JSON.
//   2. Every image it references (a string value ending in an image extension) exists beside the entry, inside the
//      entry's folder (no ../ escapes, no absolute paths, no URLs).
// For every file under content/:
//   3. Only entry files (index.json) and raster images are allowed. Anything else (SVG, HTML, scripts, archives, ...)
//      fails the build: SVG can carry scripts, and nothing executable belongs in content.
//   4. An image's bytes must match its extension (PNG, JPEG or WebP signature), and it must be at most 2 MB.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const contentDir = path.join(root, 'content');
const MAX_BYTES = 2_000_000;
const IMAGE = /\.(png|jpe?g|webp)$/i;
const signature = {
  png: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  jpg: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};
let checks = 0;
const failures = [];
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) { failures.push(`${path.relative(root, p)}: symbolic links are not allowed in content/`); continue; }
    if (e.isDirectory()) walk(p);
    else files.push(p);
  }
};
if (fs.existsSync(contentDir)) walk(contentDir);

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const name = path.basename(file);
  if (name === 'index.json') {
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); check(true, ''); } catch (e) { check(false, `${rel}: not valid JSON (${e.message})`); continue; }
    const refs = [];
    const collect = (v) => { if (typeof v === 'string' && IMAGE.test(v.trim())) refs.push(v.trim()); else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
    collect(data);
    for (const ref of refs) {
      check(!/^[a-z]+:|^\/|(^|\/)\.\.(\/|$)/i.test(ref), `${rel}: image reference "${ref}" must be a file inside the entry folder`);
      check(fs.existsSync(path.join(path.dirname(file), ref)), `${rel}: image "${ref}" does not exist`);
    }
    continue;
  }
  const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  const kind = ext === 'jpeg' ? 'jpg' : ext;
  check(kind && signature[kind], `${rel}: file type not allowed in content/ (only index.json and PNG, JPEG or WebP images)`);
  if (!kind || !signature[kind]) continue;
  const bytes = fs.readFileSync(file);
  check(signature[kind](bytes), `${rel}: file content is not a real ${kind.toUpperCase()} image`);
  check(bytes.length <= MAX_BYTES, `${rel}: ${(bytes.length / 1e6).toFixed(1)} MB is over the 2 MB limit`);
}

if (failures.length) {
  console.log(failures.map((f) => `FAIL ${f}`).join('\n'));
  console.log(`\nCMS content and media validation: ${checks} checks, ${failures.length} failures.`);
  process.exit(1);
}
console.log(`CMS content and media validation: ${checks} checks, 0 failures (${files.length} files in content/).`);
