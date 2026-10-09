/**
 * English is the source of the dictionary shape. Greek (el.ts) must satisfy the same type,
 * so a missing or extra key is a type error found by `npm run check`.
 *
 * Phase 3A: shell labels only. Page copy arrives with the pages (3B, 3C, 3D).
 */
export const en = {
  site: {
    name: 'TECHPI',
    descriptor: 'Digital Products & Technology',
  },
  skipLink: 'Skip to content',
  nav: {
    label: 'Primary',
    work: 'Work',
    capabilities: 'Capabilities',
    euProjects: 'EU Projects',
    about: 'About',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
  },
  footer: {
    label: 'Footer',
    note: 'TechPi — the evolution of pigiota314.',
  },
  language: {
    label: 'Language',
    en: { short: 'EN', name: 'English' },
    el: { short: 'ΕΛ', name: 'Ελληνικά' },
  },
  /** The short name of each page (accessible names, breadcrumbs). Titles and descriptions: src/content/seo.ts. */
  pages: {
    home: { heading: 'Home' },
    work: { heading: 'Work' },
    capabilities: { heading: 'Capabilities' },
    euProjects: { heading: 'EU Projects' },
    about: { heading: 'About' },
    contact: { heading: 'Contact' },
  },
  notFound: {
    title: 'Page not found | TechPi',
    heading: 'Page not found',
    text: 'The page you are looking for does not exist.',
    home: 'Back to the homepage',
  },
};

export type Dictionary = typeof en;
