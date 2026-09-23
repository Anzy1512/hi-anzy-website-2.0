const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { render, sourceData } = require('./prerender-metadata.cjs');

test('raw HTML contains escaped title, description, canonical and sharing image', () => {
  const html = render('<html><head><title>Default</title><meta name="description" content="Default"></head><body><div id="root"></div></body></html>',
    { route:'/work/example', title:'A <script> & a case', description:'A "quoted" result', image:'/og-default.png' });
  assert.match(html, /<title>A &lt;script&gt; &amp; a case<\/title>/);
  assert.match(html, /name="description" content="A &quot;quoted&quot; result"/);
  assert.match(html, /rel="canonical" href="https:\/\/hianzy.com\/work\/example"/);
  assert.match(html, /property="og:image" content="https:\/\/hianzy.com\/og-default.png"/);
  assert.match(html, /<div id="root"><\/div>/);
});

for (const unavailable of ['insights', 'case-studies', 'both', 'none', 'malformed']) {
  test(`sitemap handles ${unavailable} unavailable and respects successful empty lists`, async () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hianzy-sitemap-'));
    fs.mkdirSync(path.join(fixture, 'scripts'));
    fs.mkdirSync(path.join(fixture, 'public'));
    fs.copyFileSync(path.join(__dirname, 'generate-sitemap.js'), path.join(fixture, 'scripts/generate-sitemap.js'));
    fs.writeFileSync(path.join(fixture, 'public/sitemap.xml'), '<urlset><url><loc>https://old.example/insights/old-note</loc></url><url><loc>https://old.example/work/old-case</loc></url></urlset>');
    const server = http.createServer((req, res) => {
      res.statusCode = unavailable === 'both' || req.url === `/api/${unavailable}` ? 503 : 200;
      res.end(unavailable === 'malformed' ? '[{}]' : '[]');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const result = await new Promise(resolve => {
        const child = spawn(process.execPath, [path.join(fixture, 'scripts/generate-sitemap.js')], {
          env: {...process.env, NODE_PATH:path.resolve(__dirname, '../node_modules'), SITE_URL:'https://hianzy.com', REACT_APP_BACKEND_URL:`http://127.0.0.1:${server.address().port}`},
          stdio:'ignore',
        });
        child.on('close', resolve);
      });
      assert.equal(result, 0);
      const xml = fs.readFileSync(path.join(fixture, 'public/sitemap.xml'), 'utf8');
      assert.equal(xml.includes('/insights/old-note'), ['insights', 'both', 'malformed'].includes(unavailable));
      assert.equal(xml.includes('/work/old-case'), ['case-studies', 'both', 'malformed'].includes(unavailable));
      assert.ok(!xml.includes('old.example'));
    } finally {
      await new Promise(resolve => server.close(resolve));
      const target = path.resolve(fixture);
      if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('hianzy-sitemap-')) throw new Error('Unsafe fixture path');
      fs.rmSync(target, { recursive:true });
    }
  });
}

test('sitemap lastmod is stable across builds and moves only for changed content', async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hianzy-sitemap-'));
  fs.mkdirSync(path.join(fixture, 'scripts'));
  fs.mkdirSync(path.join(fixture, 'public'));
  fs.copyFileSync(path.join(__dirname, 'generate-sitemap.js'), path.join(fixture, 'scripts/generate-sitemap.js'));
  const snapshot = {
    cases: [{ slug: 'case-a', title: 'Case A', summary: 'first' }],
    insights: [{ slug: 'note-a', title: 'Note A', excerpt: 'first', seo: { title: 'Note A' } }],
  };
  const writeSnapshot = () => fs.writeFileSync(path.join(fixture, 'scripts/content-snapshot.json'), JSON.stringify(snapshot));
  writeSnapshot();
  // the API is down for the whole test: the checked-in snapshot stands in for it
  const server = http.createServer((req, res) => { res.statusCode = 503; res.end(); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const run = () => new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(fixture, 'scripts/generate-sitemap.js')], {
      env:{...process.env, NODE_PATH:path.resolve(__dirname, '../node_modules'), SITE_URL:'https://hianzy.com', REACT_APP_BACKEND_URL:`http://127.0.0.1:${server.address().port}`},
      stdio:'ignore',
    });
    child.on('close', resolve);
  });
  const manifestPath = path.join(fixture, 'scripts/sitemap-lastmod.json');
  const lastmodOf = (route) => {
    const xml = fs.readFileSync(path.join(fixture, 'public/sitemap.xml'), 'utf8');
    const at = xml.indexOf(`<loc>https://hianzy.com${route}</loc>`);
    if (at < 0) return null;
    const m = xml.slice(at).match(/<lastmod>([^<]+)<\/lastmod>/);
    return m && m[1];
  };
  try {
    assert.equal(await run(), 0);
    assert.ok(fs.existsSync(manifestPath), 'the manifest is written');
    assert.ok(lastmodOf('/insights/note-a'), 'snapshot insights are listed when the API is down');
    assert.ok(lastmodOf('/work/case-a'), 'snapshot cases are listed when the API is down');

    // remembered dates survive a rebuild when nothing changed
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest['/insights/note-a'].lastmod = '2020-01-01';
    manifest['/insights'].lastmod = '2020-02-02';
    manifest['/contact'].lastmod = '2021-02-03';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.equal(await run(), 0);
    assert.equal(lastmodOf('/insights/note-a'), '2020-01-01');
    assert.equal(lastmodOf('/insights'), '2020-02-02');
    assert.equal(lastmodOf('/contact'), '2021-02-03');

    // a changed record moves, and so does the hub that lists it; neighbours do not
    snapshot.insights[0].excerpt = 'second';
    writeSnapshot();
    assert.equal(await run(), 0);
    assert.notEqual(lastmodOf('/insights/note-a'), '2020-01-01');
    assert.notEqual(lastmodOf('/insights'), '2020-02-02');
    assert.equal(lastmodOf('/contact'), '2021-02-03');
    assert.equal(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))['/contact'].lastmod, '2021-02-03');
  } finally {
    await new Promise(resolve => server.close(resolve));
    const target = path.resolve(fixture);
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('hianzy-sitemap-')) throw new Error('Unsafe fixture path');
    fs.rmSync(target, { recursive:true });
  }
});

test('the nine consolidated routes redirect at every layer and are pages nowhere', () => {
  const { LEGACY_ROUTES, ORBIT_CATEGORIES } = sourceData('src/data/content.js');
  assert.equal(LEGACY_ROUTES.length, 9);
  const read = (rel) => fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const nginx = read('../nginx.conf.template');
  const vercel = JSON.parse(read('../../vercel.json'));
  const app = read('../src/App.js');
  const generators = [['generate-sitemap.js', read('generate-sitemap.js')], ['prerender-metadata.cjs', read('prerender-metadata.cjs')], ['link-graph.cjs', read('link-graph.cjs')]];
  assert.ok(app.includes('LEGACY_ROUTES.map('), 'App.js renders a LegacyRedirect per legacy route');
  const retired = new Set(LEGACY_ROUTES.map((r) => r.from));
  for (const { from, to } of LEGACY_ROUTES) {
    const [pathname, hash] = to.split('#');
    assert.ok(hash, `${to} names a section`);
    assert.ok(!retired.has(pathname), `${to} does not redirect into another legacy route`);
    assert.ok(nginx.includes(`^${from}/?$`), `nginx matches ${from}`);
    assert.ok(nginx.includes(`"${pathname}$is_args$args#${hash}"`), `nginx sends ${from} to ${to} with the query string kept`);
    assert.ok(vercel.redirects.some((r) => r.source === from && r.destination === to && r.permanent === true), `vercel redirects ${from} permanently`);
    for (const [name, src] of generators) assert.ok(!src.includes(`'${from}'`) && !src.includes(`"${from}"`), `${name} no longer treats ${from} as a page`);
  }
  for (const c of ORBIT_CATEGORIES) {
    assert.ok(c.route.includes('#') && c.anchor && c.legacyRoute, `${c.key} is a hub section with a legacy route`);
    assert.ok(LEGACY_ROUTES.some((r) => r.from === c.legacyRoute && r.to === c.route), `${c.key} legacy route is redirected`);
  }
  // No source file links to a retired path any more; content.js holds the redirect list itself.
  const srcRoot = path.join(__dirname, '../src');
  const walk = (dir, out = []) => { for (const name of fs.readdirSync(dir)) { const p = path.join(dir, name); if (fs.statSync(p).isDirectory()) walk(p, out); else if (/\.jsx?$/.test(name) && !/\.test\.jsx?$/.test(name)) out.push(p); } return out; };
  for (const file of walk(srcRoot)) {
    if (file.endsWith('content.js')) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const { from } of LEGACY_ROUTES) assert.ok(!src.includes(`"${from}"`) && !src.includes(`'${from}'`), `${path.relative(srcRoot, file)} still links to retired ${from}`);
  }
});
