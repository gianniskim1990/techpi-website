<script>
  /** The 8 website pages, read live from GitHub through the admin's API (Task M3). Replaces the earlier snapshot. */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import { pages, loadPages } from '../lib/pages.svelte.js';
  import { navigate } from '../lib/router.svelte.js';

  // Refreshed each time the list opens: drafts may have been saved elsewhere (another tab, another person, GitHub).
  $effect(() => { untrack(loadPages); });
  const open = (e) => navigate(`/pages/${e.slug}`);
</script>

<header class="head">
  <div>
    <h1>Website pages</h1>
    <p class="sub">The eight pages of techpi.eu, in English and Greek. Each is connected to GitHub: edits are saved as a draft pull request per page, and the website is not changed.</p>
  </div>
  <button class="btn btn-primary" type="button" disabled title="Adding a new page is not available"><Icon name="plus" size={16} />New page</button>
</header>

<div class="card">
  {#if pages.loading && !pages.loaded}
    <p class="msg" aria-live="polite">Loading from GitHub…</p>
  {:else if pages.error && !pages.loaded}
    <div class="msg err" role="alert">
      <p><Icon name="alert" size={16} /><span>{pages.error}</span></p>
      <button class="btn btn-secondary btn-sm" type="button" onclick={loadPages}>Try again</button>
    </div>
  {:else if !pages.entries.length}
    <p class="msg">No pages were found on the development branch.</p>
  {:else}
    {#if pages.error}<p class="msg err" role="alert">Draft status could not be refreshed: {pages.error}</p>{/if}
    <table>
      <thead>
        <tr><th scope="col">Page</th><th scope="col" class="c-url">Addresses</th><th scope="col" class="c-lang">Languages</th><th scope="col">Status</th></tr>
      </thead>
      <tbody>
        {#each pages.entries as e (e.slug)}
          <tr onclick={() => open(e)}>
            <td>
              <div class="tt">
                <a href="#/pages/{e.slug}" onclick={(ev) => ev.stopPropagation()}>{e.name}</a>
                <span class="meta">
                  <span class="conn" title="Connected to GitHub"><Icon name="branch" size={12} />Connected</span>
                  {#if e.kind === 'legal'}<span class="legal" title="Legal page: references to site facts are locked; changes need the owner's legal review">Legal</span>{/if}
                </span>
              </div>
            </td>
            <td class="c-url"><span>{e.paths?.en}</span><span lang="el">{e.paths?.el}</span></td>
            <td class="c-lang"><span class="chip on">EN</span><span class="chip on">EL</span></td>
            <td class="c-status"><StatusBadge status={e.draft ? 'changes' : 'published'} />{#if e.draft}<a class="pr" href={e.draft.url} target="_blank" rel="noopener" onclick={(ev) => ev.stopPropagation()}>PR #{e.draft.number}</a>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
<p class="hint foot">“Published” means saved on the development branch. Merging a draft pull request is a separate, deliberate step; publishing is not built yet.</p>

<style>
  .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 64ch; }
  .msg { padding: 20px; color: var(--slate); }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; }
  tbody tr { cursor: pointer; transition: background-color 120ms var(--ease); }
  tbody tr:hover { background: var(--white); }
  tbody tr:last-child td { border-bottom: 0; }
  .tt { display: grid; gap: 4px; }
  .tt a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .tt a:hover { color: var(--blue); text-decoration: underline; }
  .meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .conn, .legal { display: inline-flex; align-items: center; gap: 3px; padding: 0 7px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; }
  .conn { background: var(--ok-soft); color: var(--ok); }
  .legal { background: var(--warn-soft); color: var(--warn); }
  .c-url span { display: block; color: var(--graphite); font-size: var(--text-sm); }
  .chip { display: inline-block; margin-right: 4px; padding: 1px 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; border: 1px solid var(--rule); color: var(--graphite); background: var(--white); }
  .pr { display: block; margin-top: 3px; font-size: var(--text-xs); }
  .foot { margin-top: 12px; }
  @media (max-width: 760px) { .c-url { display: none; } }
  @media (max-width: 520px) { .c-lang { display: none; } th, td { padding: 10px 12px; } }
</style>
