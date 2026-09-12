/**
 * Phase 2 motion system — shared configuration and helpers.
 *
 * Deliberately a *separate* module from lib/motion.js. That file is the
 * site's existing motion infrastructure (GSAP + ScrollTrigger registration,
 * Lenis, subscribeScroll, useRevealObserver) and is treated as locked: ~35
 * files depend on it and a change there has sitewide blast radius. Everything
 * added in Phase 2 lives here instead and *consumes* that file rather than
 * modifying or competing with it.
 *
 * There is no second scroll library, no second cursor engine, no second
 * animation controller. GSAP is already the house tool and Lenis is already
 * the scroller; new work uses both through lib/motion.js's exports.
 */
import { useEffect, useState } from "react";

/**
 * Central enable/disable for every optional Phase 2 effect.
 *
 * The point of this object is deletion, not configuration: each flag maps to
 * exactly one self-contained component, and setting any of them to false must
 * leave the site working exactly as it did before Phase 2. Nothing here is
 * load-bearing for content, layout, routing or conversion.
 */
export const MOTION_FEATURES = {
  /** Publishes --scroll-v / --scroll-dir. Feature 13. */
  scrollVelocity: true,
  /** Desktop-only cursor affordance over draggable/explorable surfaces. Feature 09. */
  contextualCursor: true,
  /** "Controlled complexity resolves into order" entrance. Feature 01, light. */
  orderingChoreography: true,
};

/**
 * The site's existing easing signature, read off App.css's own `.reveal`
 * rule and OrbitSection's Framer transition rather than chosen fresh.
 * Reusing it is what keeps new motion feeling like the same website.
 */
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Timing bands, also derived from what already ships:
 * `.reveal` runs 800ms, MagneticButton's pull settles in 250ms.
 */
export const DURATION = {
  micro: 0.25,
  ui: 0.4,
  reveal: 0.8,
};

/**
 * True only for devices with a precise pointer and hover — i.e. a real
 * mouse/trackpad. Anything coarse (touch) must never receive cursor or
 * pointer-proximity effects; they cost battery and buy nothing.
 *
 * Live, not a one-time read: a hybrid laptop can gain or lose a mouse, and
 * this mirrors how PinnedSequence already re-evaluates its own matchMedia.
 */
export const usePointerFine = () => {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return fine;
};

/**
 * Deterministic 0..1 from an index — the same value on every render, on
 * every machine, on every reload.
 *
 * Feature 01 asks for "controlled complexity, not random chaos". Math.random
 * would make each visit's starting arrangement different and each reload's
 * layout unrepeatable, which reads as noise rather than as a system being
 * ordered. A hash keeps the arrangement intentional and debuggable.
 */
export const seeded = (i, salt = 1) => {
  const n = Math.sin((i + 1) * 12.9898 * salt) * 43758.5453;
  return n - Math.floor(n);
};
