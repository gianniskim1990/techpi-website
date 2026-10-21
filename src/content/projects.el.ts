/**
 * Greek editorial copy for the v1 portfolio (Phase 3D), in the shape projects.ts merges in toGreek(). Since Task M1B the
 * text lives in the "el" part of each content/case-studies/<slug>/index.json and is edited through the admin. Facts
 * (names, capabilities, media, years, URLs) are shared; project, brand and technology names are not translated.
 */

import { textElFrom } from './case-study-loader';
import { managedCaseStudies } from './case-studies';

export interface ProjectTextEl {
  category: string;
  summary: string;
  highlights?: readonly string[];
  disciplines?: readonly string[];
  /** Alt text for the project's row and homepage image. */
  imageAlt?: string;
  caseStudy?: {
    client?: string;
    overview: readonly string[];
    need: readonly string[];
    built: { intro?: string; items?: readonly string[] };
    services?: readonly string[];
    technology?: readonly string[];
    outcome?: readonly string[];
    /** Required when the English case study has a cover. */
    coverAlt?: string;
    coverCaption?: string;
    /** In the same order as the English gallery. */
    galleryAlts?: readonly string[];
  };
}

/** The Greek text of every project, from its content file (content/case-studies/<slug>/index.json). */
export const projectsEl: Record<string, ProjectTextEl> = Object.fromEntries(
  managedCaseStudies.map((x) => [x.slug, textElFrom(x.doc, x.slug)]),
);
