import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from './server.js';

async function withServer(fn) {
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('serves all public HTML pages and static assets', async () => {
  await withServer(async (baseUrl) => {
    for (const route of ['/', '/index.html', '/a-propos.html', '/services.html', '/contact.html']) {
      const res = await fetch(`${baseUrl}${route}`);
      assert.equal(res.status, 200, `Expected 200 for ${route}`);
      assert.match(res.headers.get('content-type') || '', /text\/html/);
    }

    const cssRes = await fetch(`${baseUrl}/assets/css/style.css`);
    assert.equal(cssRes.status, 200);
    assert.match(cssRes.headers.get('content-type') || '', /text\/css/);

    const jsRes = await fetch(`${baseUrl}/assets/js/main.js`);
    assert.equal(jsRes.status, 200);
  });
});

test('blocks access to server source and config files', async () => {
  await withServer(async (baseUrl) => {
    for (const blocked of ['/server.js', '/package.json', '/metadata.json', '/CNAME']) {
      const res = await fetch(`${baseUrl}${blocked}`);
      assert.equal(res.status, 404, `Expected 404 for ${blocked}`);
    }
  });
});

test('serves robots.txt and sitemap.xml with valid content', async () => {
  await withServer(async (baseUrl) => {
    const robots = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robots.status, 200);
    const robotsText = await robots.text();
    assert.match(robotsText, /Sitemap:\s*https:\/\/vethorizons\.net\/sitemap\.xml/);

    const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(sitemap.status, 200);
    const sitemapXml = await sitemap.text();
    for (const loc of [
      'https://vethorizons.net/',
      'https://vethorizons.net/services.html',
      'https://vethorizons.net/a-propos.html',
      'https://vethorizons.net/contact.html',
    ]) {
      assert.ok(sitemapXml.includes(`<loc>${loc}</loc>`), `Missing ${loc} in sitemap.xml`);
    }
  });
});

test('all HTML pages include local SEO metadata, social cards, and valid JSON-LD', async () => {
  await withServer(async (baseUrl) => {
    const pages = [
      { route: '/', canonical: 'https://vethorizons.net/' },
      { route: '/a-propos.html', canonical: 'https://vethorizons.net/a-propos.html' },
      { route: '/services.html', canonical: 'https://vethorizons.net/services.html' },
      { route: '/contact.html', canonical: 'https://vethorizons.net/contact.html' },
    ];
    for (const { route, canonical } of pages) {
      const html = await (await fetch(`${baseUrl}${route}`)).text();
      assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `Missing canonical on ${route}`);
      assert.match(html, /<meta property="og:title"/, `Missing og:title on ${route}`);
      assert.match(html, /<meta property="og:image" content="https:\/\/vethorizons\.net\//, `Missing absolute og:image on ${route}`);
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `Missing twitter:card on ${route}`);
      assert.match(html, /Rufisque/i, `Missing Rufisque keyword on ${route}`);
      assert.match(html, /Almadies 2/i, `Missing Almadies 2 keyword on ${route}`);
      assert.match(html, /Dakar/i, `Missing Dakar keyword on ${route}`);

      const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      assert.ok(ldMatches.length >= 1, `Missing JSON-LD on ${route}`);
      for (const m of ldMatches) {
        const parsed = JSON.parse(m[1]);
        assert.equal(parsed['@context'], 'https://schema.org', `Invalid @context on ${route}`);
      }
    }
  });
});
