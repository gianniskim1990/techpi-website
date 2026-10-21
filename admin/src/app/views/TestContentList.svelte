<script>
  /** The M0 demo collection, read live from GitHub through the admin's API. The only connected section in Task A1. */
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import { api } from '../lib/api.js';
  import { session } from '../lib/session.svelte.js';

  let state = $state({ loading: true, error: null, data: null });
  async function load() {
    state = { loading: true, error: null, data: null };
    try { state = { loading: false, error: null, data: await api.listDemo() }; }
    catch (e) { state = { loading: false, error: e.message, data: null }; }
  }
  load();
</script>

<header class="head">
  <div>
    <h1>Test content</h1>
    <p class="sub">Dummy entries used to prove the connected workflow. They are not shown on techpi.eu.</p>
  </div>
  <span class="connected"><Icon name="branch" size={14} />Connected to GitHub</span>
</header>

<div class="card">
  {#if state.loading}
    <p class="msg" aria-live="polite">Loading from GitHub…</p>
  {:else if state.error}
    <div class="msg err" role="alert">
      <p><Icon name="alert" size={16} /><span>{state.error}</span></p>
      <button class="btn btn-secondary btn-sm" type="button" onclick={load}>Try again</button>
    </div>
  {:else if !state.data.entries.length}
    <p class="msg">No test entries on <code>{state.data.baseBranch}</code>.</p>
  {:else}
    <ul class="list">
      {#each state.data.entries as e (e.slug)}
        <li>
          <a href="#/test-content/{e.slug}">
            <span class="name">{e.title}</span>
            <span class="meta">{e.summary}</span>
          </a>
          <span class="right">
            <span class="chip on">EN</span><span class="chip" class:on={e.hasGreek}>EL</span>
            <StatusBadge status={e.draft ? 'changes' : 'published'} />
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<p class="foot hint">
  Read from <code>{session.data?.repository ?? 'the repository'}</code>, branch <code>{state.data?.baseBranch ?? session.data?.baseBranch ?? '…'}</code>.
  “Published” here means saved on that branch; it is not the live website.
</p>

<style>
  .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 60ch; }
  .connected { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: var(--ok-soft); color: var(--ok); font-size: var(--text-sm); font-weight: 500; }
  .msg { padding: 20px; color: var(--slate); }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  .list { list-style: none; margin: 0; padding: 6px 0; }
  .list li { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 20px; }
  .list li + li { border-top: 1px solid var(--rule-soft); }
  .list a { display: grid; text-decoration: none; color: inherit; min-width: 0; }
  .list a:hover .name { color: var(--blue); }
  .name { font-weight: 500; }
  .meta { color: var(--slate); font-size: var(--text-sm); }
  .right { display: flex; align-items: center; gap: 6px; flex: none; }
  .chip { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; border: 1px dashed var(--rule); color: var(--fog); }
  .chip.on { border: 1px solid var(--rule); color: var(--graphite); background: var(--white); }
  .foot { margin-top: 12px; }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; overflow-wrap: anywhere; }
  @media (max-width: 640px) { .list li { flex-direction: column; align-items: flex-start; gap: 8px; } }
</style>
