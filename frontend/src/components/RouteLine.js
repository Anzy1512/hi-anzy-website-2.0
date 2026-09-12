import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * The signature orange route. An SVG path that draws itself as the user scrolls.
 * Reduced motion: rendered fully drawn.
 */
export const RouteLine = ({ d, viewBox = "0 0 100 100", className = "", strokeWidth = 6, dotted = false, preserveAspectRatio = "none", start = "top 80%", end = "bottom 40%" }) => {
  const pathRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return undefined;
    const len = path.getTotalLength();
    if (prefersReducedMotion()) {
      path.style.strokeDasharray = dotted ? "0.1 12" : "none";
      return undefined;
    }
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: svgRef.current, start, end, scrub: 0.6 },
    });
    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [d, dotted, start, end]);

  return (
    <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true" focusable="false">
      <path ref={pathRef} d={d} fill="none" stroke="#F19020" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
