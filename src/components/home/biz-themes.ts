/**
 * The six service areas behind the Greek homepage hero (src/components/home/BizHeroBackdrop.astro): what Greek business
 * visitors come to TechPi for. Each has one real photograph, stored in src/assets/hero/ and licensed under the Unsplash
 * License (sources, photographers, dates, licence and the crops made: docs/design/hero-visual/SOURCES.md).
 *
 * The photographs are decorative background. They show tools and work (a laptop, a dashboard, a phone, a card payment, a
 * wireflow board, a flowchart), never a client, a brand or a result: nothing here claims that TechPi built any of what is
 * pictured. To replace one, overwrite its file (3:2, at least 1800 px wide) and, if the subject moves, adjust its `focus`
 * (CSS `object-position`). Where each one sits in the composition is in BizHeroBackdrop.astro (.ph-<key>).
 */
import type { ImageMetadata } from 'astro';
import website from '../../assets/hero/el-website.jpg';
import dashboard from '../../assets/hero/el-dashboard.jpg';
import design from '../../assets/hero/el-design.jpg';
import app from '../../assets/hero/el-app.jpg';
import store from '../../assets/hero/el-store.jpg';
import workflow from '../../assets/hero/el-workflow.jpg';

export interface BizTheme {
  key: 'website' | 'dashboard' | 'design' | 'app' | 'store' | 'workflow';
  /** The service area the photograph stands for (documentation only: the photographs are decorative). */
  area: string;
  image: ImageMetadata;
  /** CSS `object-position` of the photograph inside its layer. */
  focus: string;
}

export const bizThemes: readonly BizTheme[] = [
  { key: 'website', area: 'Websites, business software', image: website, focus: '50% 50%' },
  { key: 'dashboard', area: 'Dashboards and digital tools', image: dashboard, focus: '50% 50%' },
  { key: 'design', area: 'Web design and web applications', image: design, focus: '50% 45%' },
  { key: 'app', area: 'Mobile and web apps', image: app, focus: '45% 50%' },
  { key: 'store', area: 'Online stores', image: store, focus: '45% 55%' },
  { key: 'workflow', area: 'Automation and digital workflows', image: workflow, focus: '50% 50%' },
] as const;
