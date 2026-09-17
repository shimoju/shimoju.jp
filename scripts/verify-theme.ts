import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { HtmlValidate } from "html-validate";

const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const environment of ["production", "preview", "development"]) {
  const root = `.cache/representative/${environment}`;
  for (const path of readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) =>
    file.endsWith(".html"),
  )) {
    const html = readFileSync(`${root}/${path}`, "utf8");
    const report = await validator.validateString(html);
    assert.ok(report.valid, `${path}: ${JSON.stringify(report.results)}`);
    assert.doesNotMatch(html, /shimoju|Hiroshi|mock-theme|theme=light/);
    assert.match(html, /lang="ja"/);
    if (environment === "production") assert.doesNotMatch(html, /noindex/);
    else assert.match(html, /noindex,nofollow/);
  }
  const files = readdirSync(root, { recursive: true, encoding: "utf8" });
  const html = readFileSync(`${root}/index.html`, "utf8");
  if (environment === "development") {
    assert.ok(files.some((file) => file.endsWith(".css.map")));
    assert.ok(files.some((file) => file.endsWith(".js.map")));
  } else {
    assert.ok(!files.some((file) => file.endsWith(".map")));
    assert.match(html, /\/css\/shsh\.[a-f0-9]{64}\.css/);
    assert.match(html, /\/js\/theme\.[a-f0-9]{64}\.js/);
    assert.match(html, /integrity="sha256-/);
  }
}
const source = resolve(".cache/representative/source");
const config = resolve(".cache/representative/case.json");
const destination = resolve(".cache/representative/case");
function build(overrides: object) {
  writeFileSync(config, JSON.stringify(overrides));
  return spawnSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve("themes"),
      "--config",
      `hugo.toml,${config}`,
      "--destination",
      destination,
      "--cleanDestinationDir",
    ],
    { encoding: "utf8" },
  );
}
for (const [params, diagnostic] of [
  [{ author: "Wrong shape" }, "params.author must be a map"],
  [{ socialLinks: false }, "params.socialLinks must be a list"],
  [{ socialLinks: [{ name: "unknown", url: "https://example.org/" }] }, "unknown social icon"],
  [{ socialLinks: [{ name: "github", url: 42 }] }, "name and url must be strings"],
  [{ showRSS: "yes" }, "params.showRSS must be boolean"],
] as const) {
  const result = build({ params });
  assert.notEqual(result.status, 0, diagnostic);
  assert.ok((result.stdout + result.stderr).includes(diagnostic), result.stdout + result.stderr);
}
const menu = build({ menus: { main: [{ name: "Missing", pageRef: "/does-not-exist" }] } });
assert.notEqual(menu.status, 0);
assert.match(menu.stdout + menu.stderr, /unresolved menu pageRef/);
const menuURL = build({ menus: { main: [{ name: "Missing", url: "/does-not-exist/" }] } });
assert.notEqual(menuURL.status, 0);
assert.match(menuURL.stdout + menuURL.stderr, /unresolved internal menu URL/);
const validMenuURL = build({ menus: { main: [{ name: "About", url: "/about/" }] } });
assert.equal(validMenuURL.status, 0, validMenuURL.stdout + validMenuURL.stderr);
const minimal = resolve(".cache/minimal");
mkdirSync(`${minimal}/content`, { recursive: true });
writeFileSync(
  `${minimal}/hugo.toml`,
  `baseURL='https://alternate.invalid/'\ntitle='Other title'\ntheme='shsh'\n[params.author]\nname='Other author'\n`,
);
writeFileSync(`${minimal}/content/_index.md`, "A different site.");
execFileSync("hugo", ["--source", minimal, "--themesDir", resolve("themes"), "--quiet"]);
const html = readFileSync(`${minimal}/public/index.html`, "utf8");
assert.match(html, /Other author/);
assert.doesNotMatch(html, /Example author|shimoju|github.com/);
console.log(
  "Theme foundation: HTML, production/preview/development assets, invalid configuration and minimal alternative site passed.",
);
