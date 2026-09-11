import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { engagement, shareLinks } from './sharing.mjs';

const url = 'https://shimoju.jp/2016/08/17/shakai-fukki/';
const title = '日本語 & "引用" #記号 😀';
const links = shareLinks(url, title).map(([, , href]) => new URL(href));
assert.equal(links[0].searchParams.get('text'), title);
assert.equal(links[0].searchParams.get('url'), url);
assert.equal(links[0].searchParams.has('hashtags'), false);
assert.equal(links[1].searchParams.get('u'), url);
assert.equal(links[2].href, 'https://b.hatena.ne.jp/entry/s/shimoju.jp/2016/08/17/shakai-fukki/');
assert.equal(shareLinks('https://shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/', '')[2][2], 'https://b.hatena.ne.jp/entry/s/shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/');
const markup = engagement({ publicUrl: url, title });
assert.equal((markup.match(/class="icon-link share-icon"/g) || []).length, 3);
assert.equal((markup.match(/<svg /g) || []).length, 3);
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
const starRule = css.match(/\.star-widget \{([^}]+)\}/)[1];
assert.doesNotMatch(starRule, /background|border|padding/);
assert.match(starRule, /color-scheme: light/);
assert.match(css, /\.icon-link svg \{[^}]*fill: currentColor/);
for (const name of ['article', 'article-hugo', 'article-diary', 'article-bgm', 'article-pasmo']) {
  const html = readFileSync(new URL(`site/${name}.html`, import.meta.url), 'utf8');
  assert.match(html, /src="assets\/sharing.js"/);
  assert.match(html, /data-hatena-star-url="https:\/\/shimoju.jp\/\d{4}\/\d{2}\/\d{2}\//);
  assert.doesNotMatch(html, /data-share-preview|official-share|sharing-review/);
}
for (const name of ['home', 'about', 'index', 'specimen']) {
  assert.doesNotMatch(readFileSync(new URL(`site/${name}.html`, import.meta.url), 'utf8'), /src="assets\/sharing.js"/);
}
console.log('PASS: share URL encoding, SVG links, public targets, only Hatena Star SDK, failure feedback, non-article isolation.');
