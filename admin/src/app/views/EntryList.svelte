<script>
  /**
   * The case studies or the Insights articles, read live from GitHub through the admin's API: what is on the content
   * branch, and which items have an open draft pull request. (Replaces the prototype's snapshot list in Task M4.)
   */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';
  import { insights, loadInsights } from '../lib/insights.svelte.js';
  import { navigate } from '../lib/router.svelte.js';

  let { type } = $props();
  const isCase = $derived(type === 'case-studies');
  const live = $derived(isCase ? caseStudies : insights);
  // Refreshed each time the list opens: drafts may have been saved elsewhere (another tab, GitHub).
  $effect(() => { untrack(isCase ? loadCaseStudies : loadInsights); });

  let q = $state('');
  let status = $state('all');
  let group = $state('all');
  const titleOf = (e) => (isCase ? e.name : e.title);
  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    return live.entries.filter((e) => {
      if (term && ![titleOf(e), e.category, e.slug].some((v) => v?.toLowerCase().includes(term))) return false;
      if (status === 'draft' && !e.draft) return false;
      if (status === 'published' && e.draft) return false;
      if (isCase && group !== 'all' && e.workGroup !== group) return false;
      return true;
    });
  });
  const filtered = $derived(Boolean(q) || status !== 'all' || group !== 'all');
  const reset = () => { q = ''; status = 'all'; group = 'all'; };
  const open = (e) => navigate(`/${type}/${e.slug}`);
  const day = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
</script>

<header class="head">
  <div>
    <h1>{isCase ? 'Case studies' : 'Articles'}</h1>
    <p class="sub">
      {#if isCase}The portfolio on /work, in the order shown on the site, in English and Greek.{:else}Insights articles, newest first. English only: there is no Greek version of any article.{/if}
      Each is edited as a draft pull request on GitHub; saving does not change the website.
    </p>
  </div>
  <a class="btn btn-primary btn-sm new" href="#/{type}/new"><Icon name="plus" size={15} />{isCase ? 'New case study' : 'New article'}</a>
</header>

<div class="card">
  <div class="toolbar">
    <label class="search">
      <Icon name="search" size={16} />
      <span class="visually-hidden">Search</span>
      <input type="search" placeholder={isCase ? 'Search projects, categories, URLs…' : 'Search articles…'} bind:value={q} />
    </label>
    <div class="filters">
      <label><span class="visually-hidden">Status</span>
        <select class="select" bind:value={status}><option value="all">All statuses</option><option value="published">On the content branch</option><option value="draft">Open draft</option></select>
      </label>
      {#if isCase}
        <label><span class="visually-hidden">Group</span>
          <select class="select" bind:value={group}><option value="all">All work</option><option value="client">Client projects</option><option value="earlier">Earlier work</option></select>
        </label>
      {/if}
    </div>
  </div>

  {#if live.loading && !live.loaded}
    <p class="msg" aria-live="polite">Loading from GitHub…</p>
  {:else if live.error && !live.loaded}
    <div class="msg err" role="alert">
      <p><Icon name="alert" size={16} /><span>{live.error}</span></p>
      <button class="btn btn-secondary btn-sm" type="button" onclick={isCase ? loadCaseStudies : loadInsights}>Try again</button>
    </div>
  {:else}
    {#if live.error}<p class="msg err" role="alert">Draft status could not be refreshed: {live.error}</p>{/if}
    <p class="resultcount" aria-live="polite">{rows.length === live.entries.length ? `${live.entries.length} ${isCase ? 'case studies' : 'articles'}` : `${rows.length} of ${live.entries.length}`}</p>
    {#if rows.length}
      <table>
        <thead>
          <tr>
            <th scope="col">{isCase ? 'Project' : 'Title'}</th>
            <th scope="col" class="c-cat">Category</th>
            <th scope="col" class="c-group">{isCase ? 'Group' : 'Published'}</th>
            <th scope="col" class="c-lang">Languages</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as e (e.slug)}
            <tr onclick={() => open(e)}>
              <td>
                <div class="tt">
                  <a href="#/{type}/{e.slug}" onclick={(ev) => ev.stopPropagation()}>{titleOf(e)}</a>
                  <span class="slug">/{isCase ? 'work' : 'insights'}/{e.slug}{#if e.isNew}<span class="newtag" title="Not on the website yet: published when its draft pull request is merged">New</span>{/if}{#if e.featured}<span class="feat" title="Featured on the homepage"><Icon name="star" size={13} />Featured</span>{/if}</span>
                </div>
              </td>
              <td class="c-cat">{e.category || '—'}</td>
              <td class="c-group">{isCase ? (e.workGroup === 'earlier' ? 'Earlier work' : 'Client') : e.published ? day(e.published) : '—'}</td>
              <td class="c-lang"><span class="chip on">EN</span>{#if e.hasGreek}<span class="chip on">EL</span>{/if}</td>
              <td class="c-status"><StatusBadge status={e.draft ? 'changes' : 'published'} />{#if e.draft}<a class="pr" href={e.draft.url} target="_blank" rel="noopener" onclick={(ev) => ev.stopPropagation()}>PR #{e.draft.number}</a>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="empty">
        <p><strong>No {isCase ? 'case studies' : 'articles'} match.</strong></p>
        {#if filtered}<button class="btn btn-secondary btn-sm" type="button" onclick={reset}>Clear search and filters</button>{/if}
      </div>
    {/if}
  {/if}
</div>
<p class="hint foot">“Published” means saved on the content branch the admin reads. An open draft is published only when its pull request is reviewed and merged on GitHub.</p>

<style>
  .head { margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-start; justify-content: space-between; }
  .new { display: inline-flex; align-items: center; gap: 6px; flex: none; }
  .newtag { display: inline-flex; padding: 0 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; color: var(--ink); background: var(--cyan); }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 64ch; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--rule-soft); }
  .search { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; max-width: 420px; padding: 0 11px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); color: var(--slate); }
  .search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .search input { border: 0; outline: none; background: transparent; flex: 1; padding: 8px 0; font-size: var(--text-md); color: var(--ink); min-width: 0; }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; }
  .filters .select { width: auto; min-width: 150px; padding-top: 7px; padding-bottom: 7px; font-size: var(--text-base); }
  .msg { padding: 20px 16px; color: var(--slate); }
  .err { display: grid; gap: 12px; justify-items: start; color: var(--danger); }
  .err p { display: flex; gap: 8px; align-items: flex-start; }
  .resultcount { padding: 10px 16px 0; color: var(--slate); font-size: var(--text-sm); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; }
  tbody tr { cursor: pointer; transition: background-color 120ms var(--ease); }
  tbody tr:hover { background: var(--white); }
  tbody tr:last-child td { border-bottom: 0; }
  .tt { display: grid; min-width: 0; }
  .tt a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .tt a:hover { color: var(--blue); text-decoration: underline; }
  .slug { color: var(--slate); font-size: var(--text-sm); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .feat { display: inline-flex; align-items: center; gap: 3px; color: var(--blue); font-size: var(--text-xs); font-weight: 600; }
  .chip { display: inline-block; margin-right: 4px; padding: 1px 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; border: 1px solid var(--rule); color: var(--graphite); background: var(--white); }
  .c-group { white-space: nowrap; color: var(--graphite); }
  .pr { display: block; margin-top: 3px; font-size: var(--text-xs); }
  .empty { padding: 32px 16px; display: grid; justify-items: start; gap: 12px; }
  .foot { margin-top: 12px; }
  @media (max-width: 980px) { .c-cat { display: none; } }
  @media (max-width: 640px) {
    thead { display: none; }
    table, tbody, tr, td { display: block; }
    tr { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); }
    td { padding: 0; border: 0; }
    .c-group, .c-lang, .c-status { display: inline-block; margin: 8px 8px 0 0; vertical-align: middle; }
    .search { max-width: none; }
    .filters { width: 100%; }
    .filters label { flex: 1 1 45%; }
    .filters .select { width: 100%; min-width: 0; }
  }
</style>
