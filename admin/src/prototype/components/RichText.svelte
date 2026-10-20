<script>
  /**
   * Restricted rich-text editor (TipTap). Only what the website can render consistently: paragraphs, sub-headings
   * (H2, H3), bold, italic, bulleted and numbered lists, and links (https, mailto, or site-relative). No colours,
   * fonts, tables or pasted styles: pasted formatting outside this set is dropped by the schema.
   */
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Icon from './Icon.svelte';
  import Dialog from './Dialog.svelte';

  let { value = $bindable(''), label, id, invalid = false, lang = 'en' } = $props();
  let host = $state();
  let editor = $state();
  let tick = $state(0);
  let linkOpen = $state(false);
  let linkUrl = $state('');
  let linkError = $state('');

  onMount(() => {
    editor = new Editor({
      element: host,
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, code: false, blockquote: false, horizontalRule: false, strike: false, link: false, underline: false }),
        Link.configure({ openOnClick: false, autolink: true, protocols: ['https', 'mailto'], HTMLAttributes: { rel: 'noopener', target: null } }),
      ],
      content: value,
      editorProps: { attributes: { id, lang, 'aria-label': label, 'aria-multiline': 'true', role: 'textbox', class: 'prose' } },
      onUpdate: ({ editor: e }) => { value = e.isEmpty ? '' : e.getHTML(); },
      onTransaction: () => { tick++; },
    });
  });
  onDestroy(() => editor?.destroy());

  // Keep the editor in sync when the bound value changes from outside (e.g. switching language).
  $effect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) editor.commands.setContent(value || '', { emitUpdate: false });
  });

  const active = (name, attrs) => (tick, editor?.isActive(name, attrs) ?? false);
  const run = (fn) => () => { fn(editor.chain().focus()).run(); };

  function openLink() {
    linkUrl = editor.getAttributes('link').href ?? '';
    linkError = '';
    linkOpen = true;
  }
  function applyLink() {
    const url = linkUrl.trim();
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); linkOpen = false; return; }
    if (!/^(https:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|\/[^\s]*)$/.test(url)) { linkError = 'Use a full https:// address, a mailto: address, or a page on this site starting with /.'; return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    linkOpen = false;
  }

  const tools = [
    { icon: 'bold', title: 'Bold', on: () => active('bold'), act: run((c) => c.toggleBold()) },
    { icon: 'italic', title: 'Italic', on: () => active('italic'), act: run((c) => c.toggleItalic()) },
    { sep: true },
    { text: 'H2', title: 'Heading', on: () => active('heading', { level: 2 }), act: run((c) => c.toggleHeading({ level: 2 })) },
    { text: 'H3', title: 'Sub-heading', on: () => active('heading', { level: 3 }), act: run((c) => c.toggleHeading({ level: 3 })) },
    { sep: true },
    { icon: 'list', title: 'Bulleted list', on: () => active('bulletList'), act: run((c) => c.toggleBulletList()) },
    { icon: 'olist', title: 'Numbered list', on: () => active('orderedList'), act: run((c) => c.toggleOrderedList()) },
    { icon: 'link', title: 'Link', on: () => active('link'), act: () => openLink() },
    { sep: true },
    { icon: 'undo', title: 'Undo', act: run((c) => c.undo()) },
    { icon: 'redo', title: 'Redo', act: run((c) => c.redo()) },
  ];
</script>

<div class="rte" class:invalid>
  <div class="toolbar" role="toolbar" aria-label="Formatting">
    {#each tools as t}
      {#if t.sep}<span class="sep" aria-hidden="true"></span>
      {:else}
        <button type="button" class="tool" title={t.title} aria-label={t.title} aria-pressed={t.on ? t.on() : undefined} onclick={t.act} disabled={!editor}>
          {#if t.icon}<Icon name={t.icon} size={17} />{:else}<span class="t">{t.text}</span>{/if}
        </button>
      {/if}
    {/each}
  </div>
  <div class="surface" bind:this={host}></div>
</div>

<Dialog bind:open={linkOpen} title="Link">
  <div class="field">
    <label class="label" for="{id}-link">Address</label>
    <input class="input" id="{id}-link" type="text" inputmode="url" placeholder="https://… or /work" bind:value={linkUrl} aria-invalid={linkError ? 'true' : undefined} onkeydown={(e) => e.key === 'Enter' && applyLink()} />
    {#if linkError}<p class="error-text">{linkError}</p>{:else}<p class="hint">Leave empty and apply to remove the link.</p>{/if}
  </div>
  {#snippet actions()}
    <button class="btn btn-secondary" type="button" onclick={() => (linkOpen = false)}>Cancel</button>
    <button class="btn btn-primary" type="button" onclick={applyLink}>Apply</button>
  {/snippet}
</Dialog>

<style>
  .rte { border: 1px solid var(--rule); border-radius: var(--radius); background: var(--white); transition: border-color 150ms var(--ease), box-shadow 150ms var(--ease); }
  .rte:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgb(8 65 200 / 0.14); }
  .rte.invalid { border-color: var(--danger); }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 6px; border-bottom: 1px solid var(--rule-soft); background: var(--sheet); border-radius: var(--radius) var(--radius) 0 0; }
  .tool { display: inline-grid; place-items: center; min-width: 32px; height: 30px; padding: 0 6px; border: 0; border-radius: 5px; background: transparent; color: var(--graphite); cursor: pointer; }
  .tool:hover:not(:disabled) { background: var(--rule-soft); color: var(--ink); }
  .tool[aria-pressed='true'] { background: var(--blue-soft); color: var(--blue); }
  .t { font-size: var(--text-sm); font-weight: 600; }
  .sep { width: 1px; height: 18px; background: var(--rule); margin: 0 4px; }
  .surface :global(.prose) { min-height: 180px; padding: 12px 14px; font-size: var(--text-md); line-height: 1.65; outline: none; }
  .surface :global(.prose > * + *) { margin-top: 0.75em; }
  .surface :global(.prose h2) { font-size: 1.2rem; font-weight: 500; }
  .surface :global(.prose h3) { font-size: 1.05rem; font-weight: 600; }
  .surface :global(.prose ul), .surface :global(.prose ol) { padding-left: 1.4em; margin: 0; }
  .surface :global(.prose a) { color: var(--blue); text-decoration: underline; text-underline-offset: 2px; }
  .surface :global(.prose p) { margin: 0; }
</style>
