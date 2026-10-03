import type { CapabilityId } from './capabilities';

/**
 * The single source of truth for the three current projects. The homepage and the Work index read from here.
 * English text, from the approved homepage. Greek arrives in Phase 3D.
 *
 * Only confirmed facts are stored. Everything else a case study needs (purpose, scope, role, technology, year,
 * imagery, URL, outcomes, EU data) is deliberately absent: see docs/production/phase-3c-implementation-brief.md.
 * No field exists for metrics or results.
 *
 * `capabilities` holds ONLY the four capability ids. Other classification is `context`, kept separate, because
 * something like "EU projects" is not a TechPi capability.
 */
export interface Project {
  /** Stable, Latin, lower case. Matches docs/production/routes.md. Not used as a link target until 3C.2. */
  slug: string;
  name: string;
  /** Large faint word on the neutral media placeholder, where the full name is too long. */
  wordmark?: string;
  category: string;
  summary: string;
  capabilities: readonly CapabilityId[];
  /** Additional classification that is not a capability, for example the funding context. */
  context?: readonly string[];
  /**
   * False until TechPi confirms the capability assignment for this project. Unconfirmed values are kept for
   * design continuity on the homepage (where they were approved at Gate B), and are not shown anywhere new.
   */
  capabilitiesConfirmed: boolean;
}

export const projects: readonly Project[] = [
  {
    slug: 'cairelink',
    name: 'cAIrelink',
    category: 'Healthcare platform',
    summary: 'A custom web application for healthcare.',
    capabilities: ['digital-products', 'intelligence'],
    capabilitiesConfirmed: false,
  },
  {
    slug: 'armans',
    name: 'Arman’s Ethnic Street Food',
    wordmark: 'Arman’s',
    category: 'Direct ordering platform',
    summary: 'A platform that lets the restaurant take orders directly from its customers.',
    capabilities: ['digital-products', 'web-experiences'],
    capabilitiesConfirmed: false,
  },
  {
    slug: 'sowise-plus',
    name: 'SOWISE+',
    category: 'EU-funded digital platform',
    summary: 'The digital platform of an EU-funded project.',
    capabilities: ['web-experiences'],
    context: ['EU projects'],
    capabilitiesConfirmed: false,
  },
];
