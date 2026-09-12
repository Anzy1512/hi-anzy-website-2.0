import { CharacterQuote } from "@/components/CharacterQuote";
import React from "react";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Seo } from "@/components/Seo";
import { InboxUnfold } from "@/components/deck/InboxUnfold";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { useRevealObserver } from "@/lib/motion";
import { track } from "@/lib/api";
import { METHOD_STAGES } from "@/data/content";
import { NextSteps } from "@/components/NextSteps";
import { ScrollInfoPanel } from "@/components/ScrollInfoPanel";
import { RouteLine } from "@/components/RouteLine";
import { PopIllustration } from "@/components/PopIllustration";

export default function HowWeWork() {
  const ref = useRevealObserver();
  return (
    <div ref={ref} className="pt-[84px]" data-testid="how-we-work-page">
      <Seo title="How We Work | Five Stages, One Method | hiAnzy" description="From a shared diagnosis to a working system: Audit, Architect, Build, Connect and Scale. See the inputs, deliverables and decisions at each stage." />
      <section className="container-page section-pad">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/70">
              <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> HOW WE WORK
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display mt-5 max-w-4xl leading-[0.96] text-[#232A2A] text-[clamp(3rem,6.3vw,5.5rem)]" data-testid="how-we-work-h1">
                From a clear problem to a working system<span className="accent-signal-text">.</span>
              </h1>
            </Reveal>
            <Reveal delay={160} as="p" className="mt-6 max-w-[52ch] text-[18px] leading-[1.65] text-[#232A2A]/85">
              We start with what your business needs to change. Each stage turns that understanding into a decision, a deliverable and a next step your team can act on.
            </Reveal>
          </div>
          <div className="hidden lg:col-span-4 lg:block" aria-hidden="true"><InboxUnfold /></div>
        </div>
        <nav aria-label="The five stages" className="mt-8 grid gap-2 sm:grid-cols-5">
          {METHOD_STAGES.map((stage, i) => (
            <a
              key={stage.label}
              href={"#stage-" + stage.label.toLowerCase()}
              aria-label={`Jump to stage ${i + 1}: ${stage.label}`}
              data-testid={`hww-stage-nav-${stage.label.toLowerCase()}`}
              className="stage-nav-card group panel-paper flex items-center gap-3 p-4"
            >
              <span className="stage-nav-number font-display text-3xl accent-orange-text">0{i + 1}</span>
              <span className="font-mono-sys text-[14px] text-[#232A2A]">{stage.label}</span>
              <ArrowRight size={14} className="stage-nav-arrow ml-auto shrink-0" aria-hidden="true" />
            </a>
          ))}
        </nav>
        <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-[#232A2A]/75">We agree the starting stage, scope and schedule together. Timings below are indicative; specialist involvement can begin wherever the project needs it.</p>
      </section>

      <section className="relative container-page section-pad-b" data-index-label="THE FIVE STAGES">
        <RouteLine d="M50,0 C 20,8 20,14 50,20 C 80,26 80,32 50,38 C 20,44 20,52 50,58 C 80,64 80,72 50,78 C 20,84 20,92 50,100" viewBox="0 0 100 100" strokeWidth={0.9} className="pointer-events-none absolute left-0 top-0 hidden h-full w-full lg:block" start="top 70%" end="bottom 90%" />
        <div className="relative space-y-10 lg:space-y-16">
          {METHOD_STAGES.map((stage, i) => (
            <Reveal key={stage.label}>
              <article
                id={"stage-" + stage.label.toLowerCase()}
                className={`grid scroll-mt-28 gap-6 lg:grid-cols-12 ${i % 2 === 0 ? "" : "lg:text-right"}`}
                data-testid={"hww-stage-" + stage.label.toLowerCase()}
              >
                <div className={`lg:col-span-5 ${i % 2 === 0 ? "" : "lg:col-start-8 lg:row-start-1"}`}>
                  <div className={`panel-dark p-7 sm:p-8 ${i % 2 === 0 ? "" : "lg:ml-auto"}`}>
                    <div className={`flex items-center gap-3 ${i % 2 === 0 ? "" : "lg:justify-end"}`}>
                      <span className="sys-chip accent-orange-text">STAGE 0{i + 1}</span>
                      <span className="red-bar" />
                    </div>
                    <h2 className="font-display mt-3 text-[clamp(2.2rem,3.6vw,3.75rem)] leading-none text-[#F7F5EE]">{stage.label}</h2>
                    <p className="font-display mt-2 text-[19px] font-semibold accent-orange-text">{stage.page}</p>
                    <p className="font-editorial mt-1 text-[16.5px] font-medium text-[#F7F5EE]/85">{stage.title}</p>
                    <p className={`mt-4 text-[16.5px] leading-[1.58] text-[#F7F5EE]/72 ${i % 2 === 0 ? "" : "lg:ml-auto"}`}>{stage.body}</p>
                    <p className={`font-mono-sys mt-5 flex items-center gap-2 text-[12.5px] text-[#F7F5EE]/55 ${i % 2 === 0 ? "" : "lg:justify-end"}`}>
                      <Clock size={13} aria-hidden="true" /> {stage.duration}
                    </p>
                  </div>
                </div>

                <div className={`lg:col-span-6 lg:self-center ${i % 2 === 0 ? "lg:col-start-7" : "lg:col-start-1 lg:row-start-1"}`}>
                  <ScrollInfoPanel
                    align={i % 2 === 0 ? "left" : "right"}
                    testId={"hww-info-" + stage.label.toLowerCase()}
                    cards={[
                      { label: "WHAT WE NEED FROM YOU", items: stage.inputs },
                      { label: "WHAT YOU END UP WITH", items: stage.outputs },
                      { label: "WHERE THIS USUALLY GOES WRONG", text: stage.pitfall },
                    ]}
                  />

                  <details className={`mt-5 border-t border-[#232A2A]/15 pt-4 ${i % 2 === 0 ? "" : "lg:text-left"}`}>
                    <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#232A2A]/85">Read all stage details</summary>
                    <div className="mt-5 grid gap-6 sm:grid-cols-2">
                      {[{ label: "WHAT WE NEED FROM YOU", items: stage.inputs }, { label: "WHAT YOU END UP WITH", items: stage.outputs }].map((group) => (
                        <div key={group.label}>
                          <h3 className="sys-chip text-[#232A2A]/75">{group.label}</h3>
                          <ul className="mt-4 space-y-3">
                            {group.items.map((item) => <li key={item} className="flex items-start gap-2 text-[16px] leading-[1.55] text-[#232A2A]/90"><Check size={15} className="mt-1 shrink-0 accent-orange-text" aria-hidden="true" />{item}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 border-t border-[#232A2A]/15 pt-4 text-[15px] leading-[1.6] text-[#232A2A]/80"><span className="font-semibold">Where this usually goes wrong: </span>{stage.pitfall}</p>
                  </details>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="relative mt-20 flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#D8CFB4]/60 p-7 sm:p-8">
            <PopIllustration src="/brand/pop-clock-watch.png" width={110} rotate={-2.5} drift={18} halo={false} className="absolute -top-20 right-12 hidden lg:block" testId="pop-how-we-work" />
            <div className="max-w-xl">
              <h2 className="font-display text-3xl leading-tight text-[#232A2A] sm:text-4xl" data-testid="hww-closing">Find the right starting point.</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[#232A2A]/80">Bring your goal, the constraint and what you have tried. We will help define the next useful step.</p>
            </div>
            <MagneticButton to="/contact" className="btn-ink" testId="hww-cta" onClick={() => track("cta_primary_click", { cta: "how_we_work_bottom" })}>Discuss Your Project <ArrowRight size={15} /></MagneticButton>
          </div>
        </Reveal>
      </section>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/how-we-work" />
    </div>
  );
}
