/**
 * The sixteen disciplines, written to be read rather than scanned.
 *
 * Voice note: second person, plain words, a little wordplay — the register the
 * rest of the site already uses ("we take the brief seriously, ourselves
 * slightly less"). Warm and quick, but never cute at the expense of being
 * useful: people arrive here deciding whether to spend money, and a joke that
 * costs them clarity is a joke that costs us the brief.
 *
 * `signal` lines are deliberately written as symptoms, not services. Nobody
 * wakes up wanting "positioning" — they wake up irritated that the same
 * question keeps coming up on every sales call.
 */

export const DISCIPLINES = [
  {
    slug: "strategy",
    name: "Strategy",
    category: "Strategy",
    hook: "Everyone has a plan until the quarterly review.",
    lede:
      "Strategy is not the deck. It is the small number of decisions that make every later decision easier, and the honesty to write down what you are choosing not to do.",
    body: [
      "Most companies do not lack ideas. They lack a way to rank them. So the loudest meeting wins, the roadmap grows sideways, and by Q3 nobody can explain why half the work exists.",
      "We start by mapping what is actually happening: the numbers, the workflow, the customer's real route through your business. Then we name the one or two constraints everything else is bending around. Fix the constraint and a surprising amount of the backlog quietly stops mattering.",
    ],
    signals: [
      "Two departments are optimising for numbers that contradict each other.",
      "You have a roadmap, but nobody can say what it is trying to prove.",
      "Every new idea sounds reasonable, which is exactly the problem.",
    ],
    outcome: "A named constraint, a sequenced plan, and permission to stop doing three things.",
    pairs: ["brand", "performance", "operations"],
  },
  {
    slug: "brand",
    name: "Brand",
    category: "Brand",
    hook: "You are not forgettable. You are unrepeatable.",
    lede:
      "If a happy customer cannot describe you to a friend without opening your website, you do not have a brand problem. You have a sentence problem.",
    body: [
      "Brand is the shortest accurate story about why you exist and who you are for. It is not the logo, though the logo will get blamed. It is what survives being repeated by someone who does not work for you.",
      "We settle the position first, then build the story, the tone and the identity on top of it. In that order, because a beautiful identity fixed to a vague position just makes the vagueness better looking.",
    ],
    signals: [
      "Sales explains the company differently on every call.",
      "You keep losing to a competitor who is objectively worse.",
      "Your last rebrand changed how you looked and nothing else.",
    ],
    outcome: "A story your team, your site and your investors tell the same way.",
    pairs: ["design", "pr", "strategy"],
  },
  {
    slug: "design",
    name: "Design",
    category: "Design",
    hook: "Taste is not the point. Comprehension is.",
    lede:
      "Good design is mostly good decisions made visible. It reduces the number of questions a person has to ask before they act.",
    body: [
      "Every extra second someone spends working out what a screen wants from them is a second of goodwill spent. Design earns that back through hierarchy, rhythm and the discipline to leave things out.",
      "We build systems rather than one-off screens: type scales, spacing rules, components that behave the same way twice. Consistency is not aesthetic conservatism. It is how people learn an interface without being taught.",
    ],
    signals: [
      "Every new page is a small argument about how it should look.",
      "Your product is capable and your users still ask how to do the basics.",
      "The design file and the live site parted ways months ago.",
    ],
    outcome: "A design system that makes the next screen faster than the last one.",
    pairs: ["technology", "brand", "experiences"],
  },
  {
    slug: "technology",
    name: "Technology",
    category: "Technology",
    hook: "Technology should remove friction, not create a new channel to discuss it.",
    lede:
      "The stack is not the strategy. It is the plumbing that decides whether the strategy survives contact with a Tuesday.",
    body: [
      "Most technology problems we meet are integration problems wearing a technology costume. The website is fine, the CRM is fine, the analytics are fine, and none of them are speaking, so someone in operations is quietly retyping data at 9pm.",
      "We build and connect: commerce, sites, CRM, dashboards, hosting. Preference is always to wire what you already own before buying something new, because migrations cost more than anyone budgets for.",
    ],
    signals: [
      "Someone maintains a spreadsheet that the software was supposed to replace.",
      "Two systems disagree about the same customer.",
      "Shipping a small change requires a meeting about who owns the change.",
    ],
    outcome: "Systems that talk to each other, and a written map of how.",
    pairs: ["automation", "ai", "design"],
  },
  {
    slug: "ai",
    name: "AI",
    category: "AI",
    hook: "The problem is rarely that you need AI. It is usually a spreadsheet called FINAL_v7.",
    lede:
      "AI is very good at tasks that are already well defined. It is spectacularly bad at inventing definitions you never wrote down.",
    body: [
      "We start with a readiness audit, because the honest answer is often that the data is not clean enough yet, and knowing that is cheaper than discovering it three months into a build.",
      "Where it does fit, it fits properly: assistants that answer from your own material, agents that do the repetitive middle of a process, and evaluation so you can tell whether the thing is actually working or merely confident.",
    ],
    signals: [
      "Someone senior said 'we need AI' before anyone said what for.",
      "Your team retypes the same answer to customers forty times a week.",
      "You have data, but no one trusts it enough to automate on top of it.",
    ],
    outcome: "A clear yes, no or not-yet, with the reasoning written down.",
    pairs: ["automation", "technology", "operations"],
  },
  {
    slug: "automation",
    name: "Automation",
    category: "Automation",
    hook: "Process is just kindness to your future self.",
    lede:
      "Automation is not about removing people. It is about removing the parts of the job nobody would miss.",
    body: [
      "Every business accumulates small manual rituals: the copy-paste, the weekly export, the message someone sends to remind someone else. Individually trivial. Collectively, a part-time job.",
      "We map the ritual, decide whether it should exist at all, and only then automate what survives. Automating a process nobody needed just makes the waste faster.",
    ],
    signals: [
      "The same information gets entered twice, by two people, on purpose.",
      "A key process lives entirely in one person's head or inbox.",
      "Your team's busiest hour is admin, not the work you sell.",
    ],
    outcome: "Hours back, and a process that survives someone taking leave.",
    pairs: ["technology", "ai", "operations"],
  },
  {
    slug: "performance",
    name: "Performance",
    category: "Performance",
    hook: "Attention is rentable. Trust compounds.",
    lede:
      "Paid media is an amplifier. Point it at a clear offer and it multiplies; point it at a confused one and it multiplies that instead.",
    body: [
      "We do not start with the ad account. We start with what happens after the click, because a better funnel cannot rescue an offer people do not understand.",
      "Then: channel selection, creative built to be tested, funnel design, conversion work, and measurement honest enough to tell you when to stop spending.",
    ],
    signals: [
      "Costs climb every quarter and the story is always 'the platform changed'.",
      "Traffic is healthy. Revenue is unmoved.",
      "Nobody can say what a customer is actually worth.",
    ],
    outcome: "Spend that maps to revenue, and a written reason for every channel.",
    pairs: ["strategy", "brand", "media"],
  },
  {
    slug: "media",
    name: "Media",
    category: "Media",
    hook: "A good idea should travel further than your own feed.",
    lede:
      "Owned media is what you control. Earned media is what you deserve. The gap between them is usually a story problem.",
    body: [
      "We work across national broadcast and print, entertainment desks, category verticals and international business press, not as a spray of releases, but matched to whoever actually covers your kind of news.",
      "Placement without a story is advertising with extra steps. We settle what is genuinely newsworthy first, then take it to the desks it belongs to.",
    ],
    signals: [
      "Your funding round got less coverage than a competitor's redesign.",
      "You are known in your category and invisible outside it.",
      "Press happens to you rather than being planned.",
    ],
    outcome: "Coverage in places your buyers already read.",
    pairs: ["pr", "creators", "performance"],
  },
  {
    slug: "creators",
    name: "Creators",
    category: "Creators",
    hook: "Borrowed trust still has to be paid back with something true.",
    lede:
      "Audiences forgive a lot. Being sold to by someone who obviously has not used the product is not on the list.",
    body: [
      "We match by fit rather than follower count: singers, comedians, sketch artists, podcasters, vloggers, voice artists. Then we brief them properly, which mostly means telling them what is true and letting them say it their way.",
      "The creator economy runs on a fragile currency: a creator's own credibility. Spend it carelessly on their audience and it does not come back, for them or for you.",
    ],
    signals: [
      "Your last influencer campaign read like a press release with a face.",
      "Reach was enormous and nothing measurable happened.",
      "You are picking creators from a spreadsheet of follower counts.",
    ],
    outcome: "Collaborations that survive the comments section.",
    pairs: ["production", "media", "experiences"],
  },
  {
    slug: "production",
    name: "Production",
    category: "Production",
    hook: "The final screen is nice. The thinking that made it useful is nicer.",
    lede:
      "Production is where the idea stops being an argument and starts being a thing that exists.",
    body: [
      "TVCs, brand films, product photography, motion graphics, sound design, post, run as one line production so the schedule, the vendors and the talent are somebody's actual job rather than everybody's side quest.",
      "Most production overruns are not creative problems. They are coordination problems that were visible on day two and discussed on day twenty.",
    ],
    signals: [
      "The shoot happened and the edit is now three weeks past due.",
      "You are managing five vendors who have never spoken to each other.",
      "The asset list grew after the budget was locked.",
    ],
    outcome: "Delivered assets, on the date you were given at the start.",
    pairs: ["creators", "design", "events"],
  },
  {
    slug: "events",
    name: "Events",
    category: "Events",
    hook: "A room full of the right people beats a timeline full of the wrong ones.",
    lede:
      "Events are the one channel where your audience gives you their whole attention. That is rare enough to be worth planning properly.",
    body: [
      "Festivals, campus circuits, launches, co-branded stages, chosen for who is in the room rather than how big the room is.",
      "The measure of an event is not footfall. It is what people did the week after, which means the follow-up has to be designed before the doors open, not improvised once everyone has gone home.",
    ],
    signals: [
      "Last year's activation looked wonderful and produced nothing you can name.",
      "You are being sold sponsorship by reach, not by relevance.",
      "Nobody owns what happens after the event ends.",
    ],
    outcome: "A moment with a follow-up attached.",
    pairs: ["venues", "experiences", "production"],
  },
  {
    slug: "venues",
    name: "Venues",
    category: "Venues",
    hook: "Where it happens is part of what it says.",
    lede:
      "Context is a design material. The same launch reads differently in a hotel ballroom, a club and a stadium, and your audience reads it before anyone speaks.",
    body: [
      "Access across hotels and hospitality, clubs and nightlife, stadiums and auditoriums, and institutional venues, with the relationships to hold a date rather than hope for one.",
      "We pick for what the room does to the story. Sometimes the honest answer is a smaller venue that feels full instead of a bigger one that feels borrowed.",
    ],
    signals: [
      "The venue was booked before anyone decided what the event was for.",
      "You need a date in a place that does not usually give dates.",
      "The space fought the brand and the space won.",
    ],
    outcome: "The right room, held, with the logistics handled.",
    pairs: ["events", "experiences", "operations"],
  },
  {
    slug: "experiences",
    name: "Experiences",
    category: "Experiences",
    hook: "People remember what they did. They forget what they were shown.",
    lede:
      "An experience is a brand you can walk into. It is also the fastest way to find out whether your story survives contact with a stranger.",
    body: [
      "Pop-up tours, stage design, booth branding, merchandise, built so the thing a person touches says the same thing your website does.",
      "The bar is simple and unforgiving: would someone photograph this without being asked? If not, it is decoration, and decoration does not travel.",
    ],
    signals: [
      "Your booth looked like everyone else's booth.",
      "The merch is branded but nobody would wear it unprompted.",
      "The physical and digital brand feel like cousins, not siblings.",
    ],
    outcome: "Something people photograph without being asked.",
    pairs: ["events", "venues", "design"],
  },
  {
    slug: "pr",
    name: "PR",
    category: "PR",
    hook: "Reputation is what happens while you are busy shipping.",
    lede:
      "You cannot control the conversation. You can be early to it, honest in it, and easy to quote.",
    body: [
      "Media placement, online reputation management, sentiment tracking and crisis communications, set up before you need them, because the worst time to write a crisis playbook is during a crisis.",
      "Most reputational damage is not caused by the original problem. It is caused by the silence that follows it while everyone decides who is allowed to speak.",
    ],
    signals: [
      "Your first-page search results are three years old.",
      "Reviews are drifting and nobody owns replying.",
      "If something broke tonight, you do not know who speaks first.",
    ],
    outcome: "A reputation you maintain rather than defend.",
    pairs: ["media", "brand", "security"],
  },
  {
    slug: "security",
    name: "Security",
    category: "Security",
    hook: "Growth is exciting until the weak systems introduce themselves.",
    lede:
      "Security is not a feature you add. It is a set of decisions you either made early or explain later.",
    body: [
      "Platform and commerce audits, privacy readiness, fraud prevention, infrastructure hardening and incident response, sized to the business you actually are, not the enterprise a template imagines.",
      "The commercial argument is simple: customers forgive an outage. They do not forgive finding out their data was casually held.",
    ],
    signals: [
      "You take payments and have never had the stack looked at.",
      "Nobody can say who has admin access, exactly.",
      "Privacy compliance is a document, not a practice.",
    ],
    outcome: "A findings report, a fix list, and a plan for the bad day.",
    pairs: ["technology", "operations", "pr"],
  },
  {
    slug: "operations",
    name: "Operations",
    category: "Operations",
    hook: "The unglamorous layer where margin quietly lives or dies.",
    lede:
      "Operations is what turns a promise into a delivery, repeatedly, without heroics.",
    body: [
      "Fulfilment, warehousing, returns, merch production, event ops and logistics, including the reverse flows most plans forget until the first refund request.",
      "Marketing can create demand faster than operations can absorb it. When that happens the campaign gets blamed, the reviews get worse, and the actual fault is three steps downstream.",
    ],
    signals: [
      "Your best sales week produced your worst review week.",
      "Returns are handled by whoever notices the email first.",
      "Stock decisions are made on instinct and regretted seasonally.",
    ],
    outcome: "Delivery that keeps its promises at volume.",
    pairs: ["technology", "automation", "events"],
  },
];

export const DISCIPLINE_BY_SLUG = Object.fromEntries(DISCIPLINES.map((d) => [d.slug, d]));
export const DISCIPLINE_BY_CATEGORY = Object.fromEntries(DISCIPLINES.map((d) => [d.category, d]));
