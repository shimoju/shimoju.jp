import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), 'site');
const read = file => readFileSync(resolve(site, file), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
let links = 0;
for (const { file } of manifest.pages) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate id`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one h1`);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html, /<iframe|<script[^>]+src="https?:|<link[^>]+href="https?:[^>]+rel="stylesheet"/);
  assert.doesNotMatch(html, /tabindex="0"[^>]+tabindex="0"/);
  for (const match of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const url = match[2].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|data:|\/\/)/.test(url)) continue;
    const [pathQuery, fragment] = url.split('#');
    const path = pathQuery.split('?')[0] || file;
    assert(existsSync(resolve(site, path)), `${file}: missing ${url}`);
    if (fragment && path.endsWith('.html')) {
      const target = read(path);
      const decoded = decodeURIComponent(fragment);
      assert(target.includes(`id="${decoded}"`) || target.includes(`id="${fragment}"`), `${file}: missing anchor ${url}`);
    }
    links++;
  }
  for (const img of html.matchAll(/<img\b[^>]*>/g)) assert.match(img[0], /alt="[^"]+"/, `${file}: image needs alt`);
}
const article = read('article.html');
assert(article.indexOf('<h1>') < article.indexOf('class="meta"'));
assert(article.indexOf('class="meta"') < article.indexOf('class="article-cover"'));
assert(article.indexOf('class="article-cover"') < article.indexOf('class="prose"'));
assert(article.indexOf('class="prose"') < article.indexOf('class="article-tags"'));
assert(article.indexOf('class="article-tags"') < article.indexOf('class="engagement"'));
assert(article.indexOf('class="engagement"') < article.indexOf('class="post-nav"'));
assert.doesNotMatch(article, /<details/);
assert(!existsSync(resolve(site, 'article-toc.html')));
assert(!existsSync(resolve(site, 'specimen-toc.html')));
assert(manifest.pages.every(p => !p.file.includes('-toc')));
assert.doesNotMatch(read('about.html'), /class="(?:meta|article-tags|engagement|post-nav)"/);
assert.doesNotMatch(read('home-2.html'), /class="intro"/);
assert.doesNotMatch(read('home-3.html'), /rel="next"/);
assert.doesNotMatch(read('home.html'), /rel="prev"/);
assert.match(read('empty.html'), /まだ記事がありません/);
assert.doesNotMatch(read('single-item.html'), /class="entry-summary"/);
for (let n = 2; n <= 6; n++) assert.match(read('specimen.html'), new RegExp(`<h${n}\\b`));
assert.match(read('specimen.html'), /class="ln"/);
assert.match(read('specimen.html'), /class="line hl"/);
assert.match(read('specimen.html'), /class="footnotes"/);
assert.doesNotMatch(read('assets/theme.css'), /data-type|data-links|data-leading|data-title|\.toc/);
assert.doesNotMatch(read('index.html'), /name="(?:type|cover|links|leading|title)"|article-toc|specimen-toc/);
assert.match(read('index.html'), /data-font-stack="body"/);
assert.match(read('index.html'), /name="cover-position"/);
assert.match(read('index.html'), /name="masthead"/);
assert.match(read('index.html'), /name="footer"/);
assert.doesNotMatch(read('home.html'), /新着記事|unavailable|Previous<|公開 |RSSを購読/);
assert.doesNotMatch(read('home-3.html'), /Next →/);
assert.doesNotMatch(read('single-item.html'), /class="pager"/);
assert.match(read('specimen.html'), /code-label">TOML · config.toml/);
assert.match(read('specimen.html'), /code-label">EXAMPLE-UNKNOWN · example.txt/);
assert.match(read('specimen.html'), /code-block unlabelled/);
assert.doesNotMatch(read('specimen.html'), /copy-status/);
for (const entry of read('home.html').matchAll(/<article class="post-entry[^>]*>([\s\S]*?)<\/article>/g)) {
  assert.equal((entry[1].match(/<a\b/g)||[]).length, 1, 'One link per listing entry');
  assert.match(entry[1], /<a class="entry-link"[^>]*aria-labelledby="entry-/);
  assert(entry[1].indexOf('entry-summary') < entry[1].indexOf('</a>'));
}
for (const entry of read('archives.html').matchAll(/<li>([\s\S]*?)<\/li>/g)) assert.match(entry[1], /<a[^>]*>[\s\S]*<time[\s\S]*<\/time><\/a>/);
assert.doesNotMatch(read('assets/theme.css'), /@font-face|object-fit:\s*cover|max-height:/);
const syntax = read('assets/syntax.css');
assert.match(syntax, /\[data-theme="light"\] \.chroma \{ color:#4c4f69;background-color:#eff1f5/);
assert.match(syntax, /\[data-theme="dark"\] \.chroma \{ color:#cdd6f4;background-color:#1e1e2e/);
const cover = readFileSync(resolve(site, 'assets/zsh-prompt-cover.png'));
assert.equal(cover.readUInt32BE(16), 1200);
assert.equal(cover.readUInt32BE(20), 630);
console.log(`PASS: ${manifest.pages.length} pages, ${links} local references, grouped links, pagination, adopted options, Hugo code labels, palettes, 1200×630 cover.`);
