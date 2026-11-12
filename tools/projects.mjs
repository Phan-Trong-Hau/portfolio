// The full project list lives in projects/index.html and vi/projects/index.html
// (one <a class="project-card"> per line, in display order). The home pages only
// show the FEATURED ones: `node tools/build-blog.mjs` copies those cards into the
// home page between <!-- projects:start --> and <!-- projects:end -->.

import fs from 'node:fs';
import path from 'node:path';

// Slugs shown on the home page, in order. Everything else is on /projects/.
export const FEATURED = ['filum-cx', 'cv-chatbot', 'dh-2026', 'tinhdiem-online', 'bida-8-bi'];

export function syncFeaturedProjects(ROOT) {
  for (const [list, home] of [['projects/index.html', 'index.html'], ['vi/projects/index.html', 'vi/index.html']]) {
    const src = fs.readFileSync(path.join(ROOT, list), 'utf8');
    const cards = new Map();
    for (const line of src.split('\n')) {
      const m = line.match(/^<a class="project-card"[^>]*href="([^"/]+)\/"/);
      if (m) cards.set(m[1], line);
    }
    const picked = FEATURED.map(slug => {
      const card = cards.get(slug);
      if (!card) throw new Error(`${list}: no card for featured project "${slug}"`);
      // list page sits one folder deeper than its home page
      return card.replace(/href="([^"/]+)\/"/, 'href="projects/$1/"').replace(/(src|srcset)="\.\.\//g, '$1="').replace(/, \.\.\//g, ', ');
    });
    const file = path.join(ROOT, home);
    const s = fs.readFileSync(file, 'utf8');
    const re = /<!-- projects:start -->[\s\S]*?<!-- projects:end -->/;
    if (!re.test(s)) throw new Error(`${home}: missing <!-- projects:start --><!-- projects:end --> markers`);
    fs.writeFileSync(file, s.replace(re, `<!-- projects:start -->\n${picked.join('\n')}\n<!-- projects:end -->`));
  }
  return FEATURED.length;
}
