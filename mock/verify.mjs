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
assert.doesNotMatch(read('assets/theme.css'), /data-type|data-links|data-leading|data-title|data-cover-position|data-font|data-footer|data-masthead|\.toc/);
assert.doesNotMatch(read('index.html'), /name="(?:type|cover|links|leading|title|cover-position|font|footer|masthead)"|article-toc|specimen-toc/);
assert.match(read('index.html'), /data-font-stack="body"/);
assert.doesNotMatch(read('index.html'), /masthead=/);
assert.match(read('assets/theme.css'), /body \{[^}]*font-feature-settings: "palt";/);
assert.match(read('assets/theme.css'), /code, pre \{[^}]*font-feature-settings: normal;/);
assert.match(read('assets/theme.css'), /code, pre \{[^}]*font-kerning: none;/);
assert.match(read('assets/theme.css'), /--font-body: "Helvetica Neue", Arial, var\(--font-ja\)/);
assert.match(read('assets/theme.css'), /"Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif/);
assert.doesNotMatch(read('assets/theme.css'), /Segoe UI|BIZ UD|SFMono-Regular|"SF Mono"|Yu Gothic|MS Gothic|Meiryo|Hiragino Kaku|Liberation Mono|Roboto|Century Gothic/);
assert.match(read('assets/theme.css'), /--font-code: ui-monospace, Menlo, Consolas, "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", monospace/);
for (const file of ['index.html', 'specimen.html']) assert.doesNotMatch(read(file), /SFMono-Regular|BIZ UD|Yu Gothic|游ゴシック/);
assert.match(read('assets/theme.css'), /:not\(pre\) > code \{ font-size: \.85em; padding: \.25em \.35em/);
const themeCss = read('assets/theme.css');
assert.match(themeCss, /html \{ font-size: 100%;/);
assert.match(themeCss, /@media \(min-width: 640px\) \{\s*html \{ font-size: 106\.25%;/);
assert.match(themeCss, /--body-size: 1rem;/);
assert.match(themeCss, /--content-width: 720px;/);
for (const [tag, ratio] of [['h1', '1.6'], ['h2', '1.4'], ['h3', '1.25'], ['h4', '1.125'], ['h5', '1.0625'], ['h6', '1']]) {
  assert(themeCss.includes(`${tag} { font-size: ${ratio}rem;`), `${tag} uses the root type scale`);
}
assert.match(themeCss, /\.site-name \{[^}]*font-size: 2rem;/);
assert.match(themeCss, /\.code-block pre \{[^}]*font-size: 0\.875rem;/);
assert.doesNotMatch(themeCss, /font(?:-size)?:[^;{}]*\dpx/);
assert.match(themeCss, /\.code-toolbar \{[^}]*flex-wrap: wrap/);
assert.doesNotMatch(themeCss.match(/\.theme-toggle \{[^}]*\}/)[0], /[; ]height:/);
for (const { file } of manifest.pages) assert.doesNotMatch(read(file), /data-text-scale-test/, 'Deliverable must not contain test-only font overrides');
assert.match(read('assets/theme.css'), /--font-site: "Avenir Next", var\(--font-body\)/);
assert.match(read('assets/theme.css'), /\.site-name \{ font-family: var\(--font-site\)/);
assert.match(read('index.html'), /data-palt-probe="on"/);
assert.match(read('index.html'), /data-palt-probe="off"/);
assert.match(read('specimen.html'), /class="inline-probe unpadded"/);
assert.doesNotMatch(read('assets/theme.css'), /\.unlabelled[^}]*padding|\.unlabelled[^}]*min-height/);
assert.doesNotMatch(read('home.html').match(/<section class="intro"[\s\S]*?<\/section>/)[0], /<a\b/);
for (const file of ['home.html', 'home-2.html', 'home-3.html']) {
  assert.match(read(file), /<nav class="site-nav"[^>]*>[\s\S]*?<a href="about\.html">About<\/a>/, `${file}: retain header About link`);
  assert.equal((read(file).match(/href="about\.html"/g) || []).length, 1, `${file}: no duplicate About link`);
}
for (const { file } of manifest.pages) {
  const footer = read(file).match(/<footer class="site-footer[\s\S]*?<\/footer>/)[0];
  assert.match(footer, />X<\/a>[\s\S]*>GitHub<\/a>[\s\S]*>RSS<\/a><\/nav><span>© 2026 Hiroshi Shimoju/);
}
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
  if (entry[1].includes('entry-cover')) assert(entry[1].indexOf('entry-cover') < entry[1].indexOf('entry-text'));
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
