import { useEffect } from "react";
import { subscribeScroll, prefersReducedMotion } from "@/lib/motion";
import { MOTION_FEATURES } from "@/lib/motionFeatures";

/**
 * FEATURE 13 — Scroll velocity response.
 *
 * Publishes two custom properties on <html> and nothing else:
 *
 *   --scroll-v    0 → 1, how fast the page is currently moving
 *   --scroll-dir  1 down, -1 up
 *
 * It changes no existing element's appearance on its own. Consumers opt in by
 * reading the variable, which keeps the blast radius at zero: delete this
 * component and every consumer simply falls back to its `var(--scroll-v, 0)`
 * default, i.e. the neutral resting state the site already has.
 *
 * Three deliberate constraints:
 *
 * 1. It adds no scroll listener. lib/motion.js's subscribeScroll is already
 *    documented as the single source of truth — it prefers Lenis's own
 *    interpolated value, so reading window.scrollY here instead would land a
 *    frame behind everything else and drift.
 * 2. No React state, so nothing in the tree re-renders while scrolling. The
 *    only per-frame write is one setProperty on the root element.
 * 3. The rAF loop is not permanent. It starts when movement begins and stops
 *    itself once the value has decayed to rest, so an idle page runs no
 *    animation frames at all.
 *
 * Velocity is intentionally capped and eased. The brief's prohibition — no
 * shake, no blur, no spin, no interference with actual scroll speed — is why
 * this only ever exposes a number for decorative depth to lean on.
 */

/** px/ms treated as "full speed". A brisk flick sits near 2; anything above saturates. */
const MAX_SPEED = 2.2;
/** Per-frame decay of the target, so stopping returns to neutral on its own. */
const DECAY = 0.9;
/** How quickly the published value chases the target. Lower = smoother. */
const LERP = 0.16;

export const ScrollVelocity = () => {
  useEffect(() => {
    if (!MOTION_FEATURES.scrollVelocity) return undefined;
    // Reduced motion opts out entirely: the variable stays absent and every
    // consumer's var() fallback resolves to the neutral value.
    if (prefersReducedMotion()) return undefined;

    const root = document.documentElement;
    let current = 0;
    let target = 0;
    let raf = 0;
    let lastY = null;
    let lastT = 0;

    const write = (v) => root.style.setProperty("--scroll-v", v.toFixed(3));

    const tick = () => {
      raf = 0;
      target *= DECAY;
      current += (target - current) * LERP;
      if (current < 0.002 && target < 0.002) {
        // Settled. Park at exactly neutral and stop burning frames.
        current = 0;
        write(0);
        return;
      }
      write(current);
      raf = requestAnimationFrame(tick);
    };

    const unsubscribe = subscribeScroll((y) => {
      const now = performance.now();
      if (lastY === null) {
        lastY = y;
        lastT = now;
        return;
      }
      const dt = now - lastT;
      // Guard the first frame after a tab regains focus, where dt can be huge
      // and the resulting speed meaningless.
      if (dt > 0 && dt < 200) {
        const dy = y - lastY;
        const speed = Math.min(Math.abs(dy) / dt / MAX_SPEED, 1);
        if (speed > target) target = speed;
        if (dy !== 0) root.style.setProperty("--scroll-dir", dy > 0 ? "1" : "-1");
      }
      lastY = y;
      lastT = now;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    return () => {
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
      // Leave the document exactly as found, so an unmount (or a disabled
      // flag on the next mount) cannot strand a stale value.
      root.style.removeProperty("--scroll-v");
      root.style.removeProperty("--scroll-dir");
    };
  }, []);

  return null;
};

export default ScrollVelocity;
