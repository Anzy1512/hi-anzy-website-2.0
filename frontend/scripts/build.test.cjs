const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { render } = require('./prerender-metadata.cjs');

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
