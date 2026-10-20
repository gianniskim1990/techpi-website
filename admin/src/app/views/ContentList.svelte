<script>
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import { store, entriesOf, createDraft } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { session } from '../lib/session.svelte.js';
  import { caseStudies, loadCaseStudies, draftOf } from '../lib/case-studies.svelte.js';
  import { insights, loadInsights, insightDraftOf } from '../lib/insights.svelte.js';

  let { type } = $props();
  const isCase = type === 'case-studies';
  const media = (file) => (file ? new URL(`../demo/media/${file}`, import.meta.url).href : null);

  let q = $state('');
  let status = $state('all');
  let group = $state('all');
  let language = $state('all');
  let sort = $state(isCase ? 'order' : 'newest');

  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    let list = entriesOf(type).filter((e) => {
      const t = e.saved.en;
      if (term && ![t.title, t.category, e.slug].some((v) => v?.toLowerCase().includes(term))) return false;
      if (status !== 'all' && statusOf(e) !== status) return false;
      if (isCase && group !== 'all' && e.group !== group) return false;
      if (language === 'missing-el' && e.hasGreek) return false;
      if (language === 'has-el' && !e.hasGreek) return false;
      return true;
    });
    const byTitle = (a, b) => a.saved.en.title.localeCompare(b.saved.en.title);
    if (sort === 'order') list = list.toSorted((a, b) => (a.isNew - b.isNew) || a.order - b.order);
    if (sort === 'title') list = list.toSorted(byTitle);
    if (sort === 'newest') list = list.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return list;
  });
  const total = $derived(entriesOf(type).length);
  const filtered = $derived(q || status !== 'all' || group !== 'all' || language !== 'all');
  const reset = () => { q = ''; status = 'all'; group = 'all'; language = 'all'; };
  const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  // Case studies (M1B) and Insights articles (M2) are connected to GitHub; without the Worker both are the snapshot.
  const connectedSlugs = $derived((isCase ? session.data?.connected?.caseStudies : session.data?.connected?.insights) ?? []);
  const connected = (e) => connectedSlugs.includes(e.slug);
  const anyConnected = $derived(connectedSlugs.length > 0);
  const live = $derived(isCase ? caseStudies : insights);
  const prOf = (slug) => (isCase ? draftOf(slug) : insightDraftOf(slug));
  // Refreshed each time the list opens: drafts may have been saved elsewhere (another tab, another person, GitHub).
  $effect(() => { if (anyConnected) untrack(isCase ? loadCaseStudies : loadInsights); });
  /** Connected case studies show their real status on GitHub: an open draft pull request, or the saved version. */
  const statusOf = (e) => (connected(e) ? (prOf(e.slug) ? 'changes' : 'published') : e.status);
  const liveCategory = (e) => (connected(e) ? live.entries.find((x) => x.slug === e.slug)?.category : null) ?? e.saved.en.category;
  const liveTitle = (e) => (connected(e) ? live.entries.find((x) => x.slug === e.slug)?.[isCase ? 'name' : 'title'] : null) ?? e.saved.en.title;
  const open = (e) => navigate(`/${type}/${e.slug}`);
</script>

<header class="head">
  <div>
    <h1>{isCase ? 'Case studies' : 'Articles'}</h1>
    <p class="sub">
      {#if isCase}The portfolio on /work, in the order shown on the site. Featured projects also appear on the homepage.
      {:else}Insights articles. English only: there is no Greek version of any article.{/if}
      {#if anyConnected} All {connectedSlugs.length} are connected to GitHub: edits are saved as a draft pull request per {isCase ? 'case study' : 'article'}, and the website is not changed.{/if}
    </p>
  </div>
  <button class="btn btn-primary" type="button" onclick={() => navigate(`/${type}/${createDraft(type)}`)} disabled={anyConnected} title={anyConnected ? `Adding a new ${isCase ? 'case study' : 'article'} is not available yet` : undefined}>
    <Icon name="plus" size={16} />{isCase ? 'New case study' : 'New article'}
  </button>
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
        <select class="select" bind:value={status}>
          <option value="all">All statuses</option><option value="published">Published</option><option value="changes">Unpublished changes</option><option value="draft">Draft</option>
        </select>
      </label>
      {#if isCase}
        <label><span class="visually-hidden">Group</span>
          <select class="select" bind:value={group}><option value="all">All work</option><option value="client">Client projects</option><option value="earlier">Earlier work</option></select>
        </label>
      {/if}
      <label><span class="visually-hidden">Language</span>
        <select class="select" bind:value={language}><option value="all">All languages</option><option value="has-el">Has Greek</option><option value="missing-el">Missing Greek</option></select>
      </label>
      <label><span class="visually-hidden">Sort</span>
        <select class="select" bind:value={sort}>
          {#if isCase}<option value="order">Site order</option>{/if}<option value="newest">Recently updated</option><option value="title">Title A–Z</option>
        </select>
      </label>
    </div>
  </div>

  {#if anyConnected && live.error}<p class="resultcount error-text" role="alert">Draft status could not be loaded: {live.error}</p>{/if}
  <p class="resultcount" aria-live="polite">{rows.length === total ? `${total} ${isCase ? 'case studies' : 'articles'}` : `${rows.length} of ${total}`}</p>

  {#if rows.length}
    <table>
      <thead>
        <tr>
          <th scope="col">{isCase ? 'Project' : 'Title'}</th>
          <th scope="col" class="c-cat">Category</th>
          {#if isCase}<th scope="col" class="c-group">Group</th>{:else}<th scope="col" class="c-group">Published</th>{/if}
          <th scope="col" class="c-lang">Languages</th>
          <th scope="col" class="c-status">Status</th>
          <th scope="col" class="c-upd">Updated</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as e (e.type + e.slug)}
          <tr onclick={() => open(e)}>
            <td>
              <div class="title-cell">
                {#if isCase}
                  {#if e.image}<img class="thumb" src={media(e.image)} alt="" width="56" height="36" loading="lazy" />{:else}<span class="thumb none" aria-hidden="true"></span>{/if}
                {/if}
                <div class="tt">
                  <a href="#/{type}/{e.slug}" onclick={(ev) => ev.stopPropagation()}>{liveTitle(e) || 'Untitled'}</a>
                  <span class="slug">/{isCase ? 'work' : 'insights'}/{e.slug}{#if connected(e)}<span class="conn" title="Connected to GitHub: edits are saved as a draft pull request"><Icon name="branch" size={12} />Connected</span>{/if}{#if e.featured}<span class="feat" title="Featured on the homepage"><Icon name="star" size={13} />Featured</span>{/if}</span>
                </div>
              </div>
            </td>
            <td class="c-cat">{liveCategory(e) || '—'}</td>
            <td class="c-group">{isCase ? (e.group === 'client' ? 'Client' : 'Earlier work') : e.published ? day(`${e.published}T00:00:00Z`) : '—'}</td>
            <td class="c-lang">
              <span class="chip on">EN</span>
              <span class="chip" class:on={e.hasGreek} title={e.hasGreek ? 'Greek version exists' : 'No Greek version'}>EL</span>
            </td>
            <td class="c-status"><StatusBadge status={statusOf(e)} />{#if connected(e) && prOf(e.slug)}<a class="pr" href={prOf(e.slug).url} target="_blank" rel="noopener" onclick={(ev) => ev.stopPropagation()}>PR #{prOf(e.slug).number}</a>{/if}</td>
            <td class="c-upd">{day(e.updatedAt)}</td>
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
</div>

<style>
  .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); max-width: 60ch; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--rule-soft); }
  .search { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; max-width: 420px; padding: 0 11px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); color: var(--slate); }
  .search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .search input { border: 0; outline: none; background: transparent; flex: 1; padding: 8px 0; font-size: var(--text-md); color: var(--ink); min-width: 0; }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; }
  .filters .select { width: auto; min-width: 140px; padding-top: 7px; padding-bottom: 7px; font-size: var(--text-base); }
  .resultcount { padding: 10px 16px 0; color: var(--slate); font-size: var(--text-sm); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 16px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: middle; }
  tbody tr { cursor: pointer; transition: background-color 120ms var(--ease); }
  tbody tr:hover { background: var(--white); }
  tbody tr:last-child td { border-bottom: 0; }
  .title-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .thumb { width: 56px; height: 36px; object-fit: cover; border-radius: 4px; background: var(--ink-raised); flex: none; border: 1px solid var(--rule-soft); }
  .thumb.none { display: block; background: repeating-linear-gradient(135deg, var(--rule-soft) 0 6px, var(--sheet) 6px 12px); }
  .tt { display: grid; min-width: 0; }
  .tt a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .tt a:hover { color: var(--blue); text-decoration: underline; }
  .slug { color: var(--slate); font-size: var(--text-sm); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pr { display: block; margin-top: 3px; font-size: var(--text-xs); }
  .conn { display: inline-flex; align-items: center; gap: 3px; padding: 0 7px; border-radius: 999px; background: var(--ok-soft); color: var(--ok); font-size: var(--text-xs); font-weight: 600; }
  .feat { display: inline-flex; align-items: center; gap: 3px; color: var(--blue); font-size: var(--text-xs); font-weight: 600; }
  .chip { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: var(--text-xs); font-weight: 600; border: 1px dashed var(--rule); color: var(--fog); }
  .chip.on { border: 1px solid var(--rule); color: var(--graphite); background: var(--white); }
  .c-upd, .c-group { white-space: nowrap; color: var(--graphite); }
  .empty { padding: 32px 16px; display: grid; justify-items: start; gap: 12px; }
  @media (max-width: 980px) { .c-cat, .c-upd { display: none; } }
  @media (max-width: 640px) {
    thead { display: none; }
    table, tbody, tr, td { display: block; }
    tr { padding: 12px 16px; border-bottom: 1px solid var(--rule-soft); }
    td { padding: 0; border: 0; }
    .c-group, .c-lang, .c-status { display: inline-block; margin: 8px 8px 0 0; vertical-align: middle; }
    .c-group { font-size: var(--text-sm); }
    .search { max-width: none; }
    .filters { width: 100%; }
    .filters label { flex: 1 1 45%; }
    .filters .select { width: 100%; min-width: 0; }
  }
</style>
