import React from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { ProgressRule } from "@/components/ProgressRule";
import { PopIllustration } from "@/components/PopIllustration";
import { TRUST_PRINCIPLES } from "@/data/content";

/* ============================= S09 — TRUST ============================= */
export const Trust = () => (
  <section className="container-page section-pad" data-testid="home-trust-section">
    <SectionHeading kicker="HOW TRUST GETS BUILT" title={<>Creative enough to find another answer.<br />Practical enough to make it&nbsp;work.</>} testId="trust-heading" className="max-w-4xl" />

    <Reveal delay={80} as="p" className="mt-6 max-w-[60ch] text-[17.5px] leading-[1.6] text-[#232A2A]/80">
      Nine promises. Open any of them and you will find what it actually costs us to keep it,
      because a principle nobody has to pay for is just a poster.
    </Reveal>

    {/* Each principle opens in place. <details> rather than a custom widget:
        keyboard, screen readers and find-in-page all work without help. */}
    <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="trust-principles">
      {TRUST_PRINCIPLES.map((p, i) => (
        <Reveal as="li" key={p.name} delay={(i % 3) * 80}>
          <details className="trust-item group h-full rounded-[14px] border border-[#232A2A]/12 px-4 py-3.5 transition-colors" data-testid={`trust-principle-${i + 1}`}>
            <summary className="flex cursor-pointer items-center gap-4 marker:content-['']">
              <span className="font-display text-[19px] font-semibold text-[#232A2A]/85 transition-colors group-hover:text-[#232A2A]">{p.name}</span>
              <span className="faq-plus ml-auto shrink-0 accent-orange-text" aria-hidden="true">+</span>
            </summary>
            <div className="trust-detail-wrap">
              <div className="trust-detail-inner">
                <p className="trust-detail mt-3 text-[15.5px] leading-[1.62] text-[#232A2A]/78">{p.detail}</p>
              </div>
            </div>
          </details>
        </Reveal>
      ))}
    </ul>

    {/* Bridges the list and the closing line, which previously met as a hard
        cut across a wide band of empty paper. */}
    <ProgressRule
      total={TRUST_PRINCIPLES.length}
      label="TRUST, ASSEMBLED"
      trailing="None of these are negotiable. All of them are checkable."
      testId="trust-progress-rule"
    />

    {/* Reads as a quote now, matching the rotating-quote treatment used under
        the hero: same paper panel, decorative mark and Amaranth italic, so a
        line this declarative does not sit as a plain unstyled sentence. */}
    <div className="relative mt-6 flex items-end justify-between gap-10 rounded-[18px] border border-[#232A2A]/14 bg-[#F7F5EE]/60 p-7 sm:p-9">
      <span className="font-editorial absolute -top-5 left-7 text-[64px] leading-none accent-orange-text" aria-hidden="true">&ldquo;</span>
      <Reveal delay={120} as="p" className="font-pun max-w-[24ch] text-[clamp(1.5rem,2.6vw,2.3rem)] font-medium italic leading-[1.2] text-[#232A2A]">
        Clever ideas get attention. <span className="hl-marker hl-marker-draw">Reliable execution gets remembered.</span>
      </Reveal>
      <PopIllustration
        src="/brand/pop-hands-a.png"
        width={230}
        rotate={2.5}
        drift={20}
        className="-mb-2 shrink-0"
        testId="pop-trust"
      />
    </div>
  </section>
);
