import assert from "node:assert/strict";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { HtmlValidate, Parser, type HtmlElement } from "html-validate";
import { buildHugo } from "./build-hugo.ts";

const root = resolve(".cache/prose");
rmSync(root, { recursive: true, force: true });
mkdirSync(`${root}/content/posts`, { recursive: true });
const config = {
  baseURL: "https://prose.invalid/",
  title: "Prose",
  defaultContentLanguage: "ja",
  locale: "ja",
  theme: "shsh",
  timeZone: "Asia/Tokyo",
  mainSections: ["posts"],
  params: { author: { name: "Author" } },
};
writeFileSync(`${root}/hugo.json`, JSON.stringify(config));
for (const [name, params] of Object.entries({
  absent: {},
  fallback: { publishDate: "2020-01-01" },
  same: { date: "2020-01-01T23:30:00Z", lastmod: "2020-01-02T20:00:00+09:00" },
  different: { date: "2020-01-01T23:30:00Z", lastmod: "2020-01-02T23:30:00Z" },
  hidden: { date: "2020-01-01", lastmod: "2020-01-02", params: { showDates: false } },
  "posts/visible": { date: "2020-01-01", params: { showDates: false } },
}))
  writeFileSync(
    `${root}/content/${name}.md`,
    `${JSON.stringify({ title: name, ...params })}\nText\n`,
  );
cpSync(
  "tests/fixtures/articles/2023/06/22/hugo-and-cloudflare-pages/index.md",
  `${root}/content/real.md`,
);
cpSync("tests/fixtures/representative/content/specimen.md", `${root}/content/specimen.md`);
function build(destination = "public") {
  return buildHugo({
    source: root,
    destination: `${root}/${destination}`,
    check: false,
  });
}
let result = build();
assert.equal(result.status, 0, result.stdout + result.stderr);
const html = (name: string) => readFileSync(`${root}/public/${name}/index.html`, "utf8");
assert.doesNotMatch(html("absent"), /class="meta"/);
assert.match(html("fallback"), /2020\/01\/01/);
assert.doesNotMatch(html("same"), /Updated/);
assert.match(html("different"), /Updated/);
assert.match(html("different"), /2020\/01\/03/);
assert.doesNotMatch(html("hidden"), /class="meta"/);
assert.match(html("posts/visible"), /2020\/01\/01/);
const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const name of ["real", "specimen"]) {
  const report = await validator.validateString(html(name));
  assert.ok(report.valid, JSON.stringify(report.results.map((entry) => entry.messages)));
}
// Palette switching needs classes, regardless of the site's highlighting default.
// The specimen covers known/unknown/absent languages, inline/table line numbers and emphasis.
const parserConfig = await validator.getConfigFor("inline.html");
function codeBlocks(source: string) {
  const parser = new Parser(parserConfig);
  const starts = new WeakMap<HtmlElement, number>();
  const blocks: string[] = [];
  parser.on("tag:start", (_event, { target, location }) => {
    starts.set(target, location.offset);
  });
  parser.on("tag:end", (_event, { previous, target, location }) => {
    if (!previous.matches(".code-block")) return;
    const start = starts.get(previous);
    assert.notEqual(start, undefined);
    assert.equal(target?.tagName, "div");
    // Keep the original markup, including nested wrappers and explicit tbody tags.
    blocks.push(source.slice(start, location.offset + location.size));
  });
  parser.parseHtml(source);
  return blocks;
}
const defaultCode = codeBlocks(html("specimen"));
assert.equal(defaultCode.length, 5);
for (const block of defaultCode) {
  assert.match(block, /<div class="highlight">/);
  const pres = [...block.matchAll(/<pre\b[^>]*>/g)];
  assert.ok(pres.length > 0);
  for (const [pre] of pres) assert.match(pre, /class="chroma"/);
  assert.doesNotMatch(block, /\sstyle=/);
  // The copy script inserts its controls; rendered content keeps only code and its label.
  assert.doesNotMatch(block, /<(button|svg)\b|copy-feedback/);
}
assert.match(defaultCode[2]!, /<table class="lntable">\s*<tbody>/);
assert.equal([...defaultCode[2]!.matchAll(/<td class="lntd">/g)].length, 2);
assert.match(defaultCode[0]!, /<span class="s2">/); // Ruby tokens must actually be highlighted.
for (const noClasses of [true, false]) {
  writeFileSync(
    `${root}/hugo.json`,
    JSON.stringify({ ...config, markup: { highlight: { noClasses } } }),
  );
  const destination = `highlight-${noClasses}`;
  result = build(destination);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(
    codeBlocks(readFileSync(`${root}/${destination}/specimen/index.html`, "utf8")),
    defaultCode,
    `Site noClasses=${noClasses} must not change the theme's code rendering`,
  );
}
writeFileSync(`${root}/hugo.json`, JSON.stringify(config));
// Confirm legal Hugo footnote IDs while retaining errors for empty/whitespace IDs.
for (const id of ["", "a b"]) {
  const report = await validator.validateString(`<div id="${id}"></div>`);
  assert.ok(
    report.results.some((entry) => entry.messages.some((message) => message.ruleId === "valid-id")),
  );
}
writeFileSync(
  `${root}/content/invalid.md`,
  '{"title":"Invalid","params":{"showDates":"false"}}\nText',
);
result = build("invalid");
assert.notEqual(result.status, 0);
assert.match(result.stdout + result.stderr, /showDates must be boolean/);
rmSync(`${root}/content/invalid.md`);
const headings = (source: string) =>
  [...source.matchAll(/<h[1-6] id="([^"]+)"/g)].map((match) => match[1]);
const expected = new Map(["real", "specimen"].map((name) => [name, headings(html(name))]));
// Independent native Hugo renderer: no theme or render hooks, same Markdown and Hugo version.
writeFileSync(
  `${root}/hugo.json`,
  JSON.stringify({
    ...config,
    theme: undefined,
    disableKinds: ["home", "section", "taxonomy", "term", "RSS", "sitemap"],
  }),
);
mkdirSync(`${root}/layouts`, { recursive: true });
writeFileSync(`${root}/layouts/single.html`, "{{ .Content }}");
result = build("native");
assert.equal(result.status, 0, result.stdout + result.stderr);
for (const name of ["real", "specimen"])
  assert.deepEqual(
    expected.get(name),
    headings(readFileSync(`${root}/native/${name}/index.html`, "utf8")),
  );
console.log(
  "Prose: date fallback/day boundaries/visibility/types, class-based code with default/true/false noClasses, legal footnote IDs, full real article HTML and native heading IDs passed.",
);
