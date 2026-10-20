import type { ImageMetadata } from 'astro';
import type { Project, ProjectImage } from './projects';
import type { ProjectTextEl } from './projects.el';
import { validateDocument } from '../../admin/shared/case-study-content.js';

/**
 * Builds projects from the case studies the admin manages (content/case-studies/<slug>/index.json; Tasks M1A and M1B).
 * Each file holds the text of both languages plus the locked facts and image references; the image files stay in
 * src/assets/projects and are referenced by id. Every file is validated on every build, so an invalid draft fails the
 * build instead of reaching the site. The result has exactly the shape the hand-written entries in projects.ts and
 * projects.el.ts had, including which optional parts are present: pages are unchanged.
 */
interface ImageRef { id: string; width: number; height: number }
export interface ManagedCaseStudy {
  facts: {
    slug: string; name: string; client?: string; clientEl?: string; year: number; liveUrl?: string;
    workGroup: Project['workGroup']; featured: boolean; order: number; capabilities: Project['capabilities']; source: string;
  };
  images: { image?: ImageRef; cover?: ImageRef; gallery?: ImageRef[] };
  en: ManagedText;
  el: ManagedText;
}
interface ManagedText {
  category: string; summary: string; highlights?: string[]; disciplines?: string[];
  imageAlt?: string; coverAlt?: string; coverCaption?: string; galleryAlts?: string[];
  overview: string[]; need: string[]; builtIntro?: string; builtItems?: string[];
  services?: string[]; technology?: string[]; outcome?: string[];
}
/** The image files the loader may reference: id → imported file (the declared size is checked by scripts/assets). */
export type ImageRegistry = Record<string, ImageMetadata>;

export function assertValid(doc: ManagedCaseStudy, slug: string): ManagedCaseStudy {
  const result = validateDocument(doc, slug);
  if (!result.ok) throw new Error(`Invalid case study content/case-studies/${slug}/index.json:\n  ${result.problems.join('\n  ')}`);
  return doc;
}

/** Only the keys that are present, so absent optional parts stay absent (as in the hand-written entries). */
const some = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

const image = (ref: ImageRef, registry: ImageRegistry, alt: string, slug: string, caption?: string): ProjectImage => {
  const src = registry[ref.id];
  if (!src) throw new Error(`Case study "${slug}" uses an unknown image: ${ref.id}`);
  return { src, width: ref.width, height: ref.height, alt, ...some({ caption }) };
};

/** The English project (shared facts and English text). */
export function projectFrom(doc: ManagedCaseStudy, slug: string, registry: ImageRegistry): Project {
  const { facts, images, en } = assertValid(doc, slug);
  return {
    slug: facts.slug,
    workGroup: facts.workGroup,
    name: facts.name,
    category: en.category,
    summary: en.summary,
    ...some({ highlights: en.highlights, disciplines: en.disciplines }),
    capabilities: facts.capabilities,
    featured: facts.featured,
    source: facts.source,
    ...(images.image ? { image: image(images.image, registry, en.imageAlt as string, slug) } : {}),
    caseStudy: {
      ...some({ client: facts.client }),
      year: facts.year,
      ...some({ liveUrl: facts.liveUrl }),
      overview: en.overview,
      need: en.need,
      built: some({ intro: en.builtIntro, items: en.builtItems }),
      ...some({ services: en.services, technology: en.technology, outcome: en.outcome }),
      ...(images.cover ? { cover: image(images.cover, registry, en.coverAlt as string, slug, en.coverCaption) } : {}),
      ...(images.gallery ? { gallery: images.gallery.map((g, i) => image(g, registry, en.galleryAlts?.[i] as string, slug)) } : {}),
    },
  };
}

/** The Greek text, in the shape projects.el.ts uses. */
export function textElFrom(doc: ManagedCaseStudy, slug: string): ProjectTextEl {
  const { facts, el } = assertValid(doc, slug);
  return {
    category: el.category,
    summary: el.summary,
    ...some({ highlights: el.highlights, disciplines: el.disciplines, imageAlt: el.imageAlt }),
    caseStudy: {
      ...some({ client: facts.clientEl }),
      overview: el.overview,
      need: el.need,
      built: some({ intro: el.builtIntro, items: el.builtItems }),
      ...some({ services: el.services, technology: el.technology, outcome: el.outcome }),
      ...some({ coverAlt: el.coverAlt, coverCaption: el.coverCaption, galleryAlts: el.galleryAlts }),
    },
  };
}
