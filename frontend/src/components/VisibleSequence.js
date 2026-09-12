import React from "react";
import { Check } from "lucide-react";

/** A readable sequence: every stage stays visible in normal document flow. */
export const VisibleSequence = ({ steps = [], kicker, title, testId = "pinned-sequence" }) => {
  if (steps.length === 0) return null;

  return (
    <section className="pinned-sequence bg-[#1D2424] py-12 sm:py-16" data-testid={testId} data-pinned="false">
      <div className="container-page">
        {kicker && <p className="sys-chip text-[#F7F5EE]/75">{kicker}</p>}
        {title && <h2 className="font-display mt-3 max-w-4xl text-[clamp(2rem,4.4vw,3.8rem)] leading-[1.06] text-[#F7F5EE]">{title}</h2>}
        <ol className="mt-7 divide-y divide-[#F7F5EE]/15" data-testid={`${testId}-panels`} aria-label="Project stages">
          {steps.map((stage, index) => (
            <li key={stage.label} className="grid gap-5 py-6 first:pt-0 lg:grid-cols-12 lg:gap-8" data-testid={`${testId}-step-${index}`}>
              <div className="lg:col-span-2">
                <span className="font-display text-[34px] leading-none accent-orange-text" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p className="sys-chip mt-2 text-[#F7F5EE]">{stage.label}</p>
                {stage.duration && <p className="mt-1 text-[14px] text-[#F7F5EE]/75">{stage.duration}</p>}
              </div>
              <div className="lg:col-span-5">
                <h3 className="font-editorial text-[clamp(1.4rem,2.2vw,1.8rem)] leading-[1.25] text-[#F7F5EE]">{stage.title}</h3>
                <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.65] text-[#F7F5EE]/85">{stage.body}</p>
              </div>
              <div className="grid gap-4 rounded-2xl border border-[#F7F5EE]/15 bg-[#F7F5EE]/[0.04] p-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:grid-cols-2">
                {stage.inputs?.length > 0 && <div>
                  <p className="sys-chip text-[#F7F5EE]/75">Your input</p>
                  <ul className="mt-2 space-y-2">
                    {stage.inputs.map((input) => <li key={input} className="flex items-start gap-2 text-[15px] leading-[1.5] text-[#F7F5EE]/90"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#F19020]" aria-hidden="true" />{input}</li>)}
                  </ul>
                </div>}
                {stage.outputs?.length > 0 && <div>
                  <p className="sys-chip text-[#F7F5EE]/75">What you leave with</p>
                  <ul className="mt-2 space-y-2">
                    {stage.outputs.map((output) => <li key={output} className="flex items-start gap-2 text-[15px] leading-[1.5] text-[#F7F5EE]/90"><Check size={14} className="mt-1 shrink-0 accent-orange-text" aria-hidden="true" />{output}</li>)}
                  </ul>
                </div>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
