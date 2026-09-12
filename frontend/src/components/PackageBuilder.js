import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Search, X } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { CATEGORIES } from "@/data/content";
import { track } from "@/lib/api";
import { onCollapse } from "@/components/CollapseOnScroll";

/**
 * Build-your-own engagement.
 *
 * Deliberately not a shop: there is no price, no cart total and no checkout,
 * because scope here is genuinely a conversation and a number printed next to
 * a checkbox would be a lie. What it does borrow from commerce is the useful
 * part — pick the things you want, see the shape of what you picked, send it
 * in one move instead of composing an email from scratch.
 *
 * The summary is derived, never stored: which systems you have touched, which
 * method stages that implies, and the rough duration band. Selecting across
 * three systems tells you something real about the engagement, and it tells
 * us before the first call.
 */
const STAGE_ORDER = ["AUDIT", "ARCHITECT", "BUILD", "CONNECT", "SCALE"];

/**
 * What the builder offers for a category: the full deck inventory where one
 * exists, the curated shortlist otherwise. `capabilities` stays short because
 * it is also what the What We Do cards and the JSON-LD OfferCatalog render;
 * this list is the long tail and only belongs here.
 */
const modulesOf = (c) => (c.services && c.services.length ? c.services : c.capabilities);

/** Everything on offer, counted once, so the intro can state the real number. */
const TOTAL_MODULES = CATEGORIES.reduce((n, c) => n + modulesOf(c).length, 0);

export const PackageBuilder = ({ testId = "package-builder" }) => {
  const navigate = useNavigate();
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState("");
  // Real per-category open/closed state, keyed by slug. The previous version
  // set `open={ci === 0}` directly from render-time values with no state
  // behind it — <details> is natively uncontrolled (the browser owns "open"
  // once a person clicks <summary>), but handing React a fixed expression for
  // that same attribute makes React fight the browser for it. The instant
  // ANYTHING else in this component re-rendered — picking a module chip in a
  // totally different category, typing a search letter — React reconciled
  // every <details> back to `ci === 0` and slammed shut whatever the reader
  // had actually opened. Category 0 stays open on first render; after that,
  // onToggle is the only thing that ever changes this.
  //
  // A single slug, not a Set: this used to be a Set that only ever grew via
  // .add() and nothing ever removed a *previous* selection from it, so
  // opening a second category left the first one open too — tapping one
  // group visibly opened others along with it. "The first is open so the
  // control explains itself on sight" (below) was always describing a
  // one-at-a-time menu, which a Set never actually enforced.
  const [openSlug, setOpenSlug] = useState(() => CATEGORIES[0]?.slug ?? null);

  // CollapseOnScroll (mounted once in App.js) closes any open <details> once
  // the reader scrolls past it, so the page doesn't silently change length
  // under them — and because that closes the DOM directly, not through
  // React, it's exactly the kind of external mutation the comment above
  // warns about: without this, the next unrelated re-render (a chip pick, a
  // filter keystroke) would reconcile `open` back to true from openSlug and
  // silently reopen a category the reader had just scrolled away from.
  useEffect(() => onCollapse(() => setOpenSlug(null)), []);

  const q = query.trim().toLowerCase();
  const matches = (cap) => !q || cap.toLowerCase().includes(q);
  const visibleCount = CATEGORIES.reduce((n, c) => n + modulesOf(c).filter(matches).length, 0);

  const toggle = (categorySlug, capability) => {
    const key = `${categorySlug}::${capability}`;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        next.add(key);
        track("package_module_added", { category: categorySlug, module: capability });
      }
      return next;
    });
  };

  const summary = useMemo(() => {
    const categorySlugs = new Set();
    const modules = [];
    picked.forEach((key) => {
      const [slug, cap] = key.split("::");
      categorySlugs.add(slug);
      modules.push({ slug, cap });
    });
    const cats = CATEGORIES.filter((c) => categorySlugs.has(c.slug));
    const stages = STAGE_ORDER.filter((s) => cats.some((c) => c.methodStage === s));

    // A rough shape, not a quote. One system is usually a focused piece of
    // work; three or more is a programme and should be described as one.
    let shape = "Nothing selected yet";
    if (cats.length === 1) shape = "Focused engagement: one system";
    else if (cats.length === 2) shape = "Paired engagement: two systems";
    else if (cats.length >= 3) shape = `Programme: ${cats.length} systems`;

    return { cats, modules, stages, shape };
  }, [picked]);

  const send = () => {
    const params = new URLSearchParams();
    params.set(
      "services",
      summary.modules.map((m) => `${m.slug}:${m.cap}`).join("|")
    );
    track("package_brief_sent", { modules: summary.modules.length, systems: summary.cats.length });
    navigate(`/contact?${params.toString()}`);
  };

  const count = picked.size;

  return (
    <section className="container-page section-pad" id="build" data-testid={testId}>
      <SectionHeading
        kicker="BUILD YOUR OWN"
        title={<>Tick what you need.<br />We will tell you what you actually need.</>}
        testId="package-builder-heading"
        className="max-w-3xl"
      />
      <Reveal delay={80} as="p" className="mt-5 max-w-[62ch] text-[17.5px] leading-[1.6] text-[#232A2A]/80">
        Everything we and the network actually do, in one list: {TOTAL_MODULES} of them.
        No prices, because an honest number needs a conversation first and anything else
        is a guess with a currency symbol on it. Pick the pieces that sound like your
        problem and send it over. It beats writing the email from scratch.
      </Reveal>

      {/* At this length a list needs a way in, so it gets a filter. Typing
          opens whichever systems still have a match and hides the rest. */}
      <Reveal delay={120} className="mt-7 max-w-[520px]">
        <label htmlFor="builder-filter" className="sys-chip block text-[#232A2A]/55">
          FIND A SERVICE
        </label>
        <div className="relative mt-2">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#232A2A]/45" aria-hidden="true" />
          <input
            id="builder-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="packaging, automation, podcast, OOH&hellip;"
            data-testid="builder-filter"
            className="w-full rounded-full border border-[#232A2A]/20 bg-[#F7F5EE] py-3 pl-11 pr-4 text-[15px] text-[#232A2A] placeholder:text-[#232A2A]/45 focus:border-[#F19020] focus:outline-none"
          />
        </div>
        {q && (
          <p className="font-mono-sys mt-2 text-[12.5px] text-[#232A2A]/60" data-testid="builder-filter-count">
            {visibleCount === 0
              ? "Nothing by that name. Say it in your own words instead: the form takes prose."
              : `${visibleCount} service${visibleCount === 1 ? "" : "s"} match`}
          </p>
        )}
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        {/* Module picker */}
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {CATEGORIES.map((c, ci) => {
              const all = modulesOf(c);
              const shown = all.filter(matches);
              if (q && shown.length === 0) return null;
              const chosen = all.filter((cap) => picked.has(`${c.slug}::${cap}`)).length;
              return (
              <Reveal key={c.slug}>
                {/* All six open at once ran to ~1800px of chips before anyone
                    had chosen anything. Collapsed, the six systems read as a
                    menu; you open the one that sounds like your problem. The
                    first is open so the control explains itself on sight. */}
                <details
                  className="builder-group rounded-[16px] border border-[#232A2A]/12 bg-[#F7F5EE]/45 p-5 sm:p-6"
                  open={q ? true : openSlug === c.slug}
                  onToggle={(e) => {
                    // Ignore toggles fired while a search is forcing every
                    // group open — that state is not a choice to remember,
                    // and recording it would reopen everything the moment the
                    // query is cleared even for groups the reader had shut.
                    if (q) return;
                    // Exclusive: opening this one closes whichever other
                    // group was open. A toggle firing with open=false is this
                    // same group closing itself — only clear the shared slug
                    // if it's still the one that owns it, so that doesn't
                    // wipe out a different group that opened in the meantime.
                    setOpenSlug((prev) => (e.target.open ? c.slug : (prev === c.slug ? null : prev)));
                  }}
                  data-testid={`builder-details-${c.slug}`}
                >
                  <summary className="flex cursor-pointer flex-wrap items-baseline gap-3 marker:content-['']">
                    <h3 className="font-display text-[22px] leading-none text-[#232A2A]">{c.title}</h3>
                    <span className="sys-chip ml-auto text-[#232A2A]/55" data-testid={`builder-chosen-${c.slug}`}>
                      {chosen > 0 ? `${chosen} PICKED` : `${shown.length} OPTIONS`}
                    </span>
                    <span className="faq-plus shrink-0 accent-orange-text" aria-hidden="true">+</span>
                  </summary>
                  <ul className="builder-modules mt-4 flex flex-wrap gap-2" data-testid={`builder-modules-${c.slug}`}>
                    {shown.map((cap) => {
                      const key = `${c.slug}::${cap}`;
                      const on = picked.has(key);
                      return (
                        <li key={cap}>
                          <button
                            type="button"
                            onClick={() => toggle(c.slug, cap)}
                            aria-pressed={on}
                            className={`sys-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                              on
                                ? "border-[#232A2A] bg-[#232A2A] text-[#F7F5EE]"
                                : "border-[#F19020]/70 text-[#232A2A]/80 hover:border-[#F19020] hover:bg-[#F19020]/10"
                            }`}
                          >
                            {on && <Check size={12} aria-hidden="true" />}
                            {cap}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </Reveal>
              );
            })}
          </div>
        </div>

        {/* Derived summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-[100px] rounded-[16px] border border-[#232A2A]/15 bg-[#D8CFB4]/60 p-6" data-testid="package-builder-summary">
            <p className="sys-chip text-[#232A2A]/55">YOUR BRIEF</p>
            <p className="font-display mt-2 text-[26px] leading-none text-[#232A2A]" data-testid="builder-count">
              {count === 0 ? "Nothing yet" : `${count} piece${count === 1 ? "" : "s"}`}
            </p>
            <p className="font-mono-sys mt-2 text-[12.5px] text-[#232A2A]/60" data-testid="builder-shape">
              {summary.shape}
            </p>

            {summary.stages.length > 0 && (
              <div className="mt-5">
                <p className="sys-chip text-[#232A2A]/45">STAGES THIS TOUCHES</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {summary.stages.map((s) => (
                    <span key={s} className="sys-chip rounded-full bg-[#232A2A] px-2.5 py-1 text-[#F7F5EE]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {summary.modules.length > 0 && (
              <ul className="mt-5 max-h-[240px] space-y-1.5 overflow-y-auto pr-1" data-testid="builder-selected-list">
                {summary.modules.map((m) => (
                  <li key={`${m.slug}::${m.cap}`} className="flex items-start gap-2 text-[14.5px] leading-[1.4] text-[#232A2A]/80">
                    <button
                      type="button"
                      onClick={() => toggle(m.slug, m.cap)}
                      aria-label={`Remove ${m.cap}`}
                      className="mt-0.5 shrink-0 rounded-full p-0.5 text-[#A8351A] transition-colors hover:bg-[#A8351A]/12"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                    {m.cap}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={send}
              disabled={count === 0}
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-colors ${
                count === 0
                  ? "cursor-not-allowed border border-[#232A2A]/20 bg-transparent text-[#232A2A]/72"
                  : "bg-[#232A2A] text-[#F7F5EE] hover:bg-[#F19020] hover:text-[#232A2A]"
              }`}
              data-testid="builder-send"
            >
              Send this as a brief <ArrowRight size={15} aria-hidden="true" />
            </button>
            <p className="font-mono-sys mt-3 text-[12px] leading-[1.45] text-[#232A2A]/55">
              Goes to the contact form with your selection filled in. Nothing is
              charged, nothing is committed, and you can still change your mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
