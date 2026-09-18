import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

type Screen = { name: string; title: string; mock: string; url: string };
const cases = JSON.parse(readFileSync(".cache/full-review/cases.json", "utf8")) as Screen[];
const target = "docs/verification/t010";
mkdirSync(`${target}/images`, { recursive: true });
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const rows = cases
  .map(
    (screen) =>
      `<section id="${screen.name}"><h2>${escape(screen.title)} <small>${screen.mock}</small></h2>${[
        1440, 390,
      ]
        .flatMap((width) =>
          ["light", "dark"].map((color) => {
            const label = `${width}px / ${color}`;
            const pair = ["shsh", "mock"]
              .map((side) => {
                const name = `${screen.name}-${width}-${color}-${side}.png`;
                cpSync(`.cache/full-review/images/${name}`, `${target}/images/${name}`);
                return `<figure><figcaption><a href="images/${name}">${side}・原寸</a></figcaption><img loading="lazy" src="images/${name}" alt="${escape(screen.title)} ${label} ${side}"></figure>`;
              })
              .join("");
            return `<details><summary>${label}</summary><div class="pair">${pair}</div></details>`;
          }),
        )
        .join("")}</section>`,
  )
  .join("\n");
for (const kind of ["metrics", "axe"]) {
  const records = Object.fromEntries(
    readdirSync(`.cache/full-review/${kind}`)
      .filter((file) => file.endsWith(".json"))
      .map((file) => [
        file,
        JSON.parse(readFileSync(`.cache/full-review/${kind}/${file}`, "utf8")) as unknown,
      ]),
  );
  writeFileSync(`${target}/${kind}.json`, JSON.stringify(records));
}
writeFileSync(`${target}/cases.json`, JSON.stringify(cases, null, 2));
writeFileSync(
  `${target}/index.html`,
  `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>T010 全画面比較</title><style>
:root{color-scheme:light dark;font:16px/1.7 -apple-system,BlinkMacSystemFont,sans-serif}body{max-width:1500px;margin:32px auto;padding:0 20px}a{color:inherit}nav{display:flex;flex-wrap:wrap;gap:16px}h1{font-size:1.6rem}h2{margin-top:2.5rem}small{font-size:.8rem;font-weight:400}summary{cursor:pointer;padding:12px 0}details{border-top:1px solid #888}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}figure{margin:0}figcaption{padding:8px;text-align:center}img{max-width:100%;height:auto;display:block;margin:auto}
</style></head><body><h1>T010 承認済み共通設計の全画面展開</h1>
<p>凍結モック40画面とshshの1440px／390px・両配色の比較です。左が実装、右がモックです。外部ウィジェットは固定応答、Xはモックと同じリンク表示の比較用shortcodeです。本番埋め込み・実機・性能・配信の確認を示すものではありません。</p>
<p>Aboutの空の表見出しはaxe検査で不合格（F014）。修正案はユーザー判断待ちです。この比較はT010の途中成果であり、全画面レビューR002は移行照合後に提出します。</p>
<p><a href="../full-screen-expansion.md">構造・検証・残件</a> ／ <a href="cases.json">全画面対応表</a> ／ <a href="metrics.json">3エンジンの寸法</a> ／ <a href="axe.json">axe検査結果</a></p>
<nav aria-label="比較画面">${cases.map((screen) => `<a href="#${screen.name}">${screen.name}</a>`).join("")}</nav>${rows}</body></html>\n`,
);
console.log(`Full-screen report: ${target}/index.html`);
