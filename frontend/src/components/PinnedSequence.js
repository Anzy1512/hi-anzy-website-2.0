import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { ScrollTrigger, useReducedMotion } from "@/lib/motion";

import { SequenceInfographic } from "./SequenceInfographic";
import { VisibleSequence } from "./VisibleSequence";

/**
 * Pinned storytelling.
 *
 * The section holds still while scroll advances it through its steps, so the
 * method reads as one continuous move instead of five stacked blocks.
 *
 * Two deliberate constraints:
 *  - Pinning is desktop-only. On a short viewport a pin eats the whole screen
 *    and the reader loses their place, which is exactly the continuity break
 *    we are trying to avoid.
 *  - Every step is in the DOM the whole time; only opacity/transform change.
 *    Reduced motion drops the pin entirely and renders a plain list, so the
 *    content is never gated behind an animation.
 */
export const PinnedSequence = ({ steps = [], kicker, title, testId = "pinned-sequence" }) => {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  /**
   * Whether the viewport is wide enough to pin. This has to be state rather
   * than a one-off read: the pin used to be decided once on mount, so a window
   * that started narrow never got a pin however wide it was later made, and one
   * that started wide kept its pin after being narrowed. Anyone resizing, or
   * rotating a tablet, landed in the wrong mode until a reload.
   */
  // Medium screens still have room for the single-column shifting story. Keep
  // the fully stacked list for narrow phones, where pinning would trap the
  // reader behind a long gesture sequence.
  const [wideEnough, setWideEnough] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px) and (min-height: 620px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px) and (min-height: 620px)");
    const onChange = (e) => setWideEnough(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || steps.length === 0) return undefined;

    const canPin = wideEnough && !reduced;
    if (!canPin) {
      setPinned(false);
      setActive(0);
      return undefined;
    }

    setPinned(true);
    const trigger = ScrollTrigger.create({
      trigger: section,
      // "top top" pinned the section flush with the viewport's top edge,
      // directly under the fixed 84px nav (z-50) — the kicker and the first
      // line of the heading were pinned *behind* it for the whole scroll.
      // Offsetting the pin start by the nav's own height clears it.
      start: "top 84",
      // one viewport of scroll per step keeps the pacing even
      end: () => `+=${window.innerHeight * steps.length * 0.65}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        setActive((prev) => (prev === idx ? prev : idx));
      },
    });

    triggerRef.current = trigger;

    // Layout settles after fonts/lazy content — recalculate or the pin ends early.
    const settle = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      clearTimeout(settle);
      trigger.kill();
      triggerRef.current = null;
    };
  }, [steps.length, wideEnough, reduced]);

  if (steps.length === 0) return null;
  if (!wideEnough || reduced) return <VisibleSequence steps={steps} kicker={kicker} title={title} testId={testId} />;

  return (
    <section
      ref={sectionRef}
      className="pinned-sequence bg-[#1D2424] py-8 lg:py-0"
      data-testid={testId}
      data-pinned={pinned ? "true" : "false"}
    >
        {/* justify-center used to vertically centre this whole block inside
            the full-viewport pin, which just pushed the heading down inside
            whatever room was left below the nav offset — the gap grew the
            moment the pin start was pulled down to clear the nav. Anchoring
            to the top keeps the heading right under the kicker, consistently,
            regardless of how tall any single stage's panel is. */}
      <div className="container-page flex min-h-[calc(100svh-144px)] flex-col justify-start py-8 lg:min-h-[calc(100svh-84px)] lg:py-10">
        <div className="grid gap-x-8 gap-y-7 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            {kicker && (
              <p className="sys-chip flex items-center gap-3 text-[#F7F5EE]/70">
                <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> {kicker}
              </p>
            )}
            {title && (
              <h2 className="font-display mt-5 max-w-3xl leading-[0.98] text-[#F7F5EE] text-[clamp(2.2rem,4.4vw,3.8rem)]">
                {title}
              </h2>
            )}
          </div>

          {/* Keep the five moves in the open upper-right space so the pinned
              frame reads as one screen: title, stage rail, then the handoff. */}
          <ol className="flex flex-nowrap gap-1 lg:col-span-5 lg:col-start-8 lg:justify-end lg:pb-1" aria-label="Sequence progress">
            {steps.map((s, i) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => {
                    const trigger = triggerRef.current;
                    if (trigger) {
                      const top = trigger.start + ((i + 0.15) / steps.length) * (trigger.end - trigger.start);
                      if (window.__lenis) window.__lenis.scrollTo(top, { duration: 0.6 });
                      else window.scrollTo({ top, behavior: "smooth" });
                    }
                    setActive(i);
                  }}
                  aria-current={i === active}
                  data-testid={`${testId}-step-${i}`}
                  className={`sys-chip whitespace-nowrap rounded-full border px-1.5 py-1 text-[10px] transition-colors ${
                    i === active
                      ? "border-[#F19020] bg-[#F19020] text-[#232A2A]"
                      : i < active
                        ? "border-[#F7F5EE]/45 text-[#F7F5EE]/75"
                        : "border-[#F7F5EE]/20 text-[#F7F5EE]/50"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} {s.label}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* The copy was capped at max-w-3xl in a full-bleed panel, so the right
            half of every pinned screen was empty. The stage data already
            carries what the reader wants at exactly this moment — what the
            stage needs from them and what it leaves behind — so the showcase
            is real detail rather than filler, cross-fading with the step. */}
        {/* Stretch the stage row so the detail card carries the same visual
            weight as the copy. On medium screens it becomes a full-width
            handoff panel; on phones the readable stacked sequence takes over. */}
        <div className="mt-7 grid gap-8 sm:grid-cols-12 lg:min-h-[50vh] lg:grid-cols-12 lg:items-stretch lg:gap-10" data-testid={`${testId}-panels`}>
          <div className="relative grid sm:col-span-12 lg:col-span-6">
            {steps.map((s, i) => (
              <article
                key={s.label}
                aria-hidden={i !== active}
                className="col-start-1 row-start-1 transition-all duration-500"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(14px)",
                  pointerEvents: i === active ? "auto" : "none",
                  visibility: i === active ? "visible" : "hidden",
                }}
              >
                <p className="font-editorial text-[clamp(1.4rem,2.4vw,2.1rem)] font-medium leading-[1.25] text-[#F7F5EE]">
                  {s.title}
                </p>
                <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.65] text-[#F7F5EE]/80">{s.body}</p>
              </article>
            ))}
            <SequenceInfographic steps={steps} active={active} testId={`${testId}-infographic`} />
          </div>

          <div className="relative hidden sm:col-span-12 sm:grid sm:self-stretch lg:col-span-6" data-testid={`${testId}-showcase`}>
            {steps.map((s, i) => (
              <aside
                key={s.label}
                aria-hidden={i !== active}
                className="col-start-1 row-start-1 flex h-full flex-col justify-start rounded-[18px] border border-[#F7F5EE]/15 bg-[#F7F5EE]/[0.04] p-7 transition-all duration-500 sm:p-8"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(14px)",
                  pointerEvents: i === active ? "auto" : "none",
                  visibility: i === active ? "visible" : "hidden",
                }}
              >
                <div className="flex items-center justify-between gap-4 border-b border-[#F7F5EE]/12 pb-3">
                  <span className="sys-chip text-[#F7F5EE]/55">STAGE {String(i + 1).padStart(2, "0")} OF {String(steps.length).padStart(2, "0")}</span>
                  {s.duration && (
                    <span className="font-mono-sys text-[13.5px] accent-orange-text">{s.duration}</span>
                  )}
                </div>

                {s.inputs && s.inputs.length > 0 && (
                  <div className="mt-4">
                    <p className="sys-chip text-[#F7F5EE]/45">WHAT THIS STAGE NEEDS FROM YOU</p>
                    <ul className="mt-2.5 space-y-1.5">
                      {s.inputs.map((it) => (
                        <li key={it} className="flex items-start gap-3 text-[16px] leading-[1.55] text-[#F7F5EE]/85">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#F19020]" aria-hidden="true" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.outputs && s.outputs.length > 0 && (
                  <div className="mt-5">
                    <p className="sys-chip text-[#F7F5EE]/45">WHAT YOU END UP WITH</p>
                    <ul className="mt-2.5 space-y-1.5">
                      {s.outputs.map((it) => (
                        <li key={it} className="flex items-start gap-3 text-[16px] leading-[1.55] text-[#F7F5EE]/85">
                          <Check size={13} className="mt-[3px] shrink-0 accent-orange-text" aria-hidden="true" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
