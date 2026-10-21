<script>
  /**
   * The overview, from live data only (Task M4): what the admin manages on the content branch, the draft pull requests
   * that are open, and how publishing works. No deployment date, version or history is shown: the admin does not know
   * them, and GitHub and Cloudflare are the place to see them.
   */
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import { session } from '../lib/session.svelte.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';
  import { insights, loadInsights } from '../lib/insights.svelte.js';
  import { pages, loadPages } from '../lib/pages.svelte.js';

  // Refreshed each time the Dashboard opens: drafts may have been saved, merged or closed elsewhere.
  $effect(() => { untrack(() => { loadPages(); loadCaseStudies(); loadInsights(); }); });

  const base = $derived(session.data?.baseBranch ?? null);
  const production = $derived(session.data?.mode === 'production');
  const COLLECTIONS = $derived([
    { key: 'pages', label: 'Website pages', icon: 'pages', href: '#/pages', store: pages, expected: session.data?.connected?.pages?.length ?? 0, title: (e) => e.name, meta: 'English and Greek' },
    { key: 'case-studies', label: 'Case studies', icon: 'portfolio', href: '#/case-studies', store: caseStudies, expected: session.data?.connected?.caseStudies?.length ?? 0, title: (e) => e.name, meta: 'English and Greek' },
    { key: 'articles', label: 'Articles', icon: 'articles', href: '#/articles', store: insights, expected: session.data?.connected?.insights?.length ?? 0, title: (e) => e.title, meta: 'English only' },
  ]);
  const drafts = $derived(COLLECTIONS.flatMap((c) => c.store.entries.filter((e) => e.draft).map((e) => ({ ...e, kind: c.label, title: c.title(e), href: `${c.href}/${e.slug}` }))));
  const loading = $derived(COLLECTIONS.some((c) => c.store.loading && !c.store.loaded));
  const errors = $derived(COLLECTIONS.filter((c) => c.store.error));
</script>

<header class="head">
  <h1>Overview</h1>
  <p class="sub">The content of techpi.eu that this admin manages, and the drafts waiting for review.</p>
</header>

<section class="source card" aria-labelledby="src-h">
  <div class="card-body">
    <h2 id="src-h" class="visually-hidden">Content source</h2>
    {#if production}
      <p><Icon name="globe" size={16} /><span><strong>Published content: <code>main</code></strong>, the branch techpi.eu is built from. Saving creates a draft on GitHub; nothing changes on the website until a draft is reviewed and merged.</span></p>
    {:else if base}
      <p class="dev"><Icon name="info" size={16} /><span><strong>Development content: <code>{base}</code>.</strong> This is not the live website. Drafts target this branch.</span></p>
    {:else}
      <p class="dev"><Icon name="alert" size={16} /><span><strong>No content branch is configured.</strong> The content cannot be loaded.</span></p>
    {/if}
  </div>
</section>

<section class="kpis" aria-label="Content">
  {#each COLLECTIONS as c (c.key)}
    {@const open = c.store.entries.filter((e) => e.draft).length}
    <a class="kpi card" href={c.href}>
      <span class="k-label"><Icon name={c.icon} size={16} />{c.label}</span>
      <span class="k-value">{c.store.loaded ? c.store.entries.length : '…'}</span>
      <span class="k-meta">
        {#if c.store.loaded && c.store.entries.length !== c.expected}<span class="warn">{c.expected - c.store.entries.length} of {c.expected} could not be read</span>
        {:else if c.store.loaded}{c.meta} · {open ? `${open} open ${open === 1 ? 'draft' : 'drafts'}` : 'no open drafts'}
        {:else}Loading from GitHub…{/if}
      </span>
    </a>
  {/each}
</section>

{#if errors.length}
  <div class="card errors" role="alert">
    {#each errors as c (c.key)}<p><Icon name="alert" size={15} /><span>{c.label}: {c.store.error}</span></p>{/each}
  </div>
{/if}

<div class="grid">
  <section class="card" aria-labelledby="drafts-h">
    <div class="card-head"><h2 id="drafts-h">Open drafts</h2><span class="meta">{drafts.length}</span></div>
    {#if loading}
      <p class="empty hint">Loading from GitHub…</p>
    {:else if drafts.length}
      <ul class="list">
        {#each drafts as d (d.href)}
          <li>
            <a class="name-link" href={d.href}>
              <span class="name">{d.title}</span>
              <span class="meta">{d.kind} · draft pull request #{d.draft.number}</span>
            </a>
            <a class="btn btn-secondary btn-sm" href={d.draft.url} target="_blank" rel="noopener">Review &amp; publish on GitHub<Icon name="external" size={14} /></a>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="empty">
        <p><strong>No open drafts.</strong> Everything shown in the admin is what is on {base ? `the content branch` : 'GitHub'}.</p>
      </div>
    {/if}
  </section>

  <section class="card how" aria-labelledby="how-h">
    <div class="card-head"><h2 id="how-h">How publishing works</h2></div>
    <ol class="card-body steps">
      <li><strong>Save a draft.</strong> The admin commits your change to its own draft branch and opens, or updates, one draft pull request. Saving is not publishing.</li>
      <li><strong>Review on GitHub.</strong> Open the pull request with “Review &amp; publish on GitHub”, check the changes and the preview build.</li>
      <li><strong>Checks pass.</strong> The required website build check must succeed before the pull request can be merged.</li>
      <li><strong>Merge to publish.</strong> The owner marks the pull request ready and merges it into <code>{production ? 'main' : (base ?? 'the content branch')}</code>.{#if production} Cloudflare then builds and deploys the website from <code>main</code>.{/if}</li>
    </ol>
    <p class="card-body note hint">The admin never merges or deploys anything itself. The repository is public, so drafts are visible on GitHub.</p>
  </section>
</div>

<style>
  .head { margin-bottom: 20px; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); }
  .source { margin-bottom: 16px; }
  .source p { display: flex; gap: 10px; align-items: flex-start; }
  .source .dev { color: var(--warn); }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; }
  .kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
  .kpi { display: grid; gap: 4px; padding: 18px 20px; text-decoration: none; color: inherit; transition: border-color 150ms var(--ease); }
  .kpi:hover { border-color: var(--rule); }
  .k-label { display: flex; align-items: center; gap: 8px; color: var(--slate); font-size: var(--text-sm); font-weight: 500; }
  .k-value { font-size: 2rem; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .k-meta { color: var(--slate); font-size: var(--text-sm); }
  .warn { color: var(--danger); }
  .errors { padding: 14px 20px; margin-bottom: 16px; color: var(--danger); display: grid; gap: 6px; }
  .errors p { display: flex; gap: 8px; align-items: flex-start; font-size: var(--text-sm); }
  .grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  .card-head .meta { color: var(--slate); font-size: var(--text-sm); font-variant-numeric: tabular-nums; }
  .list { list-style: none; margin: 0; padding: 6px 0; }
  .list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; flex-wrap: wrap; }
  .list li + li { border-top: 1px solid var(--rule-soft); }
  .name-link { display: grid; text-decoration: none; color: inherit; min-width: 0; flex: 1 1 220px; }
  .name-link:hover .name { color: var(--blue); }
  .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .list .meta { color: var(--slate); font-size: var(--text-sm); }
  .empty { padding: 20px; }
  .steps { margin: 0; padding-left: 40px; display: grid; gap: 10px; font-size: var(--text-sm); color: var(--graphite); }
  .steps strong { color: var(--ink); }
  .note { padding-top: 0; }
  @media (max-width: 1100px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 760px) { .kpis { grid-template-columns: minmax(0, 1fr); } }
</style>
