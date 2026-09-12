import { CharacterQuote } from "@/components/CharacterQuote";
import React from "react";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { HandsSpark } from "@/components/deck/HandsSpark";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { useRevealObserver } from "@/lib/motion";
import { NextSteps } from "@/components/NextSteps";

const ASKS = [
  { title: "Specialists", body: "Strategists, designers, engineers, automators and analysts who bring focused expertise and work well across disciplines." },
  { title: "Creators & Media", body: "Creators, journalists, producers and channels with a clear audience and a point of view." },
  { title: "Venues & Partners", body: "Spaces, institutions and operators who help ideas become well-run physical experiences." },
];

export default function Collaborate() {
  const ref = useRevealObserver();
  return (
    <div ref={ref} className="pt-[84px]" data-testid="collaborate-page">
      <Seo title="Collaborate | Join the hiAnzy Network" description="Specialists, creators, media and venues: the hiAnzy network runs on honest classification and real credit. Introduce yourself." />
      <section className="container-page section-pad">
       <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> COLLABORATE
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-5 max-w-4xl leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="collaborate-h1">
            Bring your expertise to the next project<span className="accent-signal-text">.</span>
          </h1>
        </Reveal>
        <Reveal delay={160} as="p" className="mt-7 max-w-[48ch] font-editorial text-[clamp(1.15rem,1.5vw,1.45rem)] leading-[1.45] text-[#232A2A]/85">
          We bring specialists together around a shared brief. Tell us what you do, show us work you can share and describe the kind of projects you want to contribute to.
        </Reveal>
        </div>
        <div className="hidden lg:col-span-5 lg:block">
          <HandsSpark />
        </div>
       </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {ASKS.map((a, i) => (
            <Reveal key={a.title} delay={i * 100}>
              <div className="cap-tile panel-paper h-full p-7">
                <h2 className="font-display mt-2 text-3xl text-[#232A2A]">{a.title}</h2>
                <p className="mt-3 text-[16.5px] leading-[1.58] text-[#232A2A]/78">{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={150}>
          <div className="panel-dark mt-8 p-7 sm:p-9">
            <p className="sys-chip accent-orange-text">HOW CREDIT WORKS HERE</p>
            <p className="mt-3 text-[17px] leading-[1.6] text-[#F7F5EE]/85">
              Our work and network pages distinguish direct delivery, shared projects, independent credentials and access to partners:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ProvenanceTag value="HI ANZY DIRECT" dark />
              <ProvenanceTag value="HI ANZY + COLLABORATOR" />
              <ProvenanceTag value="COLLABORATOR CREDENTIAL" />
              <ProvenanceTag value="NETWORK ACCESS" />
            </div>
            <p className="mt-4 text-[14px] text-[#F7F5EE]/75">We identify each contribution so visitors can understand who did the work.</p>
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-8">
          <p className="mb-5 max-w-3xl text-[16px] leading-relaxed text-[#232A2A]/80">Include your discipline, portfolio link, location and availability. A short introduction is enough to begin.</p>
          <MagneticButton to="/contact" className="btn-ink" hoverText="Meet the minds." testId="collaborate-cta">
            Introduce Yourself <ArrowRight size={15} />
          </MagneticButton>
        </Reveal>
      </section>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/collaborate" />
    </div>
  );
}
