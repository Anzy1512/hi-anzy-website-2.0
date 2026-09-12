import React, { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { MOTION_FEATURES, seeded } from "@/lib/motionFeatures";

/**
 * FEATURE 01 — Chaos → order, light DOM implementation.
 *
 * Items arrive slightly out of alignment — offset and rotated by a fixed,
 * deterministic amount — and resolve into an exact grid. That is the whole
 * effect, and it is chosen to mean something on the one page it is used on:
 * /who-we-work-with is a page about sorting, listing who fits and who does
 * not. Misalignment resolving into a grid is that page's argument, performed.
 *
 * Three decisions worth recording:
 *
 * 1. CSS transitions, not GSAP. The site's own `.reveal` is an
 *    IntersectionObserver adding a class to a CSS transition, and this is the
 *    same shape. Reusing the idiom means no second animation controller, no
 *    timeline to clean up, and the offsets stay declarative.
 * 2. Offsets are seeded, never random. The brief asks for controlled
 *    complexity rather than chaos; `Math.random` would rearrange the page on
 *    every reload, which reads as noise instead of as a system being ordered.
 * 3. It replaces `<Reveal>` on these tiles rather than nesting inside it.
 *    Running both would mean two transforms on one element fighting — the
 *    same conflict `.reveal` creates for anything that animates alongside it.
 *    Replacing the generic fade-up with content-specific choreography here is
 *    also the point: the brief explicitly warns against the same reveal
 *    everywhere.
 *
 * While still unresolved, the offset scales gently with `--scroll-v` from
 * ScrollVelocity, so scrolling in fast finds the section marginally more
 * unsettled. That is the only place scroll velocity is consumed today, and it
 * degrades to a plain multiplier of 1 whenever the variable is absent.
 */
export const OrderingGrid = ({ children, className = "", testId }) => {
  const ref = useRef(null);
  const items = React.Children.toArray(children);
  const reduced = prefersReducedMotion();
  const active = MOTION_FEATURES.orderingChoreography && !reduced;

  useEffect(() => {
    if (!active) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const settle = () => el.querySelectorAll(".order-item").forEach((n) => n.classList.add("is-ordered"));

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          settle();
          io.disconnect();
        }
      },
      // Matches useRevealObserver's own threshold so this section resolves on
      // the same scroll beat as everything else on the page.
      { threshold: 0.12 }
    );
    io.observe(el);

    // Same failsafe useRevealObserver carries: content must never be left
    // stranded at opacity 0 if the observer misbehaves.
    const failsafe = setTimeout(settle, 1600);

    return () => {
      clearTimeout(failsafe);
      io.disconnect();
    };
  }, [active]);

  // Reduced motion (or the feature switched off) renders the plain grid with
  // no wrappers at all — identical markup to before this component existed.
  if (!active) {
    return (
      <div className={className} ref={ref} data-testid={testId}>
        {items}
      </div>
    );
  }

  return (
    <div className={className} ref={ref} data-testid={testId}>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          className="order-item"
          style={{
            "--ox": `${(seeded(i, 1) * 2 - 1) * 22}px`,
            "--oy": `${(seeded(i, 3) * 2 - 1) * 14}px`,
            "--rot": `${(seeded(i, 7) * 2 - 1) * 2.2}deg`,
            // Row-aware stagger, matching the `(i % 3) * 70` convention the
            // existing reveal call sites already use.
            "--d": `${(i % 3) * 70}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default OrderingGrid;
