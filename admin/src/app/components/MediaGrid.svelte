<script>
  /**
   * A grid of media library images (Task M8): the Media page and the "Choose from the library" pickers. Each tile is a
   * button; `selected` marks the chosen one. Small copies load a few at a time (lib/media.svelte.js).
   */
  import Icon from './Icon.svelte';
  import { thumbs, wantThumb, STATUS, statusOf } from '../lib/media.svelte.js';

  let { items, selected = null, onselect, label = 'Images', compact = false } = $props();
  $effect(() => { for (const it of items) wantThumb(it.thumb); });
  const metaOf = (it) => {
    const size = it.width && it.height ? `${it.width} × ${it.height}` : it.ext.toUpperCase();
    const n = it.usedBy.length;
    return n ? `${size} · used ${n === 1 ? 'once' : `${n} times`}` : it.library ? `${size} · not used` : size;
  };
</script>

<ul class="grid" class:compact aria-label={label}>
  {#each items as it (it.id)}
    {@const st = statusOf(it)}
    <li>
      <button type="button" class="tile" class:on={selected === it.id} aria-pressed={selected === it.id} onclick={() => onselect?.(it)}>
        <span class="pic">
          {#if thumbs[it.thumb]}<img src={thumbs[it.thumb]} alt="" />{:else}<span class="ph" aria-hidden="true"><Icon name="media" size={20} /></span>{/if}
          {#if st}<span class="tag {st}" title={STATUS[st].hint}>{STATUS[st].label}</span>{/if}
          {#if selected === it.id}<span class="tick" aria-hidden="true"><Icon name="check" size={14} /></span>{/if}
        </span>
        <span class="name">{it.title}</span>
        <span class="meta">{metaOf(it)}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 14px; }
  .grid.compact { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 10px; }
  .tile { display: grid; gap: 3px; width: 100%; padding: 6px; border: 1px solid transparent; border-radius: var(--radius-lg); background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
  .tile:hover { background: var(--white); border-color: var(--rule-soft); }
  .tile.on { border-color: var(--blue); background: var(--blue-soft); box-shadow: 0 0 0 1px var(--blue); }
  .pic { position: relative; display: block; }
  .pic img, .ph { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius); background: var(--rule-soft); }
  .ph { display: grid; place-items: center; color: var(--slate); }
  .tag { position: absolute; left: 6px; top: 6px; padding: 0 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; color: var(--ink); background: var(--cyan); }
  .tag.removing { background: var(--danger-soft); color: var(--danger); }
  .tag.edited { background: var(--blue-soft); color: var(--blue); }
  .tick { position: absolute; right: 6px; top: 6px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--blue); color: var(--white); }
  .name { font-weight: 500; font-size: var(--text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 4px; }
  .meta { color: var(--slate); font-size: var(--text-xs); }
  @media (max-width: 640px) { .grid, .grid.compact { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } }
</style>
