/**
 * Derives the website's identity files from the approved 3D masters in brand-source/final/3d/.
 * Run from the repository root after a master changes:  node scripts/brand/derive-identity.mjs
 *
 * Not part of the build. It uses sharp, which is already installed as Astro's own image dependency,
 * so no package is added for it. The outputs are committed, and the masters are never published.
 *
 * What it writes:
 * - src/assets/brand/techpi-symbol-{white,blue}.png: lossless square crops, centred on the symbol's outer ring
 *   with a small margin so the edge is never clipped. Astro resizes and encodes these for the page.
 * - public/favicon-32.png, public/favicon-192.png: from the app icon, cropped to the rounded square, transparent.
 * - public/apple-touch-icon.png: 180 x 180, opaque on Ink, because iOS fills transparency with black.
 * The browser icons are palette PNGs (see ICON_PNG). The symbol crops stay full-colour and lossless.
 *
 * The 3D artwork itself is never redrawn, traced or recoloured. Only crop, resize and (for iOS) a background.
 */
import fs from 'node:fs';
import sharp from 'sharp';

const MASTERS = 'brand-source/final/3d/';
const INK = '#080e1e';
/** Browser icons: a full 256-colour palette with dithering. About a fifth of the size, with no visible banding at icon sizes. */
const ICON_PNG = { palette: true, quality: 100, effort: 10, dither: 1, compressionLevel: 9 };

/** The bounding box of the solid artwork. Rows and columns need several opaque pixels, so faint specks are ignored. */
async function solidBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rows = new Array(H).fill(0);
  const cols = new Array(W).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] >= 128) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const first = (a) => a.findIndex((v) => v >= 3);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v >= 3);
  return { x0: first(cols), x1: last(cols), y0: first(rows), y1: last(rows), W, H };
}

/** A square region centred on the artwork, `margin` of its larger side added on each side, kept inside the image. */
async function squareAround(file, margin) {
  const b = await solidBox(file);
  const side = Math.round(Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1) * (1 + 2 * margin));
  const cx = (b.x0 + b.x1 + 1) / 2;
  const cy = (b.y0 + b.y1 + 1) / 2;
  const left = Math.round(cx - side / 2);
  const top = Math.round(cy - side / 2);
  if (left < 0 || top < 0 || left + side > b.W || top + side > b.H) throw new Error(`${file}: crop does not fit`);
  return { left, top, width: side, height: side };
}

fs.mkdirSync('src/assets/brand', { recursive: true });

for (const variant of ['white', 'blue']) {
  const src = `${MASTERS}techpi-symbol-${variant}-3d.png`;
  const region = await squareAround(src, 0.01);
  const out = `src/assets/brand/techpi-symbol-${variant}.png`;
  await sharp(src).extract(region).png({ compressionLevel: 9 }).toFile(out);
  console.log(out, region);
}

const icon = `${MASTERS}techpi-app-icon-3d.png`;
const body = await squareAround(icon, 0);
for (const size of [32, 192]) {
  const out = `public/favicon-${size}.png`;
  await sharp(icon).extract(body).resize(size, size, { kernel: 'lanczos3' }).png(ICON_PNG).toFile(out);
  console.log(out, body);
}
// iOS: a small Ink margin keeps the icon's own rounded rim inside the home-screen mask.
const inner = 164;
const touch = await sharp(icon).extract(body).resize(inner, inner, { kernel: 'lanczos3' }).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: INK } })
  .composite([{ input: touch, left: (180 - inner) / 2, top: (180 - inner) / 2 }])
  .flatten({ background: INK })
  .png(ICON_PNG)
  .toFile('public/apple-touch-icon.png');
console.log('public/apple-touch-icon.png', body);
