import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".cache/r002");
const source = `${root}/source`;
rmSync(source, { recursive: true, force: true });
cpSync(".cache/site/source", source, { recursive: true });
const about = readFileSync(`${source}/content/about.md`, "utf8");
assert.ok(
  about.includes("| 業務経験 | 技術 | 経験年数 |"),
  "F014 approved headings must be present",
);
execFileSync(
  "hugo",
  [
    "--source",
    source,
    "--themesDir",
    resolve(".."),
    "--destination",
    `${root}/proposal`,
    "--environment",
    "preview",
    "--baseURL",
    "https://preview.invalid/",
    "--clock",
    "2026-09-17T12:00:00+09:00",
    "--cacheDir",
    resolve(".cache/hugo"),
    "--panicOnWarning",
    "--cleanDestinationDir",
  ],
  { stdio: "inherit" },
);
assert.equal(
  readFileSync("../../content/about.md", "utf8"),
  about,
  "Review build may not mutate site content",
);
const target = "docs/verification/r002";
mkdirSync(`${target}/images`, { recursive: true });
const tables = [1440, 390]
  .flatMap((width) =>
    ["light", "dark"].map(
      (color) =>
        `<details><summary>${width}px・${color}</summary><div class="pair">${["before", "proposal"].map((side) => `<figure><figcaption>${side === "before" ? "修正前（履歴）" : "承認・反映後（F014）"}</figcaption><a href="${side === "before" ? `images/about-${width}-${color}-before.png` : `../t026/images/about-${width}-${color}-current.png`}"><img src="${side === "before" ? `images/about-${width}-${color}-before.png` : `../t026/images/about-${width}-${color}-current.png`}" alt="About表 ${width}px ${color} ${side}" loading="lazy"></a></figure>`).join("")}</div></details>`,
    ),
  )
  .join("");
writeFileSync(
  `${target}/index.html`,
  `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R002 全画面レビュー</title><style>
:root{color-scheme:light dark;font:16px/1.8 -apple-system,BlinkMacSystemFont,sans-serif}body{max-width:1100px;margin:40px auto;padding:0 24px}a{color:inherit}h1{font-size:1.7rem}h2{font-size:1.3rem;margin-top:2.5rem}nav{display:flex;flex-wrap:wrap;gap:12px 24px}.note{border-left:4px solid #888;padding:8px 20px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0}figcaption{padding:12px 0}img{max-width:100%;height:auto}summary{cursor:pointer;padding:12px 0}details{border-top:1px solid #888}table{border-collapse:collapse;width:100%}th:first-child{white-space:nowrap}th,td{padding:10px;border-bottom:1px solid #888;text-align:left}code{overflow-wrap:anywhere}@media(max-width:640px){.pair{grid-template-columns:1fr}}
</style></head><body><header><h1>R002 全画面レビュー</h1><p>代表画面・共通設計のR004承認後に展開した全画面と、サイト移行・検証結果を確認する入口です。</p></header>
<main><nav aria-label="レビュー内容"><a href="#screens">画面</a><a href="#about">About修正結果</a><a href="#verification">検証</a><a href="#remaining">残件・判断</a></nav>
<section id="screens"><h2>全画面と共通構造</h2><p><a href="../t010/">T010時点の40画面比較（PC／モバイル・両配色、320画像）</a>。Aboutの最新表示は下のF014修正結果を参照してください。</p><nav aria-label="実装プレビュー"><a href="http://127.0.0.1:4212/">全記事を含むプレビュー</a><a href="http://127.0.0.1:4212/about/">About</a><a href="http://127.0.0.1:4212/archives/">Archives</a><a href="http://127.0.0.1:4212/tags/">Tags</a><a href="http://127.0.0.1:4212/categories/">Categories</a><a href="http://127.0.0.1:4212/404.html">404</a></nav><p>プレビューは共有・スターを無効化し、本文の外部埋め込みを維持しています。<a href="http://127.0.0.1:4211/">外部通信を固定した全記事版</a>・<a href="http://127.0.0.1:4214/">凍結モック</a>も参照できます。</p><p><a href="../full-screen-expansion.md">テンプレート・CSSの共通化と全画面の責務</a> ／ <a href="../r003-review.md">承認済み共通設計の構造説明</a></p></section>
<section id="about"><h2>承認・反映済み：Aboutの列見出し（F014）</h2><p class="note">2026-09-18にユーザーが「業務経験／技術／経験年数」を承認し、About入力へ反映しました。経歴・技術・年数は維持し、凍結モックは変更していません。修正前の画像を履歴として残し、承認後の表示と比較できます。再検証はT026に記録します。</p><p><a href="http://127.0.0.1:4213/about/">承認後のAboutを開く</a></p>${tables}</section>
<section id="verification"><h2>検証結果</h2><table><thead><tr><th scope="col">対象</th><th scope="col">結果</th></tr></thead><tbody><tr><th scope="row">画面・操作</th><td>T026で承認済みF014を期待値へ反映して統合検査を再実行。<a href="../about-headings.md">最新結果とログ</a>を参照。40画面の比較と125/200%文字拡大を検査。</td></tr><tr><th scope="row">移行</th><td>59記事＋About＋Archives、170 HTML・48 RSSを照合。本文・見出しID・リンク・素材の意図しない欠落なし。64コードと142配信画像の実寸を検査。</td></tr><tr><th scope="row">外部接続</th><td>46埋め込みの入力・位置・URLを検査。4サービス×本番／previewで代表投稿の表示を確認。</td></tr><tr><th scope="row">性能</th><td>固定モバイル条件で2記事×5回すべてLCP≤2.5秒／CLS≤0.1。中央値LCP 1.196秒／0.532秒、CLS 0／0.0064。</td></tr></tbody></table><p><a href="../output-migration.md">全公開出力・CI</a> ／ <a href="../site-input-migration.md">入力移行・実接続</a> ／ <a href="../mobile-performance.md">性能条件・全試行・trace</a> ／ <a href="../r002-review.md">承認差分・レビュー手順</a></p></section>
<section id="remaining"><h2>残件と今回の判断</h2><p>全画面の表示・操作・構造について承認または修正点をお願いします。F014の見出し案は承認済みで、R002全体の判断とは分けて記録しています。</p><p>Safariの限定確認とCloudflareの既存配信調査は記録済みです。実フォント・他端末、GitHub上のCI、移行後のCloudflare配信は未確認です。今回の画面レビューと移行完了の判定を分けて記録します。</p></section></main></body></html>\n`,
);
console.log("R002 submission generated; F014 approved headings are reflected in site content.");
