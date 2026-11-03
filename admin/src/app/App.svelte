<script>
  import symbol from './techpi-symbol-white.png';
  import Icon from './components/Icon.svelte';
  import Toasts from './components/Toasts.svelte';
  import Dashboard from './views/Dashboard.svelte';
  import EntryList from './views/EntryList.svelte';
  import TestContentList from './views/TestContentList.svelte';
  import DraftEditor from './views/DraftEditor.svelte';
  import CaseStudyEditor from './views/CaseStudyEditor.svelte';
  import InsightEditor from './views/InsightEditor.svelte';
  import PagesList from './views/PagesList.svelte';
  import PageEditor from './views/PageEditor.svelte';
  import NewCaseStudy from './views/NewCaseStudy.svelte';
  import NewArticle from './views/NewArticle.svelte';
  import { caseStudies } from './lib/case-studies.svelte.js';
  import { insights } from './lib/insights.svelte.js';
  import { route, parts } from './lib/router.svelte.js';
  import { session, loadSession, signOut } from './lib/session.svelte.js';

  loadSession();
  const connected = $derived(session.data?.connected ?? null);
  // Only what works is in the menu. Counts are the items the admin manages (from the Worker), not a snapshot. Case studies
  // and articles can be created (Task M5), so their counts come from their live lists once loaded.
  const nav = $derived([
    { section: '', label: 'Dashboard', icon: 'dashboard' },
    { section: 'pages', label: 'Website pages', icon: 'pages', count: connected?.pages?.length },
    { section: 'case-studies', label: 'Case studies', icon: 'portfolio', count: caseStudies.loaded ? caseStudies.entries.length : undefined },
    { section: 'articles', label: 'Articles', icon: 'articles', count: insights.loaded ? insights.entries.length : undefined },
    ...(connected?.testContent ? [{ section: 'test-content', label: 'Test content', icon: 'branch', test: true }] : []),
  ]);
  let menuOpen = $state(false);
  const current = $derived(parts());
  const allowed = (list, slug) => Boolean(list?.includes(slug));
  // Case studies and articles: any valid address opens the editor, which says so if the entry does not exist.
  const isEntry = (slug) => slug !== 'new' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const mode = $derived(session.data?.mode ?? null);
  $effect(() => { route.path; menuOpen = false; });
</script>

<div class="shell">
  <aside class="sidebar" class:open={menuOpen} aria-label="Admin">
    <a class="brand" href="#/">
      <img src={symbol} alt="" width="28" height="28" />
      <span class="word">TECHPI</span><span class="role">Admin</span>
    </a>
    <nav aria-label="Main">
      <ul>
        {#each nav as item (item.section)}
          <li>
            <a href="#/{item.section}" aria-current={current.section === item.section ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {#if item.test}<span class="live" title="Development only">Test</span>{:else if item.count}<span class="count" title="Items managed in the admin">{item.count}</span>{/if}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <div class="foot">
      <a class="site" href="https://techpi.eu" target="_blank" rel="noopener">
        <Icon name="globe" size={16} /><span>techpi.eu</span><Icon name="external" size={14} />
      </a>
      <div class="session">
        {#if session.data}
          <span class="avatar" aria-hidden="true">{(session.data.login || '?').slice(0, 1).toUpperCase()}</span>
          <div><strong class="email" title={session.data.login}>{session.data.login}</strong><span>{session.data.signedInWith === 'password' ? 'Signed in with email' : 'Signed in with GitHub'}</span></div>
          <button class="signout" type="button" onclick={signOut}>Sign out</button>
        {:else}
          <span class="avatar" aria-hidden="true">?</span>
          <div><strong>{session.loading ? 'Checking sign-in…' : 'Not signed in'}</strong>{#if !session.loading}<a href="/">Sign in</a>{/if}</div>
        {/if}
      </div>
    </div>
  </aside>

  {#if menuOpen}<button class="scrim" aria-label="Close menu" onclick={() => (menuOpen = false)}></button>{/if}

  <div class="main">
    {#if mode === 'development' && session.data?.baseBranch}
      <div class="notice" role="note">
        <Icon name="info" size={15} />
        <span><strong>Development content.</strong> Reading from <code>{session.data.baseBranch}</code>; drafts target that branch, not the live website.</span>
      </div>
    {/if}
    {#if session.data && !session.data.github.configured}
      <div class="notice bad" role="alert">
        <Icon name="alert" size={15} />
        <span><strong>Content is not available.</strong> {[...session.data.github.missing.map((m) => `${m} is not set.`), ...(session.data.github.problems ?? [])].join(' ')}</span>
      </div>
    {/if}
            <header class="topbar">
      <button class="btn btn-ghost menu" type="button" aria-label="Open menu" aria-expanded={menuOpen} onclick={() => (menuOpen = true)}><Icon name="menu" /></button>
      <span class="crumb">{nav.find((n) => n.section === current.section)?.label ?? 'Dashboard'}</span>
    </header>
    <main>
      {#if session.loading && !session.data}
        <p class="hint">Checking your sign-in…</p>
      {:else if !session.data}
        <div class="card state" role="alert">
          <h1>The admin could not load</h1>
          <p>{session.error ?? 'Your session may have ended.'}</p>
          <div class="actions">
            <a class="btn btn-primary btn-sm" href="/">Sign in</a>
            <button class="btn btn-secondary btn-sm" type="button" onclick={loadSession}>Try again</button>
          </div>
        </div>
      {:else if current.section === ''}
        <Dashboard />
      {:else if current.section === 'pages' && !current.slug}
        <PagesList />
      {:else if current.section === 'pages' && allowed(connected.pages, current.slug)}
        {#key route.path}<PageEditor pageKey={current.slug} />{/key}
      {:else if current.section === 'case-studies' && !current.slug}
        {#key current.section}<EntryList type="case-studies" />{/key}
      {:else if current.section === 'case-studies' && current.slug === 'new'}
        {#key route.path}<NewCaseStudy />{/key}
      {:else if current.section === 'case-studies' && isEntry(current.slug)}
        {#key route.path}<CaseStudyEditor slug={current.slug} />{/key}
      {:else if current.section === 'articles' && !current.slug}
        {#key current.section}<EntryList type="articles" />{/key}
      {:else if current.section === 'articles' && current.slug === 'new'}
        {#key route.path}<NewArticle />{/key}
      {:else if current.section === 'articles' && isEntry(current.slug)}
        {#key route.path}<InsightEditor slug={current.slug} />{/key}
      {:else if current.section === 'test-content' && connected.testContent && current.slug}
        {#key route.path}<DraftEditor slug={current.slug} />{/key}
      {:else if current.section === 'test-content' && connected.testContent}
        <TestContentList />
      {:else}
        <div class="card state">
          <h1>Not found</h1>
          <p>This part of the admin does not exist.</p>
          <a class="btn btn-secondary btn-sm" href="#/">Back to the dashboard</a>
        </div>
      {/if}
    </main>
  </div>
</div>

<Toasts />

<style>
  .notice {
    display: flex; align-items: center; justify-content: center; gap: 8px; padding: 7px 16px;
    background: var(--warn-soft); color: var(--warn); font-size: var(--text-sm); border-bottom: 1px solid #efd9ae;
  }
  .notice strong { font-weight: 600; }
  .notice code { font-size: var(--text-xs); background: rgb(255 255 255 / 0.5); padding: 0 4px; border-radius: 3px; }
  .state { padding: 24px; display: grid; gap: 12px; justify-items: start; max-width: 640px; }
  .notice.bad { background: var(--danger-soft, #fbe9e7); color: var(--danger); border-bottom-color: #e7b4ae; }
  .live { margin-left: auto; font-size: var(--text-xs); font-weight: 600; color: var(--ink); background: var(--cyan); padding: 0 6px; border-radius: 4px; }
  .email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px; }
  .session div { min-width: 0; }
  .session a { color: var(--cyan); font-size: var(--text-xs); }
  .signout { flex: none; white-space: nowrap; margin-left: auto; padding: 4px 8px; border: 1px solid var(--ink-line); border-radius: var(--radius); background: none; color: var(--fog); font: inherit; font-size: var(--text-xs); cursor: pointer; }
  .signout:hover { color: var(--sheet); background: var(--ink-raised); }
  .signout:focus-visible { outline-color: var(--cyan); }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .shell { display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); min-height: 100vh; }
  .sidebar {
    position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; background: var(--ink); color: var(--fog);
    padding: 18px 14px; border-right: 1px solid var(--ink-raised);
  }
  .brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 22px; color: var(--sheet); text-decoration: none; }
  .brand img { display: block; }
  .word { font-weight: 600; letter-spacing: 0.14em; font-size: var(--text-md); }
  .role { font-size: var(--text-sm); color: var(--fog); padding-left: 10px; border-left: 1px solid var(--ink-line); }
  nav ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  nav a {
    position: relative; display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: var(--radius);
    color: var(--fog); text-decoration: none; font-weight: 500; transition: background-color 150ms var(--ease), color 150ms var(--ease);
  }
  nav a:hover { background: var(--ink-raised); color: var(--sheet); }
  nav a[aria-current='page'] { background: var(--ink-raised); color: var(--sheet); }
  nav a[aria-current='page']::before { content: ''; position: absolute; left: -14px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--cyan); }
  nav a:focus-visible, .brand:focus-visible, .site:focus-visible { outline-color: var(--cyan); }
  .count { margin-left: auto; font-size: var(--text-xs); color: var(--fog); font-variant-numeric: tabular-nums; }
  .foot { margin-top: auto; display: grid; gap: 12px; padding-top: 16px; border-top: 1px solid var(--ink-line); }
  .site { display: flex; align-items: center; gap: 8px; padding: 6px 10px; color: var(--fog); text-decoration: none; font-size: var(--text-sm); border-radius: var(--radius); }
  .site:hover { color: var(--sheet); background: var(--ink-raised); }
  .session { display: flex; align-items: center; gap: 10px; padding: 4px 8px; font-size: var(--text-xs); }
  .session div { display: grid; }
  .session strong { color: var(--sheet); font-size: var(--text-sm); font-weight: 500; }
  .avatar { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--ink-raised); color: var(--sheet); font-weight: 600; border: 1px solid var(--ink-line); }
  .main { min-width: 0; }
  .topbar { display: none; }
  main { padding: 32px clamp(16px, 3vw, 40px) 64px; max-width: 1280px; }
  .scrim { display: none; }

  @media (max-width: 900px) {
    .shell { grid-template-columns: minmax(0, 1fr); }
    .sidebar { position: fixed; z-index: 40; left: 0; top: 0; width: min(280px, 86vw); transform: translateX(-100%); transition: transform 220ms var(--ease); }
    .sidebar.open { transform: none; }
    .scrim { display: block; position: fixed; inset: 0; z-index: 30; background: rgb(8 14 30 / 0.45); border: 0; }
    .topbar { display: flex; align-items: center; gap: 8px; position: sticky; top: 0; z-index: 20; padding: 8px 12px; background: var(--sheet); border-bottom: 1px solid var(--rule-soft); }
    .crumb { font-weight: 600; }
    main { padding-top: 20px; }
  }
  @media (prefers-reduced-motion: reduce) { .sidebar { transition: none; } }
</style>
