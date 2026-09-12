import {
  NAV_LINKS,
  FOOTER_LINKS,
  CATEGORIES,
  NETWORK_SUBCATS,
} from "@/data/content";

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
  for (const item of COMMAND_INDEX) {
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
