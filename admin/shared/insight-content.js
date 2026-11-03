/**
 * Insights articles managed by the admin (Task M2: the 7 existing articles). Shared by the admin Worker (the authority:
 * every save is checked here before anything is written), the admin UI (instant feedback) and the public site's build
 * (src/content/insights.ts validates every committed file on every build, so an invalid file fails the build).
 *
 * One file per article: content/insights/<slug>/index.json
 *   facts   locked: slug, position on the index (newest first), the original publication date and how the page writes
 *           it, and the legacy source URL (used for the redirect map, never rendered).
 *   en      the editable article. ENGLISH ONLY: there is no Greek version of any article, and a file with one is refused.
 *
 * The article's structure is locked: the number of sections, which parts each section has (paragraphs, a list,
 * paragraphs after the list) and whether there is a note. Text, and the number of items inside existing parts, can
 * change. Inline markup is limited to `[label](/path)` links to known internal pages, in the note only (the template
 * renders links nowhere else).
 *
 * Since Task M5 new articles can be created (validateNew): the creation form sets the address, the publication date and
 * the structure (sections, their parts, a note), which are then locked like those of every other article. A new article
 * has no legacy source, so it carries no "first published under the pigiota314 name" line.
 *
 * Which articles and case studies exist is not fixed here: callers pass `known` ({ insights, caseStudies }: the slugs
 * that exist). The site's build passes what is in content/; the admin Worker passes what is on the content branch.
 * Without it, the migrated lists below are used.
 */
import { CONNECTED_SLUGS as CASE_STUDY_SLUGS } from './case-study-content.js';

export const INSIGHT = { name: 'insights', folder: 'content/insights', file: 'index.json', branchPrefix: 'cms/insights/' };
/** The 7 articles migrated from pigiota314.eu (Task M2), newest first. History and test data since Task M5. */
export const INSIGHT_SLUGS = [
  'what-every-eu-project-website-should-include',
  'common-mistakes-in-horizon-europe-project-websites',
  'how-to-structure-deliverables-and-publications',
  'accessibility-considerations-for-project-websites',
  'preparing-a-website-brief-during-the-proposal-stage',
  'what-communication-partners-should-ask-a-web-development-supplier',
  'how-analytics-can-support-dissemination-reporting',
];
const DEFAULT_KNOWN = { insights: INSIGHT_SLUGS, caseStudies: CASE_STUDY_SLUGS };
/** English pages a note may link to, given the articles and case studies that exist. Insights are English only. */
export const internalPaths = (known = DEFAULT_KNOWN) => [
  '/', '/work', '/capabilities', '/eu-projects', '/about', '/contact', '/privacy', '/cookies', '/insights',
  ...(known.caseStudies ?? []).map((s) => `/work/${s}`),
  ...(known.insights ?? []).map((s) => `/insights/${s}`),
];
export const INTERNAL_PATHS = internalPaths();
/**
 * For reading a stored file only: related articles and note links are checked for their form, not for existence, so a
 * file that points to an article that is not on this branch can still be opened and corrected. Saving always checks
 * against what exists.
 */
export const ANY_KNOWN = Object.freeze({ any: true });
const knows = (known, kind, slug) => (known?.any ? isSlug(slug) : (known?.[kind] ?? []).includes(slug));
/** An article address, as in /insights/<slug>. */
export const SLUG_MAX = 90;
export const isSlug = (slug) => typeof slug === 'string' && slug.length <= SLUG_MAX && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export const RULES = {
  category: { min: 1, max: 60 },
  title: { min: 10, max: 120 },
  lead: { min: 1, max: 300 },
  heading: { min: 1, max: 120 },
  paragraph: { max: 1500 },
  item: { max: 300 },
  paragraphs: { min: 1, max: 8 },
  list: { min: 1, max: 15 },
  after: { min: 1, max: 8 },
  note: { min: 1, max: 400 },
  related: { min: 0, max: 4 },
  // The site's SEO validator (scripts/seo/validate.mjs): title at most 70 characters, description 70 to 200.
  metaTitle: { min: 1, max: 70 },
  metaDescription: { min: 70, max: 200 },
};
const PARTS = ['paragraphs', 'list', 'after'];
/** Words of body text a section needs under its heading. The site's validator uses the same number on the built page. */
export const MIN_SECTION_WORDS = 10;
const FACT_KEYS = ['slug', 'order', 'published', 'publishedText', 'source'];
const EN_KEYS = ['category', 'title', 'lead', 'sections', 'note', 'related', 'meta'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const entryPath = (slug) => `${INSIGHT.folder}/${slug}/${INSIGHT.file}`;
export const draftBranch = (slug) => `${INSIGHT.branchPrefix}${slug}`;
export const isInsight = (slug) => typeof slug === 'string' && INSIGHT_SLUGS.includes(slug);

// Plain text: no line breaks, no markup, no control characters.
// eslint-disable-next-line no-control-regex
const BAD = /[\u0000-\u001f\u007f<>]/;
// The site's Insights validator fails a page with draft or placeholder text; refuse it before it is saved.
const DRAFT = /lorem ipsum|placeholder|\bTODO\b|\bTBD\b|\[OWNER|coming soon|\{\{|\}\}/i;
const LINK = /\[([^\]]+)\]\(([^)]*)\)/g;

/** Checks one text value. `links`: whether `[label](/path)` links are allowed (the note only). Returns an error or null. */
export function checkText(value, { min = 1, max, links = false, paths = INTERNAL_PATHS, known = null } = {}) {
  if (typeof value !== 'string') return 'Must be text.';
  const v = value.trim();
  if (v.length < min) return min > 1 ? `At least ${min} characters (now ${v.length}).` : 'Required.';
  if (v.length > max) return `At most ${max} characters (now ${v.length}).`;
  if (BAD.test(v)) return 'Plain text only: no line breaks or < > characters.';
  if (DRAFT.test(v)) return 'Looks like draft or placeholder text; the site refuses to publish it.';
  const found = [...v.matchAll(LINK)];
  if (found.length && !links) return 'Links are not supported here; they would appear as plain text.';
  for (const [, label, href] of found) {
    if (!label.trim()) return 'A link needs a label.';
    if (!href.startsWith('/') || href.startsWith('//')) return `Only links to pages of this website are allowed (“${href}” is not one).`;
    const m = known?.any ? href.match(/^\/(work|insights)\/([^/]+)$/) : null;
    if (m ? !isSlug(m[2]) : !paths.includes(href)) return `“${href}” is not a page of this website.`;
  }
  const rest = v.replace(LINK, '');
  // Anything left that still looks like a link ("](") is malformed: it would show as raw text.
  if (/\]\(/.test(rest)) return links ? 'Links must be written as [label](/page).' : 'Links are not supported here; they would appear as plain text.';
  return null;
}

/** The structure of an article: per section, which parts it has; and whether it has a note. */
export const structureOf = (en) => ({
  sections: (en?.sections ?? []).map((s) => PARTS.filter((p) => s?.[p] !== undefined)),
  note: en?.note !== undefined,
});

/**
 * Validates the editable article ({ en }) against the current file `current` (its slug and structure). Returns
 * { ok, errors, value }. Errors are keyed by path: `en.title`, `en.sections.1.heading`, `en.sections.1.list.3`, ...
 */
export function validateEditable(input, current, known = DEFAULT_KNOWN) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The article must be an object.' }, value: null };
  for (const key of Object.keys(input)) if (key !== 'en') errors.entry = key === 'el' ? 'Insights articles are English only; a Greek version cannot be added.' : `Unknown key "${key}". Only the English article can be edited.`;
  const en = input.en;
  if (!en || typeof en !== 'object' || Array.isArray(en)) return { ok: false, errors: { ...errors, 'en.entry': 'The English article is required.' }, value: null };
  for (const key of Object.keys(en)) if (!EN_KEYS.includes(key)) errors[`en.${key}`] = `Unknown field "${key}".`;
  const want = structureOf(current?.en);
  const out = {};
  const text = (key, rule, opts = {}) => {
    const e = checkText(en[key], { ...rule, ...opts });
    if (e) errors[`en.${key}`] = e; else out[key] = en[key].trim();
  };
  text('category', RULES.category);
  text('title', RULES.title);
  text('lead', RULES.lead);

  if (!Array.isArray(en.sections)) errors['en.sections'] = 'Must be a list of sections.';
  else if (en.sections.length !== want.sections.length) errors['en.sections'] = `This article has ${want.sections.length} ${want.sections.length === 1 ? 'section' : 'sections'}; sections cannot be added or removed here.`;
  else {
    out.sections = en.sections.map((s, i) => {
      const at = `en.sections.${i}`;
      const sec = {};
      if (!s || typeof s !== 'object' || Array.isArray(s)) { errors[at] = 'Invalid section.'; return sec; }
      for (const key of Object.keys(s)) if (key !== 'heading' && !PARTS.includes(key)) errors[`${at}.${key}`] = `Unknown part "${key}".`;
      const h = checkText(s.heading, RULES.heading);
      if (h) errors[`${at}.heading`] = h; else sec.heading = s.heading.trim();
      for (const part of PARTS) {
        const has = s[part] !== undefined;
        if (has !== want.sections[i].includes(part)) {
          errors[`${at}.${part}`] = has ? 'This section has no such part; parts cannot be added here.' : 'This part exists in this section; it cannot be removed here.';
          continue;
        }
        if (!has) continue;
        const rule = RULES[part];
        if (!Array.isArray(s[part])) { errors[`${at}.${part}`] = 'Must be a list.'; continue; }
        if (s[part].length < rule.min || s[part].length > rule.max) { errors[`${at}.${part}`] = `Between ${rule.min} and ${rule.max} ${part === 'list' ? 'items' : 'paragraphs'}.`; continue; }
        sec[part] = s[part].map((p, j) => {
          const e = checkText(p, part === 'list' ? RULES.item : RULES.paragraph);
          if (e) errors[`${at}.${part}.${j}`] = e;
          return typeof p === 'string' ? p.trim() : p;
        });
      }
      return sec;
    });
  }

  // Consistency with the site's Insights validator (scripts/content/validate-insights.mjs), which checks the built pages
  // structurally: headings are distinct within an article, and every section has real text under its heading.
  if (Array.isArray(out.sections) && out.sections.length === want.sections.length) {
    const seen = new Map();
    out.sections.forEach((sec, i) => {
      if (typeof sec.heading === 'string') {
        const key = sec.heading.toLowerCase();
        if (seen.has(key) && !errors[`en.sections.${i}.heading`]) errors[`en.sections.${i}.heading`] = `Section ${seen.get(key) + 1} already has this heading. Each section needs its own.`;
        else seen.set(key, i);
      }
      const words = PARTS.flatMap((p) => (Array.isArray(sec[p]) ? sec[p] : [])).join(' ').split(/\s+/).filter(Boolean).length;
      const firstPart = PARTS.find((p) => want.sections[i].includes(p));
      if (firstPart && words < MIN_SECTION_WORDS && !errors[`en.sections.${i}.${firstPart}`]) errors[`en.sections.${i}.${firstPart}`] = `A section needs real text under its heading: at least ${MIN_SECTION_WORDS} words (now ${words}).`;
    });
  }

  if ((en.note !== undefined) !== want.note) errors['en.note'] = want.note ? 'This article has a note; it cannot be removed here.' : 'This article has no note; a note cannot be added here.';
  else if (want.note) text('note', RULES.note, { links: true, paths: internalPaths(known?.any ? undefined : known), known });

  const slug = current?.facts?.slug;
  if (!Array.isArray(en.related)) errors['en.related'] = 'Must be a list of articles.';
  else if (en.related.length > RULES.related.max) errors['en.related'] = `At most ${RULES.related.max} related articles.`;
  else {
    en.related.forEach((r, j) => {
      if (!knows(known, 'insights', r)) errors[`en.related.${j}`] = `“${r}” is not an Insights article.`;
      else if (r === slug) errors[`en.related.${j}`] = 'An article cannot be related to itself.';
      else if (en.related.indexOf(r) !== j) errors[`en.related.${j}`] = 'Listed twice.';
    });
    out.related = [...en.related];
  }

  if (!en.meta || typeof en.meta !== 'object' || Array.isArray(en.meta)) errors['en.meta'] = 'The search title and description are required.';
  else {
    for (const key of Object.keys(en.meta)) if (!['title', 'description'].includes(key)) errors[`en.meta.${key}`] = `Unknown field "${key}".`;
    const t = checkText(en.meta.title, RULES.metaTitle);
    const d = checkText(en.meta.description, RULES.metaDescription);
    if (t) errors['en.meta.title'] = t;
    if (d) errors['en.meta.description'] = d;
    if (!t && !d) out.meta = { title: en.meta.title.trim(), description: en.meta.description.trim() };
  }
  return { ok: Object.keys(errors).length === 0, errors, value: { en: out } };
}

/** "12 September 2025" for "2025-09-12": how the page writes the date. */
export const dateText = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** Checks the locked part of a file. Returns a list of problems. */
export function checkLocked(doc, slug) {
  const problems = [];
  const f = doc?.facts;
  if (!f || typeof f !== 'object') return ['facts are missing'];
  for (const k of Object.keys(f)) if (!FACT_KEYS.includes(k)) problems.push(`unknown fact "${k}"`);
  if (f.slug !== slug) problems.push('slug does not match the folder');
  if (!Number.isInteger(f.order) || f.order < 1) problems.push('order must be a position from 1');
  if (typeof f.published !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(f.published) || Number.isNaN(Date.parse(`${f.published}T00:00:00Z`))) problems.push('published must be an ISO date');
  else if (f.publishedText !== dateText(f.published)) problems.push('publishedText must be the published date as the page writes it');
  // Only the migrated articles have a source: their legacy pigiota314.eu URL (for the redirect map, never rendered).
  if ('source' in f && (typeof f.source !== 'string' || !/^https:\/\/pigiota314\.eu\/insights\/[a-z0-9-]+\/?$/.test(f.source))) problems.push('source must be the legacy pigiota314.eu/insights URL');
  return problems;
}

/** Validates a whole file (as stored). */
export function validateDocument(doc, slug, known = DEFAULT_KNOWN) {
  const problems = checkLocked(doc, slug);
  for (const k of Object.keys(doc ?? {})) if (!['facts', 'en'].includes(k)) problems.push(k === 'el' ? 'Insights articles are English only' : `unknown top-level key "${k}"`);
  const editable = validateEditable({ en: doc?.en }, doc, known);
  for (const [k, msg] of Object.entries(editable.errors)) problems.push(`${k}: ${msg}`);
  return { ok: problems.length === 0, problems };
}

/** The file content written for an article: locked facts unchanged, the article in canonical key order. */
export function serializeDocument(current, editable) {
  const en = editable.en;
  const article = {
    category: en.category,
    title: en.title,
    lead: en.lead,
    sections: en.sections.map((s) => Object.fromEntries(['heading', ...PARTS].filter((k) => s[k] !== undefined).map((k) => [k, s[k]]))),
    ...(en.note !== undefined ? { note: en.note } : {}),
    related: en.related,
    meta: { title: en.meta.title, description: en.meta.description },
  };
  return JSON.stringify({ facts: current.facts, en: article }, null, 2) + '\n';
}

/** The editable part of a stored document, for the editor. */
export const editableOf = (doc) => ({ en: doc.en });

// ---------- creating an article (Task M5) ----------

/** Addresses an article can never take. */
const RESERVED = ['index'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (iso) => typeof iso === 'string' && ISO.test(iso) && dateText(iso) !== undefined && new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso;

/**
 * Builds and validates a new article from the creation form.
 *   input  { facts: { slug, published }, en }  The sections, their parts and whether there is a note, as given in `en`,
 *          become the article's locked structure.
 *   ctx    { order: a unique position (the index sorts by date, newest first; order breaks ties), taken: slugs already
 *          used (on the content branch or by an open draft), known: { insights, caseStudies }, today: 'YYYY-MM-DD' }
 * Returns { ok, errors, doc }.
 */
export function validateNew(input, ctx = {}) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The article must be an object.' }, doc: null };
  for (const k of Object.keys(input)) if (!['facts', 'en'].includes(k)) errors.entry = k === 'el' ? 'Insights articles are English only; a Greek version cannot be added.' : `Unknown key "${k}".`;
  const f = input.facts && typeof input.facts === 'object' && !Array.isArray(input.facts) ? input.facts : null;
  if (!f) return { ok: false, errors: { ...errors, facts: 'The address and date are required.' }, doc: null };
  for (const k of Object.keys(f)) if (!['slug', 'published'].includes(k)) errors[`facts.${k}`] = `“${k}” cannot be set here.`;

  const slug = typeof f.slug === 'string' ? f.slug.trim() : '';
  if (!slug) errors['facts.slug'] = 'Required.';
  else if (!isSlug(slug)) errors['facts.slug'] = `Lower-case Latin letters and digits, words joined by single hyphens, at most ${SLUG_MAX} characters.`;
  else if (RESERVED.includes(slug)) errors['facts.slug'] = 'This address is reserved.';
  else if (ctx.taken?.includes(slug)) errors['facts.slug'] = 'An article with this address already exists, or has an open draft.';

  const today = typeof ctx.today === 'string' && ISO.test(ctx.today) ? ctx.today : new Date().toISOString().slice(0, 10);
  const published = typeof f.published === 'string' ? f.published.trim() : '';
  if (!validDate(published)) errors['facts.published'] = 'A date (YYYY-MM-DD).';
  else if (published > today) errors['facts.published'] = 'The publication date cannot be in the future.';

  if (!Number.isInteger(ctx.order) || ctx.order < 1) errors.entry = 'The article’s position could not be decided.';
  const en = input.en && typeof input.en === 'object' && !Array.isArray(input.en) ? input.en : null;
  if (!en) errors['en.entry'] = 'The English article is required.';
  else if (!Array.isArray(en.sections) || en.sections.length < 1) errors['en.sections'] = 'An article needs at least one section.';
  // The article itself may link to itself in a note or list itself as related only once it exists: both are refused.
  const known = { insights: (ctx.known?.insights ?? INSIGHT_SLUGS).filter((s) => s !== slug), caseStudies: ctx.known?.caseStudies ?? CASE_STUDY_SLUGS };
  if (en && Array.isArray(en.sections) && en.sections.length) {
    const text = validateEditable({ en }, { facts: { slug }, en }, known);
    Object.assign(errors, text.errors);
    if (!Object.keys(errors).length) {
      const facts = { slug, order: ctx.order, published, publishedText: dateText(published) };
      const doc = JSON.parse(serializeDocument({ facts }, text.value));
      const problems = validateDocument(doc, slug, known).problems;
      if (problems.length) return { ok: false, errors: { entry: problems.join(' ') }, doc: null };
      return { ok: true, errors: {}, doc };
    }
  }
  return { ok: false, errors, doc: null };
}

/**
 * `known` extended by the references a stored article already has (its related articles and the pages its note links
 * to). A save may keep a reference it already had; only a newly added one must point to something that exists.
 */
export function withReferencesOf(known, doc) {
  const linked = [...String(doc?.en?.note ?? '').matchAll(LINK)].map((m) => m[2]);
  const pick = (prefix) => linked.filter((h) => h.startsWith(prefix)).map((h) => h.slice(prefix.length));
  return {
    insights: [...new Set([...(known?.insights ?? []), ...(doc?.en?.related ?? []), ...pick('/insights/')])],
    caseStudies: [...new Set([...(known?.caseStudies ?? []), ...pick('/work/')])],
  };
}
