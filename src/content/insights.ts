/**
 * Insights: English articles. The first seven were migrated from pigiota314.eu/insights (owner approval, 2026-10-16; migration audit
 * decision D2). English only: there is no Greek version of any Insights page, and none is implied (routes.md, §4.1).
 *
 * Since Task M2 each article lives in content/insights/<slug>/index.json and is edited through the admin. Since Task M5
 * articles can also be created in the admin; those have no `source` and show no provenance line.
 *
 * Source of every article: the live page at `source`, read in full on 2026-10-16 (server-rendered HTML, confirmed with a
 * rendered fetch). The legacy articles are short; their substance is kept and not padded out (docs/content/
 * insights-migration.md records the source text, the dates and every editorial change).
 *
 * Rules:
 * - `published` is the date the source page displays, which is also the `datePublished` of its own Article data.
 *   No modified date, author, reading time or image is shown or described: none is established.
 * - The source's "Pigiota314" closing invitation is replaced by a restrained TechPi one in the template.
 * - No result, metric, client, programme endorsement or audit is claimed.
 * - Inline text supports `[label](href)` links to internal pages only.
 */

import { validateDocument } from '../../admin/shared/insight-content.js';
import type { ImageMetadata } from 'astro';
import { managedCaseStudies } from './case-studies';
import type { ProjectImage } from './projects';

export interface InsightSection {
  heading: string;
  /** Paragraphs before the list, if any. */
  paragraphs?: readonly string[];
  list?: readonly string[];
  /** Paragraphs after the list, if any. */
  after?: readonly string[];
  /** An image shown after the section's text (Task M7: added in the admin to a new article). */
  image?: ProjectImage;
}

export interface Insight {
  /** The legacy slug, kept unchanged: https://techpi.eu/insights/<slug>. */
  slug: string;
  /** The source's own topic label. */
  category: string;
  title: string;
  /** The lead under the title, and the excerpt on the index. */
  lead: string;
  /** ISO date shown on the source page (and in its Article data). */
  published: string;
  /** The same date, as written on the page. */
  publishedText: string;
  sections: readonly InsightSection[];
  /** A short note set apart from the article text, where the article needs one. */
  note?: string;
  /** An image between the head and the text (Task M7: added in the admin to a new article). */
  cover?: ProjectImage;
  /** Slugs of genuinely related articles, in order. */
  related: readonly string[];
  meta: { title: string; description: string };
  /** The legacy URL of a migrated article, for the redirect map. Never rendered. Absent on articles created in the admin. */
  source?: string;
}

/**
 * The articles, managed in the admin since Task M2: one file each, content/insights/<slug>/index.json (the article text,
 * its search title and description, related articles; and the locked slug, position, publication date and, for the
 * migrated ones, source). Since Task M5 the list is read from that folder at build time, so an article created in the
 * admin is published by merging its draft pull request. Every file is validated on every build
 * (admin/shared/insight-content.js) against the articles and case studies that exist, so an invalid draft, or a related
 * article or link that does not exist, fails the build instead of reaching the site.
 */
interface ImageRef { id: string; width: number; height: number }
type ManagedSection = Omit<InsightSection, 'image'> & { imageAlt?: string; imageCaption?: string };
interface ManagedInsight {
  facts: { slug: string; order: number; published: string; publishedText: string; source?: string };
  images?: { cover?: ImageRef; sections?: Record<string, ImageRef> };
  en: Pick<Insight, 'category' | 'title' | 'lead' | 'note' | 'related' | 'meta'> & { sections: ManagedSection[]; coverAlt?: string; coverCaption?: string };
}
/**
 * The article images, by id (file name without extension): every PNG, JPEG or WebP in src/assets/insights, where the
 * admin uploads them (Task M7). Declared sizes live in the content files and are checked by scripts/assets/validate.mjs,
 * which also refuses a file that no article uses.
 */
const imageFiles = import.meta.glob<ImageMetadata>('../assets/insights/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const articleImages: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(imageFiles).map(([file, meta]) => [(file.split('/').at(-1) as string).replace(/\.[a-z]+$/, ''), meta]),
);
function articleImage(ref: ImageRef | undefined, alt: string | undefined, caption: string | undefined, slug: string): ProjectImage | undefined {
  if (!ref) return undefined;
  const src = articleImages[ref.id];
  if (!src) throw new Error(`Article "${slug}" uses an image with no file in src/assets/insights: ${ref.id}`);
  return { src, width: ref.width, height: ref.height, alt: alt as string, ...(caption ? { caption } : {}) };
}
const files = import.meta.glob<{ default: unknown }>('../../content/insights/*/index.json', { eager: true });
const managedInsights: readonly { slug: string; doc: ManagedInsight }[] = Object.entries(files).map(([file, mod]) => ({
  slug: file.split('/').at(-2) as string,
  doc: mod.default as ManagedInsight,
}));
/** What exists: related articles and links in notes are checked against it. */
const known = { insights: managedInsights.map((x) => x.slug), caseStudies: managedCaseStudies.map((x) => x.slug) };

function insightFrom({ slug, doc }: { slug: string; doc: ManagedInsight }): Insight {
  const result = validateDocument(doc, slug, known);
  if (!result.ok) throw new Error(`Invalid article content/insights/${slug}/index.json:\n  ${result.problems.join('\n  ')}`);
  const { facts, en } = doc;
  return {
    slug: facts.slug,
    category: en.category,
    title: en.title,
    lead: en.lead,
    published: facts.published,
    publishedText: facts.publishedText,
    sections: en.sections.map(({ imageAlt, imageCaption, ...section }, i) => {
      const image = articleImage(doc.images?.sections?.[String(i)], imageAlt, imageCaption, slug);
      return image ? { ...section, image } : section;
    }),
    ...(doc.images?.cover ? { cover: articleImage(doc.images.cover, en.coverAlt, en.coverCaption, slug) } : {}),
    ...(en.note !== undefined ? { note: en.note } : {}),
    related: en.related,
    meta: en.meta,
    ...(facts.source !== undefined ? { source: facts.source } : {}),
  };
}

/**
 * Newest first: by publication date, then by each file's locked position (unique whole numbers from 1; an article created
 * in the admin takes the next free one). For the migrated articles this is the order of the source index.
 */
export const insights: readonly Insight[] = (() => {
  const seen = new Map<number, string>();
  for (const x of managedInsights) {
    const other = seen.get(x.doc.facts.order);
    if (other) throw new Error(`Two Insights articles share position ${x.doc.facts.order}: ${other} and ${x.slug}`);
    seen.set(x.doc.facts.order, x.slug);
  }
  const list = [...managedInsights].sort((x, y) => y.doc.facts.published.localeCompare(x.doc.facts.published) || x.doc.facts.order - y.doc.facts.order);
  return list.map(insightFrom);
})();

/** The Insights index: its own copy and metadata. */
export const insightsIndex = {
  heading: 'Insights',
  lead: 'Practical notes for EU project coordinators, communication partners and proposal teams: project websites, deliverables, accessibility and dissemination.',
  listLabel: 'Articles',
  read: 'Read article',
  eu: { text: 'What TechPi builds for EU-funded projects', link: 'EU Projects' },
  meta: {
    title: 'Insights — EU Project Websites & Platforms | TechPi',
    description:
      'Practical notes for EU project coordinators, communication partners and proposal teams: project websites, accessibility, deliverables, analytics and dissemination.',
  },
} as const;

/** Labels of the article template. English only, like the content. */
export const insightsCopy = {
  back: 'Insights',
  published: 'Published',
  provenance: 'First published under the pigiota314 name; edited for TechPi.',
  related: 'Related reading',
  closing: {
    heading: 'Working on an EU project website or platform?',
    text: 'See what TechPi builds for EU-funded projects, or tell us about yours.',
    eu: 'EU Projects',
    contact: 'Start a conversation',
  },
  /** The pointer on the English EU Projects page (the Greek page has none: there is nothing in Greek to point to). */
  euPointer: {
    label: 'Further reading',
    text: 'Practical notes on EU project websites, deliverables, accessibility and dissemination reporting.',
    link: 'Insights',
  },
  /** The honest alternative to a Greek version, shown on every Insights page. */
  englishOnly: 'Available in English only.',
  greekFallback: 'Ελληνικά: Ευρωπαϊκά έργα',
} as const;

export function insightBySlug(slug: string): Insight {
  const found = insights.find((a) => a.slug === slug);
  if (!found) throw new Error(`No Insights article with slug: ${slug}`);
  return found;
}

// Fail the build on a broken related reference rather than rendering a dead link.
for (const a of insights) for (const r of a.related) if (r === a.slug || !insights.some((b) => b.slug === r)) throw new Error(`${a.slug}: bad related slug ${r}`);
