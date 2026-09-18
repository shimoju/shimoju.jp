import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve(".cache/screens/source");
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
// Current site data is input to the isolated screen fixture, never a theme dependency.
const current = JSON.parse(
  execFileSync("hugo", ["config", "--format", "json"], { encoding: "utf8", cwd: "../.." }),
) as {
  title: string;
  baseurl: string;
  params: { author: { name: string } };
};
cpSync("../../content/_index.md", `${source}/content/_index.md`);
cpSync("../../content/about.md", `${source}/content/about.md`);
cpSync("../../content/archives.md", `${source}/content/archives.md`);
writeFileSync(`${source}/content/undated.md`, "---\ntitle: Undated\n---\nNo date.\n");
writeFileSync(
  `${source}/content/hidden-dates.md`,
  "---\ntitle: Hidden dates\ndate: 2026-01-01\nlastmod: 2026-02-01\nshowDates: false\n---\nDates remain in metadata.\n",
);
cpSync("tests/fixtures/offline/layouts", `${source}/layouts`, { recursive: true });
mkdirSync(`${source}/assets/images`, { recursive: true });
for (const image of ["zsh-prompt-cover.png", "neovim-cheatsheet.png"])
  cpSync(`../../content/posts/${articles[0]}/${image}`, `${source}/assets/images/${image}`);
cpSync("tests/fixtures/screens/specimen.md", `${source}/content/specimen.md`);
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
    author: { name: current.params.author.name },
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
      resolve(`.cache/screens/${environment}`),
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
