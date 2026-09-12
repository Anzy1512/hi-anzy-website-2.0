import React, { useEffect, useRef } from "react";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/motion";

/**
 * Scroll-drawn connector between landing-page sections.
 *
 * The route draws itself as you scroll and a signal node travels along it, so
 * the sections read as one continuous system rather than stacked slabs. Depth
 * comes from a CSS 3D transform rather than another WebGL context — Home
 * already runs three canvases and a fourth is not worth the frame budget.
 *
 * Hidden below `lg` and flattened for reduced motion: on a small screen the
 * connector would compete with the content it is supposed to join.
 */

const PATHS = {
  // viewBox 0 0 100 100, non-uniform scaled — tuned to read as a lane change
  right: "M 18 0 C 18 26, 82 32, 82 56 C 82 78, 34 78, 34 100",
  left: "M 82 0 C 82 26, 18 32, 18 56 C 18 78, 66 78, 66 100",
  centre: "M 50 0 C 50 30, 26 38, 34 60 C 42 82, 62 76, 62 100",
};

export const SectionConnector = ({
  variant = "right",
  height = 160,
  label,
  testId = "section-connector",
}) => {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    const node = nodeRef.current;
    if (!wrap || !path) return undefined;

    const length = path.getTotalLength();

    if (prefersReducedMotion()) {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      if (node) node.style.opacity = "0";
      return undefined;
    }

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top 92%",
      end: "bottom 55%",
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;
        path.style.strokeDashoffset = `${length * (1 - p)}`;
        if (!node) return;
        const point = path.getPointAtLength(length * p);
        node.setAttribute("cx", point.x);
        node.setAttribute("cy", point.y);
        node.style.opacity = p > 0.03 && p < 0.97 ? "1" : "0";
      },
    });

    return () => trigger.kill();
  }, [variant]);

  return (
    <div
      ref={wrapRef}
      className="section-connector container-page hidden lg:block"
      style={{ height }}
      data-testid={testId}
      aria-hidden="true"
    >
      <div className="section-connector-stage">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" focusable="false">
          <path
            ref={pathRef}
            d={PATHS[variant] || PATHS.right}
            fill="none"
            stroke="#F19020"
            strokeWidth="0.7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            ref={nodeRef}
            r="1.15"
            fill="#E54A25"
            style={{ opacity: 0, transition: "opacity 0.3s ease" }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {label && <span className="section-connector-label sys-chip">{label}</span>}
      </div>
    </div>
  );
};
