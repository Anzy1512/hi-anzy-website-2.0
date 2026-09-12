"""hiAnzy seed content.
Sample case studies follow the CMS schema so real content can replace them.
Network resources are migrated from the original hiAnzy brand deck and
classified truthfully. Only publicStatus == "public" items are served.
No follower counts are hard-coded anywhere.
"""

CASE_STUDIES = [
    {
        "title": "The Storefront Was Never the Problem",
        "slug": "the-storefront-was-never-the-problem",
        "relatedServices": ["business-audit-strategy", "growth-content-commerce", "digital-technology-automation"],
        "client": "D2C Ayurvedic skincare brand",
        "industry": "D2C / Commerce",
        "year": "2024",
        "provenance": "HI ANZY",
        "summary": "A brand convinced it needed a prettier website. It needed a retention system.",
        "situation": "Rising ad spend, respectable first orders, and a repeat-purchase rate that refused to move. The team wanted a storefront redesign because the storefront was the thing everyone could see.",
        "gap": "The offer was structured for discovery, not for return. No post-purchase journey, no replenishment logic, no reason to come back that wasn't a discount.",
        "insight": "Customers weren't leaving because the site was ugly. They were leaving because nothing asked them to stay. A better funnel cannot rescue a confused offer.",
        "decision": "Redesign later. First: restructure the offer around replenishment cycles, build the lifecycle system, then let the storefront express it.",
        "build": "Offer architecture, subscription and replenishment flows, lifecycle email and WhatsApp journeys, a rebuilt PDP structure, and yes, eventually, a better-looking storefront.",
        "result": "Repeat purchase became a system instead of a coincidence. The brand now plans inventory around predictable reorder behaviour rather than campaign spikes.",
        "next": "Retail-readiness audit and a packaging system built for shelf, not just for feed.",
        "services": ["Business diagnostics", "Offer architecture", "Lifecycle marketing", "Commerce UX", "Automation"],
        "metrics": None,
        "metricEvidence": "Client metrics are withheld by agreement. We are happy to walk through them in a conversation.",
        "featured": True,
        "published": True,
    },
    {
        "title": "A Rebrand That Turned Out to Be a Pricing Problem",
        "slug": "a-rebrand-that-turned-out-to-be-a-pricing-problem",
        "relatedServices": ["business-audit-strategy", "brand-experience"],
        "client": "Founder-led B2B logistics company",
        "industry": "B2B Services",
        "year": "2024",
        "provenance": "HI ANZY",
        "summary": "The brief said rebrand. The diagnostic said the brand was fine and the pricing was mysterious.",
        "situation": "Fifteen years of steady work, a reputation built on relationships, and a growing sense that the company looked smaller than it was. The founder arrived asking for a new identity.",
        "gap": "Prospects weren't rejecting the logo. They were stalling at proposals no two of which looked alike. Pricing lived in the founder's head, and every quote was an improvisation.",
        "insight": "The market didn't misunderstand the brand. It misunderstood the offer. When the price is a surprise, the brand always feels wrong.",
        "decision": "Pause the rebrand. Build a service architecture with named tiers, transparent scoping and a proposal system anyone on the team could run.",
        "build": "Service productisation, pricing architecture, proposal templates wired into their CRM, a refreshed (not replaced) identity, and a website that finally explained what a quote would contain.",
        "result": "Sales conversations got shorter and calmer. The team quotes without the founder in the room. The identity refresh took two weeks because the strategy work had already made the decisions.",
        "next": "A key-account growth playbook and a partner-referral system.",
        "services": ["Business audit", "Positioning", "Pricing architecture", "CRM systems", "Brand refresh"],
        "metrics": None,
        "metricEvidence": "Directional outcomes shared with client consent; commercial figures stay private.",
        "featured": True,
        "published": True,
    },
    {
        "title": "Commerce, Untangled",
        "slug": "commerce-untangled",
        "relatedServices": ["business-audit-strategy", "digital-technology-automation"],
        "client": "Multi-city hospitality group",
        "industry": "Hospitality",
        "year": "2025",
        "provenance": "HI ANZY + PARTNER",
        "summary": "Five venues, four booking tools, three spreadsheets, one very tired operations head.",
        "situation": "A hospitality group growing city by city, with each venue accumulating its own booking tool, its own guest data, and its own way of doing things. Head office ran on exported CSVs and optimism.",
        "gap": "No single view of the guest. Marketing couldn't tell regulars from first-timers. Events were sold out and understaffed at the same time, in the same building.",
        "insight": "This wasn't a technology shortage. It was a technology surplus with no architecture. Adding another tool would have made it worse.",
        "decision": "Consolidate before automating. One reservation layer, one guest record, one events pipeline, then automate the handovers between them.",
        "build": "Systems audit, platform consolidation, a unified guest data layer, automated event-to-staffing workflows, and dashboards the venue managers actually asked for. Integration engineering delivered with a specialist technology partner from the hiAnzy network.",
        "result": "Head office stopped reconciling spreadsheets. Venue managers see tonight's picture before tonight happens. Guest communication now recognises the guest.",
        "next": "A loyalty layer, now that there is finally one record of who is being loyal.",
        "services": ["Systems audit", "Platform consolidation", "Data architecture", "Workflow automation", "Dashboards"],
        "metrics": None,
        "metricEvidence": "Operational outcomes verified with the client; figures shared in conversation.",
        "featured": True,
        "published": True,
    },
    {
        "title": "Launch Systems for a Festival Season",
        "slug": "launch-systems-for-a-festival-season",
        "relatedServices": ["media-creators-experiences", "growth-content-commerce"],
        "client": "Consumer electronics launch",
        "industry": "Consumer Tech",
        "year": "2023",
        "provenance": "HI ANZY",
        "summary": "A product launch that needed creators, venues, media and logistics to behave like one system.",
        "situation": "A new device, a festival-season deadline, and a launch plan that lived in six different vendors' inboxes. Everyone was doing their job. Nobody was doing the same job.",
        "gap": "No connective tissue. Creator content, on-ground experiences, PR moments and retail timing were scheduled independently, which is a polite way of saying they were colliding.",
        "insight": "Reach can be purchased. Relevance has to be designed. The launch didn't need more vendors; it needed one operating picture.",
        "decision": "hiAnzy took the coordination layer: one calendar, one narrative, one accountability structure. Specialists from the network handled what specialists handle.",
        "build": "Launch architecture, creator collaborations coordinated through the network, venue activations across clubs and campus properties, media placements timed to retail availability, and a war-room cadence that kept all of it honest.",
        "result": "The launch read as one story across feeds, floors and press, because it was one story, run on one system.",
        "next": "A repeatable launch playbook the brand now runs for every product cycle.",
        "services": ["Launch strategy", "Creator collaborations", "Experiential", "Media coordination", "Production"],
        "metrics": None,
        "metricEvidence": "Campaign delivered with network partners; detailed results available on request.",
        "featured": False,
        "published": True,
    },
    {
        "title": "The Dashboard Nobody Opened",
        "slug": "the-dashboard-nobody-opened",
        "relatedServices": ["digital-technology-automation", "business-audit-strategy"],
        "client": "Professional services firm, 120 people",
        "industry": "Professional Services",
        "year": "2024",
        "provenance": "COLLABORATOR WORK",
        "summary": "An internal-tools build by a technologist in the hiAnzy network. Classified accordingly.",
        "situation": "Leadership commissioned a company dashboard. Six months later it was accurate, comprehensive and opened roughly never.",
        "gap": "The dashboard answered questions nobody was asking, on a schedule nobody worked to. Reporting was designed around data availability, not around decisions.",
        "insight": "Good systems start from the decision and work backwards. If a number doesn't change what somebody does on Monday, it is decoration.",
        "decision": "Kill the mega-dashboard. Build three small decision views (pipeline, delivery load, cash), each owned by the person who acts on it.",
        "build": "Decision mapping, three focused views with alerting, and automated weekly digests that arrive where people already are.",
        "result": "The views get opened because they end arguments. The mega-dashboard was retired without a funeral.",
        "next": "Extending the same decision-first approach to client reporting.",
        "services": ["Internal tools", "Data architecture", "Workflow automation"],
        "metrics": None,
        "metricEvidence": "Delivered independently by a network collaborator; shown here as network credential, not hiAnzy client work.",
        "featured": False,
        "published": True,
    },
]

NETWORK_RESOURCES = [
    # hiAnzy Core Studios
    {"name": "hiAnzy Strategy Desk", "slug": "hi-anzy-strategy-desk", "category": "Strategy", "relationshipType": "HI ANZY DIRECT", "geography": "India / Remote", "capabilities": ["Business diagnostics", "Positioning", "Transformation roadmaps", "Go-to-market"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "The core layer. This is where accountability lives."},
    {"name": "hiAnzy Brand Studio", "slug": "hi-anzy-brand-studio", "category": "Brand", "relationshipType": "HI ANZY DIRECT", "geography": "India / Remote", "capabilities": ["Brand strategy", "Identity", "Messaging", "Founder positioning"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Clarity first. Aesthetics follow instructions."},
    {"name": "hiAnzy Systems & Web Studio", "slug": "hi-anzy-systems-web-studio", "category": "Technology", "relationshipType": "HI ANZY DIRECT", "geography": "India / Remote", "capabilities": ["Websites", "Commerce", "Applications", "Integrations", "CRM"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Builds what the strategy promised."},
    {"name": "hiAnzy Automation Lab", "slug": "hi-anzy-automation-lab", "category": "Automation", "relationshipType": "HI ANZY DIRECT", "geography": "India / Remote", "capabilities": ["Workflow automation", "n8n / Zapier systems", "Internal tools", "Ops handovers"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Removes friction. Doesn't create a new channel about friction."},
    {"name": "hiAnzy AI Practice", "slug": "hi-anzy-ai-practice", "category": "AI", "relationshipType": "HI ANZY DIRECT", "geography": "India / Remote", "capabilities": ["AI systems design", "Assistant & agent builds", "AI-readiness audits"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "AI is not the strategy. The business outcome is."},
    # Collaborator Collectives
    {"name": "Design Collective", "slug": "design-collective", "category": "Design", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "India / Remote", "capabilities": ["UX/UI", "Packaging", "Motion", "Design systems"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Senior designers assembled per problem, briefed by the strategy desk."},
    {"name": "Performance Media Pod", "slug": "performance-media-pod", "category": "Performance", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "India", "capabilities": ["Paid media", "SEO", "Funnels", "CRO", "Marketplace growth"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Spends money like it's theirs. Reports like it's yours."},
    {"name": "Film & TVC Production Unit", "slug": "film-tvc-production-unit", "category": "Production", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "Delhi NCR / Mumbai", "capabilities": ["Brand films", "TVC", "Product photography", "Concept shoots"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Production credits span national brands and government campaigns."},
    {"name": "Sound & Sonic Design Unit", "slug": "sound-sonic-design-unit", "category": "Production", "relationshipType": "COLLABORATOR CREDENTIAL", "geography": "India / Remote", "capabilities": ["Sonic branding", "Audio ads", "Soundscapes"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q2", "portfolioUrl": None, "note": "Independent credential. Work includes a handloom-ministry piece shared by the Prime Minister's office."},
    {"name": "PR & Reputation Desk", "slug": "pr-reputation-desk", "category": "PR", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "India / International", "capabilities": ["Media placement", "ORM", "Crisis communication", "Sentiment monitoring"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Reputation is a system, not a press release."},
    {"name": "Cybersecurity & Privacy Readiness", "slug": "cybersecurity-privacy-readiness", "category": "Security", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "India / Remote", "capabilities": ["Security audits", "Privacy readiness", "Infra hardening"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Growth is exciting until the weak systems start introducing themselves."},
    {"name": "Logistics & Ops Partners", "slug": "logistics-ops-partners", "category": "Operations", "relationshipType": "NETWORK ACCESS", "geography": "Pan India", "capabilities": ["Fulfilment", "Merchandise production", "Line production", "Event ops"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "The unglamorous layer that decides whether promises ship."},
    {"name": "Experiential & Pop-Up Crew", "slug": "experiential-pop-up-crew", "category": "Experiences", "relationshipType": "HI ANZY + COLLABORATOR", "geography": "India", "capabilities": ["City pop-up tours", "College festivals", "Co-branded stages", "Influencer meetups"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "On-ground moments engineered to travel further than the venue."},
    # Creators
    {"name": "Vilen", "slug": "vilen", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Singer-songwriter", "Brand collaborations"], "featured": True, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Independent artist. Collaboration access via network."},
    {"name": "Harsh Gujral", "slug": "harsh-gujral", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Stand-up comedy", "Live events", "Brand integrations"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Comedian. Network collaboration credential."},
    {"name": "Harsh Beniwal", "slug": "harsh-beniwal", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Sketch content", "Brand campaigns"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Creator. Network collaboration credential."},
    {"name": "Purav Jha", "slug": "purav-jha", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Sketch & satire content", "Brand integrations"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Creator. Network collaboration credential."},
    {"name": "Realhit", "slug": "realhit", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Podcasts", "Creator campaigns"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Creator & podcaster. Network collaboration credential."},
    {"name": "Rajan Arora", "slug": "rajan-arora", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Creator content", "Brand storytelling"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Creator. Network collaboration credential."},
    {"name": "Prachi Kapoor", "slug": "prachi-kapoor", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Creator & model", "Campaign content"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Creator & model. Network collaboration credential."},
    {"name": "Shiwangi Singh", "slug": "shiwangi-singh", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Travel & fashion content"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Travel & fashion vlogger. Network collaboration credential."},
    {"name": "Roop Verma", "slug": "roop-verma", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "International", "capabilities": ["International travel content"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "International travel vlogger. Network collaboration credential."},
    {"name": "Aamir Azher Khan", "slug": "aamir-azher-khan", "category": "Creators", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Voiceover", "Audio branding"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Voiceover artist. Network collaboration credential."},
    # Media
    {"name": "National Print & Digital Powerhouses", "slug": "national-print-digital-powerhouses", "category": "Media", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Dainik Bhaskar", "Amar Ujala", "Hans India", "Mid-day", "Indiatimes", "ED Times"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Print and regional press placement via Dainik Bhaskar, Amar Ujala, Hans India, Mid-day, Indiatimes and ED Times."},
    {"name": "Broadcast & Digital News Networks", "slug": "broadcast-digital-news-networks", "category": "Media", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Aaj Tak", "Network18", "Republic World", "NDTV", "ABP Network", "ZEE Network", "STAR Network"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Broadcast and digital news reach across Aaj Tak, Network18, Republic World, HT Media, NDTV, ABP, ZEE and STAR."},
    {"name": "Entertainment & Lifestyle Portals", "slug": "entertainment-lifestyle-portals", "category": "Media", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Bollywood Hungama", "Filmy Beat", "Bollywood Life", "SpotBoye", "RVCJ", "ZOOM TV"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Entertainment and lifestyle coverage through Bollywood Hungama, Filmy Beat, Bollywood Life, SpotBoye, RVCJ and ZOOM TV."},
    {"name": "International Business Press", "slug": "international-business-press", "category": "Media", "relationshipType": "NETWORK ACCESS", "geography": "International", "capabilities": ["Benzinga", "Yahoo Finance", "IB Times", "Gulf News", "Khaleej Times", "New York Wire"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "International and financial press: Benzinga, Yahoo Finance, IB Times, Gulf News, Khaleej Times and New York Wire."},
    {"name": "Tech, Auto & Sports Desks", "slug": "tech-auto-sports-desks", "category": "Media", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["HT Tech", "Gizbot", "TechCircle", "DriveSpark", "Times Drive", "NDTV Sports", "Cricket Country"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q4", "portfolioUrl": None, "note": "Category desks across HT Tech, Gizbot, TechCircle, Techlusive, DriveSpark, Times Drive, Auto HT, NDTV Sports, MyKhel and Cricket Country."},
    # Venues & Events
    {"name": "Premium Hotels & Hospitality", "slug": "premium-hotels-hospitality", "category": "Venues", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["The Oberoi", "ITC Maurya", "The Leela Palace", "Shangri-La", "The Ashok", "EROS Hotel"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Launch events, press dinners and residencies across The Oberoi, ITC Maurya, The Leela Palace, Shangri-La, The Ashok, Hotel Samrat and EROS Hotel."},
    {"name": "Clubs & Nightlife Circuit", "slug": "clubs-nightlife-circuit", "category": "Venues", "relationshipType": "NETWORK ACCESS", "geography": "Delhi NCR+", "capabilities": ["Soho", "Club Playboy", "MNKY HOUZ", "Summer House", "SOCIAL", "Aquila", "Diablo"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Club takeovers and launch nights across Soho, Club Playboy, BW, Key Delhi, Diablo, Aquila, MNKY HOUZ, Summer House and SOCIAL."},
    {"name": "Stadiums & Auditoriums", "slug": "stadiums-auditoriums", "category": "Venues", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["JLN Stadium", "Arun Jaitley Stadium", "Dhyan Chand Stadium", "The Stein Auditorium", "India Habitat Centre", "Manekshaw Auditorium"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Large-format venue access including JLN, Dhyan Chand, Modi and Arun Jaitley stadiums, plus Stein, Habitat, Zorawar and Manekshaw auditoriums."},
    {"name": "Festivals & Cultural Properties", "slug": "festivals-cultural-properties", "category": "Events", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["Sunburn", "Comic-Con", "Jashan-e-Rekhta", "Ziro Festival", "Bir Music Festival", "TEDx", "NIFT Spectrum"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Festival partnership access: Sunburn, Comic-Con, Jashan-e-Rekhta, Ziro, Bir Music Festival, TEDx and NIFT Spectrum."},
    {"name": "Campus Network", "slug": "campus-network", "category": "Events", "relationshipType": "NETWORK ACCESS", "geography": "India", "capabilities": ["NIFT Delhi", "Delhi University", "IIT Delhi", "IIT Bombay", "Symbiosis Pune", "St. Xavier's Bangalore"], "featured": False, "publicStatus": "public", "lastVerified": "2025-Q3", "portfolioUrl": None, "note": "Institutional access for campus activations, festivals and recruitment across NIFT Delhi, DU, IIT Delhi, IIT Bombay, Symbiosis Pune and St. Xavier's Bangalore."},
    {
        "name": "Hostel & Community Spaces",
        "slug": "hostel-and-community-spaces",
        "category": "Experiences",
        "relationshipType": "NETWORK ACCESS",
        "geography": "Pan India",
        "capabilities": ["Youth activations", "Pop-up tours", "Community events"],
        "featured": False,
        "publicStatus": "public",
        "lastVerified": "2025-Q4",
        "portfolioUrl": None,
        "note": "The Hosteller, Molecule and Mudhouse: pan-India youth and traveller footfall.",
    },
    {
        "name": "Health & Lifestyle Desks",
        "slug": "health-and-lifestyle-desks",
        "category": "Media",
        "relationshipType": "NETWORK ACCESS",
        "geography": "India",
        "capabilities": ["Health features", "Lifestyle placement", "Education coverage"],
        "featured": False,
        "publicStatus": "public",
        "lastVerified": "2025-Q4",
        "portfolioUrl": None,
        "note": "Quint, Boldsky, OnlyMyHealth, Aaj Tak Campus and Career India.",
    },
]

INSIGHTS = [
    {
        "title": "Looking Busy Is Not a Growth Strategy",
        "slug": "looking-busy-is-not-a-growth-strategy",
        "category": "Business, Unpacked",
        "excerpt": "Activity is easy to schedule and satisfying to report. Progress is neither. Here is how to tell which one your company is running on.",
        "readingTime": "6 min",
        "published": True,
        "seo": {
            "title": "Looking Busy Is Not a Growth Strategy | hiAnzy",
            "description": "How to tell the difference between activity and progress in your business, and what a systems diagnostic actually looks for.",
        },
        "body": [
            {"type": "p", "text": "Every struggling company we have audited had one thing in common: a full calendar. Standups, sprints, campaign reviews, vendor calls. The machine was running. The machine was, in several cases, running beautifully in the wrong direction."},
            {"type": "p", "text": "Activity is easy to schedule and satisfying to report. Progress is neither. Progress requires someone to say, out loud, what the business is actually trying to change this quarter, and most calendars are built to avoid that conversation."},
            {"type": "h2", "text": "The busy-ness test"},
            {"type": "p", "text": "Pick any recurring activity in your company. A weekly report, a monthly campaign, a quarterly review. Now ask: if this stopped tomorrow, what decision would be made worse? If the honest answer is none, you have found decoration. Decoration with a headcount."},
            {"type": "p", "text": "We ran this test with a founder-led services firm last year. Of eleven recurring reports, three survived. The other eight were rituals: produced because they had always been produced, read by no one, defended by everyone."},
            {"type": "h2", "text": "Why systems beat willpower"},
            {"type": "p", "text": "The fix is rarely motivational. Nobody needs another town hall about focus. The fix is structural: connect every recurring activity to a named decision, give every decision a named owner, and let everything else stop. That is not minimalism. That is engineering."},
            {"type": "quote", "text": "If a number doesn't change what somebody does on Monday, it is decoration."},
            {"type": "p", "text": "When we run a Business Systems Diagnostic, this is half the work: mapping activity to decisions and watching how much of the week evaporates. The other half is harder: deciding what the freed-up capacity should build instead. That part is a much better meeting."},
        ],
    },
    {
        "title": "The Invoice Should Not Be the Strategy",
        "slug": "the-invoice-should-not-be-the-strategy",
        "category": "Business, Unpacked",
        "excerpt": "When a vendor's recommendation always matches the vendor's rate card, you are not buying strategy. You are buying inventory.",
        "readingTime": "5 min",
        "published": True,
        "seo": {
            "title": "The Invoice Should Not Be the Strategy | hiAnzy",
            "description": "Why vendor recommendations so often match vendor rate cards, and how to buy diagnosis before prescription.",
        },
        "body": [
            {"type": "p", "text": "Ask a branding agency what your business needs and the answer will involve branding. Ask a performance agency and the answer will involve media spend. Ask a development studio and, well, you can see where this is going. Nobody is lying. Everybody is selling."},
            {"type": "p", "text": "This is not a character flaw of agencies. It is a structural feature of buying execution from people who only do one kind of execution. The recommendation converges on the rate card because the rate card is the only tool in the room."},
            {"type": "h2", "text": "Diagnosis before prescription"},
            {"type": "p", "text": "Medicine solved this problem centuries ago: the person who diagnoses should not be financially attached to one treatment. Business buying mostly hasn't caught up. The diagnostic gets skipped because it isn't billable in the same satisfying way a deliverable is."},
            {"type": "p", "text": "The result is familiar. A rebrand that turned out to be a pricing problem. A CRM migration that turned out to be a process problem. An AI initiative that turned out to be a we-don't-know-where-our-data-lives problem."},
            {"type": "p", "text": "Prescription follows diagnosis. Your business deserves at least the same courtesy as your headache."},
            {"type": "h2", "text": "What to ask instead"},
            {"type": "p", "text": "Before commissioning any significant piece of work, ask the provider one question: what would convince you that this is the wrong solution? A serious partner has an answer, because a serious partner has a model of your business that is bigger than their own service. If the answer is a blank pause, you have learned something valuable at no cost."},
        ],
    },
    {
        "title": "Clarity Converts Before the CTA Does",
        "slug": "clarity-converts-before-the-cta-does",
        "category": "Brand, Decoded",
        "excerpt": "People rarely buy what they do not understand. Most conversion problems are comprehension problems wearing a design costume.",
        "readingTime": "5 min",
        "published": True,
        "seo": {
            "title": "Clarity Converts Before the CTA Does | hiAnzy",
            "description": "Why most conversion problems are comprehension problems, and how positioning work quietly does the selling.",
        },
        "body": [
            {"type": "p", "text": "A website gets blamed for a lot of things it didn't do. Traffic arrives, traffic leaves, and the diagnosis lands on button colours, page speed, or the absence of an exit-intent popup. Sometimes that's fair. Usually the visitor left for a simpler reason: they could not work out what was being sold, to whom, or why it was different."},
            {"type": "h2", "text": "The five-second problem"},
            {"type": "p", "text": "Show your homepage to someone outside your industry for five seconds. Then ask them what you sell and who it is for. We do this in almost every audit. The results are humbling roughly eighty percent of the time, including, on occasion, for us."},
            {"type": "p", "text": "The issue is rarely vocabulary. It is that companies describe themselves from the inside (their process, their categories, their org chart) while buyers shop from the outside: my situation, my problem, my risk."},
            {"type": "quote", "text": "Attention gets you noticed. Trust gets you chosen."},
            {"type": "h2", "text": "Positioning is a system decision"},
            {"type": "p", "text": "Positioning isn't a paragraph on a slide. It cascades: it decides the offer names, the pricing page, the sales deck, the onboarding email, the way the founder answers 'so what do you do?' at dinner. When those artefacts disagree, the customer experiences the disagreement as doubt. And doubt does not click."},
            {"type": "p", "text": "So before rebuilding the funnel, run the cheaper experiment: rewrite the first screen of your site so a stranger understands it in five seconds. It is remarkable how often the funnel turns out to have been fine."},
        ],
    },
    {
        "title": "AI Is Not the Strategy",
        "slug": "ai-is-not-the-strategy",
        "category": "Tech, Without Theatre",
        "excerpt": "Adopting AI because competitors are adopting AI is how companies end up automating processes that should not exist.",
        "readingTime": "5 min",
        "published": True,
        "seo": {
            "title": "AI Is Not the Strategy | hiAnzy",
            "description": "A practical way to decide where AI belongs in your business, and where it is expensive theatre.",
        },
        "body": [
            {"type": "p", "text": "Somewhere right now, a leadership team is approving an AI initiative whose success metric is 'having an AI initiative'. The board asked, a budget appeared, and a chatbot will shortly be attached to a website whose actual problem is that nobody understands the pricing."},
            {"type": "p", "text": "We like AI. We build with it. Which is exactly why we keep saying the unfashionable thing: AI is not the strategy. The business outcome is. A tool, however remarkable, inherits the quality of the system it is dropped into."},
            {"type": "h2", "text": "Automating a mess produces a faster mess"},
            {"type": "p", "text": "The most common AI failure we see is not technical. It is sequencing. A company automates a workflow nobody has examined in years, and the automation faithfully reproduces every redundant step, at scale, with confidence, around the clock."},
            {"type": "quote", "text": "Technology should remove friction. Not create a new Slack channel about friction."},
            {"type": "h2", "text": "A boring, useful test"},
            {"type": "p", "text": "For any proposed AI use case, write one sentence: 'This saves [whom] [how much time or money] on [which decision or task], and we will know because [which number moves].' If the sentence cannot be completed, the use case is theatre. If it can, you often discover something even better: half the time, the fix doesn't need AI at all. It needs a form with fewer fields, or two systems that finally talk to each other."},
            {"type": "p", "text": "That is less exciting to announce. It is considerably more exciting to bank."},
        ],
    },
    {
        "title": "A Better Funnel Cannot Rescue a Confused Offer",
        "slug": "a-better-funnel-cannot-rescue-a-confused-offer",
        "category": "Growth, With Receipts",
        "excerpt": "Before optimising the journey, check the destination. Most funnel leaks are offer leaks measured downstream.",
        "readingTime": "5 min",
        "published": True,
        "seo": {
            "title": "A Better Funnel Cannot Rescue a Confused Offer | hiAnzy",
            "description": "Why funnel optimisation fails when the offer is unclear, and the order of operations that actually moves revenue.",
        },
        "body": [
            {"type": "p", "text": "Funnel optimisation is seductive because it is measurable. Move a button, watch a percentage. But a funnel is a pipe, and a pipe can only deliver what is poured into it. Pour in a confused offer and the funnel will efficiently distribute confusion."},
            {"type": "h2", "text": "How offer confusion shows up as funnel data"},
            {"type": "p", "text": "High add-to-cart with high checkout abandonment? Often a pricing-surprise problem, not a checkout-UX problem. Strong traffic with weak opt-ins? Often a who-is-this-for problem. Great trial signups with brutal churn? The offer promised something the product delivers differently. The dashboard reports these as funnel stages. The cause sits upstream, in the offer."},
            {"type": "quote", "text": "A better funnel cannot rescue a confused offer."},
            {"type": "h2", "text": "The order of operations"},
            {"type": "p", "text": "First, the offer: what exactly does the customer get, at what price, with what risk removed? Second, the message: can a stranger repeat it back after one read? Third, only third, the funnel mechanics. Run in this order, the mechanical work gets easier, because every test is measuring a proposition that deserves to win."},
            {"type": "p", "text": "Growth teams sometimes resist this sequence because offer work feels like someone else's department. That is precisely the problem we exist to fix. It is all one business. The funnel just happens to be where the disagreements become visible."},
        ],
    },
    {
        "title": "The Problem Behind the Problem",
        "slug": "the-problem-behind-the-problem",
        "category": "Things We Noticed",
        "excerpt": "Notes from a year of diagnostics: the brief is almost never the problem. It is the symptom the company could see from where it was standing.",
        "readingTime": "4 min",
        "published": True,
        "seo": {
            "title": "The Problem Behind the Problem | hiAnzy",
            "description": "Field notes on why the first brief is usually a symptom, and how good questions find the actual gap.",
        },
        "body": [
            {"type": "p", "text": "A pattern, from a year of diagnostic work. The brief says 'we need a new website'. The problem is that sales and marketing disagree about who the customer is, and the website is where the disagreement is publicly displayed."},
            {"type": "p", "text": "The brief says 'we need help with social'. The problem is that the product has no repeat-purchase reason, so every sale must be re-won from scratch, which makes every channel look expensive."},
            {"type": "p", "text": "The brief says 'we need AI'. The problem is a spreadsheet named FINAL_v7_USE_THIS_ONE."},
            {"type": "h2", "text": "Why this keeps happening"},
            {"type": "p", "text": "Companies see their business from inside their departments, so problems get reported in the language of the nearest department. Nobody writes a brief that says 'our departments are optimising against each other'. It arrives disguised as a design request."},
            {"type": "quote", "text": "The brief can be messy. The thinking won't be."},
            {"type": "p", "text": "This is why we take messy briefs cheerfully. The mess is data. The screenshots, the half-finished decks, the 'can you just tell me what's wrong here': all of it points somewhere. Usually one or two layers behind where it hurts. You do not need every answer before you call someone. That is partly why we are here."},
        ],
    },
    {
        "title": "What Does a Business Systems Consultancy Actually Do?",
        "slug": "what-does-a-business-systems-consultancy-do",
        "category": "Business, Unpacked",
        "excerpt": "Plain answers to the questions people ask before they hire us: what the work is, what it costs in time, and when you genuinely do not need it.",
        "readingTime": "7 min",
        "published": True,
        "tags": ["business systems", "consulting", "transformation", "operating model"],
        "seo": {
            "title": "What Does a Business Systems Consultancy Do? | hiAnzy",
            "description": "A business systems consultancy diagnoses why the parts of your company work against each other, then rebuilds them as one operating system. Here is what that involves.",
        },
        "body": [
            {"type": "takeaway", "text": "A business systems consultancy finds where your strategy, brand, technology and operations contradict each other, then rebuilds them so they behave as one system. It is diagnosis first, delivery second: the opposite of an agency that starts with a deliverable."},
            {"type": "p", "text": "Most companies do not have a strategy problem, a brand problem or a technology problem. They have a joinery problem. Each department is competent and each department is optimising for something slightly different, and the gaps between them are where the money quietly leaves."},
            {"type": "h2", "text": "What the work actually looks like"},
            {"type": "p", "text": "We start by mapping what exists rather than what the org chart says exists. That means reading the numbers, walking the workflows, and following a real customer end to end. The output is not a slide deck of observations. It is a decision about what changes, what stays and what gets retired."},
            {"type": "list", "items": [
                "Audit: the numbers, the workflows and the customer's actual experience, not the idealised version.",
                "Architect: a blueprint that names owners, sequences moves and decides what happens first.",
                "Build: brand, technology, content and process built to that blueprint.",
                "Connect: the specialists the problem needs, brought in with clear accountability.",
                "Scale: measurement, iteration, and the discipline to stop doing what only looks productive.",
            ]},
            {"type": "quote", "text": "If the diagnosis is wrong, the deliverable is expensive decoration."},
            {"type": "h2", "text": "Common questions"},
            {"type": "faq", "items": [
                {"q": "How is this different from hiring an agency?", "a": "An agency starts from a deliverable you have already specified: a website, a campaign, an identity. A systems consultancy starts from the outcome and works backwards, which sometimes concludes that the deliverable you asked for is not the one you need. We will tell you that before you spend the budget."},
                {"q": "How long does a diagnostic take?", "a": "A focused business systems diagnostic typically runs two to four weeks depending on how many functions are in scope and how accessible the data is. Build phases are scoped separately, once we know what we are building and why."},
                {"q": "Do we have to replace our existing tools or team?", "a": "Usually not. Most of what we recommend is connecting and sequencing what you already own. Replacement is a last resort with a written justification, because migration costs are real and rarely budgeted honestly."},
                {"q": "When do we NOT need a consultancy?", "a": "If you have one clearly defined problem, a capable owner for it, and no cross-department dependencies, hire a specialist and skip the diagnosis. Consulting earns its fee when the problem crosses functions or nobody agrees what the problem is."},
                {"q": "What size of company is this for?", "a": "Founder-led businesses through mid-market groups. The common factor is not revenue, it is complexity: several products, channels or locations that have started to contradict each other."},
            ]},
            {"type": "p", "text": "If you recognise your company in any of the above, the useful next step is a conversation, not a proposal. Bring the brief, or bring the problem: either works."},
        ],
    },
    {
        "title": "How to Brief a Project When You Do Not Know What Is Wrong",
        "slug": "how-to-brief-a-project-when-you-dont-know-whats-wrong",
        "category": "Business, Unpacked",
        "excerpt": "A practical guide to writing a brief that gets you a correct answer rather than a fast one, including what to bring and what to leave out.",
        "readingTime": "5 min",
        "published": True,
        "tags": ["briefing", "scoping", "project management", "consulting"],
        "seo": {
            "title": "How to Write a Project Brief When the Problem Is Unclear | hiAnzy",
            "description": "You do not need a finished brief to start. Bring symptoms, numbers and constraints, and let the diagnosis define the deliverable.",
        },
        "body": [
            {"type": "takeaway", "text": "Write the brief around the symptom and the constraint, not the solution. Describe what is happening, what it costs you, and what cannot change. Naming a deliverable too early locks in an answer before anyone has checked the question."},
            {"type": "p", "text": "The most expensive briefs we receive are the confident ones. They name a deliverable, a channel and a deadline, and they are frequently solving the third-most-important problem in the business because that is the one that became visible first."},
            {"type": "h2", "text": "Bring these five things"},
            {"type": "list", "items": [
                "The symptom, described plainly: what you notice, how often, and who complains.",
                "The number attached to it: revenue, hours, churn, cost per order. Any real number beats an adjective.",
                "What you have already tried, and what happened.",
                "The constraints that genuinely cannot move: budget ceiling, compliance, a contract, a launch date.",
                "Who has to agree before anything ships.",
            ]},
            {"type": "h2", "text": "Leave these out for now"},
            {"type": "p", "text": "Leave out the proposed solution, the tool shortlist, and the competitor screenshot. Not because they are worthless, but because they anchor everyone to a conclusion before the evidence is in. Keep them; share them in the second conversation."},
            {"type": "quote", "text": "A messy brief is data. A confident wrong brief is a budget with a countdown."},
            {"type": "faq", "items": [
                {"q": "What if we genuinely only need a website?", "a": "Then we will confirm that quickly and scope it. A diagnosis that concludes 'your instinct was right' is a good outcome, not a wasted one: it converts a guess into a decision you can defend."},
                {"q": "Should we get multiple quotes first?", "a": "Get multiple conversations first. Quotes for an unspecified problem are not comparable, because each supplier is silently pricing a different assumption about what the work is."},
            ]},
        ],
    },
    {
        "title": "Writing for Humans and Answer Engines Without Wrecking Either",
        "slug": "writing-for-humans-and-answer-engines",
        "category": "Growth, With Receipts",
        "excerpt": "AI assistants now answer the question your page used to. Here is how to structure content so it gets cited, without turning your writing into keyword sludge.",
        "readingTime": "8 min",
        "published": True,
        "tags": ["SEO", "AEO", "GEO", "structured data", "content strategy", "AI search"],
        "seo": {
            "title": "SEO for AI Answer Engines: How to Get Cited | hiAnzy",
            "description": "Answer engine optimisation in practice: lead with the answer, structure for extraction, publish real schema, and keep the writing worth reading.",
        },
        "body": [
            {"type": "takeaway", "text": "To be quoted by an AI assistant, put the direct answer in the first forty words under a heading that matches the real question, keep each answer self-contained, and publish matching structured data. Everything else is ordinary good writing."},
            {"type": "p", "text": "Search stopped being a list of links and became an answer with citations. That changes the job. You are no longer only competing for a click. You are competing to be the passage a model lifts, attributes and shows to someone who may never visit your site at all."},
            {"type": "h2", "text": "Lead with the answer"},
            {"type": "p", "text": "Inverted pyramid, rediscovered. State the conclusion in the first two sentences under the heading, then earn it with detail underneath. Models extract passages, not whole pages, so a passage that only makes sense after three paragraphs of context is a passage that will not be used."},
            {"type": "h2", "text": "Make every section self-contained"},
            {"type": "list", "items": [
                "One question per heading, phrased the way a person would actually ask it.",
                "Answer immediately below the heading, in under sixty words, without pronouns that point at earlier paragraphs.",
                "Define the term once per section: a lifted passage carries no glossary with it.",
                "Use real numbers and dates. Specificity is what makes a passage quotable.",
            ]},
            {"type": "h2", "text": "Publish structured data that matches the page"},
            {"type": "p", "text": "Schema.org markup is how you hand a machine the same information the reader gets, unambiguously. FAQPage for question blocks, Article for the piece itself, BreadcrumbList for position, Organization for who is speaking. The rule that matters: the markup must describe what is genuinely on the page. Marking up content a visitor cannot see is the fastest route to losing rich results entirely."},
            {"type": "quote", "text": "Write for the person. Structure for the machine. Never let the second one edit the first."},
            {"type": "h2", "text": "What still decides it"},
            {"type": "p", "text": "Being extractable does not make you worth extracting. Models weight sources that demonstrate first-hand experience, name their evidence and are consistent with what the rest of the web already knows. Original data, honest limitations and a clear author beat volume, and always have."},
            {"type": "faq", "items": [
                {"q": "What is answer engine optimisation (AEO)?", "a": "Answer engine optimisation is structuring content so AI assistants and search summaries can extract, trust and cite it. In practice it means leading with direct answers, keeping sections self-contained, and publishing structured data that matches the visible page."},
                {"q": "Does traditional SEO still matter?", "a": "Yes. Answer engines are largely reading the same index. Crawlability, speed, internal links and genuine topical depth still determine whether you are a candidate at all. AEO is a layer on top of technical SEO, not a replacement for it."},
                {"q": "Will AI summaries reduce our traffic?", "a": "For simple informational queries, often yes. The realistic response is to shift measurement toward qualified visits and cited-brand visibility, and to publish the material an AI cannot summarise away: original data, tooling, and specifics about your own work."},
                {"q": "How long does it take to see results?", "a": "Structured data and heading changes are usually reflected within weeks of a recrawl. Being cited consistently by answer engines follows topical depth and corroboration, which realistically takes a few months of genuine publishing."},
                {"q": "Is keyword research obsolete?", "a": "No, but the unit changed. You are researching questions and the language people use to ask them, rather than exact-match phrases to repeat. The heading is where that research now shows up."},
            ]},
        ],
    },
    {
        "title": "Packages Exist Because Sequencing Is the Hard Part",
        "slug": "why-we-package-services",
        "category": "Business, Unpacked",
        "excerpt": "Why our work is grouped into stages rather than sold as a menu of services, and how to tell which stage your business is actually in.",
        "readingTime": "6 min",
        "published": True,
        "tags": ["packages", "engagement model", "product development", "scoping"],
        "seo": {
            "title": "Why hiAnzy Packages Services by Stage | hiAnzy",
            "description": "Services sold as a menu let you buy in the wrong order. Packaging by development stage makes sequence the default rather than an accident.",
        },
        "body": [
            {"type": "takeaway", "text": "Most wasted budget is not the wrong service, it is the right service bought in the wrong order. Grouping work by development stage (diagnose, define, build, connect, scale) makes sequence the default instead of something you discover late."},
            {"type": "p", "text": "A menu of services assumes the buyer already knows the diagnosis. That is a large assumption, and when it is wrong the invoice still arrives. Brand work before positioning is settled gets redone. Performance spend before the funnel converts buys expensive proof that the funnel does not convert."},
            {"type": "h2", "text": "Stage beats service"},
            {"type": "list", "items": [
                "Diagnose: you can feel that something is off but cannot name it. Buy clarity before capability.",
                "Define: the problem is named; the positioning, story and offer need to be decided and written down.",
                "Build: the decision exists and the machinery does not. Website, commerce, automation, content engine.",
                "Connect: the machinery exists but the specialists, channels and partners are not wired to it.",
                "Scale: it works; now it needs measurement, iteration and the discipline to stop what is only busy.",
            ]},
            {"type": "quote", "text": "Buying the right thing at the wrong time is still buying the wrong thing."},
            {"type": "faq", "items": [
                {"q": "Can we start at Build if we already know what we want?", "a": "Often yes. If positioning is settled, the audience is evidenced and someone owns the decision, we can scope Build directly. We will still spend a short session confirming those three things, because rebuilding later is more expensive than checking now."},
                {"q": "Are packages fixed price?", "a": "The diagnostic stage is fixed scope and fixed price because its shape is predictable. Build and Scale are scoped after the blueprint, since honest pricing needs to know what is being built."},
                {"q": "Can we combine stages?", "a": "Yes, most engagements pair two adjacent stages, and the combinations exist precisely because those pairs recur. What we avoid is running Build and Diagnose simultaneously, because the second keeps invalidating the first."},
            ]},
        ],
    },
]


PORTFOLIO_GROUPS = [
    {"category": "Brand Decks", "slug": "brand-decks", "items": [
            {"name": "Orange Owl", "url": "https://drive.google.com/file/d/1kpSxwwBxpW67WO6E7hIkxy-bgcEoW4QO/view?usp=sharing"},
            {"name": "Orange Curry", "url": "https://drive.google.com/file/d/1gJgh7lsFeZl792hgg29xyGu8ynUZToZt/view?usp=sharing"},
            {"name": "Creative Whoop", "url": "https://drive.google.com/file/d/1v9BuDcawU1vUycHnjl7KbD2ORVd45Bg9/view?usp=sharing"},
            {"name": "Better Together America", "url": "https://drive.google.com/file/d/1bBcpqfH0FTb4dvYbYS9rjamg6RmkRiVD/view?usp=sharing"},
            {"name": "Anandam", "url": "https://drive.google.com/file/d/1mHKP8OHsHt6eub4k4r4Imh5qhR1gM2qT/view?usp=sharing"},
        ]},
    {"category": "Packaging", "slug": "packaging", "items": [
            {"name": "Danbro", "url": "https://drive.google.com/drive/folders/1Vu4JZEyu6fhkYhp7WDAyGptGNN00Ll1j"},
            {"name": "Foilking", "url": "https://www.foilking.in/aluminium-foil.aspx?Id=4"},
            {"name": "Astronut", "url": "https://drive.google.com/file/d/1YCD2JHfuINC5AbbXhNObuoffoWdE4Aie/view?usp=sharing"},
            {"name": "Mr Brown", "url": "https://drive.google.com/file/d/1qORBHvNDxOOSMWBXaiVLES60Gn3GU9Z3/view?usp=sharing"},
            {"name": "Stir Branding"},
            {"name": "Tranquilli Tea", "url": "https://drive.google.com/file/d/1_Z8vHSISnYBiTNUQwNvYNngh6Km2U54b/view?usp=sharing"},
        ]},
    {"category": "Web Development", "slug": "web-development", "items": [
            {"name": "Unusual Designer Gifts", "url": "https://unusualdesignergifts.co.uk/"},
            {"name": "Daily Life Prime", "url": "https://dailylifeprime.shop/"},
            {"name": "Primo Customs", "url": "http://www.primocustoms.co.in/"},
            {"name": "Tasavur", "url": "https://tasavur.com/"},
            {"name": "DGbog", "url": "http://www.dgbog.com/"},
            {"name": "Ekdanta Taxi"},
            {"name": "Cure It Herb", "url": "http://www.cureitherb.com/"},
            {"name": "Mall of Tastes", "url": "http://www.malloftastes.com/"},
            {"name": "Samsung Teams", "url": "https://teams.samsung.net/"},
        ]},
    {"category": "E-Commerce", "slug": "e-commerce", "items": [
            {"name": "Auto Parts Sooq", "url": "https://autopartssooq.com/"},
            {"name": "Asha Cart", "url": "https://ashacart.in/"},
            {"name": "Havora Store"},
            {"name": "Mud Patch (commerce + design)", "url": "https://www.mud-patch.com/"},
        ]},
    {"category": "Motion Graphics", "slug": "motion-graphics", "items": [
            {"name": "Vesta", "url": "https://www.vesta.io/"},
            {"name": "Kotak Mutual Funds", "url": "https://f1studioz.in/demo/kotak-mutual-funds/"},
            {"name": "T20 World Cup x OREO (2D)"},
        ]},
    {"category": "Audio Production", "slug": "audio-production", "items": [
            {"name": "Hitachi", "url": "https://www.youtube.com/watch?v=3xMh7taoQAU"},
            {"name": "CliniExpert", "url": "https://www.youtube.com/watch?v=jZC52BRT1TQ"},
            {"name": "Handloom Ministry anthem - shared by the PM's office"},
            {"name": "Filter Coffee x Dice Media", "url": "https://www.youtube.com/watch?v=RqblYDZRIVg"},
        ]},
    {"category": "Social Media", "slug": "social-media", "items": [
            {"name": "Vimeo x OPPO Kolkata", "url": "https://vimeo.com/1061513773?fl=pl&fe=sh"},
            {"name": "OPPO"},
            {"name": "Realme Philippines", "url": "https://youtu.be/4oOTR3nFq20?si=DJ3OrX08z3xR-_2u"},
            {"name": "Urban Company", "url": "https://www.youtube.com/watch?v=eD1kXDLHxiI"},
            {"name": "Ajio", "url": "https://www.youtube.com/watch?v=zREhIPW8CZg"},
            {"name": "Embassy of India - France & Monaco", "url": "https://www.youtube.com/watch?v=PhtRKrzMxj0"},
            {"name": "Koovs", "url": "https://drive.google.com/file/d/1l-1nLxNkGDVem7--bjiXIePFVEq3gEYo/view"},
            {"name": "Joseph Radhik", "url": "https://www.instagram.com/reel/DBLctTltvIR/?igsh=eW05cHB6ajFjN2xs"},
            {"name": "City Cart", "url": "https://drive.google.com/file/d/1MiQBiQeocUkt0L4MkLC8cQs5327mts-6/view"},
            {"name": "Hyundai India", "url": "https://www.youtube.com/watch?v=e8NgyJHbvcg"},
            {"name": "52nd International Film Festival, Goa", "url": "https://www.youtube.com/watch?v=KkKrzfwTz_s"},
            {"name": "Mini India", "url": "https://www.youtube.com/watch?v=IYWUSwMOzU0"},
            {"name": "Whiteland Corporation", "url": "https://www.youtube.com/watch?v=SVmFIqG106c"},
            {"name": "Hippo Homes", "url": "https://www.youtube.com/watch?v=VJFuyT2cpPM"},
            {"name": "Organic India", "url": "https://www.youtube.com/watch?v=zutXIlam334"},
            {"name": "Hero MotoCorp", "url": "https://www.youtube.com/watch?v=6mgcQqkHtHM"},
            {"name": "Surya Roshni", "url": "https://www.youtube.com/watch?v=7JjIdeNMJv0"},
            {"name": "Cheesecake & Co.", "url": "https://drive.google.com/file/d/1dDuythyM1aMKTUmWFi_Z744Jn6We9KmU/view"},
            {"name": "Maharaja Whiteline", "url": "https://www.youtube.com/watch?v=8-AG13HCuvY"},
            {"name": "Soulflower", "url": "https://www.youtube.com/watch?v=8Jwl1nTvbts"},
            {"name": "Bath & Body Works", "url": "https://www.youtube.com/watch?v=A-bEj5mVtK0"},
            {"name": "Hamdard", "url": "https://www.youtube.com/watch?v=_OXj1Sj7Bno"},
            {"name": "PhonePe"},
            {"name": "Tecno Mobile", "url": "https://www.youtube.com/watch?v=dM0sNXlh8SI"},
            {"name": "Canon India", "url": "https://www.youtube.com/watch?v=r-P9zTpdhB4"},
        ]},
    {"category": "TVC & Video Production", "slug": "tvc-video-production", "items": [
            {"name": "Ashok Leyland", "url": "https://youtu.be/SHQyqV1haXg?si=59DwtvQKIf_nVgFT"},
            {"name": "BharatPe", "url": "https://www.instagram.com/bharatpe/"},
            {"name": "Armstrong Tires", "url": "https://www.instagram.com/armstrongtire/"},
            {"name": "Australian Avocados", "url": "https://www.instagram.com/australianavocados"},
            {"name": "Jotun Paints Arabia", "url": "https://www.instagram.com/jotunpaintsarabia/"},
        ]},
]


# ── The Hi Anzy Orbit ────────────────────────────────────────────────────────
# ecosystem_items is not hand-authored: it is derived from CASE_STUDIES and
# NETWORK_RESOURCES above at import time, so the Orbit shows real, already-
# verified relationships instead of a second, parallel dataset someone has to
# remember to keep in sync. Two source enums collapse into one canonical
# provenance value here (see PROVENANCE_MAP) -- case_studies.provenance and
# network_resources.relationshipType have always meant the same thing
# (who is actually accountable for the work) but were never spelled the
# same way.
#
# hiAnzy's own five core studios (relationshipType == "HI ANZY DIRECT") are
# deliberately excluded below. They are not network relationships -- they are
# hiAnzy itself -- and folding them into a "collaborator" roster would blur
# exactly the client/network line this classification exists to keep clear,
# in the opposite direction from the usual risk (making hiAnzy's own team
# read as outside talent, rather than making outside talent read as hiAnzy's
# own team).
PROVENANCE_MAP = {
    "HI ANZY": "HI_ANZY_DIRECT",
    "HI ANZY + PARTNER": "HI_ANZY_COLLABORATOR",
    "COLLABORATOR WORK": "COLLABORATOR_CREDENTIAL",
    "HI ANZY + COLLABORATOR": "HI_ANZY_COLLABORATOR",
    "COLLABORATOR CREDENTIAL": "COLLABORATOR_CREDENTIAL",
    "NETWORK ACCESS": "NETWORK_ACCESS",
}


def _ecosystem_category_for(resource: dict) -> str:
    """category is the finer-grained discipline (Strategy, Media, Venues, ...);
    the Orbit's six buckets are coarser. Creators and Venues already name
    themselves. Everything else splits on relationshipType, which is what
    actually distinguishes "we brief them directly" collaborators from
    "we can open the door to them" partners -- category alone can't: Events
    and Media both contain both kinds."""
    if resource["category"] == "Creators":
        return "creator"
    if resource["category"] == "Venues":
        return "venue"
    if resource["relationshipType"] in ("HI ANZY + COLLABORATOR", "COLLABORATOR CREDENTIAL"):
        return "collaborator"
    return "partner"  # NETWORK ACCESS, once Creators/Venues/collaborator are ruled out


def _build_ecosystem_items() -> list:
    items = []

    for i, cs in enumerate(CASE_STUDIES):
        items.append({
            "id": cs["slug"],
            "slug": cs["slug"],
            "name": cs["title"],
            "category": "built_here" if cs["provenance"] == "HI ANZY" else "built_together",
            "relationshipType": cs["provenance"],
            "title": cs["title"],
            "shortDescription": cs["summary"],
            "longDescription": cs["situation"],
            "image": None,
            "gallery": [],
            "capabilities": cs["services"],
            "geography": [],
            "links": [],
            "featured": cs["featured"],
            "publicStatus": "public" if cs["published"] else "draft",
            "lastVerified": cs["year"],
            "provenance": PROVENANCE_MAP[cs["provenance"]],
            "sortOrder": (0 if cs["featured"] else 1, i),
        })

    for i, r in enumerate(NETWORK_RESOURCES):
        if r["relationshipType"] == "HI ANZY DIRECT":
            continue  # hiAnzy's own studios -- see module docstring above
        items.append({
            "id": r["slug"],
            "slug": r["slug"],
            "name": r["name"],
            "category": _ecosystem_category_for(r),
            "relationshipType": r["relationshipType"],
            "title": r["name"],
            "shortDescription": r["note"],
            "longDescription": None,
            "image": None,
            "gallery": [],
            "capabilities": r["capabilities"],
            "geography": [r["geography"]] if r.get("geography") else [],
            "links": [r["portfolioUrl"]] if r.get("portfolioUrl") else [],
            "featured": r["featured"],
            "publicStatus": r["publicStatus"],
            "lastVerified": r["lastVerified"],
            "provenance": PROVENANCE_MAP[r["relationshipType"]],
            "sortOrder": (0 if r["featured"] else 1, i),
        })

    # sortOrder was a (featured, original-position) tuple purely to compute a
    # stable order without a second pass; flatten it to the plain int the
    # schema promises before this is ever seeded.
    items.sort(key=lambda d: d["sortOrder"])
    for rank, item in enumerate(items):
        item["sortOrder"] = rank
    return items


ECOSYSTEM_ITEMS = _build_ecosystem_items()
