/**
 * The connected case studies' status, from GET /api/case-studies: which ones have an open draft pull request. Shared by
 * the Case studies list and the Dashboard, and refreshed after a save. Without the Worker (plain `vite` dev) it stays
 * empty and those screens fall back to the read-only snapshot.
 */
import { api } from './api.js';

export const caseStudies = $state({ loaded: false, loading: false, error: null, entries: [] });

export const draftOf = (slug) => caseStudies.entries.find((e) => e.slug === slug)?.draft ?? null;

export async function loadCaseStudies() {
  if (caseStudies.loading) return;
  caseStudies.loading = true;
  try {
    const r = await api.listCaseStudies();
    caseStudies.entries = r.entries;
    caseStudies.error = null;
    caseStudies.loaded = true;
  } catch (e) {
    caseStudies.error = e.message;
  } finally {
    caseStudies.loading = false;
  }
}
