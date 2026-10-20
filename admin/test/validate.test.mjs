// Unit tests for the admin editor's validation rules (src/prototype/lib/validate.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, LIMITS } from '../src/prototype/lib/validate.js';

const lang = (over = {}) => ({ title: 'Rocketeer', category: 'Platform', summary: 'A custom web application for deliveries.', body: '<p>Text.</p>', imageAlt: '', seoTitle: '', seoDescription: '', ...over });
const form = (over = {}) => ({ slug: 'rocketeer', image: null, content: { en: lang(), el: null }, ...over });
const ok = { slugTaken: () => false };

test('a complete English-only entry is valid', () => {
  assert.deepEqual(validate(form(), ok), {});
});

test('URL slugs: lower-case, digits, single hyphens; unique', () => {
  for (const slug of ['Bad Slug', 'bad_slug', '-bad', 'bad-', 'bad--slug', 'ΕΛ', '']) assert.ok(validate(form({ slug }), ok).slug, slug);
  assert.equal(validate(form({ slug: 'good-slug-2' }), ok).slug, undefined);
  assert.match(validate(form(), { slugTaken: () => true }).slug, /already uses/);
});

test('required fields and minimum title length, per language', () => {
  const e = validate(form({ content: { en: lang({ title: '', summary: ' ', body: '<p></p>' }), el: lang({ title: 'Ab' }) } }), ok);
  assert.ok(e['en.title'] && e['en.summary'] && e['en.body']);
  assert.match(e['el.title'], /At least/);
});

test('maximum lengths match the content schema and SEO rules', () => {
  const e = validate(form({ content: { en: lang({ title: 'x'.repeat(LIMITS.title[1] + 1), seoTitle: 'x'.repeat(71), seoDescription: 'x'.repeat(171) }), el: null } }), ok);
  assert.ok(e['en.title'] && e['en.seoTitle'] && e['en.seoDescription']);
});

test('an image needs alt text in every language that exists', () => {
  const e = validate(form({ image: 'x.webp', content: { en: lang({ imageAlt: 'A dashboard.' }), el: lang({ imageAlt: '' }) } }), ok);
  assert.equal(e['en.imageAlt'], undefined);
  assert.ok(e['el.imageAlt']);
});
