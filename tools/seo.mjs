// Search engine files, rebuilt by `node tools/build-blog.mjs`:
// - every page carries the Google Search Console verification meta tag;
// - sitemap.xml lists every page (with its other-language version), robots.txt points to it.

import fs from 'node:fs';
import path from 'node:path';

export const SITE = 'https://www.phantronghau.com';
const VERIFY = '<meta name="google-site-verification" content="4zWluxktiTapGxPk52J-zz-eBmtZgL09MhFLPgTqvlY">';
const SKIP = new Set(['tools', 'node_modules', 'assets', 'content', '.git']);

function pages(ROOT, dir = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.isDirectory() && !SKIP.has(e.name)) out.push(...pages(ROOT, path.join(dir, e.name)));
    else if (e.name === 'index.html') out.push(dir);
  }
  return out;
}

export function syncSeo(ROOT) {
  const dirs = pages(ROOT).sort();
  for (const d of dirs) {
    const f = path.join(ROOT, d, 'index.html');
    const s = fs.readFileSync(f, 'utf8');
    if (!s.includes('google-site-verification')) fs.writeFileSync(f, s.replace(/(<meta name="viewport"[^>]*>)/, `$1\n${VERIFY}`));
  }
  const url = d => `${SITE}/${d ? d.split(path.sep).join('/') + '/' : ''}`;
  const set = new Set(dirs);
  const pair = d => (d === 'vi' ? '' : d.startsWith('vi' + path.sep) ? d.slice(3) : d ? path.join('vi', d) : 'vi');
  const entries = dirs.map(d => {
    const other = pair(d);
    const vi = d === 'vi' || d.startsWith('vi' + path.sep);
    const alt = set.has(other)
      ? `\n    <xhtml:link rel="alternate" hreflang="${vi ? 'vi' : 'en'}" href="${url(d)}"/>\n    <xhtml:link rel="alternate" hreflang="${vi ? 'en' : 'vi'}" href="${url(other)}"/>`
      : '';
    return `  <url>\n    <loc>${url(d)}</loc>${alt}\n  </url>`;
  });
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  return dirs.length;
}
