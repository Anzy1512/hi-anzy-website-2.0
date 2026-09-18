import {
  NAV_LINKS,
  FOOTER_LINKS,
  CATEGORIES,
  NETWORK_SUBCATS,
} from "@/data/content";
import { getCaseStudies, getInsights, getEcosystem } from "@/lib/api";

/**
 * Everything the command palette can find, built once at module load.
 *
 * All of it already exists in content.js — 49 routes, six systems, 175 named
 * services, sixteen disciplines. None of that was reachable except by knowing
 * where to look: the 175 services in particular were locked inside a package
 * builder widget with no URLs and no way to search them. Indexing what is
 * already written is the cheapest useful thing this site can do.
 *
 * A service is not its own page, so it resolves to the service page that
 * contains it — the palette answers "where does 'Pain point extraction' live"
 * rather than pretending each of 175 lines is a destination.
 *
 * Case studies, insights and ecosystem entries live in Mongo, not content.js,
 * so they can't join this at module load the way the static data above does
 * — searching "the storefront" or an article title returned nothing, even
 * though both are real, published pages. See loadDynamicIndex below.
 */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const STATIC_PAGES = [
  ...NAV_LINKS.map((l) => ({ label: l.label, to: l.to })),
  ...FOOTER_LINKS.map((l) => ({ label: l.label, to: l.to })),
  { label: "Say Hi", to: "/contact" },
];

const build = () => {
  const items = [];
  const seen = new Set();
  const push = (it) => {
    const key = `${it.kind}:${it.to}:${it.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(it);
  };

  STATIC_PAGES.forEach((p) =>
    push({ kind: "page", group: "Pages", label: p.label, to: p.to, hint: p.to })
  );

  CATEGORIES.forEach((c) => {
    push({
      kind: "service",
      group: "Systems",
      label: c.title,
      to: `/what-we-do/${c.slug}`,
      hint: c.label,
      // the copy is searchable too, so a plain-English problem finds the system
      body: `${c.label} ${c.copy || ""} ${(c.capabilities || []).join(" ")}`,
    });

    (c.services || []).forEach((name) =>
      push({
        kind: "capability",
        group: "Services",
        label: name,
        to: `/what-we-do/${c.slug}`,
        hint: c.title,
      })
    );
  });

  Object.keys(NETWORK_SUBCATS || {}).forEach((d) => {
    push({
      kind: "discipline",
      group: "Network",
      label: d,
      to: `/network/${slugify(d)}`,
      hint: "Discipline",
      body: (NETWORK_SUBCATS[d] || []).join(" "),
    });
  });

  return items;
};

export const COMMAND_INDEX = build();

// built_here/built_together deliberately excluded: those ecosystem entries
// are the same 5 case studies already indexed above with their own real
// /work/:slug page. Indexing them again here would just repeat each title
// pointing at the shared /work/built-here or /work/built-together category
// listing instead of its actual detail page — noise, not a new destination.
const ECOSYSTEM_ROUTES = {
  collaborator: "/network/collaborators",
  creator: "/network/artists-creators",
  venue: "/network/venue-partners",
  partner: "/network/partners",
};

let dynamicItems = [];
let dynamicPromise = null;

/**
 * Fetches case studies, insights and ecosystem entries once and merges them
 * into search. Cheap — three small GETs, ~50 rows combined — and the palette
 * already shows "Preparing search…" while its own chunk loads, so the first
 * open absorbs this wait rather than adding a new one. Failures are silent
 * per source: a down endpoint means that source is just missing from
 * results, not a broken search.
 */
export const loadDynamicIndex = () => {
  if (dynamicPromise) return dynamicPromise;
  dynamicPromise = Promise.allSettled([getCaseStudies(), getInsights(), getEcosystem()]).then(
    ([cases, insights, ecosystem]) => {
      const items = [];
      if (cases.status === "fulfilled") {
        cases.value.forEach((cs) =>
          items.push({
            kind: "case-study",
            group: "Work",
            label: cs.title,
            to: `/work/${cs.slug}`,
            hint: cs.client || cs.industry,
            body: `${cs.industry || ""} ${cs.summary || ""} ${cs.gap || ""} ${cs.result || ""}`,
          })
        );
      }
      if (insights.status === "fulfilled") {
        insights.value.forEach((post) =>
          items.push({
            kind: "insight",
            group: "Insights",
            label: post.title,
            to: `/insights/${post.slug}`,
            hint: post.category,
            body: `${post.category || ""} ${post.excerpt || ""}`,
          })
        );
      }
      if (ecosystem.status === "fulfilled") {
        ecosystem.value.forEach((item) => {
          const to = ECOSYSTEM_ROUTES[item.category];
          if (!to) return;
          items.push({
            kind: "ecosystem",
            group: "Network",
            label: item.name,
            to,
            hint: item.relationshipType,
            body: item.shortDescription || "",
          });
        });
      }
      dynamicItems = items;
      return dynamicItems;
    }
  );
  return dynamicPromise;
};

/**
 * Ranked substring match. Deliberately not fuzzy: a consultancy's service list
 * is full of near-identical phrases ("Brand audit", "Business audit"), and a
 * fuzzy matcher reorders those unpredictably. Exact-prefix beats word-start
 * beats contains, which is predictable enough to trust.
 */
export const searchCommands = (query, limit = 24) => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return COMMAND_INDEX.filter((i) => i.kind === "page").slice(0, 8);
  }

  const scored = [];
  for (const item of [...COMMAND_INDEX, ...dynamicItems]) {
    const label = item.label.toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) score = 60;
    else if (label.includes(q)) score = 40;
    else if (item.body && item.body.toLowerCase().includes(q)) score = 20;
    if (!score) continue;
    // pages and systems outrank the long tail of individual service lines
    if (item.kind === "page") score += 8;
    if (item.kind === "service") score += 6;
    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.item.label.length - b.item.label.length);
  return scored.slice(0, limit).map((s) => s.item);
};
