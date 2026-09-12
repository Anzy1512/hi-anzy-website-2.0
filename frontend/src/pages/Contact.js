import React, { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NextSteps } from "@/components/NextSteps";
import { PopIllustration } from "@/components/PopIllustration";
import { Picture } from "@/components/Picture";
import { useRevealObserver } from "@/lib/motion";
import { submitContact, track } from "@/lib/api";
import { abs } from "@/lib/absoluteUrl";
import { SITE_CONTACT } from "@/data/site";

const STAGES = ["Idea", "Early", "Growing", "Scaling", "Established", "Turnaround"];
const RANGES = ["Under ₹2L", "₹2–10L", "₹10–50L", "₹50L+", "Let's discuss"];
const TIMELINES = ["As soon as possible", "This month", "This quarter", "Exploring"];

const FieldLabel = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="sys-chip mb-2 block text-[#232A2A]/65">
    {children} {required && <span className="accent-signal-text">*</span>}
  </label>
);

export default function Contact() {
  const ref = useRevealObserver();
  const startedRef = useRef(false);
  const [params] = useSearchParams();

  /**
   * The package builder hands off here as ?services=slug:Module|slug:Module.
   * It is turned into a readable opening paragraph rather than left as a code
   * — the person still has to be able to read, and edit, what they are sending.
   */
  const prefilledMessage = useMemo(() => {
    const raw = params.get("services");
    if (!raw) return "";
    const picked = raw
      .split("|")
      // rejoin: only the first colon separates slug from name, and a service
      // name is free to contain one.
      .map((chunk) => chunk.split(":").slice(1).join(":"))
      .filter(Boolean);
    if (picked.length === 0) return "";
    const lines = picked.map((m) => "• " + m).join("\n");
    return (
      "I put a rough brief together on your site. The pieces I picked:\n\n" +
      lines +
      "\n\nContext: "
    );
  }, [params]);

  // Abandonment needs to know a submit already happened, so a reader who fills
  // the form and leaves is not counted as having dropped out. startedRef and
  // started() above already handle the "began filling" half.
  const submittedRef = useRef(false);
  const inFlightRef = useRef(false);

  const [form, setForm] = useState({ name: "", company: "", role: "", website: "", message: prefilledMessage, stage: "", investmentRange: "", timeline: "", email: "", phone: "", orgField: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Memoised deliberately: Seo re-runs its whole head-write effect whenever
  // the jsonLd reference changes, and this page re-renders on every
  // keystroke in the form. An inline object literal here would rewrite the
  // title, ten meta tags and both JSON-LD blocks on each character typed.
  const jsonLd = useMemo(
    () => ({ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact hiAnzy", url: abs("/contact") }),
    []
  );

  const started = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("contact_started");
    }
  };

  const set = (k) => (e) => {
    started();
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  /** Returns the error map so the caller can act on it without waiting for state. */
  const validate = () => {
    const er = {};
    if (!form.name || form.name.trim().length < 2) er.name = "Please enter a name with at least 2 characters.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = "Please enter a valid email address.";
    if (!form.message || form.message.trim().length < 10) er.message = "Please describe your project in at least 10 characters.";
    setErrors(er);
    return er;
  };

  /** Tab order of the validated fields, so "first invalid" means first on screen. */
  const FIELD_ORDER = ["name", "email", "message"];

  React.useEffect(() => {
    const report = () => {
      if (document.visibilityState !== "hidden") return;
      if (!startedRef.current || submittedRef.current) return;
      submittedRef.current = true; // report once, not on every tab switch
      const filled = Object.entries(form)
        .filter(([k, v]) => k !== "orgField" && v)
        .map(([k]) => k);
      track("contact_form_abandoned", { filled: filled.join(","), count: filled.length });
    };
    document.addEventListener("visibilitychange", report);
    return () => document.removeEventListener("visibilitychange", report);
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    const er = validate();
    if (Object.keys(er).length > 0) {
      // Focus the first field that failed. The previous version queried
      // [data-error='true'] on the line after setErrors, which runs before
      // React has committed it — the attribute did not exist yet, the query
      // returned null, and an invalid submit left focus on <body> with the
      // errors somewhere off screen. Going through the id after a frame is
      // what actually moves it.
      track("contact_validation_failed", { fields: Object.keys(er).join(",") });
      const firstKey = FIELD_ORDER.find((k) => er[k]);
      if (firstKey) {
        requestAnimationFrame(() => {
          const el = document.getElementById(`cf-${firstKey}`);
          if (el) el.focus();
        });
      }
      return;
    }
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      await submitContact(payload);
      setSuccess(true);
      submittedRef.current = true;
      track("contact_completed");
    } catch (err) {
      const msg = err?.response?.status === 429 ? "Too many messages were sent in a short time. Please wait 10 minutes and try again." : "Your message could not be sent. Your details are still here; please try again.";
      toast.error(msg);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div ref={ref} className="pt-[84px]" data-testid="contact-page">
      <Seo
        title="Say Hi | hiAnzy"
        description="Tell us what you are building, what feels stuck, what changed, or what opportunity refuses to leave your head. A person will read it."
        jsonLd={jsonLd}
      />
      <section className="container-page section-pad">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal as="p" className="sys-chip flex items-center gap-3 text-[#232A2A]/60">
              <span className="inline-block h-[3px] w-10 rounded-full bg-[#F19020]" /> CONTACT
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display mt-5 leading-[0.92] text-[#232A2A] text-[clamp(3.4rem,7vw,6.4rem)]" data-testid="contact-h1">
                Say Hi<span className="accent-signal-text">.</span>
              </h1>
            </Reveal>
            <Reveal delay={160} as="p" className="mt-6 max-w-md text-base leading-relaxed text-[#232A2A]/85">
              Tell us what you want to achieve, what is getting in the way and any timing or budget constraints. You can start with the problem; we will help shape the next step.
            </Reveal>
            <Reveal delay={220} as="p" className="mt-5 text-[14px] leading-relaxed text-[#232A2A]/75">Have a brief or portfolio? Include a link in your message. Make sure the link is accessible to the people reviewing it.
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-7 border-t border-[#232A2A]/15 pt-5" data-testid="contact-direct-details">
                <p className="sys-chip text-[#232A2A]/50">Prefer a direct line?</p>
                <div className="mt-3 flex flex-col items-start gap-2 text-[16px] text-[#232A2A]/85">
                  <a className="link-draw font-semibold" href={`mailto:${SITE_CONTACT.email}`} data-testid="contact-direct-email">{SITE_CONTACT.email}</a>
                  <a className="link-draw" href={SITE_CONTACT.phoneHref} data-testid="contact-direct-phone">{SITE_CONTACT.phone}</a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <figure className="float-el mt-10 hidden max-w-[250px] lg:block" style={{ "--rot": "-1.5deg" }} data-testid="contact-walkers-art">
                <div className="scrap">
                  <Picture src="/brand/char-walkers.jpg" width="522" height="980" alt="Two camera-headed figures walking in, halftone collage" loading="lazy" />
                </div>
              </figure>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            {success ? (
              <div className="panel-dark relative overflow-hidden p-10 sm:p-14" data-testid="contact-form-success-message" role="status">
                <div className="h-[4px] w-24 rounded-full bg-[#F19020]" />
                <p className="font-display mt-6 text-5xl leading-none text-[#F7F5EE]">Message received.</p>
                <p className="mt-4 max-w-md text-lg text-[#F7F5EE]/85">Thank you for sharing the context. Your message has been received for review.</p>
                <p className="mt-6 text-[14px] text-[#F7F5EE]/75">We will use the email address you provided to reply.</p>
                <MagneticButton to="/work" className="btn-orange mt-8" testId="contact-success-work-link">
                  Explore Our Work <ArrowRight size={15} />
                </MagneticButton>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="panel-paper p-7 sm:p-10" data-testid="contact-form">
                <p className="font-mono-sys mb-6 text-[12.5px] leading-relaxed text-[#232A2A]/55" data-testid="contact-form-intro">
                  Three fields are all we need: your name, your email and what is going on. Everything else is optional and only helps us come back to you with something useful.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="cf-name" required>NAME</FieldLabel>
                    <Input id="cf-name" maxLength={120} data-testid="contact-form-field-name" data-error={!!errors.name} value={form.name} onChange={set("name")} placeholder="Who's asking?" aria-invalid={!!errors.name} aria-describedby={errors.name ? "cf-name-err" : undefined} className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                    {errors.name && <p id="cf-name-err" role="alert" data-testid="contact-form-error-name" className="mt-1.5 text-[12px] font-semibold accent-signal-text">{errors.name}</p>}
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-email" required>EMAIL</FieldLabel>
                    <Input id="cf-email" maxLength={254} type="email" data-testid="contact-form-field-email" data-error={!!errors.email} value={form.email} onChange={set("email")} placeholder="you@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "cf-email-err" : undefined} className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                    {errors.email && <p id="cf-email-err" role="alert" data-testid="contact-form-error-email" className="mt-1.5 text-[12px] font-semibold accent-signal-text">{errors.email}</p>}
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-company">COMPANY (OPTIONAL)</FieldLabel>
                    <Input id="cf-company" maxLength={200} data-testid="contact-form-field-company" value={form.company} onChange={set("company")} placeholder="Or the idea's working title" className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-role">ROLE (OPTIONAL)</FieldLabel>
                    <Input id="cf-role" maxLength={200} data-testid="contact-form-field-role" value={form.role} onChange={set("role")} placeholder="Founder, CMO, the person who noticed" className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="cf-website">WEBSITE (OPTIONAL)</FieldLabel>
                    <Input id="cf-website" maxLength={300} data-testid="contact-form-field-website" value={form.website} onChange={set("website")} placeholder="https://, if it exists yet" className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="cf-message" required>TELL US ABOUT YOUR PROJECT</FieldLabel>
                    <Textarea id="cf-message" maxLength={4000} rows={6} data-testid="contact-form-field-message" data-error={!!errors.message} value={form.message} onChange={set("message")} placeholder="Messy is fine. Screenshots-described-in-words is fine. 'Something feels off' is a perfectly good brief." aria-invalid={!!errors.message} aria-describedby={errors.message ? "cf-message-err" : undefined} className="border-[#232A2A]/30 bg-[#F7F5EE]" />
                    {errors.message && <p id="cf-message-err" role="alert" data-testid="contact-form-error-message" className="mt-1.5 text-[12px] font-semibold accent-signal-text">{errors.message}</p>}
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-stage">CURRENT STAGE (OPTIONAL)</FieldLabel>
                    <select id="cf-stage" data-testid="contact-form-field-stage" className="select-native" value={form.stage} onChange={(e) => { started(); setForm((f) => ({ ...f, stage: e.target.value })); }}>
                      <option value="">Pick one</option>
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-range">INVESTMENT RANGE (OPTIONAL)</FieldLabel>
                    <select id="cf-range" data-testid="contact-form-field-investment" className="select-native" value={form.investmentRange} onChange={(e) => { started(); setForm((f) => ({ ...f, investmentRange: e.target.value })); }}>
                      <option value="">Select a range</option>
                      {RANGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-timeline">TIMELINE (OPTIONAL)</FieldLabel>
                    <select id="cf-timeline" data-testid="contact-form-field-timeline" className="select-native" value={form.timeline} onChange={(e) => { started(); setForm((f) => ({ ...f, timeline: e.target.value })); }}>
                      <option value="">Select a timeline</option>
                      {TIMELINES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="cf-phone">PHONE (OPTIONAL)</FieldLabel>
                    <Input id="cf-phone" maxLength={40} data-testid="contact-form-field-phone" value={form.phone} onChange={set("phone")} placeholder="If calls are your thing" className="h-11 border-[#232A2A]/30 bg-[#F7F5EE]" />
                  </div>
                  {/* honeypot — humans never see or fill this */}
                  <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
                    <label htmlFor="cf-org">Organisation field</label>
                    <input id="cf-org" tabIndex={-1} autoComplete="off" value={form.orgField} onChange={(e) => setForm((f) => ({ ...f, orgField: e.target.value }))} />
                  </div>
                </div>
                <div className="relative mt-8 flex flex-wrap items-center gap-5 lg:pr-28">
                  <PopIllustration src="/brand/pop-white-flag.png" width={72} rotate={3} drift={8} halo={false} className="pointer-events-none absolute top-0 right-0" testId="pop-contact" />
                  <MagneticButton type="submit" disabled={submitting} className="btn-ink" testId="contact-form-submit-button">
                    {submitting ? "Sending…" : "Send Message"} <ArrowRight size={15} />
                  </MagneticButton>
                  <p className="text-[13px] leading-relaxed text-[#232A2A]/75">We use these details to understand your enquiry and reply.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <NextSteps from="/contact" />
    </div>
  );
}
