// The site's top navigation bar, the same on every page as on the home page.
// `node tools/build-blog.mjs` writes it into the blog pages and syncs it into the
// static project pages (between <!-- topnav:start --> and <!-- topnav:end -->).

import fs from 'node:fs';
import path from 'node:path';

const LABELS = {
  en: { brand: 'Hau', nav: 'Navigation', lang: 'Language', work: 'Experience', projects: 'Projects', blog: 'Writing', contact: 'Contact' },
  vi: { brand: 'Hậu', nav: 'Điều hướng', lang: 'Ngôn ngữ', work: 'Kinh nghiệm', projects: 'Dự án', blog: 'Bài viết', contact: 'Liên hệ' },
};

/**
 * The bar for a page `root` away from the site root (e.g. '../../'), in `lang`, with
 * `current` ('projects' | 'blog') highlighted and the page's two language versions.
 */
export function topnav({ lang, root, current, enHref, viHref }) {
  const t = LABELS[lang];
  const home = `${root}${lang === 'vi' ? 'vi/' : ''}`;
  const link = (key, href) => `<a href="${href}"${key === current ? ' aria-current="page"' : ''}>${t[key]}</a>`;
  const cur = l => (l === lang ? ' aria-current="page"' : '');
  return `<!-- topnav:start --><header class="topnav"><div class="container topnav-inner"><a class="brand" href="${home}" aria-label="${t.brand}">${t.brand}<span>.</span></a>`
    + `<nav class="nav-links" aria-label="${t.nav}">${link('work', `${home}#work`)}${link('projects', `${home}projects/`)}${link('blog', `${home}blog/`)}<a href="#contact">${t.contact}</a><span class="nav-ind" aria-hidden="true"></span></nav>`
    + `<nav class="lang lang-top" aria-label="${t.lang}"><a href="${enHref}" lang="en"${cur('en')}>EN</a><a href="${viHref}" lang="vi"${cur('vi')}>VI</a></nav></div>`
    + `<div class="nav-progress" aria-hidden="true"><span></span></div></header>`
    + `<script>(function(){var h=document.querySelector('.topnav');if(!h)return;var ind=h.querySelector('.nav-ind'),a=h.querySelector('.nav-links [aria-current]'),bar=h.querySelector('.nav-progress span');`
    + `function place(){if(!a||!ind)return;ind.style.width=a.offsetWidth+'px';ind.style.transform='translateX('+a.offsetLeft+'px)';ind.style.opacity=1}`
    + `function scroll(){h.classList.toggle('scrolled',scrollY>4);var d=document.documentElement,m=d.scrollHeight-innerHeight;if(bar)bar.style.transform='scaleX('+(m>0?Math.min(1,scrollY/m):0)+')'}`
    + `place();scroll();addEventListener('resize',place);addEventListener('scroll',scroll,{passive:true})})()</script><!-- topnav:end -->`;
}

const MARK = /<!-- topnav:start -->[\s\S]*?<!-- topnav:end -->\n?/;

/**
 * Puts the bar on the static project pages (projects/ and projects/<slug>/, both languages):
 * right after <body>, with the language links moved out of the old top row, whose back
 * link stays. Idempotent.
 */
export function syncProjectNav(ROOT) {
  let n = 0;
  for (const lang of ['en', 'vi']) {
    const base = path.join(ROOT, lang === 'vi' ? 'vi' : '', 'projects');
    const pages = [path.join(base, 'index.html'), ...fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(base, d.name, 'index.html'))];
    for (const file of pages) {
      if (!fs.existsSync(file)) continue;
      let s = fs.readFileSync(file, 'utf8');
      const root = s.match(/<link rel="stylesheet" href="((?:\.\.\/)+)styles\.css">/)?.[1];
      const en = s.match(/<link rel="alternate" hreflang="en" href="([^"]+)">/)?.[1];
      const vi = s.match(/<link rel="alternate" hreflang="vi" href="([^"]+)">/)?.[1];
      if (!root || !en || !vi) continue;
      const bar = topnav({ lang, root, current: 'projects', enHref: en, viHref: vi }) + '\n';
      s = MARK.test(s) ? s.replace(MARK, bar) : s.replace(/<body>\n?/, `<body>\n${bar}`);
      // The old top row: drop its language switch (now in the bar); the listing page loses the row entirely.
      s = s.replace(/<div class="topbar">(<a class="back"[^>]*>[^<]*<\/a>)<nav class="lang"[^>]*>[\s\S]*?<\/nav><\/div>/, (m, back) =>
        file.endsWith(path.join('projects', 'index.html')) ? '' : `<div class="topbar">${back}</div>`);
      // Detail pages: the back link goes to the project list (the bar already links home).
      if (!file.endsWith(path.join('projects', 'index.html')))
        s = s.replace(/<div class="topbar"><a class="back" href="[^"]*">[^<]*<\/a><\/div>/, `<div class="topbar"><a class="back" href="../">${lang === 'vi' ? '← Tất cả dự án' : '← All projects'}</a></div>`);
      fs.writeFileSync(file, s);
      n++;
    }
  }
  return n;
}
