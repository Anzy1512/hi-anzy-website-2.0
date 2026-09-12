import React from "react";
import { ArrowRight } from "lucide-react";
import { Picture } from "@/components/Picture";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { track } from "@/lib/api";
import { DIAGNOSTIC_AREAS, DIAGNOSTIC_OUTCOMES } from "@/data/content";

/* =========================== S06 — DIAGNOSTIC =========================== */
export const Diagnostic = () => (
  <section className="container-page section-pad" data-testid="home-diagnostic-section">
    <div className="panel-dark diag-grid relative overflow-hidden p-7 sm:p-10 lg:p-14">
      <div className="scanline" style={{ "--scan-h": "100%" }} />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="sys-chip flex items-center gap-3 text-[#F7F5EE]/55">
            <span className="inline-block h-[3px] w-8 rounded-full bg-[#F19020]" />
            BUSINESS SYSTEMS DIAGNOSTIC
          </p>
          <Reveal as="h2" delay={80} className="font-editorial mt-5 max-w-[20ch] text-[clamp(1.8rem,3.1vw,3.4rem)] font-medium leading-[1.12] text-[#F7F5EE]" testId="diagnostic-heading">
            Maybe you don&rsquo;t need <em>what you think</em> you need.
          </Reveal>
          <Reveal delay={140} as="p" className="mt-6 max-w-lg text-[17px] leading-[1.6] text-[#F7F5EE]/80">
            You might not need a rebrand. Or a new CRM. Or AI, whatever the conference said. The hiAnzy
            Business Systems Diagnostic looks at the whole machine before recommending a part.
          </Reveal>
          <Reveal delay={200} className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton to="/contact" className="btn-orange" testId="diagnostic-cta" onClick={() => track("diagnostic_cta_click", { from: "home" })}>
              Find the Gap <ArrowRight size={15} />
            </MagneticButton>
          </Reveal>
          <Reveal delay={260} as="p" className="font-mono-sys mt-5 max-w-md text-[12.5px] leading-relaxed text-[#F7F5EE]/45">
            Prescription follows diagnosis. Your business deserves at least the same courtesy as your headache.
          </Reveal>
        </div>
        <div className="lg:col-span-6">
          <p className="sys-chip text-[#F7F5EE]/50">WHAT WE LOOK AT</p>
          <div className="mt-4 flex flex-wrap gap-2" data-testid="diagnostic-areas">
            {DIAGNOSTIC_AREAS.map((a, i) => (
              <Reveal key={a} delay={i * 40} as="span" className="sys-chip inline-flex items-center gap-2 rounded-full border border-[#F7F5EE]/20 px-3 py-1.5 text-[#F7F5EE]/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F19020]" /> {a}
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <p className="sys-chip text-[#F7F5EE]/50">YOU LEAVE KNOWING</p>
              <ol className="mt-4 space-y-2.5">
                {DIAGNOSTIC_OUTCOMES.map((o, i) => (
                  <Reveal as="li" key={o} delay={i * 60} className="flex items-center gap-3 text-[14px] text-[#F7F5EE]/85">
                    {o}
                  </Reveal>
                ))}
              </ol>
            </div>
            <Reveal delay={200} className="hidden shrink-0 xl:block">
              <Picture src="/brand/art-thinker.png" width="354" height="354" alt="Etched illustration of a person thinking, surrounded by question marks" loading="lazy" className="w-[240px] opacity-90" data-parallax="12" />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  </section>
);
