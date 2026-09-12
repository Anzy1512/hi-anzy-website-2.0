import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MagneticButton } from "@/components/MagneticButton";
import { Reveal } from "@/components/Reveal";
import { FitQuadrant } from "@/components/FitQuadrant";
import { AUDIENCES } from "@/data/content";

/* ======================== S10 — WHO WE WORK WITH ======================== */
const MarqueeRow = ({ items, reverse = false }) => (
  <div className="overflow-hidden" aria-hidden="true">
    <div className="marquee-track items-center gap-x-5 py-1" style={reverse ? { animationDirection: "reverse", animationDuration: "42s" } : undefined}>
      {[...items, ...items].map((a, i) => (
        <React.Fragment key={`${a}-${i}`}>
          <span className="font-display whitespace-nowrap text-3xl leading-none text-[#232A2A]/80 sm:text-4xl">{a}</span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#F19020]" />
        </React.Fragment>
      ))}
    </div>
  </div>
);

/**
 * The full "who this suits" case — the filter list and the plain-prose
 * explanation — lives on /who-we-work-with, word for word (that page is the
 * dedicated, fuller version). This teaser used to restate all of it a second
 * time with no link back, so a reader who'd already read one saw no
 * acknowledgment they'd seen it before. What stays here is what's actually
 * unique to Home: the audience marquee and FitQuadrant's scroll-driven
 * diagram, neither of which the dedicated page has — matching how every
 * other Home section (Work, Network, What We Do) teases into its own page
 * rather than fully restating it.
 */
export const WhoWith = () => (
  <section className="container-page section-pad relative" data-testid="home-who-section">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <SectionHeading kicker="WHO WE WORK WITH" title="People building things that have to work." testId="who-heading" className="max-w-3xl" />
      <Reveal delay={150}>
        <MagneticButton to="/who-we-work-with" className="btn-paper" hoverText="Good filter." testId="who-cta">
          See Who We Work With <ArrowRight size={15} />
        </MagneticButton>
      </Reveal>
    </div>
    <div className="mt-10 space-y-3" data-testid="who-audience-wall">
      <MarqueeRow items={AUDIENCES.slice(0, 6)} />
      <MarqueeRow items={AUDIENCES.slice(6)} reverse />
      {/* Accessible static list for screen readers */}
      <ul className="sr-only">
        {AUDIENCES.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
    <div className="mt-10 grid items-center gap-8 lg:grid-cols-12">
      <Reveal delay={180} className="lg:col-span-5">
        <p className="text-[17px] leading-[1.6] text-[#232A2A]/80">
          Not every business is the right fit, and we would rather say so early than three months in.{" "}
          <Link to="/who-we-work-with" className="link-draw font-semibold text-[#232A2A]" data-testid="who-filter-link">
            The full filter, and where we tend to earn our fee
          </Link>.
        </p>
      </Reveal>
      <Reveal delay={240} className="lg:col-span-7">
        <FitQuadrant className="panel-paper h-full p-6 sm:p-7" testId="who-fit-quadrant" />
      </Reveal>
    </div>
  </section>
);
