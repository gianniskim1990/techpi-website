import { contactFacts } from '../content/site';
import type { Locale } from '../i18n/locales';

/**
 * JSON-LD for every content page, built at build time and written into the HTML. No client script, no library.
 * Conservative by rule (docs/production/seo.md): only facts the site itself publishes. Never reviews, ratings,
 * awards, founding dates, employee counts, sameAs profiles, a SearchAction or an FAQ.
 *
 * Stable identifiers: the Organization and the WebSite have one @id each for the whole site. Every other node is
 * scoped to its page's canonical URL (`<canonical>#webpage`, `<canonical>#breadcrumb`, `<canonical>#service-…`).
 */
export const SITE = 'https://techpi.eu/';
export const ORGANIZATION_ID = `${SITE}#organization`;
export const WEBSITE_ID = `${SITE}#website`;

type Node = Record<string, unknown>;

/**
 * TechPi itself. The town is published on the Contact page; the street address and legal details are not confirmed.
 * `alternateName`: the former name, stated on every page ("TechPi, formerly pigiota314") and on About.
 */
export function organization(): Node {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'TechPi',
    alternateName: 'pigiota314',
    url: SITE,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE}#logo`,
      url: `${SITE}techpi-logo.png`,
      contentUrl: `${SITE}techpi-logo.png`,
      width: 512,
      height: 512,
      caption: 'TechPi',
    },
    image: { '@id': `${SITE}#logo` },
    email: contactFacts.email,
    telephone: contactFacts.phoneDisplay,
    address: { '@type': 'PostalAddress', addressLocality: 'Xanthi', addressCountry: 'GR' },
  };
}

export function website(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE,
    name: 'TechPi',
    inLanguage: ['en', 'el'],
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** The schema.org page type that matches what a page is. */
export type WebPageType = 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage';

export function webPage(opts: {
  type: WebPageType;
  url: string;
  name: string;
  description?: string;
  locale: Locale;
  breadcrumb?: boolean;
  /** The homepage and the About page are about TechPi itself. */
  aboutOrganization?: boolean;
}): Node {
  return {
    '@type': opts.type,
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    inLanguage: opts.locale,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    ...(opts.aboutOrganization ? { about: { '@id': ORGANIZATION_ID } } : {}),
    ...(opts.breadcrumb ? { breadcrumb: { '@id': `${opts.url}#breadcrumb` } } : {}),
  };
}

/** A trail that matches the real hierarchy of the site (Home, Work, a case study). Names are the visible labels. */
export function breadcrumb(pageUrl: string, items: readonly { name: string; url: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  };
}

/** A service the page describes, provided by TechPi. Name and description are the page's own visible text. */
export function service(pageUrl: string, opts: { id: string; name: string; description: string; locale: Locale }): Node {
  return {
    '@type': 'Service',
    '@id': `${pageUrl}#service-${opts.id}`,
    name: opts.name,
    description: opts.description,
    serviceType: opts.name,
    inLanguage: opts.locale,
    provider: { '@id': ORGANIZATION_ID },
    url: pageUrl,
  };
}

/** Serialised for a `<script type="application/ld+json">`. `<` is escaped so no string can close the element. */
export function serialise(nodes: readonly Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
