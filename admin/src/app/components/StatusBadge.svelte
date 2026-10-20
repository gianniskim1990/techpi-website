<script>
  let { status } = $props();
  const labels = { published: 'Published', draft: 'Draft', changes: 'Unpublished changes' };
</script>

<span class="badge {status}"><span class="dot" aria-hidden="true"></span>{labels[status] ?? status}</span>

<style>
  .badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px 2px 8px; border-radius: 999px;
    font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.01em; white-space: nowrap;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .published { background: var(--ok-soft); color: var(--ok); }
  .draft { background: var(--warn-soft); color: var(--warn); }
  .changes { background: var(--blue-soft); color: var(--blue); }
</style>
