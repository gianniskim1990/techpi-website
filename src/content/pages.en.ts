import { copyOf } from './pages-content';

/**
 * English copy for the secondary pages. Since Task M3 the copy of the Work, Capabilities, About and Contact pages lives
 * in content/pages/<page>/index.json ("en"), edited through the admin, with each page's search title and description.
 * What stays here is shared by several pages: the case-study template labels and the closing line. Greek is in
 * pages.el.ts. Only confirmed facts appear in the copy; the contact values themselves (email, phone) live in site.ts.
 */
export interface WorkCopy {
  linkLabel: string;
  lead: string;
  groups: { client: { heading: string; description: string }; earlier: { heading: string; description: string } };
  highlightsLabel: string;
  disciplinesLabel: string;
  filterLabel: string;
  filterAll: string;
}
export interface CapabilitiesCopy { heading: string; lead: string; covers: string; indexLabel: string; seenIn: string }
export interface AboutCopy {
  heading: string;
  lead: string;
  changeHeading: string;
  stayed: { label: string; text: string };
  changed: { label: string; text: string };
  name: string;
  principlesHeading: string;
  /** The four approved principles. Only the first has supporting copy. */
  principles: readonly { heading: string; text?: string }[];
}
export interface ContactCopy {
  heading: string;
  lead: string;
  direct: string;
  email: string;
  phone: string;
  location: string;
  /** The town only. No street address is confirmed or shown. Locked in the admin. */
  locationValue: string;
}

export const pagesEn = {
  work: copyOf<WorkCopy>('work', 'en'),
  capabilities: copyOf<CapabilitiesCopy>('capabilities', 'en'),
  about: copyOf<AboutCopy>('about', 'en'),
  caseStudy: {
    back: 'Work',
    client: 'Client',
    year: 'Year',
    live: 'Live website',
    liveAria: 'opens the live website',
    overview: 'Overview',
    need: 'The business need',
    built: 'What we built',
    capabilities: 'Capabilities',
    technology: 'Technology',
    outcome: 'Outcome',
    next: 'Next project',
    solution: 'The solution',
    services: 'Scope',
    related: 'Related projects',
    context: 'Project context',
    earlierTag: 'Earlier work by pigiota314',
    earlier: 'This work belongs to the pigiota314 portfolio and is shown separately from TechPi’s current technology offering.',
  },
  contact: copyOf<ContactCopy>('contact', 'en'),
  /** The quiet closing line on secondary pages: the homepage question, without the Blue surface or the circle. */
  closer: {
    heading: 'Have something worth building?',
    cta: 'Start a project',
  },
};

export type PagesCopy = typeof pagesEn;
