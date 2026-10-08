/**
 * Derives the social sharing image and the structured-data logo from the approved identity.
 * Run from the repository root after the identity changes:  node scripts/brand/derive-social.mjs
 *
 * Not part of the build, and no package is added for it. It uses sharp (already installed as Astro's own image
 * dependency) and a locally installed Chrome or Edge, run headless, for the type. sharp cannot read the self-hosted
 * WOFF2 font (it silently falls back to a system serif), and the TECHPI name must be set in Commissioner, exactly as
 * in the site header. Set CHROME to the browser executable if it is not in a default location. The outputs are
 * committed, so the site build never needs a browser.
 *
 * What it writes:
 * - public/og/techpi-en.png and public/og/techpi-el.png: 1200 x 630. Ink, the approved 3D symbol (white variant, the
 *   one approved for Ink), the TECHPI name and the site descriptor in the page's language (src/i18n), in Paper, and
 *   a short TechPi Blue rule. No other artwork, no screenshots.
 * - public/techpi-logo.png: 512 x 512, the blue 3D symbol on transparent, for the Organization `logo` in JSON-LD.
 *   The blue variant is the one approved for light surfaces, where search results show a logo.
 *
 * The 3D artwork is never redrawn, traced or recoloured. Only crop, resize and placement.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const INK = '#080e1e';
const PAPER = '#f0eee9';
const BLUE = '#0841c8';
const W = 1200;
const H = 630;

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((c) => fs.existsSync(c));
if (!chrome) throw new Error('No Chrome or Edge found. Set CHROME to the browser executable.');

const dataUri = (file, type) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
const latin = dataUri('src/assets/fonts/commissioner-latin.woff2', 'font/woff2');
const greek = dataUri('src/assets/fonts/commissioner-greek.woff2', 'font/woff2');
// The square crop the site itself uses (scripts/brand/derive-identity.mjs), so the margin matches.
const symbol = dataUri('src/assets/brand/techpi-symbol-white.png', 'image/png');

/** The site descriptor, as in src/i18n/en.ts and el.ts. */
const descriptors = { en: 'Digital Products &amp; Technology', el: 'Ψηφιακά προϊόντα &amp; τεχνολογία' };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'techpi-og-'));
fs.mkdirSync('public/og', { recursive: true });
for (const [locale, descriptor] of Object.entries(descriptors)) {
const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><style>
@font-face { font-family: Commissioner; src: url(${latin}) format('woff2'); font-weight: 100 900; unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: Commissioner; src: url(${greek}) format('woff2'); font-weight: 100 900; unicode-range: U+0370-03FF; }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${INK}; }
body { position: relative; font-family: Commissioner, sans-serif; color: ${PAPER}; }
.text { position: absolute; left: 96px; top: 50%; transform: translateY(-50%); }
.name { font-size: 76px; font-weight: 600; letter-spacing: 0.09em; line-height: 1; margin: 0; }
.rule { width: 72px; height: 4px; background: ${BLUE}; margin: 40px 0 34px; }
.descriptor { font-size: 34px; font-weight: 400; letter-spacing: 0; line-height: 1.2; margin: 0; opacity: 0.82; }
img { position: absolute; right: 96px; top: 50%; width: 360px; height: 360px; transform: translateY(-50%); }
</style></head><body>
<div class="text"><p class="name">TECHPI</p><div class="rule"></div><p class="descriptor">${descriptor}</p></div>
<img src="${symbol}" alt="">
</body></html>`;

const page = path.join(tmp, `og-${locale}.html`);
const shot = path.join(tmp, `og-${locale}.png`);
fs.writeFileSync(page, html);
execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--user-data-dir=${path.join(tmp, `profile-${locale}`)}`,
  `--window-size=${W},${H}`,
  // Give the data-URI font and image time to decode before the capture.
  '--virtual-time-budget=3000',
  `--screenshot=${shot}`,
  `file:///${page.replace(/\\/g, '/')}`,
]);

const meta = await sharp(shot).metadata();
if (meta.width !== W || meta.height !== H) throw new Error(`Screenshot is ${meta.width} x ${meta.height}, expected ${W} x ${H}.`);
const out = `public/og/techpi-${locale}.png`;
await sharp(shot).flatten({ background: INK }).png({ compressionLevel: 9, effort: 10 }).toFile(out);
console.log(out, fs.statSync(out).size, 'bytes');
}

await sharp('src/assets/brand/techpi-symbol-blue.png')
  .resize(512, 512, { kernel: 'lanczos3' })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile('public/techpi-logo.png');
console.log('public/techpi-logo.png', fs.statSync('public/techpi-logo.png').size, 'bytes');

fs.rmSync(tmp, { recursive: true, force: true });
