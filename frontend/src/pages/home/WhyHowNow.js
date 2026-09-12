import React from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { PopIllustration } from "@/components/PopIllustration";
import { RouteLine } from "@/components/RouteLine";
import { Reveal } from "@/components/Reveal";
import { WHY_HOW_NOW } from "@/data/content";

/* ========================== S03 — WHY / HOW / NOW ========================== */
export const WhyHowNow = () => (
  <section className="container-page section-pad" data-testid="home-why-how-now-section">
    {/* Heading sat alone across the full width; the figure takes the empty
        right-hand third rather than leaving it as dead paper. */}
    <div className="flex items-end justify-between gap-10">
      <SectionHeading kicker="THE QUESTIONS" title="Three questions. Surprisingly useful." testId="why-how-now-heading" />
      <PopIllustration
        src="/brand/pop-cube-thinker.png"
        width={200}
        rotate={-3.5}
        drift={24}
        className="-mb-6 shrink-0"
        testId="pop-questions"
      />
    </div>
    <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
      <RouteLine d="M0,30 C 25,5 40,55 55,30 C 70,8 85,50 100,25" viewBox="0 0 100 60" strokeWidth={2.4} className="pointer-events-none absolute -top-8 left-0 hidden h-16 w-full lg:block" />
      {WHY_HOW_NOW.map((b, i) => (
        <Reveal key={b.key} delay={i * 120} className={i === 1 ? "lg:mt-10" : i === 2 ? "lg:mt-20" : ""}>
          <div className={`${i === 1 ? "panel-paper" : "panel-dark"} cap-tile h-full p-7 sm:p-8`} data-testid={`why-how-now-panel-${b.key.toLowerCase()}`}>
            <div className="flex items-center justify-between">
              <span className="font-display accent-orange-text text-6xl leading-none">{b.key}</span>
            </div>
            <p className={`font-editorial mt-4 text-[clamp(1.15rem,1.45vw,1.4rem)] font-medium leading-[1.35] ${i === 1 ? "text-[#232A2A]" : "text-[#F7F5EE]"}`}>{b.q}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {b.items.map((it) => (
                <li key={it} className={`sys-chip rounded-full border px-3 py-1 ${i === 1 ? "border-[#232A2A]/25 text-[#232A2A]/75" : "border-[#F7F5EE]/25 text-[#F7F5EE]/75"}`}>{it}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
    <Reveal delay={160} as="p" className="font-display mt-12 text-3xl text-[#232A2A] sm:text-4xl">
      Ideas matter. Execution decides. <span className="hl-marker">Systems endure.</span>
    </Reveal>
  </section>
);
