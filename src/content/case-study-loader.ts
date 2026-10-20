import type { ImageMetadata } from 'astro';
import type { Project, ProjectImage } from './projects';
import type { ProjectTextEl } from './projects.el';
import { validateDocument } from '../../admin/shared/case-study-content.js';

/**
 * Builds a project from a case study the admin manages (content/case-studies/<slug>/index.json; Task M1A).
 * The file holds the text of both languages plus the locked facts; the images stay in src/assets/projects and are
 * referenced by id. The file is validated on every build, so an invalid draft fails the build instead of reaching the
 * site. The result has exactly the shape of a hand-written entry in projects.ts and projects.el.ts: pages are unchanged.
 */
export interface ManagedCaseStudy {
  facts: {
    slug: string; name: string; client: string; year: number; liveUrl: string; workGroup: 'client' | 'earlier';
    featured: boolean; order: number; capabilities: Project['capabilities']; source: string;
  };
  images: {
    image: { id: string; width: number; height: number };
    cover: { id: string; width: number; height: number };
    gallery: { id: string; width: number; height: number }[];
  };
  en: ManagedText;
  el: ManagedText;
}
interface ManagedText {
  category: string; summary: string; imageAlt: string; coverAlt: string; galleryAlts: string[];
  overview: string[]; need: string[]; builtIntro?: string; builtItems: string[]; technology: string[]; outcome: string[];
}
/** The image files the loader may reference: id → imported file (the declared size is checked by scripts/assets). */
export type ImageRegistry = Record<string, ImageMetadata>;

export function assertValid(doc: ManagedCaseStudy): ManagedCaseStudy {
  const result = validateDocument(doc, doc.facts?.slug);
  if (!result.ok) throw new Error(`Invalid managed case study "${doc.facts?.slug}":\n  ${result.problems.join('\n  ')}`);
  return doc;
}

const image = (ref: { id: string; width: number; height: number }, registry: ImageRegistry, alt: string, slug: string): ProjectImage => {
  const src = registry[ref.id];
  if (!src) throw new Error(`Managed case study "${slug}" uses an unknown image: ${ref.id}`);
  return { src, width: ref.width, height: ref.height, alt };
};

/** The English project (shared facts and English text). */
export function projectFrom(doc: ManagedCaseStudy, registry: ImageRegistry): Project {
  const { facts, images, en } = assertValid(doc);
  return {
    slug: facts.slug,
    workGroup: facts.workGroup,
    name: facts.name,
    category: en.category,
    summary: en.summary,
    capabilities: facts.capabilities,
    featured: facts.featured,
    source: facts.source,
    image: image(images.image, registry, en.imageAlt, facts.slug),
    caseStudy: {
      client: facts.client,
      year: facts.year,
      liveUrl: facts.liveUrl,
      overview: en.overview,
      need: en.need,
      built: { ...(en.builtIntro !== undefined ? { intro: en.builtIntro } : {}), items: en.builtItems },
      technology: en.technology,
      outcome: en.outcome,
      cover: image(images.cover, registry, en.coverAlt, facts.slug),
      gallery: images.gallery.map((g, i) => image(g, registry, en.galleryAlts[i] as string, facts.slug)),
    },
  };
}

/** The Greek text, in the shape projects.el.ts uses. */
export function textElFrom(doc: ManagedCaseStudy): ProjectTextEl {
  const { el } = assertValid(doc);
  return {
    category: el.category,
    summary: el.summary,
    imageAlt: el.imageAlt,
    caseStudy: {
      overview: el.overview,
      need: el.need,
      built: { ...(el.builtIntro !== undefined ? { intro: el.builtIntro } : {}), items: el.builtItems },
      technology: el.technology,
      outcome: el.outcome,
      coverAlt: el.coverAlt,
      galleryAlts: el.galleryAlts,
    },
  };
}
