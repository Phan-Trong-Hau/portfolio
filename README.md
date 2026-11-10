# Phan Trong Hau — Portfolio

A minimal personal website based on the supplied CV: short introduction, work history, selected project links, about, skills, and contact. Responsive HTML and CSS, no external fonts, dependencies, or build step. The only script is the chat widget loaded from the separate `chatbot` repo.

## Run locally

```sh
python3 -m http.server 8080
```

Open http://localhost:8080.

## Edit

- `index.html`: English page (profile, work history, contact links).
- `vi/index.html`: Vietnamese page. Keep it in sync with `index.html` when content changes.
- `styles.css`: desktop and mobile layouts.
- `assets/Phan_Trong_Hau_CV.pdf`: original CV download.
- `assets/hau-*.{webp,jpg}`: portrait (480/960 px, metadata stripped).
- Chat widget: the `<script src=".../widget.js">` tag at the end of `index.html`. Point it at the deployed chatbot URL, and add this site's origin to the chatbot's `EMBED_ALLOWED_ORIGINS`.

Contributions are attributed to the relevant employment context. Product links may require authentication. Education dates follow the CV. LinkedIn is omitted because no unambiguous profile URL was supplied.

Repository visibility is private. No website hosting is configured.
