<script>
  /**
   * Connected editor for one of the 8 website pages (Task M3). English and Greek tabs; the fields are generated from the
   * page's own structure, with labels, kinds and limits from admin/shared/page-content.js, the same rules the Worker
   * applies on save and the site's build applies to the file. The structure is fixed (list items can be reordered, not
   * added or removed); facts and protective text are locked. Legal pages show their references to site facts as tokens
   * and their generated blocks as locked. Saves go to the page's own draft branch and one draft pull request.
   */
  import Icon from '../components/Icon.svelte';
  import PublishPanel from '../components/PublishPanel.svelte';
  import StatusBadge from '../components/StatusBadge.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { loadPages } from '../lib/pages.svelte.js';
  import { LOCALES, TOKENS, SEO_DESCRIPTION, LIMITS, fieldRule, pageInfo, isLegal, validateEditable } from '../../../shared/page-content.js';

  let { pageKey } = $props();
  const info = $derived(pageInfo(pageKey));
  const legal = $derived(isLegal(pageKey));
  const TITLES = {
    intro: 'Intro', hero: 'Hero', statement: 'Statement', work: 'Selected work', capabilities: 'Capabilities', intelligence: 'AI where it creates value',
    evolution: 'Evolution', contact: 'Contact', euTeaser: 'EU Projects teaser', groups: 'Work groups', stayed: 'Stayed', changed: 'Changed', principles: 'Principles',
    infra: 'Digital infrastructure', lifecycle: 'Project lifecycle', websites: 'Project websites', platforms: 'Platforms', partners: 'Communication partners',
    programmes: 'Programmes', priorities: 'Priorities', process: 'Process', before: 'Before launch', after: 'After launch', closer: 'Closing', map: 'Transformation map',
    steps: 'Steps', areas: 'Areas', stages: 'Stages', items: 'Items', model: 'Content model', offer: 'Offer', client: 'Client projects', earlier: 'Earlier work',
  };
  const human = (k) => TITLES[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  // What this page does not hold, and where it lives instead (one source of truth).
  const SHARED = {
    home: ['The four capabilities (names, descriptions, items) are shared with the Capabilities page and the case studies: src/content/capabilities.ts, not editable here yet.', 'Selected work and its projects come from the case studies.'],
    capabilities: ['The four capabilities themselves (names, descriptions, items, anchors and order) are shared with the homepage and the case studies: src/content/capabilities.ts, not editable here yet.'],
    work: ['The 18 projects come from the case studies (Case studies section).', 'The closing line is shared by several pages: src/content/pages.*.ts.'],
    about: ['The closing line is shared by several pages: src/content/pages.*.ts.'],
    contact: ['The email address and telephone number are confirmed facts in src/content/site.ts, shown on this page and in the structured data.'],
    'eu-projects': ['The disclaimer under the programmes is locked: it states that no endorsement or track record is implied.'],
    privacy: ['Operator, address, contact details and registration numbers come from src/content/site.ts through references.'],
    cookies: ['Operator and contact details come from src/content/site.ts through references.'],
  };

  let load = $state({ loading: true, error: null });
  let doc = $state(null);
  let form = $state(null); // { en, el }
  let baseline = $state('');
  let sha = $state(null);
  let source = $state('published');
  let draft = $state(null);
  let elsewhere = $state(null); // an open draft PR for this item that targets another branch
  let lang = $state('en');
  let tried = $state(false);
  let saving = $state(false);
  let saveError = $state(null);
  let conflictOpen = $state(false);
  let serverErrors = $state({});

  const copy = (v) => JSON.parse(JSON.stringify(v));
  async function fetchEntry() {
    load = { loading: true, error: null };
    try {
      const r = await api.getPage(pageKey);
      doc = r.content;
      form = { en: copy(r.content.en), el: copy(r.content.el) };
      baseline = JSON.stringify(form);
      sha = r.sha;
      source = r.source;
      draft = r.draft;
      elsewhere = r.elsewhere ?? null;
      tried = false;
      serverErrors = {};
      saveError = null;
      load = { loading: false, error: null };
    } catch (e) {
      load = { loading: false, error: e.message };
    }
  }
  fetchEntry();

  const dirty = $derived(form ? JSON.stringify(form) !== baseline : false);
  const check = $derived(form && doc ? validateEditable(form, doc, pageKey) : { ok: true, errors: {} });
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const errAt = (segs) => errors[[lang, ...segs].join('.')];
  const langHasErrors = (l) => Object.keys(errors).some((k) => k.startsWith(`${l}.`));
  const getAt = (segs) => segs.reduce((o, k) => o?.[k], form?.[lang]);
  const setAt = (segs, v) => { const parent = segs.slice(0, -1).reduce((o, k) => o[k], form[lang]); parent[segs.at(-1)] = v; };
  const move = (segs, i, d) => { const arr = getAt(segs); const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  const len = (v) => (v ?? '').trim().length;
  const topKeys = $derived(form ? Object.keys(form[lang]).filter((k) => k !== 'seo') : []);
  const flatKeys = $derived(topKeys.filter((k) => typeof form[lang][k] === 'string'));
  const groupKeys = $derived(topKeys.filter((k) => typeof form[lang][k] !== 'string' && !(legal && k === 'sections')));
  const pageUrl = $derived(`https://techpi.eu${doc?.facts.paths[lang] ?? ''}`);

  // Legal text preview: **bold**, `code`, [text](reference) and references, as the page renders them.
  const parts = (text) => {
    const out = [];
    const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(\{\{([a-zA-Z.]+)\}\}\)|\{\{([a-zA-Z.]+)\}\}/g;
    let last = 0;
    for (const m of text.matchAll(re)) {
      if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
      if (m[1]) out.push({ t: 'strong', v: m[1] });
      else if (m[2]) out.push({ t: 'code', v: m[2] });
      else if (m[3]) out.push({ t: 'link', v: m[3], ref: m[4] });
      else out.push({ t: 'token', v: m[5] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
    return out;
  };

  async function save() {
    tried = true;
    serverErrors = {};
    saveError = null;
    if (!check.ok) {
      const first = LOCALES.find((l) => Object.keys(check.errors).some((k) => k.startsWith(`${l}.`)));
      if (first && !Object.keys(check.errors).some((k) => k.startsWith(`${lang}.`))) lang = first;
      toast('error', 'Not saved', 'Some fields need attention.');
      return;
    }
    saving = true;
    try {
      const r = await api.savePageDraft(pageKey, form, sha);
      sha = r.sha;
      baseline = JSON.stringify(form);
      if (r.changed) {
        draft = r.draft;
        source = 'draft';
        toast('success', 'Draft saved to GitHub', `Committed to the draft branch. Draft pull request #${r.draft?.number} is up to date. The website is not changed.`);
        loadPages();
      } else {
        toast('info', 'Nothing to save', 'This version is the same as the one on GitHub.');
      }
    } catch (e) {
      if (e.conflict) conflictOpen = true;
      else if (e.fields) { serverErrors = e.fields; toast('error', 'Not saved', e.message); }
      else { saveError = e.message; toast('error', 'Not saved', e.message); }
    } finally {
      saving = false;
    }
  }
  function discard() { form = JSON.parse(baseline); tried = false; serverErrors = {}; }

  $effect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });
</script>

{#snippet field(segs)}
  {@const rule = fieldRule(pageKey, segs)}
  {@const value = getAt(segs)}
  {@const id = `f-${lang}-${segs.join('-')}`}
  <div class="field">
    {#if !rule || rule.kind === 'locked'}
      <span class="label"><span>{rule?.label ?? segs.join('.')}</span><span class="meta"><Icon name="lock" size={12} /> Locked</span></span>
      <p class="locked">{value}</p>
    {:else}
      {@const max = rule.kind === 'seo-desc' ? SEO_DESCRIPTION.max : rule.max}
      <label class="label" for={id}><span>{rule.label}</span>{#if max}<span class="meta" class:over={len(value) > max || (rule.kind === 'seo-desc' && len(value) < SEO_DESCRIPTION.min)}>{len(value)}/{rule.kind === 'seo-desc' ? `${SEO_DESCRIPTION.min}–${max}` : max}</span>{/if}</label>
      {#if rule.kind === 'para' || rule.kind === 'legal' || rule.kind === 'seo-desc'}
        <textarea class="textarea" {id} {lang} rows={rule.kind === 'legal' ? 4 : 3} value={value} oninput={(e) => setAt(segs, e.currentTarget.value)} aria-invalid={errAt(segs) ? 'true' : undefined}></textarea>
      {:else}
        <input class="input" {id} {lang} value={value} oninput={(e) => setAt(segs, e.currentTarget.value)} aria-invalid={errAt(segs) ? 'true' : undefined} />
      {/if}
      {#if errAt(segs)}<p class="error-text">{errAt(segs)}</p>{/if}
      {#if rule.kind === 'legal' && typeof value === 'string'}
        <p class="preview" aria-label="Preview">{#each parts(value) as p}{#if p.t === 'strong'}<strong>{p.v}</strong>{:else if p.t === 'code'}<code>{p.v}</code>{:else if p.t === 'link'}<span class="lnk" title={TOKENS[p.ref] ?? `Unknown reference: ${p.ref}`}>{p.v}</span>{:else if p.t === 'token'}<span class="tok" class:bad={!TOKENS[p.v]} title={TOKENS[p.v] ?? 'Unknown reference'}>{p.v}</span>{:else}{p.v}{/if}{/each}</p>
      {/if}
    {/if}
  </div>
{/snippet}

{#snippet list(segs)}
  {@const items = getAt(segs)}
  {@const rule = fieldRule(pageKey, [...segs, 0])}
  <fieldset class="list">
    <legend class="label"><span>{rule?.label ?? human(segs.at(-1))}{rule?.kind === 'line' ? 's' : ''}</span><span class="meta">{items.length} {items.length === 1 ? 'item' : 'items'}{rule?.kind === 'line' ? ', one per line on the page' : ''}</span></legend>
    {#if errAt(segs)}<p class="error-text">{errAt(segs)}</p>{/if}
    <ol>
      {#each items as item, i (i)}
        <li>
          <span class="n" aria-hidden="true">{i + 1}</span>
          <div class="grow">{@render field([...segs, i])}</div>
          {#if rule?.kind !== 'locked'}
            <div class="tools" role="group" aria-label="Item {i + 1}">
              <button class="btn btn-ghost btn-sm up" type="button" aria-label="Move item {i + 1} up" disabled={i === 0} onclick={() => move(segs, i, -1)}><Icon name="chevron" size={14} /></button>
              <button class="btn btn-ghost btn-sm down" type="button" aria-label="Move item {i + 1} down" disabled={i === items.length - 1} onclick={() => move(segs, i, 1)}><Icon name="chevron" size={14} /></button>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  </fieldset>
{/snippet}

{#snippet node(segs)}
  {@const v = getAt(segs)}
  {#if typeof v === 'string'}
    {@render field(segs)}
  {:else if Array.isArray(v) && v.every((x) => typeof x === 'string')}
    {@render list(segs)}
  {:else if Array.isArray(v)}
    <div class="objects">
      {#each v as _, i (i)}
        <fieldset class="obj">
          <legend>{human(segs.at(-1))}: {i + 1}</legend>
          {#each Object.keys(v[i]) as k (k)}{@render node([...segs, i, k])}{/each}
        </fieldset>
      {/each}
    </div>
  {:else if v && typeof v === 'object'}
    {#if segs.length > 1}
      <fieldset class="obj"><legend>{human(segs.at(-1))}</legend>{#each Object.keys(v) as k (k)}{@render node([...segs, k])}{/each}</fieldset>
    {:else}
      {#each Object.keys(v) as k (k)}{@render node([...segs, k])}{/each}
    {/if}
  {/if}
{/snippet}

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/pages"><Icon name="back" size={16} />Website pages</a>
</nav>

{#if load.loading}
  <p class="hint loading" aria-live="polite">Loading from GitHub…</p>
{:else if load.error}
  <div class="card msg" role="alert">
    <p class="error-text">{load.error}</p>
    <button class="btn btn-secondary btn-sm" type="button" onclick={fetchEntry}>Try again</button>
  </div>
{:else}
  <header class="head">
    <h1>{info.name}</h1>
    <div class="sub">
      <StatusBadge status={draft ? 'changes' : 'published'} />
      <span class="connected"><Icon name="branch" size={13} />Connected to GitHub</span>
      {#if legal}<span class="legalbadge"><Icon name="lock" size={13} />Legal page</span>{/if}
      <span class="hint">{source === 'draft' ? 'Showing the saved draft' : 'Showing the version on the development branch'}</span>
      {#if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{/if}
    </div>
  </header>

  {#if elsewhere}
    <p class="blocked" role="alert"><Icon name="alert" size={16} /><span>This item already has an open draft pull request (<a href={elsewhere.url} target="_blank" rel="noopener">#{elsewhere.number}</a>) for another branch ({elsewhere.base}). Saving is blocked until it is closed or merged on GitHub, so nothing is overwritten.</span></p>
  {/if}

  <div class="layout">
    <div class="col">
      <div class="langs" role="tablist" aria-label="Language">
        {#each LOCALES as l}
          <button role="tab" type="button" aria-selected={lang === l} class:has-errors={langHasErrors(l)} onclick={() => (lang = l)}>{l === 'en' ? 'English' : 'Greek'}</button>
        {/each}
      </div>
      {#if tried && errors.entry}<p class="error-text" role="alert">{errors.entry}</p>{/if}
      {#if legal}
        <p class="legalnote" role="note"><Icon name="alert" size={16} /><span>A legal page. Saving checks that the text is complete and consistent: references to site facts, section anchors, the version date and the verified statements stay as they are. It does not make a change legally approved. Every change to this policy needs the owner’s review before the draft is merged.</span></p>
      {/if}

      {#key lang}
        {#if flatKeys.length}
          <section class="card" aria-labelledby="pg-h"><div class="card-head"><h2 id="pg-h">Page</h2></div><div class="card-body">{#each flatKeys as k (k)}{@render node([k])}{/each}</div></section>
        {/if}
        {#each groupKeys as k (k)}
          <section class="card" aria-labelledby="g-{k}-h"><div class="card-head"><h2 id="g-{k}-h">{human(k)}</h2></div><div class="card-body">{@render node([k])}</div></section>
        {/each}

        {#if legal}
          {#each form[lang].sections as sec, si (si)}
            <section class="card" aria-labelledby="s-{si}-h">
              <div class="card-head"><h2 id="s-{si}-h">{si + 1}. {sec.heading}</h2><code class="anchor" title="Section anchor (locked)">#{sec.id}</code></div>
              <div class="card-body">
                {#if errors[`${lang}.sections.${si}.references`]}<p class="error-text" role="alert">{errors[`${lang}.sections.${si}.references`]}</p>{/if}
                {@render field(['sections', si, 'heading'])}
                {#each sec.blocks as b, bi (bi)}
                  {#if b.p !== undefined}{@render field(['sections', si, 'blocks', bi, 'p'])}
                  {:else if b.ul}{@render list(['sections', si, 'blocks', bi, 'ul'])}
                  {:else if b.dynamic}
                    <div class="field"><span class="label"><span>{b.dynamic === 'operatorAddress' ? 'Operator and address' : 'Registration numbers (GEMI, VAT)'}</span><span class="meta"><Icon name="lock" size={12} /> Generated from site.ts</span></span><p class="locked">Filled in by the site from the confirmed facts. Not editable here.</p></div>
                  {:else if b.address}
                    <div class="field"><span class="label"><span>Address</span><span class="meta"><Icon name="lock" size={12} /> Locked</span></span><p class="locked">{b.address.join(', ')}</p></div>
                  {/if}
                {/each}
              </div>
            </section>
          {/each}
        {/if}

        <section class="card" aria-labelledby="seo-h">
          <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
          <div class="card-body seo">
            <div>{@render field(['seo', 'title'])}{@render field(['seo', 'description'])}</div>
            <div class="seo-side">
              <SeoSnippet title={form[lang].seo.title} description={form[lang].seo.description} url={pageUrl} />
              <dl class="facts">
                <div><dt>Canonical</dt><dd>{pageUrl}</dd></div>
                <div><dt>Other language</dt><dd>https://techpi.eu{doc.facts.paths[lang === 'en' ? 'el' : 'en']} (hreflang)</dd></div>
                <div><dt>Also used for</dt><dd>Open Graph, Twitter card and the page’s structured data</dd></div>
              </dl>
              <p class="hint">The title must name TechPi in at most {LIMITS['seo-title']} characters; the description needs {SEO_DESCRIPTION.min} to {SEO_DESCRIPTION.max}. The preview approximates how search engines shorten them.</p>
            </div>
          </div>
        </section>
      {/key}
    </div>

    <aside class="rail" aria-label="Saving">
      <section class="card">
        <div class="card-body rail-body">
          <div class="actions">
            <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving} aria-busy={saving}>{saving ? 'Saving to GitHub…' : 'Save draft'}</button>
            {#if dirty && !saving}<button class="btn btn-ghost" type="button" onclick={discard}>Discard changes</button>{/if}
          </div>
          <PublishPanel {draft} {legal} />
          {#if saveError}<p class="error-text" role="alert">{saveError}</p>{/if}
          {#if tried && !check.ok}<p class="error-text">Fix the highlighted fields to save{langHasErrors(lang === 'en' ? 'el' : 'en') ? ' (also in the other language)' : ''}.</p>{/if}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Draft</h2></div>
        <div class="card-body draftinfo">
          {#if draft}
            <p><Icon name="branch" size={15} /><code>{draft.branch}</code></p>
            <a class="btn btn-secondary btn-sm" href={draft.url} target="_blank" rel="noopener">Draft pull request #{draft.number}<Icon name="external" size={14} /></a>
          {:else}
            <p class="hint">No open draft. The first save creates this page’s draft branch and one draft pull request; later saves, in either language, update it.</p>
          {/if}
          <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: saved drafts, their text and their history are visible to anyone on GitHub, even though the website is unchanged.</span></p>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Locked details</h2></div>
        <div class="card-body">
          <dl class="facts">
            <div><dt>English</dt><dd><Icon name="lock" size={13} /> {doc.facts.paths.en}</dd></div>
            <div><dt>Greek</dt><dd><Icon name="lock" size={13} /> {doc.facts.paths.el}</dd></div>
            {#if legal}<div><dt>Version</dt><dd><time datetime={doc.facts.updated}>{doc.facts.updatedText[lang]}</time> (locked)</dd></div>{/if}
            <div><dt>Structure</dt><dd>Fixed: list items can be reordered, not added or removed</dd></div>
          </dl>
          <ul class="shared">{#each SHARED[pageKey] ?? [] as s}<li>{s}</li>{/each}</ul>
          <a class="live" href="https://techpi.eu{doc.facts.paths[lang]}" target="_blank" rel="noopener"><Icon name="external" size={15} />View the live page</a>
        </div>
      </section>

      {#if legal}
        <section class="card">
          <div class="card-head"><h2>References</h2></div>
          <div class="card-body">
            <p class="hint">Written in the text as {'{{name}}'}; the site fills them in. They can move within their section, not be removed or typed out.</p>
            <dl class="facts tokens">{#each Object.entries(TOKENS) as [t, d]}<div><dt><code>{`{{${t}}}`}</code></dt><dd>{d}</dd></div>{/each}</dl>
          </div>
        </section>
      {/if}
    </aside>
  </div>

  <div class="mobilebar" role="region" aria-label="Save">
    <span class="mb-status">{#if saving}Saving…{:else if dirty}<span class="unsaved"><span class="dot" aria-hidden="true"></span>Unsaved changes</span>{:else}All changes saved{/if}</span>
    <button class="btn btn-primary" type="button" onclick={save} disabled={!dirty || saving}>Save draft</button>
  </div>

  <Dialog bind:open={conflictOpen} title="This page changed on GitHub">
    <p>A newer version was saved after you opened this page. Your change was not saved, so nothing was overwritten.</p>
    <p class="hint">Copy any text you want to keep, then reload to see the latest version.</p>
    {#snippet actions()}
      <button class="btn btn-secondary" type="button" onclick={() => (conflictOpen = false)}>Keep editing</button>
      <button class="btn btn-primary" type="button" onclick={() => { conflictOpen = false; fetchEntry(); }}>Reload latest version</button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .blocked { display: flex; gap: 8px; align-items: flex-start; margin: 0 0 16px; padding: 10px 14px; border-radius: var(--radius); background: var(--danger-soft, #fbe9e7); color: var(--danger); font-size: var(--text-sm); }
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .loading { margin-top: 16px; }
  .msg { padding: 20px; display: grid; gap: 12px; justify-items: start; margin-top: 16px; }
  .head { margin: 8px 0 20px; }
  .sub { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 8px; }
  .connected, .legalbadge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; }
  .connected { background: var(--ok-soft); color: var(--ok); }
  .legalbadge { background: var(--warn-soft); color: var(--warn); }
  .unsaved { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--warn); font-weight: 500; }
  .unsaved .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .langs { display: flex; gap: 4px; border-bottom: 1px solid var(--rule); }
  .langs button { position: relative; padding: 10px 14px; border: 0; background: none; color: var(--slate); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .langs button[aria-selected='true'] { color: var(--ink); border-bottom-color: var(--blue); }
  .langs button.has-errors::after { content: ''; position: absolute; top: 9px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
  .legalnote { display: flex; gap: 8px; align-items: flex-start; padding: 10px 14px; border-radius: var(--radius); background: var(--warn-soft); color: var(--warn); font-size: var(--text-sm); }
  .card-body > :global(.field + .field), .obj :global(.field + .field) { margin-top: 16px; }
  .card-body > :global(.field) { margin-top: 16px; }
  .card-body > :global(.field:first-child) { margin-top: 0; }
  .locked { padding: 8px 11px; border: 1px dashed var(--rule); border-radius: var(--radius); background: var(--sheet); color: var(--graphite); font-size: var(--text-sm); overflow-wrap: anywhere; }
  .objects { display: grid; gap: 12px; margin-top: 12px; }
  .obj { border: 1px solid var(--rule-soft); border-radius: var(--radius); padding: 12px 14px; margin: 12px 0 0; min-width: 0; display: grid; gap: 12px; }
  .obj legend { padding: 0 6px; font-size: var(--text-sm); font-weight: 600; color: var(--graphite); }
  .list { border: 0; padding: 0; margin: 16px 0 0; min-width: 0; display: grid; gap: 8px; }
  .list .label { width: 100%; padding: 0; }
  .list ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .list li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: start; }
  .list li :global(.field) { margin: 0; }
  .list li :global(.label) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .grow { min-width: 0; }
  .n { color: var(--slate); font-size: var(--text-sm); text-align: right; padding-top: 9px; font-variant-numeric: tabular-nums; }
  .tools { display: flex; gap: 2px; }
  .tools :global(.btn) { padding: 0 6px; }
  .up :global(svg) { transform: rotate(-90deg); }
  .down :global(svg) { transform: rotate(90deg); }
  .preview { margin-top: 6px; padding: 8px 11px; border-left: 3px solid var(--rule); background: var(--white); font-size: var(--text-sm); color: var(--graphite); }
  .lnk { color: var(--blue); text-decoration: underline; text-underline-offset: 2px; }
  .tok { padding: 0 4px; border-radius: 4px; background: var(--blue-soft); color: var(--blue); font-size: var(--text-xs); font-weight: 600; }
  .tok.bad { background: var(--danger-soft, #fbe9e7); color: var(--danger); }
  .anchor { font-size: var(--text-xs); }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .seo-side { display: grid; gap: 10px; }
  .facts { margin: 0; display: grid; gap: 10px; font-size: var(--text-sm); }
  .facts dt { color: var(--slate); }
  .facts dd { margin: 0; overflow-wrap: anywhere; }
  .facts div { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 8px; }
  .tokens div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .shared { margin: 12px 0 0; padding-left: 18px; display: grid; gap: 6px; font-size: var(--text-sm); color: var(--slate); }
  .live { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: var(--text-sm); font-weight: 500; text-decoration: none; }
  .rail { position: sticky; top: 20px; display: grid; gap: 16px; }
  .rail-body { display: grid; gap: 10px; }
  .actions { display: grid; gap: 8px; }
  .actions .btn, .rail-body > .btn { width: 100%; }
  .draftinfo { display: grid; gap: 12px; justify-items: start; }
  .draftinfo p { display: flex; gap: 6px; align-items: flex-start; }
  .warn { padding-top: 12px; border-top: 1px solid var(--rule-soft); }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; overflow-wrap: anywhere; }
  .mobilebar { display: none; }
  @media (max-width: 1100px) {
    .layout { grid-template-columns: minmax(0, 1fr); padding-bottom: 72px; }
    .rail { position: static; }
    .seo { grid-template-columns: minmax(0, 1fr); }
    .mobilebar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--sheet); border-top: 1px solid var(--rule); box-shadow: 0 -4px 16px rgb(8 14 30 / 0.06); }
    .mb-status { font-size: var(--text-sm); color: var(--slate); }
  }
  @media (max-width: 640px) { .list li { grid-template-columns: minmax(0, 1fr) auto; } .n { display: none; } }
</style>
