/**
 * Case studies managed by the admin (Task M1A: Rocketeer only). Shared by the admin Worker (the authority: every save is
 * checked here before anything is written), the admin UI (instant feedback) and the public site's build (src/content/
 * case-study-loader.ts validates the committed file on every build, so an invalid file fails the build).
 *
 * One file per case study: content/case-studies/<slug>/index.json
 *   facts    shared, locked facts (name, client, year, live URL, group, featured flag, display order, source). Not editable
 *            in the admin; a save can never change them.
 *   images   the images used, by registry id (the files stay in src/assets/projects). Locked.
 *   en, el   the editable text of each language. Both are required: case studies are published in both languages.
 */
export const CASE_STUDY = { name: 'case-studies', folder: 'content/case-studies', file: 'index.json', branchPrefix: 'cms/case-studies/' };
/** The only case studies the admin can load and save. The other 17 remain read-only until separately approved. */
export const CONNECTED_SLUGS = ['rocketeer'];
export const LOCALES = ['en', 'el'];

const text = (max, min = 1) => ({ kind: 'text', min, max });
const list = (min, max, itemMax) => ({ kind: 'list', min, max, itemMax });
/** Editable fields per language. `optional`: may be absent (and then must be absent or present in both languages). */
export const FIELDS = {
  category: text(80),
  summary: text(220),
  imageAlt: text(300),
  coverAlt: text(300),
  galleryAlts: { kind: 'alts', itemMax: 300 },
  overview: list(1, 4, 1500),
  need: list(1, 4, 1500),
  builtIntro: { kind: 'text', min: 1, max: 400, optional: true },
  builtItems: list(1, 12, 400),
  technology: list(1, 12, 120),
  outcome: list(1, 8, 300),
};
export const FACT_KEYS = ['slug', 'name', 'client', 'year', 'liveUrl', 'workGroup', 'featured', 'order', 'capabilities', 'source'];
const IMAGE_KEYS = ['id', 'width', 'height'];

export const entryPath = (slug) => `${CASE_STUDY.folder}/${slug}/${CASE_STUDY.file}`;
export const draftBranch = (slug) => `${CASE_STUDY.branchPrefix}${slug}`;
export const isConnected = (slug) => typeof slug === 'string' && CONNECTED_SLUGS.includes(slug);

// Plain text only: no line breaks inside a single line, no markup, no control characters.
// eslint-disable-next-line no-control-regex
const BAD = /[\u0000-\u001f\u007f<>]/;
const clean = (v) => (typeof v === 'string' ? v.trim() : v);

/**
 * Validates the editable part of a case study ({ en: {...}, el: {...} }) against the locked part of the current file
 * (`images`, used for the gallery alt-text count). Returns { ok, errors, value }. Errors are keyed `<locale>.<field>` or
 * `<locale>.<field>.<index>`; `value` holds trimmed strings in the canonical shape.
 */
export function validateEditable(input, images) {
  const errors = {};
  const value = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The case study must be an object.' }, value: null };
  for (const key of Object.keys(input)) if (!LOCALES.includes(key)) errors.entry = `Unknown language "${key}".`;
  const galleryCount = images?.gallery?.length ?? 0;
  for (const locale of LOCALES) {
    const c = input[locale];
    if (c === undefined || c === null || typeof c !== 'object' || Array.isArray(c)) { errors[`${locale}.entry`] = locale === 'en' ? 'The English version is required.' : 'The Greek version is required.'; continue; }
    const out = {};
    for (const key of Object.keys(c)) if (!FIELDS[key]) errors[`${locale}.${key}`] = `Unknown field "${key}".`;
    for (const [key, rule] of Object.entries(FIELDS)) {
      const raw = c[key];
      const at = `${locale}.${key}`;
      if (rule.kind === 'text') {
        if (raw === undefined || raw === null || raw === '') { if (!rule.optional) errors[at] = 'Required.'; continue; }
        if (typeof raw !== 'string') { errors[at] = 'Must be text.'; continue; }
        const v = clean(raw);
        if (!v) { if (!rule.optional) errors[at] = 'Required.'; continue; }
        if (BAD.test(v)) errors[at] = 'Plain text only: no line breaks or < > characters.';
        else if (v.length > rule.max) errors[at] = `At most ${rule.max} characters (now ${v.length}).`;
        else out[key] = v;
      } else {
        const wantCount = rule.kind === 'alts' ? galleryCount : null;
        if (!Array.isArray(raw)) { errors[at] = 'Must be a list.'; continue; }
        if (wantCount !== null && raw.length !== wantCount) { errors[at] = `Needs exactly ${wantCount} alt ${wantCount === 1 ? 'text' : 'texts'}, one per gallery image.`; continue; }
        if (wantCount === null && (raw.length < rule.min || raw.length > rule.max)) { errors[at] = `Between ${rule.min} and ${rule.max} items.`; continue; }
        const items = [];
        raw.forEach((item, i) => {
          if (typeof item !== 'string') { errors[`${at}.${i}`] = 'Must be text.'; return; }
          const v = clean(item);
          if (!v) errors[`${at}.${i}`] = 'Required. Remove the item if it is not needed.';
          else if (BAD.test(v)) errors[`${at}.${i}`] = 'Plain text only: no line breaks or < > characters.';
          else if (v.length > rule.itemMax) errors[`${at}.${i}`] = `At most ${rule.itemMax} characters (now ${v.length}).`;
          items.push(v);
        });
        out[key] = items;
      }
    }
    value[locale] = out;
  }
  // Parity: the two languages describe the same page, so their structure must match.
  if (value.en && value.el) {
    for (const [key, rule] of Object.entries(FIELDS)) {
      if (rule.kind === 'list' && Array.isArray(value.en[key]) && Array.isArray(value.el[key]) && value.en[key].length !== value.el[key].length) {
        errors[`el.${key}`] = `Greek has ${value.el[key].length} ${value.el[key].length === 1 ? 'item' : 'items'} and English has ${value.en[key].length}. Keep the same number in both languages.`;
      }
      if (rule.optional && (value.en[key] === undefined) !== (value.el[key] === undefined)) {
        errors[`${value.en[key] === undefined ? 'en' : 'el'}.${key}`] = 'Add or remove this in both languages.';
      }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Checks the locked part of a file: the shapes the public build relies on. Returns a list of problems. */
export function checkLocked(doc, slug) {
  const problems = [];
  const f = doc?.facts;
  if (!f || typeof f !== 'object') return ['facts are missing'];
  for (const k of Object.keys(f)) if (!FACT_KEYS.includes(k)) problems.push(`unknown fact "${k}"`);
  for (const k of ['slug', 'name', 'client', 'liveUrl', 'workGroup', 'source']) if (typeof f[k] !== 'string' || !f[k]) problems.push(`fact "${k}" must be text`);
  if (f.slug !== slug) problems.push('slug does not match the folder');
  if (!['client', 'earlier'].includes(f.workGroup)) problems.push('workGroup must be client or earlier');
  if (!Number.isInteger(f.year)) problems.push('year must be a number');
  if (typeof f.featured !== 'boolean') problems.push('featured must be true or false');
  if (!Number.isInteger(f.order) || f.order < 1) problems.push('order must be a position from 1');
  if (!Array.isArray(f.capabilities)) problems.push('capabilities must be a list');
  if (!/^https:\/\//.test(f.liveUrl ?? '') || !/^https:\/\//.test(f.source ?? '')) problems.push('liveUrl and source must be https URLs');
  const im = doc.images;
  const checkImage = (x, where) => {
    if (!x || typeof x !== 'object') { problems.push(`${where} is missing`); return; }
    for (const k of Object.keys(x)) if (!IMAGE_KEYS.includes(k)) problems.push(`${where}: unknown key "${k}"`);
    if (typeof x.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(x.id)) problems.push(`${where}: invalid image id`);
    if (!Number.isInteger(x.width) || !Number.isInteger(x.height) || x.width < 1 || x.height < 1) problems.push(`${where}: width and height must be whole numbers`);
  };
  checkImage(im?.image, 'images.image');
  checkImage(im?.cover, 'images.cover');
  if (!Array.isArray(im?.gallery)) problems.push('images.gallery must be a list');
  else im.gallery.forEach((g, i) => checkImage(g, `images.gallery.${i}`));
  return problems;
}

/** Validates a whole file (as stored): locked part plus editable part. Returns { ok, problems }. */
export function validateDocument(doc, slug) {
  const problems = checkLocked(doc, slug);
  for (const k of Object.keys(doc ?? {})) if (!['facts', 'images', ...LOCALES].includes(k)) problems.push(`unknown top-level key "${k}"`);
  const editable = validateEditable({ en: doc?.en, el: doc?.el }, doc?.images);
  for (const [k, msg] of Object.entries(editable.errors)) problems.push(`${k}: ${msg}`);
  return { ok: problems.length === 0, problems };
}

/** The file content written for a case study: locked part unchanged, editable part canonical (stable key order). */
export function serializeDocument(current, editable) {
  const out = { facts: current.facts, images: current.images };
  for (const locale of LOCALES) {
    out[locale] = {};
    for (const key of Object.keys(FIELDS)) if (editable[locale][key] !== undefined) out[locale][key] = editable[locale][key];
  }
  return JSON.stringify(out, null, 2) + '\n';
}

/** The editable part of a stored document, for the editor. */
export const editableOf = (doc) => Object.fromEntries(LOCALES.map((l) => [l, doc[l]]));
