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
  if (Array.isArray(insights)) {
    insights.forEach((i) => {
      if (!i || !i.slug) return;
      urls.push({ loc: `/insights/${i.slug}`, priority: 0.7, changefreq: "monthly" });
      insightCount += 1;
    });
  }

  const cases = await getJson(`${API}/api/case-studies`);
  let caseCount = 0;
  if (Array.isArray(cases)) {
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

  /**
   * If the API was unreachable, this run produced a sitemap missing every
   * database-backed page. Overwriting a fuller one with it would quietly shrink
   * the site's coverage — which is exactly what happened building inside a
   * container, where localhost is the container's own loopback and nothing is
   * listening on it. A partial sitemap is fine to create; it is not fine to
   * write over a complete one.
   */
  const apiReachable = insightCount + caseCount > 0;
  let wroteExisting = false;
  if (!apiReachable && fs.existsSync(out)) {
    const existing = fs.readFileSync(out, "utf8");
    const existingCount = (existing.match(/<loc>/g) || []).length;
    if (existingCount > final.length) {
      /**
       * Coverage from the old file is worth keeping; its domain is not. The
       * file on disk was written by whatever SITE_URL that earlier run had —
       * almost always the real production domain, since a container build is
       * exactly the situation with no API to reach. Writing it back unchanged inside a
       * container built for a different origin (say http://localhost:8080)
       * would ship a sitemap that correctly lists every page and incorrectly
       * tells every one of them apart from where they actually are. Every
       * <loc> is re-based onto this run's SITE, and lastmod is not touched —
       * these paths were not actually re-verified today.
       */
      const rebased = existing.replace(
        /<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g,
        (m, pathPart) => `<loc>${xmlEscape(SITE + pathPart)}</loc>`
      );
      fs.writeFileSync(out, rebased, "utf8");
      wroteExisting = true;
      console.log(
        `sitemap: kept the existing ${existingCount} urls, re-based onto ${SITE} — ` +
          `this run reached no API and would have written only ${final.length}`
      );
    }
  }

  if (!wroteExisting) fs.writeFileSync(out, xml, "utf8");

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
