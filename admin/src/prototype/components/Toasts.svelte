<script>
  import Icon from './Icon.svelte';
  import { store, dismissToast } from '../lib/store.svelte.js';
</script>

<div class="toasts" role="status" aria-live="polite">
  {#each store.toasts as t (t.id)}
    <div class="toast {t.kind}">
      <span class="icon"><Icon name={t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'info'} /></span>
      <div class="text">
        <strong>{t.title}</strong>
        {#if t.text}<span>{t.text}</span>{/if}
      </div>
      <button class="close" type="button" aria-label="Dismiss" onclick={() => dismissToast(t.id)}><Icon name="x" size={16} /></button>
    </div>
  {/each}
</div>

<style>
  .toasts { position: fixed; right: 20px; bottom: 20px; z-index: 50; display: grid; gap: 10px; width: min(380px, calc(100vw - 40px)); }
  .toast {
    display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; padding: 12px 12px 12px 14px;
    background: var(--ink); color: var(--sheet); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
    animation: in 220ms var(--ease);
  }
  .icon { margin-top: 1px; }
  .success .icon { color: #6fe3a5; }
  .error .icon { color: #ff9b8f; }
  .info .icon { color: var(--cyan); }
  .text { display: grid; gap: 2px; font-size: var(--text-sm); }
  .text strong { font-weight: 600; font-size: var(--text-base); }
  .text span { color: var(--fog); }
  .close { background: none; border: 0; color: var(--fog); cursor: pointer; padding: 2px; border-radius: 4px; }
  .close:hover { color: var(--sheet); }
  .close:focus-visible { outline-color: var(--cyan); }
  @keyframes in { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
</style>
