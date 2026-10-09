/**
 * Derives the homepage intro's symbol mask from the approved white 3D symbol, and checks the intro footage.
 * Run from the repository root:  node scripts/brand/derive-intro-media.mjs
 *
 * Not part of the build. Uses sharp, already installed as Astro's own image dependency, so no package is added.
 *
 * The mask: src/assets/intro/techpi-symbol-mask.webp is the alpha channel of src/assets/brand/techpi-symbol-white.png,
 * resized to 800 px (the largest size the intro shows it at, 2x), as white with that alpha. Nothing is traced, redrawn
 * or simplified: the silhouette, the contours and every transparent counter are the artwork's own. One clean-up: the
 * artwork's alpha carries invisible dither (its solid areas are 246 to 254, its empty areas 1 to 9). Those values are
 * set to exactly 255 and 0 before resizing, a change of under 4% opacity that no one can see but that makes the
 * mask a fraction of the size. The edges, which are the only real intermediate values, are kept. The intro's footage
 * is shown through it with CSS mask-image (alpha mode), so the video appears only inside the real symbol.
 *
 * The footage (src/assets/intro/intro-footage.{webm,mp4}) is rendered by scripts/brand/intro-footage.html in Chrome.
 * This script checks that both files are present and within the size budget. There is no poster: the footage is shown
 * only once it is playing, and until then the approved 3D symbol is visible.
 */
import fs from 'node:fs';
import sharp from 'sharp';

const SOURCE = 'src/assets/brand/techpi-symbol-white.png';
const OUT = 'src/assets/intro/';
const MASK_SIZE = 800;
const BUDGET_KB = { 'intro-footage.webm': 300, 'intro-footage.mp4': 300 };

fs.mkdirSync(OUT, { recursive: true });

const { width, height } = await sharp(SOURCE).metadata();
if (width !== height) throw new Error(`${SOURCE} is not square (${width} x ${height})`);

const raw = await sharp(SOURCE).ensureAlpha().extractChannel(3).raw().toBuffer();
for (let i = 0; i < raw.length; i++) raw[i] = raw[i] >= 246 ? 255 : raw[i] <= 9 ? 0 : raw[i];
const alpha = await sharp(raw, { raw: { width, height, channels: 1 } }).resize(MASK_SIZE, MASK_SIZE, { kernel: 'lanczos3' }).extractChannel(0).raw().toBuffer();
const white = Buffer.alloc(MASK_SIZE * MASK_SIZE * 4);
for (let i = 0; i < MASK_SIZE * MASK_SIZE; i++) {
  white[i * 4] = white[i * 4 + 1] = white[i * 4 + 2] = 255;
  white[i * 4 + 3] = alpha[i];
}
await sharp(white, { raw: { width: MASK_SIZE, height: MASK_SIZE, channels: 4 } })
  .webp({ lossless: true, effort: 6 })
  .toFile(`${OUT}techpi-symbol-mask.webp`);

// The mask must keep the artwork's shape: compare its coverage with the source alpha's.
const cover = (buf, step) => { let n = 0, t = 0; for (let i = 0; i < buf.length; i += step) { t++; if (buf[i] > 127) n++; } return n / t; };
const src = await sharp(SOURCE).ensureAlpha().extractChannel(3).raw().toBuffer();
const back = await sharp(`${OUT}techpi-symbol-mask.webp`).ensureAlpha().extractChannel(3).raw().toBuffer();
const a = cover(src, 1), b = cover(back, 1);
console.log(`mask: ${MASK_SIZE} px, ${Math.round(fs.statSync(`${OUT}techpi-symbol-mask.webp`).size / 1024)} KB, coverage ${(b * 100).toFixed(2)}% (source ${(a * 100).toFixed(2)}%)`);
if (Math.abs(a - b) > 0.005) throw new Error('mask coverage differs from the source artwork');

for (const [file, max] of Object.entries(BUDGET_KB)) {
  const p = OUT + file;
  if (!fs.existsSync(p)) throw new Error(`${p} is missing: render it with scripts/brand/intro-footage.html`);
  const kb = fs.statSync(p).size / 1024;
  console.log(`${file}: ${Math.round(kb)} KB (budget ${max} KB)`);
  if (kb > max) throw new Error(`${file} is over budget`);
}
console.log('intro media OK');
