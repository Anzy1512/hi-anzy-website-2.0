import React, { useEffect, useRef, useState } from "react";
import { Seo } from "@/components/Seo";
import { PunRow } from "@/components/PunPop";
import { SectionConnector } from "@/components/SectionConnector";
import { PinnedSequence } from "@/components/PinnedSequence";
import { ProofStrip } from "@/components/ProofStrip";
import { useRevealObserver, useReducedMotion, webglAvailable, gsap, prefersReducedMotion, resyncScroll } from "@/lib/motion";
import { METHOD_STAGES } from "@/data/content";

import { Hero } from "@/pages/home/Hero";
import { SomethingsOff } from "@/pages/home/SomethingsOff";
import { WhyHowNow } from "@/pages/home/WhyHowNow";
import { WhatWeDoGrid } from "@/pages/home/WhatWeDoGrid";
import { Diagnostic } from "@/pages/home/Diagnostic";
import { WorkPreview } from "@/pages/home/WorkPreview";
import { NetworkPreview } from "@/pages/home/NetworkPreview";
import { Trust } from "@/pages/home/Trust";
import { WhoWith } from "@/pages/home/WhoWith";
import { Closing } from "@/pages/home/Closing";

import ConnectedStory from "@/pages/home/ConnectedStory";

/* ================================ PAGE ================================ */
export default function Home() {
  const ref = useRevealObserver();
  const [modelOpen, setModelOpen] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(resyncScroll);
    return () => cancelAnimationFrame(frame);
  }, [modelOpen]);
  const reduced = useReducedMotion();
  // Computed synchronously on first render, not after it: this state used to
  // start false and only flip in an effect, so the lazy `import()` for the
  // hero canvas — a 215KB chunk — did not even begin downloading until a
  // whole extra tick after mount. On desktop, where the WebGL check nearly
  // always passes, that tick was the entire visible delay between the page
  // appearing and the hero canvas showing up late behind it. Reading the same
  // two checks the effect already ran eagerly means the fetch starts in the
  // same tick as everything else on the page.
  const [show3d, setShow3d] = useState(() => !prefersReducedMotion() && webglAvailable());
  // Only re-evaluate when the motion preference actually changes. Without the
  // guard this fires once on mount too, and webglAvailable() builds a real
  // WebGL context to test with — a driver round-trip, repeated for an answer
  // the initialiser above already has.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setShow3d(!reduced && webglAvailable());
  }, [reduced]);

  // Gentle parallax on editorial artwork. Stays here, not in whichever
  // section renders the [data-parallax] element (currently just Diagnostic):
  // this queries ref.current's full subtree once, from the one outer div
  // every section renders inside, so it keeps working regardless of which
  // extracted section a future [data-parallax] attribute shows up in.
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return undefined;
    const els = ref.current.querySelectorAll("[data-parallax]");
    const tweens = [];
    els.forEach((el) => {
      const amt = parseFloat(el.getAttribute("data-parallax")) || 14;
      tweens.push(
        gsap.fromTo(el, { y: amt }, { y: -amt, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } })
      );
    });
    return () => tweens.forEach((t) => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="merged-home" data-testid="home-page">
      <Seo
        title="hiAnzy | We Build Brand Operating Systems"
        description="hiAnzy is a Business Systems & Transformation Consultancy. We find what is disconnected in your business, figure out what belongs together and build the system around it. From ABC to ROI."
      />
      <Hero show3d={show3d} />
      <ProofStrip />
      <div className="container-page -mt-4 mb-4">
        <PunRow
          testId="pun-home-1"
          puns={[
            { text: "Loud is easy. Clear is rare.", rot: 2.5, variant: "orange" },
            { text: "Complexity is clarity, procrastinating.", rot: -1.8 },
            { text: "Alignment beats effort.", rot: 1.2, variant: "dark" },
          ]}
        />
      </div>
      <SomethingsOff />
      <SectionConnector variant="right" label="SYMPTOM → QUESTION" testId="connector-symptom-question" />
      <WhyHowNow />
      <div className="container-page mb-8">
        <details className="model-explorer panel-paper overflow-hidden" onToggle={e => setModelOpen(e.currentTarget.open)} data-testid="home-model-explorer">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 font-display text-xl font-semibold">
            Explore the connected business in 3D <span className="faq-plus" aria-hidden="true">+</span>
          </summary>
          {modelOpen && <ConnectedStory mode="model" />}
        </details>
      </div>
      <div className="container-page -mt-2 mb-6">
        <PunRow
          testId="pun-home-2"
          puns={[
            { text: "Strategy is spellcheck for ambition.", rot: -2, variant: "dark" },
            { text: "Opinions are cheap. Systems compound.", rot: 1.6 },
            { text: "A brand is a promise with receipts.", rot: -1.2, variant: "orange" },
          ]}
        />
      </div>
      <WhatWeDoGrid />
      {/* The method used to be explained twice back-to-back here: a compact
          MethodSection (deleted) immediately followed by this same
          PinnedSequence, both reading METHOD_STAGES. PinnedSequence is the
          fuller, canonical version — duration/inputs/outputs per stage, an
          already-reduced-motion-safe pinned scroll sequence — so it is now
          the sole method section, with one connector leading into it instead
          of a pair bracketing the pair. */}
      <SectionConnector variant="left" label="CAPABILITY → METHOD" testId="connector-capability-method" />
      <PinnedSequence
        kicker="THE SEQUENCE"
        title={<>One system, five moves.<br />In this order, on purpose.</>}
        testId="home-pinned-method"
        steps={METHOD_STAGES}
      />
      <Diagnostic />
      <SectionConnector variant="centre" label="METHOD → PROOF" testId="connector-method-proof" />
      <WorkPreview />
      <div className="container-page -mt-2 mb-6">
        <PunRow
          testId="pun-home-3"
          puns={[
            { text: "ROI: Return On Intention.", rot: 1.5 },
            { text: "If it only works when you're watching, it doesn't work.", rot: -2.2, variant: "dark" },
            { text: "Growth without a system is expensive noise.", rot: 1.9, variant: "orange" },
          ]}
        />
      </div>
      <NetworkPreview show3d={show3d} />
      <Trust />
      <WhoWith />
      <Closing />
    </div>
  );
}
