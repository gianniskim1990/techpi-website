/**
 * Insights: seven English articles migrated from pigiota314.eu/insights (owner approval, 2026-10-16; migration audit
 * decision D2). English only: there is no Greek version of any Insights page, and none is implied (routes.md, §4.1).
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

const legacy = 'https://pigiota314.eu/insights/';

/** Newest first, as on the source index. */
export const insights: readonly Insight[] = [
  {
    slug: 'what-every-eu-project-website-should-include',
    category: 'EU project websites',
    title: 'What every EU-funded project website should include',
    lead: 'A practical checklist for project coordinators and communication partners, from identity and partner pages to deliverables, news and long-term dissemination.',
    published: '2025-09-12',
    publishedText: '12 September 2025',
    sections: [
      {
        heading: 'Start from the project’s communication objectives',
        paragraphs: [
          'Most EU-funded projects describe their communication and dissemination objectives in the proposal. A good project website is the operational expression of those objectives, not a separate creative exercise. Begin by mapping every objective to a concrete part of the website: who reads it, what action it supports and how it will be updated.',
          'This avoids a common pattern: a project website that looks impressive at launch but cannot be sustained or measured during the project lifecycle.',
        ],
      },
      {
        heading: 'The structural minimum',
        paragraphs: ['Every EU project website should clearly present:'],
        list: [
          'The project identity and abstract',
          'The consortium and partners',
          'The work packages and objectives',
          'The news and events stream',
          'The deliverables and publications library',
          'The results and impact pages',
          'A contact route for stakeholders',
        ],
        after: [
          'These are not decorative sections. Each one has a specific audience and reporting purpose, so the information architecture should be designed around them before any visual design begins.',
        ],
      },
      {
        heading: 'Long-term dissemination, not just launch',
        paragraphs: [
          'Communication partners often inherit project websites that were optimised for launch and ignore the long tail of the project. A sustainable site assumes regular updates, planned content milestones and clear ownership for each section.',
        ],
      },
    ],
    related: ['common-mistakes-in-horizon-europe-project-websites', 'how-to-structure-deliverables-and-publications', 'preparing-a-website-brief-during-the-proposal-stage'],
    meta: {
      title: 'What every EU-funded project website should include | TechPi',
      description:
        'A practical checklist for EU project coordinators and communication partners: identity, partners, work packages, deliverables, news and long-term dissemination.',
    },
    source: `${legacy}what-every-eu-project-website-should-include`,
  },
  {
    slug: 'common-mistakes-in-horizon-europe-project-websites',
    category: 'EU project websites',
    title: 'Common mistakes in Horizon Europe project websites',
    lead: 'Three recurring patterns in Horizon Europe project websites, and how to avoid them.',
    published: '2025-08-21',
    publishedText: '21 August 2025',
    sections: [
      {
        heading: 'Treating the website as a one-off deliverable',
        paragraphs: [
          'When a project website is treated as a launch deliverable rather than a living tool, it ages quickly. The most common consequence is a structure that cannot absorb new deliverables, results or events without manual intervention from a developer.',
        ],
      },
      {
        heading: 'Overloaded homepages',
        paragraphs: [
          'Project homepages often try to communicate every aspect of the project at once. A clearer approach is to use the homepage to orient visitors (who this is, what it does, where to go next) and let dedicated pages carry the depth.',
        ],
      },
      {
        heading: 'Hidden deliverables and publications',
        paragraphs: [
          'Deliverables and publications are often a primary reason visitors arrive on a project website. They should be easy to find, well structured and consistently presented across the project lifecycle.',
        ],
      },
    ],
    related: ['what-every-eu-project-website-should-include', 'how-to-structure-deliverables-and-publications'],
    meta: {
      title: 'Common mistakes in Horizon Europe project websites | TechPi',
      description:
        'Three recurring mistakes in Horizon Europe project websites: one-off launch builds, overloaded homepages and hidden deliverables, and how to avoid each of them.',
    },
    source: `${legacy}common-mistakes-in-horizon-europe-project-websites`,
  },
  {
    slug: 'how-to-structure-deliverables-and-publications',
    category: 'Information architecture',
    title: 'How to structure deliverables and publications',
    lead: 'A scalable content model for organising deliverables, publications and outputs that grows naturally with the project.',
    published: '2025-07-18',
    publishedText: '18 July 2025',
    sections: [
      {
        heading: 'Start with the content model',
        paragraphs: ['Define the fields that every deliverable and publication needs before designing any page:'],
        list: ['Title', 'Work package', 'Type', 'Date', 'Authors', 'Partners', 'Abstract', 'File'],
        after: ['A consistent content model is what allows filtering, listing and reuse across the site to work.'],
      },
      {
        heading: 'Design for browsing, not just searching',
        paragraphs: [
          'Most visitors do not arrive knowing exactly what they want. Provide clear filters by work package, type and year, and surface the most recent and most downloaded items.',
        ],
      },
    ],
    related: ['what-every-eu-project-website-should-include', 'common-mistakes-in-horizon-europe-project-websites'],
    meta: {
      title: 'How to structure deliverables and publications | TechPi',
      description:
        'A scalable content model for EU project deliverables, publications and outputs: the fields to define first, and filters that help visitors browse the library.',
    },
    source: `${legacy}how-to-structure-deliverables-and-publications`,
  },
  {
    slug: 'accessibility-considerations-for-project-websites',
    category: 'Accessibility',
    title: 'Accessibility considerations for project websites',
    lead: 'What WCAG 2.2 AA means in practice for EU project websites, and where teams most often fall short.',
    published: '2025-06-09',
    publishedText: '9 June 2025',
    sections: [
      {
        heading: 'Accessibility is part of the brief',
        paragraphs: [
          'Treat accessibility as part of the original specification, not as a remediation effort before review. WCAG 2.2 AA is the realistic target for most publicly funded project websites.',
        ],
      },
      {
        heading: 'Where teams usually fall short',
        paragraphs: ['The same problems come up most often:'],
        list: [
          'Low-contrast colour palettes',
          'Missing focus states',
          'Inaccessible PDFs uploaded as deliverables',
          'Forms that cannot be completed with a keyboard',
        ],
      },
    ],
    related: ['what-communication-partners-should-ask-a-web-development-supplier', 'what-every-eu-project-website-should-include'],
    meta: {
      title: 'Accessibility considerations for project websites | TechPi',
      description:
        'What WCAG 2.2 AA means in practice for EU project websites, and the problems teams most often miss: contrast, focus states, inaccessible PDFs and keyboard forms.',
    },
    source: `${legacy}accessibility-considerations-for-project-websites`,
  },
  {
    slug: 'preparing-a-website-brief-during-the-proposal-stage',
    category: 'Proposals',
    title: 'Preparing a website brief during the proposal stage',
    lead: 'What to write into the proposal so that the project website can be planned, budgeted and built without surprises.',
    published: '2025-05-14',
    publishedText: '14 May 2025',
    sections: [
      {
        heading: 'Describe the website as a working tool',
        paragraphs: [
          'Describe what the website needs to do, not just what it should contain. Listing the actions it supports leads to a more accurate scope and budget:',
        ],
        list: ['Share news', 'Host deliverables', 'Register for events', 'Communicate results'],
      },
    ],
    related: ['what-every-eu-project-website-should-include', 'what-communication-partners-should-ask-a-web-development-supplier'],
    meta: {
      title: 'Preparing a website brief during the proposal stage | TechPi',
      description:
        'What to write into an EU project proposal so the project website can be planned, budgeted and built without surprises: describe the actions it must support.',
    },
    source: `${legacy}preparing-a-website-brief-during-the-proposal-stage`,
  },
  {
    slug: 'what-communication-partners-should-ask-a-web-development-supplier',
    category: 'Communication partners',
    title: 'What communication partners should ask a web development supplier',
    lead: 'A short list of questions that quickly separates a generic web supplier from one that can support EU project work.',
    published: '2025-04-22',
    publishedText: '22 April 2025',
    sections: [
      {
        heading: 'Process and communication',
        list: [
          'How do they handle change requests during the project lifecycle?',
          'Who is the actual point of contact?',
          'How quickly can they respond when a deliverable goes live?',
        ],
      },
      {
        heading: 'Architecture and accessibility',
        list: [
          'What is their approach to information architecture, accessibility and long-term maintenance?',
          'Can they describe the content model they would propose for deliverables, news and events?',
        ],
      },
    ],
    related: ['preparing-a-website-brief-during-the-proposal-stage', 'accessibility-considerations-for-project-websites', 'how-to-structure-deliverables-and-publications'],
    meta: {
      title: 'What communication partners should ask a web supplier | TechPi',
      description:
        'Questions for communication partners choosing a web development supplier for EU project work: change requests, contact, response times, architecture and accessibility.',
    },
    source: `${legacy}what-communication-partners-should-ask-a-web-development-supplier`,
  },
  {
    slug: 'how-analytics-can-support-dissemination-reporting',
    category: 'Analytics',
    title: 'How analytics can support dissemination reporting',
    lead: 'Using web analytics to produce credible, useful evidence for communication and dissemination KPIs.',
    published: '2025-03-30',
    publishedText: '30 March 2025',
    sections: [
      {
        heading: 'Tie metrics to objectives',
        paragraphs: [
          'Generic traffic numbers rarely satisfy a project officer. Tie metrics directly to the communication and dissemination objectives in the proposal, and report against them consistently.',
        ],
      },
    ],
    // The article is about measuring a project's own website. It says nothing about techpi.eu, which uses no analytics.
    note: 'This article is about measuring an EU project’s website. techpi.eu itself uses no analytics or tracking: see the [Cookies Policy](/cookies).',
    related: ['what-every-eu-project-website-should-include', 'how-to-structure-deliverables-and-publications'],
    meta: {
      title: 'How analytics can support dissemination reporting | TechPi',
      description:
        'Using web analytics to produce credible evidence for EU project communication and dissemination KPIs, tied to the objectives set out in the proposal.',
    },
    source: `${legacy}how-analytics-can-support-dissemination-reporting`,
  },
];

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
