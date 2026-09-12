import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { MOTION_FEATURES, usePointerFine, EASE_CSS, DURATION } from "@/lib/motionFeatures";

/**
 * FEATURE 09 — Contextual cursor.
 *
 * Deliberately *not* a cursor replacement. The native cursor is never hidden;
 * this adds a small label that trails it only while the pointer is over a
 * surface whose interaction is genuinely non-obvious. Two consequences worth
 * stating plainly:
 *
 *  - Nothing is lost if this fails. A replacement cursor that crashes leaves a
 *    visitor with no pointer at all on a conversion-critical site. An additive
 *    chip that crashes leaves the site exactly as it is today.
 *  - It cannot obstruct a click. The layer is pointer-events:none and offset
 *    away from the hotspot.
 *
 * Restraint is the whole design. The site has two interactions a first-time
 * visitor cannot see: the Orbit deck and the case/insight carousels are
 * draggable, and the network constellation is explorable. Those are the only
 * things labelled. Putting a "VIEW" bubble on every link would be decoration,
 * and the brief's own test — does it communicate something? — says remove it.
 *
 * The target map lives here, keyed on data-testid attributes that already
 * exist in the markup. That is the reason this feature touches no other file:
 * EvidenceDeck, CardCarousel and Network are all locked, and none of them
 * needed to change to support this.
 */

/** Existing, stable selectors → the affordance they should announce. */
const TARGETS = [
  { selector: '[data-testid="orbit-deck"]', label: "DRAG" },
  { selector: '[data-testid$="-carousel-track"]', label: "DRAG" },
  { selector: '[data-testid="network-constellation-frame"]', label: "EXPLORE" },
  { selector: '[data-testid="network-constellation-fullscreen"]', label: "EXPLORE" },
];

/** Distance from the true pointer position, so the chip never covers the hotspot. */
const OFFSET = { x: 20, y: 20 };

export const ContextualCursor = () => {
  const fine = usePointerFine();
  const { pathname } = useLocation();
  const elRef = useRef(null);
  const [label, setLabel] = useState(null);
  // Mirrors `label` for use inside the pointer handler without making the
  // handler depend on it — the listener is attached once, not per label change.
  const labelRef = useRef(null);

  const enabled = MOTION_FEATURES.contextualCursor && fine && !prefersReducedMotion();

  // A route change can swap the element out from under the pointer without a
  // pointerleave ever firing, which would strand the chip on the next page.
  useEffect(() => {
    labelRef.current = null;
    setLabel(null);
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = elRef.current;
    if (!el) return undefined;

    // quickTo keeps the follow on GSAP's existing ticker rather than adding a
    // second rAF loop, and writes transforms directly — no React render is
    // involved in movement at any point.
    const xTo = gsap.quickTo(el, "x", { duration: 0.34, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.34, ease: "power3.out" });

    let raf = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      xTo(px + OFFSET.x);
      yTo(py + OFFSET.y);
    };

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);

      const t = e.target;
      // pointermove can report non-Element targets; closest() only exists on Element.
      const next =
        t && typeof t.closest === "function"
          ? TARGETS.find((x) => t.closest(x.selector))?.label ?? null
          : null;

      if (next !== labelRef.current) {
        labelRef.current = next;
        setLabel(next);
      }
    };

    // Leaving the window entirely must clear the chip, or it freezes mid-screen.
    const onOut = (e) => {
      if (e.relatedTarget === null && labelRef.current !== null) {
        labelRef.current = null;
        setLabel(null);
      }
    };
    const onBlur = () => {
      if (labelRef.current !== null) {
        labelRef.current = null;
        setLabel(null);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onBlur);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf(el);
    };
  }, [enabled]);

  if (!enabled) return null;

  /**
   * Two nested elements on purpose, and it is not cosmetic.
   *
   * GSAP's quickTo owns `transform` on the outer element for position. An
   * appearance tween on that *same* element fights those tweens — the first
   * build of this drove opacity with gsap autoAlpha and the chip stayed
   * visible-but-empty over plain content, because the competing tweens
   * overwrote each other. Splitting the responsibilities removes the conflict
   * by construction: GSAP moves the outer, CSS fades the inner, neither ever
   * touches the other's property.
   *
   * It is the same rule the sitewide `.reveal` class forces — it owns
   * transform on its own element, so anything else animating has to use an
   * inner wrapper.
   */
  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] select-none"
      style={{ willChange: "transform" }}
      data-testid="contextual-cursor"
    >
      <div
        className={`rounded-full border border-[#F19020] bg-[#232A2A] px-2.5 py-1 ${label ? "opacity-100" : "opacity-0"}`}
        style={{
          transform: label ? "scale(1)" : "scale(0.7)",
          transition: `opacity ${DURATION.micro}s ${EASE_CSS}, transform ${DURATION.micro}s ${EASE_CSS}`,
        }}
      >
        <span className="font-mono-sys text-[10.5px] font-bold tracking-[0.14em] text-[#F7F5EE]">{label}</span>
      </div>
    </div>
  );
};

export default ContextualCursor;
