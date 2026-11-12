#!/usr/bin/env node
// Builds the blog from Markdown. No npm install needed (marked is vendored).
//
//   node tools/build-blog.mjs            # published posts only
//   node tools/build-blog.mjs --drafts   # also include posts with `draft: true` (local preview)
//
// Posts live in content/blog/<slug>/vi.md and/or content/blog/<slug>/en.md.
// Other files in the post folder (images…) are copied next to the generated page.
// Folders starting with "_" are ignored (see content/blog/_template).
//
// Output: blog/ (EN), vi/blog/ (VI), the "Writing" section on both home pages,
// and the shared footer (tools/footer.mjs) on every page.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from './vendor/marked.esm.js';
import { footer, syncStaticFooters } from './footer.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'blog');
const DRAFTS = process.argv.includes('--drafts');
const LANGS = ['vi', 'en'];
const WIDGET = 'http://localhost:3000/widget.js';

const UI = {
  en: {
    name: 'Phan Trong Hau', blog: 'Blog', blogTitle: 'Writing', homeH: 'Writing',
    blogLead: 'Notes on things I build, problems I run into at work, and what I learn along the way.',
    back: '← Back to home', backBlog: '← All posts', allPosts: 'All posts →', nav: 'Language',
    empty: 'The first posts are on their way.', min: n => `${n} min read`, read: 'Read post', count: n => `${n} post${n === 1 ? '' : 's'}`,
    viOnly: 'In Vietnamese', draft: 'Draft', top: 'Back to top ↑', prev: '← Newer', next: 'Older →',
    date: d => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
  },
  vi: {
    name: 'Phan Trọng Hậu', blog: 'Blog', blogTitle: 'Bài viết', homeH: 'Bài viết',
    blogLead: 'Ghi chép về những thứ mình làm, các vấn đề gặp ở công ty và những gì học được trên đường đi.',
    back: '← Về trang chủ', backBlog: '← Tất cả bài viết', allPosts: 'Tất cả bài viết →', nav: 'Ngôn ngữ',
    empty: 'Những bài viết đầu tiên sắp ra mắt.', min: n => `${n} phút đọc`, read: 'Đọc bài', count: n => `${n} bài viết`,
    enOnly: 'Bằng tiếng Anh', draft: 'Nháp', top: 'Lên đầu trang ↑', prev: '← Mới hơn', next: 'Cũ hơn →',
    date: d => `${d.getUTCDate()} tháng ${d.getUTCMonth() + 1}, ${d.getUTCFullYear()}`,
  },
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
  .replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// --- front matter: a small YAML subset (key: value, key: [a, b]) ---
function parse(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error(`${file}: missing front matter (--- title/date ---)`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else if (v === 'true' || v === 'false') v = v === 'true';
    else v = v.replace(/^["']|["']$/g, '');
    meta[kv[1]] = v;
  }
  for (const k of ['title', 'date']) if (!meta[k]) throw new Error(`${file}: front matter needs "${k}"`);
  const date = new Date(meta.date + 'T00:00:00Z');
  if (isNaN(date)) throw new Error(`${file}: date must look like 2026-11-20`);
  return { ...meta, date, tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [], body: raw.slice(m[0].length) };
}

function render(md) {
  const ids = new Map();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        let id = slugify(text) || 'section';
        const n = ids.get(id) || 0; ids.set(id, n + 1); if (n) id += '-' + n;
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${ext}>${text}</a>`;
      },
      image({ href, title, text }) {
        const img = `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy">`;
        return title ? `<figure>${img}<figcaption>${esc(title)}</figcaption></figure>` : img;
      },
    },
  });
  return marked.parse(md);
}

const words = s => (s.replace(/```[\s\S]*?```/g, ' ').match(/\S+/g) || []).length;

// --- collect posts ---
const posts = []; // {slug, lang, ...meta, html, minutes}
if (fs.existsSync(SRC)) {
  for (const slug of fs.readdirSync(SRC).sort()) {
    const dir = path.join(SRC, slug);
    if (slug.startsWith('_') || slug.startsWith('.') || !fs.statSync(dir).isDirectory()) continue;
    if (slugify(slug) !== slug) throw new Error(`content/blog/${slug}: folder name must be lowercase-with-dashes (try "${slugify(slug)}")`);
    for (const lang of LANGS) {
      const f = path.join(dir, `${lang}.md`);
      if (!fs.existsSync(f)) continue;
      const p = parse(f);
      if (p.draft && !DRAFTS) continue;
      posts.push({ ...p, slug, lang, dir, html: render(p.body), minutes: Math.max(1, Math.round(words(p.body) / 220)) });
    }
  }
}
posts.sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug));
const has = (slug, lang) => posts.some(p => p.slug === slug && p.lang === lang);

// What a language's listing shows: its own posts, plus posts only written in the other language.
function listing(lang) {
  const other = lang === 'en' ? 'vi' : 'en';
  return posts.filter(p => p.lang === lang || (p.lang === other && !has(p.slug, lang)));
}

// href from a page in `fromLang` at `depth` (0 = home, 1 = blog index, 2 = post) to a post
function postHref(p, fromLang, where) {
  if (p.lang === fromLang) return where === 'home' ? `blog/${p.slug}/` : where === 'index' ? `${p.slug}/` : `../${p.slug}/`;
  // cross-language link
  const toRoot = { home: fromLang === 'en' ? '' : '../', index: fromLang === 'en' ? '../' : '../../', post: fromLang === 'en' ? '../../' : '../../../' }[where];
  return `${toRoot}${p.lang === 'en' ? '' : 'vi/'}blog/${p.slug}/`;
}

// Post card (blog index and home): cover image on top (front matter `cover: cover.webp`, a file in the
// post folder), or a coloured placeholder with the first tag when there is none.
function card(p, lang, where = 'index', h = 'h2') {
  const u = UI[lang];
  const href = postHref(p, lang, where);
  const L = p.lang !== lang ? ` lang="${p.lang}"` : '';
  const foreign = p.lang !== lang ? ` <span class="post-lang">${lang === 'en' ? u.viOnly : u.enOnly}</span>` : '';
  const draft = p.draft ? ` <span class="post-lang">${u.draft}</span>` : '';
  const cover = p.cover
    ? `<img src="${href}${esc(p.cover)}" width="1200" height="675" loading="lazy" alt="">`
    : `<span class="post-cover-ph">${esc(p.tags[0] ? '#' + p.tags[0] : u.blog)}</span>`;
  const tags = p.tags.length ? `<span class="post-tags">${p.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</span>` : '';
  return `<li><a class="post-card" href="${href}"${p.lang !== lang ? ` hreflang="${p.lang}"` : ''}><div class="post-cover">${cover}</div><div class="post-card-body">`
    + `<span class="post-meta"><time datetime="${p.date.toISOString().slice(0, 10)}">${UI[p.lang].date(p.date)}</time> · ${UI[p.lang].min(p.minutes)}${foreign}${draft}</span>`
    + `<${h}${L}>${esc(p.title)}</${h}>`
    + (p.description ? `<p${L}>${esc(p.description)}</p>` : '')
    + `<span class="post-foot">${tags}<span class="post-read">${u.read} <span aria-hidden="true">→</span></span></span></div></a></li>`;
}

function shell({ lang, root, title, description, enHref, viHref, body, back, backHref }) {
  const u = UI[lang];
  const cur = l => (l === lang ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fafafa"><title>${esc(title)}</title>
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml"><link rel="alternate" hreflang="en" href="${enHref}">
<link rel="alternate" hreflang="vi" href="${viHref}">
<link rel="stylesheet" href="${root}styles.css">
</head>
<body>
<main class="container" id="home">
<div class="topbar"><a class="back" href="${backHref}">${back}</a><nav class="lang" aria-label="${u.nav}"><a href="${enHref}" lang="en"${cur('en')}>EN</a><a href="${viHref}" lang="vi"${cur('vi')}>VI</a></nav></div>
${body}
</main>
${footer(lang, root)}
<!-- Chat widget: change the src to the deployed chatbot URL before publishing. -->
<script src="${WIDGET}" defer></script>
</body></html>
`;
}

const outDir = lang => path.join(ROOT, lang === 'en' ? '' : 'vi', 'blog');
const write = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

// Start clean so deleted/renamed posts disappear.
for (const lang of LANGS) fs.rmSync(outDir(lang), { recursive: true, force: true });

for (const lang of LANGS) {
  const u = UI[lang];
  const list = listing(lang);
  const root = lang === 'en' ? '../' : '../../';

  // blog index
  const listHtml = list.length ? `<ul class="post-grid">${list.map(p => card(p, lang)).join('')}</ul>` : `<p class="post-empty">${u.empty}</p>`;
  write(path.join(outDir(lang), 'index.html'), shell({
    lang, root, title: `${u.blogTitle} — ${u.name}`, description: u.blogLead,
    enHref: lang === 'en' ? './' : '../../blog/', viHref: lang === 'en' ? '../vi/blog/' : './',
    back: u.back, backHref: '../',
    body: `<section class="blog-hero" aria-labelledby="blog-title"><p class="label">${u.blog.toUpperCase()}</p><h1 id="blog-title">${u.blogTitle}</h1><p class="intro-text">${u.blogLead}</p>${list.length ? `<p class="blog-count">${u.count(list.length)}</p>` : ''}</section>\n<section class="blog-body">${listHtml}</section>`,
  }));

  // posts
  const own = posts.filter(p => p.lang === lang);
  own.forEach((p, i) => {
    const out = path.join(outDir(lang), p.slug);
    const r = lang === 'en' ? '../../' : '../../../';
    const enHref = lang === 'en' ? './' : (has(p.slug, 'en') ? `../../../blog/${p.slug}/` : '../../../blog/');
    const viHref = lang === 'vi' ? './' : (has(p.slug, 'vi') ? `../../vi/blog/${p.slug}/` : '../../vi/blog/');
    const newer = own[i - 1], older = own[i + 1];
    const pager = (newer || older) ? `<nav class="post-pager">${newer ? `<a href="../${newer.slug}/"><span>${u.prev}</span>${esc(newer.title)}</a>` : '<span></span>'}${older ? `<a class="older" href="../${older.slug}/"><span>${u.next}</span>${esc(older.title)}</a>` : ''}</nav>` : '';
    const tags = p.tags.length ? `<ul class="chips">${p.tags.map(t => `<li>#${esc(t)}</li>`).join('')}</ul>` : '';
    write(path.join(out, 'index.html'), shell({
      lang, root: r, title: `${p.title} — ${u.name}`, description: p.description || p.title,
      enHref, viHref, back: u.backBlog, backHref: '../',
      body: `<article class="article" aria-labelledby="post-title"><header class="article-head"><p class="post-meta"><time datetime="${p.date.toISOString().slice(0, 10)}">${u.date(p.date)}</time> · ${u.min(p.minutes)}${p.draft ? ` <span class="post-lang">${u.draft}</span>` : ''}</p><h1 id="post-title">${esc(p.title)}</h1>${p.description ? `<p class="intro-text">${esc(p.description)}</p>` : ''}${tags}</header>\n<div class="article-body">${p.html}</div>\n${pager}</article>`,
    }));
    for (const f of fs.readdirSync(p.dir)) if (!f.endsWith('.md')) fs.cpSync(path.join(p.dir, f), path.join(out, f), { recursive: true });
  });

  // home page section between <!-- blog:start --> and <!-- blog:end -->
  const home = path.join(ROOT, lang === 'en' ? '' : 'vi', 'index.html');
  let s = fs.readFileSync(home, 'utf8');
  // Home shows 3 posts: the ones marked `home: true` (in either language) first,
  // newest first, then the latest posts fill any empty spots.
  const picked = new Set(posts.filter(p => p.home === true).map(p => p.slug));
  const latest = [...list.filter(p => picked.has(p.slug)), ...list.filter(p => !picked.has(p.slug))].slice(0, 3);
  const section = latest.length
    ? `<section id="blog" class="section" aria-labelledby="blog-home-title"><div class="section-heading"><h2 id="blog-home-title">${u.homeH}</h2><a class="see-all" href="blog/">${u.allPosts}</a></div><ul class="post-grid${latest.length === 3 ? ' post-grid-home' : ''}">${latest.map(p => card(p, lang, 'home', 'h3')).join('')}</ul></section>`
    : '';
  const re = /<!-- blog:start -->[\s\S]*?<!-- blog:end -->/;
  if (!re.test(s)) throw new Error(`${home}: missing <!-- blog:start --><!-- blog:end --> markers`);
  s = s.replace(re, `<!-- blog:start -->${section}<!-- blog:end -->`);

  fs.writeFileSync(home, s);
}

const synced = syncStaticFooters(ROOT);
const count = l => posts.filter(p => p.lang === l).length;
console.log(`blog: ${count('vi')} VI, ${count('en')} EN post(s)${DRAFTS ? ' (drafts included)' : ''}; footer synced on ${synced} page(s)`);
