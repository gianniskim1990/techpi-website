/**
 * The homepage hero's visual (src/components/home/Hero.astro): one real image in the corner the hero arc opens, clipped
 * by that arc, with a slow reveal on load and a small depth shift on scroll.
 *
 * TEMPORARY PLACEHOLDER: this is the Arman's devices capture, already used on the site. To replace it, overwrite
 * src/assets/hero/hero-visual.png (same file name, any size from 1200 px wide; a dark, calm, high-quality photograph or
 * product render works best) and set `heroVisualFocus` below to the part of the picture that must stay visible: the
 * panel shows a curved wedge about 660 px wide at the top and 200 px at the bottom on desktop, a wide band on phones.
 * The image is decorative (empty alt text): the headline already says everything.
 */
export { default as heroVisual } from '../../assets/hero/hero-visual.png';

/** CSS `object-position` of the picture inside its panel: which part stays in view when the panel crops it. */
export const heroVisualFocus = '58% 42%';
