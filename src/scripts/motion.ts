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
 * Scroll-linked geometry (the hero arc, the edge into Selected work, the Intelligence field, the Evolution arc and
 * the closing circle) is CSS: a scroll-driven timeline where the browser supports one, and otherwise a timed
 * sequence started by the same `.in` class. Nothing here intercepts, smooths or snaps scrolling.
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
      root.classList.remove('mo');
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

initReveals();
initHeader();
root.classList.add('mo-ready');
