export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "What We Do", to: "/what-we-do" },
  { label: "How We Work", to: "/how-we-work" },
  { label: "Work", to: "/work" },
  { label: "Network", to: "/network" },
  { label: "Why hiAnzy", to: "/why-hi-anzy" },
  { label: "Insights", to: "/insights" },
];

export const FOOTER_LINKS = [
  { label: "Who We Work With", to: "/who-we-work-with" },
  { label: "Collaborate", to: "/collaborate" },
  { label: "Careers", to: "/careers" },
  { label: "Resources", to: "/resources" },
  { label: "Privacy", to: "/resources#privacy" },
  { label: "Terms", to: "/resources#terms" },
];

/* The six systems. Each one is also its own page at /what-we-do/:slug, so a
   search result can land on the specific thing someone asked for rather than
   on a menu they then have to read. */
export const CATEGORIES = [
  {
    num: "01",
    slug: "business-audit-strategy",
    label: "SEE CLEARLY",
    title: "Business Audit & Strategy",
    copy: "Understand the constraint before choosing where to invest.",
    capabilities: ["Business diagnostics", "Market intelligence", "Customer understanding", "Positioning", "Opportunity mapping", "Transformation roadmaps", "Go-to-market strategy", "Operating model improvement"],
    services: [
      "Foundation workshop",
      "Deep-dive consultation",
      "Brand and business audit",
      "Founder vision mapping",
      "Market analysis and benchmarking",
      "Competition analysis",
      "Consumer study",
      "Audience mapping",
      "Pain point extraction",
      "Brand positioning and differentiation",
      "Value proposition mapping",
      "Objectives definition",
      "Brand repositioning",
      "Market strategy",
      "Go-to-market strategy",
      "Product line launch roadmap",
      "Distribution channel planning",
      "Threat and risk analysis",
      "Brand naming and domain",
      "Business registration and trademarks",
      "Operating model improvement",
      "Transformation roadmap",
    ],
    methodStage: "AUDIT",
    why: "A shared diagnosis helps your team put time and budget behind the changes that matter most.",
    lede: "Turn conflicting reports and scattered observations into a shared diagnosis and a practical plan.",
    body: [
  "When growth slows or delivery becomes harder, the symptoms often appear in several teams at once. We examine the business, brand and customer journey together to find the causes behind them.",
  "We review the available data, follow real workflows and speak with the people doing the work. We separate what the evidence shows from what still needs to be tested.",
  "You receive prioritised findings, clear owners and a sequence for the next steps. The roadmap explains what to fix first, why it matters and how to measure progress."
],
    signals: [
      "Your reports disagree with each other and everyone has a favourite",
      "Growth has flattened and nobody can say precisely when it started",
      "You are about to spend serious money on a fix nobody has stress-tested",
      "Every department is individually hitting targets while the business is not"
    ],
    deliverables: ["Business, brand and technology audit", "Customer journey walk-through, end to end", "Prioritised findings ranked by cost", "Transformation roadmap with named owners"],
    typical: "2–6 weeks",
    faqs: [
      { q: "How is this different from a consultancy report?", a: "A report tells you what is wrong. Ours ends with a sequence: what to fix first, who owns it, and what has to be true before the next thing starts. If it cannot be acted on the following Monday, we have not finished." },
      { q: "What if the audit says we do not need the project we planned?", a: "Then we say so and you keep the money. We would rather lose the follow-on work than take payment for building something you did not need." }
    ]
  },
  {
    num: "02",
    slug: "brand-experience",
    label: "MAKE SENSE",
    title: "Brand & Experience",
    copy: "Make your offer easy to understand and consistent at every customer touchpoint.",
    capabilities: ["Brand strategy", "Naming", "Identity", "Messaging", "Packaging", "UX/UI", "Customer journeys", "Product experience", "Founder positioning"],
    services: [
      "Brand strategy",
      "Brand persona and archetype",
      "Personality framework",
      "Tone of voice",
      "Messaging architecture",
      "Logo and visual identity system",
      "Typography and colour palette",
      "Iconography and symbol system",
      "Brand elements and sample creatives",
      "Brand guidelines document",
      "Founder personal branding",
      "Packaging design",
      "Labelling and packaging",
      "Unboxing experience design",
      "Product design concept",
      "Product design and customisation",
      "3D modelling and photorealistic rendering",
      "Print solutions and branded collateral",
      "Merchandising and digital assets",
      "Custom brand kits for online retail",
      "Retail display and POS design",
      "Website and app UI/UX blueprints",
      "E-commerce product UI/UX",
      "Customer journey design",
    ],
    methodStage: "ARCHITECT",
    why: "When your message and experience agree, customers can understand your offer and decide with confidence.",
    lede: "Give customers a clear reason to choose you, then carry it through your identity, message and experience.",
    body: [
  "Your brand begins with a decision: who you serve, what you help them do and why your approach is relevant. We clarify that position before creating the visual expression.",
  "That direction becomes a connected identity, messaging system and customer experience. Depending on the scope, the work can include naming, packaging, interfaces and guidelines for your team.",
  "We test whether people understand the offer and can find their next step. The result is a brand system your sales, marketing and product teams can use consistently."
],
    signals: [
      "Your best customers describe you differently than your website does",
      "The sales team has quietly built their own deck because the official one does not land",
      "You are competing on price against people who are not actually your competitors",
      "The product is genuinely good and the conversion rate disagrees"
    ],
    deliverables: ["Brand strategy and positioning", "Messaging architecture", "Identity system", "Customer journey and UX design"],
    typical: "4–10 weeks",
    faqs: [
      { q: "Do we need a full rebrand?", a: "Usually not. More often the strategy is sound and the expression is inconsistent, which is a cheaper and faster fix. We will tell you which one you are looking at before you commit to either." },
      { q: "Can you work with our existing identity?", a: "Yes, and frequently that is the right call. Equity you have already built is an asset; throwing it away to feel decisive is an expensive habit." }
    ]
  },
  {
    num: "03",
    slug: "digital-technology-automation",
    label: "MAKE IT WORK",
    title: "Digital, Technology & Automation",
    copy: "Connect websites, data and workflows so your team can spend less time moving information.",
    capabilities: ["Websites", "Commerce", "Applications", "Dashboards", "CRM", "Integrations", "Cloud", "AI systems", "Workflow automation", "Internal tools"],
    services: [
      "Website design and development",
      "Static and dynamic websites",
      "D2C and e-commerce builds",
      "Shopify and WooCommerce setup",
      "CMS development (WordPress, Joomla)",
      "Webflow development",
      "Mobile app development (iOS and Android)",
      "Custom in-house software",
      "Cloud-based applications",
      "Cloud setup and migration",
      "Backend analytics dashboards",
      "Analytics, pixel and tag setup",
      "CRM setup and integration",
      "Customer data platform (CDP)",
      "Workflow automation (n8n, Zapier, HubSpot)",
      "Email and WhatsApp automation",
      "E-commerce and API integration",
      "Loyalty and reward platform",
      "AI solutions (chatbots, GPT API, Copilot)",
      "Personalised GPT API",
      "AI voice assistant integration",
      "AI-driven automation",
      "Predictive consumer insights",
      "Blockchain development",
      "IoT development",
      "Web3 development",
      "Internal tools",
    ],
    methodStage: "BUILD",
    why: "Connected systems reduce repeated work and make it easier to serve customers, see performance and manage change.",
    lede: "Build the website, tools and integrations your team needs to turn a plan into everyday operations.",
    body: [
  "Disconnected tools leave people copying data, checking spreadsheets and repeating the same tasks. We map those handoffs before deciding what to build, connect or simplify.",
  "The work can include websites, commerce, applications, dashboards, CRM integrations and automation. We choose the technology around your requirements, existing systems and the people who will run it.",
  "Testing, documentation and handover are part of delivery. Your team receives a working system and the knowledge needed to maintain it."
],
    signals: [
      "Someone's job is substantially moving data between two systems",
      "Your reporting requires a spreadsheet nobody is allowed to touch",
      "The site works but nobody can update it without an agency ticket",
      "You bought AI and it has so far produced enthusiasm rather than output"
    ],
    deliverables: ["Websites, commerce and applications", "Integrations and workflow automation", "Dashboards and reporting", "Documentation and team handover"],
    typical: "6–16 weeks",
    faqs: [
      { q: "Will we be locked into you afterwards?", a: "No. You own the code, the accounts and the documentation. We consider a client who could leave and chooses not to a better outcome than one who cannot." },
      { q: "Do you actually build, or do you specify and hand off?", a: "We build. The network brings specialists where a problem needs them, and the accountability stays in one place regardless." }
    ]
  },
  {
    num: "04",
    slug: "growth-content-commerce",
    label: "MAKE IT MOVE",
    title: "Growth, Content & Commerce",
    copy: "Connect content, channels and conversion to the outcomes your business needs.",
    capabilities: ["Content strategy", "Social", "Performance marketing", "SEO", "Funnels", "Lifecycle marketing", "CRO", "Marketplace growth", "Campaigns"],
    services: [
      "Digital launch campaign planning",
      "Pre-launch social strategy and calendar",
      "Pre-launch teaser campaigns",
      "Platform setup and branding",
      "Platform management (Meta, Google, LinkedIn, X)",
      "Content strategy and buckets",
      "Social media marketing (organic and paid)",
      "Search engine optimisation",
      "SEO setup and keyword planning",
      "Search engine marketing",
      "Google Ads and YouTube Ads",
      "Paid media buying strategy",
      "Performance campaigns",
      "Remarketing campaigns",
      "Affiliate marketing setup",
      "Influencer collaboration campaigns",
      "Influencer seeding programme",
      "Contest and giveaway strategy",
      "Hashtag strategy",
      "Social listening setup",
      "Landing page development",
      "Funnel design",
      "Email marketing funnels",
      "Email campaigns and drip sequences",
      "Lead development",
      "Conversion rate optimisation",
      "Growth hacking",
      "E-commerce setup",
      "Marketplace growth",
      "AI-powered content creation",
    ],
    methodStage: "SCALE",
    why: "A clear offer and a consistent customer journey give marketing activity a stronger foundation.",
    lede: "Help the right people discover your offer, take the next step and return.",
    body: [
  "We begin with the offer, audience and customer journey. This identifies whether the immediate constraint is visibility, understanding, conversion or retention.",
  "We then connect content, search, paid channels, landing pages and lifecycle communications around that priority. Each activity has a purpose in the journey and an owner responsible for it.",
  "Reporting connects channel activity to agreed business measures. Regular reviews guide the next experiments, the work to expand and the activity to stop."
],
    signals: [
      "Traffic is up and revenue is doing something else entirely",
      "Ad costs keep climbing and the answer keeps being 'spend more'",
      "You have an audience that likes you and does not buy from you",
      "Retention is quietly leaking while acquisition takes the credit"
    ],
    deliverables: ["Content and channel strategy", "Performance marketing and SEO", "Funnel and conversion optimisation", "Lifecycle and retention programmes"],
    typical: "Ongoing, reviewed quarterly",
    faqs: [
      { q: "Can you just run our ads?", a: "We can, but if the offer or the landing experience is the actual constraint we will say so first. Spending your money efficiently on the wrong thing is still spending your money on the wrong thing." },
      { q: "How quickly will we see results?", a: "Paid channels report in weeks, SEO and lifecycle in months. Anyone promising otherwise is selling a timeline rather than an outcome." }
    ]
  },
  {
    num: "05",
    slug: "media-creators-experiences",
    label: "MAKE IT TRAVEL",
    title: "Media, Creators & Experiences",
    copy: "Bring your story to relevant audiences through creators, media and live experiences.",
    capabilities: ["Creators", "PR", "Media", "Events", "Venues", "Production", "Collaborations", "Institutional partnerships", "Experiential campaigns"],
    services: [
      "Video production (reels, ads, documentaries)",
      "Brand film and manifesto video",
      "Launch teaser video",
      "Explainer videos",
      "Animation and motion graphics",
      "Post production",
      "Creative direction",
      "Copywriting and scripting",
      "Product photography",
      "Concept and lifestyle shoots",
      "Retail display visuals",
      "Sound production",
      "Sonic branding (jingle, audio logo)",
      "UI/UX sound design",
      "Audio ads (Spotify, Gaana, JioSaavn, podcasts)",
      "Ambient sound design",
      "Branded playlists",
      "Branded podcast development",
      "Podcast shooting and setup",
      "Voiceovers and music licensing",
      "AI voice over",
      "Event soundscapes",
      "Artist collaboration (DJs, musicians, producers)",
      "Creator marketing strategy",
      "Gaming and esports tie-ups",
      "UGC campaign development",
      "Brand ambassador shortlisting",
      "Co-branded music content",
      "City pop-up tours",
      "College festivals and youth events",
      "Music and gaming festival partnerships",
      "Co-branded stages",
      "Venue partnerships",
      "Event branding and visuals",
      "Booth and stall branding",
      "Event content and coverage",
      "Livestream setup",
      "Merchandise and collections",
      "Creator and influencer meetups",
      "Launch strategy and execution",
      "TV commercials",
      "Cinema advertising",
      "Outdoor advertising (OOH, DOOH)",
      "Programmatic OOH",
      "Transit media",
      "Local radio spots",
      "Integrated ATL campaigns",
      "Proactive media placement",
    ],
    methodStage: "CONNECT",
    why: "The right context gives an audience a reason to pay attention and a clear way to engage.",
    lede: "Match the idea, audience and setting, then bring the right creative and production team together.",
    body: [
  "A campaign needs a clear role for every channel. We begin with who you want to reach, what they should understand and what you want them to do next.",
  "We assemble creators, media, producers, venues and partners around that brief. The work can include films, content collaborations, launches and physical experiences.",
  "hiAnzy coordinates the scope and delivery, with each collaborator credited for their contribution. Measures are agreed around the campaign objective and the evidence available."
],
    signals: [
      "You need to reach an audience that does not trust advertising",
      "Your category is crowded and everyone is saying the same three things",
      "A launch is coming and the plan is currently 'post about it'",
      "You have budget for reach and no view on which reach is relevant"
    ],
    deliverables: ["Creator and media partnerships", "PR and institutional collaborations", "Events, venues and production", "Experiential campaign design"],
    typical: "Campaign-based",
    faqs: [
      { q: "Do you have your own roster?", a: "We have a network rather than a roster, and we label who did what on every piece of work. The team is assembled per problem, which is the point." },
      { q: "Is this just influencer marketing?", a: "That is one instrument in it. Used alone and without a reason, it is an expensive way to reach people who were already scrolling past." }
    ]
  },
  {
    num: "06",
    slug: "advisory-security-scale",
    label: "MAKE IT LAST",
    title: "Advisory, Security & Scale",
    copy: "Strengthen the processes, responsibilities and safeguards that growth depends on.",
    capabilities: ["Founder advisory", "Technology advisory", "Security", "Privacy readiness", "Reputation", "Operations", "Customer systems", "Scale planning"],
    services: [
      "Founder advisory",
      "Technology advisory",
      "Growth and brand consulting",
      "Brand workshops and training",
      "Internal branding for teams",
      "Community building strategy",
      "Loyalty programmes and referral models",
      "Customer success programmes",
      "Customer engagement and retention planning",
      "Customer support ticketing",
      "Refund and replacement workflows",
      "Online review monitoring",
      "ORM strategy",
      "Sentiment analysis",
      "Crisis communication",
      "Reputation management",
      "Feedback loops and brand listening",
      "UGC systems",
      "Security",
      "Privacy readiness",
      "Operations and fulfilment",
      "Scale planning",
      "Measurement and reporting",
      "Long-term growth support",
    ],
    methodStage: "SCALE",
    why: "Clear ownership and reliable processes help the business handle more demand without adding avoidable risk.",
    lede: "Prepare your operations, technology and team for the demands of the next stage.",
    body: [
  "Growth puts pressure on the processes that used to be enough. Manual steps become queues, unclear ownership slows decisions and critical knowledge can become concentrated in one person.",
  "We review the operating model, customer systems and technology risks, then prioritise improvements around their business impact. Relevant specialists contribute where the scope calls for deeper expertise.",
  "Advisory connects those decisions to a practical roadmap, documentation and regular review. Your team gains a clearer way to manage change as the business develops."
],
    signals: [
      "You are growing faster than your processes were designed for",
      "Security is currently a spreadsheet and a strong sense of optimism",
      "Key knowledge lives with one person and they have earned a holiday",
      "A funding round or audit is coming and diligence will ask hard questions"
    ],
    deliverables: ["Founder and technology advisory", "Security and privacy readiness", "Operations and customer systems", "Scale planning and risk mapping"],
    typical: "Retained or milestone-based",
    faqs: [
      { q: "Is this a compliance service?", a: "It is broader than compliance and proportionate by design. Customer data, payments and access get real rigour; things that do not matter do not get security theatre performed over them." },
      { q: "We are small: is this premature?", a: "The cheapest moment to fix an access model or a manual dependency is before it has grown roots. It rarely gets less expensive with time." }
    ]
  },
];

export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

/* Each stage carries the detail that used to live nowhere: what we need from
   you, what lands at the end, and the honest failure mode. The stage cards on
   /how-we-work only fill five of twelve columns; this is what fills the rest. */
export const METHOD_STAGES = [
  {
    "label": "AUDIT",
    "title": "Understand what needs to change.",
    "page": "First, establish a shared diagnosis.",
    "body": "Review business data, team workflows and the customer journey to identify the constraint behind the symptoms.",
    "duration": "2–4 weeks",
    "inputs": [
      "Relevant reports and existing research",
      "Time with the people doing the work",
      "Your business goals and current concerns"
    ],
    "outputs": [
      "Evidence and findings ranked by impact",
      "A clearly defined problem",
      "Priorities for the next stage"
    ],
    "pitfall": "Test assumptions against evidence, including findings that challenge the original brief."
  },
  {
    "label": "ARCHITECT",
    "title": "Agree the plan and its priorities.",
    "page": "Next, design the route forward.",
    "body": "Translate the diagnosis into a blueprint. Define the scope, sequence, responsibilities and measures before building.",
    "duration": "2–4 weeks",
    "inputs": [
      "A decision maker for the project",
      "Budget, timing and team constraints",
      "Feedback on the proposed direction"
    ],
    "outputs": [
      "A sequenced roadmap with named owners",
      "Agreed scope and success measures",
      "Dependencies and decision points"
    ],
    "pitfall": "Rank priorities and resolve dependencies so the team knows what happens first."
  },
  {
    "label": "BUILD",
    "title": "Turn the blueprint into working tools.",
    "page": "Then, build and test the system.",
    "body": "Create the brand, content, technology and workflows in the agreed scope, with regular reviews as the work develops.",
    "duration": "6–16 weeks",
    "inputs": [
      "Content, assets and system access",
      "A named reviewer for each decision",
      "Feedback at agreed review points"
    ],
    "outputs": [
      "Tested deliverables ready for use",
      "Practical documentation",
      "Training and a clear handover"
    ],
    "pitfall": "Record changes to scope, cost and timing before adding them to delivery."
  },
  {
    "label": "CONNECT",
    "title": "Bring the right expertise together.",
    "page": "Connect the people and channels.",
    "body": "Coordinate specialists, creators, production and partners around a shared brief. hiAnzy keeps the delivery and responsibilities connected.",
    "duration": "Per engagement",
    "inputs": [
      "Audience and channel priorities",
      "Relevant partner introductions",
      "Approval of specialist briefs"
    ],
    "outputs": [
      "A team matched to the scope",
      "Clear roles and credited contributions",
      "A coordinated activation plan"
    ],
    "pitfall": "Brief each specialist against a defined need, with responsibilities agreed before work begins."
  },
  {
    "label": "SCALE",
    "title": "Measure, learn and improve.",
    "page": "Use results to guide the next move.",
    "body": "Review performance against the agreed measures. Improve what needs work and expand the activity that supports your goals.",
    "duration": "Ongoing, reviewed quarterly",
    "inputs": [
      "Access to agreed performance data",
      "Feedback from customers and the team",
      "Time for regular review and decisions"
    ],
    "outputs": [
      "Results against agreed goals",
      "Prioritised improvements and experiments",
      "An updated roadmap for growth"
    ],
    "pitfall": "Use the evidence to change direction when needed, including stopping work that no longer earns its place."
  }
];

export const WHY_HOW_NOW = [
  { key: "WHY", q: "What are we actually trying to change?", items: ["Ambition", "Customer", "Market", "Position", "The problem behind the problem"] },
  { key: "HOW", q: "What needs to exist for that change to happen?", items: ["Systems", "Technology", "Processes", "People", "Experiences", "Infrastructure"] },
  { key: "NOW", q: "What deserves to happen first?", items: ["Priorities", "Execution", "Measurement", "Momentum"] },
];

export const SOMETHINGS_OFF = [
  "Sales are growing but margins are not invited.",
  "Marketing is busy. Nobody can explain what the busy-ness returns.",
  "The website gets traffic. The traffic gets confused. The confusion leaves.",
  "Four tools, three spreadsheets and one person who knows how it all connects. She is on leave.",
  "Everything looks normal. That is occasionally the most expensive symptom of all.",
];

export const DIAGNOSTIC_AREAS = ["Business", "Brand", "Customer", "Sales", "Marketing", "Technology", "Data", "Operations", "Automation", "Security", "Growth"];

export const DIAGNOSTIC_OUTCOMES = [
  "What is happening",
  "Why it matters",
  "What it is costing you",
  "What should change",
  "What happens first",
  "Who should own it",
  "How success gets measured",
];

/* Each principle opens to explain itself. The headline is what we promise;
   the detail is what that actually costs us to keep. */
export const TRUST_PRINCIPLES = [
  {
    "name": "Defined problem",
    "detail": "We agree on the problem, the evidence behind it and the change the project should create before choosing the solution."
  },
  {
    "name": "Clear roadmap",
    "detail": "Your roadmap names the sequence, dependencies and decision points so everyone knows what happens next."
  },
  {
    "name": "Named ownership",
    "detail": "Each deliverable and decision has a named owner. Responsibilities stay visible across hiAnzy, your team and any specialists."
  },
  {
    "name": "Relevant specialists",
    "detail": "We bring in expertise according to the needs of the project and explain the role each person will play."
  },
  {
    "name": "Transparent scope",
    "detail": "The deliverables, exclusions, cost and timing are agreed in writing. Changes are discussed and documented."
  },
  {
    "name": "Measurable goals",
    "detail": "We agree on the measures and available evidence before work begins, then use them to review progress."
  },
  {
    "name": "Documentation",
    "detail": "Documentation and handover help your team operate and develop the system after launch."
  },
  {
    "name": "Operational thinking",
    "detail": "We design around the people, processes and constraints that the business works with every day."
  },
  {
    "name": "Security where it matters",
    "detail": "We consider access, customer data and operational risk as part of the scope, with specialist support where needed."
  }
];

export const AUDIENCES = [
  "Idea builders",
  "Entrepreneurs",
  "Founder-led companies",
  "Established businesses modernising systems",
  "D2C businesses",
  "Commerce businesses",
  "Hospitality",
  "Service companies",
  "Experience-led businesses",
  "Internal innovation teams",
  "Companies adopting AI or automation",
  "Teams entering the next stage of growth",
];

export const FILTER_LIST = [
  "A shared business goal to work towards.",
  "A decision maker who can unblock the work.",
  "Access to the information needed to understand the problem.",
  "Time for feedback and honest discussion.",
  "A budget and scope we can agree before beginning."
];

export const NETWORK_CATEGORIES_HOME = ["STRATEGY", "DESIGN", "TECHNOLOGY", "AI", "AUTOMATION", "MEDIA", "CREATORS", "PRODUCTION", "EXPERIENCES", "PR", "SECURITY", "OPERATIONS"];

export const BRAND_REFS = [
  "The Hosteller", "KNMA", "RootsBIM", "Hyundai", "Realme", "Paytm", "JioHotstar", "Adani", "Hitachi", "Airtel", "PepsiCo",
  "Canon", "Sunburn", "Comic-Con", "Ministry of Power", "The Oberoi", "NDTV", "Times of India", "Zee Network",
];

/**
 * The curated top tier of BRAND_REFS, for the one place on the site that
 * claims to show only the biggest names: the Work page marquee.
 *
 * BRAND_REFS above is the full honest list — everyone from a single-location
 * teahouse to a UN agency, credited without ranking. This is deliberately
 * smaller: publications, ministries and niche/regional names are real
 * relationships but not what "the biggest names" means, so they are left out
 * here without being erased from BRAND_REFS itself.
 *
 * Sourced from two places, both traceable: names already verified against the
 * brand deck's own client-logo page, plus a few pulled from the portfolio
 * credits in seed_data.py (Hero MotoCorp, Ashok Leyland, Bath & Body Works),
 * which carry a live campaign URL each rather than being asserted from a logo
 * alone. Nothing here is a name hiAnzy has not actually worked with.
 */
export const TOP_CLIENT_MARKS = [
  "Hyundai", "PepsiCo", "UNICEF", "Airtel", "Adani", "Paytm",
  "Canon", "Hitachi", "Hero MotoCorp", "Bath & Body Works", "JioHotstar", "Ashok Leyland",
];

export const CHARACTERS = [
  { img: "/brand/char-visionary.jpg", name: "The Visionary", line: "Sees the big picture before it's even drawn" },
  { img: "/brand/char-challenger.jpg", name: "The Challenger", line: "Bold ideas, always questioning norms" },
  { img: "/brand/char-fixer.jpg", name: "The Fixer", line: "Turns roadblocks into pathways" },
  { img: "/brand/char-anchor.jpg", name: "The Anchor", line: "Keeps the chaos in check, the clock ticking" },
  { img: "/brand/char-expressionist.jpg", name: "The Expressionist", line: "The artist, the performer, the voice to the world" },
  { img: "/brand/char-trendsetter.jpg", name: "The Trendsetter", line: "Senses style, spots culture, lives trends" },
];

export const TEAM_QUOTE = "Different instincts make the work stronger: imagine the possibility, question the assumptions, solve the details and keep the team moving.";

/** Subcategories shown inside the Network constellation when a cluster is focused. */
export const NETWORK_SUBCATS = {
  Strategy: ["Diagnostics", "Positioning", "Roadmaps", "Go-to-market", "Pricing"],
  Brand: ["Naming & story", "Identity systems", "Tone of voice", "Repositioning", "Founder brand"],
  Design: ["UX/UI", "Packaging", "Motion design", "Design systems"],
  Technology: ["Web dev", "Shopify / Woo", "CRM integration", "Backend & hosting", "Analytics setup"],
  AI: ["AI systems", "Assistants & agents", "Readiness audits"],
  Automation: ["Workflows", "n8n / Zapier", "Internal tools", "Drip systems"],
  Performance: ["Paid social", "Google & YouTube", "Funnel design", "CRO", "Growth loops"],
  Media: ["Print & digital", "Broadcast", "Entertainment", "Intl. press", "Vertical desks"],
  Creators: ["Singers", "Comedians", "Sketch artists", "Podcasters", "Vloggers", "Voice artists"],
  Production: ["Video & TVC", "Photography", "Motion graphics", "Sound design", "Post production"],
  Events: ["Festivals", "Campus circuit", "Launches", "Co-branded stages"],
  Venues: ["Hotels", "Clubs", "Stadiums", "Institutions"],
  Experiences: ["Pop-up tours", "Stage design", "Booth branding", "Merchandise"],
  PR: ["Media placement", "ORM", "Crisis comms", "Sentiment"],
  Security: ["Audits", "Privacy readiness", "Infra hardening"],
  Operations: ["Fulfilment", "Merch production", "Event ops", "Logistics"],
};

export const ROTATING_QUOTES = [
  { q: "Looking busy is not a growth strategy.", tag: "BUSINESS, UNPACKED" },
  { q: "Complexity is common. Clarity is engineered.", tag: "THE ANZY WAY" },
  { q: "Attention gets you noticed. Trust gets you chosen.", tag: "BRAND, DECODED" },
  { q: "A better funnel cannot rescue a confused offer.", tag: "GROWTH, WITH RECEIPTS" },
  { q: "Reach can be purchased. Relevance has to be designed.", tag: "MEDIA & CREATORS" },
  { q: "AI is not the strategy. The business outcome is.", tag: "TECH, WITHOUT THEATRE" },
];

export const INSIGHT_CATEGORIES = [
  { name: "Business, Unpacked", blurb: "Business systems and consulting." },
  { name: "Brand, Decoded", blurb: "Positioning, identity and customer experience." },
  { name: "Tech, Without Theatre", blurb: "Technology, automation and AI." },
  { name: "Growth, With Receipts", blurb: "Marketing, commerce and performance." },
  { name: "Things We Noticed", blurb: "Observations, patterns and founder notes." },
];

export const PROVENANCE_STYLES = {
  "HI ANZY": { cls: "bg-[#232A2A] text-[#F7F5EE]", bar: false },
  "HI ANZY DIRECT": { cls: "bg-[#232A2A] text-[#F7F5EE]", bar: false },
  "HI ANZY + PARTNER": { cls: "bg-[#F19020]/15 text-[#232A2A] border border-[#F19020]", bar: false },
  "HI ANZY + COLLABORATOR": { cls: "bg-[#F19020]/15 text-[#232A2A] border border-[#F19020]", bar: false },
  // Alias: ecosystem_items.provenance values arrive as the backend's
  // HI_ANZY_COLLABORATOR enum member, space-normalized before this lookup
  // (see ProvenanceTag) — lands here rather than on the "+" key above.
  "HI ANZY COLLABORATOR": { cls: "bg-[#F19020]/15 text-[#232A2A] border border-[#F19020]", bar: false },
  "COLLABORATOR WORK": { cls: "bg-[#F7F5EE] text-[#232A2A] border border-[#232A2A]/30", bar: true },
  "COLLABORATOR CREDENTIAL": { cls: "bg-[#F7F5EE] text-[#232A2A] border border-[#232A2A]/30", bar: true },
  NETWORK: { cls: "bg-transparent text-[#232A2A] border border-dashed border-[#232A2A]/40", bar: false },
  "NETWORK ACCESS": { cls: "bg-transparent text-[#232A2A] border border-dashed border-[#232A2A]/40", bar: false },
};

/* The Hi Anzy Orbit — six categories, one deck, on /work. `key` matches the
   backend's EcosystemCategory enum exactly, so it doubles as the ?category=
   filter value for getEcosystem() on each category's own index page. */
export const ORBIT_CATEGORIES = [
  {
    num: "01",
    key: "built_here",
    name: "BUILT HERE",
    descriptor: "In-house projects",
    copy: "Where we put our own thinking to work.",
    // Longer than `copy` on purpose: `copy` is the on-page tagline, this is
    // what the <Seo> description actually needs to tell a search result or
    // link preview about what the category page contains.
    seoDescription: "Projects hiAnzy built and delivered directly, each written up as a full case study.",
    route: "/work/built-here",
  },
  {
    num: "02",
    key: "built_together",
    name: "BUILT TOGETHER",
    descriptor: "Collaborations & joint work",
    copy: "Good work rarely asks who deserves all the credit.",
    seoDescription: "Case studies built alongside collaborators and partners, credited honestly rather than claimed as solo work.",
    route: "/work/built-together",
  },
  {
    num: "03",
    key: "collaborator",
    name: "MINDS IN THE MIX",
    descriptor: "Collaborators & specialists",
    copy: "Specialist expertise shaped around the project.",
    seoDescription: "Independent specialists in the hiAnzy network — real capabilities and relationships, labelled honestly, not staff.",
    route: "/network/collaborators",
  },
  {
    num: "04",
    key: "creator",
    name: "FACES & VOICES",
    descriptor: "Artists & creators",
    copy: "Sometimes the right message needs the right messenger.",
    seoDescription: "Artists and creators the network can bring in when a project needs a real voice, not just reach.",
    route: "/network/artists-creators",
  },
  {
    num: "05",
    key: "venue",
    name: "PLACES WITH POSSIBILITY",
    descriptor: "Venues & institutions",
    copy: "Some ideas need more than a screen.",
    seoDescription: "Partner venues and institutions the network can activate for events, launches and experiences that need a physical space.",
    // Not /network/venues — that slug is already the Events & Venue
    // Production discipline page (see disciplines.js). This is a roster of
    // partner venues, a different thing from that capability page.
    route: "/network/venue-partners",
  },
  {
    num: "06",
    key: "partner",
    name: "PARTNERS IN PROGRESS",
    descriptor: "Media, production & strategic partners",
    copy: "When the work needs to travel, scale or get specialised.",
    seoDescription: "Media, production and strategic partners the network can activate when a project needs to scale or travel.",
    route: "/network/partners",
  },
];


/* ── Engagement model ────────────────────────────────────────────────────────
   Work is grouped by development stage rather than sold as a flat menu, so the
   sequence is the default. Stage keys line up with METHOD_STAGES above. */
export const PACKAGES = [
  {
    key: "diagnose",
    stage: "01",
    name: "Clarity Diagnostic",
    tagline: "Name the problem before you fund the fix.",
    forWho: "Something is clearly off, but the reports disagree about what.",
    timeline: "2–4 weeks",
    pricing: "Fixed scope, fixed price",
    includes: [
      "Business, brand and technology audit",
      "Customer journey walk-through, end to end",
      "Data and reporting sanity check",
      "Prioritised blueprint with named owners",
    ],
    outcome: "A shared diagnosis, a prioritised plan and the evidence behind each recommendation.",
    nextStage: "define",
  },
  {
    key: "define",
    stage: "02",
    name: "Positioning & Story",
    tagline: "Decide what you are, in language people repeat.",
    forWho: "You need a clear position and a consistent story for your audience.",
    timeline: "3–5 weeks",
    pricing: "Fixed scope",
    includes: [
      "Positioning and category decision",
      "Messaging hierarchy and proof points",
      "Naming, identity direction and tone of voice",
      "Offer architecture and pricing narrative",
    ],
    outcome: "A story your sales team, your site and your investors all tell the same way.",
    nextStage: "build",
  },
  {
    key: "build",
    stage: "03",
    name: "Brand Operating System",
    tagline: "Make the decision real, in public.",
    forWho: "You have a direction and need the website, content and tools to deliver it.",
    timeline: "6–12 weeks",
    pricing: "Scoped from the blueprint",
    includes: [
      "Website or commerce build",
      "Design system and content templates",
      "CRM, analytics and automation wiring",
      "Launch assets and internal handover",
    ],
    outcome: "A connected website, content system and workflow your team can operate.",
    nextStage: "connect",
  },
  {
    key: "connect",
    stage: "04",
    name: "Network Activation",
    tagline: "Bring in the specialists the problem actually needs.",
    forWho: "You need specialist people and channels to bring the project to its audience.",
    timeline: "Per engagement",
    pricing: "Retainer or per project",
    includes: [
      "Specialist, creator and media matching",
      "Production and campaign management",
      "Partner and venue access",
      "Single accountable point of contact",
    ],
    outcome: "A team that changes shape per problem, with accountability that does not.",
    nextStage: "scale",
  },
  {
    key: "scale",
    stage: "05",
    name: "Growth & Measurement",
    tagline: "Keep what works. Retire what only looks productive.",
    forWho: "Your foundation is in place and you want to improve conversion, retention and growth.",
    timeline: "Ongoing, quarterly reviews",
    pricing: "Monthly retainer",
    includes: [
      "Performance, SEO and answer-engine visibility",
      "Content engine and editorial calendar",
      "Conversion and funnel iteration",
      "Quarterly systems review",
    ],
    outcome: "Clear performance reporting and a prioritised plan for the next improvements.",
    nextStage: null,
  },
];

/* Recurring stage pairings. These exist because these are the combinations
   businesses actually arrive needing — not because bundling looks tidy. */
export const COMBOS = [
  {
    key: "reset",
    name: "The Reset",
    stages: ["diagnose", "define"],
    tagline: "Diagnosis plus positioning, in one run.",
    forWho: "Founder-led businesses that have outgrown the story they launched with.",
    timeline: "5–8 weeks",
    highlight: false,
  },
  {
    key: "launchpad",
    name: "Launchpad",
    stages: ["define", "build"],
    tagline: "Decide it and build it, without a handover gap.",
    forWho: "New products, new markets, or a rebrand that has to ship on a date.",
    timeline: "9–16 weeks",
    highlight: true,
  },
  {
    key: "operating-system",
    name: "Full Operating System",
    stages: ["diagnose", "define", "build", "connect", "scale"],
    tagline: "The whole arc, sequenced and owned end to end.",
    forWho: "Multi-channel groups where several parts contradict each other.",
    timeline: "6–12 months",
    highlight: false,
  },
];