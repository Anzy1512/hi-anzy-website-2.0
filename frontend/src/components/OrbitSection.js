import React, { useMemo } from "react";
import { Reveal } from "@/components/Reveal";
import { EvidenceDeck } from "@/components/EvidenceDeck";
import { ORBIT_CATEGORIES } from "@/data/content";
import { ORBIT_GLYPHS } from "@/components/deck/OrbitGlyphs";
import { Link } from "react-router-dom";

/**
 * "The Hi Anzy Orbit" — sits between the verified case studies and the
 * portfolio archive on /work. The orbit is part of the page flow immediately;
 * readers should see the context and the six entry points without an extra
 * tap-to-open gate.
 */
export const OrbitSection = () => {
  const items = useMemo(
    () => ORBIT_CATEGORIES.map((c) => ({ ...c, id: c.key, Glyph: ORBIT_GLYPHS[c.key] })),
    []
  );

  // Plain section-pad, no extra margin. This section used to carry an added
  // mt-10 lg:mt-14 on top of the standard system, on the reasoning that
  // App.css's adjacent-.section-pad-b rule zeroed its own top padding and
  // left nothing between it and Case Studies. Measured live, that reasoning
  // was wrong: the rule was already working, and the extra margin sat on top
  // of a gap that was already correct — this was the one boundary on the
  // entire site with visibly more space than every other section-to-section
  // transition. Removed so this boundary matches the standard rhythm exactly
  // like every other one does.
  return (
    <section id="orbit" className="container-page section-pad" data-index-label="THE HI ANZY ORBIT" data-testid="orbit-section">
      <div
        data-testid="orbit-explore-bar"
        className="flex w-full items-center gap-4 rounded-full border border-[#232A2A]/15 bg-[#F7F5EE] px-6 py-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-block h-[3px] w-8 shrink-0 rounded-full bg-[#F19020]" />
          <span className="sys-chip shrink-0 text-[#232A2A]/60">THE HI ANZY ORBIT</span>
          <span className="truncate font-display text-[17px] text-[#232A2A]">Six ways into the wider system.</span>
        </span>
      </div>

      <div data-testid="orbit-section-expanded">
        <div className="pt-10">
          <Reveal delay={80}>
            <h2 className="font-display leading-[0.98] text-[#232A2A] text-[clamp(2.2rem,4.2vw,3.8rem)]">
              One consultancy.<br />A much wider operating system.
            </h2>
          </Reveal>
          <Reveal delay={140} as="p" className="font-editorial mt-6 max-w-[60ch] text-[clamp(1.05rem,1.3vw,1.3rem)] italic leading-[1.5] text-[#232A2A]/80">
            Some things are built here. Some are built together. And sometimes the real advantage is knowing exactly
            who, what or where the brief needs next.
          </Reveal>

          {/* The fan's own two outermost cards are deliberately positioned
              past the stage's measured box -- that's the geometry in
              useGeometry, not a bug. Left unclipped, they also bled past this
              section's own container-page edge and forced a page-wide
              horizontal scrollbar on any viewport under ~1700px. Clipping at
              the section's width (not the stage's) keeps every card's lift,
              tilt and drag exactly as EvidenceDeck computes it -- this only
              stops the bleed from becoming a second, page-level scrollbar. */}
          <div className="sticky-cta-avoid mt-14 overflow-x-hidden">
            <EvidenceDeck items={items} testId="orbit-deck" />
          </div>

          <p className="font-mono-sys mt-10 text-center text-[12.5px] text-[#232A2A]/50">
            Each card opens its own index — real names, honestly labelled, verified on the date shown.
          </p>
          {/* Plain links to the same six pages the deck opens. The deck renders
              real anchors, but only the active card is visually reachable, and a
              category page should not depend on a carousel to be found. */}
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Orbit categories" data-testid="orbit-category-links">
            {ORBIT_CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link to={c.route} className="sys-chip inline-flex items-center gap-1.5 rounded-full border border-[#232A2A]/25 px-3 py-1.5 text-[#232A2A]/75 transition-colors hover:border-[#F19020] hover:text-[#232A2A]" data-testid={`orbit-link-${c.key}`}>
                  {c.num} · {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
