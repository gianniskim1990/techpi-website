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
  },
  language: {
    label: 'Language',
    en: { short: 'EN', name: 'English' },
    el: { short: 'ΕΛ', name: 'Ελληνικά' },
  },
  /** Browser titles and the placeholder heading of each route shell. */
  pages: {
    home: { title: 'TechPi | Digital Products & Technology', heading: 'Home' },
    work: { title: 'Work | TechPi', heading: 'Work' },
    capabilities: { title: 'Capabilities | TechPi', heading: 'Capabilities' },
    euProjects: { title: 'EU Projects | TechPi', heading: 'EU Projects' },
    about: { title: 'About | TechPi', heading: 'About' },
    contact: { title: 'Contact | TechPi', heading: 'Contact' },
  },
  shell: {
    note: 'Route shell. A placeholder that tests routing. The page is not designed yet.',
  },
  notFound: {
    title: 'Page not found | TechPi',
    heading: 'Page not found',
    text: 'The page you are looking for does not exist.',
    home: 'Back to the homepage',
  },
};

export type Dictionary = typeof en;
