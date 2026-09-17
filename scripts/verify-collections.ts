import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve(".cache/collections");
const base = {
  baseURL: "https://collection.invalid/",
  title: "Collection test",
  theme: "shsh",
  hasCJKLanguage: true,
  summaryLength: 140,
  timeZone: "Asia/Tokyo",
  mainSections: ["posts", "notes"],
  params: { author: { name: "Author" } },
};
function build(files: Record<string, string>, config: object = {}) {
  rmSync(source, { recursive: true, force: true });
  mkdirSync(source, { recursive: true });
  writeFileSync(`${source}/hugo.json`, JSON.stringify({ ...base, ...config }));
  for (const [name, content] of Object.entries(files)) {
    const path = `${source}/content/${name}.md`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return spawnSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve("themes"),
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--panicOnWarning",
    ],
    { encoding: "utf8" },
  );
}
function pass(files: Record<string, string>, config: object = {}) {
  const result = build(files, config);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return readFileSync(`${source}/public/index.html`, "utf8");
}
function post(params: object = {}, body = "Automatic summary.") {
  return `${JSON.stringify({ title: "Article", date: "2026-09-01T00:00:00+09:00", ...params })}\n${body}\n`;
}
function paths(html: string) {
  return [...html.matchAll(/class="entry-link"\s+href="([^"]+)"/g)].map((match) => match[1]);
}
let html = pass({});
assert.match(html, /No posts yet/);
assert.doesNotMatch(html, /class="pager"/);
html = pass({ "posts/one": post({ summary: "" }) });
assert.equal(paths(html).length, 1);
assert.doesNotMatch(html, /entry-summary|class="pager"/);
const dozen = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [`posts/p${String(i).padStart(2, "0")}`, post()]),
);
html = pass(dozen);
assert.equal(paths(html).length, 10);
assert.match(html, /1 \/ 2/);
assert.equal(paths(readFileSync(`${source}/public/page/2/index.html`, "utf8")).length, 2);
html = pass(dozen, { pagination: { pagerSize: 2 } });
assert.equal(paths(html).length, 2);
assert.match(html, /1 \/ 6/);

html = pass({
  "posts/z": post({ title: "A title", date: "2026-09-01T00:00:00+09:00" }),
  "posts/a": post({ title: "Z title", date: "2026-08-31T15:00:00Z", publishDate: "2020-01-01" }),
  "notes/n": post({ date: "2026-09-01T00:00:00.000000001+09:00" }),
  about: post({ date: "2026-09-17" }),
  "posts/draft": post({ draft: true }),
  "posts/future": post({ date: "2027-01-01" }),
  "posts/scheduled": post({ publishDate: "2027-01-01" }),
  "posts/expired": post({ expiryDate: "2020-01-01" }),
});
assert.deepEqual(paths(html), ["/notes/n/", "/posts/a/", "/posts/z/"]);
assert.match(html, /2026\/09\/01/);
assert.doesNotMatch(html, /2026\/08\/31/);
assert.deepEqual(paths(readFileSync(`${source}/public/posts/index.html`, "utf8")), [
  "/posts/a/",
  "/posts/z/",
]);

html = pass({
  "posts/explicit": post(
    { summary: "**Explicit** & [link](https://example.org/) &lt;tag&gt;", description: "SEO only" },
    "Manual text.\n\n<!--more-->\n\nAfter divider.",
  ),
});
assert.match(html, /class="entry-summary">Explicit &amp; link &lt;tag&gt;<\/p>/);
assert.doesNotMatch(html.split("<body")[1]!, /Manual text|After divider|SEO only/);
html = pass({ "posts/manual": post({}, "**Manual** & text.\n\n<!--more-->\n\nAfter divider.") });
assert.match(html, /class="entry-summary">Manual &amp; text\.<\/p>/);
assert.doesNotMatch(html, /After divider/);
html = pass({ "posts/empty": post({ summary: "" }, "Manual.\n\n<!--more-->\n\nRest.") });
assert.doesNotMatch(html, /entry-summary/);
html = pass({ "posts/auto": post({}, "Automatic summary.") });
assert.match(html, /class="entry-summary">Automatic summary\.<\/p>/);
// Preserve the site's summaryLength=140 with Hugo automatic paragraph boundaries.
html = pass({
  "posts/cjk": post({ isCJKLanguage: true }, ("あ".repeat(10) + "。\n\n").repeat(30)),
});
const automatic = html.match(/class="entry-summary">([^<]+)</)?.[1] ?? "";
assert.ok(automatic.length >= 140 && automatic.length < 170, automatic);

for (const [name, content] of Object.entries({
  yaml: "---\ntitle: YAML\ndate: 2020-01-01\n---\nText\n",
  toml: '+++\ntitle="TOML"\ndate=2020-01-01T00:00:00Z\n+++\nText\n',
  json: '{\n"title": "JSON", "params": {"nested": true},\n"date": "2020-01-01"\n}\nText\n',
}))
  pass({ [`posts/${name}`]: content });
for (const content of [
  post({ date: undefined, publishDate: "2020-01-01" }),
  "---\ntitle: No date\n---\ndate: 2020-01-01\n",
  post({ date: "" }),
]) {
  const result = build({ "posts/missing": content });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /requires explicit date/);
}
for (const summary of [false, 42, ["Wrong"]]) {
  const result = build({ "posts/invalid": post({ summary }) });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /summary must be a string/);
}
html = pass({ "posts/date": post() }, { params: { ...base.params, dateFormat: "Jan 2, 2006" } });
assert.match(html, /Sep 1, 2026/);
const invalidFormat = build(
  { "posts/date": post() },
  { params: { ...base.params, dateFormat: 42 } },
);
assert.notEqual(invalidFormat.status, 0);
assert.match(invalidFormat.stdout + invalidFormat.stderr, /dateFormat must be a string/);
console.log(
  "Collections: empty/single/default10/custom2, UTC ties, mainSections, publication filters, summaries, dates and invalid inputs passed.",
);
