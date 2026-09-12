import React, { useCallback, useState } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

/**
 * Adaptive graphics for every WebGL scene on the site.
 *
 * Every Canvas here clamps device pixel ratio to a fixed `dpr={[1, 1.75]}`,
 * which is a guess made once at build time and never revisited. On a capable
 * desktop it leaves quality on the table; on a thermally throttled laptop or a
 * mid-range Android it is the reason the scene stutters, and nothing ever
 * notices or backs off.
 *
 * This measures the frame rate the scene is actually achieving and moves it
 * between three tiers, which is the difference between "we picked a number"
 * and "the page responds to the machine it landed on":
 *
 *   high     — full pixel ratio, everything on
 *   standard — the current fixed behaviour, and the default
 *   low      — reduced pixel ratio, callers thin their own effects
 *
 * The tier is handed back through `onTier` so a scene can also drop particle
 * counts or skip an expensive pass, not just resolution — resolution alone is
 * a blunt instrument when the cost is fill rate.
 *
 * Deliberately hysteretic. `PerformanceMonitor`'s `onDecline`/`onIncline` fire
 * on a rolling average, and a step of one tier per event with a floor and a
 * ceiling stops the scene oscillating between tiers on a borderline device,
 * which reads far worse than simply running a notch lower.
 */
const TIERS = {
  high: { dpr: 2, label: "high" },
  standard: { dpr: 1.75, label: "standard" },
  low: { dpr: 1, label: "low" },
};
const ORDER = ["low", "standard", "high"];

export const AdaptiveQuality = ({ onTier, start = "standard", boost = false }) => {
  const setDpr = useThree((s) => s.setDpr);
  const [tier, setTier] = useState(start);

  const apply = useCallback(
    (next) => {
      if (next === tier) return;
      setTier(next);
      setDpr(Math.min(TIERS[next].dpr, window.devicePixelRatio || 1));
      if (onTier) onTier(next);
    },
    [tier, setDpr, onTier]
  );

  const step = useCallback(
    (dir) => {
      const i = ORDER.indexOf(tier);
      const next = ORDER[Math.max(0, Math.min(ORDER.length - 1, i + dir))];
      apply(next);
    },
    [tier, apply]
  );

  // Hovering a scene is intent to look closely at it — jump straight to full
  // quality rather than waiting for PerformanceMonitor to notice and ramp up
  // over several seconds, and hand it back once the pointer leaves.
  React.useEffect(() => {
    apply(boost ? "high" : start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boost]);

  return (
    <PerformanceMonitor
      // A little slack before reacting: a scene that has just mounted is
      // always briefly slow, and dropping a tier on mount would be wrong.
      ms={250}
      iterations={6}
      threshold={0.75}
      onDecline={() => step(-1)}
      onIncline={() => step(1)}
    />
  );
};

export default AdaptiveQuality;
