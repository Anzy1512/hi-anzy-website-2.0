import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The shape every case study on this page follows, drawn as a spine.
 *
 * The hero copy already promises it — "situation, gap, insight, decision,
 * build, result, and what happened next" — but promises it in a sentence,
 * where seven items in a row are hard to hold. The right-hand column of that
 * hero was empty, so the sentence gets a diagram: same seven steps, same
 * order, filling in one at a time.
 *
 * The fill is a staggered entrance rather than a scroll scrub. This sits in a
 * hero, above the fold, so there is almost no scroll distance between the
 * trigger starting and ending — scrubbed, it arrived already complete and the
 * sequence never read as a sequence. It plays once when it comes into view.
 *
 * Steps are passed in rather than duplicated here, so this cannot drift out
 * of sync with the sections the case cards actually render.
 */
export const CaseAnatomy = ({ steps = [], className = "", testId = "case-anatomy" }) => {
  const wrapRef = useRef(null);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || steps.length === 0) return undefined;

    if (prefersReducedMotion()) {
      setReached(steps.length);
      return undefined;
    }

    let timers = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        for (let i = 1; i <= steps.length; i += 1) {
          timers.push(window.setTimeout(() => setReached(i), 90 + i * 140));
        }
      },
      { threshold: 0.3 }
    );
    io.observe(wrap);

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
  }, [steps.length]);

  if (steps.length === 0) return null;

  return (
    <figure ref={wrapRef} className={className} data-testid={testId}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="sys-chip text-[#232A2A]/55">HOW EVERY CASE READS</p>
        <span className="font-mono-sys text-[12.5px] tabular-nums text-[#232A2A]/50">
          {String(Math.min(reached, steps.length)).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
      </div>

      <ol className="case-spine mt-5">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={`case-spine-step ${i < reached ? "is-reached" : ""}`}
            data-testid={`${testId}-step-${s.key}`}
          >
            <span className="case-spine-dot" aria-hidden="true" />
            <span className="font-mono-sys case-spine-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="case-spine-label font-display">{s.label}</span>
          </li>
        ))}
      </ol>

      <figcaption className="font-mono-sys mt-4 text-[12.5px] leading-[1.5] text-[#232A2A]/60">
        Same order every time. The boring part is the point: it is what makes
        two cases comparable.
      </figcaption>
    </figure>
  );
};
