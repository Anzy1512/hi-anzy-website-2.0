import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CHARACTERS } from "@/data/content";
import { Picture } from "@/components/Picture";

/**
 * Mini marketing-character quote strip — fills quiet page regions with the
 * deck's collage figures and their voice lines. Rotates every 6s; only
 * opacity/transform are animated.
 *
 * The opening line is derived from the route rather than hand-assigned. Seven
 * pages were choosing from six quotes via a manual `startIndex`, and two of
 * them had picked the same number — so those pages opened on an identical
 * quote. Deriving it means a new page can never silently collide with an
 * existing one.
 */
const LINES = [
  { who: "The Visionary", quote: "If the plan fits on a sticky note, it's a direction. If it survives a quarter, it's a strategy." },
  { who: "The Challenger", quote: "Best practice is just the average of everyone else's habits." },
  { who: "The Fixer", quote: "Every bottleneck was once somebody's clever shortcut." },
  { who: "The Anchor", quote: "Momentum without a calendar is just enthusiasm." },
  { who: "The Expressionist", quote: "People don't remember information. They remember how it arrived." },
  { who: "The Trendsetter", quote: "Culture moves first. Metrics catch up later." },
  { who: "The Visionary", quote: "Everyone wants the map. Almost nobody wants the survey it came from." },
  { who: "The Fixer", quote: "If it needs a hero every month, it isn't a process. It's a hostage situation." },
  { who: "The Anchor", quote: "Deadlines are a design constraint, not a personality trait." },
];

/**
 * Routes that carry a quote strip, in order. Position in this list is the
 * opening line, so every page is guaranteed a different one.
 *
 * Hashing the pathname was the first attempt and it still collided — seven
 * routes into nine buckets collide about half the time (birthday problem).
 * An explicit ordering is boring and correct; the only rule is to keep this
 * list no longer than LINES.
 */
const QUOTE_ROUTES = [
  "/how-we-work",
  "/what-we-do",
  "/insights",
  "/who-we-work-with",
  "/collaborate",
  "/careers",
  "/resources",
];

const routeIndex = (path, len) => {
  const known = QUOTE_ROUTES.indexOf(path);
  if (known !== -1) return known % len;
  // unknown route: stable hash, still deterministic
  let h = 0;
  for (let k = 0; k < path.length; k += 1) h = (h * 31 + path.charCodeAt(k)) >>> 0;
  return h % len;
};

export const CharacterQuote = ({ startIndex, testId = "character-quote-strip" }) => {
  const { pathname } = useLocation();
  const [i, setI] = useState(
    startIndex != null ? startIndex % LINES.length : routeIndex(pathname, LINES.length)
  );
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((p) => (p + 1) % LINES.length);
        setVisible(true);
      }, 320);
    }, 6000);
    return () => clearInterval(t);
  }, []);
  const line = LINES[i];
  const char = CHARACTERS.find((c) => c.name === line.who);
  return (
    <div className="container-page" data-testid={testId}>
      <div className="flex items-center gap-5 rounded-[18px] border border-[#232A2A]/12 bg-[#D8CFB4]/45 p-5 sm:p-6">
        {char && (
          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-[10px] border-2 border-[#232A2A]/15 sm:h-20 sm:w-16">
            <Picture src={char.img} alt={`${line.who}, collage figure`} loading="lazy" className="h-full w-full object-cover object-top" />
          </div>
        )}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
          <p className="font-pun text-[clamp(1.05rem,1.35vw,1.3rem)] italic leading-[1.4] text-[#232A2A]/85">“{line.quote}”</p>
          {/* Orange stays as the decorative dash; the name itself needs ink to
              clear AA on the paper ground, since orange on paper is only 1.7:1. */}
          <p className="sys-chip mt-2 text-[#232A2A]/75">
            <span className="accent-orange-text" aria-hidden="true">- </span>
            {line.who.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};
