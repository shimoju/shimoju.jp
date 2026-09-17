import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { HtmlValidate } from "html-validate";

const root = resolve(".cache/sharing");
rmSync(root, { recursive: true, force: true });
mkdirSync(`${root}/content/posts`, { recursive: true });
const title = '日本語 & <記号> "引用" #hash 100%';
for (const path of ["document", "posts/article"])
  writeFileSync(
    `${root}/content/${path}.md`,
    JSON.stringify({ title, date: "2026-09-01" }) + "\n本文を読む。\n",
  );
const config = {
  baseURL: "https://sharing.invalid/",
  title: "Sharing fixture",
  theme: "shsh",
  defaultContentLanguage: "ja",
  locale: "ja",
  mainSections: ["posts"],
  params: { author: { name: "Example writer" } },
};
const sharing = {
  shareServices: ["x", "facebook", "bluesky", "hatena"],
  hatenaStar: { enabled: true, author: "example-author" },
};
function build(
  params: object,
  environment = "production",
  destination = "probe",
  baseURL = config.baseURL,
) {
  writeFileSync(
    `${root}/hugo.json`,
    JSON.stringify({ ...config, baseURL, params: { ...config.params, ...params } }),
  );
  return spawnSync(
    "hugo",
    [
      "--source",
      root,
      "--themesDir",
      resolve("themes"),
      "--destination",
      `${root}/${destination}`,
      "--environment",
      environment,
      "--cleanDestinationDir",
      "--panicOnWarning",
    ],
    { encoding: "utf8" },
  );
}
function success(
  params: object,
  environment = "production",
  destination = "probe",
  baseURL = config.baseURL,
) {
  const result = build(params, environment, destination, baseURL);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return readFileSync(`${root}/${destination}/document/index.html`, "utf8");
}
let html = success({});
assert.doesNotMatch(html, /class="article-end"|sharing\.[a-f0-9]+\.js|data-hatena-star-container/);
html = success({ shareServices: ["hatena", "x"], hatenaStar: { enabled: false } });
assert.match(html, /View on Hatena Bookmark/);
assert.ok(html.indexOf('title="Hatena Bookmark"') < html.indexOf('title="X"'));
assert.doesNotMatch(html, /data-hatena-star-container|sharing\.[a-f0-9]+\.js/);
html = success({ hatenaStar: { enabled: true } });
assert.match(html, /data-hatena-star-container/);
assert.doesNotMatch(html, /class="share-icons"/);
html = success({ shareServices: ["hatena"] }, "production", "probe", "http://sharing.invalid/");
assert.match(html, /href="https:\/\/b.hatena.ne.jp\/entry\/sharing.invalid\/document\/"/);
for (const [params, expected] of [
  [{ shareServices: "x" }, /shareServices must be a list/],
  [{ shareServices: ["unknown"] }, /unknown share service/],
  [{ shareServices: [42] }, /unknown share service/],
  [{ hatenaStar: false }, /hatenaStar must be a map/],
  [{ hatenaStar: { enabled: "false" } }, /hatenaStar.enabled must be boolean/],
  [{ hatenaStar: { author: 42 } }, /hatenaStar.author must be a string/],
] as const) {
  const result = build(params);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, expected);
}
const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const environment of ["production", "preview"]) {
  const baseURL = environment === "production" ? config.baseURL : "https://preview.invalid/";
  success(sharing, environment, environment, baseURL);
  for (const path of ["document", "posts/article"]) {
    html = readFileSync(`${root}/${environment}/${path}/index.html`, "utf8");
    const report = await validator.validateString(html);
    assert.ok(report.valid, JSON.stringify(report.results.map((r) => r.messages)));
    assert.match(html, /rel="author" href="https:\/\/www.hatena.ne.jp\/example-author\/"/);
    if (environment === "production") {
      assert.match(html, new RegExp(`data-hatena-star-url="${baseURL}${path}/"`));
      assert.equal([...html.matchAll(/class="icon-link share-icon"/g)].length, 4);
    } else {
      assert.doesNotMatch(
        html,
        /data-hatena-star-container|sharing\.[a-f0-9]+\.js|href="https:\/\/(?:x.com\/intent|bsky.app\/intent|www.facebook.com\/sharer|b.hatena.ne.jp\/entry)/,
      );
      assert.equal([...html.matchAll(/\sdisabled\s/g)].length, 4);
      assert.match(html, /noindex,nofollow/);
    }
  }
  const home = readFileSync(`${root}/${environment}/index.html`, "utf8");
  assert.doesNotMatch(home, /class="engagement"|sharing\.[a-f0-9]+\.js/);
}
console.log(
  "Sharing: defaults, ordered services, fixed pages/posts, escaped title/URLs, author setting, invalid inputs and preview isolation passed.",
);
