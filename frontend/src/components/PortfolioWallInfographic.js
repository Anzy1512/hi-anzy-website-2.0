import React from "react";

/**
 * A compact context signal for each portfolio discipline. The carousel is the
 * thing to explore; this panel answers what the work is meant to prove and
 * when it helps.
 */

const STORY = {
  "brand-decks": {
    verb: "CLARIFY",
    proof: "A point of view the room can make a decision around.",
    signal: "POSITION · STORY · DECISION",
    useWhen: "The team is busy, but direction is still fuzzy.",
  },
  packaging: {
    verb: "LAND",
    proof: "A promise that survives the shelf, the hand and the journey home.",
    signal: "STAND OUT · EXPLAIN · TRAVEL",
    useWhen: "The product has to win before a conversation starts.",
  },
  "web-development": {
    verb: "ACTION",
    proof: "A clear path from the promise to the next useful step.",
    signal: "FIND · TRUST · ACT",
    useWhen: "The site gets attention but loses momentum.",
  },
  "e-commerce": {
    verb: "RETURN",
    proof: "A first sale designed to earn the second one.",
    signal: "BROWSE · BUY · RETURN",
    useWhen: "Acquisition works, but retention does not.",
  },
  "motion-graphics": {
    verb: "TIMING",
    proof: "Motion that makes the message land fast and stay memorable.",
    signal: "FRAME · EVOLVE · LAND",
    useWhen: "A static idea needs rhythm and recall.",
  },
  "audio-production": {
    verb: "MEMORY",
    proof: "Sound that makes the message recognisable after the screen is gone.",
    signal: "LISTEN · SHAPE · CARRY",
    useWhen: "The invisible layer needs to stay with people.",
  },
  "social-media": {
    verb: "TRUST",
    proof: "A useful story that earns attention beyond reach.",
    signal: "REACH · HOLD · SHARE",
    useWhen: "Distribution is high, but intent is low.",
  },
  "tvc-video-production": {
    verb: "FOCUS",
    proof: "One precise sequence built for a very short window.",
    signal: "SET · SHOOT · CUT",
    useWhen: "Every second has to carry the idea.",
  },
};

const fallback = {
  verb: "CONNECT",
  proof: "Every piece has a job in the system around it.",
  signal: "FRAME · BUILD · SHARE",
  useWhen: "The brief needs a clear next move.",
};

const Diagram = ({ slug }) => {
  if (slug === "brand-decks") {
    return (
      <>
        <path className="portfolio-wall-draw" d="M24 112 C68 83 91 89 126 67 S192 29 295 45" />
        <path d="M24 112 H295" className="portfolio-wall-rule" />
        <circle cx="70" cy="91" r="8" className="portfolio-wall-dot" />
        <circle cx="139" cy="61" r="8" className="portfolio-wall-dot" />
        <circle cx="224" cy="38" r="8" className="portfolio-wall-dot" />
        <path d="M274 34 H295 V55" className="portfolio-wall-accent" />
      </>
    );
  }
  if (slug === "packaging") {
    return (
      <>
        <path d="M36 39 L93 24 L149 40 L92 56 Z" className="portfolio-wall-accent-fill" />
        <path d="M36 39 V102 L92 122 V56 M149 40 V102 L92 122" className="portfolio-wall-draw" />
        <path d="M179 56 L237 41 L283 57 L225 73 Z" className="portfolio-wall-paper" />
        <path d="M179 56 V111 L225 127 V73 M283 57 V111 L225 127" className="portfolio-wall-draw" />
        <path d="M205 77 H257 M205 87 H246" className="portfolio-wall-accent" />
      </>
    );
  }
  if (slug === "web-development") {
    return (
      <>
        <rect x="28" y="28" width="264" height="96" rx="8" className="portfolio-wall-paper" />
        <path d="M28 51 H292 M47 40 H57 M64 40 H74 M81 40 H91" className="portfolio-wall-rule" />
        <path d="M59 91 H112 L131 72 H175 L195 103 H258" className="portfolio-wall-draw" />
        <circle cx="59" cy="91" r="6" className="portfolio-wall-dot" />
        <circle cx="131" cy="72" r="6" className="portfolio-wall-dot" />
        <circle cx="195" cy="103" r="6" className="portfolio-wall-dot" />
        <circle cx="258" cy="103" r="6" className="portfolio-wall-accent-fill" />
      </>
    );
  }
  if (slug === "e-commerce") {
    return (
      <>
        <path d="M61 43 A83 47 0 1 1 54 101" className="portfolio-wall-draw" />
        <path d="M45 94 L55 104 L69 97" className="portfolio-wall-accent" />
        <circle cx="160" cy="76" r="27" className="portfolio-wall-paper" />
        <path d="M146 70 H174 L169 89 H151 Z M151 65 H144" className="portfolio-wall-draw" />
        <circle cx="154" cy="96" r="3" className="portfolio-wall-dot" />
        <circle cx="167" cy="96" r="3" className="portfolio-wall-dot" />
        <path d="M219 43 A83 47 0 0 1 226 101" className="portfolio-wall-accent" />
        <path d="M215 42 H230 V57" className="portfolio-wall-accent" />
      </>
    );
  }
  if (slug === "motion-graphics") {
    return (
      <>
        <path d="M28 111 C77 111 81 33 145 43 S212 111 292 35" className="portfolio-wall-draw" />
        <path d="M28 111 H292" className="portfolio-wall-rule" />
        <rect x="24" y="103" width="9" height="16" rx="2" className="portfolio-wall-accent-fill" />
        <rect x="141" y="35" width="9" height="16" rx="2" className="portfolio-wall-paper" />
        <rect x="288" y="27" width="9" height="16" rx="2" className="portfolio-wall-accent-fill" />
      </>
    );
  }
  if (slug === "audio-production") {
    return (
      <>
        <path d="M25 78 H295" className="portfolio-wall-rule" />
        {[42, 63, 84, 105, 126, 147, 168, 189, 210, 231, 252, 273].map((x, i) => {
          const h = [13, 25, 44, 21, 58, 33, 49, 19, 39, 55, 26, 14][i];
          return <path key={x} d={`M${x} ${78 - h / 2} V${78 + h / 2}`} className={i % 3 === 2 ? "portfolio-wall-accent" : "portfolio-wall-draw"} />;
        })}
        <circle cx="147" cy="78" r="5" className="portfolio-wall-dot" />
      </>
    );
  }
  if (slug === "social-media") {
    return (
      <>
        <path d="M38 111 V30 M38 111 H290" className="portfolio-wall-rule" />
        <path d="M51 94 C95 92 109 58 151 68 S216 38 280 45" className="portfolio-wall-draw" />
        <path d="M51 101 C99 98 133 94 173 89 S231 81 280 76" className="portfolio-wall-accent" />
        <circle cx="151" cy="68" r="7" className="portfolio-wall-dot" />
        <circle cx="280" cy="45" r="7" className="portfolio-wall-accent-fill" />
      </>
    );
  }
  if (slug === "tvc-video-production") {
    return (
      <>
        <rect x="28" y="35" width="190" height="88" rx="7" className="portfolio-wall-paper" />
        <path d="M218 61 L288 42 V116 L218 97 Z" className="portfolio-wall-accent-fill" />
        <path d="M47 48 V110 M102 48 V110 M157 48 V110" className="portfolio-wall-rule" />
        <path d="M118 67 L118 91 L149 79 Z" className="portfolio-wall-draw" />
        <circle cx="275" cy="79" r="9" className="portfolio-wall-paper" />
      </>
    );
  }
  return (
    <>
      <circle cx="160" cy="78" r="28" className="portfolio-wall-accent-fill" />
      {[0, 1, 2, 3].map((i) => {
        const a = i * Math.PI / 2;
        const x = 160 + Math.cos(a) * 88;
        const y = 78 + Math.sin(a) * 42;
        return <line key={i} x1="160" y1="78" x2={x} y2={y} className="portfolio-wall-rule" />;
      })}
    </>
  );
};

export function PortfolioWallInfographic({ slug, category, count, overview = false }) {
  const story = overview ? {
    verb: "ARCHIVE",
    proof: "A working set of disciplines that turns one brief into useful, finished work.",
    signal: "FRAME · MAKE · MEASURE",
    useWhen: "Scan the signal, then open the work that matches the problem.",
  } : (STORY[slug] || fallback);
  const label = overview ? "Portfolio system overview" : `${category} portfolio signal`;

  return (
    <aside className="portfolio-wall-infographic" aria-label={label} data-testid="portfolio-wall-infographic">
      <div className="portfolio-wall-infographic__top">
        <span className="font-mono-sys">PORTFOLIO CONTEXT</span>
        <span className="font-mono-sys">{String(count || 0).padStart(2, "0")} WORKS</span>
      </div>
      <div className="portfolio-wall-infographic__diagram">
        <svg viewBox="0 0 320 150" role="img" aria-label={`${category || "Portfolio"} system diagram`}>
          <path d="M0 24 H320 M0 78 H320 M0 132 H320" className="portfolio-wall-grid" />
          <Diagram slug={slug} />
        </svg>
        <span className="portfolio-wall-infographic__index">{overview ? "00" : String((Object.keys(STORY).indexOf(slug) + 1) || 0).padStart(2, "0")}</span>
      </div>
      <div className="portfolio-wall-infographic__copy">
        <span className="sys-chip">WHAT IT PROVES · {story.verb}</span>
        <p className="font-editorial">{story.proof}</p>
      </div>
      <div className="portfolio-wall-infographic__meta">
        <div>
          <span className="font-mono-sys">USE WHEN</span>
          <strong>{story.useWhen}</strong>
        </div>
        <div>
          <span className="font-mono-sys">SIGNAL</span>
          <strong>{story.signal}</strong>
        </div>
      </div>
    </aside>
  );
}

export default PortfolioWallInfographic;
