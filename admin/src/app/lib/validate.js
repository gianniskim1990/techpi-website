/**
 * Editor validation. The same limits as the content schema (src/content.config.ts) and the website's SEO rules, so
 * what the editor accepts the build accepts. Returns errors keyed by `<lang>.<field>` (or `slug`, `image`).
 */
export const LIMITS = { title: [3, 90], summary: [20, 220], seoTitle: [0, 70], seoDescription: [0, 170], imageAlt: [0, 200] };
export const SEO_RECOMMENDED = { seoTitle: 60, seoDescription: 160 };

const textLength = (html) => html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim().length;

export function validate(form, { slugTaken }) {
  const errors = {};
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = 'Use lower-case letters, numbers and single hyphens only.';
  else if (slugTaken(form.slug)) errors.slug = 'Another entry already uses this URL.';
  for (const lang of ['en', 'el']) {
    const c = form.content[lang];
    if (!c) continue;
    const req = (k, label) => { if (!c[k] || !String(c[k]).trim()) errors[`${lang}.${k}`] = `${label} is required.`; };
    req('title', 'Title');
    req('summary', 'Summary');
    if (!errors[`${lang}.title`] && c.title.trim().length < LIMITS.title[0]) errors[`${lang}.title`] = `At least ${LIMITS.title[0]} characters.`;
    for (const [k, [, max]] of Object.entries(LIMITS)) if (c[k] && c[k].length > max) errors[`${lang}.${k}`] = `At most ${max} characters (now ${c[k].length}).`;
    if (textLength(c.body || '') === 0) errors[`${lang}.body`] = 'The text is empty.';
    if (form.image && !c.imageAlt?.trim()) errors[`${lang}.imageAlt`] = 'Describe the image for people who cannot see it.';
  }
  return errors;
}
