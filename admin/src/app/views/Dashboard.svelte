<script>
  import { untrack } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import { store, counts, createDraft } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { session } from '../lib/session.svelte.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';

  const c = $derived(counts());
  const drafts = $derived(store.entries.filter((e) => e.status !== 'published'));
  const latest = store.history[0];
  const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const connected = $derived(Boolean(session.data?.connected?.caseStudies?.length));
  // Refreshed each time the Dashboard opens: drafts may have been saved elsewhere.
  $effect(() => { if (connected) untrack(loadCaseStudies); });
  /** Open draft pull requests of connected case studies, from GitHub. */
  const caseDrafts = $derived(caseStudies.entries.filter((e) => e.draft));
  function newEntry(type) { navigate(`/${type}/${createDraft(type)}`); }
</script>

<header class="head">
  <div>
    <h1>Website overview</h1>
    <p class="sub">Everything on techpi.eu, in English and Greek.</p>
  </div>
  <div class="actions">
    <button class="btn btn-secondary" type="button" onclick={() => newEntry('articles')}><Icon name="plus" size={16} />New article</button>
    <button class="btn btn-primary" type="button" onclick={() => newEntry('case-studies')} disabled={connected} title={connected ? 'Adding a new case study is not available yet' : undefined}><Icon name="plus" size={16} />New case study</button>
  </div>
</header>

<section class="kpis" aria-label="Content">
  <a class="kpi card" href="#/pages">
    <span class="k-label"><Icon name="pages" size={16} />Website pages</span>
    <span class="k-value">{c.pages}</span>
    <span class="k-meta">English and Greek</span>
  </a>
  <a class="kpi card" href="#/case-studies">
    <span class="k-label"><Icon name="portfolio" size={16} />Case studies</span>
    <span class="k-value">{c.caseStudies}</span>
    <span class="k-meta">{c.client} client · {c.earlier} earlier work · {c.featured} featured</span>
  </a>
  <a class="kpi card" href="#/articles">
    <span class="k-label"><Icon name="articles" size={16} />Articles</span>
    <span class="k-value">{c.articles}</span>
    <span class="k-meta">English only</span>
  </a>
  <div class="kpi card" class:attention={c.drafts + caseDrafts.length > 0}>
    <span class="k-label"><Icon name="clock" size={16} />Drafts</span>
    <span class="k-value">{c.drafts + caseDrafts.length}</span>
    <span class="k-meta">{caseDrafts.length ? `${caseDrafts.length} on GitHub, not published` : c.drafts ? 'Waiting to be published' : 'Nothing waiting'}</span>
  </div>
</section>

<div class="grid">
  <section class="card publish" aria-labelledby="pub-h">
    <div class="card-head"><h2 id="pub-h">Publishing</h2></div>
    <div class="card-body">
      <div class="live">
        <span class="pulse" aria-hidden="true"></span>
        <div>
          <strong>techpi.eu is live</strong>
          <span>Last published {day(latest.date)}</span>
        </div>
        <a class="btn btn-secondary btn-sm" href="https://techpi.eu" target="_blank" rel="noopener">Open site<Icon name="external" size={14} /></a>
      </div>
      <dl class="facts">
        <div><dt>Latest change</dt><dd>{latest.message}</dd></div>
        <div><dt>Version</dt><dd><code>{latest.sha}</code></dd></div>
        <div><dt>How publishing works</dt><dd>Every save is a draft on GitHub, not on the live site. The repository is public, so drafts are visible on GitHub. Publishing (not built yet) will rebuild the site and go live only if all checks pass.</dd></div>
      </dl>
      <p class="pending">
        <Icon name="info" size={16} />
        <span>Publishing is not connected, so the status above is a snapshot. Saving drafts to GitHub works for <a href="#/test-content">Test content</a> and the <a href="#/case-studies">18 case studies</a>.</span>
      </p>
    </div>
  </section>

  <section class="card" aria-labelledby="drafts-h">
    <div class="card-head"><h2 id="drafts-h">Drafts in progress</h2></div>
    {#if caseDrafts.length}
      <ul class="list">
        {#each caseDrafts as d}
          <li>
            <a href="#/case-studies/{d.slug}">
              <span class="name">{d.name}</span>
              <span class="meta">Case study · draft pull request #{d.draft.number} on GitHub</span>
            </a>
            <StatusBadge status="changes" />
          </li>
        {/each}
      </ul>
    {/if}
    {#if drafts.length}
      <ul class="list">
        {#each drafts as d}
          <li>
            <a href="#/{d.type}/{d.slug}">
              <span class="name">{d.saved.en.title || 'Untitled'}</span>
              <span class="meta">{d.type === 'articles' ? 'Article' : 'Case study'} · {fmt(d.updatedAt)}</span>
            </a>
            <StatusBadge status={d.status} />
          </li>
        {/each}
      </ul>
    {:else if !caseDrafts.length}
      <div class="empty">
        <p><strong>No drafts.</strong> Everything you see on techpi.eu is published.</p>
        <p class="hint">Start with a new case study or article, or open an existing one to edit it.</p>
      </div>
    {/if}
  </section>

  <section class="card activity" aria-labelledby="act-h">
    <div class="card-head"><h2 id="act-h">Recent activity</h2></div>
    <ol class="timeline">
      {#each store.activity as a}
        <li class="you"><span class="when">{fmt(a.at)}</span><a href="#/{a.type}/{a.slug}">{a.text}</a></li>
      {/each}
      {#each store.history as h}
        <li><span class="when">{day(h.date)}</span><span>{h.message}</span></li>
      {/each}
    </ol>
  </section>

  <section class="card quick" aria-labelledby="q-h">
    <div class="card-head"><h2 id="q-h">Quick actions</h2></div>
    <div class="q-grid">
      <a href="#/case-studies"><Icon name="portfolio" /><span><strong>Edit a case study</strong><span>18 projects, English and Greek</span></span></a>
      <a href="#/articles"><Icon name="articles" /><span><strong>Edit an article</strong><span>7 Insights articles</span></span></a>
      <a href="#/pages"><Icon name="pages" /><span><strong>Edit a page</strong><span>Home, About, Contact and more</span></span></a>
      <a href="#/media"><Icon name="media" /><span><strong>Media library</strong><span>Images and alt text</span></span></a>
    </div>
  </section>
</div>

<style>
  .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  .sub { color: var(--slate); margin-top: 4px; font-size: var(--text-md); }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
  .kpi { display: grid; gap: 4px; padding: 18px 20px; text-decoration: none; color: inherit; transition: border-color 150ms var(--ease); }
  a.kpi:hover { border-color: var(--rule); }
  .k-label { display: flex; align-items: center; gap: 8px; color: var(--slate); font-size: var(--text-sm); font-weight: 500; }
  .k-value { font-size: 2rem; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .k-meta { color: var(--slate); font-size: var(--text-sm); }
  .kpi.attention .k-value { color: var(--warn); }
  .grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  .live { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--radius); background: var(--ok-soft); }
  .live > div { display: grid; flex: 1; }
  .live strong { color: var(--ok); font-weight: 600; }
  .live span { color: var(--graphite); font-size: var(--text-sm); }
  .pulse { width: 10px; height: 10px; border-radius: 50%; background: #2f9e64; box-shadow: 0 0 0 4px rgb(47 158 100 / 0.18); }
  .facts { margin: 16px 0 0; display: grid; gap: 12px; }
  .facts div { display: grid; grid-template-columns: 140px 1fr; gap: 12px; }
  .facts dt { color: var(--slate); font-size: var(--text-sm); }
  .facts dd { margin: 0; }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; }
  .pending { display: flex; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--rule-soft); color: var(--slate); font-size: var(--text-sm); }
  .list { list-style: none; margin: 0; padding: 6px 0; }
  .list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; }
  .list li + li { border-top: 1px solid var(--rule-soft); }
  .list a { display: grid; text-decoration: none; color: inherit; min-width: 0; }
  .list a:hover .name { color: var(--blue); }
  .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { color: var(--slate); font-size: var(--text-sm); }
  .empty { padding: 20px; display: grid; gap: 6px; }
  .timeline { list-style: none; margin: 0; padding: 8px 20px 16px; max-height: 340px; overflow: auto; }
  .timeline li { display: grid; gap: 2px; padding: 9px 0 9px 18px; position: relative; border-left: 1px solid var(--rule); }
  .timeline li::before { content: ''; position: absolute; left: -4px; top: 15px; width: 7px; height: 7px; border-radius: 50%; background: var(--rule); }
  .timeline li.you::before { background: var(--blue); }
  .when { color: var(--slate); font-size: var(--text-xs); }
  .timeline a { color: var(--ink); font-weight: 500; text-decoration: none; }
  .timeline a:hover { color: var(--blue); }
  .q-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--rule-soft); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden; }
  .q-grid a { display: flex; gap: 12px; align-items: flex-start; padding: 16px 18px; background: var(--sheet); color: var(--blue); text-decoration: none; }
  .q-grid a:hover { background: var(--white); }
  .q-grid span { display: grid; }
  .q-grid strong { color: var(--ink); font-weight: 600; }
  .q-grid span span { color: var(--slate); font-size: var(--text-sm); }
  @media (max-width: 1100px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 520px) { .kpis { grid-template-columns: minmax(0, 1fr); } .q-grid { grid-template-columns: minmax(0, 1fr); } .facts div { grid-template-columns: minmax(0, 1fr); gap: 2px; } }
</style>
