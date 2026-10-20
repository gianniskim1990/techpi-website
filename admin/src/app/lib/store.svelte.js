/**
 * Prototype state. Everything lives in this browser tab's memory: the demo snapshot of the live site is copied in,
 * edits change the copy, and nothing is sent anywhere. When the real workflow is connected, `saveDraft` becomes a
 * commit to a draft branch and `publish` a pull-request merge; the screens stay the same.
 */
import snapshot from '../demo/snapshot.json';

const now = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

const paragraphsToHtml = (ps) => ps.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('');

/** A content entry as the editor sees it. `saved` is the last saved version; the editor works on a copy. */
function fromCaseStudy(c) {
  const lang = (l) => ({
    title: c.text[l].name,
    category: c.text[l].category,
    summary: c.text[l].summary,
    body: paragraphsToHtml(c.text[l].overview),
    imageAlt: c.imageAlt[l],
    seoTitle: '',
    seoDescription: '',
  });
  return {
    type: 'case-studies', slug: c.slug, order: c.order, group: c.group, featured: c.featured, image: c.image,
    status: 'published', isNew: false, hasGreek: c.hasGreek, publishedUrl: c.url, updatedAt: snapshot.history[0].date,
    saved: { en: lang('en'), el: c.hasGreek ? lang('el') : null },
  };
}
function fromArticle(a) {
  return {
    type: 'articles', slug: a.slug, order: 0, group: null, featured: false, image: null, status: 'published', isNew: false,
    hasGreek: false, publishedUrl: a.url, updatedAt: `${a.published}T09:00:00+00:00`, published: a.published,
    saved: { en: { title: a.title, category: a.category, summary: a.lead, body: `<p>${a.lead}</p>`, imageAlt: '', seoTitle: a.seo.title, seoDescription: a.seo.description }, el: null },
  };
}

export const store = $state({
  source: snapshot.source,
  entries: [...snapshot.caseStudies.map(fromCaseStudy), ...snapshot.articles.map(fromArticle)],
  pages: clone(snapshot.pages),
  media: clone(snapshot.media),
  history: clone(snapshot.history),
  activity: [],
  toasts: [],
});

export const entriesOf = (type) => store.entries.filter((e) => e.type === type);
export const findEntry = (type, slug) => store.entries.find((e) => e.type === type && e.slug === slug);

let toastId = 0;
export function toast(kind, title, text = '') {
  const id = ++toastId;
  store.toasts.push({ id, kind, title, text });
  // Keep the stack short: older messages give way to the newest three.
  while (store.toasts.length > 3) store.toasts.shift();
  setTimeout(() => dismissToast(id), kind === 'error' ? 8000 : 5000);
}
export function dismissToast(id) {
  const i = store.toasts.findIndex((t) => t.id === id);
  if (i >= 0) store.toasts.splice(i, 1);
}

const blank = () => ({ title: '', category: '', summary: '', body: '', imageAlt: '', seoTitle: '', seoDescription: '' });

/** Creates a new, unsaved-to-GitHub draft entry and returns its slug. */
export function createDraft(type) {
  let n = 1;
  while (findEntry(type, `untitled-${n}`)) n++;
  const slug = `untitled-${n}`;
  store.entries.unshift({
    type, slug, order: 0, group: type === 'case-studies' ? 'client' : null, featured: false, image: null,
    status: 'draft', isNew: true, hasGreek: false, publishedUrl: null, updatedAt: now(), saved: { en: blank(), el: null },
  });
  return slug;
}

/** Saves the editor's copy as a draft (prototype: in memory only). Returns the entry's (possibly new) slug. */
export function saveDraft(entry, form) {
  entry.saved = clone(form.content);
  entry.image = form.image;
  entry.featured = form.featured;
  if (entry.isNew) entry.slug = form.slug;
  entry.hasGreek = Boolean(form.content.el);
  entry.status = entry.isNew ? 'draft' : 'changes';
  entry.updatedAt = now();
  store.activity.unshift({ at: entry.updatedAt, text: `Draft saved: ${form.content.en.title || entry.slug}`, type: entry.type, slug: entry.slug });
  return entry.slug;
}

export const counts = () => {
  const by = (type) => entriesOf(type);
  const cs = by('case-studies');
  const ar = by('articles');
  return {
    pages: store.pages.length,
    caseStudies: cs.filter((e) => !e.isNew).length,
    client: cs.filter((e) => !e.isNew && e.group === 'client').length,
    earlier: cs.filter((e) => !e.isNew && e.group === 'earlier').length,
    featured: cs.filter((e) => e.featured).length,
    articles: ar.filter((e) => !e.isNew).length,
    drafts: store.entries.filter((e) => e.status !== 'published').length,
    greekCaseStudies: cs.filter((e) => e.hasGreek).length,
  };
};
