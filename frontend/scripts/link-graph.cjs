/**
 * Inventory every destination the Agency frontend links to, resolve each one
 * against the real route table and real content, and report what is broken,
 * empty or orphaned.
 *
 * Not a grep for hrefs: template-literal links are normalised to their route
 * pattern (`/insights/${p.slug}` -> `/insights/:slug`) and then expanded
 * against the actual slugs, which come from the data modules for static
 * content and from the running API (falling back to the checked-in
 * content-snapshot) for database-backed content. Anchor targets are checked
 * against the id="" attributes that actually exist in the JSX.
 *
 *   node scripts/link-graph.cjs            # writes ../docs/link-graph.json
 *   node scripts/link-graph.cjs --md       # also writes ../docs/FINAL_LINK_GRAPH.md
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const API = (process.env.LOCAL_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8111').replace(/\/+$/, '');

function sourceData(file) {
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(path.join(ROOT, file), 'utf8'), { format: 'cjs', loader: 'js' }).code;
  vm.runInNewContext(code, { module, exports: module.exports });
  return module.exports;
}

async function content(endpoint, fallback) {
  try {
    const r = await fetch(`${API}/api/${endpoint}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error('not an array');
    return { rows, source: 'api' };
  } catch (e) {
    return { rows: fallback, source: 'snapshot' };
  }
}

/* ---------------------------------------------------------------- routes */
// Mirrors App.js. Kept literal on purpose: a route table you can read is the
// point, and App.js is small enough that drift shows up immediately in the
// "unmatched" bucket below.
const ROUTES = [
  '/', '/what-we-do', '/what-we-do/:slug', '/how-we-work', '/work', '/work/:slug', '/network', '/network/:slug',
  '/why-hi-anzy', '/insights', '/insights/:slug', '/contact', '/resources', '/coming-soon',
];
// The nine former standalone routes are permanent redirects now (LEGACY_ROUTES
// in src/data/content.js). A link to one of them is reported as BROKEN on
// purpose: every internal link should point at the canonical section.
const LAB = '/lab/';

/* ------------------------------------------------------------ extraction */
const walk = (dir, out = []) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(name) && !/\.test\.jsx?$/.test(name)) out.push(p);
  }
  return out;
};

const stripJsx = (s) => s
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\{[^{}]*\}/g, ' ')
  .replace(/&rsquo;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&rarr;/g, '→')
  .replace(/\s+/g, ' ').trim();

const normaliseTemplate = (t) => t.replace(/\$\{[^}]*\}/g, ':param').replace(/\?category=:param/, '?category=:param');

function extractLinks(file, src) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const links = [];
  // <Tag ... to="..."> / to={`...`} / href="..." / href={`...`}
  const tagRe = /<(Link|NavLink|MagneticButton|a)\b([^>]*?)\bto=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{"([^"]+)"\})|<(Link|NavLink|MagneticButton|a)\b([^>]*?)\bhref=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const tag = m[1] || m[7];
    const raw = m[3] || m[4] || m[5] || m[6] || m[9] || m[10] || m[11];
    const kind = m[1] ? 'to' : 'href';
    // link text: from the end of this opening tag to the matching close tag
    const openEnd = src.indexOf('>', m.index);
    const close = src.indexOf(`</${tag}>`, openEnd);
    const text = close > openEnd && close - openEnd < 2000 ? stripJsx(src.slice(openEnd + 1, close)) : '';
    const line = src.slice(0, m.index).split('\n').length;
    links.push({ file: rel, line, tag, attr: kind, raw, template: /\$\{/.test(raw), text: text.slice(0, 80) });
  }
  // navigate("...") / navigate(`...`)
  const navRe = /navigate\((?:"([^"]+)"|`([^`]+)`)/g;
  while ((m = navRe.exec(src))) {
    const raw = m[1] || m[2];
    links.push({ file: rel, line: src.slice(0, m.index).split('\n').length, tag: 'navigate', attr: 'navigate', raw, template: /\$\{/.test(raw), text: '' });
  }
  // data-only routes (content.js `route:` fields)
  const routeRe = /\broute:\s*"([^"]+)"/g;
  while ((m = routeRe.exec(src))) {
    links.push({ file: rel, line: src.slice(0, m.index).split('\n').length, tag: 'data', attr: 'route', raw: m[1], template: false, text: '' });
  }
  // `to:` fields in data objects (NAV_LINKS, FOOTER_LINKS, NextSteps maps)
  const toFieldRe = /\bto:\s*(?:"([^"]+)"|`([^`]+)`)/g;
  while ((m = toFieldRe.exec(src))) {
    const raw = m[1] || m[2];
    links.push({ file: rel, line: src.slice(0, m.index).split('\n').length, tag: 'data', attr: 'to', raw, template: /\$\{/.test(raw), text: '' });
  }
  return links;
}

function extractIds(file, src) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const ids = [];
  const re = /\bid=(?:"([^"]+)"|\{`([^`]+)`\}|\{[^}]*\})/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1]) ids.push({ file: rel, id: m[1], dynamic: false });
    else if (m[2]) ids.push({ file: rel, id: normaliseTemplate(m[2]), dynamic: true });
    else ids.push({ file: rel, id: '(expression)', dynamic: true });
  }
  return ids;
}

/* ------------------------------------------------------------- resolve */
const classify = (raw) => {
  if (/^mailto:/.test(raw)) return 'mailto';
  if (/^tel:/.test(raw)) return 'tel';
  if (/^https?:\/\//.test(raw)) return 'external';
  if (raw === LAB || raw.startsWith(LAB)) return 'lab';
  if (raw.startsWith('#')) return 'same-page-hash';
  if (raw.startsWith('/')) return 'internal';
  return 'other';
};

const splitTarget = (raw) => {
  const [pathAndQuery, hash] = raw.split('#');
  const [pathname, query] = pathAndQuery.split('?');
  return { pathname: pathname || '/', query: query || '', hash: hash || '' };
};

const matchRoute = (pathname) => {
  for (const r of ROUTES) {
    if (r === pathname) return r;
    if (r.includes(':')) {
      const re = new RegExp('^' + r.replace(/:[a-z]+/g, '[a-z0-9-]+') + '$');
      if (re.test(pathname)) return r;
    }
  }
  return null;
};

async function main() {
  const files = walk(path.join(ROOT, 'src'));
  const links = [];
  const ids = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    links.push(...extractLinks(f, src));
    ids.push(...extractIds(f, src));
  }

  const { CATEGORIES, INSIGHT_CATEGORIES } = sourceData('src/data/content.js');
  const { DISCIPLINES } = sourceData('src/data/disciplines.js');
  const snapshot = require('./content-snapshot.json');
  const cases = await content('case-studies', snapshot.cases);
  const insights = await content('insights', snapshot.insights);
  const ecosystem = await content('ecosystem', []);

  // Every concrete public page.
  const pages = new Map();
  const addPage = (route, kind, title) => pages.set(route, { route, kind, title, inbound: [] });
  ['/', '/what-we-do', '/how-we-work', '/work', '/network', '/why-hi-anzy', '/insights', '/contact', '/resources', '/coming-soon'].forEach(r => addPage(r, 'static', r));
  CATEGORIES.forEach(c => addPage(`/what-we-do/${c.slug}`, 'service', c.title));
  DISCIPLINES.forEach(d => addPage(`/network/${d.slug}`, 'discipline', d.name));
  // The six Orbit rosters are sections of /work and /network now
  // (ORBIT_CATEGORIES.route is a hash destination); their anchors are checked
  // below like any other id.
  cases.rows.forEach(c => addPage(`/work/${c.slug}`, 'case-study', c.title));
  insights.rows.forEach(i => addPage(`/insights/${i.slug}`, 'insight', i.title));

  const staticIds = new Set(ids.filter(i => !i.dynamic).map(i => i.id));
  const dynamicIdPatterns = ids.filter(i => i.dynamic).map(i => i.id);

  const resolved = links.map((l) => {
    const type = classify(l.raw);
    const out = { ...l, type, status: 'ok', note: '' };
    if (type !== 'internal' && type !== 'same-page-hash') return out;
    const pattern = l.template ? normaliseTemplate(l.raw) : l.raw;
    const { pathname, query, hash } = splitTarget(pattern);
    out.pathname = pathname; out.query = query; out.hash = hash;
    if (type === 'internal') {
      const route = matchRoute(pathname.replace(/:param/g, 'x'));
      out.route = route;
      if (!route) { out.status = 'BROKEN'; out.note = 'no route matches'; return out; }
      if (!l.template && !pages.has(pathname)) { out.status = 'BROKEN'; out.note = 'route pattern matches but no such page/slug exists'; return out; }
      if (query.startsWith('category=') && !query.includes(':param')) {
        const cat = decodeURIComponent(query.slice('category='.length));
        if (!INSIGHT_CATEGORIES.some(c => c.name === cat)) { out.status = 'BROKEN'; out.note = `unknown insight category "${cat}"`; return out; }
      }
    }
    if (hash) {
      if (staticIds.has(hash)) out.anchor = 'static-id';
      else if (dynamicIdPatterns.length && /:param/.test(hash)) out.anchor = 'dynamic-id';
      else { out.status = 'BROKEN'; out.note = `anchor #${hash} not found in any id=""`; return out; }
    }
    return out;
  });

  // Inbound counts. A template link counts as inbound to every page it expands to.
  for (const r of resolved) {
    if (r.type !== 'internal' || r.status === 'BROKEN') continue;
    const fromPage = fileToPage(r.file);
    if (!r.template) {
      const p = pages.get(r.pathname);
      if (p && fromPage !== r.pathname) p.inbound.push({ from: r.file, text: r.text || r.attr, line: r.line });
    } else {
      for (const p of pages.values()) {
        if (p.route === fromPage) continue;
        if (matchRoute(p.route) === r.route) p.inbound.push({ from: r.file, text: (r.text || r.attr) + ' (dynamic)', line: r.line });
      }
    }
  }

  const orphans = [...pages.values()].filter(p => p.inbound.length === 0);
  const broken = resolved.filter(r => r.status === 'BROKEN');
  const summary = {
    generatedAt: new Date().toISOString(),
    contentSources: { cases: cases.source, insights: insights.source, ecosystem: ecosystem.source },
    files: files.length,
    links: resolved.length,
    byType: countBy(resolved, 'type'),
    pages: pages.size,
    pagesByKind: countBy([...pages.values()], 'kind'),
    broken: broken.length,
    orphans: orphans.map(o => o.route),
    staticIds: staticIds.size,
    ecosystemItems: ecosystem.rows.length,
  };
  const report = { summary, pages: [...pages.values()], links: resolved, brokenLinks: broken, ids: ids.filter(i => !i.dynamic) };
  fs.mkdirSync(path.join(REPO, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(REPO, 'docs', 'link-graph.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (process.argv.includes('--md')) fs.writeFileSync(path.join(REPO, 'docs', 'FINAL_LINK_GRAPH.md'), markdown(report));
}

// Which public page does a source file render? Best effort, used only to
// exclude self-links from inbound counts.
function fileToPage(file) {
  const m = file.match(/src\/pages\/(?:home\/)?([A-Za-z]+)\.js$/);
  if (!m) return null;
  return { Home: '/', WhatWeDo: '/what-we-do', ServiceDetail: '/what-we-do/:slug', HowWeWork: '/how-we-work', Work: '/work', WorkDetail: '/work/:slug',
    Network: '/network', Discipline: '/network/:slug', WhyHiAnzy: '/why-hi-anzy', Insights: '/insights', InsightDetail: '/insights/:slug', Contact: '/contact',
    WhoWeWorkWith: '/who-we-work-with', Collaborate: '/collaborate', Careers: '/careers', Resources: '/resources', ComingSoon: '/coming-soon' }[m[1]] || null;
}

const countBy = (arr, key) => arr.reduce((acc, x) => { acc[x[key]] = (acc[x[key]] || 0) + 1; return acc; }, {});

function markdown(report) {
  const { summary, pages, brokenLinks } = report;
  const lines = [];
  lines.push('# FINAL LINK GRAPH', '', `Generated ${summary.generatedAt} by \`frontend/scripts/link-graph.cjs\`. Content sources: cases=${summary.contentSources.cases}, insights=${summary.contentSources.insights}, ecosystem=${summary.contentSources.ecosystem}.`, '');
  lines.push('## Summary', '', '| Metric | Value |', '|---|---|');
  lines.push(`| Source files scanned | ${summary.files} |`, `| Links found | ${summary.links} |`, `| Public pages | ${summary.pages} |`, `| Broken links | ${summary.broken} |`, `| Orphan pages | ${summary.orphans.length} |`, `| Static anchor ids | ${summary.staticIds} |`, `| Ecosystem items (name-only, listed on a roster section) | ${summary.ecosystemItems} |`, '');
  lines.push('Links by type: ' + Object.entries(summary.byType).map(([k, v]) => `${k}=${v}`).join(', '), '');
  lines.push('Pages by kind: ' + Object.entries(summary.pagesByKind).map(([k, v]) => `${k}=${v}`).join(', '), '');
  lines.push('## Broken links', '');
  if (!brokenLinks.length) lines.push('None.', '');
  else { lines.push('| Source | Line | Text | Target | Problem |', '|---|---|---|---|---|'); brokenLinks.forEach(b => lines.push(`| ${b.file} | ${b.line} | ${b.text || b.attr} | \`${b.raw}\` | ${b.note} |`)); lines.push(''); }
  lines.push('## Orphan pages (no inbound link from any other page)', '');
  if (!summary.orphans.length) lines.push('None.', ''); else summary.orphans.forEach(o => lines.push(`- \`${o}\``)); lines.push('');
  lines.push('## Every public page: inbound links', '', '| Page | Kind | Inbound | From (first 4) |', '|---|---|---|---|');
  pages.sort((a, b) => a.inbound.length - b.inbound.length || a.route.localeCompare(b.route)).forEach(p => {
    const from = p.inbound.slice(0, 4).map(i => `${i.from.replace('src/', '')}:${i.line} "${i.text}"`).join('<br>');
    lines.push(`| \`${p.route}\` | ${p.kind} | ${p.inbound.length} | ${from} |`);
  });
  lines.push('', '## Every link', '', '| Source | Line | Tag | Text | Target | Type | Status |', '|---|---|---|---|---|---|---|');
  report.links.forEach(l => lines.push(`| ${l.file.replace('src/', '')} | ${l.line} | ${l.tag} | ${(l.text || '').replace(/\|/g, '\\|')} | \`${l.raw.replace(/\|/g, '\\|')}\` | ${l.type} | ${l.status} |`));
  return lines.join('\n') + '\n';
}

main().catch(e => { console.error(e); process.exitCode = 1; });
