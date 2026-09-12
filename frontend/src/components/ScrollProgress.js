import React, { useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/motion";

/**
 * Scroll-synced route line — the brand's orange route travels along the top
 * of the viewport as the visitor moves through the page. rAF-throttled,
 * animates transform only.
 */
export const ScrollProgress = () => {
  const barRef = useRef(null);
  useEffect(
    () =>
      subscribeScroll((scroll, limit) => {
        const el = barRef.current;
        if (!el) return;
        const p = limit > 0 ? Math.min(Math.max(scroll / limit, 0), 1) : 0;
        el.style.transform = `scaleX(${p})`;
      }),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
      <div
        ref={barRef}
        data-testid="scroll-progress-bar"
        className="h-full w-full origin-left bg-[#F19020]"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
};
