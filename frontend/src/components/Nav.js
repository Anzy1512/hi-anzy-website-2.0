import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, LogIn, LogOut } from "lucide-react";
import { NAV_LINKS } from "@/data/content";
import { SITE_CONTACT } from "@/data/site";
import { Picture } from "@/components/Picture";
import { MagneticButton } from "@/components/MagneticButton";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { track } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { subscribeScroll, isDarkUnderNav } from "@/lib/motion";
import { MenuConstellation } from "@/components/MenuConstellation";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Nav = () => {
  const location = useLocation();
  const { user, loading, login, logout } = useAuth();
  const listRef = useRef(null);
  const [bar, setBar] = useState({ left: 0, width: 0, visible: false });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);

  // A route change or a wider viewport must also release the mobile sheet's
  // focus trap and scroll lock.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1180px)");
    const closeOnDesktop = (event) => { if (event.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  // Header contrast: read the surface actually painted under the bar so the
  // labels never sit on a same-shade backdrop.
  useEffect(() => {
    let frame = 0;
    const evaluate = (scroll) => {
      setScrolled(scroll > 8);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setOnDark(isDarkUnderNav(84));
      });
    };
    const unsubscribe = subscribeScroll(evaluate);
    // Re-check once the route's content has painted.
    const settle = setTimeout(() => setOnDark(isDarkUnderNav(84)), 400);
    return () => {
      unsubscribe();
      clearTimeout(settle);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  // Radix's Dialog/Sheet locks native scroll (overflow: hidden on <body>),
  // but Lenis re-implements scrolling in JS on top of that and never checks
  // it — so with the menu open, a wheel or touch gesture still drove the
  // page underneath while the panel itself stayed fixed on screen. Stopping
  // Lenis for the lifetime of the sheet closes that gap the same way the
  // network page's fullscreen dialog already does.
  useEffect(() => {
    if (!open) return undefined;
    if (window.__lenis) window.__lenis.stop();
    return () => {
      if (window.__lenis) window.__lenis.start();
    };
  }, [open]);

  const positionBar = () => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector("[data-active='true']");
    if (!active) {
      setBar((b) => ({ ...b, visible: false }));
      return;
    }
    const lr = list.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    setBar({ left: ar.left - lr.left, width: ar.width, visible: true });
  };

  useEffect(() => {
    positionBar();
    const t = setTimeout(positionBar, 350);
    window.addEventListener("resize", positionBar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", positionBar);
    };

  }, [location.pathname]);

  return (
    <header
      className={`nav-shell fixed top-0 inset-x-0 z-50 ${scrolled ? "nav-shell--scrolled" : ""} ${onDark ? "nav-shell--dark" : ""}`}
      data-testid="site-nav"
      data-nav-theme={onDark ? "dark" : "light"}
    >
      {/* First tabbable on every page. Off-screen until focused, so it costs
          sighted readers nothing and saves everyone else eleven Tab presses. */}
      <a href="#main" className="skip-link" data-testid="skip-to-content">
        Skip to content
      </a>
      <div className="container-page flex h-[84px] items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo" aria-label="hiAnzy home">
          <span className="nav-logo-stack">
            <Picture src="/brand/logo-dark.png" alt="hiAnzy" width="1167" height="388" className="nav-logo-img h-[34px] w-auto sm:h-[40px]" style={{ opacity: onDark ? 0 : 1 }} />
            <Picture src="/brand/logo-light.png" alt="" aria-hidden="true" width="667" height="220" className="nav-logo-img h-[34px] w-auto sm:h-[40px]" style={{ opacity: onDark ? 1 : 0 }} />
          </span>
        </Link>

        {/* Desktop */}
        <nav aria-label="Primary" className="hidden min-[1180px]:block">
          <div ref={listRef} className="relative flex items-center gap-6">
            {/* The logo, right beside this, already goes home — a "Home" link
                here is a second, redundant control for the same destination. */}
            {NAV_LINKS.filter((l) => l.to !== "/").map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`nav-item-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="nav-link font-display relative py-2 text-[15.5px] font-semibold tracking-[0.035em]"
              >
                {({ isActive }) => <span data-active={isActive}>{l.label}</span>}
              </NavLink>
            ))}
            <span className="nav-route-bar" style={{ left: bar.left, width: bar.width, opacity: bar.visible ? 1 : 0 }} aria-hidden="true" />
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {/* Night mode. Small on purpose — a preference control, not a call
              to action. Shown at every width, unlike the palette trigger,
              because a phone in a dark room is exactly where it matters. */}
          <ThemeToggle />

          {/* Discoverable entry point for the palette. A shortcut nobody is
              told about is a shortcut nobody uses, and this is the site's
              main search. Hidden on touch, where there is no key to press. */}
          <button
            type="button"
            className="cmdk-trigger"
            onClick={() => window.__openCommandPalette && window.__openCommandPalette()}
            aria-label="Search this site"
            data-testid="nav-command-trigger"
          >
            Search
            <kbd className="cmdk-kbd">&#8984;K</kbd>
          </button>

          {/* Emergent managed Google sign-in */}
          {!loading && !user && (
            <button
              type="button"
              onClick={login}
              className="nav-chip sys-chip hidden items-center gap-1.5 rounded-full border px-3.5 py-2 sm:inline-flex"
              data-testid="nav-sign-in-btn"
            >
              <LogIn size={13} /> SIGN IN
            </button>
          )}
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#F19020] transition-transform hover:scale-105" data-testid="nav-user-avatar" aria-label="Account menu">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-display text-sm font-bold text-[#232A2A]">{(user.name || "U").slice(0, 1).toUpperCase()}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-[#232A2A]/15 bg-[#F7F5EE]">
                <DropdownMenuLabel data-testid="nav-user-name">
                  <span className="font-display text-[15px] text-[#232A2A]">{user.name}</span>
                  <p className="font-mono-sys text-[12.5px] font-normal text-[#232A2A]/55">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer accent-signal-text focus:text-[#E54A25]" data-testid="nav-logout-btn">
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <MagneticButton href={`mailto:${SITE_CONTACT.email}`} className="btn-ink nav-cta hidden sm:inline-flex" hoverText="Good start." testId="nav-say-hi-cta" onClick={() => track("cta_primary_click", { cta: "say_hi_nav" })}>
            Say Hi
          </MagneticButton>

          {/* Mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="nav-mobile-toggle nav-chip inline-flex h-11 w-11 items-center justify-center rounded-lg border min-[1180px]:hidden" aria-label={open ? "Close menu" : "Open menu"} data-state={open ? "open" : "closed"} data-testid="nav-mobile-toggle">
                <Menu size={18} />
              </button>
            </SheetTrigger>
            {/* No `relative` here. cn() is tailwind-merge, so a position
                utility passed in from outside is treated as conflicting with
                the `fixed` that sheetVariants sets, and the caller wins — which
                silently dropped `fixed`, and with it `inset-y-0` and `h-full`.
                The panel then laid out in normal flow at the foot of a 17,000px
                document: the overlay dimmed the page and the menu was nowhere
                on screen. `fixed` is itself a containing block, so the
                constellation and the close button still position against it. */}
            <SheetContent side="right" aria-describedby={undefined} className="nav-mobile-panel w-[min(340px,100vw)] overflow-hidden border-l border-[#232A2A]/15 bg-[#E0D8C1] p-0">
              <SheetTitle className="sr-only">Site navigation</SheetTitle>
              {/* The panel was a flat list on a flat ground. The constellation
                  gives it the network motif the rest of the site runs on, and
                  it only exists while the sheet is mounted. */}
              <MenuConstellation className="pointer-events-none absolute inset-x-0 top-0 h-[46%] w-full opacity-70" testId="nav-mobile-constellation" />
              <nav aria-label="Mobile" data-lenis-prevent className="nav-mobile-nav relative flex h-full flex-col justify-between gap-8 overflow-y-auto overscroll-contain p-6 pt-14">
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.filter((l) => l.to !== "/").map((l, i) => {
                    // Radix's asChild clones props onto the child through Slot,
                    // which stringifies a function className straight into the
                    // class attribute — the literal source text ends up in the
                    // DOM and both style branches apply at once. Resolve the
                    // active state here and hand Slot a plain string.
                    const isActive =
                      l.to === "/" ? location.pathname === "/" : location.pathname.startsWith(l.to);
                    return (
                      <SheetClose asChild key={l.to}>
                        <Link
                          to={l.to}
                          aria-current={isActive ? "page" : undefined}
                          data-testid={`nav-mobile-item-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                          style={{ "--mobile-item-index": i }}
                          className={`nav-mobile-item font-display rounded-lg px-3 py-2.5 text-3xl transition-colors ${
                            isActive ? "bg-[#232A2A] text-[#F7F5EE]" : "text-[#232A2A] hover:bg-[#232A2A]/8"
                          }`}
                        >
                          {l.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
                <div className="space-y-3">
                  <SheetClose asChild>
                    <a href={`mailto:${SITE_CONTACT.email}`} className="btn-orange w-full justify-center" data-testid="nav-mobile-say-hi" onClick={() => track("cta_primary_click", { cta: "say_hi_mobile" })}>
                      Say Hi
                    </a>
                  </SheetClose>
                  <p className="sys-chip text-center text-[#232A2A]/50">From ABC to ROI</p>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
