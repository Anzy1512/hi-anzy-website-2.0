import React from "react";

const INK = "#27332b";
const PAPER = "#f6f2e7";
const ORANGE = "#ed8b27";
const SIGNAL = "#df5634";
const MOSS = "#81947c";

const CASE_BANNERS = {
  "the-storefront-was-never-the-problem": { variant: "retention", code: "LOOP", caption: "DISCOVER → RETURN" },
  "a-rebrand-that-turned-out-to-be-a-pricing-problem": { variant: "pricing", code: "OFFER", caption: "CLARITY → CONFIDENCE" },
  "commerce-untangled": { variant: "hospitality", code: "NETWORK", caption: "VENUE → GUEST → TEAM" },
  "launch-systems-for-a-festival-season": { variant: "launch", code: "LAUNCH", caption: "STORY → MOMENT → REACH" },
  "the-dashboard-nobody-opened": { variant: "dashboard", code: "DECISION", caption: "SEE → DECIDE → ACT" },
};

const SERVICE_BANNERS = {
  "business-audit-strategy": { variant: "audit", code: "01 / DIAGNOSIS" },
  "brand-experience": { variant: "brand", code: "02 / EXPRESSION" },
  "digital-technology-automation": { variant: "technology", code: "03 / SYSTEMS" },
  "growth-content-commerce": { variant: "growth", code: "04 / MOMENTUM" },
  "media-creators-experiences": { variant: "media", code: "05 / REACH" },
  "advisory-security-scale": { variant: "advisory", code: "06 / RESILIENCE" },
};

const SvgLabel = ({ x, y, children, size = 13, fill = INK, anchor = "middle" }) => (
  <text x={x} y={y} fill={fill} textAnchor={anchor} fontFamily="Rajdhani, Arial Narrow, sans-serif" fontSize={size} fontWeight="600" letterSpacing="1.4">{children}</text>
);

const CaseArtwork = ({ variant }) => {
  if (variant === "pricing") {
    return (
      <>
        <path d="M78 72H548M78 120H548M78 168H548" stroke={INK} strokeOpacity=".22" />
        {[{ y: 54, w: 258, label: "ESSENTIAL", fill: PAPER }, { y: 102, w: 350, label: "GROWTH", fill: "#d2dbc7" }, { y: 150, w: 444, label: "PARTNER", fill: ORANGE }].map((bar) => (
          <g key={bar.label}>
            <rect x="78" y={bar.y} width={bar.w} height="28" rx="6" fill={bar.fill} stroke={INK} strokeOpacity=".45" />
            <SvgLabel x="94" y={bar.y + 19} size={11} anchor="start">{bar.label}</SvgLabel>
            <circle cx={78 + bar.w} cy={bar.y + 14} r="5" fill={INK} />
          </g>
        ))}
        <path d="M474 48v140" stroke={SIGNAL} strokeWidth="2" strokeDasharray="5 7" />
        <SvgLabel x="492" y="42" size={10} anchor="start" fill={SIGNAL}>SIMPLE TO SELL</SvgLabel>
        <SvgLabel x="80" y="228" size={12} anchor="start">OFFER ARCHITECTURE</SvgLabel>
      </>
    );
  }
  if (variant === "hospitality") {
    return (
      <>
        <path d="M140 122C208 62 278 62 342 122S474 182 530 122" fill="none" stroke={INK} strokeWidth="2" strokeDasharray="4 7" opacity=".55" />
        <path d="M140 122C208 182 278 182 342 122S474 62 530 122" fill="none" stroke={ORANGE} strokeWidth="2" opacity=".72" />
        {[{ x: 140, y: 122, label: "VENUE" }, { x: 260, y: 92, label: "GUEST" }, { x: 342, y: 122, label: "DATA" }, { x: 430, y: 92, label: "TEAM" }, { x: 530, y: 122, label: "NIGHT" }].map((node, i) => (
          <g key={node.label}>
            <circle cx={node.x} cy={node.y} r={i === 2 ? 18 : 13} fill={i === 2 ? ORANGE : PAPER} stroke={INK} strokeWidth="2" />
            <circle cx={node.x} cy={node.y} r="4" fill={i === 2 ? INK : MOSS} />
            <SvgLabel x={node.x} y={node.y + 37} size={10}>{node.label}</SvgLabel>
          </g>
        ))}
        <SvgLabel x="80" y="228" size={12} anchor="start">ONE OPERATING PICTURE</SvgLabel>
      </>
    );
  }
  if (variant === "launch") {
    return (
      <>
        <path d="M86 178H554" stroke={INK} strokeWidth="2" opacity=".5" />
        <path d="M110 178V108M172 178V78M234 178V125M296 178V62M358 178V96M420 178V74M482 178V116" stroke={ORANGE} strokeWidth="9" strokeLinecap="round" opacity=".8" />
        <path d="M86 64C130 32 174 96 218 64S306 32 350 64S438 96 482 64S526 32 554 64" fill="none" stroke={SIGNAL} strokeWidth="2.5" />
        <path d="M86 88C130 56 174 120 218 88S306 56 350 88S438 120 482 88S526 56 554 88" fill="none" stroke={INK} strokeWidth="1.4" opacity=".5" />
        <SvgLabel x="86" y="222" size={12} anchor="start">CREATORS / VENUES / MEDIA</SvgLabel>
        <SvgLabel x="554" y="222" size={12} anchor="end" fill={SIGNAL}>ONE STORY</SvgLabel>
      </>
    );
  }
  if (variant === "dashboard") {
    return (
      <>
        {[0, 1, 2, 3].map((row) => <line key={`r-${row}`} x1="86" y1={65 + row * 34} x2="554" y2={65 + row * 34} stroke={INK} strokeOpacity=".16" />)}
        {[0, 1, 2, 3, 4, 5].map((col) => <line key={`c-${col}`} x1={86 + col * 78} y1="65" x2={86 + col * 78} y2="167" stroke={INK} strokeOpacity=".12" />)}
        <path d="M98 148L170 124L246 136L322 95L398 112L474 78L542 93" fill="none" stroke={ORANGE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {[{ x: 170, y: 124 }, { x: 322, y: 95 }, { x: 474, y: 78 }].map((p) => <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="6" fill={SIGNAL} stroke={PAPER} strokeWidth="3" />)}
        <rect x="86" y="188" width="160" height="26" rx="6" fill={INK} />
        <SvgLabel x="100" y="206" size={11} anchor="start" fill={PAPER}>THREE DECISIONS</SvgLabel>
        <SvgLabel x="554" y="206" size={11} anchor="end" fill={SIGNAL}>NO MEGA-DASHBOARD</SvgLabel>
      </>
    );
  }
  return (
    <>
      <circle cx="320" cy="124" r="82" fill="none" stroke={INK} strokeOpacity=".18" strokeWidth="2" />
      <circle cx="320" cy="124" r="53" fill="none" stroke={ORANGE} strokeWidth="3" strokeDasharray="16 8" />
      <path d="M320 42A82 82 0 0 1 399 144" fill="none" stroke={SIGNAL} strokeWidth="7" strokeLinecap="round" />
      <path d="M399 144l-15-3 7-14" fill={SIGNAL} />
      {[{ x: 170, y: 122, label: "DISCOVER" }, { x: 320, y: 124, label: "BUY" }, { x: 470, y: 122, label: "RETURN" }].map((node, i) => (
        <g key={node.label}>
          <rect x={node.x - 34} y={node.y - 19} width="68" height="38" rx="9" fill={i === 2 ? ORANGE : PAPER} stroke={INK} strokeWidth="2" />
          <SvgLabel x={node.x} y={node.y + 5} size={10}>{node.label}</SvgLabel>
        </g>
      ))}
      <SvgLabel x="80" y="222" size={12} anchor="start">RETENTION LOOP / REPEAT BY DESIGN</SvgLabel>
    </>
  );
};

export const CaseBanner = ({ visual, className = "" }) => {
  const config = CASE_BANNERS[visual?.slug] || CASE_BANNERS["the-storefront-was-never-the-problem"];
  return (
    <div className={`context-banner case-banner case-banner--${config.variant} ${className}`} role="img" aria-label={`Context diagram: ${config.caption}`}>
      <svg viewBox="0 0 640 260" aria-hidden="true" focusable="false">
        <rect width="640" height="260" fill="transparent" />
        <CaseArtwork variant={config.variant} />
      </svg>
      <span className="context-banner-code">{config.code}</span>
      <span className="context-banner-caption">{config.caption}</span>
    </div>
  );
};

const CapabilityArtwork = ({ variant, foreground }) => {
  if (variant === "brand") {
    return (
      <>
        <rect x="86" y="66" width="104" height="104" rx="12" fill="#e6e2c8" stroke={foreground} strokeOpacity=".35" />
        <rect x="205" y="66" width="104" height="104" rx="12" fill="#b8c4a9" stroke={foreground} strokeOpacity=".35" />
        <rect x="324" y="66" width="104" height="104" rx="12" fill={ORANGE} stroke={foreground} strokeOpacity=".35" />
        <rect x="443" y="66" width="104" height="104" rx="12" fill={SIGNAL} stroke={foreground} strokeOpacity=".35" />
        <SvgLabel x="86" y="204" size={12} anchor="start" fill={foreground}>POSITION</SvgLabel><SvgLabel x="547" y="204" size={12} anchor="end" fill={foreground}>EXPERIENCE</SvgLabel>
      </>
    );
  }
  if (variant === "technology") {
    return (
      <>
        <path d="M106 126H534" stroke={foreground} strokeOpacity=".28" strokeWidth="2" strokeDasharray="6 8" />
        {[{ x: 106, label: "DATA" }, { x: 212, label: "TOOLS" }, { x: 320, label: "FLOW" }, { x: 428, label: "AI" }, { x: 534, label: "TEAM" }].map((node, i) => (
          <g key={node.label}><circle cx={node.x} cy="126" r={i === 2 ? 23 : 15} fill={i === 2 ? ORANGE : "transparent"} stroke={i === 2 ? ORANGE : foreground} strokeWidth="2" /><circle cx={node.x} cy="126" r="4" fill={i === 2 ? foreground : ORANGE} /><SvgLabel x={node.x} y="170" size={10} fill={foreground}>{node.label}</SvgLabel></g>
        ))}
        <SvgLabel x="86" y="70" size={12} anchor="start" fill={foreground}>CONNECT THE HANDOFFS</SvgLabel>
      </>
    );
  }
  if (variant === "growth") {
    return (
      <>
        <path d="M92 181H548M92 181V66" stroke={foreground} strokeOpacity=".32" strokeWidth="2" />
        {[{ x: 132, h: 34 }, { x: 214, h: 58 }, { x: 296, h: 78 }, { x: 378, h: 98 }, { x: 460, h: 123 }].map((bar, i) => <rect key={bar.x} x={bar.x} y={181 - bar.h} width="44" height={bar.h} rx="5" fill={i === 4 ? ORANGE : "#9bb097"} stroke={foreground} strokeOpacity=".28" />)}
        <path d="M110 148C190 142 231 119 296 126S420 83 530 76" fill="none" stroke={SIGNAL} strokeWidth="3" strokeLinecap="round" />
        <SvgLabel x="92" y="214" size={12} anchor="start" fill={foreground}>ATTENTION</SvgLabel><SvgLabel x="548" y="214" size={12} anchor="end" fill={foreground}>VALUE</SvgLabel>
      </>
    );
  }
  if (variant === "media") {
    return (
      <>
        <path d="M76 126C112 70 148 182 184 126S256 70 292 126S364 182 400 126S472 70 508 126S544 182 580 126" fill="none" stroke={ORANGE} strokeWidth="5" strokeLinecap="round" />
        <path d="M76 126C112 92 148 160 184 126S256 92 292 126S364 160 400 126S472 92 508 126S544 160 580 126" fill="none" stroke={foreground} strokeWidth="1.5" opacity=".45" />
        <circle cx="320" cy="126" r="10" fill={SIGNAL} />
        <SvgLabel x="76" y="205" size={12} anchor="start" fill={foreground}>IDEA</SvgLabel><SvgLabel x="580" y="205" size={12} anchor="end" fill={foreground}>AUDIENCE</SvgLabel>
      </>
    );
  }
  if (variant === "advisory") {
    return (
      <>
        <path d="M320 55L410 87V135C410 178 373 202 320 219C267 202 230 178 230 135V87Z" fill="transparent" stroke={foreground} strokeWidth="2" />
        <path d="M320 77L383 100V134C383 164 357 181 320 194C283 181 257 164 257 134V100Z" fill={ORANGE} fillOpacity=".85" />
        <path d="M294 136l18 18 38-43" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="320" cy="126" r="104" fill="none" stroke={foreground} strokeOpacity=".17" strokeWidth="2" strokeDasharray="5 8" />
        <SvgLabel x="320" y="46" size={12} fill={foreground}>READY FOR MORE</SvgLabel>
      </>
    );
  }
  return (
    <>
      <path d="M110 170L205 102L286 145L384 76L530 132" fill="none" stroke={foreground} strokeWidth="2" opacity=".5" />
      {[{ x: 110, y: 170 }, { x: 205, y: 102 }, { x: 286, y: 145 }, { x: 384, y: 76 }, { x: 530, y: 132 }].map((node, i) => <g key={`${node.x}-${node.y}`}><circle cx={node.x} cy={node.y} r={i === 2 ? 16 : 10} fill={i === 2 ? ORANGE : "transparent"} stroke={i === 2 ? ORANGE : foreground} strokeWidth="2" /><circle cx={node.x} cy={node.y} r="3" fill={SIGNAL} /></g>)}
      <SvgLabel x="86" y="62" size={12} anchor="start" fill={foreground}>FIND THE CONSTRAINT</SvgLabel>
    </>
  );
};

export const CapabilityBanner = ({ slug, dark = false, className = "" }) => {
  const config = SERVICE_BANNERS[slug] || SERVICE_BANNERS["business-audit-strategy"];
  const foreground = dark ? PAPER : INK;
  return (
    <div className={`context-banner capability-banner capability-banner--${config.variant} ${dark ? "is-dark" : ""} ${className}`} role="img" aria-label={`Capability diagram: ${config.code}`}>
      <svg viewBox="0 0 640 260" aria-hidden="true" focusable="false">
        <rect width="640" height="260" fill="transparent" />
        <CapabilityArtwork variant={config.variant} foreground={foreground} />
      </svg>
      <span className="context-banner-code">{config.code}</span>
    </div>
  );
};

export const getCaseBanner = (slug) => CASE_BANNERS[slug] || null;
