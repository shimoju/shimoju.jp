import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve(".cache/review/source");
rmSync(source, { recursive: true, force: true });
mkdirSync(`${source}/content/posts`, { recursive: true });
const articles = [
  "2026/09/01/development-environment-2026",
  "2023/06/22/hugo-and-cloudflare-pages",
  "2016/08/17/shakai-fukki",
  "2016/08/14/hikikomori",
  "2016/08/13/pasmo-autocharge",
];
for (const path of articles) {
  const target = `${source}/content/posts/${path}`;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(`../../content/posts/${path}`, target, { recursive: true });
}
const videoArticle = `${source}/content/posts/${articles[0]}/index.md`;
writeFileSync(
  videoArticle,
  readFileSync(videoArticle, "utf8").replace(
    '{{< video src="zsh-prompt-demo.mp4" >}}',
    '{{< video src="zsh-prompt-demo.mp4" width="1600" height="900" title="Zsh prompt demo" >}}',
  ),
);
// Current site data is input to the isolated review site, never a theme dependency.
const current = JSON.parse(
  execFileSync("hugo", ["config", "--format", "json"], { encoding: "utf8", cwd: "../.." }),
) as {
  title: string;
  baseurl: string;
  params: { author: string; homeinfoparams: { content: string } };
};
writeFileSync(
  `${source}/content/_index.md`,
  `---\ntitle: Home\n---\n${current.params.homeinfoparams.content}\n`,
);
for (const page of ["about", "archives"])
  writeFileSync(
    `${source}/content/${page}.md`,
    `---\ntitle: ${page === "about" ? "About" : "Archives"}\n---\nReview of this page is scheduled after R001.\n`,
  );
cpSync("tests/fixtures/offline/layouts", `${source}/layouts`, { recursive: true });
mkdirSync(`${source}/assets/images`, { recursive: true });
for (const image of ["zsh-prompt-cover.png", "neovim-cheatsheet.png"])
  cpSync(`../../content/posts/${articles[0]}/${image}`, `${source}/assets/images/${image}`);
let specimen = readFileSync("../../mock/src/specimen.md", "utf8");
// Diagnostic controls are not product UI (Q3). Preserve ordinary content and use supported inputs.
specimen = specimen.replace(/### インラインコードの余白確認[\s\S]*?(?=## 表と長い識別子)/, "");
specimen = specimen.replace(
  /### 日本語フォールバックの診断[\s\S]*?(?=### 複数行とシンタックスハイライト)/,
  "",
);
specimen = specimen.replace(
  /通常の日本語とEnglish 0123に対して、[^\n]+/,
  "通常の日本語とEnglish 0123に対して、**重要な日本語とEnglish 0123（strong）**、**注目する日本語とEnglish 0123（b）** を同じ700で表示します。**強調の中の入れ子の太字**も700を維持し、**`inline_code`** は強調の太さを継承します。",
);
specimen = specimen.replace(
  /<table class="wide-table">[\s\S]*?<\/table>/,
  "| 設定項目 | 識別子 | 内容 | 備考 |\n| --- | --- | --- | --- |\n| **APIエンドポイント** | `GET /api/v1/projects/:project_id/deployments` | デプロイ履歴の一覧を取得 | ローカルな横スクロールの検証 |\n| **環境変数** | `APPLICATION_DATABASE_CONNECTION_TIMEOUT` | 接続を待つ最大時間 | 長い英数字を含む表 |",
);
specimen = specimen.replace(
  /<figure><img src="assets\/([^"]+)"[^>]*alt="([^"]+)"[^>]*><figcaption>([^<]+)<\/figcaption><\/figure>/g,
  '{{< figure src="images/$1" alt="$2" caption="$3" >}}',
);
writeFileSync(`${source}/content/specimen.md`, specimen);
const config = {
  baseURL: current.baseurl,
  title: current.title,
  theme: "shsh",
  defaultContentLanguage: "ja",
  locale: "ja",
  timeZone: "Asia/Tokyo",
  hasCJKLanguage: true,
  mainSections: ["posts"],
  summaryLength: 140,
  pagination: { pagerSize: 2 },
  permalinks: { posts: "/:year/:month/:day/:slugorcontentbasename/" },
  markup: {
    highlight: { noClasses: false },
    goldmark: {
      renderer: { unsafe: false },
      parser: { wrapStandAloneImageWithinParagraph: false },
    },
  },
  params: {
    author: { name: current.params.author },
    socialLinks: [
      { name: "x", url: "https://x.com/shimoju_" },
      { name: "bluesky", url: "https://bsky.app/profile/shimoju.jp" },
      { name: "github", url: "https://github.com/shimoju" },
    ],
    shareServices: ["x", "facebook", "bluesky", "hatena"],
    hatenaStar: { enabled: true, author: "Shimoju" },
  },
  menus: {
    main: ["about", "archives", "categories", "tags"].map((page, i) => ({
      name: page[0]!.toUpperCase() + page.slice(1),
      pageRef: `/${page}`,
      weight: i + 1,
    })),
  },
};
writeFileSync(`${source}/hugo.json`, JSON.stringify(config));
for (const environment of ["production", "preview"])
  execFileSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve(".."),
      "--destination",
      resolve(`.cache/review/${environment}`),
      "--cacheDir",
      resolve(".cache/hugo"),
      "--environment",
      environment,
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--panicOnWarning",
      "--cleanDestinationDir",
    ],
    { stdio: "inherit" },
  );
