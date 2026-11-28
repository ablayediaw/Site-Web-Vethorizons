import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_FILES = [
  'index.html',
  'a-propos.html',
  'services.html',
  'contact.html',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
];

const PUBLIC_DIRS = ['assets'];

export function buildStaticSite(rootDir = __dirname) {
  execFileSync(process.execPath, ['--check', path.join(rootDir, 'server.js')], { stdio: 'inherit' });
  execFileSync(process.execPath, ['--check', path.join(rootDir, 'assets/js/main.js')], { stdio: 'inherit' });

  const distDir = path.join(rootDir, 'dist');
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  for (const file of PUBLIC_FILES) {
    const src = path.join(rootDir, file);
    if (!existsSync(src)) {
      throw new Error(`Missing required public file: ${file}`);
    }
    cpSync(src, path.join(distDir, file));
  }

  for (const dir of PUBLIC_DIRS) {
    const src = path.join(rootDir, dir);
    if (!existsSync(src)) {
      throw new Error(`Missing required public directory: ${dir}`);
    }
    cpSync(src, path.join(distDir, dir), { recursive: true });
  }

  return distDir;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  buildStaticSite();
  console.log('Static site built into dist/ successfully.');
}
