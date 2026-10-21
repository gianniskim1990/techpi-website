<script>
  /**
   * What happens after Save draft (Task M4). Publishing is manual, on GitHub: there is no Publish button in the admin,
   * because the admin cannot and must not merge. With an open draft, the action opens that specific pull request.
   */
  import Icon from './Icon.svelte';
  import { session } from '../lib/session.svelte.js';
  let { draft = null, legal = false } = $props();
  const production = $derived(session.data?.mode === 'production');
</script>

<div class="publish">
  {#if draft}
    <a class="btn btn-secondary" href={draft.url} target="_blank" rel="noopener"><Icon name="external" size={16} />Review &amp; publish on GitHub</a>
  {/if}
  <details>
    <summary class="hint">{draft ? 'How this draft gets published' : 'Saving is not publishing'}</summary>
    <ol class="hint">
      <li>Save draft commits the change to a draft branch and one draft pull request. The website does not change.</li>
      <li>The owner reviews the pull request on GitHub{legal ? ', including the legal review this policy needs' : ''}.</li>
      <li>The required website build check must pass.</li>
      <li>The owner merges the approved pull request into <code>{production ? 'main' : (session.data?.baseBranch ?? 'the content branch')}</code>.{#if production} Cloudflare builds and deploys the website from main.{/if}</li>
    </ol>
  </details>
</div>

<style>
  .publish { display: grid; gap: 8px; }
  .publish .btn { width: 100%; }
  summary { cursor: pointer; }
  ol { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; }
  code { font-size: var(--text-xs); background: var(--rule-soft); padding: 0 4px; border-radius: 3px; }
</style>
