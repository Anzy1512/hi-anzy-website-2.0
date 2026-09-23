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
 * studies live in the database: they are fetched when the API is reachable,
 * taken from the checked-in public content snapshot when it is not, and as a
 * last resort carried over from the previous sitemap. A sitemap missing its
 * blog is a smaller problem than a build that fails because a dev database
 * was asleep.
 *
 * lastmod is stable. Every URL carries a fingerprint of what defines its
 * content: the source files behind a route written in code (the page module
 * and every data module it imports), or the public record (slug, title,
 * summary or excerpt, seo) behind one that lives in the database. The
 * fingerprint and the date it last changed are remembered in
 * scripts/sitemap-lastmod.json, which is committed. A build moves lastmod only
 * for a page whose fingerprint moved. Before this, every build stamped today
 * on every URL, which told crawlers the whole site changed whenever anything
 * was deployed. A route seen for the first time takes the date of the last
 * commit that touched its sources when git is available, otherwise today.
 *
 *   node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(ROOT, ".env"), quiet: true });
const SITE = (process.env.SITE_URL || "https://hianzy.com").replace(/\/+$/, "");
const API = (process.env.REACT_APP_BACKEND_URL || process.env.LOCAL_API_URL || "http://127.0.0.1:8111").replace(/\/+$/, "");
const SNAPSHOT = path.join(__dirname, "content-snapshot.json");
const MANIFEST = path.join(__dirname, "sitemap-lastmod.json");

// [route, priority, changefreq, page sources, database family folded into the fingerprint]
// Sources are the page module(s); the data modules they import are found
// automatically. A directory means every file under it.
// The nine routes absorbed into their hubs (docs/IA_CONSOLIDATION_AUDIT.md) are
// permanent redirects (LEGACY_ROUTES in src/data/content.js), so they are not
// listed; the hubs' own entries carry their meaning and move their lastmod.
const STATIC_ROUTES = [
  ["/", 1.0, "weekly", ["src/pages/Home.js", "src/pages/home"]],
  ["/what-we-do", 0.9, "monthly", ["src/pages/WhatWeDo.js"]],
  ["/how-we-work", 0.8, "monthly", ["src/pages/HowWeWork.js"]],
  ["/work", 0.9, "weekly", ["src/pages/Work.js", "src/components/OrbitSection.js"], "cases"],
  ["/network", 0.8, "monthly", ["src/pages/Network.js"]],
  ["/why-hi-anzy", 0.6, "yearly", ["src/pages/WhyHiAnzy.js"]],
  ["/insights", 0.9, "weekly", ["src/pages/Insights.js"], "insights"],
  ["/resources", 0.6, "monthly", ["src/pages/Resources.js"]],
  ["/contact", 0.7, "yearly", ["src/pages/Contact.js"]],
  ["/coming-soon", 0.5, "monthly", ["src/pages/ComingSoon.js"]],
];
const SERVICE_SOURCES = ["src/pages/ServiceDetail.js"];
const DISCIPLINE_SOURCES = ["src/pages/Discipline.js"];
// The public fields a record's page is made of. The same keys exist in the API
// response and in the content snapshot, so a build that falls back to the
// snapshot computes the same fingerprint as one that reached the API.
const INSIGHT_KEYS = ["slug", "title", "excerpt", "seo"];
const CASE_KEYS = ["slug", "title", "summary"];

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

const sha = (input) => crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);

/** JSON with object keys sorted, so the same record always hashes the same. */
const canon = (value) =>
  JSON.stringify(value, (key, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, k) => ((o[k] = v[k]), o), {}) : v
  );

/** Files under a path, as posix-style paths relative to ROOT (same on every OS). */
const listFiles = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isDirectory()) return fs.readdirSync(abs).sort().flatMap((name) => listFiles(`${rel}/${name}`));
  return [rel];
};

const DATA_IMPORT = /from\s+["']@\/data\/([A-Za-z0-9_.-]+)["']/g;

/** The page's own files plus every data module they import: what its content is made of. */
const sourcesOf = (entries) => {
  const files = new Set();
  const queue = entries.flatMap(listFiles);
  while (queue.length) {
    const rel = queue.shift();
    if (files.has(rel)) continue;
    files.add(rel);
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    DATA_IMPORT.lastIndex = 0;
    let m;
    while ((m = DATA_IMPORT.exec(src))) queue.push(...listFiles(`src/data/${m[1]}${m[1].includes(".") ? "" : ".js"}`));
  }
  return [...files].sort();
};

const fingerprintFiles = (files) =>
  files.length ? sha(files.map((rel) => `${rel}:${sha(fs.readFileSync(path.join(ROOT, rel)))}`).join("\n")) : "no-sources";

const fingerprintRecord = (record, keys) =>
  sha(canon(Object.fromEntries(keys.map((k) => [k, record[k] === undefined ? null : record[k]]))));

/** Date of the last commit touching these files, or null when git is not available here. */
const gitDate = (files) => {
  if (!files.length) return null;
  try {
    const result = spawnSync("git", ["log", "-1", "--format=%cs", "--", ...files], { cwd: ROOT, encoding: "utf8" });
    const date = result.status === 0 ? result.stdout.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch (e) {
    return null;
  }
};

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const snapshot = fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, "utf8")) : null;

  /** API first, the checked-in snapshot second; null means fall back to the previous sitemap. */
  const loadFamily = async (endpoint, key) => {
    const live = await getJson(`${API}/api/${endpoint}`);
    if (validRecords(live)) return { records: live, source: "api" };
    if (snapshot && validRecords(snapshot[key])) return { records: snapshot[key], source: "snapshot" };
    return { records: null, source: "previous sitemap" };
  };
  const insights = await loadFamily("insights", "insights");
  const cases = await loadFamily("case-studies", "cases");
  const familyFingerprint = (family, keys) => (family.records || []).map((r) => fingerprintRecord(r, keys)).join(",");
  const folded = { insights: familyFingerprint(insights, INSIGHT_KEYS), cases: familyFingerprint(cases, CASE_KEYS) };

  const urls = STATIC_ROUTES.map(([loc, priority, changefreq, sources, family]) => {
    const files = sourcesOf(sources);
    const fp = family ? sha(`${fingerprintFiles(files)}|${folded[family]}`) : fingerprintFiles(files);
    return { loc, priority, changefreq, fp, files };
  });

  const services = slugsFrom("src/data/content.js");
  const serviceFiles = sourcesOf(SERVICE_SOURCES);
  const serviceFp = fingerprintFiles(serviceFiles);
  services.forEach((s) => urls.push({ loc: `/what-we-do/${s}`, priority: 0.8, changefreq: "monthly", fp: serviceFp, files: serviceFiles }));

  const disciplines = slugsFrom("src/data/disciplines.js");
  const disciplineFiles = sourcesOf(DISCIPLINE_SOURCES);
  const disciplineFp = fingerprintFiles(disciplineFiles);
  disciplines.forEach((s) => urls.push({ loc: `/network/${s}`, priority: 0.7, changefreq: "monthly", fp: disciplineFp, files: disciplineFiles }));

  let insightCount = 0;
  (insights.records || []).forEach((i) => {
    urls.push({ loc: `/insights/${i.slug}`, priority: 0.7, changefreq: "monthly", fp: fingerprintRecord(i, INSIGHT_KEYS), files: [] });
    insightCount += 1;
  });

  let caseCount = 0;
  (cases.records || []).forEach((c) => {
    urls.push({ loc: `/work/${c.slug}`, priority: 0.7, changefreq: "monthly", fp: fingerprintRecord(c, CASE_KEYS), files: [] });
    caseCount += 1;
  });

  // de-duplicate, keeping the highest priority seen for a path
  const byLoc = new Map();
  urls.forEach((u) => {
    const prev = byLoc.get(u.loc);
    if (!prev || u.priority > prev.priority) byLoc.set(u.loc, u);
  });
  const final = [...byLoc.values()].sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  // lastmod: remembered per fingerprint, moved only when the fingerprint moved.
  const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const moved = [];
  final.forEach((u) => {
    const known = previous[u.loc];
    if (known && known.fp === u.fp && /^\d{4}-\d{2}-\d{2}$/.test(known.lastmod || "")) {
      u.lastmod = known.lastmod;
      return;
    }
    u.lastmod = (!known && gitDate(u.files)) || today;
    moved.push(u.loc);
  });
  const manifest = Object.fromEntries(
    [...final].sort((a, b) => a.loc.localeCompare(b.loc)).map((u) => [u.loc, { fp: u.fp, lastmod: u.lastmod }])
  );
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";
  if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, "utf8") !== manifestText) fs.writeFileSync(MANIFEST, manifestText, "utf8");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    final
      .map(
        (u) =>
          "  <url>\n" +
          `    <loc>${xmlEscape(SITE + u.loc)}</loc>\n` +
          `    <lastmod>${u.lastmod}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority.toFixed(1)}</priority>\n` +
          "  </url>"
      )
      .join("\n") +
    "\n</urlset>\n";

  const out = path.join(ROOT, "public", "sitemap.xml");

  // Recover only the route families that neither the API nor the snapshot could
  // provide. A successful empty array is authoritative and must remove stale
  // URLs for that family. Carried-over entries keep their own lastmod.
  const failedFamilies = [
    !insights.records && "/insights/",
    !cases.records && "/work/",
  ].filter(Boolean);
  let outputXml = xml;
  if (failedFamilies.length && fs.existsSync(out)) {
    const previousXml = fs.readFileSync(out, "utf8");
    const preserved = [];
    for (const block of previousXml.match(/<url>[\s\S]*?<\/url>/g) || []) {
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
    throw new Error("Cannot generate a complete sitemap: content API unavailable, no content snapshot and no previous sitemap exists");
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
      `${insightCount} insights [${insights.source}], ${caseCount} cases [${cases.source}]); ` +
      `lastmod moved for ${moved.length}` +
      (moved.length && moved.length <= 12 ? `: ${moved.join(", ")}` : "")
  );
})();
