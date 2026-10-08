/**
 * Presentation only, never content. On narrow screens a very wide capture would shrink to an unreadable strip, so
 * ProjectMedia crops it to a readable frame and keeps this part of it (fractions of the image: left edge, top edge,
 * width). Projects not listed here are always shown whole.
 */
export const narrowCrops: Record<string, { x: number; y: number; w: number }> = {
  // The Rocketeer dashboard (2.7:1): the page title, the first summary cards and the start of the request list.
  rocketeer: { x: 0.415, y: 0, w: 0.31 },
};
