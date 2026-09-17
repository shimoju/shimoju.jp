import { cpSync, mkdirSync, writeFileSync } from "node:fs";

const target = "docs/verification/r001";
mkdirSync(target, { recursive: true });
cpSync(".cache/review-images", `${target}/images`, { recursive: true });
const sections = [
  ["home", "ホーム"],
  ["posts", "記事一覧"],
  ["article", "実記事"],
  ["specimen", "本文部品"],
] as const;
const cards = sections
  .map(
    ([name, label]) =>
      `<section id="${name}"><h2>${label}</h2>${[1440, 390]
        .flatMap((width) =>
          ["light", "dark"].map((color) => {
            const condition = `${width === 1440 ? "PC 1440×1000" : "モバイル 390×844・タッチ"} / ${color === "light" ? "ライト" : "ダーク"}`;
            return `<details${name === "home" && width === 390 && color === "light" ? " open" : ""}><summary>${condition}</summary><div class="pair">${[
              "shsh",
              "mock",
            ]
              .map((side) => {
                const title = side === "shsh" ? "shsh実装" : "凍結モック";
                const file = `images/${name}-${width}-${color}-${side}.png`;
                return `<figure><figcaption><a href="${file}" target="_blank" rel="noopener">${title}（原寸を開く）</a></figcaption><img loading="lazy" src="${file}" alt="${label}・${condition}・${title}"></figure>`;
              })
              .join("")}</div></details>`;
          }),
        )
        .join("")}</section>`,
  )
  .join("\n");
writeFileSync(
  `${target}/index.html`,
  `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>R001 代表画面レビュー</title><style>
:root { color-scheme: light dark; font: 16px/1.7 -apple-system, BlinkMacSystemFont, sans-serif; }
body { max-width: 1500px; margin: 32px auto; padding: 0 20px; }
a { color: inherit; }
nav { display: flex; flex-wrap: wrap; gap: 20px; }
h1 { font-size: 1.6rem; } h2 { margin-top: 2.5rem; }
summary { cursor: pointer; padding: 12px 0; }
details { border-top: 1px solid #888; }
.pair { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; align-items: start; }
figure { margin: 0; text-align: center; } figcaption { padding: 8px; }
img { max-width: 100%; height: auto; display: block; margin: auto; }
.note { max-width: 70em; }
</style></head><body><header><h1>R001 代表画面と共通設計</h1>
<p class="note">ホーム・一覧・実記事・本文部品の比較です。左がshsh、右が凍結モック。画像はクリックすると原寸で開けます。</p>
<nav aria-label="比較対象">${sections.map(([name, label]) => `<a href="#${name}">${label}</a>`).join("")}<a href="../r001-review.md">構造・差分・検証範囲</a></nav>
<p><a href="http://127.0.0.1:4185/" target="_blank" rel="noopener">実装を操作する</a> ／ <a href="http://127.0.0.1:4186/" target="_blank" rel="noopener">プレビュー</a> ／ <a href="http://127.0.0.1:4187/home.html" target="_blank" rel="noopener">モック</a></p>
<p class="note">記事末尾のタグ・前後記事、About／Archives／分類等は、共通設計の承認後に実装します。本文部品ではモック専用の文字・余白診断を除外しています。比較画像の外部ウィジェットは未読込です。実機・性能・配信検証と本番移行は未完了です。</p>
</header><main>${cards}</main></body></html>\n`,
);
console.log(`Review report: ${target}/index.html`);
