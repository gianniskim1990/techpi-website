<script>
  /** Inline line icons (24px grid, 1.6 stroke), decorative unless a label is given. */
  let { name, size = 18, label = '' } = $props();
  const paths = {
    dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
    pages: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    portfolio: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    articles: 'M5 4h11l3 3v13H5zM9 9h6M9 13h7M9 17h4',
    media: 'M4 5h16v14H4zM4 15l5-5 4 4 2-2 5 5M15.5 9.5h.01',
    seo: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6',
    settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.3 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    alert: 'M12 4l9 16H3zM12 10v4M12 17.5h.01',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 7.5h.01',
    x: 'M6 6l12 12M18 6L6 18',
    chevron: 'M9 6l6 6-6 6',
    back: 'M15 6l-6 6 6 6',
    external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
    lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
    star: 'M12 4l2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    branch: 'M7 4v10M7 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 10c0 4-10 2-10 6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
    italic: 'M10 5h8M6 19h8M14 5l-4 14',
    list: 'M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01',
    olist: 'M10 7h10M10 12h10M10 17h10M4 6h1.5v4M4 10h3M4 14.5c.5-1 2.5-1 2.5.3 0 1-2.5 2-2.5 3h2.6',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    undo: 'M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2',
    redo: 'M15 7l4 4-4 4M19 11h-9a5 5 0 0 0 0 10h2',
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined}
  aria-label={label || undefined} focusable="false">
  <path d={paths[name]} />
</svg>
