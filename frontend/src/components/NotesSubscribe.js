import React, { useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { subscribe, track } from "@/lib/api";

/**
 * The one place the site asks for an address without asking for a project.
 *
 * Before this there was no way to follow the work at all: the only capture on
 * the whole site was the contact form, which asks for company, role, budget
 * band and timeline. That form is right for someone ready to talk and far too
 * much for someone who just read one note and wants the next one — so the
 * people who are months away from a brief left no trace.
 *
 * Deliberately one field. Every extra field here would be an extra reason to
 * close the tab, and none of them would be worth more than the address.
 *
 * The honeypot matches the contact form's: a field that is positioned off the
 * page rather than `display: none`, because some bots skip hidden inputs but
 * almost all of them fill a visible-to-the-DOM text field called something
 * plausible. Real people never see it; the API discards anything that fills it.
 */
export const NotesSubscribe = ({
  source = "insights",
  className = "",
  testId = "notes-subscribe",
  heading = "GET THE NOTES",
  body = "One note when there is something worth saying.",
  bodyDetail = "Business systems, brand clarity and the occasional argument about why the funnel is not the problem. No schedule, because we would rather send nothing than send filler.",
  ctaLabel = "Send Me the Notes",
}) => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const trapRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (state === "sending") return;

    const value = email.trim();
    // Same shape the input's own validation uses; this is the belt to its braces.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("That address does not look right. Check it and try again.");
      setState("error");
      return;
    }

    setState("sending");
    try {
      await subscribe({
        email: value,
        source,
        orgField: trapRef.current ? trapRef.current.value : "",
      });
      setState("done");
      track("notes_subscribed", { source });
    } catch (err) {
      setError(err?.response?.status === 429
        ? "Too many attempts. Please try again in a few minutes."
        : "We could not save your subscription. Please try again.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div
        className={`panel-paper flex items-start gap-3 p-6 sm:p-7 ${className}`}
        data-testid={`${testId}-done`}
        role="status"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F19020]">
          <Check size={14} strokeWidth={3} className="text-[#232A2A]" />
        </span>
        <div>
          <p className="font-display text-xl text-[#232A2A]">
            Done. You are on the list.
          </p>
          <p className="font-mono-sys mt-1.5 text-[12.5px] leading-relaxed text-[#232A2A]/60">
            Notes only. No sequences, no drip, no “quick check-in”. Unsubscribe from any of them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Reveal>
      <form
        onSubmit={onSubmit}
        noValidate
        className={`panel-paper p-6 sm:p-7 ${className}`}
        data-testid={testId}
      >
        <p className="sys-chip text-[#232A2A]/55">{heading}</p>
        <p className="font-display mt-2 max-w-[24ch] text-[clamp(1.35rem,2vw,1.75rem)] leading-[1.14] text-[#232A2A]">
          {body}
        </p>
        <p className="mt-2.5 max-w-[46ch] text-[15.5px] leading-[1.55] text-[#232A2A]/72">
          {bodyDetail}
        </p>

        {/* `sm:flex-1`, never a bare `flex-1`. Below sm this is a column, and
            on the column's main axis `flex: 1 1 0%` resolves the *height* from
            free space that a content-sized container does not have — which
            overrode h-12 and collapsed the field to 21px on a phone. */}
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <label htmlFor={`${testId}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${testId}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder="you@company.com"
            aria-invalid={state === "error" ? "true" : undefined}
            aria-describedby={state === "error" ? `${testId}-err` : undefined}
            className="h-12 min-w-0 sm:flex-1 rounded-[12px] border border-[#232A2A]/30 bg-[#F7F5EE] px-4 text-[16px] text-[#232A2A] outline-none transition-colors placeholder:text-[#232A2A]/40 focus:border-[#232A2A]"
            data-testid={`${testId}-input`}
          />
          <button
            type="submit"
            className="btn-ink h-12 justify-center"
            disabled={state === "sending"}
            data-testid={`${testId}-submit`}
          >
            {state === "sending" ? "Sending…" : ctaLabel}
            <ArrowRight size={15} />
          </button>
        </div>

        {state === "error" && (
          <p
            id={`${testId}-err`}
            role="alert"
            className="font-mono-sys mt-2.5 text-[12.5px] accent-signal-text"
            data-testid={`${testId}-error`}
          >
            {error}
          </p>
        )}

        <p className="font-mono-sys mt-3 text-[12px] leading-relaxed text-[#232A2A]/50">
          Your address is used for the notes and nothing else. It is never sold or passed on.
        </p>

        {/* Honeypot — off-page rather than hidden, and never announced. */}
        <input
          ref={trapRef}
          type="text"
          name="organisation"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
      </form>
    </Reveal>
  );
};
