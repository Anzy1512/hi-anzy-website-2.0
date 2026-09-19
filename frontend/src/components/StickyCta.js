import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { subscribeScroll } from "@/lib/motion";
import { track } from "@/lib/api";

/**
 * A quiet persistent CTA, for the long pages.
 *
 * The home page is 17,755px — about twenty screens — and after the hero
 * scrolled away there was no way to act without navigating back up or reaching
 * the footer. The strongest conversion assets on that page (the diagnostic
 * offer, the proof strip) sit deep in a scroll most readers never finish.
 *
 * Rules it follows, because a sticky bar is very easy to make obnoxious:
 *  - Never on /contact. Offering "talk to us" on the page that is the form is
 *    noise, and it would compete with the real submit button.
 *  - Only on pages long enough to need it (2.5 viewports), so short routes
 *    like /careers never grow one.
 *  - Appears after the hero is genuinely gone, not on the first flick.
 *  - Stays up for one section's worth of scroll, then retreats. Earlier this
 *    stayed mounted all the way to the footer, which meant it kept floating
 *    over every section for the rest of a long page (screenshots caught it
 *    sitting on top of unrelated sections it had nothing to do with). A
 *    fixed-length window keeps it tied to the moment it was meant for.
 *  - Retreats near the footer too, which has its own CTA — two competing
 *    calls to action stacked on top of each other is worse than neither.
 *  - Dismissible, and it stays dismissed for the session.
 *  - Stands down while a `.sticky-cta-avoid` element is on screen — a page
 *    can opt a section into this (e.g. the Work page's Orbit deck) when that
 *    section has its own dense interactive content and CTA. Found live: the
 *    bar's show window (1.4-3.2 viewports) overlapped the Orbit deck's active
 *    card, covering its own "Explore" link with this bar's "Start a
 *    Conversation" one. Scroll-window tuning can't fix this in general since
 *    the collision depends on a specific page's layout, not scroll position
 *    alone — an opt-in avoid-zone is the targeted fix.
 */
const SHOW_AFTER = 1.4;   // viewports scrolled before it appears
const HIDE_AFTER = 3.2;   // viewports scrolled before it retreats on its own
const MIN_PAGE   = 2.5;   // viewports of page before it is worth having
const FOOTER_GAP = 900;   // px from the bottom where it stands down

export const StickyCta = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [avoiding, setAvoiding] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    setAvoiding(false);
    // An avoid-zone (e.g. the Orbit deck) can mount after its own page's data
    // fetch resolves, later than this effect's first run -- mirrors
    // ScrollToTop's retry poll in lib/motion.js for the same late-mount
    // problem. MutationObserver would also work but is overkill for an
    // element that only ever needs to be found once per route.
    const observer = new IntersectionObserver(
      (entries) => {
        setAvoiding((prev) => {
          const next = new Set(prev instanceof Set ? prev : []);
          entries.forEach((entry) => {
            if (entry.isIntersecting) next.add(entry.target);
            else next.delete(entry.target);
          });
          return next;
        });
      },
      { threshold: 0.15 }
    );
    const observed = new Set();
    let tries = 0;
    let poll = null;
    const scan = () => {
      document.querySelectorAll(".sticky-cta-avoid").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      });
      tries += 1;
      if (tries < 20) poll = setTimeout(scan, 300);
    };
    scan();
    return () => {
      if (poll) clearTimeout(poll);
      observer.disconnect();
    };
  }, [pathname]);

  const isAvoiding = avoiding instanceof Set && avoiding.size > 0;

  useEffect(() => {
    if (dismissed) return undefined;
    if (pathname === "/contact") return undefined;

    const off = subscribeScroll((y) => {
      const vh = window.innerHeight;
      const docH = document.body.scrollHeight;
      if (docH < vh * MIN_PAGE) {
        setVisible(false);
        return;
      }
      const inWindow = y > vh * SHOW_AFTER && y < vh * HIDE_AFTER;
      const nearFooter = y + vh > docH - FOOTER_GAP;
      setVisible(inWindow && !nearFooter);
    });
    return () => off && off();
  }, [pathname, dismissed]);

  if (dismissed || pathname === "/contact") return null;

  const shown = visible && !isAvoiding;

  return (
    <div
      className={`sticky-cta ${shown ? "is-in" : ""}`}
      data-testid="sticky-cta"
      aria-hidden={shown ? undefined : "true"}
    >
      <p className="sticky-cta-copy">
        Not sure which part is broken? <span className="sticky-cta-sub">That is the usual starting point.</span>
      </p>
      <div className="sticky-cta-actions">
        <Link
          to="/contact"
          className="btn-orange"
          tabIndex={shown ? 0 : -1}
          onClick={() => track("cta_primary_click", { cta: "sticky_bar", from: pathname })}
          data-testid="sticky-cta-link"
        >
          Start a Conversation <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          className="sticky-cta-close"
          onClick={() => setDismissed(true)}
          tabIndex={shown ? 0 : -1}
          aria-label="Dismiss this bar"
          data-testid="sticky-cta-dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default StickyCta;
