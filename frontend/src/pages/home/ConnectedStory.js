import React, { Component, Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, MoveUpRight, Pause, Play } from "lucide-react";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { CATEGORIES } from "@/data/content";
import { getCaseStudies } from "@/lib/api";
import { useReducedMotion, webglAvailable } from "@/lib/motion";
import { CaseBanner } from "@/components/ContextBanner";
import { SITE_CONTACT } from "@/data/site";

const BusinessFlowScene = lazy(() => import("@/components/three/BusinessFlowScene"));

const LAYERS = [
  { name: "Strategy", question: "Know where to go.", copy: "A shared direction, a clear customer and priorities the whole team can act on." },
  { name: "Brand", question: "Make the promise clear.", copy: "Positioning, identity and language that help people understand why you matter." },
  { name: "Experience", question: "Deliver on the promise.", copy: "Websites, products and customer journeys that make the next step feel natural." },
  { name: "Growth", question: "Give progress a system.", copy: "Content, commerce and lifecycle journeys that connect attention to ongoing value." },
  { name: "Operations", question: "Make it work every day.", copy: "Connected tools, clear ownership and workflows your team can rely on." },
];
const GAPS = [
  { title: "The offer is hard to explain.", symptom: "The team knows the value. The customer cannot see it.", before: ["Different messages", "Unclear offer", "Customer hesitates"], after: ["Shared positioning", "Clear offer", "Confident next step"], move: "Align the offer before amplifying the message.", detail: "We bring customer needs, positioning and the sales story into one clear proposition.", service: "business-audit-strategy" },
  { title: "The tools don’t talk to each other.", symptom: "Every handoff creates another spreadsheet or follow-up.", before: ["Separate tools", "Manual handoffs", "Missing context"], after: ["Connected data", "Owned workflows", "Shared visibility"], move: "Connect the workflow before adding another tool.", detail: "We map how work moves, remove duplicate steps and build the connections that matter.", service: "digital-technology-automation" },
  { title: "Attention isn’t turning into loyalty.", symptom: "Acquisition keeps running. The return journey is missing.", before: ["Campaign", "First purchase", "Silence"], after: ["Relevant content", "Useful experience", "Reason to return"], move: "Build what happens after the first conversion.", detail: "We connect the offer, customer experience and follow-up so growth has somewhere to go.", service: "growth-content-commerce" },
];
const METHOD = [
  { title: "Audit", copy: "Understand the business, the customer and the point of friction.", output: "A prioritised diagnosis" },
  { title: "Architect", copy: "Agree the direction, the scope and how the pieces should connect.", output: "A shared roadmap" },
  { title: "Build", copy: "Turn the plan into the brand, product or system the business needs.", output: "Working deliverables" },
  { title: "Connect", copy: "Join up the tools, teams and handoffs. Test the complete journey.", output: "An operational system" },
  { title: "Scale", copy: "Review what happens, improve the weak points and plan the next move.", output: "A measured next step" },
];
export const CASE_VISUALS = [
  { slug: "the-storefront-was-never-the-problem", labels: ["Discover", "Buy", "Return"], name: "A complete customer journey", result: "Retention designed into the journey.", copy: "Replenishment flows and follow-up gave customers a reason to return beyond a discount." },
  { slug: "a-rebrand-that-turned-out-to-be-a-pricing-problem", labels: ["Scope", "Price", "Propose"], name: "A repeatable sales system", result: "An offer the whole team could sell.", copy: "Named service tiers and a shared proposal system reduced dependence on the founder." },
  { slug: "commerce-untangled", labels: ["Guest", "Venue", "Team"], name: "One connected operating picture", result: "Connected information. Clearer operations.", copy: "A shared guest record and connected workflows replaced fragmented venue data." },
  { slug: "launch-systems-for-a-festival-season", labels: ["Create", "Live", "Reach"], name: "One launch story", result: "The launch read as one story.", copy: "Creators, venues, media and logistics moved to one accountable calendar." },
  { slug: "the-dashboard-nobody-opened", labels: ["Decide", "View", "Act"], name: "Decision-first reporting", result: "Three useful views replaced one ignored dashboard.", copy: "Focused decision views and weekly digests gave leadership a reason to look." },
];

function Chapter({ number, label }) {
  return <p className="story-eyebrow"><span className="story-chapter">{number}</span>{label}</p>;
}
function SystemFallback({ activeStep }) {
  return <div className="story-stack-fallback" aria-hidden="true">{LAYERS.map((layer, i) => <div key={layer.name} className={i === activeStep ? "is-active" : ""} style={{ "--layer": i }}><span>{String(i + 1).padStart(2, "0")}</span></div>)}</div>;
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function CaseGraphic({ visual }) {
  return <CaseBanner visual={visual} />;
}
function SelectedWork() {
  const [cases, setCases] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    getCaseStudies(true).then((items) => { if (current) setCases(items.slice(0, 3)); }).catch(() => { if (current) { setCases([]); setFailed(true); } });
    return () => { current = false; };
  }, []);
  return <section className="story-section story-shell" id="proof" data-index-label="Selected work" data-testid="home-work-section">
    <Chapter number="04" label="THE SYSTEM, APPLIED" />
    <div className="story-heading-row"><h2>A different problem.<br /> <em>The same connected thinking.</em></h2><Link to="/work" className="story-text-link">Explore the work <ArrowRight size={18} /></Link></div>
    <p className="story-section-intro">The brief is the starting point. These case studies follow the diagnosis, the decision and what was built.</p>
    <div className="story-case-grid" data-testid="work-cards-row">
      {cases === null && <p className="story-load" role="status">Loading selected work…</p>}
      {cases?.map((item, index) => {
        const visual = CASE_VISUALS.find((entry) => entry.slug === item.slug);
        return <Link key={item.slug} to={`/work/${item.slug}`} className="story-case" data-testid={`work-card-${item.slug}`}>
          {visual && <CaseGraphic visual={visual} index={index} />}
          <div className="story-case-body"><div className="story-case-meta"><ProvenanceTag value={item.provenance} /><span>{item.year}</span></div><p className="story-case-sector">{item.industry}</p><h3>{item.title}</h3><p>{visual?.copy || item.summary}</p><div className="story-case-outcome"><span>WHAT CHANGED</span><p>{visual?.result || item.result}</p></div><span className="story-text-link">Read the case study <MoveUpRight size={17} /></span></div>
        </Link>;
      })}
    </div>
    {cases?.length === 0 && <p className="story-load" role="status">{failed ? "Selected work couldn’t load. " : "New case studies are being prepared. "}<Link to="/work" className="story-text-link">Visit the work archive <ArrowRight size={16} /></Link></p>}
    <p className="story-footnote">Credits are labelled by delivery team. Commercial figures are kept private; the full cases explain the available evidence.</p>
  </section>;
}

export default function ConnectedStory({ mode }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [activeLayer, setActiveLayer] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [activeGap, setActiveGap] = useState(0);
  const [hasWebGL] = useState(() => mode === "model" && webglAvailable());
  const gap = GAPS[activeGap];
  const layer = LAYERS[activeLayer];
  return <div className="story-home connected-insert">
    {mode === "model" && (<section className="story-hero story-shell" data-index-label="The big picture">
      <div className="story-hero-copy"><p className="story-eyebrow"><span className="story-status-dot" />BUSINESS SYSTEMS & TRANSFORMATION</p><h2>All the right parts.<br /> <em>Working as one.</em></h2><p className="story-hero-lede">Your brand is a promise.<br /> Your business has to deliver it.</p><p className="story-body">We connect strategy, brand, technology and growth—so the message, the experience and the way you work move in the same direction.</p><div className="story-actions"><a href={`mailto:${SITE_CONTACT.email}`} className="story-button story-button-dark" data-testid="hero-contact-cta">Find your starting point <MoveUpRight size={18} /></a><Link to="/how-we-work" className="story-text-link">See the build sequence <ArrowDown size={17} /></Link></div><p className="story-hero-note">From ABC to ROI. Built around your business.</p></div>
      <div className="story-model-panel">
        <div className="story-model-header"><span><i />THE CONNECTED BUSINESS</span><span>MODEL / 01</span></div>
        <div className="story-model-viewport"><div className="story-model-art" role="img" aria-label={`Exploded 3D model of five connected business layers. Selected layer: ${layer.name}.`}>
          {!sceneReady && <SystemFallback activeStep={activeLayer} />}
          {hasWebGL && <SceneBoundary fallback={sceneReady ? <SystemFallback activeStep={activeLayer} /> : null}><Suspense fallback={null}><BusinessFlowScene activeStep={activeLayer} reducedMotion={reduced || paused} onReady={() => setSceneReady(true)} /></Suspense></SceneBoundary>}
          <div className="story-model-callout" aria-hidden="true"><span>0{activeLayer + 1}</span><b>{layer.name}</b><i /></div>
          <span className="story-model-axis" aria-hidden="true">Y<br /> └── X</span></div>
          {hasWebGL && !reduced && <button type="button" className="story-motion-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? "Play 3D motion" : "Pause 3D motion"}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
        </div>
        <div className="story-layer-controls" role="group" aria-label="Explore the five business layers">{LAYERS.map((item, index) => <button key={item.name} type="button" aria-pressed={activeLayer === index} onClick={() => setActiveLayer(index)}><span>0{index + 1}</span>{item.name}</button>)}</div>
        <div className="story-layer-caption" aria-live="polite"><strong>{layer.question}</strong><p>{layer.copy}</p></div>
      </div>
    </section>)}
    {mode === "summary" && (<div className="story-shell"><div className="story-promise-strip"><p><span>01 / DIRECTION</span>A clear decision.</p><p><span>02 / CONNECTION</span>A joined-up experience.</p><p><span>03 / PROGRESS</span>A system you can build on.</p><span className="story-strip-arrow" aria-hidden="true"><ArrowDown size={26} /></span></div></div>)}
    {mode === "gap" && (<section className="story-section story-shell" id="gap" data-index-label="Find the gap">
      <Chapter number="01" label="START WITH THE DISCONNECT" />
      <div className="story-heading-row"><h2>When the handoffs break,<br /> <em>the customer feels it.</em></h2><p>Sometimes the individual parts are working.<br /> It is the space between them that needs attention.</p></div>
      <div className="story-gap-grid"><div className="story-gap-options" role="group" aria-label="Explore a business challenge">{GAPS.map((item, index) => <button key={item.title} type="button" onClick={() => setActiveGap(index)} aria-pressed={activeGap === index}><span className="story-option-number">0{index + 1}</span><span><strong>{item.title}</strong><small>{item.symptom}</small></span><ArrowRight size={19} /></button>)}</div><div className="story-gap-map" aria-live="polite"><div className="story-flow-row story-flow-broken"><span className="story-map-label">THE DISCONNECT</span><ol>{gap.before.map((item) => <li key={item}>{item}</li>)}</ol></div><div className="story-map-bridge"><span /> <ArrowDown size={19} /> <span /></div><div className="story-flow-row story-flow-connected"><span className="story-map-label">THE CONNECTED SYSTEM</span><ol>{gap.after.map((item) => <li key={item}>{item}</li>)}</ol></div><h3>{gap.move}</h3><p>{gap.detail}</p><Link to={`/what-we-do/${gap.service}`} className="story-text-link">Explore this approach <MoveUpRight size={16} /></Link></div></div>
    </section>)}
    {mode === "services" && (<section className="story-services-band" id="system" data-index-label="What we connect"><div className="story-section story-shell"><Chapter number="02" label="BUILD AROUND THE WHOLE BUSINESS" /><div className="story-heading-row"><h2>One direction.<br /> <em>All the right capabilities.</em></h2><p>Start with the gap that matters most.<br /> Bring in the capabilities that make the solution work.</p></div><div className="story-services-grid">{CATEGORIES.map((item, index) => <Link className="story-service" key={item.slug} to={`/what-we-do/${item.slug}`}><div className="story-service-top"><span className="story-service-number">{item.num}</span><div className={`story-mini-object story-mini-object-${index}`} aria-hidden="true"><i /><i /><i /></div><MoveUpRight size={20} /></div><p className="story-service-verb">{item.label}</p><h3>{item.title}</h3><p>{item.copy}</p><span className="story-service-detail">{item.capabilities.slice(0, 3).join(" / ")}</span></Link>)}</div><div className="story-band-bottom"><p>One focused engagement or an ongoing partnership. The scope follows the problem.</p><Link to="/what-we-do#packages" className="story-text-link">Find an engagement <ArrowRight size={18} /></Link></div></div></section>)}
    {mode === "method" && (<section className="story-section story-shell" id="method" data-index-label="How we build"><Chapter number="03" label="TURN CLARITY INTO SOMETHING THAT WORKS" /><div className="story-heading-row"><h2>A clear path.<br /> <em>No missing handoffs.</em></h2><Link to="/how-we-work" className="story-text-link">Inside the process <ArrowRight size={18} /></Link></div><p className="story-section-intro">Each stage gives the next one something concrete to work with. We agree the scope, owners and measures before the build begins.</p><ol className="story-method-track">{METHOD.map((item, index) => <li key={item.title}><div className="story-method-marker"><span>0{index + 1}</span><ArrowRight size={18} aria-hidden="true" /></div><h3>{item.title}</h3><p>{item.copy}</p><div className="story-method-output"><span>YOU LEAVE WITH</span><strong>{item.output}</strong></div></li>)}</ol><div className="story-method-note"><Check size={18} /><p>A named owner. A shared view of progress. A handover your team can use.</p></div></section>)}
    {mode === "work" && (<SelectedWork />)}
    {mode === "team" && (<section className="story-team-band" id="team" data-index-label="The people"><div className="story-section story-shell story-team-grid"><div><Chapter number="05" label="THE RIGHT PEOPLE, CONNECTED" /><h2>A focused team.<br /> <em>One accountable lead.</em></h2><p>hiAnzy brings the strategic direction and brings in specialists around the work. Design, technology, content, production and operations stay connected to the same brief.</p><p>You know who owns the decisions, who is doing the work and what comes next.</p><Link to="/network" className="story-text-link">Meet the network <MoveUpRight size={18} /></Link></div><figure className="story-team-map"><div className="story-team-client">YOUR BUSINESS <span>The ambition + the context</span></div><div className="story-team-connector" aria-hidden="true" /><div className="story-team-core"><strong>hiAnzy</strong><span>Direction · Coordination · Accountability</span></div><div className="story-team-branches" aria-hidden="true"><i /><i /><i /><i /></div><div className="story-team-nodes"><span>Strategy<br /> & advisory</span><span>Brand<br /> & design</span><span>Technology<br /> & systems</span><span>Content<br /> & experiences</span></div><figcaption>The team is shaped by the problem. The ownership stays clear.</figcaption></figure></div></section>)}
    {mode === "start" && (<section className="story-section story-shell" id="start" data-index-label="Your next step"><div className="story-closing"><div><Chapter number="06" label="YOUR NEXT CHAPTER" /><h2>Start with what<br /> <em>feels disconnected.</em></h2><p>You do not need a perfect brief. Tell us what you are building, what is getting in the way and what better would look like.</p><a href={`mailto:${SITE_CONTACT.email}`} className="story-button story-button-dark">Let’s connect the dots <MoveUpRight size={19} /></a></div><ol className="story-start-list"><li><span>01</span><div><h3>Bring the context.</h3><p>Your business, your ambition and the point of friction.</p></div></li><li><span>02</span><div><h3>Agree the real problem.</h3><p>We clarify what needs to change and whether we are a fit.</p></div></li><li><span>03</span><div><h3>Scope the first move.</h3><p>A useful starting point, with clear deliverables and ownership.</p></div></li></ol></div></section>)}
  </div>;
}
