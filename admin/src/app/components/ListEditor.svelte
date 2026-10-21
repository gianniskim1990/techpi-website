<script>
  /**
   * An ordered list of short texts: paragraphs (`multiline`) or bullet points. Add, remove and reorder; each item has its
   * own field so a mistake in one item is reported on that item. Plain text only: the website renders it as text.
   */
  import Icon from './Icon.svelte';

  let {
    items = $bindable([]), label, id, lang = undefined, multiline = false, itemMax, min = 1, max = 12,
    errors = {}, addLabel = 'Add item', hint = '',
  } = $props();

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
  };
  const remove = (i) => { if (items.length > min) items.splice(i, 1); };
  const add = () => { if (items.length < max) items.push(''); };
</script>

<fieldset class="list" aria-describedby={hint ? `${id}-hint` : undefined}>
  <legend class="label"><span>{label}</span><span class="meta">{items.length} {items.length === 1 ? 'item' : 'items'}</span></legend>
  {#if errors._}<p class="error-text">{errors._}</p>{/if}
  <ol>
    {#each items as _, i (i)}
      <li>
        <div class="row">
          <span class="n" aria-hidden="true">{i + 1}</span>
          {#if multiline}
            <textarea class="textarea" id="{id}-{i}" {lang} rows="4" aria-label="{label}, item {i + 1}" bind:value={items[i]} aria-invalid={errors[i] ? 'true' : undefined}></textarea>
          {:else}
            <input class="input" id="{id}-{i}" {lang} aria-label="{label}, item {i + 1}" bind:value={items[i]} aria-invalid={errors[i] ? 'true' : undefined} />
          {/if}
          <div class="tools" role="group" aria-label="Item {i + 1}">
            <button class="btn btn-ghost btn-sm up" type="button" aria-label="Move item {i + 1} up" disabled={i === 0} onclick={() => move(i, -1)}><Icon name="chevron" size={14} /></button>
            <button class="btn btn-ghost btn-sm down" type="button" aria-label="Move item {i + 1} down" disabled={i === items.length - 1} onclick={() => move(i, 1)}><Icon name="chevron" size={14} /></button>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove item {i + 1}" disabled={items.length <= min} onclick={() => remove(i)}><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div class="under">
          {#if errors[i]}<p class="error-text">{errors[i]}</p>{:else}<span></span>{/if}
          <span class="meta" class:over={(items[i] ?? '').length > itemMax}>{(items[i] ?? '').length}/{itemMax}</span>
        </div>
      </li>
    {/each}
  </ol>
  <div class="foot">
    <button class="btn btn-secondary btn-sm" type="button" onclick={add} disabled={items.length >= max}><Icon name="plus" size={14} />{addLabel}</button>
    {#if hint}<p class="hint" id="{id}-hint">{hint}</p>{/if}
  </div>
</fieldset>

<style>
  .list { border: 0; margin: 0; padding: 0; min-width: 0; display: grid; gap: 8px; }
  .label { padding: 0; width: 100%; }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .row { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: start; }
  .n { color: var(--slate); font-size: var(--text-sm); font-variant-numeric: tabular-nums; padding-top: 9px; text-align: right; }
  .tools { display: flex; gap: 2px; }
  .tools :global(.btn) { padding: 0 6px; }
  .up :global(svg) { transform: rotate(-90deg); }
  .down :global(svg) { transform: rotate(90deg); }
  .under { display: flex; justify-content: space-between; gap: 12px; padding-left: 30px; margin-top: 2px; }
  .meta { color: var(--slate); font-size: var(--text-xs); font-variant-numeric: tabular-nums; margin-left: auto; }
  .meta.over { color: var(--danger); font-weight: 500; }
  .foot { display: grid; gap: 6px; justify-items: start; padding-left: 30px; }
  @media (max-width: 640px) {
    .row { grid-template-columns: minmax(0, 1fr); }
    .n { display: none; }
    .tools { justify-content: flex-end; }
    .under, .foot { padding-left: 0; }
  }
</style>
