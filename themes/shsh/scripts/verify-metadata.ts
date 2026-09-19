import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { HtmlValidate } from "html-validate";

const root = resolve(".cache/metadata");
rmSync(root, { recursive: true, force: true });
const source = `${root}/source`;
mkdirSync(source, { recursive: true });
const config = {
  baseURL: "https://metadata.invalid/blog/",
  title: "別サイト",
  theme: "shsh",
  defaultContentLanguage: "ja",
  locale: "ja",
  timeZone: "Asia/Tokyo",
  mainSections: ["posts", "notes"],
  summaryLength: 140,
  hasCJKLanguage: true,
  enableRobotsTXT: true,
  pagination: { pagerSize: 2 },
  markup: { goldmark: { parser: { wrapStandAloneImageWithinParagraph: false } } },
  params: { author: { name: '別著者 & "引用"' }, description: "サイト & 説明" },
};
function page(path: string, front: object, body = "本文の自動要約。") {
  const file = `${source}/content/${path}.md`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(front) + `\n${body}\n`);
}
const common = {
  title: "記事",
  date: "2026-09-01T10:00:00+09:00",
  tags: ["A & B", "空"],
  categories: ["技術 & 日記"],
};
page(
  "posts/a/index",
  {
    ...common,
    title: '日 & <x> "引" </script>',
    lastmod: "2026-09-02T12:00:00+09:00",
    publishDate: "2020-01-01",
    summary: "**要約** & [link](https://example.org/) &lt;記号&gt;",
    description: "SEO & <em>説明</em>",
    cover: { image: "cover.png", alt: "Cover" },
  },
  "Manual before.\n\n<!--more-->\n\nAfter divider.",
);
page("posts/b", { ...common }, "**手動要約** & &lt;記号&gt;\n\n<!--more-->\n\nAfter divider.");
page("notes/c", { ...common, date: "2026-08-31T15:00:00Z", summary: "" });
for (let i = 0; i < 10; i++)
  page(`posts/old-${i}`, { ...common, date: `2020-01-${String(i + 1).padStart(2, "0")}` });
page("about", {
  title: "固定ページ",
  date: "2021-01-01",
  lastmod: "2022-01-01",
  showDates: false,
  tags: ["A & B"],
  categories: ["技術 & 日記"],
});
page("undated", { title: "日付なし" });
page("first-image", { title: "本文画像だけ" }, "![本文画像](/default.png)");
page("tags/a & b/_index", {
  title: "A & B",
  description: "分類説明 & <記号>",
  summary: "分類要約 & **説明**",
});
page("tags/empty/_index", { title: "Empty & none" });
for (const [name, front] of Object.entries({
  draft: { draft: true },
  future: { date: "2027-01-01" },
  scheduled: { publishDate: "2027-01-01" },
  expired: { expiryDate: "2020-01-01" },
}))
  page(`posts/${name}`, { ...common, ...front });
for (const file of [
  "content/posts/a/cover.png",
  "assets/default.png",
  "static/default.png",
  "content/posts/a/bundle-only.png",
]) {
  mkdirSync(dirname(`${source}/${file}`), { recursive: true });
  cpSync("tests/fixtures/media/assets/small.png", `${source}/${file}`);
}
function build(
  name: string,
  params: object = {},
  environment = "production",
  overrides: object = {},
) {
  writeFileSync(
    `${source}/hugo.json`,
    JSON.stringify({ ...config, ...overrides, params: { ...config.params, ...params } }),
  );
  return spawnSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve(".."),
      "--destination",
      `${root}/${name}`,
      "--cacheDir",
      resolve(".cache/hugo"),
      "--environment",
      environment,
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--cleanDestinationDir",
      "--panicOnWarning",
    ],
    { encoding: "utf8" },
  );
}
const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const [name, params, environment, overrides] of [
  ["production", {}, "production", {}],
  ["assets", { defaultShareImage: "default.png" }, "production", {}],
  ["static", { defaultShareImage: "/default.png?v=1&x=2" }, "production", {}],
  ["external", { defaultShareImage: "https://images.invalid/image.png?a=1&b=2" }, "production", {}],
  ["protocol", { defaultShareImage: "//images.invalid/image.png" }, "production", {}],
  ["preview", {}, "preview", { baseURL: "https://preview.invalid/" }],
] as const) {
  const result = build(name, params, environment, overrides);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const file of readdirSync(`${root}/${name}`, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".html"))) {
    const report = await validator.validateString(readFileSync(`${root}/${name}/${file}`, "utf8"));
    assert.ok(
      report.valid,
      `${name}/${file}: ${JSON.stringify(report.results.map((r) => r.messages))}`,
    );
  }
}
for (const [params, expected] of [
  [{ defaultShareImage: "missing.png" }, /unresolved local media/],
  [{ defaultShareImage: "bundle-only.png" }, /unresolved local media/],
  [{ defaultShareImage: 42 }, /defaultshareimage must be a string/],
  [{ defaultShareImage: false }, /defaultshareimage must be a string/],
  [{ description: ["wrong"] }, /description must be a string/],
] as const) {
  const result = build("invalid", params);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, expected);
}
page("undated", { title: "日付なし", description: false });
const invalid = build("invalid");
assert.notEqual(invalid.status, 0);
assert.match(invalid.stdout + invalid.stderr, /description must be a string/);
// A separately empty site must not fabricate feed dates or require article front matter.
rmSync(`${source}/content`, { recursive: true });
const empty = build("empty");
assert.equal(empty.status, 0, empty.stdout + empty.stderr);
console.log(
  "Metadata fixtures: all HTML valid; asset/static/external defaults, bundle isolation, input failures, preview and empty feed built. XML/head assertions run in metadata.spec.ts.",
);
