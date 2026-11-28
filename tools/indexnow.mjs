// Tells Bing (and the other IndexNow search engines) that pages changed, so they recrawl soon.
// Usage: node tools/indexnow.mjs            -> every URL in sitemap.xml
//        node tools/indexnow.mjs <url> ...  -> just those
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'a24905b9b73ece07f8d8e8834a45309a'; // public by design: served at /a24905b9b73ece07f8d8e8834a45309a.txt
const HOST = 'www.phantronghau.com';

const urls = process.argv.length > 2
  ? process.argv.slice(2)
  : [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URL(s) -> ${res.status} ${res.statusText}`);
