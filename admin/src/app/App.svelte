<script>
  import symbol from './techpi-symbol-white.png';
  import Icon from './components/Icon.svelte';
  import Toasts from './components/Toasts.svelte';
  import Dashboard from './views/Dashboard.svelte';
  import ContentList from './views/ContentList.svelte';
  import Editor from './views/Editor.svelte';
  import Planned from './views/Planned.svelte';
  import TestContentList from './views/TestContentList.svelte';
  import DraftEditor from './views/DraftEditor.svelte';
  import CaseStudyEditor from './views/CaseStudyEditor.svelte';
  import InsightEditor from './views/InsightEditor.svelte';
  import PagesList from './views/PagesList.svelte';
  import PageEditor from './views/PageEditor.svelte';
  import { route, parts } from './lib/router.svelte.js';
  import { counts } from './lib/store.svelte.js';
  import { session, loadSession } from './lib/session.svelte.js';

  loadSession();
  const nav = [
    { section: '', label: 'Dashboard', icon: 'dashboard' },
    { section: 'test-content', label: 'Test content', icon: 'branch', live: true },
    { section: 'pages', label: 'Website pages', icon: 'pages', count: () => counts().pages },
    { section: 'case-studies', label: 'Case studies', icon: 'portfolio', count: () => counts().caseStudies },
    { section: 'articles', label: 'Articles', icon: 'articles', count: () => counts().articles },
    { section: 'media', label: 'Media library', icon: 'media' },
    { section: 'seo', label: 'SEO', icon: 'seo' },
    { section: 'settings', label: 'Settings', icon: 'settings' },
  ];
  let menuOpen = $state(false);
  const current = $derived(parts());
  // Case studies connected to GitHub (from the Worker); every other one is the read-only snapshot.
  const connectedCase = $derived(current.section === 'case-studies' && current.slug && session.data?.connected?.caseStudies?.includes(current.slug));
  const connectedArticle = $derived(current.section === 'articles' && current.slug && session.data?.connected?.insights?.includes(current.slug));
  const pagesConnected = $derived(Boolean(session.data?.connected?.pages?.length));
  const connectedPage = $derived(current.section === 'pages' && current.slug && session.data?.connected?.pages?.includes(current.slug));
  const connectedSection = $derived((current.section === 'case-studies' && session.data?.connected?.caseStudies?.length) || (current.section === 'articles' && session.data?.connected?.insights?.length) || (current.section === 'pages' && pagesConnected));
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
        {#each nav as item}
          <li>
            <a href="#/{item.section}" aria-current={current.section === item.section ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {#if item.live}<span class="live" title="Connected to GitHub">Live</span>{:else if item.count}<span class="count" title="Read-only snapshot">{item.count()}</span>{/if}
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
          <span class="avatar" aria-hidden="true">{session.data.email.slice(0, 1).toUpperCase()}</span>
          <div><strong class="email" title={session.data.email}>{session.data.email}</strong><span>Signed in with Cloudflare Access</span></div>
        {:else}
          <span class="avatar" aria-hidden="true">?</span>
          <div><strong>{session.loading ? 'Checking sign-in…' : 'Not connected'}</strong><span>{session.loading ? '' : 'Only the snapshot sections work'}</span></div>
        {/if}
      </div>
    </div>
  </aside>

  {#if menuOpen}<button class="scrim" aria-label="Close menu" onclick={() => (menuOpen = false)}></button>{/if}

  <div class="main">
    <div class="notice" role="note">
      <Icon name="info" size={15} />
      {#if current.section === 'test-content' || connectedCase || connectedArticle || connectedSection}
        <span><strong>Connected.</strong> Saves go to a GitHub draft branch and draft pull request. Nothing is published or merged from here.</span>
      {:else}
        <span><strong>Not connected here.</strong> Test content, the 8 website pages, the 18 case studies and the 7 Insights articles are connected; the media library, SEO overview and settings are not built yet.</span>
      {/if}
    </div>
    {#if session.data && !session.data.github.configured}
      <div class="notice bad" role="alert">
        <Icon name="alert" size={15} />
        <span><strong>GitHub is not connected yet.</strong> Missing settings: {session.data.github.missing.join(', ')}. See docs/admin/A1.md.</span>
      </div>
    {/if}
        <header class="topbar">
      <button class="btn btn-ghost menu" type="button" aria-label="Open menu" aria-expanded={menuOpen} onclick={() => (menuOpen = true)}><Icon name="menu" /></button>
      <span class="crumb">{nav.find((n) => n.section === current.section)?.label ?? 'Dashboard'}</span>
    </header>
    <main>
      {#if current.section === ''}
        <Dashboard />
      {:else if current.section === 'test-content' && current.slug}
        {#key route.path}<DraftEditor slug={current.slug} />{/key}
      {:else if current.section === 'test-content'}
        <TestContentList />
      {:else if connectedCase}
        {#key route.path}<CaseStudyEditor slug={current.slug} />{/key}
      {:else if connectedArticle}
        {#key route.path}<InsightEditor slug={current.slug} />{/key}
      {:else if connectedPage}
        {#key route.path}<PageEditor pageKey={current.slug} />{/key}
      {:else if current.section === 'pages' && pagesConnected && !current.slug}
        <PagesList />
      {:else if current.section === 'pages' && session.loading}
        <p class="hint">Checking the connection…</p>
      {:else if (current.section === 'case-studies' || current.section === 'articles') && current.slug && session.loading}
        <p class="hint">Checking the connection…</p>
      {:else if (current.section === 'case-studies' || current.section === 'articles') && current.slug}
        {#key route.path}<Editor type={current.section} slug={current.slug} />{/key}
      {:else if current.section === 'case-studies' || current.section === 'articles'}
        {#key current.section}<ContentList type={current.section} />{/key}
      {:else}
        <Planned section={current.section} />
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
  .notice.bad { background: var(--danger-soft, #fbe9e7); color: var(--danger); border-bottom-color: #e7b4ae; }
  .live { margin-left: auto; font-size: var(--text-xs); font-weight: 600; color: var(--ink); background: var(--cyan); padding: 0 6px; border-radius: 4px; }
  .email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px; }
  .session div { min-width: 0; }
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
