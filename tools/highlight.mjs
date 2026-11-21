// The first screen of the project and blog listings: one main item (large image, its text
// right under it, no card) and up to three smaller ones stacked on the right. The rest of
// the list follows below. `node tools/build-blog.mjs` builds both pages' highlights.

import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * items: [{ href, img, srcset?, alt, tag, title, desc, meta? }], the first one is the main item.
 * hidden: a visually hidden <h1> for the page (its visible hero is gone).
 */
export function highlight(items, { h1, label }) {
  const [main, ...side] = items;
  const img = (it, sizes, eager) =>
    `<img src="${it.img}"${it.srcset ? ` srcset="${it.srcset}" sizes="${sizes}"` : ''} alt="${esc(it.alt ?? '')}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
  const mainHtml = `<a class="hl-main" href="${main.href}"><div class="hl-media">${img(main, '(max-width: 860px) 100vw, 740px', true)}</div>`
    + `<div class="hl-text"><span class="hl-tag">${esc(main.tag)}</span><h2>${esc(main.title)}</h2>${main.desc ? `<p>${main.desc}</p>` : ''}${main.meta ? `<span class="hl-meta">${main.meta}</span>` : ''}</div></a>`;
  const sideHtml = side.map(it => `<li><a class="hl-side" href="${it.href}"><div class="hl-thumb">${img(it, '200px', false)}</div>`
    + `<div class="hl-side-text"><span class="hl-tag">${esc(it.tag)}</span><h3>${esc(it.title)}</h3>${it.desc ? `<p>${it.desc}</p>` : ''}${it.meta ? `<span class="hl-meta">${it.meta}</span>` : ''}</div></a></li>`).join('');
  return `<!-- highlight:start --><h1 class="sr-only">${esc(h1)}</h1><section class="highlight" id="highlight" aria-label="${esc(label)}">${mainHtml}`
    + (side.length ? `<ul class="hl-list">${sideHtml}</ul>` : '') + `</section><!-- highlight:end -->`;
}

const FILTER = `<script>(function(){var l=document.getElementById('project-list'),hl=document.getElementById('highlight');[].forEach.call(document.querySelectorAll('.project-filter button'),function(b){b.addEventListener('click',function(){var k=b.dataset.filter;[].forEach.call(b.parentNode.children,function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});if(hl)hl.hidden=k!=='all';[].forEach.call(l.children,function(c){c.hidden=k==='all'?c.dataset.hl==='1':k==='ai'?c.dataset.ai!=='1':c.dataset.kind!==k})})})})()</script>`;

const MARK = /<!-- highlight:start -->[\s\S]*?<!-- highlight:end -->\n?/;

/** Projects shown in the highlight, main one first. */
export const HIGHLIGHT_PROJECTS = ['kai', 'filum-cx', 'dh-2026', 'tinhdiem-online'];

/**
 * Builds the project listing's first screen from its own cards, drops the old hero and
 * featured block, and marks the highlighted cards so the grid below skips them (until a
 * filter other than "All" is picked).
 */
export function syncProjectHighlight(ROOT) {
  for (const [rel, lang] of [['projects/index.html', 'en'], ['vi/projects/index.html', 'vi']]) {
    const file = path.join(ROOT, rel);
    let s = fs.readFileSync(file, 'utf8');
    const cards = new Map();
    for (const m of s.matchAll(/<a class="project-card"[^>]*href="([^"/]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) cards.set(m[1], m[2]);
    const items = HIGHLIGHT_PROJECTS.map(slug => {
      const c = cards.get(slug);
      if (!c) throw new Error(`${rel}: no card for highlighted project "${slug}"`);
      const pick = re => c.match(re)?.[1] ?? '';
      const src = pick(/<img src="([^"]+)"/);
      return {
        href: `${slug}/`,
        img: src.replace(/-844\.webp$/, '-1688.webp'),
        srcset: pick(/srcset="([^"]+)"/),
        alt: pick(/alt="([^"]*)"/),
        tag: pick(/<span class="project-tag">([^<]*)<\/span>/),
        title: pick(/<h3>([^<]*)<\/h3>/),
        desc: pick(/<h3>[^<]*<\/h3><p>([\s\S]*?)<\/p>/),
        meta: pick(/<p class="stack">([^<]*)<\/p>/),
      };
    });
    const vi = lang === 'vi';
    const block = highlight(items, { h1: vi ? 'Dự án' : 'Projects', label: vi ? 'Dự án nổi bật' : 'Featured projects' }) + '\n';
    // Old hero + old featured card go; the highlight takes their place.
    s = s.replace(/<section class="blog-hero"[\s\S]*?<\/section>\n?/, '');
    s = s.replace(/<section class="featured"[\s\S]*?<\/section>\n?/, '');
    s = MARK.test(s) ? s.replace(MARK, block) : s.replace('<section class="blog-body">', `${block}<section class="blog-body">`);
    // Highlighted cards: skipped by the grid while "All" is on.
    s = s.replace(/<a class="project-card"([^>]*?)( data-hl="1")?( hidden)? href="([^"/]+)\/"/g, (m, attrs, _hl, _h, slug) =>
      HIGHLIGHT_PROJECTS.includes(slug) ? `<a class="project-card"${attrs} data-hl="1" hidden href="${slug}/"` : `<a class="project-card"${attrs} href="${slug}/"`);
    // Filter: "All" = highlight + the other cards; any other filter = the whole list, filtered.
    s = s.replace(/<script>\(function\(\)\{var l=document\.getElementById\('project-list'\)[\s\S]*?<\/script>/, FILTER);
    fs.writeFileSync(file, s);
  }
}
