import React, { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * A scroll-scrubbed rule that fills left to right, with a counter that ticks
 * up as it goes. Used to bridge two blocks that would otherwise sit as a hard
 * cut — the fill gives the eye something to follow across the gap instead of
 * a band of empty paper.
 *
 * The count is driven from the same scrub progress as the fill so the two can
 * never disagree. Reduced motion renders it complete and static.
 */
export const ProgressRule = ({
  total = 9,
  label = "",
  trailing = "",
  className = "",
  testId = "progress-rule",
}) => {
  const wrapRef = useRef(null);
  const fillRef = useRef(null);
  const dotRef = useRef(null);
  const [count, setCount] = useState(prefersReducedMotion() ? total : 0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const fill = fillRef.current;
    const dot = dotRef.current;
    if (!wrap || !fill || !dot) return undefined;

    if (prefersReducedMotion()) {
      fill.style.transform = "scaleX(1)";
      dot.style.left = "100%";
      return undefined;
    }

    // The bar is written straight to the DOM so it stays smooth; only the
    // counter goes through React, and only when the integer actually moves.
    let shown = -1;
    const apply = (p) => {
      const clamped = Math.max(0, Math.min(1, p));
      fill.style.transform = `scaleX(${clamped.toFixed(4)})`;
      dot.style.left = `${(clamped * 100).toFixed(2)}%`;
      dot.style.opacity = clamped > 0.02 ? "1" : "0";
      const next = Math.round(clamped * total);
      if (next === shown) return;
      shown = next;
      setCount(next);
    };

    const st = gsap.to(
      {},
      {
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 88%",
          end: "top 42%",
          scrub: 0.5,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        },
      }
    );

    return () => {
      st.scrollTrigger && st.scrollTrigger.kill();
      st.kill();
    };
  }, [total]);

  return (
    <div ref={wrapRef} className={`py-8 ${className}`} data-testid={testId}>
      <div className="flex items-center gap-4">
        {label && (
          <span className="sys-chip shrink-0 text-[#232A2A]/55">{label}</span>
        )}
        <div className="relative h-[3px] flex-1 rounded-full bg-[#232A2A]/12">
          <span
            ref={fillRef}
            className="absolute inset-0 origin-left rounded-full bg-[#F19020]"
            style={{ transform: "scaleX(0)", willChange: "transform" }}
            aria-hidden="true"
          />
          <span
            ref={dotRef}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F19020] bg-[#E0D8C1]"
            style={{ left: "0%", opacity: 0, willChange: "left" }}
            aria-hidden="true"
          />
        </div>
        <span className="font-mono-sys shrink-0 text-[12.5px] tabular-nums text-[#232A2A]/55">
          {String(count).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
      {trailing && (
        <p className="font-mono-sys mt-3 text-[12.5px] text-[#232A2A]/50">{trailing}</p>
      )}
    </div>
  );
};
