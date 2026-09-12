import { CharacterQuote } from "@/components/CharacterQuote";
import React from "react";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { QuestionOrbit } from "@/components/deck/QuestionOrbit";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { useRevealObserver } from "@/lib/motion";
import { NextSteps } from "@/components/NextSteps";

const VALUES = [
  { t: "Curiosity over credentials", b: "Show us how you approach a problem, ask questions and learn." },
  { t: "Writing is thinking", b: "Clear writing helps the whole team understand a decision and act on it." },
  { t: "Ownership over activity", b: "Take responsibility for the outcome, communicate progress and raise blockers early." },
  { t: "Kind and direct", b: "Give useful feedback, listen carefully and credit the people who contribute." },
];

export default function Careers() {
  const ref = useRevealObserver();
  return (
    <div ref={ref} className="pt-[84px]" data-testid="careers-page">
      <Seo title="Careers | hiAnzy" description="We hire slowly and deliberately. If you notice things other people miss, introduce yourself anyway." />
      <section className="container-page section-pad">
       <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> CAREERS
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-5 max-w-4xl leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="careers-h1">
            Curious minds. Practical builders<span className="accent-signal-text">.</span>
          </h1>
        </Reveal>
        <Reveal delay={160} as="p" className="mt-7 max-w-[48ch] font-editorial text-[clamp(1.15rem,1.5vw,1.45rem)] leading-[1.45] text-[#232A2A]/85">
          There are no open roles listed here at the moment. You can still introduce yourself with your area of interest, a portfolio or example of your work, and what you would like to do next.
        </Reveal>
        </div>
        <div className="hidden lg:col-span-5 lg:block">
          <QuestionOrbit />
        </div>
       </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.t} delay={(i % 2) * 90}>
              <div className="cap-tile panel-paper h-full p-7">
                <h2 className="font-display mt-2 text-2xl text-[#232A2A]">{v.t}</h2>
                <p className="mt-2 text-[16.5px] leading-[1.58] text-[#232A2A]/75">{v.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={180} className="mt-12 flex flex-wrap items-center gap-5">
          <MagneticButton to="/contact" className="btn-ink" hoverText="Good start." testId="careers-cta">
            Introduce Yourself <ArrowRight size={15} />
          </MagneticButton>
          <p className="text-[14px] leading-relaxed text-[#232A2A]/75">Mention “careers” and include a portfolio link. Use the contact form to send your introduction.</p>
        </Reveal>
      </section>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/careers" />
    </div>
  );
}
