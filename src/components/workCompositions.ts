import type { Locale } from '../i18n/locales';

/**
 * How each featured project is composed on the homepage. Presentation only, never content: which real capture is
 * shown, which part of it is kept (fractions of the image: left, top, width, height), and a short caption naming
 * what the crop shows. Each project gets its own rhythm so the three never read as one template:
 *
 *   layered   an interface fragment at large scale, with a second real screen laid over its corner
 *   bleed     the capture runs off the right edge of the page; a detail of a second screen sits under the text
 *   band      one capture as a full-width strip, the text below it in a single compact row
 *
 * A featured project that is not listed here falls back to `bleed` with its main image whole.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export interface Composition {
  layout: 'layered' | 'bleed' | 'band';
  main: { crop?: Rect; small?: Rect; caption: Record<Locale, string> };
  /** The case-study cover: the main capture cropped to a wide band, shown edge to edge. */
  cover?: Rect;
  /** The Work index thumbnail: a 3:2 crop of the main capture. */
  thumb?: Rect;
  /** A second real capture from the project's case study gallery (index into it). */
  detail?: { index: number; crop?: Rect; caption: Record<Locale, string> };
}

export const compositions: Record<string, Composition> = {
  rocketeer: {
    layout: 'layered',
    thumb: { x: 0.455, y: 0, w: 0.3, h: 0.533 },
    cover: { x: 0.405, y: 0, w: 0.535, h: 0.5 },
    main: {
      crop: { x: 0.405, y: 0, w: 0.535, h: 0.5 },
      small: { x: 0.455, y: 0, w: 0.345, h: 0.48 },
      caption: { en: 'Administration dashboard', el: 'Πίνακας διαχείρισης' },
    },
    detail: {
      index: 0,
      crop: { x: 0.246, y: 0.147, w: 0.535, h: 0.659 },
      caption: { en: 'Sign-in', el: 'Σύνδεση' },
    },
  },
  armans: {
    layout: 'bleed',
    thumb: { x: 0.05, y: 0.14, w: 0.9, h: 0.716 },
    cover: { x: 0, y: 0.06, w: 1, h: 0.62 },
    main: { caption: { en: 'The website on laptop, tablet and phone', el: 'Η ιστοσελίδα σε υπολογιστή, tablet και κινητό' } },
    detail: {
      index: 0,
      crop: { x: 0.234, y: 0.087, w: 0.526, h: 0.308 },
      caption: { en: 'Management area', el: 'Περιβάλλον διαχείρισης' },
    },
  },
  'logotherapia-xanthi': {
    layout: 'band',
    thumb: { x: 0.25, y: 0, w: 0.5, h: 0.533 },
    cover: { x: 0, y: 0, w: 1, h: 0.62 },
    main: {
      crop: { x: 0, y: 0, w: 1, h: 0.47 },
      small: { x: 0.2, y: 0.1, w: 0.56, h: 0.4 },
      caption: { en: 'Website: services', el: 'Ιστοσελίδα: υπηρεσίες' },
    },
  },
};
