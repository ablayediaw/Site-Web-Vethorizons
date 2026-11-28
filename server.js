import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_HTML_FILES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/a-propos', 'a-propos.html'],
  ['/a-propos.html', 'a-propos.html'],
  ['/services', 'services.html'],
  ['/services.html', 'services.html'],
  ['/contact', 'contact.html'],
  ['/contact.html', 'contact.html'],
]);

const ALLOWED_SEO_FILES = new Map([
  ['/robots.txt', { file: 'robots.txt', type: 'text/plain; charset=utf-8' }],
  ['/sitemap.xml', { file: 'sitemap.xml', type: 'application/xml; charset=utf-8' }],
]);

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    dotfiles: 'ignore',
    index: false,
  }));

  app.get('*', (req, res, next) => {
    const seoEntry = ALLOWED_SEO_FILES.get(req.path);
    if (seoEntry) {
      res.type(seoEntry.type);
      return res.sendFile(path.join(__dirname, seoEntry.file));
    }

    const cleanPath = req.path.length > 1 && req.path.endsWith('/')
      ? req.path.slice(0, -1)
      : req.path;
    const htmlFile = ALLOWED_HTML_FILES.get(cleanPath);
    if (htmlFile) {
      return res.sendFile(path.join(__dirname, htmlFile));
    }
    return next();
  });

  app.use((_req, res) => {
    res.status(404).type('text/plain').send('Not Found');
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`Vet-Horizons server listening on http://${host}:${port}`);
  });
}
