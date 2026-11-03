/**
 * Prepares a picture for upload, in the browser, before anything is sent (Task M6). The image is drawn onto a canvas at
 * most MAX_SIDE pixels on its longer side and encoded again, as WebP where the browser can (JPEG otherwise). That keeps
 * uploads small, applies the photo's orientation, and removes everything else in the file: EXIF (camera, location),
 * XMP and text. The Worker checks the result again from its bytes (worker/images.js) and refuses what does not pass.
 */
export const MAX_SIDE = 2560;
export const MIN_SIDE = 320;
export const MAX_BYTES = 2_900_000; // under the Worker's 3 MB
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const asDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('The image could not be read.'));
  r.readAsDataURL(blob);
});

/** Returns { data (base64), preview (data: URL), width, height, type, size } or throws an Error with a message to show. */
export async function prepareImage(file) {
  if (!file || !TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (file.size > 40_000_000) throw new Error('This file is too large to prepare (more than 40 MB). Export a smaller version first.');
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { throw new Error('This image could not be opened.'); }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  if (Math.min(width, height) < MIN_SIDE) throw new Error(`This image is too small: at least ${MIN_SIDE} pixels on each side (it is ${bitmap.width} × ${bitmap.height}).`);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  let blob = null;
  for (const [type, quality] of [['image/webp', 0.9], ['image/webp', 0.8], ['image/jpeg', 0.88], ['image/jpeg', 0.75]]) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    // A browser that cannot write WebP returns PNG instead: try the next format.
    if (blob && blob.type === type && blob.size <= MAX_BYTES) break;
    blob = null;
  }
  if (!blob) throw new Error('This image is still larger than 3 MB after compression. Try a smaller image.');
  const preview = await asDataUrl(blob);
  return { data: preview.slice(preview.indexOf(',') + 1), preview, width, height, type: blob.type, size: blob.size };
}
