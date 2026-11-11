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
  ---
  ```

Start from `content/blog/_template/vi.md` (copy the folder and rename it). Then build:

```sh
node tools/build-blog.mjs --drafts   # preview, includes drafts
node tools/build-blog.mjs            # before committing: published posts only
```

The script regenerates `blog/`, `vi/blog/`, and the latest-posts section on both home pages (between the `<!-- blog:start -->` and `<!-- blog:end -->` markers). Do not edit those generated files by hand. Markdown is parsed by the vendored `tools/vendor/marked.esm.js` (MIT).

## Edit

- `index.html`: English page (profile, work history, contact links).
- `vi/index.html`: Vietnamese page. Keep it in sync with `index.html` when content changes.
- `styles.css`: desktop and mobile layouts.
- `assets/Phan_Trong_Hau_CV.pdf`: original CV download.
- `assets/hau-*.{webp,jpg}`: portrait (480/960 px, metadata stripped).
- Chat widget: the `<script src=".../widget.js">` tag at the end of `index.html`. Point it at the deployed chatbot URL, and add this site's origin to the chatbot's `EMBED_ALLOWED_ORIGINS`.

Contributions are attributed to the relevant employment context. Product links may require authentication. Education dates follow the CV. LinkedIn is omitted because no unambiguous profile URL was supplied.

Repository visibility is private. No website hosting is configured.
