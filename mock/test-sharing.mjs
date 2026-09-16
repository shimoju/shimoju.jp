import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { engagement, shareLinks } from './sharing.mjs';
import { icon } from './icons.mjs';

const url = 'https://shimoju.jp/2016/08/17/shakai-fukki/';
const title = '日本語 & "引用" #記号 😀';
const links = shareLinks(url, title).map(([, , href]) => new URL(href));
assert.equal(links[0].searchParams.get('text'), title);
assert.equal(links[0].searchParams.get('url'), url);
assert.equal(links[0].searchParams.has('hashtags'), false);
assert.equal(links[1].searchParams.get('u'), url);
assert.equal(links[2].origin + links[2].pathname, 'https://bsky.app/intent/compose');
assert.equal(links[2].searchParams.get('text'), `${title}\n${url}`);
assert.deepEqual(shareLinks(url, title).map(([id]) => id), ['x', 'facebook', 'bluesky', 'hatena']);
assert.equal(links[3].href, 'https://b.hatena.ne.jp/entry/s/shimoju.jp/2016/08/17/shakai-fukki/');
assert.equal(shareLinks('https://shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/', '')[3][2], 'https://b.hatena.ne.jp/entry/s/shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/');
const markup = engagement({ publicUrl: url, title });
assert.equal((markup.match(/class="icon-link share-icon"/g) || []).length, 4);
assert.equal((markup.match(/<svg /g) || []).length, 4);
assert.match(markup, /日本語 &amp; &quot;引用&quot;/);
assert.match(markup, /data-hatena-star-url="https:\/\/shimoju.jp\//);
assert.doesNotMatch(markup, /onclick|javascript:|localhost|127\.0\.0\.1/);
assert.doesNotMatch(engagement({ title }), /data-sharing-entry|data-hatena-star-container/);

const source = readFileSync(new URL('src/sharing.js', import.meta.url), 'utf8');
function boot(present = true) {
  const scripts = [];
  const status = {};
  const entry = { querySelector: () => status };
  const document = {
    querySelector: () => present ? entry : null,
    getElementById: id => scripts.find(el => el.id === id),
    createElement: () => ({ addEventListener(type, callback) { this[type] = callback; } }),
    head: { append: el => scripts.push(el) },
  };
  runInNewContext(source, { document });
  runInNewContext(source, { document });
  return { scripts, status };
}
const app = boot();
assert.deepEqual(app.scripts.map(el => el.src), ['https://s.hatena.ne.jp/js/widget/star.js']);
app.scripts[0].error();
assert.match(app.status.textContent, /はてなスターを読み込めませんでした/);
assert.equal(boot(false).scripts.length, 0);
assert.doesNotMatch(markup, /official-share|sharing-review|実動作確認/);
const css = readFileSync(new URL('src/theme.css', import.meta.url), 'utf8');
assert.equal([...css.matchAll(/\.star-widget \{/g)].length, 1, 'Use the same star layout at every viewport width');
assert.doesNotMatch(css, /--star-inset/);
const starRule = css.match(/\.star-widget \{([^}]+)\}/)[1];
assert.doesNotMatch(starRule, /background|border|padding|margin|flex-basis/);
assert.match(starRule, /color-scheme: light/);
assert.match(css, /\.icon-link svg, \.theme-toggle svg, \.copy svg \{ fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round;/);
assert.match(css, /\.icon-link svg \{[^}]*stroke-width: 1\.5;/);
assert.match(css, /\.icon-link svg \{ width: var\(--icon-size\); height: var\(--icon-size\);/);
for (const name of ['bluesky', 'x', 'facebook', 'hatena', 'github', 'rss', 'moon', 'sun']) {
  const svg = icon(name);
  assert(svg.includes('viewBox="0 0 24 24"'), 'All artwork uses the same coordinate system');
  assert(svg.includes('width="24" height="24"'), 'Intrinsic dimensions match the shared canvas');
  assert.doesNotMatch(svg, /transform=|vector-effect=|stroke-width=|fill=/, 'No per-icon scale, fill or stroke correction');
  assert(svg.includes('preserveAspectRatio="xMidYMid meet"'), 'Fit and center artwork without stretching or cropping');
}
const iconRule = css.match(/\.icon-link \{([^}]+)\}/)[1];
assert.match(iconRule, /width: var\(--control-size\); height: var\(--control-size\); flex-shrink: 0;/);
for (const [, rule] of css.matchAll(/\.footer-links a(?:[^{]*)\{([^}]+)\}/g)) {
  assert.doesNotMatch(rule, /(?:width|height)\s*:/, 'Footer icons must use the shared square dimensions');
}
for (const name of ['article', 'article-hugo', 'article-diary', 'article-bgm', 'article-pasmo']) {
  const html = readFileSync(new URL(`site/${name}.html`, import.meta.url), 'utf8');
  assert.match(html, /src="assets\/sharing.js"/);
  assert.match(html, /data-hatena-star-url="https:\/\/shimoju.jp\/\d{4}\/\d{2}\/\d{2}\//);
  assert.doesNotMatch(html, /data-share-preview|official-share|sharing-review/);
}
const about = readFileSync(new URL('site/about.html', import.meta.url), 'utf8');
assert.match(about, /src="assets\/sharing.js"/);
assert.match(about, /data-hatena-star-url="https:\/\/shimoju.jp\/about\/"/);
assert.match(about, /data-hatena-star-title="About"/);
for (const [, , href] of shareLinks('https://shimoju.jp/about/', 'About')) {
  assert(about.includes(href.replaceAll('&', '&amp;')));
}
for (const name of ['home', 'index', 'specimen']) {
  assert.doesNotMatch(readFileSync(new URL(`site/${name}.html`, import.meta.url), 'utf8'), /src="assets\/sharing.js"/);
}
console.log('PASS: share URL encoding, SVG links, public article/About targets, only Hatena Star SDK, failure feedback, other pages isolated.');
