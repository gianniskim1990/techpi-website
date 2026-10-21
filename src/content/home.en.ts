import { copyOf } from './pages-content';

/**
 * English homepage copy. Since Task M3 the text lives in content/pages/home/index.json ("en"), edited through the
 * admin, together with the homepage's search title and description and the EU Projects teaser (which eu.ts reads).
 * Components take this object as a prop; the Greek homepage (home.el.ts) is a second object of the same type.
 *
 * Project and capability data live in projects.ts and capabilities.ts, shared with the Work and Capabilities pages.
 * Nothing in the copy states a metric, an outcome or a technology that is not confirmed.
 */
export interface HomeCopy {
  /** The one line under the symbol in the homepage intro (Intro.astro). Decorative: the same words are the hero meta. */
  intro: { line: string };
  hero: {
    meta: string;
    /** Display lines, per language: Greek breaks differently. */
    statement: readonly string[];
    support: readonly string[];
    start: string;
    work: string;
    /** The transformation map above the headline. Short labels, not claims. */
    map: {
      label: string; from: string; to: string; websites: string; ordering: string; visibility: string;
      automation: string; ai: string; systems: string; products: string;
    };
  };
  statement: { heading: string; steps: readonly { step: string; title: string; text: string }[] };
  work: { heading: string; label: string; all: string; caseLink: string; factsLabel: string };
  capabilities: { heading: string };
  intelligence: { heading: readonly string[]; lead: string; areas: readonly { title: string; text: string }[] };
  evolution: { heading: string; lead: string; text: string; link: string };
  contact: { heading: readonly string[]; cta: string; region: string };
}

export const homeEn: HomeCopy = copyOf<HomeCopy>('home', 'en', 'euTeaser');
