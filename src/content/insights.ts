/**
 * Insights: seven English articles migrated from pigiota314.eu/insights (owner approval, 2026-10-16; migration audit
 * decision D2). English only: there is no Greek version of any Insights page, and none is implied (routes.md, §4.1).
 *
 * Since Task M2 each article lives in content/insights/<slug>/index.json and is edited through the admin.
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
import whatEveryEuProjectWebsiteShouldInclude from '../../content/insights/what-every-eu-project-website-should-include/index.json';
import commonMistakesInHorizonEuropeProjectWebsites from '../../content/insights/common-mistakes-in-horizon-europe-project-websites/index.json';
import howToStructureDeliverablesAndPublications from '../../content/insights/how-to-structure-deliverables-and-publications/index.json';
import accessibilityConsiderationsForProjectWebsites from '../../content/insights/accessibility-considerations-for-project-websites/index.json';
import preparingAWebsiteBriefDuringTheProposalStage from '../../content/insights/preparing-a-website-brief-during-the-proposal-stage/index.json';
import whatCommunicationPartnersShouldAskAWebDevelopmentSupplier from '../../content/insights/what-communication-partners-should-ask-a-web-development-supplier/index.json';
import howAnalyticsCanSupportDisseminationReporting from '../../content/insights/how-analytics-can-support-dissemination-reporting/index.json';

export interface InsightSection {
  heading: string;
  /** Paragraphs before the list, if any. */
  paragraphs?: readonly string[];
  list?: readonly string[];
  /** Paragraphs after the list, if any. */
  after?: readonly string[];
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
  /** Slugs of genuinely related articles, in order. */
  related: readonly string[];
  meta: { title: string; description: string };
  /** The legacy URL, for the redirect map. Never rendered. */
  source: string;
}

/**
 * The 7 articles, managed in the admin since Task M2: one file each, content/insights/<slug>/index.json (the article
 * text, its search title and description, related articles; and the locked slug, position, publication date and
 * source). Listed explicitly: a file is published only when it is listed here. Every file is validated on every build
 * (admin/shared/insight-content.js), so an invalid draft fails the build instead of reaching the site.
 */
interface ManagedInsight {
  facts: { slug: string; order: number; published: string; publishedText: string; source: string };
  en: Pick<Insight, 'category' | 'title' | 'lead' | 'sections' | 'note' | 'related' | 'meta'>;
}
const managedInsights: readonly { slug: string; doc: ManagedInsight }[] = [
  { slug: 'what-every-eu-project-website-should-include', doc: whatEveryEuProjectWebsiteShouldInclude as unknown as ManagedInsight },
  { slug: 'common-mistakes-in-horizon-europe-project-websites', doc: commonMistakesInHorizonEuropeProjectWebsites as unknown as ManagedInsight },
  { slug: 'how-to-structure-deliverables-and-publications', doc: howToStructureDeliverablesAndPublications as unknown as ManagedInsight },
  { slug: 'accessibility-considerations-for-project-websites', doc: accessibilityConsiderationsForProjectWebsites as unknown as ManagedInsight },
  { slug: 'preparing-a-website-brief-during-the-proposal-stage', doc: preparingAWebsiteBriefDuringTheProposalStage as unknown as ManagedInsight },
  { slug: 'what-communication-partners-should-ask-a-web-development-supplier', doc: whatCommunicationPartnersShouldAskAWebDevelopmentSupplier as unknown as ManagedInsight },
  { slug: 'how-analytics-can-support-dissemination-reporting', doc: howAnalyticsCanSupportDisseminationReporting as unknown as ManagedInsight },
];

function insightFrom({ slug, doc }: { slug: string; doc: ManagedInsight }): Insight {
  const result = validateDocument(doc, slug);
  if (!result.ok) throw new Error(`Invalid article content/insights/${slug}/index.json:\n  ${result.problems.join('\n  ')}`);
  const { facts, en } = doc;
  return {
    slug: facts.slug,
    category: en.category,
    title: en.title,
    lead: en.lead,
    published: facts.published,
    publishedText: facts.publishedText,
    sections: en.sections,
    ...(en.note !== undefined ? { note: en.note } : {}),
    related: en.related,
    meta: en.meta,
    source: facts.source,
  };
}

/** Newest first, as on the source index: each file's locked position, which must be exactly 1 to N. */
export const insights: readonly Insight[] = (() => {
  const list = [...managedInsights].sort((x, y) => x.doc.facts.order - y.doc.facts.order);
  list.forEach((x, i) => {
    if (x.doc.facts.order !== i + 1) throw new Error(`Insights order must be 1 to ${list.length} without gaps or repeats (${x.slug}: ${x.doc.facts.order})`);
  });
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
