<script>
  /** Approximate search-result preview: shows how the title and description are likely to be cut. */
  let { title, description, url } = $props();
  const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
</script>

<div class="snippet" aria-label="Search result preview">
  <div class="site"><span class="fav" aria-hidden="true">π</span><span>techpi.eu</span><span class="path">{url.replace('https://techpi.eu', '') || '/'}</span></div>
  <p class="t">{cut(title || 'Add an SEO title', 60)}</p>
  <p class="d">{cut(description || 'Add a meta description: one or two sentences saying what the page shows.', 160)}</p>
</div>

<style>
  .snippet { padding: 14px 16px; border: 1px solid var(--rule-soft); border-radius: var(--radius); background: var(--white); font-family: Arial, sans-serif; }
  .site { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #202124; }
  .fav { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--blue); color: var(--sheet); font-size: 11px; }
  .path { color: #4d5156; }
  .t { margin-top: 6px; color: #1a0dab; font-size: 18px; line-height: 1.3; }
  .d { margin-top: 3px; color: #4d5156; font-size: 13px; line-height: 1.55; }
</style>
