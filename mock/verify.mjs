import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const site = resolve(dirname(fileURLToPath(import.meta.url)), 'site');
const read = file => readFileSync(resolve(site, file), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
let links = 0;
for (const { file } of manifest.pages) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate id`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one h1`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${file}: one main landmark`);
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
assert.doesNotMatch(read('about.html'), /class="(?:article-tags|post-nav)"/);
assert.match(read('about.html'), /class="meta"><span><time datetime="2025-11-16">2025\/11\/16<\/time>/);
assert.doesNotMatch(read('about.html').match(/<header class="article-header">[\s\S]*?<\/header>/)[0], /Updated/);
assert.match(read('about.html'), /<footer class="article-end"><div class="engagement"/);
assert.doesNotMatch(read('about.html'), /profile-links|このブログでは、技術のことや日々の記録を書いています/);
assert.match(read('about.html'), /<div class="prose"><h2[^>]*>プロフィール<a class="heading-anchor"[^>]*><span aria-hidden="true">#<\/span><\/a><\/h2>/);
assert.match(read('home.html'), /株式会社SmartHR 技術統括本部 プロダクトエンジニア/);
assert.match(read('home.html'), /Rails Girlsのコーチ/);
assert.doesNotMatch(read('home.html'), /テクノロジーと社会、日々のこと/);
assert.match(read('specimen.html'), /Updated <time datetime="2026-09-06">2026\/09\/06<\/time>/);
const buildSource = readFileSync(resolve(site, '../build.mjs'), 'utf8');
assert.doesNotMatch(buildSource, /\[frontmatter\]|\.Params\.lastmod/);
assert.match(buildSource, /\.Lastmod\.Format "2006-01-02"/);
assert.match(buildSource, /\.Date\.Format "2006-01-02"/);
// The builder receives calendar dates formatted by Hugo, not raw timestamps.
const articleHeader = buildSource.match(/const header = (`<header class="article-header">[^\n]+`);/)[1];
for (const [lastmod, expected] of [['2026-09-05', false], ['2026-09-06', true], ['', false]]) {
  const html = runInNewContext(articleHeader, {
    post: { id: 'test', title: 'Date test', date: '2026-09-05', lastmod },
    date: value => value, escape: value => value,
  });
  assert.equal(html.includes('Updated'), expected, `Update visibility for ${lastmod || 'zero date'}`);
}
for (const file of ['article', 'article-hugo', 'article-diary', 'article-bgm', 'article-pasmo']) {
  assert.doesNotMatch(read(`${file}.html`).match(/<header class="article-header">[\s\S]*?<\/header>/)[0], /Updated/);
}
assert.match(read('assets/theme.css'), /\.meta \{[^}]*gap: var\(--ui-space-1\) var\(--ui-space-4\);/);
assert.match(read('assets/theme.css'), /\.article-tags \{[^}]*gap: var\(--text-link-gap\);/);
assert.match(read('assets/theme.css'), /\.terms \{[^}]*gap: var\(--text-link-gap\);/);
assert.match(read('assets/theme.css'), /\.article-header h1 \{ margin-bottom: var\(--title-meta-gap\); \}/);
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
for (const [name, value] of Object.entries({
  'space-paragraph': '1em', 'space-list-item': '.125em',
  'space-list-nested': '.25em', 'space-list-paragraph': '.375em',
  'list-indent': '1.75em', 'quote-inset': '1.25em',
  'title-meta-gap': 'var(--ui-space-2)', 'description-gap': 'var(--ui-space-3)',
  'media-info-gap': 'var(--ui-space-6)',
})) assert(themeCss.includes(`--${name}: ${value};`), `${name}: semantic spacing token`);
assert.match(themeCss, /\.prose li \{ margin-block: var\(--space-list-item\); \}/);
assert.match(themeCss, /\.prose li > ul, \.prose li > ol \{ margin-block: var\(--space-list-nested\); \}/);
assert.match(themeCss, /\.prose li > p \{ margin-block: var\(--space-list-paragraph\); \}/);
assert.match(themeCss, /\.prose ul, \.prose ol \{ padding-left: var\(--list-indent\);/);
assert.match(themeCss, /\.prose blockquote \{[^}]*padding: 0 0 0 var\(--quote-inset\);/);
assert.match(themeCss, /\.page-heading h1 \{ margin-bottom: 0; \}/);
for (const selector of ['.page-heading p', '.entry-summary', '.prose figcaption']) {
  const block = themeCss.slice(themeCss.indexOf(selector + ' {')).split('}')[0];
  assert(block.includes('var(--description-gap)'), `${selector}: shared description gap`);
}
assert.match(themeCss, /\.entry-link \{[^}]*gap: var\(--media-info-gap\);/);
assert.match(themeCss, /body \{[^}]*display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;/);
assert.match(themeCss, /\.site-footer \{ margin-block-start: auto;/);
assert.doesNotMatch(themeCss, /body > main \{|body > \.site-header, body > \.site-footer/);
assert.doesNotMatch(themeCss, /min-height: 42vh/);
for (const [name, step] of [['small', -1], ['meta', -2], ['label', -3]]) {
  const expected = (1.6 ** (step / 5)).toFixed(3);
  assert(themeCss.includes(`--text-${name}: calc(var(--body-size) * ${expected});`));
}
assert.match(themeCss, /\.entry-title \{ font-size: var\(--text-h4\);/);
for (const selector of ['.site-nav', '.entry-summary', '.prose table', '.footnotes', '.archive-month h3']) {
  const block = themeCss.slice(themeCss.indexOf(selector + ' {')).split('}')[0];
  assert(block.includes('font-size: var(--text-small)'), selector);
}
assert.doesNotMatch(themeCss, /\d+\.\d{2,}rem/, 'Independent rem dimensions use at most one decimal place');
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
assert.match(themeCss, /\.prose sup \{ line-height: 0; \}/);
assert.match(themeCss, /\.prose th \{ font-weight: 700; \}/);
assert.match(read('specimen.html'), /<b>注目する日本語とEnglish 0123（b）<\/b>/);
assert.doesNotMatch(themeCss, /font-weight: 600/);
assert.match(themeCss, /\.archive-month h3 \{[^}]*font-weight: 400;/);
assert.doesNotMatch(themeCss, /Heading Latin|data-heading(?:=|\])|--heading-weight|--font-heading/);
assert.match(themeCss, /html \{ font-size: 62\.5%;/);
assert.equal((themeCss.match(/html \{ font-size:/g) || []).length, 1, 'Root size is shared across viewports');
assert.match(themeCss, /--body-size: 1\.7rem;/);
assert.match(themeCss, /--content-width: 720px;/);
for (const [tag, ratio] of [['h1', '1.6'], ['h2', '1.456'], ['h3', '1.326'], ['h4', '1.207'], ['h5', '1.099'], ['h6', '1']]) {
  assert.equal(Number(ratio), Number((1.6 ** ((6 - Number(tag[1])) / 5)).toFixed(3)), `${tag} follows the five-interval scale`);
  const token = tag === 'h6' ? 'body-size' : `text-${tag}`;
  assert(themeCss.includes(`${tag} { font-size: var(--${token});`), `${tag} uses the body type scale`);
  if (tag !== 'h6') assert(themeCss.includes(`--${token}: calc(var(--body-size) * ${ratio});`));
}
assert.match(themeCss, /\.site-name \{[^}]*font-size: var\(--text-site\);/);
assert.match(themeCss, /--text-site: calc\(var\(--body-size\) \* 1\.931\);/);
assert.equal(Number((1.6 ** (7 / 5)).toFixed(3)), 1.931);
assert.match(themeCss, /\.code-block pre \{[^}]*font-size: var\(--code-size\);/);
assert.match(themeCss, /--code-size: 1\.4rem;/);
for (const [name, ratio] of Object.entries({cover: '1.931', section: '2.560', group: '3.089', end: '3.394', page: '4.096'})) {
  assert(themeCss.includes(`--space-${name}: calc(var(--body-size) * ${ratio});`));
}
// Token arithmetic supplements (but does not replace) browser layout checks.
const lengthTokens = Object.fromEntries([...themeCss.matchAll(/(--[\w-]+): ([^;]+);/g)].map(([, name, value]) => [name, value]));
const rootRatio = Number(themeCss.match(/html \{ font-size: ([\d.]+)%;/)[1]) / 100;
function tokenPixels(name, defaultSize, bodyRem = parseFloat(lengthTokens['--body-size'])) {
  if (name === '--body-size') return bodyRem * rootRatio * defaultSize;
  const value = lengthTokens[name];
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  if (alias) return tokenPixels(alias[1], defaultSize, bodyRem);
  if (/^[\d.]+rem$/.test(value)) return parseFloat(value) * rootRatio * defaultSize;
  const product = value.match(/^calc\(var\((--[\w-]+)\) \* ([\d.]+)\)$/);
  assert(product, `Expected a rem length or body-based product: ${name}`);
  return tokenPixels(product[1], defaultSize, bodyRem) * Number(product[2]);
}
for (const defaultSize of [16, 20, 32]) {
  for (const [name, expected] of Object.entries({'body-size': 17, 'text-h1': 27.2, 'text-h2': 24.752, 'text-site': 32.827, 'text-small': 15.47, 'text-meta': 14.093, 'text-label': 12.818, 'space-section': 43.52, 'space-page': 69.632, 'code-size': 14})) {
    assert(Math.abs(tokenPixels(`--${name}`, defaultSize) - expected * defaultSize / 16) < 1e-9, `${name}: scales with the browser default`);
  }
}
assert.equal(tokenPixels('--code-size', 16, 1.8), 14, 'Code size is independent of the body token');
assert(Math.abs(tokenPixels('--text-h1', 16, 1.8) - 28.8) < 1e-9);
assert(Math.abs(tokenPixels('--space-section', 16, 1.8) - 46.08) < 1e-9);
assert.match(themeCss, /\.site-nav \{[^}]*column-gap: var\(--text-link-gap\); row-gap: var\(--ui-space-1\);/);
assert.match(themeCss, /--leading-code: 1\.3;/);
assert.doesNotMatch(themeCss, /font(?:-size)?:[^;{}]*\dpx/);
assert(!themeCss.includes('.code-toolbar'));
for (const selector of ['.site-nav a', '.pager a', '.article-tags a', '.terms a']) {
  assert.doesNotMatch(themeCss.slice(themeCss.indexOf(selector + ' {')).split('}')[0], /[; ]height:/, 'Text controls must grow with their content');
}
assert.doesNotMatch(read('index.html'), /name="controls"/);
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
  assert.match(footer, /aria-label="X"[\s\S]*aria-label="Bluesky"[\s\S]*aria-label="GitHub"[\s\S]*aria-label="RSS"[\s\S]*<\/nav><span>© 2026 Hiroshi Shimoju/);
  assert.equal((footer.match(/<svg /g) || []).length, 4);
  assert.equal((footer.match(/aria-hidden="true"/g) || []).length, 4);
}
assert.doesNotMatch(read('home.html'), /新着記事|unavailable|Prev<|公開 |RSSを購読/);
assert.doesNotMatch(read('home-3.html'), /class="next-page"/);
assert.doesNotMatch(read('home.html'), /class="previous-page"/);
for (const { file } of manifest.pages) {
  for (const [nav] of read(file).matchAll(/<nav class="(?:pager|post-nav)"[\s\S]*?<\/nav>/g)) {
    for (const [link] of nav.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) {
      const previous = link.includes('rel="prev"');
      const label = previous ? '<span aria-hidden="true">«</span> Prev' : 'Next <span aria-hidden="true">»</span>';
      assert(link.includes(`<span class="nav-label">${label}</span>`), 'Shared inline label preserves spaces next to arrows');
      assert.doesNotMatch(link, /Prev post|Next post/);
    }
  }
}
assert.match(read('home-2.html'), /<span aria-hidden="true">«<\/span> Prev/);
assert.match(read('home-2.html'), /Next <span aria-hidden="true">»<\/span>/);
assert.match(read('article-hugo.html'), /<span aria-hidden="true">«<\/span> Prev/);
assert.match(read('article-hugo.html'), /Next <span aria-hidden="true">»<\/span>/);
assert.match(read('index.html'), /<button type="submit">ページを開く<\/button>/);
// Shorthand declarations reset thickness to auto, including `text-decoration: none`.
assert.doesNotMatch(themeCss, /\btext-decoration\s*:/, 'Toggle decorations with text-decoration-line only');
const decorationRule = themeCss.match(/^([^{}\n]+) \{ text-decoration-thickness: 1px; \}$/m);
assert(decorationRule, 'Shared explicit decoration thickness');
const decorationOrigins = decorationRule[1].split(',').map(selector => selector.trim());
assert.deepEqual(decorationOrigins, ['a', '.entry-title', '.post-nav-title', '.term-name', '.archive-title']);
assert.equal((themeCss.match(/text-decoration-thickness\s*:/g) || []).length, 1, 'Keep thickness in one shared rule');
assert(themeCss.includes(`${decorationOrigins.join(', ')} { text-decoration-color: var(--muted); }`), 'Persistent decorations use muted on every origin');
assert(themeCss.includes('a:is(:hover, :focus-visible), a:is(:hover, :focus-visible) :is(.entry-title, .post-nav-title, .term-name, .archive-title) { text-decoration-color: var(--text); }'), 'Hover and keyboard focus strengthen decorations without changing foregrounds');
for (const [, selector] of themeCss.matchAll(/([^{}]+)\{[^{}]*text-decoration-line: underline;/g)) {
  const origin = selector.trim().replaceAll(':is(:hover, :focus-visible)', '').split(/\s+/).at(-1).split(':')[0].split('[')[0];
  assert(decorationOrigins.includes(origin), `${selector.trim()}: explicit thickness on decoration origin`);
}
for (const selector of ['.site-nav a', '.pager a', '.article-tags a']) {
  const rule = themeCss.split(`${selector} {`)[1]?.split('}')[0];
  assert(rule?.includes('text-decoration-line: none;'), `${selector}: no underline by default`);
  assert(themeCss.includes(`${selector}:is(:hover, :focus-visible) { text-decoration-line: underline; }`), `${selector}: underline on hover and keyboard focus`);
}
assert.match(themeCss, /\.site-nav a\[aria-current="page"\] \{ text-decoration-line: underline; \}/);
assert.match(themeCss, /\.entry-link:is\(:hover, :focus-visible\) \{[^}]*text-decoration-line: none;/);
assert.match(themeCss, /\.entry-link:is\(:hover, :focus-visible\) \.entry-title \{ text-decoration-line: underline; \}/);
assert.match(themeCss, /\.post-nav a \{[^}]*text-decoration-line: none;/);
assert.match(themeCss, /\.post-nav a:is\(:hover, :focus-visible\) \.post-nav-title \{ text-decoration-line: underline; \}/);
assert.doesNotMatch(themeCss, /\.post-nav a:is\(:hover, :focus-visible\) \{/);
for (const { file } of manifest.pages) {
  const nav = read(file).match(/<nav class="post-nav"[\s\S]*?<\/nav>/)?.[0];
  if (!nav) continue;
  for (const [link] of nav.matchAll(/<a\b[\s\S]*?<\/a>/g)) {
    assert.match(link, /<\/small><span class="post-nav-title">[^<]+<\/span><\/a>/);
    assert.equal((link.match(/class="post-nav-title"/g) || []).length, 1);
  }
}
assert.match(themeCss, /\.site-name \{[^}]*text-decoration-line: none;/);
assert.doesNotMatch(themeCss, /\.site-name:hover/);
assert.match(themeCss, /:focus-visible \{[^}]*outline: 2px solid var\(--accent\)/);
assert.match(read('specimen.html'), /class="footnote-backref" role="doc-backlink">&#x21a9;&#xfe0e;<\/a>/);
assert.doesNotMatch(read('single-item.html'), /class="pager"/);
assert.match(read('specimen.html'), /code-label" lang="en">TOML · config.toml/);
assert.match(read('specimen.html'), /code-label" lang="en">EXAMPLE-UNKNOWN · example.txt/);
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

const cssRule = selector => themeCss.split('\n').find(line => line.startsWith(selector + ' {'))?.split('}')[0] || '';
assert(cssRule('html').includes('scrollbar-gutter: stable;'));
for (const name of ['heading-rhythm', 'quote-line', 'heading-links']) {
  assert(!read('index.html').includes(`name="${name}"`));
  assert(!themeCss.includes(`data-${name}`));
}
assert(cssRule('.heading-anchor').includes('display: none;'));
assert(cssRule('.heading-anchor').includes('opacity: 0;'));
assert(cssRule('.heading-anchor').includes('position: absolute; right: 100%;'));
assert(!themeCss.includes('--heading-anchor-inset'));
assert.match(themeCss, /^:root \{[^}]*--gutter: 16px;/);
const wideRules = themeCss.match(/@media \(min-width: 640px\) \{((?:\s*[^{}]+\{[^{}]*\})+)\s*\}/)?.[1];
const hoverRules = themeCss.match(/@media \(hover: hover\) \{((?:\s*[^{}]+\{[^{}]*\})+)\s*\}/)?.[1];
assert(wideRules && hoverRules, 'Separate width and input-capability enhancements');
assert(wideRules.includes(':root { --gutter: 24px; }'));
assert(hoverRules.includes(':root { --gutter: max(24px, var(--heading-anchor-size)); }'));
assert(hoverRules.includes('.heading-anchor { display: flex; }'));
assert(themeCss.indexOf('@media (hover: hover)') > themeCss.indexOf('@media (min-width: 640px)'), 'Hover gutter wins at every width');
assert.doesNotMatch(themeCss, /@media[^{}]*(?:max-width|hover: none)/);
assert.equal((themeCss.match(/@media/g) || []).length, 2, 'One width enhancement and one input enhancement');
assert.doesNotMatch(themeCss, /--gutter-base/);
assert(cssRule('.heading-anchor').includes('text-decoration-line: none;'));
assert(cssRule('.heading-anchor span').includes('font-size: var(--text-label);'));
assert(cssRule('.heading-anchor').includes('width: var(--heading-anchor-size); min-height: var(--heading-anchor-size); height: calc(var(--leading-heading) * 1em);'));
assert(cssRule('.heading-anchor').includes('justify-content: flex-end;'));
assert(cssRule('.heading-anchor span').includes('flex: 0 0 var(--ui-space-4); text-align: center;'));
assert.doesNotMatch(themeCss, /\.heading-anchor::(?:before|after)/);
for (const size of [16, 20, 32]) assert.equal(tokenPixels('--heading-anchor-size', size), 24 * size / 16);
assert.doesNotMatch(themeCss, /\.(?:icon-link|theme-toggle|copy):hover\s*\{/);
assert(cssRule('.theme-toggle svg, .copy svg').includes('width: var(--icon-size-small); height: var(--icon-size-small);'));
assert(cssRule('.theme-toggle svg, .copy svg').includes('stroke-linecap: round; stroke-linejoin: round;'));
assert(cssRule('.theme-toggle svg, .copy svg').includes('stroke-width: 1.5;'));
for (const { file } of manifest.pages) {
  for (const name of ['moon', 'sun']) assert(read(file).includes(`class="${name}" viewBox="0 0 24 24" width="24" height="24" preserveAspectRatio="xMidYMid meet"`));
  for (const [svg] of read(file).matchAll(/<svg\b[^>]*>/g)) {
    assert(svg.includes('viewBox="0 0 24 24"'), `${file}: all mock-owned icons share one coordinate system`);
    assert(svg.includes('width="24" height="24"'));
  }
}
assert.doesNotMatch(themeCss, /--copy-icon-size/);
assert.doesNotMatch(read('index.html'), /toggle-position/);
assert.doesNotMatch(themeCss, /data-toggle-position/);
assert(cssRule('.site-header').includes('padding-block: var(--space-group) var(--space-section);'));
assert.doesNotMatch(themeCss, /--header-top-min|--ui-space-16/);
for (const size of [16, 20, 32]) {
  const top = tokenPixels('--space-group', size);
  const buttonBottom = tokenPixels('--ui-space-2', size) + tokenPixels('--control-size-small', size);
  assert(top - buttonBottom >= tokenPixels('--ui-space-2', size), 'Header leaves at least 8px equivalent below the theme control');
}
assert.doesNotMatch(themeCss, /--toggle-optical-inset/);
assert(cssRule('.site-header > .theme-toggle').includes('position: absolute; top: var(--ui-space-2); inset-inline-end: 0;'));
assert(cssRule('.site-header > .theme-toggle:focus-visible').includes('outline-offset: -2px;'));
for (const { file, review } of manifest.pages) {
  const html = read(file);
  assert.equal((html.match(/class="theme-toggle"/g) || []).length, 1, `${file}: one color-mode control`);
  if (review) continue;
  assert.match(html, /<header class="site-header shell"><button class="theme-toggle"/);
  assert.doesNotMatch(html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] || '', /theme-toggle/);
}
assert(cssRule('.heading-anchor').includes('color: var(--muted);'));
assert(cssRule('.heading-anchor:hover').includes('color: var(--muted);'));
assert.doesNotMatch(themeCss, /(?:^|\n)a:hover\s*\{/);
for (const [, selector, declarations] of themeCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (selector.includes(':hover') && /(?:^|;)\s*color\s*:/.test(declarations)) {
    assert.equal(selector.trim(), '.heading-anchor:hover', 'Hover must preserve the normal foreground color');
    assert.match(declarations, /color: var\(--muted\);/);
  }
}
assert.match(themeCss, /\.prose :is\(h2, h3, h4, h5, h6\):is\(:hover, :focus-within\) > \.heading-anchor \{ opacity: 1; \}/);
assert.match(themeCss, /\.prose :is\(h2, h3, h4, h5, h6\) \+ p \{ margin-top: 0; \}/);
assert.match(themeCss, /\.prose :is\(h2 \+ h3,[^\n]+h5 \+ h6\) \{ margin-top: \.910em; \}/);
assert.match(themeCss.split(':root[data-theme="dark"]')[0], /--quote-border: #8c8fa1;/);
assert.match(themeCss.split(':root[data-theme="dark"]')[1].split('}')[0], /--quote-border: #7f849c;/);
for (const [, level, id, contents] of read('specimen.html').matchAll(/<h([2-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)) {
  assert(contents.includes(`class="heading-anchor" href="#${id}" aria-label="Link to this section" title="Link to this section" lang="en"`), `H${level} native permalink with English tooltip and accessible name`);
}
assert.doesNotMatch(read('home.html'), /class="heading-anchor"/);
assert(cssRule('.code-block pre:focus-visible').includes('outline-offset: -2px;'));
assert(cssRule('.copy:focus-visible').includes('outline-offset: -2px;'));
assert(cssRule('.copy').includes('position: absolute;'));
assert(cssRule('.copy').includes('top: var(--ui-space-2); right: var(--ui-space-2);'));
assert(cssRule('.theme-toggle, .copy').includes('width: var(--control-size-small); height: var(--control-size-small);'));
assert(cssRule('.copy').includes('opacity: 0; pointer-events: none;'));
assert(cssRule('.copy[hidden]').includes('display: none;'));
assert(cssRule('.copy::before').includes('inset: var(--ui-space-1);'));
assert(cssRule('.theme-toggle svg, .copy svg').includes('width: var(--icon-size-small); height: var(--icon-size-small);'));
assert.doesNotMatch(cssRule('.code-block'), /min-height:/);
assert(hoverRules.includes('.code-block:not([data-copy-dismissed]):hover .copy { opacity: 1; pointer-events: auto; }'));
assert(cssRule('.code-block:not([data-copy-dismissed]):is(:focus-within, [data-copy-visible]) .copy').includes('opacity: 1; pointer-events: auto;'));
for (const { file } of manifest.pages) {
  for (const [button] of read(file).matchAll(/<button class="copy"[\s\S]*?<\/button>/g)) {
    assert.match(button, /aria-label="Copy code" title="Copy code" lang="en" data-copy-state="idle" hidden/);
    assert.match(button, /<svg[^>]*aria-hidden="true"/);
    for (const state of ['idle', 'success', 'error']) assert(button.includes(`copy-symbol-${state}`));
  }
  assert(!read(file).includes('class="code-toolbar"'));
}
assert(cssRule('.prose video').includes('display: block; margin: var(--space-block) 0;'));
assert(cssRule('.prose figure video').includes('margin: 0;'));
assert(cssRule('.archive-month time').includes('font-size: var(--text-meta);'));
const specimen = read('specimen.html');
assert.match(specimen, /<li>\s*<p>最初の段落[\s\S]*?<p>同じ項目の補足段落/);
assert.match(specimen, /<blockquote>\s*<p>引用の中にも[\s\S]*?<ul>[\s\S]*?class="code-block/);
for (const [file, newer, older] of [['article.html', null, 'article-hugo.html'], ['article-hugo.html', 'article.html', 'article-diary.html'], ['article-pasmo.html', 'article-bgm.html', null]]) {
  const nav = read(file).match(/<nav class="post-nav"[\s\S]*?<\/nav>/)[0];
  for (const [rel, target] of [['prev', newer], ['next', older]]) {
    const actual = nav.match(new RegExp(`<a rel="${rel}" href="([^"]+)"`))?.[1] || null;
    assert.equal(actual, target, `${file}: ${rel} follows newest-first reading order`);
  }
}
assert(cssRule('.nav-label').includes('display: inline-block; white-space: nowrap;'));
assert(cssRule('.pager').includes('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);'));
assert(!themeCss.includes('@container pagination') && !themeCss.includes('.pager-layout'));
assert.doesNotMatch(read('home-2.html'), /Previous|pager-layout/);
assert(cssRule('.post-nav').includes('repeat(2, minmax(0, 1fr))'));
for (const page of ['article.html', 'article-hugo.html', 'article-pasmo.html']) assert(read('index.html').includes(`value="${page}"`));
assert(cssRule('.site-nav').includes('margin-top: var(--ui-space-2);'));
assert.doesNotMatch(wideRules, /\.(?:site-header|site-nav|intro|article-header|post-nav|site-footer)\s*\{/);
assert(cssRule('.review-grid').includes('grid-template-columns: 1fr;'));
assert(wideRules.includes('.review-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }'));
assert(cssRule('.post-nav').includes('gap: var(--ui-space-4);'));
assert(cssRule('.intro').includes('margin: 0 0 var(--space-group);'));
assert(cssRule('.site-footer').includes('padding-block: var(--space-group) var(--ui-space-8);'));
assert(cssRule('.article-header').includes('margin-bottom: var(--ui-space-8);'));
assert(cssRule('.site-nav a').includes('padding: var(--ui-space-2) var(--text-link-inset);'));
assert.doesNotMatch(themeCss, /--header-(?:top|bottom)-space|--term-(?:gap|inset)/);
assert.doesNotMatch(themeCss, /data-post-nav/);
assert.doesNotMatch(read('index.html'), /name="post-nav"/);
// Leading uses semantic tokens; only superscript deliberately has a literal zero.
for (const [role, value] of Object.entries({ body: 1.9, heading: 1.5, label: 1.5, table: 1.6, code: 1.3 })) {
  assert(themeCss.includes(`--leading-${role}: ${value};`));
}
assert.doesNotMatch(themeCss, /--(?:body|code)-leading/);
for (const [, value] of themeCss.matchAll(/line-height: ([^;]+);/g)) {
  assert(value === '0' || /^var\(--leading-(body|heading|label|table|code)\)$/.test(value), `Untokenized leading: ${value}`);
}
for (const [selector, role] of Object.entries({
  '.site-name': 'heading', '.site-heading': 'heading', '.entry-title': 'heading', '.post-nav-title': 'heading', '.archive-title': 'heading',
  '.entry-summary': 'body', '.prose': 'body', '.star-widget': 'body', '.review-note': 'body',
  '.site-nav': 'label', '.meta': 'label', '.pager': 'label', '.nav-label': 'label', '.post-nav small': 'label', '.article-tags': 'label', '.terms': 'label',
  '.archive-month h3': 'label', '.archive-month time': 'label', '.code-label': 'label', '.site-footer': 'label', '.font-stack': 'label',
  '.prose table': 'table', '.code-block pre': 'code',
})) assert(cssRule(selector).includes(`line-height: var(--leading-${role});`), `${selector}: ${role}`);
assert(cssRule('.post-nav-title').includes('display: block;'));
assert(cssRule('.heading-anchor').includes('height: calc(var(--leading-heading) * 1em);'));
assert(cssRule('.paste-check').includes('/var(--leading-code)'));
assert.doesNotMatch(cssRule('.entry-link:is(:hover, :focus-visible) .entry-title'), /line-height/);
assert.doesNotMatch(cssRule(':not(pre) > code'), /line-height/);

assert(cssRule('.archive-month').includes('align-items: first baseline;'));
assert(cssRule('.archive-month').includes('grid-template-columns: var(--ui-space-8) minmax(0, 1fr);'));
assert(cssRule('.archive-month').includes('column-gap: var(--ui-space-4);'));
assert(wideRules.includes('.archive-month { column-gap: var(--ui-space-12); }'));
assert(cssRule('.archive-month h3').includes('margin: 0;'));
assert(cssRule('.archive-month ul').includes('gap: var(--ui-space-6);'));
assert.doesNotMatch(themeCss, /\.archive-month li \{/);
assert(cssRule('.archive-month:last-child').includes('margin-bottom: 0;'));
assert(cssRule('.archive-month a').includes('flex-direction: column; gap: var(--title-meta-gap);'));
assert(cssRule('.archive-month a').includes('text-decoration-line: none;'));
assert(cssRule('.archive-month time').includes('margin: 0;'));
assert.match(themeCss, /\.archive-month a:is\(:hover, :focus-visible\) \.archive-title \{ text-decoration-line: underline; \}/);
assert.doesNotMatch(themeCss, /\.archive-month a:is\(:hover, :focus-visible\) \{/);
for (const [entry] of read('archives.html').matchAll(/<li>[\s\S]*?<\/li>/g)) {
  assert.match(entry, /<span class="archive-title" id="archive-[^"]+">[^<]+<\/span><time/, 'Date must remain outside the underlined title');
}
for (const selector of ['.article-tags', '.terms']) assert(cssRule(selector).includes('gap: var(--text-link-gap);'));
for (const selector of ['.article-tags', '.terms']) assert(cssRule(selector).includes('margin-inline-start: calc(-1 * var(--term-optical-inset));'));
assert.match(themeCss, /--term-optical-inset: min\(var\(--text-link-inset\), var\(--gutter\)\);/);
assert.match(themeCss, /--share-optical-inset: min\(calc\(\(var\(--control-size\) - var\(--icon-size\)\) \/ 2\), var\(--gutter\)\);/);
assert(cssRule('.share-mount').includes('margin-inline-start: calc(-1 * var(--share-optical-inset));'));
assert(cssRule('.article-tags a:focus-visible, .terms a:focus-visible, .share-icons a:focus-visible').includes('outline-offset: -2px;'));
assert(!cssRule('.footer-links').includes('optical-inset'), 'The footer remains centered');
assert(cssRule('.article-tags a').includes('padding-inline: var(--text-link-inset);'));
assert(cssRule('.terms a').includes('padding: var(--ui-space-2) var(--text-link-inset);'));
assert(cssRule('.terms a').includes('gap: var(--ui-space-1);'), 'Keep the name and count closer than adjacent terms');
assert(cssRule('.terms a').includes('text-decoration-line: none;'));
assert.match(themeCss, /\.terms a:is\(:hover, :focus-visible\) \.term-name \{ text-decoration-line: underline; \}/);
assert.doesNotMatch(themeCss, /\.terms a:is\(:hover, :focus-visible\) \{/);
for (const file of ['tags.html', 'categories.html']) {
  const terms = read(file).match(/<ul class="terms">([\s\S]*?)<\/ul>/)[1];
  for (const [link] of terms.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) {
    assert.match(link, /<span class="term-name">[^<]+<\/span><small>\d+<\/small><\/a>/, 'Count stays outside the underlined name');
  }
}
for (const selector of ['.entry-title', '.article-header h1', '.archive-month a']) {
  assert(cssRule(selector).includes('var(--title-meta-gap)'), `${selector}: common title/date spacing`);
}
assert.match(themeCss, /\.post-nav a\[rel="prev"\] \{ grid-column: 1; grid-row: 1; text-align: left; \}/);
assert.match(themeCss, /\.post-nav a\[rel="next"\] \{ grid-column: 2; grid-row: 1; text-align: right; \}/);
assert.doesNotMatch(themeCss, /\.post-nav a(?::last-child| \+ a)/);
for (const [file, roles] of [['article.html', ['next']], ['article-hugo.html', ['prev', 'next']], ['article-pasmo.html', ['prev']]]) {
  const nav = read(file).match(/<nav class="post-nav"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/<a rel="(prev|next)"/g)].map(match => match[1]), roles, `${file}: retain roles with either neighbor absent`);
  for (const [, role, label] of nav.matchAll(/<a rel="(prev|next)"[^>]*><small[^>]*>([\s\S]*?)<\/small>/g)) {
    assert(label.includes(role === 'prev' ? 'Prev' : 'Next'));
  }
}
for (const [, step, rem] of themeCss.matchAll(/--ui-space-(\d+): ([\d.]+)rem;/g)) {
  assert.equal(Math.round(Number(rem) * 10), Number(step) * 4, 'UI spacing uses a 4px grid');
}
for (const size of [16, 20, 32]) {
  for (const [name, px] of [['control-size', 48], ['control-size-small', 32], ['code-inset', 16], ['icon-gap', 8], ['icon-size', 24], ['icon-size-small', 16], ['title-meta-gap', 8], ['text-link-gap', 8], ['text-link-inset', 4]]) {
    assert(Math.abs(tokenPixels('--' + name, size) - px * size / 16) < 1e-9);
    assert(Math.abs(tokenPixels('--' + name, size, 1.8) - px * size / 16) < 1e-9, 'UI dimensions are independent of body size');
  }
}
for (const size of [16, 20, 32]) {
  assert.equal(tokenPixels('--control-size-small', size), 32 * size / 16);
  assert.equal(tokenPixels('--icon-size-small', size), 16 * size / 16);
  assert.equal(tokenPixels('--control-size-small', size) - 2 * tokenPixels('--ui-space-1', size), 24 * size / 16);
  assert.equal(tokenPixels('--control-size-small', size), 2 * tokenPixels('--icon-size-small', size));
  assert.equal(tokenPixels('--control-size', size), 2 * tokenPixels('--icon-size', size));
}
assert(cssRule('.code-label').includes('padding: var(--code-inset) var(--ui-space-12) 0 var(--code-inset);'));
assert(cssRule('.code-block pre').includes('padding: var(--code-inset);'));
assert(cssRule('.code-label ~ .highlight pre').includes('padding-top: var(--ui-space-2);'));
assert(cssRule('.code-block').includes('display: flex; flex-direction: column;'));
assert(cssRule('.code-block .highlight').includes('min-width: 0;'));
for (const selector of ['.share-icons', '.footer-links']) assert(cssRule(selector).includes('gap: var(--icon-gap)'));
assert.match(themeCss, /--radius-small: 4px;/);
assert.match(themeCss, /--radius-large: 8px;/);
assert.equal([...themeCss.matchAll(/--gutter:/g)].length, 3, 'Gutters have only the narrow base, wide and hover rules');
for (const [, value] of themeCss.matchAll(/border-radius: ([^;]+);/g)) {
  assert(['var(--radius-small)', 'var(--radius-large)', '50%'].includes(value));
}
console.log('PASS: UI grid, shared code inset/icon spacing, radius scale, responsive gutters, independent text scale.');
