<script>
  /**
   * Creates an Insights article (Task M5). English only, like every Insights page. The address, the publication date and
   * the structure (sections, which parts each has, whether there is a note) are chosen here and fixed afterwards like
   * every other article's; the text stays editable. Checked as you type with the same rules the Worker applies
   * (shared/insight-content.js, validateNew). Related articles and note links may point only to what is already on the
   * content branch. Creating writes the file on its own draft branch and opens one draft pull request; nothing is
   * published until that pull request is merged on GitHub.
   */
  import Icon from '../components/Icon.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import SeoSnippet from '../components/SeoSnippet.svelte';
  import { api } from '../lib/api.js';
  import { toast } from '../lib/store.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { insights, loadInsights } from '../lib/insights.svelte.js';
  import { caseStudies, loadCaseStudies } from '../lib/case-studies.svelte.js';
  import { RULES, SLUG_MAX, internalPaths, validateNew } from '../../../shared/insight-content.js';

  if (!insights.loaded) loadInsights();
  if (!caseStudies.loaded) loadCaseStudies();

  const PART = {
    paragraphs: { label: 'Paragraphs', add: 'Add paragraph', multiline: true, rule: RULES.paragraphs, itemMax: RULES.paragraph.max },
    list: { label: 'List', add: 'Add list item', multiline: false, rule: RULES.list, itemMax: RULES.item.max },
    after: { label: 'Paragraphs after the list', add: 'Add paragraph', multiline: true, rule: RULES.after, itemMax: RULES.paragraph.max },
  };
  const PARTS = ['paragraphs', 'list', 'after'];
  const MAX_SECTIONS = 12;
  const today = new Date().toISOString().slice(0, 10);

  let facts = $state({ slug: '', published: today });
  let en = $state({ category: '', title: '', lead: '', sections: [{ heading: '', paragraphs: [''] }], related: [], meta: { title: '', description: '' } });
  let hasNote = $state(false);
  let slugTouched = $state(false);
  let metaTouched = $state(false);
  let tried = $state(false);
  let creating = $state(false);
  let serverErrors = $state({});
  let created = false;

  const slugify = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, SLUG_MAX).replace(/-+$/, '');
  $effect(() => { if (!slugTouched) facts.slug = slugify(en.title); });
  // The search title follows the title until it is edited by hand.
  $effect(() => { if (!metaTouched) en.meta.title = en.title ? `${en.title} | TechPi`.slice(0, RULES.metaTitle.max) : ''; });

  // What exists on the content branch: the only articles and pages a new article may point to.
  const known = $derived({ insights: insights.entries.filter((e) => !e.isNew).map((e) => e.slug), caseStudies: caseStudies.entries.filter((e) => !e.isNew).map((e) => e.slug) });
  const taken = $derived(insights.entries.map((e) => e.slug));
  const payload = $derived({ facts: { slug: facts.slug.trim(), published: facts.published }, en: { ...en, ...(hasNote ? { note: en.note ?? '' } : {}) } });
  const check = $derived(validateNew(payload, { order: 1, taken, known, today }));
  const errors = $derived(tried ? { ...check.errors, ...serverErrors } : {});
  const err = (k) => errors[`en.${k}`];
  const partErrors = (i, part) => {
    const base = `en.sections.${i}.${part}`;
    const out = { _: errors[base] };
    for (const k of Object.keys(errors)) if (k.startsWith(`${base}.`)) out[k.slice(base.length + 1)] = errors[k];
    return out;
  };
  const len = (v) => (v ?? '').trim().length;
  const titleOf = (s) => insights.entries.find((e) => e.slug === s)?.title ?? s;
  const paths = $derived(internalPaths(known));
  const noteParts = $derived.by(() => {
    const t = en.note ?? '';
    const out = [];
    let last = 0;
    for (const m of t.matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) {
      if (m.index > last) out.push({ text: t.slice(last, m.index) });
      out.push({ text: m[1], href: m[2], ok: paths.includes(m[2]) });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push({ text: t.slice(last) });
    return out;
  });
  const pageUrl = $derived(`https://techpi.eu/insights/${facts.slug || '…'}`);

  // Sections: add, remove, reorder, and choose the parts each has (at least one).
  const addSection = () => { if (en.sections.length < MAX_SECTIONS) en.sections.push({ heading: '', paragraphs: [''] }); };
  const removeSection = (i) => { if (en.sections.length > 1) en.sections.splice(i, 1); };
  const moveSection = (i, d) => { const j = i + d; if (j < 0 || j >= en.sections.length) return; [en.sections[i], en.sections[j]] = [en.sections[j], en.sections[i]]; };
  function togglePart(i, part, on) {
    const s = en.sections[i];
    if (on) s[part] = [''];
    else if (PARTS.filter((p) => s[p] !== undefined).length > 1) delete s[part];
  }
  const addRelated = () => { const next = known.insights.find((s) => !en.related.includes(s)); if (next && en.related.length < RULES.related.max) en.related.push(next); };
  const dirty = $derived(Boolean(en.title || en.lead || en.sections.some((s) => s.heading)));

  async function create() {
    tried = true;
    serverErrors = {};
    if (!check.ok) { toast('error', 'Not created', 'Some fields need attention.'); return; }
    creating = true;
    try {
      const r = await api.createInsight(payload);
      created = true;
      toast('success', 'Article created as a draft', `Draft pull request #${r.draft?.number} is open on GitHub. The website is not changed until it is merged.`);
      await loadInsights();
      navigate(`/articles/${r.slug}`);
    } catch (e) {
      if (e.fields) serverErrors = e.fields;
      toast('error', 'Not created', e.message);
    } finally {
      creating = false;
    }
  }
  $effect(() => {
    if (!dirty || created) return;
    const warn = (e) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });
</script>

{#snippet textField(key, label, hint, rule, rows = 0)}
  <div class="field">
    <label class="label" for="a-{key}"><span>{label}</span><span class="meta" class:over={len(en[key]) > rule.max}>{len(en[key])}/{rule.max}</span></label>
    {#if rows}
      <textarea class="textarea" id="a-{key}" lang="en" {rows} bind:value={en[key]} aria-invalid={err(key) ? 'true' : undefined}></textarea>
    {:else}
      <input class="input" id="a-{key}" lang="en" bind:value={en[key]} aria-invalid={err(key) ? 'true' : undefined} />
    {/if}
    {#if err(key)}<p class="error-text">{err(key)}</p>{:else if hint}<p class="hint">{hint}</p>{/if}
  </div>
{/snippet}

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="#/articles"><Icon name="back" size={16} />Articles</a>
</nav>

<header class="head">
  <h1>New article</h1>
  <p class="sub">Published at <code>/insights/{facts.slug || '…'}</code>, in English only, once its draft pull request is merged. The address, date and sections you choose here are fixed afterwards; the text stays editable.</p>
</header>

<div class="layout">
  <div class="col">
    <section class="card" aria-labelledby="art-h">
      <div class="card-head"><h2 id="art-h">Article</h2></div>
      <div class="card-body">
        {@render textField('title', 'Title', 'The page heading.', RULES.title)}
        <div class="grid2">
          <div class="field">
            <label class="label" for="a-slug"><span>Address</span><span class="meta">/insights/…</span></label>
            <input class="input mono" id="a-slug" bind:value={facts.slug} oninput={() => (slugTouched = true)} spellcheck="false" autocomplete="off" aria-invalid={errors['facts.slug'] ? 'true' : undefined} />
            {#if errors['facts.slug']}<p class="error-text">{errors['facts.slug']}</p>{:else}<p class="hint">Follows the title until you edit it. It cannot be changed later.</p>{/if}
          </div>
          <div class="field">
            <label class="label" for="a-date"><span>Publication date</span></label>
            <input class="input" id="a-date" type="date" max={today} bind:value={facts.published} aria-invalid={errors['facts.published'] ? 'true' : undefined} />
            {#if errors['facts.published']}<p class="error-text">{errors['facts.published']}</p>{:else}<p class="hint">Shown on the article. The Insights page lists articles newest first.</p>{/if}
          </div>
        </div>
        {@render textField('category', 'Category', 'The topic label above the title and on the Insights page.', RULES.category)}
        {@render textField('lead', 'Lead', 'Shown under the title and as the excerpt on the Insights page.', RULES.lead, 3)}
      </div>
    </section>

    {#if tried && (errors['en.sections'] || errors.entry)}<p class="error-text" role="alert">{errors['en.sections'] ?? errors.entry}</p>{/if}
    {#each en.sections as s, i (i)}
      <section class="card" aria-labelledby="s-{i}-h">
        <div class="card-head">
          <h2 id="s-{i}-h">Section {i + 1}</h2>
          <div class="tools">
            <button class="btn btn-ghost btn-sm up" type="button" aria-label="Move section {i + 1} up" disabled={i === 0} onclick={() => moveSection(i, -1)}><Icon name="chevron" size={14} /></button>
            <button class="btn btn-ghost btn-sm down" type="button" aria-label="Move section {i + 1} down" disabled={i === en.sections.length - 1} onclick={() => moveSection(i, 1)}><Icon name="chevron" size={14} /></button>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove section {i + 1}" disabled={en.sections.length <= 1} onclick={() => removeSection(i)}><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div class="card-body">
          <div class="field">
            <label class="label" for="s-{i}-heading"><span>Heading</span><span class="meta" class:over={len(s.heading) > RULES.heading.max}>{len(s.heading)}/{RULES.heading.max}</span></label>
            <input class="input" id="s-{i}-heading" lang="en" bind:value={en.sections[i].heading} aria-invalid={errors[`en.sections.${i}.heading`] ? 'true' : undefined} />
            {#if errors[`en.sections.${i}.heading`]}<p class="error-text">{errors[`en.sections.${i}.heading`]}</p>{/if}
          </div>
          <div class="checks" role="group" aria-label="Parts of section {i + 1}">
            {#each PARTS as part}
              <label><input type="checkbox" checked={s[part] !== undefined} disabled={s[part] !== undefined && PARTS.filter((p) => s[p] !== undefined).length === 1} onchange={(e) => togglePart(i, part, e.currentTarget.checked)} /> {PART[part].label}</label>
            {/each}
          </div>
          {#each PARTS.filter((p) => s[p] !== undefined) as part (part)}
            <div class="field">
              <ListEditor bind:items={en.sections[i][part]} label={PART[part].label} id="s-{i}-{part}" lang="en" multiline={PART[part].multiline} itemMax={PART[part].itemMax} min={PART[part].rule.min} max={PART[part].rule.max} errors={partErrors(i, part)} addLabel={PART[part].add} />
            </div>
          {/each}
        </div>
      </section>
    {/each}
    <button class="btn btn-secondary btn-sm addsec" type="button" onclick={addSection} disabled={en.sections.length >= MAX_SECTIONS}><Icon name="plus" size={14} />Add section</button>

    <section class="card" aria-labelledby="note-h">
      <div class="card-head"><h2 id="note-h">Note</h2><label class="toggle"><input type="checkbox" bind:checked={hasNote} /> This article has a note</label></div>
      {#if hasNote}
        <div class="card-body">
          <div class="field">
            <label class="label" for="a-note"><span>Note text</span><span class="meta" class:over={len(en.note) > RULES.note.max}>{len(en.note)}/{RULES.note.max}</span></label>
            <textarea class="textarea" id="a-note" lang="en" rows="3" bind:value={en.note} aria-invalid={err('note') ? 'true' : undefined}></textarea>
            {#if err('note')}<p class="error-text">{err('note')}</p>{:else}<p class="hint">Links are written as [label](/page) and may only point to published pages of this website.</p>{/if}
          </div>
          <div class="notepreview" aria-label="Note preview">
            <span class="meta-label">Preview</span>
            <p>{#each noteParts as p}{#if p.href}<span class="lnk" class:bad={!p.ok} title={p.ok ? p.href : `Not a published page of this website: ${p.href}`}>{p.text}</span>{:else}{p.text}{/if}{/each}</p>
          </div>
        </div>
      {:else}
        <div class="card-body"><p class="hint">A short note set apart from the article text. Optional.</p></div>
      {/if}
    </section>

    <section class="card" aria-labelledby="rel-h">
      <div class="card-head"><h2 id="rel-h">Related reading</h2><span class="meta">{en.related.length}/{RULES.related.max}</span></div>
      <div class="card-body">
        {#if !en.related.length}<p class="hint">No related articles: the section is not shown on the page.</p>{/if}
        <ol class="related">
          {#each en.related as r, i (i)}
            <li>
              <select class="select" aria-label="Related article {i + 1}" bind:value={en.related[i]} aria-invalid={errors[`en.related.${i}`] ? 'true' : undefined}>
                {#each known.insights as o}<option value={o}>{titleOf(o)}</option>{/each}
              </select>
              <button class="btn btn-ghost btn-sm" type="button" aria-label="Remove related article {i + 1}" onclick={() => en.related.splice(i, 1)}><Icon name="x" size={14} /></button>
              {#if errors[`en.related.${i}`]}<p class="error-text full">{errors[`en.related.${i}`]}</p>{/if}
            </li>
          {/each}
        </ol>
        <button class="btn btn-secondary btn-sm" type="button" onclick={addRelated} disabled={en.related.length >= RULES.related.max || !known.insights.length}><Icon name="plus" size={14} />Add related article</button>
      </div>
    </section>

    <section class="card" aria-labelledby="seo-h">
      <div class="card-head"><h2 id="seo-h">Search engines</h2></div>
      <div class="card-body seo">
        <div>
          <div class="field">
            <label class="label" for="a-mt"><span>Search title</span><span class="meta" class:over={len(en.meta.title) > RULES.metaTitle.max}>{len(en.meta.title)}/{RULES.metaTitle.max}</span></label>
            <input class="input" id="a-mt" lang="en" bind:value={en.meta.title} oninput={() => (metaTouched = true)} aria-invalid={errors['en.meta.title'] ? 'true' : undefined} />
            {#if errors['en.meta.title']}<p class="error-text">{errors['en.meta.title']}</p>{:else}<p class="hint">Follows the title until you edit it. At most 70 characters.</p>{/if}
          </div>
          <div class="field">
            <label class="label" for="a-md"><span>Meta description</span><span class="meta" class:over={len(en.meta.description) > RULES.metaDescription.max || len(en.meta.description) < RULES.metaDescription.min}>{len(en.meta.description)}/{RULES.metaDescription.min}–{RULES.metaDescription.max}</span></label>
            <textarea class="textarea" id="a-md" lang="en" rows="3" bind:value={en.meta.description} aria-invalid={errors['en.meta.description'] ? 'true' : undefined}></textarea>
            {#if errors['en.meta.description']}<p class="error-text">{errors['en.meta.description']}</p>{:else}<p class="hint">70 to 200 characters.</p>{/if}
          </div>
        </div>
        <SeoSnippet title={en.meta.title} description={en.meta.description} url={pageUrl} />
      </div>
    </section>
  </div>

  <aside class="rail" aria-label="Create">
    <section class="card">
      <div class="card-body rail-body">
        <button class="btn btn-primary" type="button" onclick={create} disabled={creating} aria-busy={creating}>{creating ? 'Creating on GitHub…' : 'Create draft'}</button>
        {#if tried && !check.ok}<p class="error-text">Fix the highlighted fields to create the article.</p>{/if}
        <p class="hint">Creating opens one draft pull request on GitHub with this article’s file. The website does not change until you merge it.</p>
      </div>
    </section>
    <section class="card">
      <div class="card-body">
        <p class="hint english"><Icon name="info" size={15} /><span>Insights articles are English only. The Greek site points readers to its EU Projects page instead.</span></p>
        <p class="hint warn"><Icon name="info" size={15} /><span>This repository is public: the draft and its text are visible to anyone on GitHub, even before it is published.</span></p>
      </div>
    </section>
  </aside>
</div>

<style>
  .crumbs a { display: inline-flex; align-items: center; gap: 4px; color: var(--slate); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .crumbs a:hover { color: var(--blue); }
  .head { margin: 8px 0 20px; }
  .sub { margin-top: 6px; color: var(--slate); max-width: 72ch; }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
  .col { display: grid; gap: 16px; min-width: 0; }
  .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; margin: 14px 0; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .tools { display: flex; gap: 2px; }
  .up :global(svg) { transform: rotate(-90deg); }
  .down :global(svg) { transform: rotate(90deg); }
  .checks { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 14px; }
  .checks label, .toggle { display: inline-flex; align-items: center; gap: 8px; font-size: var(--text-sm); }
  .addsec { justify-self: start; }
  .related { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 8px; }
  .related li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; }
  .related .full { grid-column: 1 / -1; }
  .notepreview { margin-top: 12px; padding: 10px 12px; border-radius: var(--radius); background: var(--rule-soft); font-size: var(--text-sm); }
  .meta-label { display: block; font-size: var(--text-xs); color: var(--slate); margin-bottom: 4px; }
  .lnk { color: var(--blue); text-decoration: underline; }
  .lnk.bad { color: var(--danger); text-decoration: wavy underline; }
  .seo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .rail { position: sticky; top: 20px; display: grid; gap: 16px; }
  .rail-body { display: grid; gap: 10px; }
  .rail-body .btn { width: 100%; }
  .english, .warn { display: flex; gap: 6px; align-items: flex-start; }
  .warn { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--rule-soft); }
  code { font-size: var(--text-sm); background: var(--rule-soft); padding: 1px 6px; border-radius: 4px; }
  @media (max-width: 1100px) {
    .layout, .seo { grid-template-columns: minmax(0, 1fr); }
    .rail { position: static; }
  }
  @media (max-width: 640px) { .grid2 { grid-template-columns: minmax(0, 1fr); } }
</style>
