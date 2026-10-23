import type { ManagedCaseStudy } from './case-study-loader';

/**
 * Every case study, managed in the admin: one file each, content/case-studies/<slug>/index.json. Since Task M5 the list is
 * read from that folder at build time, so a case study created in the admin is published by merging its draft pull
 * request, with no code change. Every file is validated on every build (case-study-loader.ts), so an invalid or
 * half-finished file fails the build instead of reaching the site.
 * The order here does not matter: the Work-page order is each file's locked `facts.order`.
 */
const files = import.meta.glob<{ default: unknown }>('../../content/case-studies/*/index.json', { eager: true });

export const managedCaseStudies: readonly { slug: string; doc: ManagedCaseStudy }[] = Object.entries(files)
  .map(([file, mod]) => ({ slug: file.split('/').at(-2) as string, doc: mod.default as ManagedCaseStudy }))
  .sort((a, b) => a.slug.localeCompare(b.slug));
