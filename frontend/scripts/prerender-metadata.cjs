/* Generate route-specific HTML heads without changing the React UI. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const ROOT = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env'), quiet: true });
const SITE = (process.env.SITE_URL || 'https://hianzy.com').replace(/\/+$/, '');
const API = (process.env.LOCAL_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8111').replace(/\/+$/, '');
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));

function sourceData(file) {
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(path.join(ROOT, file), 'utf8'), { format: 'cjs', loader: 'js' }).code;
  vm.runInNewContext(code, { module, exports: module.exports });
  return module.exports;
}

async function content(endpoint, fallback) {
  try {
    const response = await fetch(`${API}/api/${endpoint}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const records = await response.json();
    if (!Array.isArray(records) || records.some(r => !r.slug || !r.title)) throw new Error('Invalid content response');
    return records;
  } catch (error) {
    console.warn(`metadata: ${endpoint} unavailable; using the checked-in public content snapshot`);
    return fallback;
  }
}

function head(metadata) {
  const url = new URL(metadata.route || '/', SITE).href;
  const image = new URL(metadata.image || '/og-default.png', SITE).href;
  const pairs = [
    ['name', 'description', metadata.description], ['name', 'robots', metadata.noIndex ? 'noindex,follow' : 'index,follow'],
    ['property', 'og:site_name', 'hiAnzy'], ['property', 'og:type', metadata.type || 'website'],
    ['property', 'og:title', metadata.title], ['property', 'og:description', metadata.description],
    ['property', 'og:url', url], ['property', 'og:image', image],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description], ['name', 'twitter:image', image],
  ];
  return `<title>${escape(metadata.title)}</title>\n<link rel="canonical" href="${escape(url)}">\n` +
    pairs.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escape(value || '')}">`).join('\n');
}

function render(shell, metadata) {
  return shell.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace('</head>', `${head(metadata)}\n</head>`);
}

async function build() {
  const parsedSite = new URL(SITE);
  if (!['https:', 'http:'].includes(parsedSite.protocol)) throw new Error('SITE_URL must be an HTTP(S) origin');
  const shell = fs.readFileSync(path.join(ROOT, 'build/index.html'), 'utf8');
  const pages = {
    '/': 'Home', '/what-we-do': 'WhatWeDo', '/how-we-work': 'HowWeWork', '/work': 'Work',
    '/network': 'Network', '/why-hi-anzy': 'WhyHiAnzy', '/insights': 'Insights',
    '/who-we-work-with': 'WhoWeWorkWith', '/collaborate': 'Collaborate', '/careers': 'Careers',
    '/resources': 'Resources', '/contact': 'Contact', '/coming-soon': 'ComingSoon',
  };
  const routes = [];
  for (const [route, file] of Object.entries(pages)) {
    const source = fs.readFileSync(path.join(ROOT, `src/pages/${file}.js`), 'utf8');
    const seo = source.match(/<Seo\s[\s\S]*?\/>/)?.[0] || '';
    const title = seo.match(/title="([^"]+)"/)?.[1];
    const description = seo.match(/description="([^"]+)"/)?.[1];
    if (!title || !description) throw new Error(`Missing static metadata for ${route}`);
    routes.push({ route, title, description });
  }
  const { CATEGORIES, ORBIT_CATEGORIES } = sourceData('src/data/content.js');
  const { DISCIPLINES } = sourceData('src/data/disciplines.js');
  for (const item of CATEGORIES) routes.push({route:`/what-we-do/${item.slug}`, title:`${item.title} | hiAnzy`, description:item.lede || item.copy});
  for (const item of DISCIPLINES) routes.push({route:`/network/${item.slug}`, title:`${item.name} | hiAnzy Network`, description:item.lede});
  for (const item of ORBIT_CATEGORIES) routes.push({route:item.route, title:`${item.name} | The Hi Anzy Orbit | hiAnzy`, description:item.seoDescription || item.copy});
  const snapshot = require('./content-snapshot.json');
  const [cases, insights] = await Promise.all([content('case-studies', snapshot.cases), content('insights', snapshot.insights)]);
  for (const item of cases) routes.push({route:`/work/${item.slug}`, title:`${item.title} | hiAnzy Work`, description:item.summary, image:item.image, type:'article'});
  for (const item of insights) routes.push({route:`/insights/${item.slug}`, title:item.seo?.title || `${item.title} | hiAnzy`, description:item.seo?.description || item.excerpt, image:item.image, type:'article'});
  for (const metadata of routes) {
    if (!/^\/(?:[a-z0-9-]+\/?)*$/.test(metadata.route) || !metadata.title || !metadata.description) throw new Error(`Invalid route metadata: ${metadata.route}`);
    const file = path.join(ROOT, 'build', metadata.route === '/' ? 'index.html' : `${metadata.route.slice(1)}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, render(shell, metadata));
  }
  fs.writeFileSync(path.join(ROOT, 'build/404.html'), render(shell, {title:'Page not found | hiAnzy', description:'The requested page could not be found.', noIndex:true}));
  fs.writeFileSync(path.join(ROOT, 'build/route-metadata.json'), JSON.stringify(routes, null, 2));
  console.log(`metadata: generated ${routes.length} public HTML pages`);
}

module.exports = { head, render, build };
if (require.main === module) build().catch(error => { console.error(error.message); process.exitCode = 1; });
