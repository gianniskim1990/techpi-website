/**
 * The M0 demo collection: where its entries live, and the rules an entry must meet. Shared by the admin Worker (the
 * authority: every save is checked here before anything is written) and the admin UI (for immediate feedback).
 * The rules mirror the Astro schema in src/content.config.ts, which checks the same files again at build time.
 */
export const COLLECTION = { name: 'm0-demo', folder: 'content/m0-demo', file: 'index.json', branchPrefix: 'cms/m0-demo/' };
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LOCALES = ['en', 'el'];
export const FIELDS = {
  title: { min: 10, max: 90, required: true },
  summary: { min: 1, max: 200, required: true },
  body: { min: 1, max: 20_000, required: true },
  cover: { max: 120 },
  coverAlt: { max: 200 },
  seoTitle: { max: 70 },
  seoDescription: { max: 170 },
};

export const entryPath = (slug) => `${COLLECTION.folder}/${slug}/${COLLECTION.file}`;
export const draftBranch = (slug) => `${COLLECTION.branchPrefix}${slug}`;
export const isSlug = (s) => typeof s === 'string' && s.length <= 80 && SLUG.test(s);

/**
 * Validates an entry ({ en: {...}, el?: {...} }). Returns { ok, errors, value } where errors are keyed
 * `<locale>.<field>` (or `entry`), and value is the normalised entry (strings trimmed, empty optional fields removed).
 */
export function validateEntry(input) {
  const errors = {};
  const value = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The entry must be an object.' }, value: null };
  for (const key of Object.keys(input)) if (!LOCALES.includes(key)) errors.entry = `Unknown language "${key}".`;
  if (!input.en) errors['en.title'] = 'The English version is required.';
  for (const locale of LOCALES) {
    const c = input[locale];
    if (c === undefined || c === null) continue;
    if (typeof c !== 'object' || Array.isArray(c)) { errors[`${locale}.entry`] = 'Invalid content.'; continue; }
    const out = {};
    for (const key of Object.keys(c)) if (!FIELDS[key]) errors[`${locale}.${key}`] = `Unknown field "${key}".`;
    for (const [key, rule] of Object.entries(FIELDS)) {
      const raw = c[key];
      if (raw !== undefined && raw !== null && typeof raw !== 'string') { errors[`${locale}.${key}`] = 'Must be text.'; continue; }
      const v = (raw ?? '').trim();
      if (!v) { if (rule.required) errors[`${locale}.${key}`] = 'Required.'; continue; }
      if (rule.min && v.length < rule.min) errors[`${locale}.${key}`] = `At least ${rule.min} characters.`;
      else if (v.length > rule.max) errors[`${locale}.${key}`] = `At most ${rule.max} characters (now ${v.length}).`;
      out[key] = key === 'body' ? (raw ?? '').replace(/\r\n/g, '\n').replace(/\s+$/, '') : v;
    }
    if (out.cover && !/^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/i.test(out.cover)) errors[`${locale}.cover`] = 'Must be an image file in the entry folder.';
    if (out.cover && !out.coverAlt) errors[`${locale}.coverAlt`] = 'An image needs alt text.';
    value[locale] = out;
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** The file content written for an entry: stable key order and formatting, as the files in the repository use. */
export function serializeEntry(value) {
  const ordered = {};
  for (const locale of LOCALES) {
    if (!value[locale]) continue;
    ordered[locale] = {};
    for (const key of Object.keys(FIELDS)) if (value[locale][key] !== undefined) ordered[locale][key] = value[locale][key];
  }
  return JSON.stringify(ordered, null, 2) + '\n';
}
