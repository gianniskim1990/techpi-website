/**
 * The one first-party motion module (docs/production/motion-implementation.md, section 3).
 *
 * Jobs:
 *   1. Confirm that motion may run (`html.mo-ready`). Until it does, the inline guard in BaseLayout removes `mo`
 *      after a short delay, so the page can never be left with hidden text.
 *   2. Start one-shot reveals: one IntersectionObserver adds `.in` to every [data-reveal] and [data-sequence]
 *      element the first time it enters the viewport. Nothing replays.
 *   3. Keep the header usable: it leaves when the reader scrolls down and returns, as a compact bar, when they
 *      scroll up. The scroll listener only compares numbers and toggles classes. It reads no layout.
 *
 *   4. Drive the scroll scenes (desktop-sized windows, motion allowed: `html.sc`). Each [data-scene] element gets
 *      its scroll position as custom properties, and CSS turns them into geometry:
 *        --in    0 when the element's top is at the bottom of the window, 1 when it reaches the top
 *        --out   0 when the element's top is at the top of the window, 1 when its bottom is
 *        --pin   0 to 1 while a tall element holds its sticky stage (its height beyond one window)
 *        --cov   (project panels) how far the next panel or section has slid over this one
 *      The values follow the scroll position directly: nothing is eased, smoothed, snapped or delayed, and the
 *      scroll itself is never intercepted. Elsewhere the same states rest, or play once as a timed sequence.
 */

const root = document.documentElement;
const motionAllowed = () =>
  root.classList.contains('mo') &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function reveal(el: Element) {
  el.classList.add('in');
}

function initReveals() {
  const targets = Array.from(document.querySelectorAll('[data-reveal], [data-sequence]'));
  if (!motionAllowed() || !('IntersectionObserver' in window)) {
    root.classList.remove('mo');
    targets.forEach(reveal);
    return;
  }

  // Anything already above the viewport on load (a deep link, a restored scroll position) is shown at rest.
  const vh = window.innerHeight;
  targets.forEach((el) => {
    if (el.getBoundingClientRect().bottom < 0) reveal(el);
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: `0px 0px -${Math.round(vh * 0.1)}px 0px`, threshold: 0 },
  );
  targets.forEach((el) => {
    if (!el.classList.contains('in')) io.observe(el);
  });

  // Keyboard focus never waits for an animation: a focused element and everything around it is shown at rest.
  document.addEventListener('focusin', (e) => {
    let el = (e.target as Element | null)?.closest('[data-reveal]:not(.in), [data-sequence]:not(.in)');
    while (el) {
      reveal(el);
      el = el.parentElement?.closest('[data-reveal]:not(.in), [data-sequence]:not(.in)') ?? null;
    }
    (e.target as Element | null)?.querySelectorAll?.('[data-reveal]:not(.in)').forEach(reveal);
  });

  // If the reader turns on reduced motion while the page is open, everything settles at once.
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      root.classList.remove('mo', 'sc');
      targets.forEach(reveal);
    }
  });
}

function initHeader() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;
  root.classList.add('hdr');
  let last = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const away = y > 8;
    header.classList.toggle('is-away', away);
    // Hide only after the first screen's top area, and only on a real downward move.
    if (y > last + 4 && y > 160) header.classList.add('is-hidden');
    else if (y < last - 4 || !away) header.classList.remove('is-hidden');
    last = y;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  // A keyboard user tabbing into the header always sees it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();
}

function initScenes() {
  const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  if (!scenes.length) return;
  const query = window.matchMedia('(min-width: 1024px) and (min-height: 700px)');
  const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const written = new WeakMap<HTMLElement, Record<string, string>>();
  const write = (el: HTMLElement, name: string, v: number) => {
    const val = v.toFixed(4);
    const prev = written.get(el) ?? {};
    if (prev[name] === val) return;
    prev[name] = val;
    written.set(el, prev);
    el.style.setProperty(`--${name}`, val);
  };
  // What slides over a project panel: the next panel, or for the last one the section after the work.
  const coverOf = (el: HTMLElement) =>
    (el.nextElementSibling as HTMLElement | null) ?? (el.closest('section')?.nextElementSibling as HTMLElement | null);

  const measure = (all: boolean) => {
    const vh = window.innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      // Far from the window: nothing there is visible, so it is left as it is until it comes near.
      if (!all && (r.bottom < -vh || r.top > vh * 2)) continue;
      write(el, 'in', clamp((vh - r.top) / vh));
      write(el, 'out', clamp(-r.top / r.height));
      write(el, 'pin', r.height > vh ? clamp(-r.top / (r.height - vh)) : 0);
      if (el.dataset.scene === 'case') {
        const next = coverOf(el);
        write(el, 'cov', next ? clamp((vh - next.getBoundingClientRect().top) / vh) : 0);
      }
    }
  };

  let active = false;
  let ticking = false;
  const request = () => {
    if (ticking || !active) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (active) measure(false);
    });
  };
  const setActive = () => {
    active = query.matches && root.classList.contains('mo');
    root.classList.toggle('sc', active);
    if (active) measure(true);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => {
    setActive();
    request();
  });
  query.addEventListener('change', setActive);
  setActive();
}

/**
 * The hero transformation map ends where its line meets the hero arc. The arc is placed from the top right and the
 * line from the headline, so the meeting point depends on the window: measure it and hand it to CSS as --hit.
 * Runs whatever the motion setting, since it is layout, not animation. Without it the line ends at a resting
 * position and nothing is lost.
 */
function initHeroMap() {
  const map = document.querySelector<HTMLElement>('.tmap');
  const arc = document.querySelector<SVGSVGElement>('.hero .arc');
  const box = map?.querySelector<HTMLElement>('.inner');
  if (!map || !arc || !box) return;
  const shift = (el: Element) => {
    const t = getComputedStyle(el).translate;
    if (!t || t === 'none') return [0, 0];
    const [x = '0', y = '0'] = t.split(' ');
    return [parseFloat(x) || 0, parseFloat(y) || 0];
  };
  const place = () => {
    const [ax, ay] = shift(arc);
    const [mx, my] = shift(map);
    const a = arc.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const r = a.width * 0.4995;
    const cx = a.left - ax + a.width / 2;
    const cy = a.top - ay + a.height / 2;
    const y = b.bottom - my;
    const left = b.left - mx;
    const dy = y - cy;
    let hit = NaN;
    if (Math.abs(dy) < r) hit = cx - Math.sqrt(r * r - dy * dy) - left;
    // Only a meeting point well to the right of the turning point, inside the box, is used.
    const ok = hit > b.width * 0.55 && hit < b.width - 24;
    map.classList.toggle('on-arc', ok);
    if (ok) map.style.setProperty('--hit', `${hit.toFixed(1)}px`);
    else map.style.removeProperty('--hit');
    tidy(cx + mx, cy + my, r);
  };

  // Labels never collide and nothing crosses the arc: a caption that would is dropped, and the line keeps its
  // nodes in order of importance (systems goes first, then AI's label).
  const crosses = (el: Element, cx: number, cy: number, r: number) => {
    const q = el.getBoundingClientRect();
    if (!q.width) return false;
    const nx = Math.max(q.left, Math.min(cx, q.right));
    const ny = Math.max(q.top, Math.min(cy, q.bottom));
    const near = Math.hypot(nx - cx, ny - cy);
    const far = Math.max(
      ...[
        [q.left, q.top],
        [q.right, q.top],
        [q.left, q.bottom],
        [q.right, q.bottom],
      ].map(([x, y]) => Math.hypot(x - cx, y - cy)),
    );
    return near < r + 4 && far > r - 4;
  };
  const overlap = (a: Element, b: Element) => {
    const p = a.getBoundingClientRect();
    const q = b.getBoundingClientRect();
    return p.width > 0 && q.width > 0 && p.left < q.right + 14 && q.left < p.right + 14 && p.top < q.bottom && q.top < p.bottom;
  };
  const tidy = (cx: number, cy: number, r: number) => {
    map.querySelectorAll('.cut').forEach((el) => el.classList.remove('cut'));
    // The outcome's label never runs off the window: if it would, it moves above the circle, right-aligned.
    const end = map.querySelector('.end-lbl');
    map.classList.remove('end-above');
    if (end && end.getBoundingClientRect().right > document.documentElement.clientWidth - 8) map.classList.add('end-above');
    const capTo = map.querySelector('.cap-to');
    const marker = map.querySelector('.mark-turn');
    if (capTo && (crosses(capTo, cx, cy, r) || (marker && crosses(marker, cx, cy, r)))) {
      capTo.classList.add('cut');
      marker?.classList.add('cut');
    }
    const nodes = Array.from(map.querySelectorAll<HTMLElement>('.pt-node'));
    const endLabel = map.querySelector('.end-lbl');
    const label = (n: Element) => n.querySelector('.lbl');
    const clashes = (n: HTMLElement) => {
      const l = label(n);
      if (!l || n.classList.contains('cut') || l.classList.contains('cut')) return false;
      if (crosses(n, cx, cy, r) || crosses(l, cx, cy, r)) return true;
      if (endLabel && overlap(l, endLabel)) return true;
      return nodes.some((m) => m !== n && !m.classList.contains('cut') && label(m) && !label(m)!.classList.contains('cut') && overlap(l, label(m)!));
    };
    const [automation, ai, systems] = nodes;
    if (systems && clashes(systems)) systems.classList.add('cut');
    if (ai && clashes(ai)) label(ai)?.classList.add('cut');
    if (automation && clashes(automation)) label(automation)?.classList.add('cut');
  };
  let queued = false;
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      place();
    });
  };
  place();
  document.fonts?.ready.then(request);
  window.addEventListener('resize', request);
}

/**
 * The case-study cursor of Selected work: over a capture that links to a case study, a small circle with the link's
 * label follows the pointer. Pointer devices with motion allowed only; the capture stays an ordinary link, and the
 * text link beside it remains the accessible way in. Reads only pointer coordinates, never layout.
 */
function initCursor() {
  const section = document.querySelector<HTMLElement>('.work');
  const cursor = section?.querySelector<HTMLElement>('.cursor');
  if (!section || !cursor) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || !motionAllowed()) return;
  let x = 0;
  let y = 0;
  let queued = false;
  const move = (e: PointerEvent) => {
    x = e.clientX;
    y = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      cursor.style.setProperty('--px', `${x}px`);
      cursor.style.setProperty('--py', `${y}px`);
    });
  };
  section.querySelectorAll<HTMLElement>('.frame[href]').forEach((frame) => {
    frame.addEventListener('pointerenter', (e) => {
      move(e);
      section.classList.add('cursor-on');
    });
    frame.addEventListener('pointermove', (e) => {
      move(e);
      section.classList.add('cursor-on');
    });
    frame.addEventListener('pointerleave', () => section.classList.remove('cursor-on'));
  });
  // Scrolling under a still pointer: hide rather than leave the circle stranded.
  window.addEventListener('scroll', () => section.classList.remove('cursor-on'), { passive: true });
}

initHeroMap();
initReveals();
initCursor();
initHeader();
initScenes();
root.classList.add('mo-ready');
