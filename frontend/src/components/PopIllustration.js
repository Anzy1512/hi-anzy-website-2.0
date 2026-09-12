import React, { useEffect, useRef } from "react";
import { ScrollTrigger, prefersReducedMotion, subscribeScroll } from "@/lib/motion";
import { Picture } from "@/components/Picture";

/**
 * Animated pop illustration — the deck's halftone collage figures, brought in
 * on scroll.
 *
 * Three layers of motion, and deliberately three separate DOM nodes:
 *
 *   .pop-illustration        parallax drift   (scroll subscriber)
 *     .pop-illustration-lift entrance         (ScrollTrigger)
 *       .pop-illustration-figure  idle float  (CSS keyframes)
 *
 * They each own exactly one transform on one node. An earlier version had the
 * drift and the entrance writing the same `transform` from a shared variable,
 * so whichever fired last clobbered the other — the figures ended up stuck at
 * opacity 0 once you scrolled past them. Splitting the nodes makes that class
 * of bug structurally impossible rather than merely fixed.
 *
 * All transform/opacity, so it composites on the GPU and never triggers layout.
 * Decorative by definition: aria-hidden, desktop-only, fully resolved under
 * reduced motion.
 */
export const PopIllustration = ({
  src,
  alt = "",
  className = "",
  width = 300,
  rotate = -3,
  drift = 26,
  halo = true,
  flip = false,
  testId = "pop-illustration",
}) => {
  const wrapRef = useRef(null);
  const liftRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const lift = liftRef.current;
    if (!wrap || !lift) return undefined;

    if (prefersReducedMotion()) {
      lift.style.opacity = "1";
      lift.style.transform = `rotate(${rotate}deg)`;
      return undefined;
    }

    const applyEntrance = (p) => {
      const scale = 0.88 + 0.12 * p;
      const y = (1 - p) * 34;
      lift.style.opacity = String(Math.min(1, p * 1.25));
      lift.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${(rotate * p).toFixed(2)}deg)`;
    };

    applyEntrance(0);

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top 92%",
      end: "top 45%",
      scrub: 0.5,
      onUpdate: (self) => applyEntrance(self.progress),
      // fires on refresh too, so a figure already scrolled past starts resolved
      onRefresh: (self) => applyEntrance(self.progress),
    });

    // Drift lives on the wrapper — a different node, a different transform.
    const unsubscribe = subscribeScroll(() => {
      const r = wrap.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      const centred = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      wrap.style.transform = `translate3d(0, ${(-centred * drift).toFixed(2)}px, 0)`;
    });

    return () => {
      trigger.kill();
      unsubscribe();
    };
  }, [src, rotate, drift]);

  return (
    <div
      ref={wrapRef}
      className={`pop-illustration hidden lg:block ${className}`}
      style={{ width, willChange: "transform" }}
      data-testid={testId}
      aria-hidden="true"
    >
      <div ref={liftRef} className="pop-illustration-lift" style={{ willChange: "transform, opacity" }}>
        <div className="pop-illustration-figure">
          {halo && <span className="pop-illustration-halo" aria-hidden="true" />}
          <Picture
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="pop-illustration-img"
            style={flip ? { transform: "scaleX(-1)" } : undefined}
          />
        </div>
      </div>
    </div>
  );
};
