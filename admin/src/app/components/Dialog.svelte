<script>
  /** Modal dialog built on the native <dialog> element (focus trap, Escape and backdrop handling come with it). */
  let { open = $bindable(false), title, children, actions, wide = false } = $props();
  let el = $state();
  $effect(() => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  });
</script>

<dialog bind:this={el} class:wide onclose={() => (open = false)} onclick={(e) => { if (e.target === el) open = false; }} aria-labelledby="dialog-title">
  <div class="inner">
    <header>
      <h2 id="dialog-title">{title}</h2>
      <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" onclick={() => (open = false)}>✕</button>
    </header>
    <div class="content">{@render children?.()}</div>
    {#if actions}<footer>{@render actions()}</footer>{/if}
  </div>
</dialog>

<style>
  dialog {
    width: min(520px, calc(100vw - 32px)); padding: 0; border: 0; border-radius: var(--radius-lg); background: var(--sheet);
    color: var(--ink); box-shadow: var(--shadow-lg);
  }
  dialog.wide { width: min(760px, calc(100vw - 32px)); }
  dialog::backdrop { background: rgb(8 14 30 / 0.45); }
  header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px; }
  .content { padding: 0 20px 20px; display: grid; gap: 14px; }
  footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--rule-soft); }
</style>
