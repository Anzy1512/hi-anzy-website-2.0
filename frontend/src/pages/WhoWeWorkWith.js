import { CharacterQuote } from "@/components/CharacterQuote";
import React from "react";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { useRevealObserver } from "@/lib/motion";
import { AUDIENCES, FILTER_LIST } from "@/data/content";
import { NextSteps } from "@/components/NextSteps";
import { OrderingGrid } from "@/components/motion/OrderingGrid";

export default function WhoWeWorkWith() {
  const ref = useRevealObserver();
  return (
    <div ref={ref} className="pt-[84px]" data-testid="who-we-work-with-page">
      <Seo title="Who We Work With | Founders & Growing Teams | hiAnzy" description="Founders, founder-led companies, businesses modernising systems, D2C and commerce brands, hospitality and teams entering the next stage of growth." />
      <section className="container-page section-pad">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> WHO WE WORK WITH
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-5 max-w-4xl leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="wwww-h1">
            For teams ready for their next stage<span className="accent-signal-text">.</span>
          </h1>
        </Reveal>
        {/* Chaos → order, rather than the sitewide fade-up. This page is about
            sorting — who fits, and who does not — so the tiles arriving very
            slightly out of alignment and resolving into an exact grid says
            what the page says. Identical markup and appearance once settled;
            reduced motion renders it as a plain grid. */}
        <OrderingGrid className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" testId="wwww-audiences">
          {AUDIENCES.map((a) => (
            <div key={a} className="cap-tile flex h-full items-center gap-4 rounded-[14px] border border-[#232A2A]/14 bg-[#F7F5EE] p-5">
              <span className="text-[15px] font-semibold text-[#232A2A]/85">{a}</span>
            </div>
          ))}
        </OrderingGrid>
        <Reveal delay={150} as="p" className="mt-10 max-w-xl text-[17px] leading-[1.6] text-[#232A2A]/82">
          You may be launching an idea, clarifying your position or improving systems the business has outgrown. We help connect the next step to the wider business goal.
        </Reveal>
        <Reveal delay={200}>
          <div className="panel-dark mt-7 p-7 sm:p-9">
            <p className="accent-signal-on-dark sys-chip flex items-center gap-2 font-bold"><span className="red-bar" /> A GOOD WORKING PARTNERSHIP</p>
            <p className="mt-3 font-semibold text-[#F7F5EE]">Here is what helps us do useful work together:</p>
            <ul className="mt-4 space-y-2.5">
              {FILTER_LIST.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[16.5px] leading-[1.58] text-[#F7F5EE]/78">
                  <span className="font-mono-sys mt-0.5 text-[12.5px] accent-orange-text" aria-hidden="true">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={240} className="mt-12">
          <MagneticButton to="/contact" className="btn-ink" hoverText="Good start." testId="wwww-cta">
            Start a Conversation <ArrowRight size={15} />
          </MagneticButton>
        </Reveal>
      </section>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/who-we-work-with" />
    </div>
  );
}
