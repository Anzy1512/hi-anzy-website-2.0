import React from "react";

/**
 * A compact visual explanation of the method. It shares the sequence's active
 * index, so the map completes as the pinned section advances instead of
 * becoming a decorative card that sits still beside the copy.
 */
export const SequenceInfographic = ({ steps = [], active = 0, testId = "sequence-infographic" }) => {
  if (steps.length === 0) return null;

  const current = Math.max(0, Math.min(active, steps.length - 1));
  const stage = steps[current];
  const next = steps[current + 1];
  const pointCount = Math.max(steps.length - 1, 1);
  const progress = current / pointCount;
  const pathLength = 560;

  return (
    <figure
      className="sequence-infographic relative mt-7 overflow-hidden rounded-[18px] border border-[#F7F5EE]/15 bg-[#111818]/70 p-5 sm:p-6"
      data-testid={testId}
      aria-label="The five-stage handoff map"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(247,245,238,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(247,245,238,.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(135deg, black, transparent 76%)",
          WebkitMaskImage: "linear-gradient(135deg, black, transparent 76%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-4">
        <figcaption className="sys-chip text-[#F7F5EE]/65">SYSTEM HANDOFF MAP</figcaption>
        <span className="font-mono-sys text-[12px] tracking-[0.12em] text-[#F19020]">
          {String(current + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
      </div>

      <div className="relative mt-5" aria-hidden="true">
        <svg viewBox="0 0 640 120" className="block h-auto w-full overflow-visible">
          <defs>
            <linearGradient id={`${testId}-path`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#F19020" />
              <stop offset="1" stopColor="#F7F5EE" stopOpacity="0.7" />
            </linearGradient>
            <filter id={`${testId}-glow`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M40 60 C 150 20, 250 100, 360 60 S 530 20, 600 60"
            fill="none"
            stroke="rgba(247,245,238,.18)"
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <path
            d="M40 60 C 150 20, 250 100, 360 60 S 530 20, 600 60"
            fill="none"
            stroke={`url(#${testId}-path)`}
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={pathLength}
            strokeDasharray={`${Math.max(progress, 0.035) * pathLength} ${pathLength}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
            filter={`url(#${testId}-glow)`}
          />

          {steps.map((item, index) => {
            const x = 40 + (560 / pointCount) * index;
            const y = index % 2 === 0 ? 60 : 36;
            const isActive = index === current;
            const isComplete = index <= current;
            return (
              <g key={item.label} transform={`translate(${x} ${y})`}>
                {isActive && (
                  <circle r="16" fill="rgba(241,144,32,.15)" stroke="#F19020" strokeWidth="1" className="animate-pulse" />
                )}
                <circle
                  r={isActive ? 8 : 5}
                  fill={isComplete ? "#F19020" : "#1D2424"}
                  stroke={isComplete ? "#F19020" : "rgba(247,245,238,.38)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
                <text
                  y="31"
                  textAnchor="middle"
                  fill={isActive ? "#F19020" : "rgba(247,245,238,.56)"}
                  fontFamily="var(--font-system)"
                  fontSize="10"
                  letterSpacing="1.2"
                  className="transition-colors duration-500"
                >
                  {String(index + 1).padStart(2, "0")} {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="relative mt-2 grid gap-4 border-t border-[#F7F5EE]/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="sys-chip text-[#F7F5EE]/40">NOW MOVING</p>
          <p className="mt-1 text-[15px] leading-[1.45] text-[#F7F5EE]/85">
            <span className="accent-orange-text">{stage.label}</span> · {stage.page}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="sys-chip text-[#F7F5EE]/40">NEXT HANDOFF</p>
          <p className="mt-1 text-[15px] leading-[1.45] text-[#F7F5EE]/70">{next ? next.label : "SYSTEM LIVE"}</p>
        </div>
      </div>
    </figure>
  );
};
