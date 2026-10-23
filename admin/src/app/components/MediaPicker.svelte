<script>
  /**
   * "Choose from the library" in the image dialogs of new case studies and articles (Task M8): every image a page may
   * use (library uploads, also those still in the library's draft, and other entries' images), searchable. Picking one
   * calls `onpick(item)`; the dialog then saves a reference to it (worker/images.js `use`), not a copy.
   */
  import { untrack } from 'svelte';
  import Icon from './Icon.svelte';
  import MediaGrid from './MediaGrid.svelte';
  import { library, loadLibrary } from '../lib/media.svelte.js';

  let { selected = null, onpick } = $props();
  $effect(() => { untrack(loadLibrary); });
  let q = $state('');
  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    return library.items.filter((it) => it.status !== 'removing' && (!term || [it.title, it.id, it.alt?.en, it.alt?.el].some((v) => v?.toLowerCase().includes(term))));
  });
</script>

<div class="picker">
  <label class="search">
    <Icon name="search" size={15} />
    <span class="visually-hidden">Search the library</span>
    <input type="search" placeholder="Search the library…" bind:value={q} />
  </label>
  {#if library.loading && !library.loaded}
    <p class="hint" aria-live="polite">Loading the library from GitHub…</p>
  {:else if library.error && !library.loaded}
    <p class="error-text" role="alert">{library.error} <button class="btn btn-ghost btn-sm" type="button" onclick={loadLibrary}>Try again</button></p>
  {:else if rows.length}
    <div class="scroll"><MediaGrid items={rows} {selected} onselect={onpick} compact label="Library images" /></div>
  {:else}
    <p class="hint">{library.items.length ? 'No images match.' : 'The library is empty.'} Upload images on the <a href="#/media">Media</a> page, or upload a file here instead.</p>
  {/if}
</div>

<style>
  .picker { display: grid; gap: 10px; }
  .search { display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); color: var(--slate); }
  .search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .search input { border: 0; outline: none; background: transparent; flex: 1; padding: 7px 0; font-size: var(--text-base); color: var(--ink); min-width: 0; }
  .scroll { max-height: 340px; overflow-y: auto; padding: 2px; }
</style>
