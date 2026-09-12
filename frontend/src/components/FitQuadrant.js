import React, { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Where we are actually useful, as a diagram.
 *
 * The "small filter" panel lists what makes a project go badly and sat alone
 * with the right half of the section empty. This is its counterweight: the two
 * things that decide whether the work lands, plotted against each other.
 *
 * Deliberately no percentages. An infographic here could easily have been four
 * invented statistics with a progress bar each, which would look like evidence
 * while being nothing of the sort. Two axes and four honest labels say more.
 */
const QUADRANTS = [
  { id: "not-yet", x: 0, y: 0, label: "Too early", note: "Neither the problem nor the appetite has arrived yet." },
  { id: "shelf", x: 1, y: 0, label: "A report nobody acts on", note: "The diagnosis is right. Nothing changes." },
  { id: "motion", x: 0, y: 1, label: "Motion without direction", note: "Plenty of energy, aimed at the wrong thing." },
  { id: "good", x: 1, y: 1, label: "This is the good one", note: "Clear problem, real appetite. This is where we earn our fee." },
];

export const FitQuadrant = ({ className = "", testId = "fit-quadrant" }) => {
  const wrapRef = useRef(null);
  const [lit, setLit] = useState(prefersReducedMotion());

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || prefersReducedMotion()) return undefined;

    let on = false;
    const st = gsap.to(
      {},
      {
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 82%",
          end: "bottom 55%",
          scrub: 0.5,
          onUpdate: (self) => {
            const next = self.progress > 0.42;
            if (next !== on) {
              on = next;
              setLit(next);
            }
          },
          onRefresh: (self) => {
            const next = self.progress > 0.42;
            if (next !== on) {
              on = next;
              setLit(next);
            }
          },
        },
      }
    );
    return () => {
      st.scrollTrigger && st.scrollTrigger.kill();
      st.kill();
    };
  }, []);

  return (
    <figure ref={wrapRef} className={className} data-testid={testId} data-lit={lit ? "true" : "false"}>
      <p className="sys-chip text-[#232A2A]/55">WHERE WE ARE USEFUL</p>

      <div className="fit-grid mt-4">
        {[QUADRANTS[2], QUADRANTS[3], QUADRANTS[0], QUADRANTS[1]].map((q) => {
          const good = q.id === "good";
          return (
            <div
              key={q.id}
              className={`fit-cell ${good ? "fit-cell--good" : ""} ${good && lit ? "is-lit" : ""}`}
              data-testid={`${testId}-${q.id}`}
            >
              <p className={`font-display text-[17px] leading-[1.15] ${good ? "text-[#F7F5EE]" : "text-[#232A2A]/85"}`}>
                {q.label}
              </p>
              <p className={`font-mono-sys mt-1.5 text-[12.5px] leading-[1.4] ${good ? "text-[#F7F5EE]/75" : "text-[#232A2A]/60"}`}>
                {q.note}
              </p>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-3 flex items-center justify-between gap-4">
        <span className="font-mono-sys text-[12.5px] text-[#232A2A]/55">
          → Problem is clear
        </span>
        <span className="font-mono-sys text-[12.5px] text-[#232A2A]/55">
          ↑ Appetite to change
        </span>
      </figcaption>
    </figure>
  );
};
