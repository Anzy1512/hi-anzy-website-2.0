import React, { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { track } from "@/lib/api";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Night mode switch.
 *
 * Three states, not two, which is the part most implementations get wrong:
 * "light", "dark", and *unset*. An unset preference follows the operating
 * system and keeps following it — a visitor whose laptop flips to dark at
 * sunset should see this page follow, and only stop following once they have
 * actually expressed a preference here.
 *
 * The stored value is therefore only written on an explicit click. Nothing is
 * persisted just because the OS happened to be dark on the first visit.
 *
 * The switch itself uses the native View Transitions API to reveal the new
 * theme as a circle expanding from the button, rather than every colour on
 * the page cutting at once. Zero new dependencies for that — it's a browser
 * API this site already qualifies for (Chromium; Safari and Firefox fall
 * back to the plain instant swap this control always had, which is not a
 * regression, just the same behaviour it shipped with). `prefers-reduced-
 * motion` skips the transition outright rather than a same-code slower one,
 * since a circle sweeping across the whole viewport is exactly the kind of
 * motion that setting exists to suppress.
 */
const KEY = "hianzy-theme";

/** Reads the stored choice. Wrapped because Safari private mode throws. */
export const storedTheme = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch (e) {
    return null;
  }
};

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const resolveTheme = () => storedTheme() || (systemPrefersDark() ? "dark" : "light");

/** Single writer for the attribute, so nothing else has to know the shape. */
export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.setAttribute("data-theme", "light");
};

export const ThemeToggle = ({ className = "" }) => {
  const [theme, setTheme] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") || "light"
      : "light"
  );
  const btnRef = useRef(null);

  // Follow the OS for as long as the reader has not chosen for themselves.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (storedTheme()) return; // an explicit choice outranks the OS
      const next = mq.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else if (mq.removeListener) mq.removeListener(onChange);
    };
  }, []);

  const commit = useCallback(
    (next) => {
      applyTheme(next);
      setTheme(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {
        /* private mode — the choice just does not survive the session */
      }
      track("theme_changed", { to: next });
    },
    []
  );

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";

    const canAnimate =
      !prefersReducedMotion() &&
      typeof document.startViewTransition === "function" &&
      btnRef.current;

    if (!canAnimate) {
      commit(next);
      return;
    }

    // The circle's radius has to reach the farthest corner from the button,
    // not just its own size, or the sweep visibly stops short of the edges.
    const r = btnRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const reach = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );

    const transition = document.startViewTransition(() => commit(next));

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${reach}px at ${cx}px ${cy}px)`],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        /* transition was skipped or interrupted — commit() already ran */
      });
  }, [theme, commit]);

  const dark = theme === "dark";

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      className={`theme-toggle ${className}`}
      // The control's own name states what it does, not what it currently is.
      aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={dark}
      title={dark ? "Day mode" : "Night mode"}
      data-testid="theme-toggle"
    >
      {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
