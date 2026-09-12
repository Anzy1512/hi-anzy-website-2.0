import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { track } from "@/lib/api";

/**
 * Contextual onward journey.
 *
 * Several pages were reachable only from the nav and led nowhere, which breaks
 * reading continuity and leaves them at the edge of the crawl graph. Each entry
 * below is the question a visitor most plausibly has *next* on that page —
 * not a generic "related links" dump.
 */
const JOURNEY = {
  "/network": [
    { to: "/work", label: "See the capabilities in context", note: "Explore business problems and the work they call for." },
    { to: "/how-we-work", label: "How the work fits together", note: "Follow the stages, responsibilities and deliverables." },
    { to: "/collaborate", label: "Join the network", note: "Bring your specialist skills to a shared project." },
  ],
  "/contact": [
    { to: "/how-we-work", label: "What happens next", note: "See how we define a problem and agree the work." },
    { to: "/work", label: "Explore the work", note: "Understand the problem, approach and project context." },
    { to: "/insights/how-to-brief-a-project-when-you-dont-know-whats-wrong", label: "Not sure what to write?", note: "How to brief a project when the problem is unclear." },
  ],
  "/what-we-do": [
    { to: "/what-we-do#build", label: "Shape your engagement", note: "Select the capabilities your project may need." },
    { to: "/how-we-work", label: "How the work runs", note: "Five stages, with clear inputs and deliverables." },
    { to: "/work", label: "See the services in context", note: "Explore how business challenges shape the work." },
  ],
  "/how-we-work": [
    { to: "/what-we-do#packages", label: "Choose a starting point", note: "Compare engagement models and typical scope." },
    { to: "/work", label: "Explore the work", note: "See the approach in a business context." },
    { to: "/why-hi-anzy", label: "Why we work this way", note: "The principles behind a connected approach." },
  ],
  "/why-hi-anzy": [
    { to: "/who-we-work-with", label: "Who this suits", note: "The businesses this way of working fits." },
    { to: "/insights", label: "How we think, in writing", note: "Notes from the work, published openly." },
    { to: "/careers", label: "Work with us", note: "We hire the way we work." },
  ],
  "/who-we-work-with": [
    { to: "/work", label: "Explore business challenges", note: "See how the problem determines the approach." },
    { to: "/what-we-do#packages", label: "Where to start", note: "Compare the scope of each engagement model." },
    { to: "/contact", label: "Start a conversation", note: "Tell us what you are building and where you need clarity." },
  ],
  "/collaborate": [
    { to: "/network", label: "Explore the specialist network", note: "See the disciplines that support an engagement." },
    { to: "/careers", label: "Prefer a permanent seat?", note: "Open roles and how we hire." },
    { to: "/how-we-work", label: "How engagements run", note: "What you would be joining." },
  ],
  "/careers": [
    { to: "/why-hi-anzy", label: "What you would be joining", note: "The instinct behind the company." },
    { to: "/collaborate", label: "Rather stay independent?", note: "Join the specialist network instead." },
    { to: "/insights", label: "How we think", note: "Read before you apply." },
  ],
  "/resources": [
    { to: "/insights", label: "Notes from the work", note: "Longer thinking, published openly." },
    { to: "/what-we-do", label: "What we actually do", note: "Capabilities, and what they are for." },
    { to: "/contact", label: "Ask us directly", note: "A person reads every message." },
  ],
  "/insights": [
    { to: "/what-we-do#packages", label: "Turn reading into a decision", note: "Compare engagement models and choose a starting point." },
    { to: "/work", label: "The thinking, applied", note: "Case studies with business context." },
    { to: "/resources", label: "Tools and practical resources", note: "Explore useful tools, plus terms and privacy." },
  ],
};
export const NextSteps = ({ from, title = "Where to next" }) => {
  const items = JOURNEY[from];
  if (!items || items.length === 0) return null;

  return (
    <section className="container-page section-pad-b pt-2" data-testid="next-steps" aria-label="Continue reading">
      <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/75">
        <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> {title.toUpperCase()}
      </Reveal>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.to} delay={(i % 3) * 80}>
            <Link
              to={item.to}
              onClick={() => track("next_step_click", { from, to: item.to })}
              data-testid={`next-step-${i}`}
              className="cap-tile group flex h-full flex-col rounded-[16px] border border-[#232A2A]/15 bg-[#F7F5EE] p-5 transition-colors hover:border-[#F19020]"
            >
              <span className="font-display text-[22px] leading-[1.15] text-[#232A2A]">{item.label}</span>
              <span className="mt-2 text-[15px] leading-[1.55] text-[#232A2A]/75">{item.note}</span>
              <span className="link-draw mt-auto inline-flex items-center gap-1.5 pt-3 text-[14px] font-semibold text-[#232A2A]">
                Continue
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
