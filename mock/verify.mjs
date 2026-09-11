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
  assert.doesNotMatch(html, /data-typography-preview|name="typography"|typography-preview/, `${file}: retired font comparison`);
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
assert.doesNotMatch(article, /<p>\s*<img\b/);
assert.match(article, /<figure><img[^>]*ghostty-herdr\.png/);
assert(article.indexOf('<h1>') < article.indexOf('class="meta"'));
assert(article.indexOf('class="meta"') < article.indexOf('class="article-cover"'));
assert(article.indexOf('class="article-cover"') < article.indexOf('class="prose"'));
assert(article.indexOf('class="prose"') < article.indexOf('class="article-tags"'));
assert(article.indexOf('class="article-tags"') < article.indexOf('class="engagement"'));
assert(article.indexOf('class="engagement"') < article.indexOf('class="post-nav"'));
assert.doesNotMatch(article, /<details[^>]*class="toc"/);
assert.doesNotMatch(article, /sharing-review|official-share|data-share-preview/);
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
assert.match(read('assets/theme.css'), /a \{[^}]*text-underline-offset: \.26em;/);
assert.doesNotMatch(read('assets/theme.css'), /\.shares button|\.hatena-star span/);
assert.doesNotMatch(read('index.html'), /masthead=/);
assert.match(read('assets/theme.css'), /body \{[^}]*font-feature-settings: "palt";/);
assert.match(read('assets/theme.css'), /code, pre \{[^}]*font-feature-settings: normal;/);
assert.match(read('assets/theme.css'), /code, pre \{[^}]*font-kerning: none;/);
assert.match(read('assets/theme.css'), /--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;/);
assert.match(read('assets/theme.css'), /"Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif/);
assert.doesNotMatch(read('assets/theme.css'), /BIZ UD|SFMono-Regular|"SF Mono"|Yu Gothic|MS Gothic|Meiryo|Hiragino Kaku|Liberation Mono|Roboto|Century Gothic/);
assert.match(read('assets/theme.css'), /--font-code: Menlo, Consolas, monospace;/);
assert.doesNotMatch(read('assets/theme.css'), /ui-monospace|code-probe-auto/);
assert.match(read('specimen.html'), /data-code-probe="width"/);
for (const file of ['index.html', 'specimen.html']) assert.doesNotMatch(read(file), /ui-monospace|SF Mono|code-probe-auto/);
for (const file of ['index.html', 'specimen.html']) assert.doesNotMatch(read(file), /SFMono-Regular|BIZ UD/);
assert.match(read('assets/theme.css'), /:not\(pre\) > code \{ font-size: \.85em; padding: \.25em \.35em/);
const themeCss = read('assets/theme.css');
for (const [name, step] of [['small', -1], ['meta', -2], ['label', -3]]) {
  const expected = (1.6 ** (step / 5)).toFixed(3).slice(1);
  assert(themeCss.includes(`--text-${name}: ${expected}rem;`));
}
assert.match(themeCss, /\.entry-title \{ font-size: 1\.207rem;/);
for (const selector of ['.site-nav', '.entry-summary', '.prose table', '.footnotes', '.archive-month h3']) {
  const block = themeCss.slice(themeCss.indexOf(selector + ' {')).split('}')[0];
  assert(block.includes('font-size: var(--text-small)'), selector);
}
assert.doesNotMatch(themeCss, /font-size: (?:0?\.875|0?\.8125|0?\.9375|0?\.75|0?\.9)rem;/);
assert.match(themeCss, /--space-block: 1\.931em;/);
for (const selector of ['.prose figure', '.table-scroll', '.code-block']) {
  const block = themeCss.slice(themeCss.indexOf(selector + ' {')).split('}')[0];
  assert(block.includes('margin: var(--space-block) 0;'), selector);
}
assert.match(themeCss, /\.prose :is\(h2, h3, h4, h5, h6\) \{ margin: 2\.121em 0 \.687em; \}/);
assert.equal(Number((1.6 ** (8 / 5)).toFixed(3)), 2.121);
assert.equal(Number((1.6 ** (-4 / 5)).toFixed(3)), .687);
assert.match(themeCss, /\.prose > :first-child \{ margin-top: 0; \}/);
assert.doesNotMatch(themeCss, /data-prose-spacing|--prose-heading-before|spacing-preview/);
for (const {file} of manifest.pages) {
  assert.doesNotMatch(read(file), /data-spacing-preview|name="heading-space"|spacing-preview/);
}
assert.doesNotMatch(themeCss, /system-ui|data-typography="system"/);
for (const { file } of manifest.pages) assert.doesNotMatch(read(file), /value="system"|system-ui/);
assert.doesNotMatch(themeCss, /data-typography|Segoe UI Variable|Arial|Helvetica|Avenir/);
for (const weight of [200, 300, 400, 500, 700]) assert(read('index.html').includes(`data-weight-probe="${weight}" style="font-weight: ${weight}"`));
for (const { file } of manifest.pages) assert.doesNotMatch(read(file), /data-site-weight-preview|name="site-weight"/);
for (const { file } of manifest.pages) assert.doesNotMatch(read(file), /data-heading-preview|name="heading"/);
assert.doesNotMatch(themeCss, /data-site-weight/);
assert.match(themeCss, /h1, h2, h3, h4, h5, h6 \{[^}]*font-weight: 500;/);
assert.match(themeCss, /\.site-name \{[^}]*font-weight: 300;/);
assert.match(themeCss, /strong, b \{ font-weight: 700; \}/);
assert.match(themeCss, /\.prose th \{ font-weight: 700; \}/);
assert.match(read('specimen.html'), /<b>注目する日本語とEnglish 0123（b）<\/b>/);
assert.doesNotMatch(themeCss, /font-weight: 600/);
assert.match(themeCss, /\.archive-month h3 \{[^}]*font-weight: 400;/);
assert.doesNotMatch(themeCss, /Heading Latin|data-heading|--heading-weight|--font-heading/);
assert.match(themeCss, /html \{ font-size: 106\.25%;/);
assert.equal((themeCss.match(/html \{ font-size:/g) || []).length, 1, 'Root size is shared across viewports');
assert.match(themeCss, /--body-size: 1rem;/);
assert.match(themeCss, /--content-width: 720px;/);
for (const [tag, ratio] of [['h1', '1.6'], ['h2', '1.456'], ['h3', '1.326'], ['h4', '1.207'], ['h5', '1.099'], ['h6', '1']]) {
  assert.equal(Number(ratio), Number((1.6 ** ((6 - Number(tag[1])) / 5)).toFixed(3)), `${tag} follows the five-interval scale`);
  assert(themeCss.includes(`${tag} { font-size: ${ratio}rem;`), `${tag} uses the root type scale`);
}
assert.match(themeCss, /\.site-name \{[^}]*font-size: 1\.931rem;/);
assert.equal(Number((1.6 ** (7 / 5)).toFixed(3)), 1.931);
assert.match(themeCss, /\.code-block pre \{[^}]*font-size: calc\(14 \/ 17 \* 1rem\);/);
assert.match(themeCss, /--code-leading: 1\.3;/);
assert.doesNotMatch(themeCss, /font(?:-size)?:[^;{}]*\dpx/);
assert.match(themeCss, /\.code-toolbar \{[^}]*flex-wrap: wrap/);
assert.doesNotMatch(themeCss.match(/\.theme-toggle \{[^}]*\}/)[0], /[; ]height:/);
for (const { file } of manifest.pages) assert.doesNotMatch(read(file), /data-text-scale-test/, 'Deliverable must not contain test-only font overrides');
assert.match(read('assets/theme.css'), /--font-site: var\(--font-body\)/);
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
  assert.match(footer, /aria-label="X"[\s\S]*aria-label="GitHub"[\s\S]*aria-label="RSS"[\s\S]*<\/nav><span>© 2026 Hiroshi Shimoju/);
  assert.equal((footer.match(/<svg /g) || []).length, 3);
  assert.equal((footer.match(/aria-hidden="true"/g) || []).length, 3);
}
assert.doesNotMatch(read('home.html'), /新着記事|unavailable|Previous<|公開 |RSSを購読/);
assert.doesNotMatch(read('home-3.html'), /class="next-page"/);
assert.doesNotMatch(read('home.html'), /class="previous-page"/);
for (const { file } of manifest.pages) {
  for (const [nav] of read(file).matchAll(/<nav class="(?:pager|post-nav)"[\s\S]*?<\/nav>/g)) {
    for (const label of nav.matchAll(/(?:<small lang="en">|rel="(?:prev|next)">)([\s\S]*?)(?:<\/small>|<\/a>)/g)) {
      assert.match(label[1], /^(?:<span aria-hidden="true">«<\/span> Previous(?: post)?|Next(?: post)? <span aria-hidden="true">»<\/span>)$/);
    }
  }
}
assert.match(read('home-2.html'), /<span aria-hidden="true">«<\/span> Previous/);
assert.match(read('home-2.html'), /Next <span aria-hidden="true">»<\/span>/);
assert.match(read('article-hugo.html'), /<span aria-hidden="true">«<\/span> Previous post/);
assert.match(read('article-hugo.html'), /Next post <span aria-hidden="true">»<\/span>/);
assert.match(read('index.html'), /<button type="submit">ページを開く<\/button>/);
for (const selector of ['.site-nav a', '.pager a', '.article-tags a', '.terms a', '.archive-month a', '.profile-links a']) {
  const rule = themeCss.split(`${selector} {`)[1]?.split('}')[0];
  assert(rule?.includes('text-decoration: none;'), `${selector}: no underline by default`);
  assert(themeCss.includes(`${selector}:hover { text-decoration: underline; }`), `${selector}: underline on hover`);
}
assert.match(themeCss, /\.site-nav a\[aria-current="page"\] \{ text-decoration: underline; \}/);
assert.match(themeCss, /\.entry-link:hover \{[^}]*text-decoration: none;/);
assert.match(themeCss, /\.entry-link:hover \.entry-title \{ text-decoration: underline; text-decoration-thickness: 1px; \}/);
assert.match(themeCss, /\.post-nav a \{ text-decoration: none; \}/);
assert.match(themeCss, /\.post-nav a:hover \.post-nav-title \{ text-decoration: underline; text-decoration-thickness: 1px; \}/);
assert.doesNotMatch(themeCss, /\.post-nav a:hover \{/);
for (const { file } of manifest.pages) {
  const nav = read(file).match(/<nav class="post-nav"[\s\S]*?<\/nav>/)?.[0];
  if (!nav) continue;
  for (const [link] of nav.matchAll(/<a\b[\s\S]*?<\/a>/g)) {
    assert.match(link, /<\/small><span class="post-nav-title">[^<]+<\/span><\/a>/);
    assert.equal((link.match(/class="post-nav-title"/g) || []).length, 1);
  }
}
assert.match(themeCss, /\.site-name \{[^}]*text-decoration: none;/);
assert.doesNotMatch(themeCss, /\.site-name:hover/);
assert.match(themeCss, /:focus-visible \{[^}]*outline: 2px solid var\(--accent\)/);
assert.match(read('specimen.html'), /class="footnote-backref" role="doc-backlink">&#x21a9;&#xfe0e;<\/a>/);
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
assert.doesNotMatch(themeCss, /@font-face|object-fit:\s*cover|max-height:/);
const syntax = read('assets/syntax.css');
assert.match(syntax, /\[data-theme="light"\] \.chroma \{ color:#4c4f69;background-color:#eff1f5/);
assert.match(syntax, /\[data-theme="dark"\] \.chroma \{ color:#cdd6f4;background-color:#1e1e2e/);
const cover = readFileSync(resolve(site, 'assets/zsh-prompt-cover.png'));
assert.equal(cover.readUInt32BE(16), 1200);
assert.equal(cover.readUInt32BE(20), 630);
console.log(`PASS: ${manifest.pages.length} pages, ${links} local references, grouped links, pagination, adopted options, Hugo code labels, palettes, 1200×630 cover.`);
