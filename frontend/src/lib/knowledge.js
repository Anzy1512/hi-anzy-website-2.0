import { INSIGHT_TOPICS, ORBIT_CATEGORIES } from "@/data/content";

/**
 * The knowledge layer over /api/insights.
 *
 * Every article carries `format` ("knowledge" for encyclopedia entries,
 * "note" for the shorter editorial pieces), a `topics` set from the controlled
 * vocabulary in content.js, and a `related` graph naming the services,
 * disciplines, case studies, network rosters and other articles it connects
 * to. That graph lives once, in the API, and every hub page derives its links
 * from it here rather than keeping a second copy.
 */
export const isKnowledge = (post) => post?.format === "knowledge";

const FORMAT_LABEL = { knowledge: "KNOWLEDGE", note: "NOTE" };
export const formatLabel = (post) => FORMAT_LABEL[post?.format] || FORMAT_LABEL.note;

export const topicMeta = (name) => INSIGHT_TOPICS.find((t) => t.name === name) || null;
export const topicHref = (name) => `/insights?topic=${encodeURIComponent(name)}`;
export const categoryHref = (name) => `/insights?category=${encodeURIComponent(name)}`;

export const networkRosterMeta = (key) => ORBIT_CATEGORIES.find((c) => c.key === key) || null;

/** Articles whose related.<kind> names this slug. kind: services | disciplines | work | network */
export const relatedInsightsFor = (kind, slug, insights = []) =>
  insights
    .filter((p) => Array.isArray(p.related?.[kind]) && p.related[kind].includes(slug))
    // Encyclopedia entries first: they explain the thing; notes react to it.
    .sort((a, b) => Number(isKnowledge(b)) - Number(isKnowledge(a)));

export const bySlug = (insights = []) => Object.fromEntries(insights.map((p) => [p.slug, p]));

export const countByTopic = (insights = []) =>
  insights.reduce((acc, p) => {
    (p.topics || []).forEach((t) => { acc[t] = (acc[t] || 0) + 1; });
    return acc;
  }, {});

export const filterInsights = (insights = [], { category, topic } = {}) =>
  insights.filter((p) => (!category || p.category === category) && (!topic || (p.topics || []).includes(topic)));
