import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MagneticButton } from "@/components/MagneticButton";
import { Reveal } from "@/components/Reveal";
import { track } from "@/lib/api";
import { CATEGORIES } from "@/data/content";

/* ============================ S04 — WHAT WE DO ============================ */
const spans = ["lg:col-span-5", "lg:col-span-7", "lg:col-span-7", "lg:col-span-5", "lg:col-span-4", "lg:col-span-8"];

export const WhatWeDoGrid = () => (
  <section className="container-page section-pad" data-testid="home-what-we-do-section">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <SectionHeading kicker="CAPABILITIES" title={<>A business is one system.<br />Our capabilities behave like one too.</>} testId="what-we-do-heading" className="max-w-3xl" />
      <Reveal delay={150}>
        <MagneticButton to="/what-we-do" className="btn-paper" testId="what-we-do-cta" onClick={() => track("service_explored", { from: "home_grid_cta" })}>
          Explore What We Do <ArrowRight size={15} />
        </MagneticButton>
      </Reveal>
    </div>
    <div className="mt-12 grid gap-5 lg:grid-cols-12">
      {CATEGORIES.map((c, i) => (
        <Reveal key={c.num} delay={(i % 3) * 100} className={spans[i]}>
          <Link
            to={`/what-we-do/${c.slug}`}
            onClick={() => track("service_explored", { category: c.label })}
            data-testid={`category-tile-${c.num}`}
            className="cap-tile group block h-full rounded-[18px] border border-[#232A2A]/15 bg-[#F7F5EE] p-6 sm:p-7"
          >
            <div className="flex items-center justify-between"><span className="sys-chip text-[#232A2A]/70">{c.num}</span><div className={`story-mini-object story-mini-object-${i}`} aria-hidden="true"><i /><i /><i /></div></div>
            <h3 className="font-display mt-4 text-[clamp(1.85rem,2.7vw,3.1rem)] leading-[0.98] text-[#232A2A]">{c.label}</h3>
            <p className="font-editorial mt-1 text-[clamp(1.15rem,1.35vw,1.45rem)] font-medium text-[#232A2A]/65">{c.title}</p>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#232A2A]/78">{c.copy}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 opacity-90 transition-all duration-500 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover:max-h-32 lg:group-hover:opacity-100">
              {c.capabilities.slice(0, 5).map((cap) => (
                <span key={cap} className="sys-chip rounded-full border border-[#F19020]/70 px-2.5 py-0.5 text-[#232A2A]/75">{cap}</span>
              ))}
              <span className="sys-chip rounded-full px-2 py-0.5 text-[#232A2A]/45">+{c.capabilities.length - 5} more</span>
            </div>
            <div className="mt-4 h-[3px] w-10 rounded-full bg-[#F19020] transition-all duration-500 group-hover:w-24" />
          </Link>
        </Reveal>
      ))}
    </div>
  </section>
);
