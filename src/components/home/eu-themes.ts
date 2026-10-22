/**
 * The six thematic areas shown in the English homepage hero (src/components/home/EuHeroGrid.astro): the kinds of EU-funded
 * projects TechPi builds digital solutions for. Each has one real photograph, stored in src/assets/hero/ and licensed under
 * the Unsplash License (sources, photographers, dates, licence and the crops made: docs/design/hero-visual/SOURCES.md).
 *
 * The names are the thematic clusters under which European research and innovation work is commonly grouped. They name a kind
 * of work, not a programme: nothing here says or implies that TechPi works under, or is endorsed by, any EU programme
 * (src/content/eu.ts lists what must never be claimed).
 *
 * To replace a photograph, overwrite its file (3:2, at least 1800 px wide) and, if the subject moves, adjust its `focus`
 * (CSS `object-position`).
 */
import type { ImageMetadata } from 'astro';
import health from '../../assets/hero/eu-health.jpg';
import culture from '../../assets/hero/eu-culture.jpg';
import security from '../../assets/hero/eu-security.jpg';
import digital from '../../assets/hero/eu-digital.jpg';
import climate from '../../assets/hero/eu-climate.jpg';
import food from '../../assets/hero/eu-food.jpg';

export interface EuTheme {
  key: string;
  /** The full name of the area: read by assistive technology and shown when a tile is hovered. */
  name: string;
  /** The short name shown on the tile. */
  label: string;
  image: ImageMetadata;
  /** CSS `object-position` of the photograph inside its tile. */
  focus: string;
}

export const euThemes: readonly EuTheme[] = [
  { key: 'health', name: 'Health', label: 'Health', image: health, focus: '30% 50%' },
  { key: 'culture', name: 'Culture, Creativity and Inclusive Society', label: 'Culture & Inclusive Society', image: culture, focus: '50% 40%' },
  { key: 'security', name: 'Civil Security for Society', label: 'Civil Security', image: security, focus: '60% 45%' },
  { key: 'digital', name: 'Digital, Industry and Space', label: 'Digital, Industry & Space', image: digital, focus: '50% 50%' },
  { key: 'climate', name: 'Climate, Energy and Mobility', label: 'Climate, Energy & Mobility', image: climate, focus: '62% 50%' },
  { key: 'food', name: 'Food, Bioeconomy, Natural Resources, Agriculture and Environment', label: 'Food & Natural Resources', image: food, focus: '50% 50%' },
] as const;
