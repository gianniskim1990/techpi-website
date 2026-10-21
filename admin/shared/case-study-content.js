/**
 * Case studies managed by the admin (Task M1B: all 18). Shared by the admin Worker (the authority: every save is checked
 * here before anything is written), the admin UI (instant feedback) and the public site's build (src/content/
 * case-study-loader.ts validates every committed file on every build, so an invalid file fails the build).
 *
 * One file per case study: content/case-studies/<slug>/index.json
 *   facts    shared, locked facts (name, client, year, live URL, group, featured flag, display order, capabilities,
 *            source). Not editable in the admin; a save can never change them.
 *   images   the images used, by registry id (the files stay in src/assets/projects), with their declared sizes. Locked.
 *   en, el   the editable text of each language. Both are required: case studies are published in both languages.
 *
 * Case studies differ in which sections they have (highlights, services, an introduction, images, ...). That structure is
 * locked too: the admin edits the text and the number of items inside existing sections, but cannot add or remove a
 * section, because that would change how the page is laid out.
 */
export const CASE_STUDY = { name: 'case-studies', folder: 'content/case-studies', file: 'index.json', branchPrefix: 'cms/case-studies/' };
/** The case studies the admin can load and save: exactly the 18 published ones, in Work-page order. */
export const CONNECTED_SLUGS = [
  'rocketeer', 'armans', 'logotherapia-xanthi', 'level-up-education-app', 'saloon', 'physio', 'project4you', 'rantevo',
  'mavie', 'iliastech', 'alexandra-apartment', 'blackjack-streetwear', 'level-up-education', 'itsallaboutxanthi',
  'local-xanthi', 'juliette-coffee-roasters', 'apox-fc', 'emoved',
];
export const LOCALES = ['en', 'el'];

const text = (max, opts = {}) => ({ kind: 'text', min: 1, max, ...opts });
const list = (min, max, itemMax, opts = {}) => ({ kind: 'list', min, max, itemMax, ...opts });
/**
 * Editable fields per language, in file order. `optional`: the section exists only in some case studies. `image`: the
 * field exists exactly when that image does (alt text is required for every image).
 */
export const FIELDS = {
  category: text(80),
  summary: text(220),
  highlights: list(1, 8, 80, { optional: true }),
  disciplines: list(1, 8, 80, { optional: true }),
  imageAlt: text(300, { image: 'image' }),
  coverAlt: text(300, { image: 'cover' }),
  coverCaption: text(200, { optional: true, needs: 'cover' }),
  galleryAlts: { kind: 'alts', itemMax: 300, image: 'gallery' },
  overview: list(1, 4, 1500),
  need: list(1, 4, 1500),
  builtIntro: text(400, { optional: true }),
  builtItems: list(1, 12, 400, { optional: true }),
  services: list(1, 12, 120, { optional: true }),
  technology: list(1, 12, 120, { optional: true }),
  outcome: list(1, 8, 300, { optional: true }),
};
export const FACT_KEYS = ['slug', 'name', 'client', 'clientEl', 'year', 'liveUrl', 'workGroup', 'featured', 'order', 'capabilities', 'source'];
const IMAGE_KEYS = ['id', 'width', 'height'];
// The four capability ids of src/content/capabilities.ts.
const CAPABILITIES = ['digital-products', 'web-experiences', 'intelligence', 'digital-visibility'];

export const entryPath = (slug) => `${CASE_STUDY.folder}/${slug}/${CASE_STUDY.file}`;
export const draftBranch = (slug) => `${CASE_STUDY.branchPrefix}${slug}`;
export const isConnected = (slug) => typeof slug === 'string' && CONNECTED_SLUGS.includes(slug);

// Plain text only: no line breaks inside a field, no markup, no control characters.
// eslint-disable-next-line no-control-regex
const BAD = /[\u0000-\u001f\u007f<>]/;
const present = (o, k) => o != null && o[k] !== undefined && o[k] !== null && o[k] !== '';

/** Which fields a language block has: the section structure of a case study. */
export const structureOf = (block) => Object.keys(FIELDS).filter((k) => present(block, k));

/** The fields an entry must have, given its images and (for optional sections) a reference structure. */
function expectedFields(images, reference) {
  return Object.entries(FIELDS)
    .filter(([key, rule]) => {
      if (rule.image) return rule.image === 'gallery' ? Array.isArray(images?.gallery) && images.gallery.length > 0 : Boolean(images?.[rule.image]);
      if (rule.optional) return reference.includes(key) && (!rule.needs || Boolean(images?.[rule.needs]));
      return true;
    })
    .map(([key]) => key);
}

/**
 * Validates the editable part of a case study ({ en, el }) against the current file `current` (its images, and its
 * English structure: which optional sections exist). Returns { ok, errors, value }. Errors are keyed `<locale>.<field>`
 * or `<locale>.<field>.<index>`; `value` holds trimmed strings in the canonical shape.
 */
export function validateEditable(input, current) {
  const errors = {};
  const value = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The case study must be an object.' }, value: null };
  for (const key of Object.keys(input)) if (!LOCALES.includes(key)) errors.entry = `Unknown key "${key}". Only the English and Greek text can be edited.`;
  const images = current?.images;
  const want = expectedFields(images, structureOf(current?.en));
  const galleryCount = images?.gallery?.length ?? 0;
  for (const locale of LOCALES) {
    const c = input[locale];
    if (c === undefined || c === null || typeof c !== 'object' || Array.isArray(c)) { errors[`${locale}.entry`] = locale === 'en' ? 'The English version is required.' : 'The Greek version is required.'; continue; }
    const out = {};
    for (const key of Object.keys(c)) if (!FIELDS[key]) errors[`${locale}.${key}`] = `Unknown field "${key}".`;
    for (const [key, rule] of Object.entries(FIELDS)) {
      const raw = c[key];
      const at = `${locale}.${key}`;
      const has = present(c, key) && !(Array.isArray(raw) && raw.length === 0 && rule.kind !== 'alts');
      if (!want.includes(key)) {
        if (has) errors[at] = rule.image ? 'This case study has no such image.' : 'This section does not exist in this case study. Sections cannot be added here.';
        continue;
      }
      if (rule.kind === 'text') {
        if (!present(c, key)) { errors[at] = rule.optional ? 'This section exists in this case study; it cannot be removed here.' : 'Required.'; continue; }
        if (typeof raw !== 'string') { errors[at] = 'Must be text.'; continue; }
        const v = raw.trim();
        if (!v) errors[at] = 'Required.';
        else if (BAD.test(v)) errors[at] = 'Plain text only: no line breaks or < > characters.';
        else if (v.length > rule.max) errors[at] = `At most ${rule.max} characters (now ${v.length}).`;
        else out[key] = v;
        continue;
      }
      if (!Array.isArray(raw)) { errors[at] = 'Must be a list.'; continue; }
      if (rule.kind === 'alts' && raw.length !== galleryCount) { errors[at] = `Needs exactly ${galleryCount} alt ${galleryCount === 1 ? 'text' : 'texts'}, one per gallery image.`; continue; }
      if (rule.kind === 'list' && (raw.length < rule.min || raw.length > rule.max)) { errors[at] = `Between ${rule.min} and ${rule.max} items.`; continue; }
      const items = [];
      raw.forEach((item, i) => {
        if (typeof item !== 'string') { errors[`${at}.${i}`] = 'Must be text.'; return; }
        const v = item.trim();
        if (!v) errors[`${at}.${i}`] = rule.kind === 'alts' ? 'Required: describe the image.' : 'Required. Remove the item if it is not needed.';
        else if (BAD.test(v)) errors[`${at}.${i}`] = 'Plain text only: no line breaks or < > characters.';
        else if (v.length > rule.itemMax) errors[`${at}.${i}`] = `At most ${rule.itemMax} characters (now ${v.length}).`;
        items.push(v);
      });
      out[key] = items;
    }
    value[locale] = out;
  }
  // Parity: the two languages describe the same page, so their lists must have the same number of items.
  if (value.en && value.el) {
    for (const [key, rule] of Object.entries(FIELDS)) {
      if (rule.kind === 'list' && Array.isArray(value.en[key]) && Array.isArray(value.el[key]) && value.en[key].length !== value.el[key].length) {
        errors[`el.${key}`] = `Greek has ${value.el[key].length} ${value.el[key].length === 1 ? 'item' : 'items'} and English has ${value.en[key].length}. Keep the same number in both languages.`;
      }
    }
  }
  if (!want.includes('builtIntro') && !want.includes('builtItems')) errors.entry = 'A case study needs an introduction or items under “What was built”.';
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Checks the locked part of a file: the shapes the public build relies on. Returns a list of problems. */
export function checkLocked(doc, slug) {
  const problems = [];
  const f = doc?.facts;
  if (!f || typeof f !== 'object') return ['facts are missing'];
  for (const k of Object.keys(f)) if (!FACT_KEYS.includes(k)) problems.push(`unknown fact "${k}"`);
  for (const k of ['slug', 'name', 'workGroup', 'source']) if (typeof f[k] !== 'string' || !f[k]) problems.push(`fact "${k}" must be text`);
  for (const k of ['client', 'clientEl', 'liveUrl']) if (k in f && (typeof f[k] !== 'string' || !f[k])) problems.push(`fact "${k}" must be text when present`);
  if ('clientEl' in f && !('client' in f)) problems.push('clientEl needs client');
  if (f.slug !== slug) problems.push('slug does not match the folder');
  if (!['client', 'earlier'].includes(f.workGroup)) problems.push('workGroup must be client or earlier');
  if (!Number.isInteger(f.year)) problems.push('year must be a number');
  if (typeof f.featured !== 'boolean') problems.push('featured must be true or false');
  if (!Number.isInteger(f.order) || f.order < 1) problems.push('order must be a position from 1');
  if (!Array.isArray(f.capabilities) || !f.capabilities.every((c) => CAPABILITIES.includes(c))) problems.push('capabilities must be a list of known capability ids');
  if (('liveUrl' in f && !/^https:\/\//.test(f.liveUrl)) || !/^https:\/\//.test(f.source ?? '')) problems.push('liveUrl and source must be https URLs');
  const im = doc.images;
  if (!im || typeof im !== 'object' || Array.isArray(im)) return [...problems, 'images must be an object'];
  for (const k of Object.keys(im)) if (!['image', 'cover', 'gallery'].includes(k)) problems.push(`images: unknown key "${k}"`);
  const checkImage = (x, where) => {
    if (!x || typeof x !== 'object') { problems.push(`${where} is invalid`); return; }
    for (const k of Object.keys(x)) if (!IMAGE_KEYS.includes(k)) problems.push(`${where}: unknown key "${k}"`);
    if (typeof x.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(x.id)) problems.push(`${where}: invalid image id`);
    if (!Number.isInteger(x.width) || !Number.isInteger(x.height) || x.width < 1 || x.height < 1) problems.push(`${where}: width and height must be whole numbers`);
  };
  if ('image' in im) checkImage(im.image, 'images.image');
  if ('cover' in im) checkImage(im.cover, 'images.cover');
  if ('gallery' in im) {
    if (!Array.isArray(im.gallery) || im.gallery.length === 0) problems.push('images.gallery must be a non-empty list when present');
    else im.gallery.forEach((g, i) => checkImage(g, `images.gallery.${i}`));
  }
  return problems;
}

/** Validates a whole file (as stored): locked part, editable part, and the same structure in both languages. */
export function validateDocument(doc, slug) {
  const problems = checkLocked(doc, slug);
  for (const k of Object.keys(doc ?? {})) if (!['facts', 'images', ...LOCALES].includes(k)) problems.push(`unknown top-level key "${k}"`);
  const editable = validateEditable({ en: doc?.en, el: doc?.el }, doc);
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
