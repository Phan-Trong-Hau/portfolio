// Search engine files, rebuilt by `node tools/build-blog.mjs`:
// - every page carries the Google Search Console verification meta tag;
// - every page gets canonical + hreflang (absolute), Open Graph, Twitter card and JSON-LD, between
//   <!-- seo:start --> and <!-- seo:end --> in <head>, built from its own title, description and images;
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

const PERSON = {
  '@type': 'Person',
  name: 'Phan Trọng Hậu',
  alternateName: 'Phan Trong Hau',
  url: `${SITE}/`,
  image: `${SITE}/assets/hau-960.jpg`,
  jobTitle: 'Software Engineer',
  email: 'mailto:phantronghau.dev@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Ho Chi Minh City', addressCountry: 'VN' },
  sameAs: ['https://www.linkedin.com/in/phan-trong-hau/', 'https://github.com/Phan-Trong-Hau', 'https://www.facebook.com/phantronghauJs'],
};
const unesc = t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The <head> block for one page: canonical, hreflang, Open Graph, Twitter card and JSON-LD. */
function headFor(html, d, url, otherUrl) {
  const vi = d === 'vi' || d.startsWith('vi' + path.sep);
  const parts = d.split(path.sep).filter(Boolean).filter(x => x !== 'vi');
  const kind = parts.length === 0 ? 'home' : parts.length === 1 ? 'list' : parts[0] === 'blog' ? 'post' : 'project';
  const title = unesc(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'Phan Trọng Hậu');
  const desc = unesc(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const here = url(d);
  // Share image: the project cover, the post cover, else the site card.
  const src = kind === 'project' ? html.match(/<img class="cover" src="([^"]+)"/)?.[1]
    : kind === 'post' ? (html.match(/<img[^>]+src="(cover\.[a-z]+)"/)?.[1] ?? (fs.existsSync(path.join(ROOT_DIR, d, 'cover.webp')) ? 'cover.webp' : null))
    : null;
  // Social apps don't all read WebP: use the JPEG made for sharing when there is one.
  let og = src;
  if (src && kind === 'project') {
    const jpg = src.replace(/.*assets\/projects\/(.+)-1688\.webp$/, 'assets/og/$1.jpg');
    if (jpg !== src && fs.existsSync(path.join(ROOT_DIR, jpg))) og = `${SITE}/${jpg}`;
  }
  if (src && kind === 'post' && fs.existsSync(path.join(ROOT_DIR, d, 'cover-og.jpg'))) og = 'cover-og.jpg';
  const image = og ? new URL(og, here).href : `${SITE}/assets/og-${vi ? 'vi' : 'en'}.jpg`;
  const enUrl = vi ? otherUrl : here, viUrl = vi ? here : otherUrl;
  const crumbs = [{ name: vi ? 'Trang chủ' : 'Home', item: url(vi ? 'vi' : '') }];
  if (kind !== 'home') crumbs.push({ name: parts[0] === 'blog' ? (vi ? 'Bài viết' : 'Writing') : (vi ? 'Dự án' : 'Projects'), item: url(path.join(...(vi ? ['vi'] : []), parts[0])) });
  if (kind === 'post' || kind === 'project') crumbs.push({ name: title.replace(/ — Phan Tr.*$/, ''), item: here });
  const graph = [];
  if (kind === 'home') graph.push(PERSON, { '@type': 'WebSite', name: 'Phan Trọng Hậu', url: `${SITE}/`, inLanguage: vi ? 'vi' : 'en', author: { '@id': `${SITE}/#person` } });
  if (kind === 'list') graph.push({ '@type': 'CollectionPage', name: title, description: desc, url: here, inLanguage: vi ? 'vi' : 'en', author: PERSON });
  if (kind === 'post') {
    const date = html.match(/<time datetime="([^"]+)"/)?.[1];
    graph.push({ '@type': 'BlogPosting', headline: title.replace(/ — Phan Tr.*$/, ''), description: desc, image, url: here, mainEntityOfPage: here, inLanguage: vi ? 'vi' : 'en', ...(date ? { datePublished: date, dateModified: date } : {}), author: PERSON, publisher: PERSON });
  }
  if (kind === 'project') graph.push({ '@type': 'CreativeWork', name: title.replace(/ — Phan Tr.*$/, ''), description: desc, image, url: here, inLanguage: vi ? 'vi' : 'en', author: PERSON, creator: PERSON });
  if (crumbs.length > 1) graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) });
  if (kind === 'home') graph[0] = { ...PERSON, '@id': `${SITE}/#person` };
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return [
    `<link rel="canonical" href="${here}">`,
    otherUrl ? `<link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="vi" href="${viUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}">` : '',
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<meta name="author" content="Phan Trọng Hậu">`,
    `<meta property="og:type" content="${kind === 'post' ? 'article' : kind === 'home' ? 'profile' : 'website'}">`,
    `<meta property="og:site_name" content="Phan Trọng Hậu">`,
    `<meta property="og:locale" content="${vi ? 'vi_VN' : 'en_US'}">${otherUrl ? `<meta property="og:locale:alternate" content="${vi ? 'en_US' : 'vi_VN'}">` : ''}`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(desc)}">`,
    `<meta property="og:url" content="${here}">`,
    `<meta property="og:image" content="${image}"><meta property="og:image:alt" content="${attr(title)}">`,
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(title)}"><meta name="twitter:description" content="${attr(desc)}"><meta name="twitter:image" content="${image}">`,
    `<script type="application/ld+json">${ld}</script>`,
  ].filter(Boolean).join('\n');
}

let ROOT_DIR = '';
const SEO = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->\n?/;

export function syncSeo(ROOT) {
  ROOT_DIR = ROOT;
  const dirs = pages(ROOT).sort();
  const url = d => `${SITE}/${d ? d.split(path.sep).join('/') + '/' : ''}`;
  const set = new Set(dirs);
  const pair = d => (d === 'vi' ? '' : d.startsWith('vi' + path.sep) ? d.slice(3) : d ? path.join('vi', d) : 'vi');
  for (const d of dirs) {
    const f = path.join(ROOT, d, 'index.html');
    let s = fs.readFileSync(f, 'utf8');
    if (!s.includes('google-site-verification')) s = s.replace(/(<meta name="viewport"[^>]*>)/, `$1\n${VERIFY}`);
    // The relative hreflang links are replaced by the absolute ones in the SEO block.
    s = s.replace(/<link rel="alternate" hreflang="(?:en|vi)" href="[^"]*">\n?/g, '');
    const block = `<!-- seo:start -->\n${headFor(s, d, url, set.has(pair(d)) ? url(pair(d)) : null)}\n<!-- seo:end -->\n`;
    s = SEO.test(s) ? s.replace(SEO, block) : s.replace('</head>', `${block}</head>`);
    fs.writeFileSync(f, s);
  }
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
