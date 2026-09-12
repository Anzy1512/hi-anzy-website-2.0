import React from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { SystemDiagnostic } from "@/components/SystemDiagnostic";
import { SOMETHINGS_OFF } from "@/data/content";

/* ========================= S02 — SOMETHING'S OFF ========================= */
export const SomethingsOff = () => (
  <section className="container-page section-pad" data-testid="home-somethings-off-section">
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <SectionHeading kicker="SOUND FAMILIAR?" title={<>Something&rsquo;s off<span className="accent-signal-text">.</span></>} testId="somethings-off-heading" />
        <Reveal delay={140} as="p" className="font-mono-sys mt-6 max-w-sm text-[13px] leading-relaxed text-[#232A2A]/55">
          Symptoms observed in the wild. Names withheld. Patterns, unfortunately, not.
        </Reveal>
        <Reveal delay={220}>
          {/* Was the cube-head collage, which reappears as the pop figure two
              sections below. A diagram makes the section's argument instead. */}
          <SystemDiagnostic className="relative mt-8 hidden max-w-[300px] lg:block" testId="somethings-off-diagnostic" />
        </Reveal>
      </div>
      <div className="lg:col-span-7">
        <div className="panel-paper relative overflow-hidden p-6 sm:p-8">
          <ul className="divide-y divide-[#232A2A]/10">
            {SOMETHINGS_OFF.map((line, i) => (
              <Reveal as="li" key={i} delay={i * 90} className="flex items-start gap-4 py-4">
                <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#E54A25]" aria-hidden="true" />
                <p className="text-[17px] leading-[1.6] text-[#232A2A]/88">{line}</p>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal delay={200}>
          <div className="panel-dark mt-5 p-6 sm:p-8">
            <p className="text-[17px] leading-[1.6] text-[#F7F5EE]/90">
              We find the gap. Then we decide whether it needs fixing, rebuilding or simply getting out of the way.
            </p>
            <p className="font-accent mt-3 text-2xl accent-orange-text sm:text-[1.7rem]">More activity is not always more progress.</p>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);
