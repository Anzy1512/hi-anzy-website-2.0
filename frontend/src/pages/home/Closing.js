import React from "react";
import { SITE_CONTACT } from "@/data/site";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { RouteLine } from "@/components/RouteLine";
import { TouchpointTicker } from "@/components/TouchpointTicker";
import { PopIllustration } from "@/components/PopIllustration";
import { track } from "@/lib/api";

/* ============================ S11 — CLOSING ============================ */
export const Closing = () => (
  <section className="container-page section-pad-b pt-4" data-testid="home-closing-section">
    <div className="panel-dark relative overflow-hidden p-8 sm:p-12 lg:flex lg:min-h-[760px] lg:flex-col lg:justify-start lg:p-16">
      <RouteLine d="M0,80 C 20,20 45,95 65,45 C 80,10 92,60 100,30" viewBox="0 0 100 100" strokeWidth={1.6} className="pointer-events-none absolute inset-0 h-full w-full opacity-30" />
      {/* Copy is capped at 24ch, so the right half of this panel was empty:
          the ticker takes the top corner, the figure takes the bottom.
          Fixing PopIllustration's positioning (App.css) revealed the two
          had never actually shared this corner without colliding — the
          panel's height was set by the copy alone, which runs short. The
          breakdown lives inside the ticker card rather than stacked under
          it, and lg:min-h reserves enough room for both corner pieces to
          clear each other. Top-aligned (not centred): centring left a dead
          gap above the copy while the ticker sat flush at the top, so the
          copy now starts at the same edge the ticker does. */}
      <TouchpointTicker className="absolute right-8 top-8 hidden w-[300px] lg:block lg:w-[340px] xl:right-16 xl:w-[380px]" testId="closing-ticker" />
      <PopIllustration
        src="/brand/pop-hat-balloon.png"
        width={220}
        rotate={3}
        drift={30}
        halo={false}
        className="absolute bottom-0 right-8 xl:right-16"
        testId="pop-closing"
      />
      <div className="relative">
        <Reveal>
          <p className="font-editorial max-w-[24ch] text-[clamp(1.75rem,3vw,3.3rem)] font-medium leading-[1.12] text-[#F7F5EE]" data-testid="closing-large-type">
            Brands are not campaigns. They are businesses people experience through <em className="accent-orange-text">hundreds of small interactions</em>.
          </p>
        </Reveal>
        <Reveal delay={120} as="p" className="font-mono-sys mt-6 max-w-2xl text-[15px] leading-[1.5] text-[#F7F5EE]/55">
          The website. The salesperson. The delivery. The reply that came fast, or didn&rsquo;t. The checkout.
          The invoice. The follow-up. When those things work together, the brand feels effortless.
        </Reveal>
        <Reveal delay={180} as="p" className="font-accent mt-5 text-2xl accent-orange-text">
          It rarely is. That&rsquo;s the work.
        </Reveal>
        <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-5">
          <MagneticButton to="/contact" className="btn-orange" testId="closing-primary-cta" onClick={() => track("cta_primary_click", { cta: "build_it_right" })}>
            Build It Right <ArrowRight size={15} />
          </MagneticButton>
          <a href={`mailto:${SITE_CONTACT.email}`} className="link-draw text-[14px] text-[#F7F5EE]/80" data-testid="closing-secondary-cta">
            Have an idea? A problem? Something you cannot quite explain yet? Say hi.
          </a>
        </Reveal>
      </div>
    </div>
  </section>
);
