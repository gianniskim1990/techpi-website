/**
 * The intro's symbol image, shared by the intro (src/components/home/Intro.astro) and the homepage head script in
 * BaseLayout, which preloads exactly this image when, and only when, the intro will play.
 */
export { default as introSymbol } from '../../assets/brand/techpi-symbol-white.png';

/** The symbol is 74% of the intro's circle: min(78vw, 64svh, 580px), and min(84vw, 50svh, 380px) on phones. */
export const introSymbolSizes = '(max-width: 760px) min(62vw, 282px), min(57.7vw, 47.4svh, 429px)';
export const introSymbolWidths = [320, 480, 640];
