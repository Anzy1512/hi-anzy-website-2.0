import { CharacterQuote } from "@/components/CharacterQuote";
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { useRevealObserver } from "@/lib/motion";
import { track } from "@/lib/api";
import { NextSteps } from "@/components/NextSteps";

const RESOURCES = [
  { t: "The Activity-to-Outcome Map", b: "Find recurring work that has lost its connection to a useful outcome.", tag: "WORKSHEET", steps: ["List five recurring tasks or meetings and the time each one takes.", "Write the decision or customer outcome each one supports.", "Mark any item with no clear outcome. Decide whether to change it, stop it or investigate further."], takeaway: "Use the map to agree one small change and a way to check whether it helped." },
  { t: "Five-Second Homepage Check", b: "Check whether a first-time visitor understands your offer.", tag: "CHECKLIST", steps: ["Show your homepage to someone unfamiliar with the business for five seconds, then hide it.", "Ask what the business offers, who it serves and what they would do next.", "Compare their answers with your intended message. Revise the headline, supporting copy or next step where the meaning was lost."], takeaway: "Repeat with a few people from your intended audience. Look for recurring confusion." },
  { t: "The AI Use-Case Sentence", b: "Define the task and its measure before choosing a tool.", tag: "TEMPLATE", steps: ["Complete: Help [person] do [task] using [approved information], so that [measurable outcome] improves.", "Name the person who checks the output and the situations that require human review.", "Test the task on a small sample. Compare the time, quality and errors with the current process."], takeaway: "If the task or measure is still unclear, refine the use case before expanding it." },
];

export default function Resources() {
  const ref = useRevealObserver();
  return (
    <div ref={ref} className="pt-[84px]" data-testid="resources-page">
      <Seo title="Resources | hiAnzy" description="Three practical exercises for clarifying recurring work, checking your homepage and defining an AI use case. Read and use them directly on this page." />
      <section className="container-page section-pad">
        <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
          <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> RESOURCES
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-5 leading-[0.92] text-[#232A2A] text-[clamp(3rem,6.8vw,6rem)]" data-testid="resources-h1">
            Tools we actually use<span className="accent-signal-text">.</span>
          </h1>
        </Reveal>
        <Reveal as="p" delay={140} className="mt-5 max-w-3xl text-[18px] leading-relaxed text-[#232A2A]/85">Start with a small question you can answer today. Use these exercises with your team, then bring the findings into your next decision.</Reveal>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {RESOURCES.map((r, i) => (
            <Reveal key={r.t} delay={i * 90}>
              <div className="cap-tile panel-paper flex h-full flex-col p-7" data-testid={`resource-card-${i}`}>
                <span className="sys-chip w-fit rounded-full border border-[#F19020]/70 px-2.5 py-0.5 text-[#232A2A]/70">{r.tag}</span>
                <h2 className="font-display mt-3 text-3xl text-[#232A2A]">{r.t}</h2>
                <p className="mt-3 text-[16.5px] leading-[1.58] text-[#232A2A]/85">{r.b}</p>
                <ol className="mt-5 flex-1 space-y-4 border-t border-[#232A2A]/15 pt-5">
                  {r.steps.map((step, index) => <li key={step} className="flex items-start gap-3 text-[15.5px] leading-[1.6] text-[#232A2A]/85"><span className="font-display shrink-0 text-[24px] leading-none accent-orange-text" aria-hidden="true">0{index + 1}</span><span>{step}</span></li>)}
                </ol>
                <p className="mt-5 border-t border-[#232A2A]/15 pt-4 text-[14px] leading-relaxed text-[#232A2A]/80">{r.takeaway}</p>
                <Link to="/contact" onClick={() => track("resource_discussed", { resource: r.t })} className="link-draw mt-5 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-[#232A2A]">
                  Discuss your findings <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <section id="privacy" className="panel-paper p-7 sm:p-9" data-testid="resources-privacy">
              <p className="sys-chip text-[#232A2A]/55">PRIVACY</p>
              <h2 className="font-display mt-2 text-3xl text-[#232A2A]">Your data, plainly.</h2>
              {/* The IP sentence is not decoration. The contact endpoint stores
                  the sender's IP address (server.py, on every submission) for
                  abuse handling, and IP is personal data under both GDPR and
                  India's DPDP Act — so it has to be disclosed here rather than
                  only existing in the database. The analytics claim below is
                  accurate as written: /api/analytics/event records name, path
                  and timestamp, and deliberately no IP. */}
              <p className="mt-4 text-[16.5px] leading-[1.58] text-[#232A2A]/78">
                When you write to us, we store what you send so a person can read it and reply: your name, your
                email, anything else you chose to fill in, and the IP address the message arrived from. The IP is
                kept for one reason only: stopping the form being abused by bots. We do not sell any of it, rent
                it, or feed it to a mailing list you never asked for. Analytics on this site record which pages
                were used and when, and never your IP address. They measure what is useful, not who you are.
              </p>
              <p className="mt-4 text-[16.5px] leading-[1.58] text-[#232A2A]/78">
                To request a copy or deletion of information you have shared, use the <Link to="/contact" className="link-draw font-semibold">contact form</Link> and identify the email address associated with your enquiry. We will review the request and contact you using the details you provide.
              </p>
            </section>
          </Reveal>
          <Reveal delay={100}>
            <section id="terms" className="panel-paper p-7 sm:p-9" data-testid="resources-terms">
              <p className="sys-chip text-[#232A2A]/55">TERMS</p>
              <h2 className="font-display mt-2 text-3xl text-[#232A2A]">The fine print, humane.</h2>
              <p className="mt-4 text-[16.5px] leading-[1.58] text-[#232A2A]/78">
                Work and network entries identify the people or organisations credited for each contribution. The exercises and articles offer general guidance; a project recommendation depends on your business context. Each engagement has its own agreed written scope.
              </p>
            </section>
          </Reveal>
        </div>
      </section>
      <div className="container-page section-pad-b"><CharacterQuote /></div>
      <NextSteps from="/resources" />
    </div>
  );
}
