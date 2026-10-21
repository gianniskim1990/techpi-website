import type { Locale } from '../i18n/locales';
import { copyOf, pageDocs } from './pages-content';

/**
 * EU-funded projects: one specialist market within TechPi. Copy for the homepage teaser (home/EuProjects.astro) and
 * the full page (pages/EuProjectsPage.astro), in English and Greek.
 *
 * Source: the services, lifecycle, platform types, partner offer, process and programme references publicly described
 * on the user's own site, pigiota314.eu (/, /eu-project-websites, /digital-platforms, /communication-partners),
 * approved 2026-10-08 as a source. Adapted into TechPi's voice; not copied.
 *
 * Deliberately NOT carried over or claimed:
 *   - any specific EU project, case study, partner, result, or anonymised "experience" item
 *   - work under a specific programme: programmes are named as the kinds of projects the approach is built for
 *   - a guaranteed accessibility level: "designed with WCAG 2.2 AA requirements in mind" (the source's "baseline"
 *     wording waits for the launch copy review)
 *   - any delivery time (the source's "six to ten weeks"), budget or proposal outcome
 *   - procurement or legal arrangements; certifications; SOWISE+ (never mentioned)
 */

interface Item {
  name: string;
  text: string;
}

export interface EuCopy {
  home: { label: string; heading: string; text: string; cta: string; items: readonly string[] };
  page: {
    hero: { heading: string; lead: string; context: string; cta: string };
    infra: { heading: string; text: string; supportLabel: string; support: readonly string[]; audience: string };
    lifecycle: { label: string; heading: string; stages: readonly Item[] };
    websites: {
      heading: string;
      intro: string;
      structureHeading: string;
      structureText: string;
      modelRoot: string;
      model: readonly string[];
      groups: readonly { name: string; items: readonly string[] }[];
    };
    platforms: { heading: string; text: string; items: readonly Item[]; principlesLabel: string; principles: readonly Item[] };
    partners: {
      label: string;
      heading: string;
      text: string;
      whoLabel: string;
      who: readonly string[];
      offerLabel: string;
      offer: readonly Item[];
      cta: string;
    };
    programmes: { heading: string; text: string; list: readonly string[]; also: string; disclaimer: string };
    priorities: { heading: string; items: readonly Item[] };
    process: { heading: string; intro: string; steps: readonly Item[] };
    before: { heading: string; text: string; items: readonly string[]; note: string };
    after: { heading: string; text: string; items: readonly string[] };
    closer: { heading: string; text: string; cta: string };
  };
}

/**
 * Since Task M3 the text lives in the page files, edited through the admin: the full page in
 * content/pages/eu-projects/index.json, the homepage teaser as "euTeaser" in content/pages/home/index.json. The
 * non-endorsement disclaimer under the programmes is locked there.
 */
const fromFiles = (locale: Locale): EuCopy => ({
  home: pageDocs.home[locale].euTeaser as EuCopy['home'],
  page: copyOf<EuCopy['page']>('euProjects', locale),
});
const en: EuCopy = fromFiles('en');
const el: EuCopy = fromFiles('el');

export const euCopy: Record<Locale, EuCopy> = { en, el };
