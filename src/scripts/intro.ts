/**
 * The first-visit homepage intro: the symbol flies to the header and resolves into the typographic name
 * (docs/design/motion-system.md, section 14).
 *
 * A homepage-only head script in BaseLayout decides eligibility before first paint and adds `html.intro` (the overlay
 * shows) and `html.intro-hold` (the hero's entrance waits). The first part of the choreography is CSS in Intro.astro
 * and runs from first paint. This module adds the part only a script can do, placed on the same timeline as soon as it
 * starts, so the compositor plays it on time even while the main thread is busy:
 *
 *   2.0 s  the symbol flies to the measured centre of the header name, shrinking to the name's cap height
 *   2.3 s  the name appears, in Sheet, on the blue
 *   2.52 s the symbol dissolves into the name
 *   2.6 s  the overlay fades out, the navigation appears, the hero entrance starts; the name turns Ink mid-fade
 *   3.0 s  finishIntro(): every temporary class, animation and listener is gone
 *
 * Any input (key, pointer, wheel, scroll, focus), a resize to another width, leaving the page, or a switch to reduced
 * motion ends it at once, through finishIntro(). Nothing is prevented or trapped: the input still does what it does.
 * Fail-safes: the head script ends the intro if this module has not started it within 2.5 s; this module ends it
 * 3.6 s after the overlay's first frame (or 4.5 s after its own start, if that frame is never found), and on any error.
 */

export {};

type Timeline = { currentTime: CSSNumberish | null };

const root = document.documentElement;
const FLIGHT_AT = 2000;
const FLIGHT_MS = 600;
const NAME_AT = 2300;
const DISSOLVE_AT = 2520;
const OUT_AT = 2600;
const END_AT = 3000;
const LIMIT = 3600;
/** Fallback limit from this module's start, for the case where the overlay's first frame cannot be found. */
const LIMIT_FROM_START = 4500;
/**
 * When the name changes from Sheet to Ink: the moment the fading overlay (400 ms, the Shift curve) leaves a background
 * exactly between the two, about 4.3:1 against either. A gradual change would pass through a grey that matches the
 * background and disappear for a few frames; a switch at this point never drops below that ratio.
 */
const INK_AT = OUT_AT + 167;
/** The symbol lands this many times the name's cap height wide: a mark the size of a capital pair. */
const LAND = 1.6;
/** Arriving after this point, the script ends the intro instead of starting a flight that would overrun 3.2 s. */
const LATEST_START = 2600;

const now = () => Number((document.timeline as Timeline).currentTime ?? performance.now());

/** Where the letters of the header name are, not its padded link box: centre of the capitals, and their height. */
function measureName(name: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(name);
  const box = range.getBoundingClientRect();
  const cs = getComputedStyle(name);
  const size = parseFloat(cs.fontSize) || 16;
  const tracking = parseFloat(cs.letterSpacing) || 0;
  // The range box ends after the last letter's tracking, which is space, not ink.
  const cx = box.left + (box.width - tracking) / 2;
  let capHeight = size * 0.7;
  let cy = box.top + box.height / 2;
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) {
    ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const m = ctx.measureText(name.textContent ?? '');
    if (m.actualBoundingBoxAscent > 0 && m.fontBoundingBoxAscent > 0) {
      // The range box is the font's content area, so the baseline sits one font ascent below its top.
      capHeight = m.actualBoundingBoxAscent;
      cy = box.top + m.fontBoundingBoxAscent - capHeight / 2;
    }
  }
  return { cx, cy, capHeight };
}

function start() {
  const overlay = document.querySelector<HTMLElement>('div[data-intro]');
  const mark = overlay?.querySelector<HTMLElement>('[data-intro-mark]');
  const header = document.querySelector<HTMLElement>('.site-header');
  // Only the header's own name. The menu dialog has a second .site-name, which is never the destination.
  const name = header?.querySelector<HTMLElement>(':scope > .site-name');
  const chrome = header ? Array.from(header.querySelectorAll<HTMLElement>(':scope > .site-nav, :scope > .util')) : [];

  const anims: Animation[] = [];
  const timers: number[] = [];
  const listening = new AbortController();
  let done = false;

  // The one way out. Safe to call at any moment and any number of times.
  const finishIntro = () => {
    if (done) return;
    done = true;
    listening.abort();
    timers.forEach((t) => clearTimeout(t));
    root.classList.remove('intro', 'intro-hold', 'intro-live');
    for (const a of anims) {
      try {
        a.cancel();
      } catch {
        /* already gone */
      }
    }
    // The overlay stays in the document, hidden: a pointer press that skipped it keeps a target, so the release
    // cannot turn into a click on the page underneath.
  };
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, Math.max(0, ms)));

  if (!overlay || !mark || !header || !name) return finishIntro();
  root.classList.add('intro-live');
  later(finishIntro, LIMIT_FROM_START);

  // ---- Skip on any input. Passive and never prevented: the key, press or scroll still does its normal job.
  const opts = { capture: true, passive: true, signal: listening.signal } as const;
  for (const type of ['keydown', 'pointerdown', 'wheel', 'touchstart', 'focusin'] as const) {
    window.addEventListener(type, finishIntro, opts);
  }
  window.addEventListener('scroll', () => window.scrollY > 2 && finishIntro(), opts);
  window.addEventListener('pagehide', finishIntro, opts);
  document.addEventListener('visibilitychange', () => document.hidden && finishIntro(), opts);
  // A width change moves the destination. A height change alone (a mobile address bar) does not.
  const width = window.innerWidth;
  window.addEventListener('resize', () => window.innerWidth !== width && finishIntro(), opts);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduce.addEventListener('change', (e) => e.matches && finishIntro(), { signal: listening.signal });
  if (reduce.matches || window.scrollY > 2) return finishIntro();

  // ---- Find the moment the overlay first rendered: the start of the ring's CSS animation.
  const ring = overlay.querySelector('.ring circle');
  const drawn = ring?.getAnimations().find((a) => (a as CSSAnimation).animationName === 'intro-draw');
  const ready = drawn ? drawn.ready.then(() => Number(drawn.startTime ?? now())) : Promise.resolve(now());

  ready
    .then((origin) => {
      if (done) return;
      if (now() - origin > LATEST_START) return finishIntro();
      schedule(origin);
    })
    .catch(finishIntro);

  /** Where the symbol must go: from its resting place in the circle to the centre of the name's capitals. */
  function flightTo() {
    const to = measureName(name!);
    const from = mark!.getBoundingClientRect();
    const dx = to.cx - (from.left + from.width / 2);
    const dy = to.cy - (from.top + from.height / 2);
    const scale = (to.capHeight * LAND) / from.width;
    return [{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }];
  }

  // Every animation is placed on the document timeline now, at its time from the overlay's first frame. Transform and
  // opacity then run on the compositor, so a main thread still busy with the page's first layout (a slow phone)
  // cannot delay the flight or stretch the intro. Only the name's colour step and the class changes need the main
  // thread. Just before the flight, the destination is measured again and the flight updated, in case the font or the
  // layout moved the name since.
  function schedule(origin: number) {
    try {
      // A late start: shift the timeline so the flight still starts whole, 100 ms from now.
      const base = Math.max(origin, now() - FLIGHT_AT + 100);
      const ink = getComputedStyle(header!).color;
      // The name's own colour now: Sheet, from the intro rules in Intro.astro.
      const sheet = getComputedStyle(name!).color;
      const play = (el: Element, frames: Keyframe[], delay: number, duration: number, easing = 'linear') => {
        const a = el.animate(frames, { delay, duration, easing, fill: 'both' });
        a.startTime = base;
        anims.push(a);
        a.finished.catch(() => undefined);
        return a;
      };
      const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
      const flight = play(mark!, flightTo(), FLIGHT_AT, FLIGHT_MS, 'cubic-bezier(0.55, 0, 0.75, 0)');
      play(mark!, [{ opacity: 1 }, { opacity: 0 }], DISSOLVE_AT, 240, ease);
      play(name!, [{ opacity: 0 }, { opacity: 1 }], NAME_AT, 200, ease);
      play(name!, [{ color: sheet }, { color: ink }], INK_AT, 1);
      for (const el of chrome) play(el, [{ opacity: 0 }, { opacity: 1 }], OUT_AT, 400, ease);
      const fade = play(overlay!, [{ opacity: 1 }, { opacity: 0 }], OUT_AT, 400, ease);

      const at = (ms: number) => base + ms - now();
      later(() => {
        if (done || now() - base > FLIGHT_AT) return;
        // Bounded: the name's font if it is still on its way, never more than 60 ms.
        Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 60))])
          .catch(() => undefined)
          .then(() => {
            if (!done && now() - base < FLIGHT_AT) (flight.effect as KeyframeEffect).setKeyframes(flightTo());
          });
      }, at(FLIGHT_AT - 120));
      // The hero entrance starts as the overlay begins to clear, so it is seen from its first frame.
      later(() => root.classList.remove('intro-hold'), at(OUT_AT));
      later(finishIntro, at(END_AT));
      later(finishIntro, at(LIMIT));
      fade.finished.then(finishIntro, () => undefined);
    } catch {
      finishIntro();
    }
  }
}

if (root.classList.contains('intro')) {
  try {
    start();
  } catch {
    root.classList.remove('intro', 'intro-hold', 'intro-live');
  }
}

// Restored from the back/forward cache: the intro never resumes.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) root.classList.remove('intro', 'intro-hold', 'intro-live');
});
