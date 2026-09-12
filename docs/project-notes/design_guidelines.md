{
  "brand": {
    "name": "hiAnzy",
    "visual_territory": "ANALOG INTELLIGENCE — editorial magazine × strategy notebook × operating system × spatial computation",
    "voice": {
      "attributes": [
        "confident",
        "intelligent",
        "commercially sharp",
        "slightly poetic",
        "slightly mischievous",
        "human"
      ],
      "example_lines": [
        "Looking busy is not a growth strategy.",
        "Complexity is common. Clarity is engineered.",
        "The invoice should not be the strategy."
      ]
    }
  },
  "design_tokens": {
    "colors": {
      "paper": "#E0D8C1",
      "ink_charcoal": "#232A2A",
      "hi_anzy_orange": "#F19020",
      "signal_red": "#E54A25",
      "pure_black": "#000000",
      "digital_white": "#F7F5EE"
    },
    "typography": {
      "display": {
        "family": "League Gothic",
        "usage": "Hero H1 + editorial section headlines",
        "notes": "Tall condensed; hero H1 may reach 11–15vw on desktop"
      },
      "body": {
        "family": "Manrope",
        "usage": "Body copy, UI copy, paragraphs"
      },
      "mono": {
        "family": "IBM Plex Mono",
        "usage": "System labels, annotations, provenance tags, tiny jokes"
      }
    },
    "radius": {
      "panel": "18px",
      "card": "16px",
      "pill": "999px",
      "chip": "999px"
    },
    "route_line": {
      "thickness_px": {
        "mobile": 6,
        "desktop": 10
      },
      "cap": "round",
      "color": "#F19020",
      "shadow": "0 1px 0 rgba(0,0,0,0.25)",
      "behavior": "Travels across sections; connects headings, panels, and 3D nodes; never blocks text"
    },
    "shadows": {
      "panel": "0 18px 40px rgba(0,0,0,0.18)",
      "lift": "0 10px 24px rgba(0,0,0,0.14)",
      "hairline": "0 1px 0 rgba(0,0,0,0.25)"
    },
    "borders": {
      "hairline": "1px solid rgba(35,42,42,0.18)",
      "ink": "1px solid rgba(35,42,42,0.35)",
      "dark_hairline": "1px solid rgba(247,245,238,0.14)"
    },
    "spacing_system_px": [
      4,
      8,
      12,
      16,
      20,
      24,
      32,
      40,
      48,
      64,
      80,
      96,
      128
    ]
  },
  "global_css_and_tokens": {
    "instructions": [
      "Replace default shadcn HSL tokens in /app/frontend/src/index.css with brand tokens mapped to CSS variables.",
      "Set body background to Paper (#E0D8C1) and text to Ink/Charcoal (#232A2A).",
      "Add subtle paper grain + halftone overlay using CSS (no large images).",
      "Set text selection background to Signal Red with Digital White text.",
      "Do NOT add .App { text-align:center } anywhere."
    ],
    "css_variables": {
      ":root": {
        "--paper": "#E0D8C1",
        "--digital-white": "#F7F5EE",
        "--ink": "#232A2A",
        "--black": "#000000",
        "--orange": "#F19020",
        "--signal": "#E54A25",
        "--bg": "var(--paper)",
        "--fg": "var(--ink)",
        "--panel": "#1F2525",
        "--panel-fg": "var(--digital-white)",
        "--muted": "rgba(35,42,42,0.08)",
        "--muted-fg": "rgba(35,42,42,0.72)",
        "--border": "rgba(35,42,42,0.18)",
        "--ring": "rgba(241,144,32,0.55)",
        "--radius": "18px",
        "--shadow-panel": "0 18px 40px rgba(0,0,0,0.18)",
        "--shadow-lift": "0 10px 24px rgba(0,0,0,0.14)",
        "--route-thickness": "10px"
      },
      ".dark": {
        "--bg": "#141818",
        "--fg": "#F7F5EE",
        "--panel": "#232A2A",
        "--panel-fg": "#F7F5EE",
        "--border": "rgba(247,245,238,0.14)",
        "--muted": "rgba(247,245,238,0.08)",
        "--muted-fg": "rgba(247,245,238,0.72)",
        "--ring": "rgba(241,144,32,0.55)"
      }
    },
    "paper_texture_css": {
      "apply_to": "body::before (grain) + body::after (halftone)",
      "grain": "Use repeating-radial-gradient + low opacity noise-like pattern; mix-blend-mode:multiply; opacity 0.08–0.12",
      "halftone": "Use radial-gradient dots scaled large; opacity 0.05–0.08; mask-image to fade edges",
      "performance": "Pure CSS only; no images; ensure pointer-events:none"
    },
    "selection_css": "::selection { background: var(--signal); color: var(--digital-white); }"
  },
  "layout_system": {
    "grid": {
      "container": "max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10",
      "editorial_columns": {
        "desktop": "12-col grid with 24px gap",
        "tablet": "8-col grid with 20px gap",
        "mobile": "single column; use stacked panels; never shrink typography to fit"
      },
      "asymmetry_rules": [
        "At least 1 overlapping element per major section (route line, label chip, or cutout image).",
        "Use offset columns: e.g., headline spans col 1-7, supporting panel spans col 7-13.",
        "Keep reading flow left-aligned; use right-side annotations in mono."
      ]
    },
    "section_rhythm": {
      "vertical_spacing": "py-16 sm:py-20 lg:py-28",
      "section_headers": "Headline + mono kicker + orange route segment that visually connects to next section"
    }
  },
  "typography_scale": {
    "font_loading": {
      "google_fonts": [
        "https://fonts.googleapis.com/css2?family=League+Gothic&family=Manrope:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      ],
      "css": {
        "display": "font-family: 'League Gothic', system-ui, sans-serif;",
        "body": "font-family: 'Manrope', system-ui, sans-serif;",
        "mono": "font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;"
      }
    },
    "headings": {
      "hero_h1": "font-display uppercase tracking-[-0.02em] leading-[0.85] text-[12vw] sm:text-[10vw] lg:text-[11vw] xl:text-[9.5vw]",
      "section_h2": "font-display uppercase leading-[0.9] tracking-[-0.01em] text-4xl sm:text-5xl lg:text-6xl",
      "panel_h3": "font-display uppercase leading-[0.95] text-3xl sm:text-4xl",
      "kicker": "font-mono uppercase tracking-[0.18em] text-[11px] text-[color:rgba(35,42,42,0.72)]"
    },
    "body": {
      "p": "font-body text-sm sm:text-base leading-relaxed text-[color:rgba(35,42,42,0.88)]",
      "lead": "font-body text-base sm:text-lg leading-relaxed text-[color:rgba(35,42,42,0.92)]",
      "annotation": "font-mono text-[11px] leading-snug text-[color:rgba(35,42,42,0.72)]"
    }
  },
  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/navigation-menu.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/accordion.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/form.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/textarea.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx"
      ]
    },
    "nav": {
      "pattern": "Left-aligned editorial nav with 7 items + persistent Say Hi CTA. Mobile uses Sheet.",
      "active_route_microinteraction": "Orange route slides beneath active item (animated underline that travels, not fades).",
      "link_underline": "Underline draws in direction of navigation (left→right on hover; reverse on exit).",
      "data_testids": {
        "nav": "site-nav",
        "nav_item": "nav-item-<slug>",
        "nav_cta": "nav-say-hi-cta"
      }
    },
    "buttons": {
      "variants": {
        "primary": {
          "look": "Charcoal rounded panel button with orange route accent",
          "tailwind": "rounded-[12px] bg-[color:var(--ink)] text-[color:var(--digital-white)] shadow-[var(--shadow-lift)] px-5 py-3",
          "hover": "Magnetic attraction 6–10px max + subtle lift; microcopy swap",
          "focus": "ring-2 ring-[color:var(--ring)] ring-offset-2 ring-offset-[color:var(--paper)]"
        },
        "secondary": {
          "look": "Paper button with ink border + orange underline",
          "tailwind": "rounded-[12px] bg-[color:var(--digital-white)] text-[color:var(--ink)] border border-[color:var(--border)] px-5 py-3"
        },
        "ghost": {
          "look": "Text button with animated underline",
          "tailwind": "bg-transparent text-[color:var(--ink)] px-2 py-2"
        }
      },
      "hover_microcopy": {
        "start_conversation": "Good start.",
        "explore_network": "Meet the minds.",
        "see_work": "Receipts this way."
      },
      "data_testids": {
        "primary": "primary-action-button",
        "secondary": "secondary-action-button"
      }
    },
    "badges_and_tags": {
      "provenance_tag": {
        "look": "Mono pill with hairline border; optional tiny red bar inset",
        "tailwind": "font-mono text-[11px] rounded-full border border-[color:rgba(35,42,42,0.22)] bg-[color:rgba(247,245,238,0.7)] px-3 py-1",
        "red_intervention": "Add a 2px x 10px signal-red bar inside left edge for active/ROI emphasis"
      },
      "capability_chip": {
        "look": "Orange-outline chip; fills orange on hover",
        "tailwind": "rounded-full border border-[color:var(--orange)] text-[color:var(--ink)] px-3 py-1"
      }
    },
    "panels": {
      "charcoal_panel": {
        "look": "Rounded charcoal panel with paper text; used for key claims and method",
        "tailwind": "rounded-[18px] bg-[color:var(--ink)] text-[color:var(--digital-white)] shadow-[var(--shadow-panel)]"
      },
      "paper_panel": {
        "look": "Paper panel with ink hairline border; used for reading",
        "tailwind": "rounded-[18px] bg-[color:var(--digital-white)] border border-[color:var(--border)]"
      }
    },
    "forms": {
      "style": "Long-form editorial form with mono labels, generous spacing, clear validation.",
      "inputs": "Use shadcn Input/Textarea/Select; background digital-white; border ink hairline; focus ring orange.",
      "success_state": "Charcoal panel with orange route line + short mischievous confirmation copy.",
      "data_testids": {
        "contact_form": "contact-form",
        "contact_submit": "contact-form-submit-button",
        "contact_success": "contact-form-success-message",
        "field": "contact-form-field-<name>",
        "error": "contact-form-error-<name>"
      }
    }
  },
  "homepage_art_direction": {
    "sections": [
      {
        "id": "hero",
        "headline": "We Build Brand Operating Systems.",
        "support": "From ABC to ROI.",
        "layout": "Left: giant League Gothic headline; Right: 3D System Core canvas in a rounded charcoal frame sitting on paper.",
        "3d": "R3F scene: floating paper-cards/low-poly charcoal nodes labeled BRAND, CUSTOMER, SALES, TECH, CONTENT, DATA, OPERATIONS, GROWTH; orange route connects on scroll; mono labels AUDIT→ARCHITECT→BUILD→CONNECT→SCALE resolving to ROI.",
        "fallback": "Static SVG diagram with same nodes + orange route; ensure no CLS by reserving canvas height.",
        "micro": "Primary CTA hover swaps microcopy; subtle magnetic pull; nav underline route already active."
      },
      {
        "id": "somethings-off",
        "layout": "Paper panel with diagnostic prompts; mono annotations in margin; small signal-red intervention ticks.",
        "micro": "Scanning line passes across panel (CSS animation) with reduced-motion fallback."
      },
      {
        "id": "why-how-now",
        "layout": "Three overlapping rounded panels (charcoal/paper mix) with orange route connecting their headers.",
        "micro": "Route draws between panels on scroll (stroke-dashoffset)."
      },
      {
        "id": "what-we-do",
        "layout": "Asymmetric 6-category capability grid (not SaaS cards): each tile is a rounded panel with cutout image corner + mono label + orange connector stub.",
        "micro": "Hover reveals a one-line mischievous insight; orange connector brightens."
      },
      {
        "id": "method",
        "layout": "Pinned scroll sequence: AUDIT → ARCHITECT → BUILD → CONNECT → SCALE; orange route travels the whole section; each stage has a charcoal panel + paper annotation.",
        "micro": "ScrollTrigger scrub; stage headers snap into place; reduced-motion shows all stages stacked."
      },
      {
        "id": "diagnostic",
        "layout": "Diagnostic board: charcoal panel with gridlines + scanning line + checklist; CTA to contact.",
        "micro": "Checkbox ticks animate; scanning line loops slowly."
      },
      {
        "id": "work-preview",
        "layout": "Horizontal editorial case-study cards with provenance tags; each card uses SITUATION/GAP/RESULT teaser.",
        "micro": "Drag/scroll with ScrollArea; hover underline draws; card lifts slightly."
      },
      {
        "id": "network-preview",
        "layout": "Dark charcoal section teaser with mini constellation (static or lightweight) + category list.",
        "micro": "Hover category highlights cluster; orange route pulses once."
      },
      {
        "id": "trust-principles",
        "layout": "Paper section with bold editorial headlines + mono footnotes; minimal red accents.",
        "micro": "Footnote tooltip (shadcn Tooltip) appears with slight delay."
      },
      {
        "id": "who-we-work-with",
        "layout": "Industry list as a typographic wall; orange route threads through; avoid logos grid.",
        "micro": "On hover, show a tiny mono aside (" + "\"We’ve seen this movie.\"" + ")"
      },
      {
        "id": "closing-cta",
        "layout": "Charcoal panel with giant headline + Say Hi button; small red bar accent inside title panel.",
        "micro": "Button magnetic + microcopy; route line exits into footer."
      }
    ]
  },
  "motion_and_interactions": {
    "libraries": {
      "install": [
        "npm i gsap @gsap/react @react-three/fiber @react-three/drei three @studio-freight/lenis"
      ],
      "notes": [
        "No scroll hijacking. Lenis for smoothing only.",
        "Respect prefers-reduced-motion: provide static equivalents for all scroll sequences and 3D scenes."
      ]
    },
    "principles": [
      "Smooth, weighted, precise; occasional playful beats.",
      "Avoid frantic easing; prefer power2.out / expo.out sparingly.",
      "Never animate layout-affecting properties that cause CLS."
    ],
    "micro_interactions": {
      "magnetic_buttons": "Implement pointer-based translate (max 6–10px) on hover; reset on leave; disable on touch devices.",
      "route_underline": "Use a single absolutely-positioned orange bar that animates x/width between nav items.",
      "link_underline_draw": "Use background-size animation or pseudo-element scaleX from left; reverse origin on exit.",
      "selection": "Signal red selection background with digital-white text."
    }
  },
  "3d_moments": {
    "hero_system_core": {
      "requirements": [
        "Procedural geometry only (no heavy GLTF).",
        "Authored camera; no orbit controls.",
        "Subtle pointer parallax only.",
        "Scroll-driven orange route connection + stage labels.",
        "Reserve fixed aspect ratio container to prevent CLS; lazy-load canvas; provide SVG fallback."
      ],
      "data_testids": {
        "canvas": "hero-system-core-canvas",
        "fallback": "hero-system-core-fallback"
      }
    },
    "network_constellation": {
      "requirements": [
        "Dark charcoal section.",
        "hiAnzy central node; discipline clusters.",
        "Category selection expands cluster; orange route connects.",
        "Keyboard-accessible category list controls the scene; scene is not the only way to access info."
      ],
      "implementation_hint": "Consider r3f-forcegraph for interaction scaffolding; style to look like constellation (soft points + labeled nodes).",
      "data_testids": {
        "canvas": "network-constellation-canvas",
        "filter_list": "network-category-filter"
      }
    }
  },
  "imagery": {
    "treatment": [
      "Use black-and-white cut-out editorial imagery with high contrast.",
      "Apply CSS filter for halftone/etching feel (contrast + grayscale) and optional SVG halftone mask.",
      "Avoid robots/brains/corporate stock handshakes."
    ],
    "image_urls": [
      {
        "category": "editorial_portrait_cutout",
        "description": "Use as cutout in hero/why-hi-anzy page; apply grayscale + contrast + clip-path.",
        "url": "https://images.unsplash.com/flagged/photo-1559487098-6174e343345c?auto=format&fit=crop&w=1600&q=85"
      },
      {
        "category": "workspace_blueprint",
        "description": "Use in method/architect sections as background cutout or corner image.",
        "url": "https://images.pexels.com/photos/6615036/pexels-photo-6615036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "storefront_hospitality",
        "description": "Use in who-we-work-with (hospitality/service) as B&W cutout.",
        "url": "https://images.pexels.com/photos/16450730/pexels-photo-16450730.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ]
  },
  "accessibility": {
    "requirements": [
      "WCAG-conscious contrast: ink on paper; digital-white on charcoal.",
      "Visible focus rings (orange ring + paper offset).",
      "Keyboard navigation for menus, tabs, accordions, filters.",
      "Reduced-motion: disable Lenis smoothing and GSAP timelines; show static stacked content; replace route draws with solid lines."
    ]
  },
  "instructions_to_main_agent": [
    "Update /app/frontend/src/index.css tokens to match Paper/Ink/Orange/Signal; remove default system font stack and use Manrope globally.",
    "Delete CRA demo styles in /app/frontend/src/App.css (logo spin, centered header).",
    "Implement a reusable <RouteLine /> component (SVG path) with stroke-dash animations for scroll sections.",
    "Implement <MagneticButton /> wrapper for micro magnetic hover (max 10px) and microcopy swap.",
    "Build Nav with shadcn NavigationMenu + custom animated orange route underline; mobile uses Sheet.",
    "Ensure every interactive element and key info has data-testid in kebab-case.",
    "Lazy-load R3F canvases with reserved aspect ratio containers + SVG fallbacks to meet LCP/CLS constraints.",
    "Use charcoal panels sparingly but decisively for key claims; keep reading areas on digital-white/paper panels.",
    "Signal Red is for interventions only (active state ticks, ROI emphasis bars, selection background)."
  ],
  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
