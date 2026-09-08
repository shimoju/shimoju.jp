import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

// Build-time only. Delivered site/ is plain HTML/CSS/JS and needs no Hugo runtime.
const args = process.argv.slice(2);
if (args.length > 1 || (args.length && !/^--text-scale=(1|1\.25|2)$/.test(args[0]))) {
  throw new Error('Usage: node mock/build.mjs [--text-scale=1|1.25|2]');
}
const textScale = args.length ? Number(args[0].split('=')[1]) : 1;
// Temporary layout stress test, not a change to the browser's font preferences.
const testStyle = textScale === 1 ? '' : `<style data-text-scale-test>html{font-size:${100 * textScale}%}@media(min-width:640px){html{font-size:${106.25 * textScale}%}}</style>`;
if (textScale !== 1) console.warn(`TEST BUILD: text scale ${textScale}; restore with node mock/build.mjs before delivery.`);
const root = dirname(fileURLToPath(import.meta.url));
const repo = dirname(root);
const out = join(root, 'site');
const scratch = mkdtempSync(join(tmpdir(), 'shimoju-visual-mock-'));
const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
const read = path => readFileSync(path, 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sources = [
  ['article', 'content/posts/2026/09/01/development-environment-2026/index.md'],
  ['article-hugo', 'content/posts/2023/06/22/hugo-and-cloudflare-pages/index.md'],
  ['article-diary', 'content/posts/2016/08/17/shakai-fukki/index.md'],
  ['article-bgm', 'content/posts/2016/08/14/hikikomori/index.md'],
  ['article-pasmo', 'content/posts/2016/08/13/pasmo-autocharge/index.md'],
  ['about', 'content/about.md'],
  ['specimen', 'mock/src/specimen.md'],
];
put(join(scratch, 'hugo.toml'), `baseURL = 'https://mock.invalid/'
title = 'Mock fragments'
defaultContentLanguage = 'ja'
hasCJKLanguage = true
summaryLength = 140
disableKinds = ['home', 'section', 'taxonomy', 'term', 'RSS', 'sitemap']
[markup.goldmark.renderer]
unsafe = true
[markup.highlight]
noClasses = false
style = 'catppuccin-latte'
`);
put(join(scratch, 'layouts/single.html'), '{{ dict "title" .Title "date" (.Date.Format "2006-01-02") "tags" (.Params.tags | default slice) "categories" (.Params.categories | default slice) "body" .Content "summary" .Summary | jsonify | safeHTML }}');
put(join(scratch, 'layouts/_markup/render-codeblock.html'), read(join(root, 'src/render-codeblock.html')));
put(join(scratch, 'layouts/_shortcodes/video.html'), '<video controls preload="metadata" aria-label="自作Zshプロンプトの操作デモ"><source src="{{ .Get "src" }}" type="video/mp4"></video>');
put(join(scratch, 'layouts/_shortcodes/x.html'), '<p><a href="https://x.com/{{ .Get "user" }}/status/{{ .Get "id" }}">Xの投稿を読む（モックでは外部埋め込みを省略）</a></p>');
for (const [id, source] of sources) put(join(scratch, `content/${id}.md`), read(join(repo, source)));
execFileSync('hugo', ['--source', scratch, '--destination', join(scratch, 'rendered')], { stdio: 'pipe' });
const data = new Map(sources.map(([id]) => [id, JSON.parse(read(join(scratch, `rendered/${id}/index.html`)))]));
const articleAssets = join(repo, dirname(sources[0][1]));
mkdirSync(join(out, 'assets'), { recursive: true });
for (const file of readdirSync(articleAssets).filter(file => /\.(png|mp4)$/.test(file))) copyFileSync(join(articleAssets, file), join(out, 'assets', file));
for (const file of ['theme.css', 'theme.js']) copyFileSync(join(root, 'src', file), join(out, 'assets', file));
let syntax = '/* Unmodified Hugo/Chroma Catppuccin declarations; selectors scoped to each mode. */\n';
for (const mode of ['light', 'dark']) {
  const style = mode === 'light' ? 'catppuccin-latte' : 'catppuccin-mocha';
  const css = execFileSync('hugo', ['gen', 'chromastyles', '--style', style], { encoding: 'utf8' });
  syntax += css.replace(/(\.(?:bg|chroma)[^{\n]*)(\{)/g, (_, selector, brace) => selector.split(',').map(s => `[data-theme="${mode}"] ${s.trim()}`).join(', ') + ' ' + brace);
}
put(join(out, 'assets/syntax.css'), syntax);

const sunMoon = '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.1A8.4 8.4 0 0 1 9.9 4a8.5 8.5 0 1 0 10.2 10.1Z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
const toggle = `<button class="theme-toggle" type="button" lang="en" aria-label="Switch color mode">${sunMoon}</button>`;
const nav = current => `<nav class="site-nav" lang="en" aria-label="Main navigation">${['About', 'Archives', 'Categories', 'Tags'].map(name => `<a href="${name.toLowerCase()}.html"${name.toLowerCase() === current ? ' aria-current="page"' : ''}>${name}</a>`).join('')}${toggle}</nav>`;
const pages = [];
function page(file, title, content, { home = false, current = '', review = false } = {}) {
  pages.push({ file, title, review });
  put(join(out, file), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><title>${escape(title)} — shimoju.diary${review ? ' / モックレビュー' : ''}</title><link rel="icon" href="data:,"><link rel="alternate" type="application/rss+xml" title="shimoju.diary RSS" href="https://shimoju.jp/index.xml"><script src="assets/theme.js"></script><link rel="stylesheet" href="assets/syntax.css"><link rel="stylesheet" href="assets/theme.css">${testStyle}</head>
<body class="${home ? 'home' : ''}"><a class="skip-link" href="#main" lang="en">Skip to content</a>
${review ? '' : `<header class="site-header shell">${home ? '<h1 class="site-heading">' : ''}<a class="site-name" href="home.html">shimoju.diary</a>${home ? '</h1>' : ''}${nav(current)}</header>`}
<main id="main" class="shell${review ? ' review' : ''}" tabindex="-1">${content}</main>
<footer class="site-footer shell" lang="en"><nav class="footer-links" aria-label="Follow and subscribe"><a href="https://x.com/shimoju_">X</a><a href="https://github.com/shimoju">GitHub</a><a href="https://shimoju.jp/index.xml">RSS</a></nav><span>© 2026 Hiroshi Shimoju</span></footer></body></html>\n`);
}
const posts = sources.slice(0, 5).map(([id]) => ({ id, ...data.get(id) }));
const terms = kind => [...new Set(posts.flatMap(p => p[kind]))].sort((a, b) => a.localeCompare(b, 'ja'));
const termFiles = Object.fromEntries(['tags', 'categories'].map(kind => [kind, new Map(terms(kind).map((name, i) => [name, `${kind === 'tags' ? 'tag' : 'category'}-${i + 1}.html`]))]));
const heading = (title, description = '') => `<header class="page-heading"><h1>${escape(title)}</h1>${description ? `<p>${escape(description)}</p>` : ''}</header>`;
const cover = '<img src="assets/zsh-prompt-cover.png" width="1200" height="630" alt="自作したZshプロンプトを表示するGhosttyのターミナル画面">';
const date = value => `<time datetime="${value}">${value.replaceAll('-', '/')}</time>`;
const plain = html => html.replace(/<[^>]*>/g, '').trim();
function entries(items, { noSummary = false } = {}) {
  if (!items.length) return '<p class="empty">まだ記事がありません。</p>';
  return `<div class="post-list">${items.map(post => `<article class="post-entry${post.id === 'article' ? ' has-cover' : ''}"><a class="entry-link" href="${post.id}.html" aria-labelledby="entry-${post.id}">${post.id === 'article' ? `<figure class="entry-cover">${cover}</figure>` : ''}<div class="entry-text"><h2 class="entry-title" id="entry-${post.id}">${escape(post.title)}</h2><div class="meta">${date(post.date)}</div>${noSummary ? '' : `<p class="entry-summary">${plain(post.summary)}</p>`}</div></a></article>`).join('')}</div>`;
}
function pager(base, current, total) {
  const url = n => `${base}${n === 1 ? '' : `-${n}`}.html`;
  if (total <= 1) return '';
  return `<nav class="pager" lang="en" aria-label="Pagination">${current > 1 ? `<a class="previous-page" href="${url(current - 1)}" rel="prev">← Previous</a>` : ''}<span class="page-number" aria-label="Page ${current} of ${total}">${current} / ${total}</span>${current < total ? `<a class="next-page" href="${url(current + 1)}" rel="next">Next →</a>` : ''}</nav>`;
}
const intro = '<section class="intro" aria-label="紹介"><p>テクノロジーと社会、日々のこと。<br>Ruby on RailsでWebアプリケーションをつくっています。</p></section>';
for (const base of ['home', 'posts']) for (let n = 1; n <= 3; n++) {
  const home = base === 'home';
  const top = home ? (n === 1 ? intro : '') : heading('Posts');
  page(`${base}${n === 1 ? '' : `-${n}`}.html`, home ? 'Home' : 'Posts', top + entries(posts.slice((n - 1) * 2, n * 2)) + pager(base, n, 3), { home });
}
for (const kind of ['tags', 'categories']) {
  page(`${kind}.html`, kind === 'tags' ? 'Tags' : 'Categories', heading(kind === 'tags' ? 'Tags' : 'Categories') + `<ul class="terms">${terms(kind).map(name => `<li><a href="${termFiles[kind].get(name)}">${escape(name)}<small>${posts.filter(p => p[kind].includes(name)).length}</small></a></li>`).join('')}</ul>`, { current: kind });
  for (const name of terms(kind)) {
    const items = posts.filter(p => p[kind].includes(name));
    const file = termFiles[kind].get(name);
    page(file, name, heading(name, `${items.length}件の記事`) + entries(items) + pager(file.slice(0, -5), 1, 1), { current: kind });
  }
}

function decorate(html) {
  return html
    .replace(/(src=")([^"/:]+\.(?:png|mp4))"/g, '$1assets/$2"')
    .replace(/href="\/(?!\/)([^"#]*)"/g, 'href="https://shimoju.jp/$1"')
    .replace(/<table(\s[^>]*)?>[\s\S]*?<\/table>/g, table => `<div class="table-scroll" role="region" aria-label="Table, horizontally scrollable" tabindex="0">${table}</div>`);
}
function end(post) {
  const index = posts.findIndex(item => item.id === post.id);
  const older = posts[index + 1];
  const newer = index > 0 ? posts[index - 1] : null;
  const tags = (post.tags || []).map(tag => `<a href="${termFiles.tags.get(tag) || 'tags.html'}">#${escape(tag)}</a>`).join('');
  return `<footer class="article-end"><div class="article-tags" aria-label="Tags">${tags}</div><div class="engagement" lang="en"><div class="shares">${['X', 'Facebook', 'Hatena Bookmark'].map(name => `<button type="button" data-share="${name}" title="Mock: no external sharing">${name}</button>`).join('')}</div><button class="hatena-star" type="button" aria-label="Add a Hatena Star (mock)" aria-pressed="false"><span aria-hidden="true">☆</span> Hatena Star</button></div><p class="interaction-note" role="status" aria-live="polite" lang="en"></p><nav class="post-nav" aria-label="Adjacent posts">${older ? `<a href="${older.id}.html"><small lang="en">← Previous post</small>${escape(older.title)}</a>` : ''}${newer ? `<a href="${newer.id}.html"><small lang="en">Next post →</small>${escape(newer.title)}</a>` : ''}</nav></footer>`;
}
for (const post of [...posts, { id: 'specimen', ...data.get('specimen'), tags: ['Hugo'] }]) {
  const header = `<header class="article-header"><h1>${escape(post.title)}</h1><div class="meta"><span>${date(post.date)}</span>${post.id === 'specimen' ? `<span lang="en">Updated ${date('2026-09-06')}</span>` : ''}</div>${post.id === 'article' ? `<figure class="article-cover">${cover}</figure>` : ''}</header>`;
  const content = `<div class="prose">${decorate(post.body)}</div>`;
  page(`${post.id}.html`, post.title, `<article>${header}${content}${end(post)}</article>`);
}
const allLinks = [['Email', 'mailto:hiroshi.shimoju@gmail.com'], ['GitHub', 'https://github.com/shimoju'], ['Bluesky', 'https://bsky.app/profile/shimoju.jp'], ['X', 'https://x.com/shimoju_'], ['Mastodon', 'https://ruby.social/@shimoju'], ['Threads', 'https://www.threads.net/@shimoju_'], ['Instagram', 'https://www.instagram.com/shimoju_/'], ['Facebook', 'https://www.facebook.com/hiroshi.shimoju'], ['Cosense', 'https://scrapbox.io/shimoju/']];
const profileLinks = `<h2 id="profile-links">リンク</h2><ul class="profile-links">${allLinks.map(([name, url]) => `<li><a href="${url}">${name}</a></li>`).join('')}</ul>`;
const aboutBody = decorate(data.get('about').body).replace(/(<h2[^>]*>職務要約<\/h2>)/, profileLinks + '$1');
page('about.html', 'About', heading('About') + `<div class="prose"><p>このブログでは、技術のことや日々の記録を書いています。</p>${aboutBody}</div>`, { current: 'about' });
let archive = heading('Archives');
for (const year of [...new Set(posts.map(p => p.date.slice(0, 4)))]) {
  archive += `<section class="archive-year"><h2>${year}</h2>`;
  const yearPosts = posts.filter(p => p.date.startsWith(year));
  for (const month of [...new Set(yearPosts.map(p => p.date.slice(5, 7)))]) archive += `<div class="archive-month"><h3 lang="en">${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(month)-1]}</h3><ul>${yearPosts.filter(p => p.date.slice(5, 7) === month).map(p => `<li><a href="${p.id}.html" aria-labelledby="archive-${p.id}"><span id="archive-${p.id}">${escape(p.title)}</span>${date(p.date)}</a></li>`).join('')}</ul></div>`;
  archive += '</section>';
}
page('archives.html', 'Archives', archive, { current: 'archives' });
page('404.html', 'ページが見つかりません', heading('ページが見つかりません') + '<div class="prose"><p>お探しのページは移動したか、公開されていない可能性があります。</p><p><a href="home.html" lang="en">Home</a>に戻るか、<a href="archives.html" lang="en">Archives</a>から記事を探せます。</p></div>');
page('empty.html', 'Posts', heading('Posts', '0件の表示確認') + entries([]));
page('single-item.html', 'Posts', heading('Posts', '1件・要約なしの表示確認') + entries([posts[2]], { noSummary: true }));

const reviewLinks = [
  ['home.html', 'ホーム', '短い紹介・画像あり／なし・初ページ'],
  ['article.html', '記事詳細', '実記事全文・長いタイトル・1200 × 630カバー'],
  ['about.html', 'About', '実プロフィール・全リンク'],
  ['posts.html', '記事一覧', '共通の一覧部品'],
  ['tags.html', 'Tags', '分類名と件数'],
  ['categories.html', 'Categories', 'カテゴリ名と件数'],
  [termFiles.tags.get('Hugo'), '個別タグ：Hugo', '1件のタグ別一覧'],
  [termFiles.categories.get('技術'), '個別カテゴリ：技術', '複数記事のカテゴリ別一覧'],
  ['archives.html', 'Archives', '年・月ごとの一覧'],
  ['404.html', '404', '見つからないページと復帰導線'],
  ['specimen.html', '本文部品', 'H2〜H6・表・脚注・コード・縦長画像'],
  ['article-diary.html', '短い記事', 'カバー／タグなし・前後記事'],
  ['home-2.html', 'ホーム・途中ページ', '紹介なし・前／次の両方あり'],
  ['home-3.html', 'ホーム・最終ページ', '次への操作なし'],
  ['posts-2.html', '記事一覧・途中ページ', 'ページ送り'],
  ['posts-3.html', '記事一覧・最終ページ', 'ページ送り'],
  ['empty.html', '0件', '空状態'],
  ['single-item.html', '1件・要約なし', '任意要素の欠落'],
];
const options = items => items.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
page('index.html', 'モックレビュー', `<header class="review-header"><p class="eyebrow">SHIMOJU.DIARY / VISUAL STUDY 08</p><h1>文字と余白から、読む場所をつくる。</h1><p>採用済みの書体を維持し、文字と余白を相対サイズへ。<br>ブラウザの既定文字サイズを起点に、本文と見出しの比率を揃えます。</p>${toggle}</header>
<section class="review-section"><h2>今回固定したこと</h2><p>ルートはモバイル100%・デスクトップ106.25%。本文1rem、記事タイトル1.6rem、サイト名2rem、コードブロック0.875rem・行高1.5に統一しました。インラインコードは周囲に追従する0.85em、paddingは上下0.25em・左右0.35emを維持しています。</p><p class="review-note">ブラウザの既定文字サイズが16pxなら、本文17px／16px、サイト名34px／32px。本文の最大幅720pxは固定し、文字を含む操作部品は拡大と折り返しに追従します。カバー上配置、中央2段フッター、palt有効とコードへの非継承は維持しています。</p></section>
<section class="review-section"><h2>代表ページを開く</h2><p class="review-note">サイト名の書体比較は終了しました。Avenir Nextがなければ本文書体へ戻します。Webフォントは追加しません。</p><form id="comparison-form" class="review-controls"><label>代表ページ<select name="page">${options([['home.html', 'ホーム'], ['article.html', '長い実記事'], ['specimen.html', '本文部品'], ['about.html', 'About'], ['index.html', '候補順とpaltの確認']])}</select></label><label>配色<select name="theme">${options([['light', 'Latte / ライト'], ['dark', 'Mocha / ダーク']])}</select></label><button type="submit">ページを開く →</button></form><p><a href="home.html">ホーム</a> ／ <a href="article.html">長い実記事</a> ／ <a href="specimen.html#code">日本語コメントを確認</a></p></section>
<section class="review-section" id="font-check"><h2>採用した候補順とpalt</h2><p class="review-note">CSSの指定候補であり、文字ごとに実際に選ばれたフォントの特定ではありません。OSの導入状況とブラウザ設定により代替されます。</p><h3>本文・見出し</h3><code class="font-stack" data-font-stack="body"></code><ul><li>macOS／iOS：Helvetica Neue＋Hiragino Sans。</li><li>Windows：Arial＋Noto Sans JPを優先。Noto CJKは2025年3月のWindows更新でも追加されています。Notoがなければブラウザのsans-serifへ戻します。</li><li>Android：AOSPではArialがsans-serifへの別名になり、欧文はRoboto、日本語は言語別のNoto CJKフォールバック。メーカー・ブラウザ差はあり得ます。</li><li>ヒラギノ・Notoの明示候補は本文とコードで共通にし、最後は本文がsans-serif、コードがmonospaceです。</li></ul><p>日本語とEnglish、Ruby on Rails、2026年。「括弧」、句読点。Webアプリケーションの読みやすさ。</p><h3>サイトタイトル</h3><code class="font-stack" data-font-stack="site"></code><p class="review-note">Avenir Nextはサイト名だけに採用。本文や記事見出しには適用しません。</p><h3>コード・インラインコード</h3><code class="font-stack" data-font-stack="code"></code><p class="review-note">先頭のui-monospaceでSafariのSF Monoを利用し、未対応のChrome／Firefoxでは後続のMenlo（Mac）・Consolas（Windows）を使う方針です。日本語の明示候補はHiragino Sans、Noto Sans JP、Noto Sans CJK JPです。Safariではシステム側の日本語選択がこれらより優先される可能性があります。通常のNotoの日本語全角文字は基本的に等幅で、欧文は先行するコード用書体に任せます。最後はOSのmonospaceです。paltは適用せず、和欧文の幅が厳密に2:1になるとは保証しません。</p><p><code>const message = "日本語のコメントとABC 0123456789";</code></p><h3>paltの診断</h3><p class="review-note">本文と見出しはfont-feature-settings: "palt"。次の同一文だけを有効／無効で比較します。採否の選択肢ではなく、現在の描画での作用を確認する診断です。</p><div class="font-probe-scroll"><p>有効：<span class="font-probe" data-palt-probe="on">「日本語」、カタカナ。（余白）</span></p><p>無効：<span class="font-probe palt-off" data-palt-probe="off">「日本語」、カタカナ。（余白）</span></p></div></section>
<section class="review-section"><h2>基本画面</h2><p class="review-note">400px／1280px・両配色が基準。追加確認は320px／360px／768pxです。</p><ul class="review-grid">${reviewLinks.map(([url, title, note]) => `<li><a href="${url}">${title}<small>${note}</small></a></li>`).join('')}</ul></section>
<section class="review-section"><h2>操作状態の確認</h2><ul><li><a href="specimen.html#code">コードコピー・成功</a>：Copy → Copied → 3秒後にCopy。下部メッセージは表示しません。</li><li><a href="specimen.html?copy=failure#code">コードコピー・失敗</a>：Copy failedになり、再試行できます。</li><li><a href="home.html">一覧の記事全体</a>／<a href="archives.html">Archivesのタイトルと日付</a>を一つのリンクにしています。</li><li><a href="article-diary.html">シェアとはてなスター</a>：外部送信をしないローカルな表示デモ。</li><li>Tabキーで記事全体のフォーカスと移動、マウスでクリック範囲を確認できます。</li></ul><p class="review-note">初回はOS配色に追従し、手動操作後は選択を保持します。旧比較パラメーター（本文サイズ・リンク色など）は適用しません。言語とファイル名はHugoのレンダーフックから取得しています。</p></section>`, { review: true });
// A review-only paste target lets a human verify clipboard contents without sending them.
const reviewFile = join(out, 'index.html');
put(reviewFile, read(reviewFile).replace('</main>', '<section class="review-section"><h2>コピー内容の確認</h2><label for="paste-check">コードの貼り付け先（送信・保存はしません）</label><textarea id="paste-check" class="paste-check" spellcheck="false" placeholder="コピーしたコードをここに貼り付けて確認できます"></textarea></section></main>'));
put(join(out, 'manifest.json'), JSON.stringify({ generatedBy: 'node mock/build.mjs', pages, sources: sources.map(([id, source]) => ({ id, source })), reviewPages: reviewLinks.map(([file]) => file) }, null, 2) + '\n');
console.log(`Generated ${pages.length} standalone pages in ${out}`);
console.log(`Hugo fragment workspace: ${scratch}`);
