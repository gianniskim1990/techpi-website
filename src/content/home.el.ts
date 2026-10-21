import type { HomeCopy } from './home.en';
import { copyOf } from './pages-content';

/**
 * Greek homepage copy (Phase 3D), written in Greek from the approved English. Since Task M3 it lives in
 * content/pages/home/index.json ("el"), edited through the admin. Same shape as the English; display lines are stored
 * per language, because Greek breaks differently. No fact appears here that is not in the English.
 */
export const homeEl: HomeCopy = copyOf<HomeCopy>('home', 'el', 'euTeaser');
