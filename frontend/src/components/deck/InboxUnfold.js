import React, { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { MotifFrame } from "@/components/deck/MotifFrame";

/**
 * "The inbox" — /how-we-work.
 *
 * Deck source: the second page, styled as a message sitting in an inbox — "this
 * deck is our story in motion… scroll slowly… and when it feels right, let's
 * talk." The engagement starts as a note from one person to another, which is
 * exactly what this page says in words: "Usually with a conversation. Sometimes
 * with a brief. Sometimes with screenshots."
 *
 * So the flap opens and the five stages slide out of it in order. The envelope
 * is where the work begins; the ruled lines are what it turns into.
 *
 * Chosen over the deck's flag-through-a-hole, which the site already carries as
 * pop-white-flag on /contact and the service pages — the brief was to bring
 * over what is *not* already here.
 *
 * SVG and GSAP: folding geometry needs exact vertices, and the five labels have
 * to stay real text so they scale with the reader's type size.
 */
const STAGES = ["AUDIT", "ARCHITECT", "BUILD", "CONNECT", "SCALE"];

const BODY_X = 40;
const BODY_Y = 122;
const BODY_W = 240;
const BODY_H = 150;

export const InboxUnfold = ({ className = "", testId = "motif-inbox-unfold" }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const flap = root.querySelector("[data-flap]");
    const lines = root.querySelectorAll("[data-line]");
    const seal = root.querySelector("[data-seal]");

    const settle = () => {
      gsap.set(flap, { rotateX: -168, transformOrigin: "center top" });
      gsap.set(lines, { opacity: 1, y: 0 });
      gsap.set(seal, { opacity: 1, scale: 1 });
    };

    if (prefersReducedMotion()) {
      settle();
      return undefined;
    }

    gsap.set(flap, { rotateX: 0, transformOrigin: "center top" });
    gsap.set(lines, { opacity: 0, y: 26 });
    gsap.set(seal, { opacity: 0, scale: 0.5, transformOrigin: "center" });

    const tl = gsap.timeline({ paused: true });
    tl.to(flap, { rotateX: -168, duration: 0.85, ease: "power3.inOut" })
      // the five stages come out of the envelope in the order the page reads
      .to(
        lines,
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.11, ease: "power2.out" },
        "-=0.34"
      )
      .to(seal, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)" }, "-=0.3");

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          tl.play();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      tl.kill();
    };
  }, []);

  const poster = (
    <svg
      ref={rootRef}
      viewBox="0 0 320 320"
      className="h-full w-full"
      style={{ perspective: 620 }}
      data-testid={`${testId}-svg`}
    >
      {/* the five stages, riding out of the envelope mouth */}
      <g>
        {STAGES.map((s, i) => (
          <g key={s} data-line>
            <rect
              x={BODY_X + 22}
              y={96 - i * 17}
              width={BODY_W - 44}
              height="12"
              rx="3"
              fill={i === 0 ? "#F19020" : "#F7F5EE"}
              stroke="#232A2A"
              strokeWidth="1.4"
            />
            <text
              x={BODY_X + 30}
              y={105 - i * 17}
              fontSize="8.2"
              letterSpacing="0.1em"
              fontFamily="'Rajdhani', sans-serif"
              fontWeight="600"
              fill="#232A2A"
            >
              {s}
            </text>
          </g>
        ))}
      </g>

      {/* envelope body */}
      <rect
        x={BODY_X}
        y={BODY_Y}
        width={BODY_W}
        height={BODY_H}
        rx="8"
        fill="#E0D8C1"
        stroke="#232A2A"
        strokeWidth="3"
      />
      {/* the inner walls, so the mouth reads as open */}
      <path
        d={`M${BODY_X},${BODY_Y} L${BODY_X + BODY_W / 2},${BODY_Y + 62} L${BODY_X + BODY_W},${BODY_Y}`}
        fill="none"
        stroke="#232A2A"
        strokeWidth="2"
        opacity="0.4"
      />

      {/* the flap, hinged at the top */}
      <g data-flap style={{ transformBox: "fill-box" }}>
        <path
          d={`M${BODY_X},${BODY_Y} L${BODY_X + BODY_W / 2},${BODY_Y + 66} L${BODY_X + BODY_W},${BODY_Y} Z`}
          fill="#D6CCB2"
          stroke="#232A2A"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>

      {/* the seal: a plain wax-seal accent, not a second, smaller wordmark
          competing with the real hiAnzy mark elsewhere on the page */}
      <g data-seal>
        <circle cx="248" cy="252" r="24" fill="#E54A25" />
      </g>
    </svg>
  );

  return (
    <MotifFrame
      poster={poster}
      className={className}
      testId={testId}
      label="An envelope opening, with the five stages of the method sliding out of it"
    />
  );
};
