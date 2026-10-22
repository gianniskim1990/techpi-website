/**
 * The homepage hero's photograph (src/components/home/Hero.astro): one real photograph in the corner the hero arc opens,
 * clipped by that arc, with a slow reveal on load and a small depth shift on scroll. It is chosen at build time from the
 * page's `locale` (never from the referrer, the browser's language or a redirect), so each homepage is plain static HTML.
 *
 *   el  websites, web applications and digital solutions -> src/assets/hero/hero-el.jpg
 *   en  no photograph: the English homepage shows the EU projects panel (src/components/home/EuHeroPanel.astro), an
 *       illustration of a project website with a line and a call to action, because a cropped laboratory photograph did
 *       not say what TechPi offers EU-funded projects.
 *
 * The Greek photograph is free to use under the Unsplash License (sources, licence and the edit made:
 * docs/design/hero-visual/SOURCES.md). To replace it, overwrite its file (a landscape photograph at least 1920 px wide)
 * and, if the important part moves, adjust its `focus`. It is decorative (empty alt text).
 */
import type { ImageMetadata } from 'astro';
import type { Locale } from '../../i18n/locales';
import heroEl from '../../assets/hero/hero-el.jpg';

export interface HeroVisual {
  image: ImageMetadata;
  /** CSS `object-position`: which part of the photograph stays in view when the panel crops it. */
  focus: string;
}

export const heroVisuals: Partial<Record<Locale, HeroVisual>> = {
  // A software developer's monitor with code, in blue light: the editor window.
  el: { image: heroEl, focus: '46% 50%' },
};
