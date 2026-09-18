import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("../..");
// Read the current published inputs using the same source and clock as the build.
const csv = execFileSync(
  "hugo",
  [
    "list",
    "published",
    "--source",
    resolve(".cache/site/source"),
    "--themesDir",
    resolve(".."),
    "--clock",
    "2026-09-17T12:00:00+09:00",
  ],
  { encoding: "utf8" },
);
const rows: string[][] = [];
let row: string[] = [];
for (const match of csv.matchAll(/(?:"((?:[^"]|"")*)"|([^,\r\n]*))(,|\r?\n|$)/g)) {
  if (!match[0]) continue;
  row.push(match[1] !== undefined ? match[1].replaceAll('""', '"') : match[2]!);
  if (match[3] !== ",") {
    rows.push(row);
    row = [];
  }
}
const fields = rows.shift()!;
assert.ok(fields.includes("permalink") && fields.includes("section"));
const pages = rows.map((values) =>
  Object.fromEntries(fields.map((field, i) => [field, values[i]!])),
);
assert.ok(pages.length > 0);
const config = JSON.parse(
  execFileSync("hugo", ["config", "--format", "json"], { cwd: root, encoding: "utf8" }),
) as {
  theme: string[];
  mainsections: string[];
  timezone: string;
  markup: {
    goldmark: {
      renderer?: { unsafe?: boolean };
      parser: { wrapstandaloneimagewithinparagraph: boolean };
    };
    highlight: { noclasses: boolean };
  };
  params: {
    author: { name: string };
    shareservices: string[];
    hatenaStar?: unknown;
    hatenastar: { enabled: boolean; author: string };
    sociallinks: { name: string; url: string }[];
  };
  pagination: { pagersize: number };
  enablerobotstxt: boolean;
};
assert.deepEqual(config.theme, ["shsh"]);
assert.deepEqual(config.mainsections, ["posts"]);
assert.equal(config.timezone, "Asia/Tokyo");
assert.equal(config.markup.goldmark.renderer?.unsafe ?? false, false);
assert.equal(config.markup.goldmark.parser.wrapstandaloneimagewithinparagraph ?? false, false);
assert.equal(config.markup.highlight.noclasses ?? false, false);
assert.equal(config.enablerobotstxt, true);
assert.equal(config.pagination.pagersize, 10);
assert.equal(config.params.author.name, "Hiroshi Shimoju");
assert.deepEqual(config.params.shareservices, ["x", "facebook", "bluesky", "hatena"]);
assert.deepEqual(
  config.params.sociallinks.map((item) => item.name),
  ["x", "bluesky", "github"],
);
assert.deepEqual(config.params.hatenastar, { enabled: true, author: "Shimoju" });
assert.match(
  readFileSync(`${root}/static/_redirects`, "utf8"),
  /^\/feed\.xml\s+\/index\.xml\s+301$/m,
);
const embeds: { path: string; service: string; input: string }[] = [];
const markdown = readdirSync(`${root}/content`, { recursive: true, encoding: "utf8" }).filter(
  (file) => file.endsWith(".md"),
);
for (const file of markdown) {
  const text = readFileSync(`${root}/content/${file}`, "utf8");
  if (!pages.some((page) => page.path === `content/${file}`)) continue;
  for (const match of text.matchAll(/\{\{< (x|instagram|youtube|speakerdeck|video) ([^]*?) >\}\}/g))
    embeds.push({ path: `content/${file}`, service: match[1]!, input: match[2]! });
  assert.doesNotMatch(
    text,
    /<(?:blockquote class="instagram-media"|script async|iframe|video)\b/,
    file,
  );
}
for (const mode of ["production", "preview"]) {
  const destination = `.cache/site/${mode}`;
  const output = (path: string) => readFileSync(`${destination}/${path}`, "utf8");
  assert.ok(existsSync(`${destination}/robots.txt`));
  assert.ok(existsSync(`${destination}/404.html`));
  assert.ok(!existsSync(`${destination}/specimen/index.html`));
  assert.ok(!existsSync(`${destination}/undated/index.html`));
  for (const [service, count] of [
    ["x", embeds.filter((e) => e.service === "x").length],
    ["instagram", embeds.filter((e) => e.service === "instagram").length],
    ["youtube", embeds.filter((e) => e.service === "youtube").length],
  ] as const) {
    let found = 0;
    for (const file of readdirSync(destination, { recursive: true, encoding: "utf8" }).filter((f) =>
      f.endsWith(".html"),
    ))
      found += (
        output(file).match(new RegExp(`data-offline-embed=["']?${service}["' >]`, "g")) ?? []
      ).length;
    assert.equal(found, count, `${mode}/${service}`);
  }
  const article = output("2026/09/01/development-environment-2026/index.html");
  assert.match(article, /<video[^>]+width=["']?1440["' ]/);
  assert.match(article, /<video[^>]+height=["']?1076["' ]/);
  assert.match(article, /<video[^>]+controls/);
  assert.doesNotMatch(article, /<video[^>]+(?:autoplay|loop|muted)/);
  assert.ok(
    !readdirSync(destination, { recursive: true, encoding: "utf8" }).some((f) =>
      f.endsWith(".map"),
    ),
  );
  if (mode === "preview") {
    assert.match(output("index.html"), /noindex/);
    assert.doesNotMatch(article, /data-hatena-star-container|https:\/\/s\.hatena\.ne\.jp/);
    assert.match(article, /unavailable in preview/);
    assert.ok(article.includes("https://preview.invalid/2026/09/01/development-environment-2026/"));
  } else assert.ok(article.includes("https://shimoju.jp/2026/09/01/development-environment-2026/"));
}
writeFileSync(".cache/site/inputs.json", JSON.stringify({ pages, embeds }, null, 2));
console.log(
  `Site inputs: ${pages.length} published pages and ${embeds.length} embeds verified. Offline production/preview passed.`,
);
