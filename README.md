# Phan Trong Hau — Portfolio

A minimal personal website based on the supplied CV: short introduction, work history, projects, blog, about, skills, and contact. Responsive HTML and CSS, no external fonts or npm dependencies. The blog is built from Markdown by a small Node script; everything else is plain HTML.

## Run locally

```sh
python3 -m http.server 8080
```

Open http://localhost:8080.

## Blog

Posts are Markdown files in `content/blog/<slug>/`:

- `vi.md` (Vietnamese) and/or `en.md` (English). A post written in only one language still shows up in the other language's list, with a language label.
- The folder name is the URL: `content/blog/bai-dau-tien/vi.md` becomes `/vi/blog/bai-dau-tien/`.
- Images go in the same folder: `![Alt text](photo.webp "Optional caption")`.
- Front matter:

  ```yaml
  ---
  title: Post title
  date: 2026-11-20
  description: One-line summary for lists and link previews.
  tags: [nextjs, gcp]
  draft: true   # optional; drafts are skipped unless you pass --drafts
  home: true    # optional; one of the 3 posts shown on the home page
  cover: cover.webp   # optional; image in the post folder, 16:9 (e.g. 1200×675)
  ---
  ```

The home page shows only 3 posts: those with `home: true` first (newest first), then the latest posts fill the rest. Mark your best 3. The full list is always at `/blog/`.

Start from `content/blog/_template/vi.md` (copy the folder and rename it). Then build:

```sh
node tools/build-blog.mjs --drafts   # preview, includes drafts
node tools/build-blog.mjs            # before committing: published posts only
```

The script regenerates `blog/`, `vi/blog/`, and the latest-posts section on both home pages (between `<!-- blog:start -->` and `<!-- blog:end -->`). Do not edit those generated files by hand. Markdown is parsed by the vendored `tools/vendor/marked.esm.js` (MIT).

## Projects

`projects/index.html` and `vi/projects/index.html` list every project card (one per line, in display order) with filters. The home page only shows the featured ones listed in `FEATURED` in `tools/projects.mjs`; `node tools/build-blog.mjs` copies those cards into the home pages. To add a project, add its page under `projects/<slug>/` (and `vi/`), add its card to both list pages, and add the slug to `FEATURED` if it should be on the home page.

## Footer

Every page shares one footer (contact icons: email, phone, Zalo, LinkedIn, GitHub, Facebook) plus a small floating back-to-top button in the bottom-right corner. Edit the links in `tools/footer.mjs`, then run `node tools/build-blog.mjs`: it rewrites the footer on the home pages, project pages, and blog pages.

## Edit

- `index.html`: English page (profile, work history, contact links).
- `vi/index.html`: Vietnamese page. Keep it in sync with `index.html` when content changes.
- `styles.css`: desktop and mobile layouts.
- `assets/Phan_Trong_Hau_CV.pdf`: original CV download.
- `assets/hau-*.{webp,jpg}`: portrait (480/960 px, metadata stripped).
- Chat widget: the `<script src=".../widget.js">` tag at the end of `index.html`. Point it at the deployed chatbot URL, and add this site's origin to the chatbot's `EMBED_ALLOWED_ORIGINS`.

Contributions are attributed to the relevant employment context. Product links may require authentication. Education dates follow the CV.

Repository visibility is private. No website hosting is configured.
