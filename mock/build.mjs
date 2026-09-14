import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { engagement } from './sharing.mjs';
import { icon } from './icons.mjs';

// Build-time only. Delivered site/ is plain HTML/CSS/JS and needs no Hugo runtime.
const args = process.argv.slice(2);
if (args.length > 1 || (args.length && !/^--text-scale=(1|1\.25|2)$/.test(args[0]))) {
  throw new Error('Usage: node mock/build.mjs [--text-scale=1|1.25|2]');
}
const textScale = args.length ? Number(args[0].split('=')[1]) : 1;
// Temporary layout stress test, not a change to the browser's font preferences.
const testStyle = textScale === 1 ? '' : `<style data-text-scale-test>html{font-size:${62.5 * textScale}%}</style>`;
if (textScale !== 1) console.warn(`TEST BUILD: text scale ${textScale}; restore with node mock/build.mjs before delivery.`);
const root = dirname(fileURLToPath(import.meta.url));
const repo = dirname(root);
const siteConfig = JSON.parse(execFileSync('hugo', ['config', '--format', 'json'], { cwd: repo, encoding: 'utf8' }));
const blueskyProfile = siteConfig.params.socialicons.find(link => link.name.toLowerCase() === 'bluesky').url;
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
put(join(scratch, 'layouts/single.html'), '{{ $lastmod := "" }}{{ if not .Lastmod.IsZero }}{{ $lastmod = .Lastmod.Format "2006-01-02" }}{{ end }}{{ dict "lastmod" $lastmod "title" .Title "date" (.Date.Format "2006-01-02") "tags" (.Params.tags | default slice) "categories" (.Params.categories | default slice) "body" .Content "summary" .Summary | jsonify | safeHTML }}');
put(join(scratch, 'layouts/_markup/render-codeblock.html'), read(join(root, 'src/render-codeblock.html')));
put(join(scratch, 'layouts/_shortcodes/video.html'), '<video controls preload="metadata" aria-label="自作Zshプロンプトの操作デモ"><source src="{{ .Get "src" }}" type="video/mp4"></video>');
put(join(scratch, 'layouts/_shortcodes/x.html'), '<p><a href="https://x.com/{{ .Get "user" }}/status/{{ .Get "id" }}">Xの投稿を読む（モックでは外部埋め込みを省略）</a></p>');
for (const [id, source] of sources) put(join(scratch, `content/${id}.md`), read(join(repo, source)));
execFileSync('hugo', ['--source', scratch, '--destination', join(scratch, 'rendered')], { stdio: 'pipe' });
const data = new Map(sources.map(([id]) => [id, JSON.parse(read(join(scratch, `rendered/${id}/index.html`)))]));
const articleAssets = join(repo, dirname(sources[0][1]));
mkdirSync(join(out, 'assets'), { recursive: true });
for (const file of readdirSync(articleAssets).filter(file => /\.(png|mp4)$/.test(file))) copyFileSync(join(articleAssets, file), join(out, 'assets', file));
for (const file of ['theme.css', 'theme.js', 'sharing.js']) copyFileSync(join(root, 'src', file), join(out, 'assets', file));
let syntax = '/* Unmodified Hugo/Chroma Catppuccin declarations; selectors scoped to each mode. */\n';
for (const mode of ['light', 'dark']) {
  const style = mode === 'light' ? 'catppuccin-latte' : 'catppuccin-mocha';
  const css = execFileSync('hugo', ['gen', 'chromastyles', '--style', style], { encoding: 'utf8' });
  syntax += css.replace(/(\.(?:bg|chroma)[^{\n]*)(\{)/g, (_, selector, brace) => selector.split(',').map(s => `[data-theme="${mode}"] ${s.trim()}`).join(', ') + ' ' + brace);
}
put(join(out, 'assets/syntax.css'), syntax);

const sunMoon = icon('moon') + icon('sun');
const toggle = `<button class="theme-toggle" type="button" lang="en" aria-label="Switch color mode">${sunMoon}</button>`;
const nav = current => `<nav class="site-nav" lang="en" aria-label="Main navigation">${['About', 'Archives', 'Categories', 'Tags'].map(name => `<a href="${name.toLowerCase()}.html"${name.toLowerCase() === current ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav>`;
const pages = [];
function page(file, title, content, { home = false, current = '', review = false } = {}) {
  pages.push({ file, title, review });
  put(join(out, file), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><title>${escape(title)} — shimoju.diary${review ? ' / モックレビュー' : ''}</title><link rel="icon" href="data:,"><link rel="alternate" type="application/rss+xml" title="shimoju.diary RSS" href="https://shimoju.jp/index.xml"><script src="assets/theme.js"></script><link rel="stylesheet" href="assets/syntax.css"><link rel="stylesheet" href="assets/theme.css">${testStyle}${content.includes("data-sharing-entry") ? '<script defer src="assets/sharing.js"></script>' : ''}</head>
<body class="${home ? 'home' : ''}">
${review ? '' : `<header class="site-header shell">${toggle}${home ? '<h1 class="site-heading">' : ''}<a class="site-name" href="home.html">shimoju.diary</a>${home ? '</h1>' : ''}${nav(current)}</header>`}
<main class="shell${review ? ' review' : ''}">${content}</main>
<footer class="site-footer shell" lang="en"><nav class="footer-links" aria-label="Follow and subscribe"><a class="icon-link" href="https://x.com/shimoju_" aria-label="X" title="X">${icon('x')}</a><a class="icon-link" href="${escape(blueskyProfile)}" aria-label="Bluesky" title="Bluesky">${icon('bluesky')}</a><a class="icon-link" href="https://github.com/shimoju" aria-label="GitHub" title="GitHub">${icon('github')}</a><a class="icon-link" href="https://shimoju.jp/index.xml" aria-label="RSS" title="RSS">${icon('rss')}</a></nav><span>© 2026 Hiroshi Shimoju</span></footer>
</body></html>\n`);
}
const posts = sources.slice(0, 5).map(([id, source]) => ({ id, ...data.get(id), publicUrl: `https://shimoju.jp/${source.replace('content/posts/', '').replace('/index.md', '/')}` }));
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
// One inline formatting context preserves the spaces beside the arrows inside flex links.
const navLabel = direction => `<span class="nav-label">${direction === 'prev' ? '<span aria-hidden="true">«</span> Prev' : 'Next <span aria-hidden="true">»</span>'}</span>`;
function pager(base, current, total) {
  const url = n => `${base}${n === 1 ? '' : `-${n}`}.html`;
  if (total <= 1) return '';
  return `<nav class="pager" lang="en" aria-label="Pagination">${current > 1 ? `<a class="previous-page" href="${url(current - 1)}" rel="prev">${navLabel('prev')}</a>` : ''}<span class="page-number" aria-label="Page ${current} of ${total}">${current} / ${total}</span>${current < total ? `<a class="next-page" href="${url(current + 1)}" rel="next">${navLabel('next')}</a>` : ''}</nav>`;
}
const intro = `<section class="intro" aria-label="紹介"><p>${escape(siteConfig.params.homeinfoparams.content)}</p></section>`;
for (const base of ['home', 'posts']) for (let n = 1; n <= 3; n++) {
  const home = base === 'home';
  const top = home ? (n === 1 ? intro : '') : heading('Posts');
  page(`${base}${n === 1 ? '' : `-${n}`}.html`, home ? 'Home' : 'Posts', top + entries(posts.slice((n - 1) * 2, n * 2)) + pager(base, n, 3), { home });
}
for (const kind of ['tags', 'categories']) {
  page(`${kind}.html`, kind === 'tags' ? 'Tags' : 'Categories', heading(kind === 'tags' ? 'Tags' : 'Categories') + `<ul class="terms">${terms(kind).map(name => `<li><a href="${termFiles[kind].get(name)}"><span class="term-name">${escape(name)}</span><small>${posts.filter(p => p[kind].includes(name)).length}</small></a></li>`).join('')}</ul>`, { current: kind });
  for (const name of terms(kind)) {
    const items = posts.filter(p => p[kind].includes(name));
    const file = termFiles[kind].get(name);
    page(file, name, heading(name, `${items.length}件の記事`) + entries(items) + pager(file.slice(0, -5), 1, 1), { current: kind });
  }
}

function decorate(html) {
  return html
    // Standalone Markdown images share the figure spacing used by the specimen.
    .replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g, '<figure>$1</figure>')
    .replace(/(src=")([^"/:]+\.(?:png|mp4))"/g, '$1assets/$2"')
    .replace(/href="\/(?!\/)([^"#]*)"/g, 'href="https://shimoju.jp/$1"')
    // Native fragment links; CSS controls hover/focus visibility and touch-device omission.
    .replace(/<h([2-6])([^>]*\bid="([^"]+)"[^>]*)>([\s\S]*?)<\/h\1>/g, (_, level, attrs, id, content) => `<h${level}${attrs}>${content}<a class="heading-anchor" href="#${id}" aria-label="Link to this section" title="Link to this section" lang="en"><span aria-hidden="true">#</span></a></h${level}>`)
    .replace(/<table(\s[^>]*)?>[\s\S]*?<\/table>/g, table => `<div class="table-scroll" role="region" aria-label="Table, horizontally scrollable" tabindex="0">${table}</div>`);
}
function end(post) {
  const index = posts.findIndex(item => item.id === post.id);
  const older = posts[index + 1];
  const newer = index > 0 ? posts[index - 1] : null;
  const tags = (post.tags || []).map(tag => `<a href="${termFiles.tags.get(tag) || 'tags.html'}">#${escape(tag)}</a>`).join('');
  return `<footer class="article-end"><div class="article-tags" aria-label="Tags">${tags}</div>${engagement(post)}<nav class="post-nav" id="post-navigation" aria-label="Adjacent posts">${newer ? `<a rel="prev" href="${newer.id}.html"><small lang="en">${navLabel('prev')}</small><span class="post-nav-title">${escape(newer.title)}</span></a>` : ''}${older ? `<a rel="next" href="${older.id}.html"><small lang="en">${navLabel('next')}</small><span class="post-nav-title">${escape(older.title)}</span></a>` : ''}</nav></footer>`;
}
for (const post of [...posts, { id: 'specimen', ...data.get('specimen'), tags: ['Hugo'] }, { id: 'about', ...data.get('about'), publicUrl: 'https://shimoju.jp/about/' }]) {
  const header = `<header class="article-header"><h1>${escape(post.title)}</h1><div class="meta"><span>${date(post.date)}</span>${post.lastmod && post.lastmod !== post.date ? `<span lang="en">Updated ${date(post.lastmod)}</span>` : ''}</div>${post.id === 'article' ? `<figure class="article-cover">${cover}</figure>` : ''}</header>`;
  const content = `<div class="prose">${decorate(post.body)}</div>`;
  const footer = post.id === 'about' ? `<footer class="article-end">${engagement(post)}</footer>` : end(post);
  page(`${post.id}.html`, post.title, `<article>${header}${content}${footer}</article>`, { current: post.id === 'about' ? 'about' : '' });
}
let archive = heading('Archives');
for (const year of [...new Set(posts.map(p => p.date.slice(0, 4)))]) {
  archive += `<section class="archive-year"><h2>${year}</h2>`;
  const yearPosts = posts.filter(p => p.date.startsWith(year));
  for (const month of [...new Set(yearPosts.map(p => p.date.slice(5, 7)))]) archive += `<div class="archive-month"><h3 lang="en">${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(month)-1]}</h3><ul>${yearPosts.filter(p => p.date.slice(5, 7) === month).map(p => `<li><a href="${p.id}.html" aria-labelledby="archive-${p.id}"><span class="archive-title" id="archive-${p.id}">${escape(p.title)}</span>${date(p.date)}</a></li>`).join('')}</ul></div>`;
  archive += '</section>';
}
page('archives.html', 'Archives', archive, { current: 'archives' });
page('404.html', 'ページが見つかりません', heading('ページが見つかりません') + '<div class="prose"><p>お探しのページは移動したか、公開されていない可能性があります。</p><p><a href="home.html" lang="en">Home</a>に戻るか、<a href="archives.html" lang="en">Archives</a>から記事を探せます。</p></div>');
page('empty.html', 'Posts', heading('Posts', '0件の表示確認') + entries([]));
page('single-item.html', 'Posts', heading('Posts', '1件・要約なしの表示確認') + entries([posts[2]], { noSummary: true }));

const reviewLinks = [
  ['home.html', 'ホーム', '現行の紹介・画像あり／なし・初ページ'],
  ['article.html', '記事詳細', '実記事全文・長いタイトル・1200 × 630カバー'],
  ['about.html', 'About', '現行のプロフィール本文'],
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
page('index.html', 'モックレビュー', `<header class="review-header"><p class="eyebrow">SHIMOJU.DIARY / MOCK REVIEW</p><h1>文字と余白から、読む場所をつくる。</h1><p>Apple標準＋Segoe UIを採用。<br>画面幅・配色ごとに、和欧文の組版と読み心地を確認します。</p>${toggle}</header>
<section class="review-section"><h2>今回固定したこと</h2><p>補助文字は本文の0.910／0.829／0.754倍、一覧タイトルは1.207倍。画像・動画・表・コードの前後余白は1.931em、大きな区切りは本文サイズの2.560／3.089／3.394／4.096倍です。</p><p>ルートは全画面幅で62.5%、本文は1.7rem。H6→H1は本文の1、1.099、1.207、1.326、1.456、1.6倍、サイト名は1.931倍を本文基準トークンで指定します。コードブロックは本文から独立した1.4rem・行高1.3です。インラインコードは周囲に追従する0.85em、paddingは上下0.25em・左右0.35emを維持しています。</p><p class="review-note">ブラウザの既定文字サイズが16pxなら、本文17px、サイト名約32.83px、コードブロック14px。Safariの和文が小さく描画される実測を踏まえ、モバイルも同じ指定にしています。本文の最大幅720pxは固定し、文字を含む操作部品は拡大と折り返しに追従します。カバー上配置、中央2段フッター、palt有効とコードへの非継承は維持しています。</p></section>
<section class="review-section"><h2>代表ページを開く</h2><p class="review-note">採用した候補順は-apple-system、BlinkMacSystemFont、Segoe UI、Hiragino Sans、Noto Sans JP、Noto Sans CJK JP、sans-serifです。Apple標準の指定だけでは和文がNotoにフォールバックする場合に備え、Hiragino Sansを明示します。Windowsの欧文はSegoe UIを優先し、ヒラギノがある場合の和文はヒラギノを優先します。サイト名も本文・見出しと同じ書体にします。本文400、見出し500・サイト名300、strong／b・thは700、サイズ・行高・paltも共通です。</p><form id="comparison-form" class="review-controls"><label>代表ページ<select name="page">${options([['home.html', 'ホーム'], ['home-2.html', 'ホーム・前後ページあり'], ['tags.html', 'タグ一覧'], ['archives.html', 'Archives'], ['article.html', '長い実記事・Nextのみ'], ['article-hugo.html', '前後記事あり'], ['article-pasmo.html', 'Prevのみ'], ['specimen.html', '本文部品'], ['about.html', 'About'], ['index.html', '候補順とpaltの確認']])}</select></label><label>配色<select name="theme">${options([['light', 'Latte / ライト'], ['dark', 'Mocha / ダーク']])}</select></label><button type="submit">ページを開く</button></form><p class="review-note">配色ボタンはヘッダー右上に独立して配置し、サイト名と文字ナビをそれぞれ中央に揃えます。48px相当の操作領域と上下8px相当の余裕を確保します。操作領域の右端を本文領域の右端に揃え、SVGの光学的な右補正は行いません。</p><p class="review-note">前後記事は全画面幅で横並び、一覧のページ送りと同じく左が新しい記事（Prev）、右が古い記事（Next）です。「前後記事あり」「Prevのみ」「Nextのみ」で確認できます。左右同幅・列間はデスクトップ24px／モバイル16pxとし、タイトルは省略せず折り返します。独立したリンク・ボタンの最小高さは4.8remです。ヘッダーナビ・タグ・カテゴリのリンクには最小幅を設けず、内容幅と4px刻みの横gapで文字間隔を整えます。ページ送り・アイコンなどは最小幅も4.8remを確保します。UI寸法は4px相当刻みとし、コード本文の左右と言語ラベルの左は16px相当で共通化しています。角丸は大8px・小4px、ページ左右余白は基本24px、狭いホバー不可環境のみ16pxで、ホバー可能環境では見出しリンク幅以上を確保します。アイコンの絵柄は小16px・標準24px相当、文字サイズは維持しています。本文内リンク・脚注・はてなスターは変更しません。</p><p class="review-note">フォントは全ページで共通です。以下の同文サンプルで、欧文・和文に選ばれた実フォントと500の太さを確認できます。ユーザーのWindows実機ではSegoe UIの500でSemiboldを確認済みです。</p><p><a href="home.html">ホーム</a> ／ <a href="article.html">長い実記事</a> ／ <a href="specimen.html#code">日本語コメントを確認</a></p></section>
<section class="review-section"><h2>サイトタイトル</h2><p class="site-title-sample"><a class="site-name" href="home.html">shimoju.diary</a></p><p class="review-note">サイトタイトルは本文と同じ書体でウェイト300を採用しました。Windowsでも適用を確認済みです。サイズは本文の1.931倍とし、本文400・記事見出し500・強調700との軽重でリズムをつくります。</p></section>\n<section class="review-section"><h2>本文見出しの余白</h2><p>本文内のH2〜H6は前2.121em・後0.687emを基本とし、連続する下位見出しの前は0.910emにします。直後の段落の上marginは0とし、見出しの下marginで距離を決めます。各見出し自身の文字サイズに追従します。本文の先頭要素が見出しの場合は上余白0とし、記事タイトルの余白は変更しません。実記事・About・本文部品で、連続見出しや段落とのまとまりを確認できます。</p></section>\n<section class="review-section" id="weight-check"><h2>200・300・400・500・700の実フォントを確認</h2><p class="review-note">同じ文章を同じサイズ・行高で表示します。200／300の細さと、500が400より適切に太くなるか確認してください。各行は診断用の固定ウェイトです。strongや見出しからの継承ではなく、各行へ数値を直接指定しています。</p><p data-weight-probe="200" style="font-weight: 200">200：株式会社SmartHR・日本語とEnglish 0123456789 ← → ■ □ ▲ ▼ ∩ ≡</p><p data-weight-probe="300" style="font-weight: 300">300：株式会社SmartHR・日本語とEnglish 0123456789 ← → ■ □ ▲ ▼ ∩ ≡</p><p data-weight-probe="400" style="font-weight: 400">400：株式会社SmartHR・日本語とEnglish 0123456789 ← → ■ □ ▲ ▼ ∩ ≡</p><p data-weight-probe="500" style="font-weight: 500">500：株式会社SmartHR・日本語とEnglish 0123456789 ← → ■ □ ▲ ▼ ∩ ≡</p><p data-weight-probe="700" style="font-weight: 700">700：株式会社SmartHR・日本語とEnglish 0123456789 ← → ■ □ ▲ ▼ ∩ ≡</p></section>\n<section class="review-section" id="font-check"><h2>現在の候補順とpalt</h2><p class="review-note">CSSの指定候補であり、文字ごとに実際に選ばれたフォントの特定ではありません。OSの導入状況とブラウザ設定により代替されます。候補がなければsans-serifへ委ねます。Yu Gothic UIを明示指定せず、WindowsのシステムUI書体にも委ねませんが、最終フォールバックで選ばれる書体までは禁止できません。</p><h3>本文・見出し</h3><code class="font-stack" data-font-stack="body"></code><ul><li>macOS／iOS：Apple標準のSan Franciscoとヒラギノを想定。和文の補完にHiragino Sansを明示します。</li><li>Windows：Segoe UI＋Noto Sans JPを優先（ヒラギノ導入時の和文はヒラギノ）。Noto CJKは2025年3月のWindows更新でも追加されています。Notoがなければブラウザのsans-serifへ戻します。</li><li>Linux／Android：利用できるNoto候補、なければsans-serifへ委ねます。特定の欧文書体を保証しません。</li><li>コードはMenlo, Consolas, monospaceとし、和文候補は明示しません。</li></ul><p>日本語とEnglish、Ruby on Rails、2026年。「括弧」、句読点。Webアプリケーションの読みやすさ。</p><h3>サイトタイトル</h3><code class="font-stack" data-font-stack="site"></code><p class="review-note">本文・見出しと同じ書体で300。</p><h3>コード・インラインコード</h3><code class="font-stack" data-font-stack="code"></code><p class="review-note">採用確定：MacはMenlo、WindowsはConsolasを優先します。それ以外の環境と和文はブラウザのmonospace・不足文字のフォールバックに委ね、本文の和文書体との統一は求めません。欧文の等幅性を守るため、日本語向けのプロポーショナル書体は候補に含めません。palt・合字・自動カーニングは無効。実際の和文の字幅と読みやすさは実機で確認し、和欧文の厳密な2:1の幅比は保証しません。</p><p><code>const message = "日本語のコメントとABC 0123456789";</code></p><h3>paltの診断</h3><p class="review-note">本文と見出しはfont-feature-settings: "palt"。次の同一文だけを有効／無効で比較します。採否の選択肢ではなく、現在の描画での作用を確認する診断です。</p><div class="font-probe-scroll"><p>有効：<span class="font-probe" data-palt-probe="on">「日本語」、カタカナ。（余白）</span></p><p>無効：<span class="font-probe palt-off" data-palt-probe="off">「日本語」、カタカナ。（余白）</span></p></div></section>
<section class="review-section"><h2>基本画面</h2><p class="review-note">400px／1280px・両配色が基準。追加確認は320px／360px／768pxです。</p><ul class="review-grid">${reviewLinks.map(([url, title, note]) => `<li><a href="${url}">${title}<small>${note}</small></a></li>`).join('')}</ul></section>
<section class="review-section"><h2>操作状態の確認</h2><ul><li><a href="specimen.html#code">コードコピー・成功</a>：コピーアイコン → チェック → 3秒後にコピーアイコン。ホバー・フォーカス・タップで表示します。下部メッセージは表示しません。</li><li><a href="specimen.html?copy=failure#code">コードコピー・失敗</a>：×のアイコンとCopy failedの通知になり、再試行できます。</li><li><a href="home.html">一覧の記事全体</a>／<a href="archives.html">Archivesのタイトルと日付</a>を一つのリンクにしています。</li><li><a href="article-diary.html">シェアとはてなスター</a>：実サービスに接続します。投稿確定・スター追加は公開記事に反映されます。</li><li>Tabキーで記事全体のフォーカスと移動、マウスでクリック範囲を確認できます。</li></ul><p class="review-note">初回はOS配色に追従し、手動操作後は選択を保持します。旧比較パラメーター（本文サイズ・リンク色など）は適用しません。言語とファイル名はHugoのレンダーフックから取得しています。</p></section>`, { review: true });
// A review-only paste target lets a human verify clipboard contents without sending them.
const reviewFile = join(out, 'index.html');
put(reviewFile, read(reviewFile).replace('</main>', '<section class="review-section"><h2>コピー内容の確認</h2><label for="paste-check">コードの貼り付け先（送信・保存はしません）</label><textarea id="paste-check" class="paste-check" spellcheck="false" placeholder="コピーしたコードをここに貼り付けて確認できます"></textarea></section></main>'));
put(join(out, 'manifest.json'), JSON.stringify({ generatedBy: 'node mock/build.mjs', pages, sources: sources.map(([id, source]) => ({ id, source })), reviewPages: reviewLinks.map(([file]) => file) }, null, 2) + '\n');
console.log(`Generated ${pages.length} standalone pages in ${out}`);
console.log(`Hugo fragment workspace: ${scratch}`);
