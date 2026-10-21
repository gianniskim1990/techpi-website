/**
 * The 8 website pages managed by the admin (Task M3). Shared by the admin Worker (the authority: every save is checked
 * here before anything is written), the admin UI (instant feedback, field labels) and the public site's build
 * (src/content/pages-content.ts validates every committed file on every build, so an invalid file fails the build).
 *
 * One file per page: content/pages/<key>/index.json
 *   facts   locked: the page key, its URLs in both languages, its kind (page or legal); for the legal pages also the
 *           version date and how each language writes it.
 *   en, el  the page's own copy and its search title and description, in each language.
 *
 * What is NOT in these files, because it has one source of truth elsewhere: the contact facts, the operator identity
 * and the registration numbers (src/content/site.ts), the four capabilities (src/content/capabilities.ts, shared by
 * Home, Capabilities and the case studies), the 18 case studies and the 7 articles (their own collections), the shell
 * labels (src/i18n), and the copy shared by several pages (case-study labels and the closing line, pages.*.ts).
 *
 * The structure of every page is locked: the same keys, and the same number of items in every list, as the current
 * file. Text can change, and list items can be reordered; nothing can be added or removed, because the components
 * lay these structures out. A few values are locked outright (facts and protective text, see LOCKED).
 *
 * Legal pages: values that come from site.ts or the routes are written as tokens ({{email}}, {{operator.name}},
 * {{path.cookies}}, ...) and whole dynamic blocks as { "dynamic": "operatorAddress" | "registration" }; the build
 * resolves them, so the files never hold a stale copy. Every token, protected statement and name reference a section
 * has must stay in that section. A technically valid legal change is not a legally approved one: substantive changes
 * to the Privacy or Cookies policy need the owner's review before they are merged.
 */

export const PAGE = { name: 'pages', folder: 'content/pages', file: 'index.json', branchPrefix: 'cms/pages/' };

/** The 8 pages: the file and branch key, the site's page key, and the name the admin shows. In the site's menu order. */
export const PAGES = [
  { key: 'home', pageKey: 'home', name: 'Home' },
  { key: 'work', pageKey: 'work', name: 'Work' },
  { key: 'capabilities', pageKey: 'capabilities', name: 'Capabilities' },
  { key: 'eu-projects', pageKey: 'euProjects', name: 'EU Projects' },
  { key: 'about', pageKey: 'about', name: 'About' },
  { key: 'contact', pageKey: 'contact', name: 'Contact' },
  { key: 'privacy', pageKey: 'privacy', name: 'Privacy Policy' },
  { key: 'cookies', pageKey: 'cookies', name: 'Cookies Policy' },
];
export const PAGE_KEYS = PAGES.map((p) => p.key);
export const LOCALES = ['en', 'el'];
export const PATHS = {
  home: { en: '/', el: '/el/' }, work: { en: '/work', el: '/el/work' }, capabilities: { en: '/capabilities', el: '/el/capabilities' },
  'eu-projects': { en: '/eu-projects', el: '/el/eu-projects' }, about: { en: '/about', el: '/el/about' }, contact: { en: '/contact', el: '/el/contact' },
  privacy: { en: '/privacy', el: '/el/privacy' }, cookies: { en: '/cookies', el: '/el/cookies' },
};

export const entryPath = (key) => `${PAGE.folder}/${key}/${PAGE.file}`;
export const draftBranch = (key) => `${PAGE.branchPrefix}${key}`;
export const isPage = (key) => typeof key === 'string' && PAGE_KEYS.includes(key);
export const pageInfo = (key) => PAGES.find((p) => p.key === key);

// ---------------------------------------------------------------------------------------------------------------
// Field schema: a label and a kind for every field of every page, by path (`*` stands for a list position).
//   text   one line          para   a paragraph        line   one line of a heading broken over lines
//   item   a list item       seo-title / seo-desc       legal  a legal paragraph or list item (inline markup, tokens)
//   locked shown, never editable
// ---------------------------------------------------------------------------------------------------------------
const SEO = [['seo.title', 'Search title', 'seo-title'], ['seo.description', 'Meta description', 'seo-desc']];
export const SCHEMA = {
  home: [
    ...SEO,
    ['intro.line', 'Intro overlay line (decorative)', 'text'],
    ['hero.meta', 'Hero: line above the headline', 'text'],
    ['hero.statement.*', 'Hero headline, line', 'line'],
    ['hero.support.*', 'Hero supporting line, line', 'line'],
    ['hero.start', 'Hero: primary button', 'text'],
    ['hero.work', 'Hero: secondary button', 'text'],
    ['hero.map.label', 'Transformation map: description for screen readers', 'para'],
    ['hero.map.from', 'Map: start label', 'text'], ['hero.map.to', 'Map: end label', 'text'],
    ['hero.map.websites', 'Map label: websites', 'text'], ['hero.map.ordering', 'Map label: ordering', 'text'],
    ['hero.map.visibility', 'Map label: visibility', 'text'], ['hero.map.automation', 'Map label: automation', 'text'],
    ['hero.map.ai', 'Map label: AI', 'text'], ['hero.map.systems', 'Map label: systems', 'text'], ['hero.map.products', 'Map label: products', 'text'],
    ['statement.heading', 'Statement heading', 'para'],
    ['statement.steps.*.step', 'Step label', 'text'], ['statement.steps.*.title', 'Step title', 'text'], ['statement.steps.*.text', 'Step text', 'para'],
    ['work.heading', 'Selected work: heading', 'text'], ['work.label', 'Selected work: section label', 'text'],
    ['work.all', 'Selected work: link to all work', 'text'], ['work.caseLink', 'Selected work: case-study link', 'text'],
    ['work.factsLabel', 'Selected work: capabilities label', 'text'],
    ['capabilities.heading', 'Capabilities: heading', 'text'],
    ['intelligence.heading.*', 'AI section heading, line', 'line'],
    ['intelligence.lead', 'AI section: lead', 'para'],
    ['intelligence.areas.*.title', 'AI area title', 'text'], ['intelligence.areas.*.text', 'AI area text', 'para'],
    ['evolution.heading', 'Evolution: heading', 'text'], ['evolution.lead', 'Evolution: lead', 'para'],
    ['evolution.text', 'Evolution: text', 'para'], ['evolution.link', 'Evolution: link to About', 'text'],
    ['contact.heading.*', 'Contact heading, line', 'line'], ['contact.cta', 'Contact: button', 'text'], ['contact.region', 'Contact: region', 'text'],
    ['euTeaser.label', 'EU teaser: label', 'text'], ['euTeaser.heading', 'EU teaser: heading', 'text'],
    ['euTeaser.text', 'EU teaser: text', 'para'], ['euTeaser.cta', 'EU teaser: link', 'text'], ['euTeaser.items.*', 'EU teaser item', 'item'],
  ],
  work: [
    ...SEO,
    ['lead', 'Lead', 'para'],
    ['groups.client.heading', 'Client projects: heading', 'text'], ['groups.client.description', 'Client projects: description', 'para'],
    ['groups.earlier.heading', 'Earlier work: heading', 'text'], ['groups.earlier.description', 'Earlier work: description', 'para'],
    ['linkLabel', 'Case-study link label', 'text'], ['highlightsLabel', 'Highlights label', 'text'], ['disciplinesLabel', 'Disciplines label', 'text'],
    ['filterLabel', 'Filter: accessible name', 'text'], ['filterAll', 'Filter: all work', 'text'],
  ],
  capabilities: [
    ...SEO,
    ['heading', 'Heading', 'text'], ['lead', 'Lead', 'para'], ['covers', '“What it covers” label', 'text'],
    ['indexLabel', 'Index label', 'text'], ['seenIn', '“Seen in” label', 'text'],
  ],
  'eu-projects': [
    ...SEO,
    ['hero.heading', 'Hero heading', 'text'], ['hero.lead', 'Hero lead', 'para'], ['hero.context', 'Hero context', 'para'], ['hero.cta', 'Hero button', 'text'],
    ['infra.heading', 'Infrastructure: heading', 'text'], ['infra.text', 'Infrastructure: text', 'para'],
    ['infra.supportLabel', 'Infrastructure: list label', 'text'], ['infra.support.*', 'Infrastructure item', 'item'], ['infra.audience', 'Infrastructure: audience', 'para'],
    ['lifecycle.label', 'Lifecycle: label', 'text'], ['lifecycle.heading', 'Lifecycle: heading', 'text'],
    ['lifecycle.stages.*.name', 'Stage name', 'text'], ['lifecycle.stages.*.text', 'Stage text', 'para'],
    ['websites.heading', 'Websites: heading', 'text'], ['websites.intro', 'Websites: intro', 'para'],
    ['websites.structureHeading', 'Websites: structure heading', 'text'], ['websites.structureText', 'Websites: structure text', 'para'],
    ['websites.modelRoot', 'Content model: root', 'text'], ['websites.model.*', 'Content model: item', 'item'],
    ['websites.groups.*.name', 'Website group name', 'text'], ['websites.groups.*.items.*', 'Website group item', 'item'],
    ['platforms.heading', 'Platforms: heading', 'text'], ['platforms.text', 'Platforms: text', 'para'],
    ['platforms.items.*.name', 'Platform name', 'text'], ['platforms.items.*.text', 'Platform text', 'para'],
    ['platforms.principlesLabel', 'Platforms: principles label', 'text'],
    ['platforms.principles.*.name', 'Principle name', 'text'], ['platforms.principles.*.text', 'Principle text', 'para'],
    ['partners.label', 'Partners: label', 'text'], ['partners.heading', 'Partners: heading', 'text'], ['partners.text', 'Partners: text', 'para'],
    ['partners.whoLabel', 'Partners: “who” label', 'text'], ['partners.who.*', 'Partner type', 'item'],
    ['partners.offerLabel', 'Partners: offer label', 'text'], ['partners.offer.*.name', 'Offer name', 'text'], ['partners.offer.*.text', 'Offer text', 'para'],
    ['partners.cta', 'Partners: button', 'text'],
    ['programmes.heading', 'Programmes: heading', 'text'], ['programmes.text', 'Programmes: text', 'para'],
    ['programmes.list.*', 'Programme', 'item'], ['programmes.also', 'Programmes: also', 'para'],
    ['programmes.disclaimer', 'Programmes: non-endorsement disclaimer', 'locked'],
    ['priorities.heading', 'Priorities: heading', 'text'], ['priorities.items.*.name', 'Priority name', 'text'], ['priorities.items.*.text', 'Priority text', 'para'],
    ['process.heading', 'Process: heading', 'text'], ['process.intro', 'Process: intro', 'para'],
    ['process.steps.*.name', 'Process step name', 'text'], ['process.steps.*.text', 'Process step text', 'para'],
    ['before.heading', 'Before launch: heading', 'text'], ['before.text', 'Before launch: text', 'para'], ['before.items.*', 'Before launch item', 'item'], ['before.note', 'Before launch: note', 'para'],
    ['after.heading', 'After launch: heading', 'text'], ['after.text', 'After launch: text', 'para'], ['after.items.*', 'After launch item', 'item'],
    ['closer.heading', 'Closing: heading', 'text'], ['closer.text', 'Closing: text', 'para'], ['closer.cta', 'Closing: button', 'text'],
  ],
  about: [
    ...SEO,
    ['heading', 'Heading', 'text'], ['lead', 'Lead', 'para'], ['changeHeading', '“What stayed, what changed” heading', 'text'],
    ['stayed.label', 'Stayed: label', 'text'], ['stayed.text', 'Stayed: text', 'para'],
    ['changed.label', 'Changed: label', 'text'], ['changed.text', 'Changed: text', 'para'],
    ['name', 'About the name', 'para'], ['principlesHeading', 'Principles: heading', 'text'],
    ['principles.*.heading', 'Principle', 'text'], ['principles.*.text', 'Principle: supporting text', 'para'],
  ],
  contact: [
    ...SEO,
    ['heading', 'Heading', 'text'], ['lead', 'Lead', 'para'], ['direct', '“Direct” label', 'text'],
    ['email', 'Email label', 'text'], ['phone', 'Phone label', 'text'], ['location', 'Location label', 'text'],
    ['locationValue', 'Location (town)', 'locked'],
  ],
};
const LEGAL = [
  ...SEO,
  ['heading', 'Page title (h1)', 'locked'], ['lead', 'Lead', 'para'], ['updatedLabel', '“Last updated” label', 'text'], ['contentsLabel', 'Contents label', 'text'],
  ['sections.*.id', 'Section anchor', 'locked'], ['sections.*.heading', 'Section heading', 'text'],
  ['sections.*.blocks.*.p', 'Paragraph', 'legal'], ['sections.*.blocks.*.ul.*', 'List item', 'legal'],
  ['sections.*.blocks.*.dynamic', 'Generated from site.ts', 'locked'], ['sections.*.blocks.*.address.*', 'Address line', 'locked'],
];
SCHEMA.privacy = LEGAL;
SCHEMA.cookies = LEGAL;

export const LIMITS = { text: 160, line: 80, para: 1200, item: 300, legal: 3000, 'seo-title': 70 };
export const SEO_DESCRIPTION = { min: 70, max: 200 }; // scripts/seo/validate.mjs
/** Words that must stay in a field, where the page states an approved relationship or identity. */
export const MUST_MENTION = {
  home: [['evolution.heading', ['TechPi', 'pigiota314']]],
  work: [['groups.earlier.heading', ['pigiota314']]],
  about: [['heading', ['TechPi', 'pigiota314']]],
};

/** The tokens a legal text may use, and what the build puts in their place (src/content/legal.ts). */
export const TOKENS = {
  email: 'The contact email, as a mailto link (site.ts)',
  phone: 'The telephone number, as a tel link (site.ts)',
  'operator.name': 'The operator’s name (site.ts)',
  'operator.town': 'The operator’s town (site.ts)',
  'path.privacy': 'The Privacy Policy, in this language',
  'path.cookies': 'The Cookies Policy, in this language',
  'url.cloudflarePrivacy': 'Cloudflare’s privacy policy',
  'url.cloudflareCookies': 'Cloudflare’s cookie documentation',
  'url.dpa': 'The Hellenic Data Protection Authority',
  'url.dpaComplaint': 'The Authority’s complaint page',
};
const HREF_TOKENS = Object.keys(TOKENS).filter((t) => t.startsWith('path.') || t.startsWith('url.'));
/** The verified Search Console statements (scripts/content/validate-legal.mjs requires them, word for word). */
export const GSC = {
  en: 'The domain techpi.eu has been verified in Google Search Console, which we can use to review aggregated information about how the website performs in Google Search when data is available.',
  el: 'Ο τομέας techpi.eu έχει επαληθευτεί στο Google Search Console, το οποίο μπορούμε να χρησιμοποιούμε για να βλέπουμε συγκεντρωτικά στοιχεία για την απόδοση του ιστότοπου στην Αναζήτηση Google, όταν υπάρχουν διαθέσιμα δεδομένα.',
};
/** Claims the legal pages must not make (the same list as scripts/content/validate-legal.mjs). */
export const RETIRED = [
  /intend to use Google Search Console/i,
  /Σκοπεύουμε να χρησιμοποιήσουμε το Google Search Console/,
  /sitemap[^.]*(has been|was|is) submitted/i,
  /(already|is|has been) indexed (by|in) Google/i,
  /ευρετηριασ|έχει υποβληθεί[^.]*sitemap|sitemap[^.]*έχει υποβληθεί/i,
  /(we use|we have installed|uses) Google Analytics/i,
  /Χρησιμοποιούμε (το )?Google Analytics/,
  /Search Console[^.]*(identifies|tells us who)/i,
  /Search Console[^.]*(reports show|has (shown|reported))/i,
  /do not transfer your personal data outside/i,
  /δεν διαβιβάζουμε τα προσωπικά σας δεδομένα εκτός/,
];
/** The operator's name as the legal texts write it, literally (Greek declines it, so it cannot be a token there). */
const NAME_FORMS = ['Ioannis Kimoundris', 'Ιωάννης Κιμούντρης', 'Ιωάννη Κιμούντρη'];
const NAME_STEMS = /Kimoundris|Κιμούντρ/g;
/** Facts that must come from site.ts through a token or a dynamic block, never be typed into legal text. */
const STALE_FACT = /[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d ]{8,}\d|\b\d{9,12}\b|Brokoumi|Μπρωκούμη|mailto:|tel:/;
/** No invented EU credentials, endorsements or results on the EU Projects page or teaser. */
const EU_CLAIMS = /\b(certified|accredited|endorsed|official partner|guarantee[ds]?|track record|success rate|we have (delivered|completed|won)|grants? (won|secured)|funding secured)\b|πιστοποιημέν|διαπιστευμέν|εγγυ(ημέν|όμαστε)|επίσημος συνεργάτης/i;
const DRAFT = /lorem ipsum|placeholder|\bTODO\b|\bTBD\b|\[OWNER|\[LEGAL|OWNER INPUT|LEGAL REVIEW|coming soon/i;
// eslint-disable-next-line no-control-regex
const BAD = /[\u0000-\u001f\u007f<>]/;
const TOKEN = /\{\{([a-zA-Z.]+)\}\}/g;

const pattern = (segs) => segs.map((s) => (typeof s === 'number' ? '*' : s)).join('.');
const ruleFor = (key, segs) => {
  const p = pattern(segs);
  const r = SCHEMA[key]?.find(([pat]) => pat === p);
  return r ? { path: r[0], label: r[1], kind: r[2] } : null;
};
export const isLegal = (key) => key === 'privacy' || key === 'cookies';
const tokensIn = (s) => [...s.matchAll(TOKEN)].map((m) => m[1]);

/** Checks one legal text: tokens, inline markup (**bold**, `code`, [text](token)), no stale facts. Returns an error or null. */
function checkLegalText(v) {
  for (const t of tokensIn(v)) if (!TOKENS[t]) return `Unknown reference {{${t}}}.`;
  if (/\{\{|\}\}/.test(v.replace(TOKEN, ''))) return 'A reference must be written exactly as {{name}}.';
  const plain = v.replace(TOKEN, '');
  if (STALE_FACT.test(plain)) return 'Contact details, registration numbers and the address come from site.ts: use the reference ({{email}}, {{phone}}) instead of typing them.';
  for (const m of v.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) {
    if (!m[1].trim()) return 'A link needs text.';
    const href = m[2].match(/^\{\{([a-zA-Z.]+)\}\}$/);
    if (!href || !HREF_TOKENS.includes(href[1])) return `Links may only point to a known page or address, written as a reference such as ({{path.cookies}}); “${m[2]}” is not one.`;
  }
  if (/\]\(/.test(v.replace(/\[[^\]]*\]\([^)]*\)/g, ''))) return 'Links must be written as [text]({{reference}}).';
  if (((v.match(/\*\*/g) || []).length) % 2) return 'Bold text needs a closing **.';
  if (((v.match(/`/g) || []).length) % 2) return 'Code text needs a closing `.';
  for (const r of RETIRED) if (r.test(v)) return 'This wording makes a claim the policy must not make (see the legal validator).';
  return null;
}

/** Checks one text value against its rule. Returns an error or null. */
function checkValue(key, rule, value, current) {
  if (typeof value !== 'string') return 'Must be text.';
  if (rule.kind === 'locked') return value === current ? null : 'This value is locked.';
  const v = value.trim();
  if (!v) return 'Required.';
  if (BAD.test(v)) return 'Plain text only: no line breaks or < > characters.';
  if (DRAFT.test(v.replace(TOKEN, ''))) return 'Looks like draft or placeholder text; the site refuses to publish it.';
  const max = LIMITS[rule.kind];
  if (rule.kind === 'seo-desc') {
    if (v.length < SEO_DESCRIPTION.min || v.length > SEO_DESCRIPTION.max) return `${SEO_DESCRIPTION.min} to ${SEO_DESCRIPTION.max} characters (now ${v.length}).`;
  } else if (max && v.length > max) return `At most ${max} characters (now ${v.length}).`;
  if (rule.kind === 'seo-title' && !/TechPi/.test(v)) return 'The search title must name TechPi.';
  if (rule.kind === 'legal') return checkLegalText(v);
  if (/\{\{|\}\}|\]\(|\*\*/.test(v)) return 'Formatting, links and references are not supported here; they would appear as plain text.';
  if ((key === 'eu-projects' || (key === 'home' && rule.path.startsWith('euTeaser'))) && EU_CLAIMS.test(v)) {
    return 'The EU Projects copy must not claim certifications, endorsements, guarantees or results.';
  }
  return null;
}

/**
 * Validates the editable copy ({ en, el }) of page `key` against the current file `current`. The structure must be the
 * same (keys and list lengths); text is checked per field. Returns { ok, errors, value } with errors keyed by path
 * (`en.hero.statement.1`, `el.sections.2.blocks.0.p`, ...).
 */
export function validateEditable(input, current, key) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: { entry: 'The page must be an object.' }, value: null };
  for (const k of Object.keys(input)) if (!LOCALES.includes(k)) errors.entry = `Unknown key "${k}". Only the English and Greek copy can be edited.`;
  const value = {};
  for (const locale of LOCALES) {
    const walk = (cur, inp, segs) => {
      const at = [locale, ...segs].join('.');
      if (Array.isArray(cur)) {
        if (!Array.isArray(inp)) { errors[at] = 'Must be a list.'; return cur; }
        if (inp.length !== cur.length) { errors[at] = `This list has ${cur.length} ${cur.length === 1 ? 'item' : 'items'}; items cannot be added or removed here.`; return cur; }
        return cur.map((c, i) => walk(c, inp[i], [...segs, i]));
      }
      if (cur && typeof cur === 'object') {
        if (!inp || typeof inp !== 'object' || Array.isArray(inp)) { errors[at] = 'Invalid content.'; return cur; }
        for (const k of Object.keys(inp)) if (!(k in cur)) errors[[at, k].join('.')] = `Unknown field "${k}".`;
        const out = {};
        for (const k of Object.keys(cur)) {
          if (!(k in inp)) { errors[[at, k].join('.')] = 'This field cannot be removed.'; out[k] = cur[k]; continue; }
          out[k] = walk(cur[k], inp[k], [...segs, k]);
        }
        return out;
      }
      const rule = ruleFor(key, segs);
      if (!rule) { errors[at] = 'This field is not editable.'; return cur; }
      const e = checkValue(key, rule, inp, cur);
      if (e) { errors[at] = e; return cur; }
      return rule.kind === 'locked' ? cur : inp.trim();
    };
    if (!current?.[locale]) { errors[`${locale}.entry`] = 'Missing language.'; continue; }
    if (!input[locale] || typeof input[locale] !== 'object') { errors[`${locale}.entry`] = locale === 'en' ? 'The English version is required.' : 'The Greek version is required.'; continue; }
    value[locale] = walk(current[locale], input[locale], []);
  }
  // Approved identity and relationship statements stay in their fields.
  for (const [path, words] of MUST_MENTION[key] ?? []) for (const locale of LOCALES) {
    const v = path.split('.').reduce((o, k) => o?.[k], value[locale]);
    for (const w of words) if (typeof v === 'string' && !v.includes(w) && !errors[`${locale}.${path}`]) errors[`${locale}.${path}`] = `Must keep the name “${w}”: this line states the approved TechPi and pigiota314 relationship.`;
  }
  if (isLegal(key)) checkLegalIntegrity(value, current, errors);
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Per legal section: the same references, protected statements and literal name mentions as the current version. */
function checkLegalIntegrity(value, current, errors) {
  const count = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
  for (const locale of LOCALES) {
    (current[locale]?.sections ?? []).forEach((sec, i) => {
      const now = value[locale]?.sections?.[i];
      if (!now) return;
      const texts = (s) => s.blocks.flatMap((b) => (b.p !== undefined ? [b.p] : b.ul ?? []));
      const before = texts(sec).join('\n');
      const after = texts(now).join('\n');
      const at = `${locale}.sections.${i}`;
      if (!same(count(tokensIn(before)), count(tokensIn(after)))) errors[`${at}.references`] ??= 'Every reference in this section ({{email}}, {{operator.name}}, links, ...) must stay: references can move within the text but not be added or removed.';
      const gsc = GSC[locale];
      if (before.split(gsc).length !== after.split(gsc).length) errors[`${at}.references`] ??= 'The verified Google Search Console statement must stay word for word (the legal validator requires it).';
      for (const n of NAME_FORMS) if (before.split(n).length !== after.split(n).length) errors[`${at}.references`] ??= `The operator’s name (“${n}”) must stay as it is in this section.`;
      if ((before.match(NAME_STEMS) || []).length !== (after.match(NAME_STEMS) || []).length) errors[`${at}.references`] ??= 'The operator’s name must stay as it is in this section.';
    });
  }
}

/** Checks the locked part of a file. Returns a list of problems. */
export function checkLocked(doc, key) {
  const problems = [];
  const f = doc?.facts;
  const info = pageInfo(key);
  if (!f || typeof f !== 'object' || !info) return ['facts are missing or the page is unknown'];
  const keys = isLegal(key) ? ['key', 'pageKey', 'paths', 'kind', 'updated', 'updatedText'] : ['key', 'pageKey', 'paths', 'kind'];
  for (const k of Object.keys(f)) if (!keys.includes(k)) problems.push(`unknown fact "${k}"`);
  if (f.key !== key) problems.push('key does not match the folder');
  if (f.pageKey !== info.pageKey) problems.push('pageKey does not match the page');
  if (JSON.stringify(f.paths) !== JSON.stringify(PATHS[key])) problems.push('paths must be the page’s URLs');
  if (f.kind !== (isLegal(key) ? 'legal' : 'page')) problems.push('kind is wrong');
  if (isLegal(key)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.updated ?? '')) problems.push('updated must be an ISO date');
    if (typeof f.updatedText?.en !== 'string' || typeof f.updatedText?.el !== 'string') problems.push('updatedText needs both languages');
  }
  return problems;
}

/** Validates a whole file (as stored): facts, schema coverage, EN/EL structure, text rules, legal integrity. */
export function validateDocument(doc, key) {
  const problems = checkLocked(doc, key);
  for (const k of Object.keys(doc ?? {})) if (!['facts', ...LOCALES].includes(k)) problems.push(`unknown top-level key "${k}"`);
  if (problems.length) return { ok: false, problems };
  // Every field has a rule, and English and Greek have the same structure (the hero's line breaks may differ).
  const shape = (o, segs = []) => Array.isArray(o) ? o.flatMap((v, i) => shape(v, [...segs, i])) : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => shape(v, [...segs, k])) : [segs];
  const paths = {};
  for (const locale of LOCALES) {
    const leaves = shape(doc[locale]);
    for (const segs of leaves) if (!ruleFor(key, segs)) problems.push(`${locale}.${segs.join('.')}: no rule for this field`);
    paths[locale] = leaves.filter((segs) => ruleFor(key, segs)?.kind !== 'line').map((segs) => segs.join('.'));
  }
  if (JSON.stringify(paths.en) !== JSON.stringify(paths.el)) problems.push('English and Greek must have the same structure');
  if (isLegal(key)) {
    const ids = (l) => doc[l].sections.map((s) => s.id);
    if (JSON.stringify(ids('en')) !== JSON.stringify(ids('el'))) problems.push('section anchors must be the same in both languages');
    if (new Set(ids('en')).size !== ids('en').length) problems.push('section anchors must be unique');
    for (const l of LOCALES) for (const s of doc[l].sections) {
      if (!/^[a-z][a-z0-9-]*$/.test(s.id)) problems.push(`${l}: invalid anchor "${s.id}"`);
      for (const b of s.blocks) {
        const kinds = Object.keys(b);
        if (kinds.length !== 1 || !['p', 'ul', 'address', 'dynamic'].includes(kinds[0])) problems.push(`${l}.${s.id}: invalid block`);
        if (b.dynamic !== undefined && !['operatorAddress', 'registration'].includes(b.dynamic)) problems.push(`${l}.${s.id}: unknown dynamic block "${b.dynamic}"`);
      }
    }
  }
  const self = validateEditable({ en: doc.en, el: doc.el }, doc, key);
  for (const [k, msg] of Object.entries(self.errors)) problems.push(`${k}: ${msg}`);
  return { ok: problems.length === 0, problems };
}

/** The file content written for a page: facts unchanged, the copy in the current file's key order. */
export function serializeDocument(current, editable) {
  return JSON.stringify({ facts: current.facts, en: editable.en, el: editable.el }, null, 2) + '\n';
}

export const editableOf = (doc) => ({ en: doc.en, el: doc.el });

/** Field rule for a path, for the editor (label, kind, limit). */
export function fieldRule(key, segs) {
  const r = ruleFor(key, segs);
  return r ? { ...r, max: LIMITS[r.kind] ?? null } : null;
}
