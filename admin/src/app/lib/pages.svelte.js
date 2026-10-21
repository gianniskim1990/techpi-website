/**
 * The connected website pages' status, from GET /api/pages: names, URLs and which ones have an open draft pull
 * request. Shared by the Website pages list and the Dashboard, refreshed after a save and whenever those screens open.
 * Without the Worker (plain `vite` dev) it stays empty and the Website pages section shows what it cannot load.
 */
import { api } from './api.js';

export const pages = $state({ loaded: false, loading: false, error: null, entries: [] });

export const pageDraftOf = (key) => pages.entries.find((e) => e.slug === key)?.draft ?? null;

export async function loadPages() {
  if (pages.loading) return;
  pages.loading = true;
  try {
    const r = await api.listPages();
    pages.entries = r.entries;
    pages.error = null;
    pages.loaded = true;
  } catch (e) {
    pages.error = e.message;
  } finally {
    pages.loading = false;
  }
}
