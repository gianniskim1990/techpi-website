/**
 * Reads what a raster image really is from its bytes, never from its name or a declared type (Task M6). Shared by the
 * admin Worker (every upload is checked here before anything is written) and the site's asset validator
 * (scripts/assets/validate.mjs: declared sizes must equal the files).
 *
 *   imageInfo(bytes) -> { type: 'png' | 'jpeg' | 'webp', ext, width, height, metadata: string[] } | null
 *
 * `metadata` names any embedded text or camera data found (EXIF, XMP, text chunks). The admin refuses such files: the
 * repository is public, and EXIF can carry the location a photo was taken. The admin's own upload re-encodes every image
 * in the browser, which removes it, so only a file sent some other way can be refused for it.
 * No dependencies: works on a Uint8Array in Workers, Node and the browser.
 */
const ascii = (b, at, n) => String.fromCharCode(...b.subarray(at, at + n));
const u16be = (b, at) => (b[at] << 8) | b[at + 1];
const u32be = (b, at) => ((b[at] << 24) >>> 0) + (b[at + 1] << 16) + (b[at + 2] << 8) + b[at + 3];
const u24le = (b, at) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);
const u32le = (b, at) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;

function png(b) {
  if (b.length < 33 || u32be(b, 0) !== 0x89504e47 || u32be(b, 4) !== 0x0d0a1a0a || ascii(b, 12, 4) !== 'IHDR') return null;
  const metadata = [];
  for (let at = 8; at + 12 <= b.length; ) {
    const len = u32be(b, at);
    const type = ascii(b, at + 4, 4);
    if (['eXIf', 'tEXt', 'iTXt', 'zTXt'].includes(type) && !metadata.includes(type)) metadata.push(type);
    if (type === 'IEND') break;
    at += 12 + len;
  }
  return { type: 'png', ext: 'png', width: u32be(b, 16), height: u32be(b, 20), metadata };
}

function jpeg(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const metadata = [];
  for (let at = 2; at + 4 <= b.length; ) {
    if (b[at] !== 0xff) { at++; continue; }
    const marker = b[at + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { at += 2; continue; }
    const len = u16be(b, at + 2);
    if (marker === 0xe1) {
      const tag = ascii(b, at + 4, 4);
      metadata.push(tag === 'Exif' ? 'EXIF' : 'XMP');
    }
    // Start of frame (not DHT, JPG or DAC): height then width.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { type: 'jpeg', ext: 'jpg', width: u16be(b, at + 7), height: u16be(b, at + 5), metadata };
    }
    at += 2 + len;
  }
  return null;
}

function webp(b) {
  if (b.length < 30 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WEBP') return null;
  const metadata = [];
  let size = null;
  for (let at = 12; at + 8 <= b.length; ) {
    const type = ascii(b, at, 4);
    const len = u32le(b, at + 4);
    const d = at + 8;
    if (type === 'VP8 ' && !size && d + 10 <= b.length) size = { width: (b[d + 6] | (b[d + 7] << 8)) & 0x3fff, height: (b[d + 8] | (b[d + 9] << 8)) & 0x3fff };
    else if (type === 'VP8L' && !size && d + 5 <= b.length) {
      const bits = u32le(b, d + 1);
      size = { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    } else if (type === 'VP8X' && d + 10 <= b.length) {
      size = { width: u24le(b, d + 4) + 1, height: u24le(b, d + 7) + 1 };
    } else if ((type === 'EXIF' || type === 'XMP ') && !metadata.includes(type.trim())) metadata.push(type.trim());
    at = d + len + (len % 2);
  }
  return size ? { type: 'webp', ext: 'webp', ...size, metadata } : null;
}

export function imageInfo(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const info = png(b) ?? jpeg(b) ?? webp(b);
  return info && info.width > 0 && info.height > 0 ? info : null;
}
