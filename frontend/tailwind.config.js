/**
 * Tailwind's default opacity scale is coarse (…70, 75, 80, 90…), and the colour
 * modifier `text-[#F7F5EE]/78` resolves against it. An off-scale value emits no
 * rule at all — the class silently does nothing and the element falls back to
 * inherited colour, which on a charcoal panel meant ink-on-ink at 1.08:1.
 *
 * The fix is to declare every step this codebase uses. Listing them explicitly
 * rather than generating 0–100 keeps the theme small and makes the intent
 * readable — if you add a new tint, add it here or it will silently no-op.
 */
const OPACITY_STEPS = [
  // Tailwind's defaults
  0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100,
  // plus every off-scale value this codebase actually uses
  2, 3, 4, 8, 12, 14, 15, 35, 45, 55, 62, 65, 72, 74, 78, 82, 85, 88,
];

const opacityScale = Object.fromEntries(
  OPACITY_STEPS.sort((a, b) => a - b).map((n) => [String(n), String(n / 100)])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      opacity: opacityScale,
      colors: {
        paper: "#E0D8C1",
        ink: "#232A2A",
        orange: "#F19020",
        signal: "#E54A25",
        "digital-white": "#F7F5EE",
        panel: "#1F2525",
      },
      fontFamily: {
        display: ["Rajdhani", "system-ui", "sans-serif"],
        editorial: ["Figtree", "system-ui", "sans-serif"],
        "mono-sys": ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1280px",
      },
      animation: {
        "marquee-left": "marquee-left 28s linear infinite",
      },
      keyframes: {
        "marquee-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
