// Home page extras kept in sync by `node tools/build-blog.mjs`:
// - email, phone and LinkedIn under the portrait (the footer has every link);
// - how many projects and posts there are, next to the "Projects" and "Writing" headings.

import fs from 'node:fs';
import path from 'node:path';
import { socialNav } from './footer.mjs';

const SOCIAL = /<!-- social:start -->[\s\S]*?<!-- social:end -->/;

export function syncHomeExtras(ROOT, postCount) {
  for (const [home, list, lang] of [['index.html', 'projects/index.html', 'en'], ['vi/index.html', 'vi/projects/index.html', 'vi']]) {
    const file = path.join(ROOT, home);
    let s = fs.readFileSync(file, 'utf8');
    const projects = (fs.readFileSync(path.join(ROOT, list), 'utf8').match(/<a class="project-card"/g) || []).length;
    const posts = postCount(lang);

    // Contact icons under the portrait.
    const nav = `<!-- social:start -->${socialNav(lang, 'portrait-social', ['email', 'phone', 'linkedin'])}<!-- social:end -->`;
    s = SOCIAL.test(s) ? s.replace(SOCIAL, nav) : s.replace(/(<figure class="portrait">[\s\S]*?<\/picture>)/, `$1${nav}`);

    // Counts beside the section headings (once: the "see all" links carry no number).
    const count = n => `<span class="heading-count">${n}</span>`;
    s = s.replace(/(<h2 id="projects-title">[^<]*)(?:<span class="heading-count">\d+<\/span>)?<\/h2>/, `$1${count(projects)}</h2>`);
    s = s.replace(/(<h2 id="blog-home-title">[^<]*)(?:<span class="heading-count">\d+<\/span>)?<\/h2>/, `$1${count(posts)}</h2>`);
    const all = lang === 'vi' ? ['Tất cả dự án', 'Tất cả bài viết'] : ['All projects', 'All posts'];
    s = s.replace(new RegExp(`(<a class="see-all" href="projects/">)[^<]*(</a>)`), `$1${all[0]} →$2`);
    s = s.replace(new RegExp(`(<a class="see-all" href="blog/">)[^<]*(</a>)`), `$1${all[1]} →$2`);
    fs.writeFileSync(file, s);
  }
}
