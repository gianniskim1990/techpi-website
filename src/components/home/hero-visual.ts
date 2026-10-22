/**
 * The homepage hero's visual (src/components/home/Hero.astro): one real photograph in the corner the hero arc opens,
 * clipped by that arc, with a slow reveal on load and a small depth shift on scroll. There is one photograph per
 * language, chosen at build time from the page's `locale` (never from the referrer, the browser's language or a
 * redirect), so each homepage is plain static HTML:
 *
 *   en  EU projects, European research and innovation  -> src/assets/hero/hero-en.jpg
 *   el  websites, web applications and digital solutions -> src/assets/hero/hero-el.jpg
 *
 * Both are free to use under the Unsplash License (commercial use, no attribution required). Sources, licences,
 * the edits made and how to replace them: docs/design/hero-visual/SOURCES.md. To replace one, overwrite its file
 * (a landscape photograph at least 1920 px wide) and, if the important part moves, adjust its `focus`.
 *
 * Both images are decorative (empty alt text): the headline already says everything.
 */
import type { ImageMetadata } from 'astro';
import type { Locale } from '../../i18n/locales';
import heroEn from '../../assets/hero/hero-en.jpg';
import heroEl from '../../assets/hero/hero-el.jpg';

export interface HeroVisual {
  image: ImageMetadata;
  /** CSS `object-position`: which part of the photograph stays in view when the panel crops it. */
  focus: string;
}

export const heroVisuals: Record<Locale, HeroVisual> = {
  // A research laboratory bench at Trnava University (Slovakia): the incubators, the shelves and the microscope.
  en: { image: heroEn, focus: '62% 50%' },
  // A software developer's monitor with code, in blue light: the editor window.
  el: { image: heroEl, focus: '46% 50%' },
};
