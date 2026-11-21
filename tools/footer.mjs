// The one footer used on every page: contact links + a floating back-to-top button.
// Edit the links here, then run `node tools/build-blog.mjs`: it rebuilds the blog
// and rewrites the <footer> of the home pages and project pages too.

import fs from 'node:fs';
import path from 'node:path';

const ICON = {
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  zalo: '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor"/><text x="12" y="15.6" text-anchor="middle" font-family="Arial,sans-serif" font-size="8.6" font-weight="700" fill="#fff">Zalo</text></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07"/></svg>',
};

// [icon, EN label, VI label, href, opens in new tab]
export const LINKS = [
  ['email', 'Email: phantronghau.dev@gmail.com', 'Email: phantronghau.dev@gmail.com', 'mailto:phantronghau.dev@gmail.com', false],
  ['phone', 'Call +84 392 334 214', 'Gọi 0392 334 214', 'tel:+84392334214', false],
  ['zalo', 'Zalo: 0392 334 214', 'Zalo: 0392 334 214', 'https://zalo.me/0392334214', true],
  ['linkedin', 'LinkedIn', 'LinkedIn', 'https://www.linkedin.com/in/phan-trong-hau/', true],
  ['github', 'GitHub', 'GitHub', 'https://github.com/Phan-Trong-Hau', true],
  ['facebook', 'Facebook', 'Facebook', 'https://www.facebook.com/phantronghauJs', true],
];

const T = {
  en: { name: 'Phan Trong Hau', top: 'Back to top', contact: 'Contact' },
  vi: { name: 'Phan Trọng Hậu', top: 'Lên đầu trang', contact: 'Liên hệ' },
};

// Small round button, bottom-right, shown after scrolling down. Sits above the
// chat-widget launcher (56px at 20px from the corner) when that is on the page.
function toTop(label) {
  return `<button type="button" class="to-top" aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button><script>(()=>{const b=document.querySelector('.to-top');if(!b)return;const chat=()=>document.querySelector('body>button[aria-expanded][aria-label]');const up=()=>{b.classList.toggle('show',scrollY>600);b.classList.toggle('above-chat',!!chat())};addEventListener('scroll',up,{passive:true});up();b.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}))})()</script>`;
}

// "Leave your email or phone and Hau will get back to you": posts to Kai's /api/lead, which
// saves it as a lead in the admin. The hidden "website" field is a honeypot for bots.
const LEAD_API = 'https://kai.phantronghau.com/api/lead';
const LEAD = {
  en: { h: 'Want to talk?', p: 'Leave your email or phone number and I’ll get back to you.', label: 'Email or phone', ph: 'you@company.com or 0912 345 678', send: 'Send', sending: 'Sending…', ok: 'Thanks! I’ll get back to you soon.', bad: 'That doesn’t look like an email or phone number.', err: 'Couldn’t send it. Please try again in a moment.' },
  vi: { h: 'Muốn trao đổi thêm?', p: 'Để lại email hoặc số điện thoại, mình sẽ chủ động liên hệ lại với bạn.', label: 'Email hoặc số điện thoại', ph: 'ban@congty.com hoặc 0912 345 678', send: 'Gửi', sending: 'Đang gửi…', ok: 'Cảm ơn bạn! Mình sẽ liên hệ lại sớm.', bad: 'Có vẻ đây chưa phải email hoặc số điện thoại.', err: 'Chưa gửi được, bạn thử lại sau chút nhé.' },
};
function leadForm(lang) {
  const t = LEAD[lang];
  return `<section class="lead-cta" aria-labelledby="lead-title"><div class="container lead-inner"><div class="lead-main"><div class="lead-copy"><h2 id="lead-title">${t.h}</h2><p>${t.p}</p></div>`
    + `<form class="lead-form" novalidate><label class="sr-only" for="lead-contact">${t.label}</label><input id="lead-contact" name="contact" type="text" inputmode="email" autocomplete="email" required maxlength="200" placeholder="${t.ph}">`
    + `<input class="lead-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit">${t.send}</button><p class="lead-status" role="status" aria-live="polite"></p></form></div></div></section>`
    + `<script>(function(){var f=document.querySelector('.lead-form');if(!f)return;var i=f.contact,b=f.querySelector('button'),st=f.querySelector('.lead-status'),T=${JSON.stringify({ sending: t.sending, send: t.send, ok: t.ok, bad: t.bad, err: t.err })};`
    + `f.addEventListener('submit',function(e){e.preventDefault();var v=i.value.trim();var ok=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)||(/^\\+?[\\d\\s().-]{9,20}$/.test(v)&&v.replace(/\\D/g,'').length>=9);`
    + `if(!ok){st.textContent=T.bad;st.className='lead-status bad';i.focus();return}b.disabled=true;b.textContent=T.sending;st.textContent='';`
    + `fetch('${LEAD_API}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contact:v,page:location.pathname,website:f.website.value})})`
    + `.then(function(r){if(!r.ok)throw r;st.textContent=T.ok;st.className='lead-status good';i.value=''}).catch(function(){st.textContent=T.err;st.className='lead-status bad'}).then(function(){b.disabled=false;b.textContent=T.send})})})()</script>`;
}

// root: relative path to the site root ('' , '../', '../../' …)
/** The contact icons as a <nav> with the given class (the footer's, or the row under the home portrait). */
export function socialNav(lang, cls, only = null) {
  const t = T[lang];
  const icons = LINKS.filter(([k]) => !only || only.includes(k)).map(([k, en, vi, href, ext]) => {
    const label = lang === 'vi' ? vi : en;
    return `<a href="${href}" aria-label="${label}" title="${label}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${ICON[k]}</a>`;
  }).join('');
  return `<nav class="${cls}" aria-label="${t.contact}">${icons}</nav>`;
}

export function footer(lang, root) {
  const t = T[lang];
  const icons = LINKS.map(([k, en, vi, href, ext]) => {
    const label = lang === 'vi' ? vi : en;
    return `<a href="${href}" aria-label="${label}" title="${label}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${ICON[k]}</a>`;
  }).join('');
  return `<footer class="site-footer-wrap" id="contact">${leadForm(lang)}<div class="container site-footer"><span>${t.name}</span><nav class="footer-social" aria-label="${t.contact}">${icons}</nav>${toTop(t.top)}</div></footer>`;
}

// Rewrite the <footer> of the hand-written pages (home + project pages).
export function syncStaticFooters(ROOT) {
  const pages = [['index.html', 'en'], [path.join('vi', 'index.html'), 'vi'],
    [path.join('projects', 'index.html'), 'en'], [path.join('vi', 'projects', 'index.html'), 'vi']];
  for (const [dir, lang] of [['projects', 'en'], [path.join('vi', 'projects'), 'vi']]) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const slug of fs.readdirSync(abs)) {
      const f = path.join(dir, slug, 'index.html');
      if (fs.existsSync(path.join(ROOT, f))) pages.push([f, lang]);
    }
  }
  for (const [rel, lang] of pages) {
    const file = path.join(ROOT, rel);
    const depth = rel.split(path.sep).length - 1; // folders between root and the file
    const root = '../'.repeat(depth);
    const s = fs.readFileSync(file, 'utf8');
    const out = s.replace(/<footer[\s\S]*?<\/footer>/, footer(lang, root));
    if (out !== s) fs.writeFileSync(file, out);
  }
  return pages.length;
}
