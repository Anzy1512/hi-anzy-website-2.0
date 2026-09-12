import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { MagneticButton } from "@/components/MagneticButton";
import { PACKAGES, COMBOS } from "@/data/content";
import { track } from "@/lib/api";

const byKey = Object.fromEntries(PACKAGES.map((p) => [p.key, p]));

/**
 * Engagement model — stage packages plus the combinations they are usually
 * bought in. Selecting a stage expands its detail in place, so the section
 * stays scannable on first read and deep on second.
 */
export const Packages = ({ heading = true }) => {
  const [open, setOpen] = useState("diagnose");

  return (
    <section className="container-page section-pad" data-testid="packages-section" id="packages">
      {heading && (
        <SectionHeading
          kicker="ENGAGEMENT MODEL"
          title={<>Buy the stage you are in.<br />Not the service you heard of.</>}
          testId="packages-heading"
          className="max-w-3xl"
        />
      )}

      <Reveal delay={80} as="p" className="mt-5 max-w-[62ch] text-[17.5px] leading-[1.6] text-[#232A2A]/80">
        Most wasted budget is not the wrong service. It is the right service bought in the
        wrong order. Each stage below can be run on its own, or paired with the one beside it.
      </Reveal>

      {/* Stage rail */}
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Choose an engagement stage" data-testid="packages-stage-rail">
        {PACKAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => { setOpen(p.key); track("package_stage_opened", { stage: p.key }); }}
            aria-expanded={open === p.key}
            data-testid={`package-tab-${p.key}`}
            className={`sys-chip rounded-full border px-4 py-2 transition-colors ${
              open === p.key
                ? "border-[#F19020] bg-[#F19020] text-[#232A2A]"
                : "border-[#232A2A]/25 text-[#232A2A]/75 hover:border-[#F19020]"
            }`}
          >
            {p.stage} · {p.name}
          </button>
        ))}
      </div>

      {/* Stage detail */}
      {PACKAGES.filter((p) => p.key === open).map((p) => (
        <Reveal key={p.key} className="mt-6">
          <article className="grid gap-8 rounded-[18px] border border-[#232A2A]/15 bg-[#F7F5EE] p-7 sm:p-9 lg:grid-cols-12" data-testid={`package-panel-${p.key}`}>
            <div className="lg:col-span-5">
              <p className="sys-chip accent-orange-text">STAGE {p.stage}</p>
              <h3 className="font-display mt-3 text-[clamp(2rem,3vw,2.8rem)] leading-[1.02] text-[#232A2A]">{p.name}</h3>
              <p className="font-editorial mt-3 text-[clamp(1.1rem,1.4vw,1.35rem)] leading-[1.4] text-[#232A2A]/85">{p.tagline}</p>

              <dl className="mt-6 space-y-3 border-t border-[#232A2A]/12 pt-5">
                <div>
                  <dt className="sys-chip text-[#232A2A]/50">WHO IT IS FOR</dt>
                  <dd className="mt-1 text-[16px] leading-[1.55] text-[#232A2A]/80">{p.forWho}</dd>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <dt className="sys-chip text-[#232A2A]/50">TYPICAL TIMELINE</dt>
                    <dd className="mt-1 font-display text-[19px] text-[#232A2A]">{p.timeline}</dd>
                  </div>
                  <div>
                    <dt className="sys-chip text-[#232A2A]/50">SCOPE</dt>
                    <dd className="mt-1 font-display text-[19px] text-[#232A2A]">{p.pricing}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              <p className="sys-chip text-[#232A2A]/50">WHAT IS INCLUDED</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {p.includes.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[16px] leading-[1.5] text-[#232A2A]/85">
                    <Check size={16} className="mt-[3px] shrink-0 accent-orange-text" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="panel-dark mt-6 p-5 sm:p-6">
                <p className="sys-chip accent-orange-text">WHAT YOU LEAVE WITH</p>
                <p className="font-editorial mt-2 text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.4] text-[#F7F5EE]">{p.outcome}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <MagneticButton
                  to="/contact"
                  className="btn-ink"
                  hoverText="Good start."
                  testId={`package-cta-${p.key}`}
                  onClick={() => track("cta_primary_click", { cta: "package", stage: p.key })}
                >
                  Scope this stage <ArrowRight size={15} />
                </MagneticButton>
                {p.nextStage && byKey[p.nextStage] && (
                  <button
                    type="button"
                    onClick={() => setOpen(p.nextStage)}
                    className="link-draw text-[14px] font-semibold text-[#232A2A]/70"
                    data-testid={`package-next-${p.key}`}
                  >
                    Next: {byKey[p.nextStage].name}
                  </button>
                )}
              </div>
            </div>
          </article>
        </Reveal>
      ))}

      {/* Combinations */}
      <div className="mt-14">
        <p className="sys-chip text-[#232A2A]/55">USUAL COMBINATIONS</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-3" data-testid="packages-combos">
          {COMBOS.map((c, i) => (
            <Reveal key={c.key} delay={(i % 3) * 80}>
              <article
                className={`cap-tile flex h-full flex-col rounded-[16px] border p-6 ${
                  c.highlight ? "border-[#F19020] bg-[#F19020]/10" : "border-[#232A2A]/15 bg-[#F7F5EE]"
                }`}
                data-testid={`combo-${c.key}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-[26px] leading-none text-[#232A2A]">{c.name}</h4>
                  {c.highlight && <span className="sys-chip rounded-full bg-[#232A2A] px-2.5 py-1 text-[#F7F5EE]">MOST TAKEN</span>}
                </div>
                <p className="mt-3 text-[15.5px] leading-[1.55] text-[#232A2A]/80">{c.tagline}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {c.stages.map((s) => (
                    <li key={s} className="sys-chip rounded-full border border-[#232A2A]/25 px-2.5 py-1 text-[#232A2A]/78">
                      {byKey[s] ? byKey[s].stage : s}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[14.5px] leading-[1.5] text-[#232A2A]/78">{c.forWho}</p>
                <p className="sys-chip mt-auto pt-5 text-[#232A2A]/50">{c.timeline}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={120} as="p" className="mt-8 max-w-2xl text-[15px] leading-relaxed text-[#232A2A]/70">
        Not sure which stage you are in? That is what the{" "}
        <Link to="/insights/why-we-package-services" className="link-draw font-semibold text-[#232A2A]">
          sequencing note
        </Link>{" "}
        is for. Or read{" "}
        <Link to="/how-we-work" className="link-draw font-semibold text-[#232A2A]">
          how we work
        </Link>{" "}
        before you decide.
      </Reveal>
    </section>
  );
};
