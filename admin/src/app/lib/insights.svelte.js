/**
 * The connected Insights articles' status, from GET /api/insights: which ones have an open draft pull request. Shared by
 * the Articles list and the Dashboard, and refreshed after a save and whenever those screens open. Without the Worker
 * (plain `vite` dev) it stays empty and those screens fall back to the read-only snapshot.
 */
import { api } from './api.js';

export const insights = $state({ loaded: false, loading: false, error: null, entries: [] });

export const insightDraftOf = (slug) => insights.entries.find((e) => e.slug === slug)?.draft ?? null;

export async function loadInsights() {
  if (insights.loading) return;
  insights.loading = true;
  try {
    const r = await api.listInsights();
    insights.entries = r.entries;
    insights.error = null;
    insights.loaded = true;
  } catch (e) {
    insights.error = e.message;
  } finally {
    insights.loading = false;
  }
}
