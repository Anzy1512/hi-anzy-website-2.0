/**
 * Writes public/sitemap.xml, and points robots.txt at it.
 *
 * Without this a crawler asking for /sitemap.xml gets index.html back, because
 * the SPA history fallback answers every unmatched path with the shell. A 200
 * of HTML where XML was expected is worse than a 404: it looks like a sitemap
 * that parses to nothing.
 *
 * Static routes and the slug-driven ones (services, disciplines) come from the
 * source files, so they are correct with no server running. Insights and case
 * studies live in the database, so they are fetched when the API is reachable
 * and simply omitted when it is not — a sitemap missing its blog is a smaller
 * problem than a build that fails because a dev database was asleep.
 *
 *   node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const SITE = (process.env.SITE_URL || "https://hianzy.com").replace(/\/+$/, "");
const API = (process.env.REACT_APP_BACKEND_URL || process.env.LOCAL_API_URL || "http://127.0.0.1:8111").replace(/\/+$/, "");

const STATIC_ROUTES = [
  ["/", 1.0, "weekly"],
  ["/what-we-do", 0.9, "monthly"],
  ["/how-we-work", 0.8, "monthly"],
  ["/work", 0.9, "weekly"],
  ["/work/built-here", 0.6, "monthly"],
  ["/work/built-together", 0.6, "monthly"],
  ["/network", 0.8, "monthly"],
  ["/network/collaborators", 0.6, "monthly"],
  ["/network/artists-creators", 0.6, "monthly"],
  ["/network/venue-partners", 0.6, "monthly"],
  ["/network/partners", 0.6, "monthly"],
  ["/why-hi-anzy", 0.6, "yearly"],
  ["/insights", 0.9, "weekly"],
  ["/who-we-work-with", 0.6, "monthly"],
  ["/collaborate", 0.6, "monthly"],
  ["/careers", 0.5, "monthly"],
  ["/resources", 0.6, "monthly"],
  ["/contact", 0.7, "yearly"],
  ["/coming-soon", 0.5, "monthly"],
];

/** Pull `slug: "…"` out of a data module without needing to evaluate it. */
const slugsFrom = (relPath) => {
  const file = path.join(ROOT, relPath);
  if (!fs.existsSync(file)) return [];
  const src = fs.readFileSync(file, "utf8");
  const out = [];
  const re = /\bslug:\s*"([a-z0-9-]+)"/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return [...new Set(out)];
};

const getJson = (url) =>
  new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 4000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });

const validRecords = (items) => Array.isArray(items) && items.every(item => item && typeof item.slug === "string" && /^[a-z0-9-]+$/.test(item.slug));

const xmlEscape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_ROUTES.map(([loc, priority, changefreq]) => ({ loc, priority, changefreq }));

  const services = slugsFrom("src/data/content.js");
  services.forEach((s) => urls.push({ loc: `/what-we-do/${s}`, priority: 0.8, changefreq: "monthly" }));

  const disciplines = slugsFrom("src/data/disciplines.js");
  disciplines.forEach((s) => urls.push({ loc: `/network/${s}`, priority: 0.7, changefreq: "monthly" }));

  const insights = await getJson(`${API}/api/insights`);
  let insightCount = 0;
  if (validRecords(insights)) {
    insights.forEach((i) => {
      if (!i || !i.slug) return;
      urls.push({ loc: `/insights/${i.slug}`, priority: 0.7, changefreq: "monthly" });
      insightCount += 1;
    });
  }

  const cases = await getJson(`${API}/api/case-studies`);
  let caseCount = 0;
  if (validRecords(cases)) {
    cases.forEach((c) => {
      if (!c || !c.slug) return;
      urls.push({ loc: `/work/${c.slug}`, priority: 0.7, changefreq: "monthly" });
      caseCount += 1;
    });
  }

  // de-duplicate, keeping the highest priority seen for a path
  const byLoc = new Map();
  urls.forEach((u) => {
    const prev = byLoc.get(u.loc);
    if (!prev || u.priority > prev.priority) byLoc.set(u.loc, u);
  });
  const final = [...byLoc.values()].sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    final
      .map(
        (u) =>
          "  <url>\n" +
          `    <loc>${xmlEscape(SITE + u.loc)}</loc>\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority.toFixed(1)}</priority>\n` +
          "  </url>"
      )
      .join("\n") +
    "\n</urlset>\n";

  const out = path.join(ROOT, "public", "sitemap.xml");

  // Recover only the route families whose endpoint failed. A successful empty
  // array is authoritative and must remove stale URLs for that family.
  const failedFamilies = [
    !validRecords(insights) && "/insights/",
    !validRecords(cases) && "/work/",
  ].filter(Boolean);
  let outputXml = xml;
  if (failedFamilies.length && fs.existsSync(out)) {
    const previous = fs.readFileSync(out, "utf8");
    const preserved = [];
    for (const block of previous.match(/<url>[\s\S]*?<\/url>/g) || []) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      if (!loc) continue;
      const route = new URL(loc.replace(/&amp;/g, "&")).pathname;
      if (!failedFamilies.some(prefix => route.startsWith(prefix)) || byLoc.has(route)) continue;
      preserved.push(block.replace(/<loc>[^<]+<\/loc>/, `<loc>${xmlEscape(SITE + route)}</loc>`));
    }
    outputXml = xml.replace("</urlset>", preserved.join("\n") + "\n</urlset>");
    console.log(`sitemap: preserved ${preserved.length} paths from unavailable content endpoints`);
  }
  if (failedFamilies.length && !fs.existsSync(out)) {
    throw new Error("Cannot generate a complete sitemap: content API unavailable and no previous sitemap exists");
  }
  fs.writeFileSync(out, outputXml, "utf8");

  // robots.txt should name the sitemap; add it once, keep it current
  const robotsPath = path.join(ROOT, "public", "robots.txt");
  if (fs.existsSync(robotsPath)) {
    let robots = fs.readFileSync(robotsPath, "utf8");
    const line = `Sitemap: ${SITE}/sitemap.xml`;
    if (/^Sitemap:.*$/m.test(robots)) {
      robots = robots.replace(/^Sitemap:.*$/m, line);
    } else {
      robots = robots.replace(/\s*$/, "\n\n" + line + "\n");
    }
    fs.writeFileSync(robotsPath, robots, "utf8");
  }

  console.log(
    `sitemap: ${final.length} urls ` +
      `(${STATIC_ROUTES.length} static, ${services.length} services, ${disciplines.length} disciplines, ` +
      `${insightCount} insights, ${caseCount} cases)` +
      (insightCount + caseCount === 0 ? "  [API unreachable — database-backed pages omitted]" : "")
  );
})();
