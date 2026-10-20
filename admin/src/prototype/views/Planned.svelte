<script>
  /** Sections designed but not built in this prototype: say so plainly and show what they will hold. */
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte.js';
  let { section } = $props();
  const info = {
    pages: { title: 'Website pages', icon: 'pages', text: 'Edit the text, links and images of each page in English and Greek. The layout, order of sections and animations stay as designed, so a page cannot be broken by editing it.' },
    media: { title: 'Media library', icon: 'media', text: 'Upload images (PNG, JPEG or WebP, checked and converted to WebP), see where each one is used, and manage file names and alt text in both languages.' },
    seo: { title: 'SEO', icon: 'seo', text: 'One overview of every page’s search title and description, with length warnings, the sitemap, and which pages have both languages.' },
    settings: { title: 'Settings', icon: 'settings', text: 'Contact details and company information shown on the site, the administrator account, and the publishing connection.' },
  }[section] ?? { title: 'Not found', icon: 'info', text: 'This section does not exist.' };
</script>

<header class="head">
  <h1>{info.title}</h1>
  <p class="badge"><Icon name="clock" size={14} />Designed, not built in this prototype</p>
</header>

<div class="card body">
  <p>{info.text}</p>
  {#if section === 'pages'}
    <table>
      <thead><tr><th scope="col">Page</th><th scope="col">English</th><th scope="col">Greek</th></tr></thead>
      <tbody>
        {#each store.pages as p}
          <tr><td>{p.name}</td><td><a href={p.url.en} target="_blank" rel="noopener">{p.url.en.replace('https://techpi.eu', '') || '/'}</a></td><td><a href={p.url.el} target="_blank" rel="noopener">{p.url.el.replace('https://techpi.eu', '')}</a></td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
  <a class="btn btn-secondary" href="#/"><Icon name="back" size={16} />Back to the overview</a>
</div>

<style>
  .head { display: grid; gap: 8px; margin-bottom: 20px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; justify-self: start; padding: 3px 10px; border-radius: 999px; background: var(--rule-soft); color: var(--graphite); font-size: var(--text-sm); font-weight: 500; }
  .body { padding: 24px; display: grid; gap: 18px; justify-items: start; max-width: 860px; }
  .body > p { max-width: 64ch; font-size: var(--text-md); color: var(--graphite); }
  table { width: 100%; border-collapse: collapse; font-size: var(--text-base); }
  th { text-align: left; font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--slate); padding: 8px 10px; border-bottom: 1px solid var(--rule-soft); }
  td { padding: 10px; border-bottom: 1px solid var(--rule-soft); }
</style>
