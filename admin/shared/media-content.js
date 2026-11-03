/**
 * The media library (Task M8): images uploaded once in the admin and usable by any case study or article.
 *
 *   src/assets/media/<id>.<ext>          the image (PNG, JPEG or WebP, checked like every upload: worker/images.js)
 *   content/media/<id>/index.json        its details, below
 *   content/media/<id>/thumb.<webp|jpg>  a small copy for the admin's library view (never used by the website)
 *
 * The details: { id, title, width, height, ext, thumb, uploaded, alt?: { en?, el? }, caption?: { en?, el? } }. `id`,
 * the size, `ext`, `thumb` and `uploaded` are fixed at upload. The title, and the default alt text and caption a page
 * starts from when it uses the image, can be edited; alt text is then required where the image is used, not here.
 *
 * Ids share one namespace with src/assets/projects and src/assets/insights (src/content/image-files.ts), and never end
 * like an entry's own upload (<slug>-<slot>-<n>), so a later upload cannot take a library image's name.
 */
export const MEDIA = {
  folder: 'src/assets/media',
  details: 'content/media',
  branch: 'cms/media/library',
};
export const LOCALES = ['en', 'el'];
export const RULES = { title: { max: 100 }, alt: { max: 300 }, caption: { max: 200 } };
export const ID_MAX = 60;
export const THUMB = { side: 480, bytes: 200_000 };
const ENTRY_UPLOAD = /-(?:image|cover|gallery|section)-\d+$/;
const BAD = /[\u0000-\u001f\u007f<>]/;

export const isMediaId = (id) => typeof id === 'string' && id.length <= ID_MAX && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && !ENTRY_UPLOAD.test(id);
export const imagePath = (id, ext) => `${MEDIA.folder}/${id}.${ext}`;
export const detailsPath = (id) => `${MEDIA.details}/${id}/index.json`;
export const thumbPath = (id, ext) => `${MEDIA.details}/${id}/thumb.${ext}`;

// Greek letters, for an id made from a Greek title.
const GREEK = { α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o' };

/** A free id for a new library image, from its title: `taken(id)` says whether an id is in use anywhere. */
export function newMediaId(title, taken) {
  let base = String(title ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[α-ως]/g, (c) => GREEK[c] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ID_MAX - 4)
    .replace(/-+$/g, '');
  if (!base) base = 'image';
  if (ENTRY_UPLOAD.test(base)) base = `${base}-img`;
  for (let n = 1; n < 1000; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    if (isMediaId(id) && !taken(id)) return id;
  }
  return null;
}

function text(value, max, errors, at, required) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) { if (required) errors[at] = 'Required.'; return undefined; }
  if (BAD.test(v)) { errors[at] = 'Plain text only: no line breaks or < > characters.'; return undefined; }
  if (v.length > max) { errors[at] = `At most ${max} characters (now ${v.length}).`; return undefined; }
  return v;
}
function perLocale(input, key, max, errors) {
  const out = {};
  if (input !== undefined && (input === null || typeof input !== 'object' || Array.isArray(input))) { errors[key] = 'Not valid.'; return undefined; }
  for (const l of LOCALES) {
    const v = text(input?.[l], max, errors, `${key}.${l}`, false);
    if (v) out[l] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The editable details: { title, alt?, caption? }. Returns { ok, value } or { ok: false, errors }. */
export function validateEditable(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { form: 'Not valid.' } };
  const title = text(input.title, RULES.title.max, errors, 'title', true);
  const alt = perLocale(input.alt, 'alt', RULES.alt.max, errors);
  const caption = perLocale(input.caption, 'caption', RULES.caption.max, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { title, ...(alt ? { alt } : {}), ...(caption ? { caption } : {}) } };
}

/** A stored details file, checked in full (it belongs to `id`). */
export function validateDetails(doc, id) {
  const problems = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return { ok: false, problems: ['Not an object.'] };
  if (doc.id !== id || !isMediaId(id)) problems.push('The id does not match.');
  for (const k of ['width', 'height']) if (!Number.isInteger(doc[k]) || doc[k] < 1) problems.push(`${k} is not valid.`);
  if (!['png', 'jpg', 'webp'].includes(doc.ext)) problems.push('ext is not valid.');
  if (!['thumb.webp', 'thumb.jpg'].includes(doc.thumb)) problems.push('thumb is not valid.');
  if (typeof doc.uploaded !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(doc.uploaded)) problems.push('uploaded is not valid.');
  const v = validateEditable(doc);
  if (!v.ok) problems.push(...Object.entries(v.errors).map(([k, m]) => `${k}: ${m}`));
  const known = new Set(['id', 'title', 'width', 'height', 'ext', 'thumb', 'uploaded', 'alt', 'caption']);
  for (const k of Object.keys(doc)) if (!known.has(k)) problems.push(`Unknown field ${k}.`);
  return { ok: problems.length === 0, problems };
}

/** The details file's text: fixed key order, two-space indent, final newline. */
export function serializeDetails(fixed, editable) {
  const doc = {
    id: fixed.id,
    title: editable.title,
    width: fixed.width,
    height: fixed.height,
    ext: fixed.ext,
    thumb: fixed.thumb,
    uploaded: fixed.uploaded,
    ...(editable.alt ? { alt: Object.fromEntries(LOCALES.filter((l) => editable.alt[l]).map((l) => [l, editable.alt[l]])) } : {}),
    ...(editable.caption ? { caption: Object.fromEntries(LOCALES.filter((l) => editable.caption[l]).map((l) => [l, editable.caption[l]])) } : {}),
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
