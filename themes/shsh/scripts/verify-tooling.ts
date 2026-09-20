import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { formatTemplate } from "./format-template.ts";
import { HtmlValidate } from "html-validate";
import stylelint from "stylelint";
import { buildHugo } from "./build-hugo.ts";

const root = resolve(".");
const scratch = join(root, ".cache/tooling");
mkdirSync(scratch, { recursive: true });
const timings: Record<string, number> = {};
function put(path: string, text: string) {
  const file = join(scratch, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}
function command(bin: string, args: string[]) {
  return execFileSync(bin, args, { encoding: "utf8", cwd: root });
}
function timed(name: string, action: () => void) {
  const started = performance.now();
  action();
  timings[name] = Math.round(performance.now() - started);
}

// These are adversarial inputs, not theme templates. Whitespace on either side
// of inline tags, Go trim markers and attributes is observable in browser tests.
const templates: Record<string, string> = {
  "home.html": `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{{ .Title }}</title>
<style>{{ (resources.Get "main.css" | css.Build).Content | safeCSS }}</style>
</head><body><main><h1>{{ .Title }}</h1>
{{- $label := "World" -}}
<p id="inline">Hello <span title="{{ printf "%s & %s" $label "friends" }}">{{ $label }}</span>!</p>
<p id="trim">A {{- "B" -}} C</p>
<p id="attribute"><a href="{{ "/page/?x=1&y=2" | relURL }}" title="{{ .Title }}">Link</a></p>
{{ .Content }}
<button type="button">Run</button></main><script>{{ (resources.Get "main.ts" | js.Build).Content | safeJS }}</script></body></html>`,
  "_markup/render-link.html": `<a href="{{ .Destination | safeURL }}"{{ with .Title }} title="{{ . }}"{{ end }}>{{ .Text | safeHTML }}</a>{{- /* Keep adjacent inline text adjacent. */ -}}`,
};
put(
  "hugo.toml",
  `baseURL = 'https://fixture.invalid/'\ntitle = 'Tool fixture'\ndisableKinds = ['taxonomy', 'term', 'RSS', 'sitemap']\n`,
);
put(
  "content/_index.md",
  '---\ntitle: Tool fixture\n---\nBefore [inline *emphasis*](https://example.org/ "A title") after.\n\n[One](https://example.org/)[Two](https://example.org/)suffix.\n',
);
put("assets/base.css", readFileSync("tests/fixtures/tooling/base.css", "utf8"));
put("assets/main.css", '@import "base.css";\np { font-size: 17px; }\n');
put("assets/main.ts", readFileSync("tests/fixtures/tooling/browser.ts", "utf8"));
for (const [path, source] of Object.entries(templates)) put(`layouts/${path}`, source);
const build = (output: string) =>
  buildHugo({ source: scratch, destination: join(scratch, output), quiet: true });
timed("hugo_before_ms", () => {
  build("before");
});
const formatStarted = performance.now();
for (const [path, source] of Object.entries(templates)) {
  const formatted = await formatTemplate(source);
  assert.equal(await formatTemplate(formatted), formatted, `Formatter idempotence: ${path}`);
  put(`layouts/${path}`, formatted);
}
timings.template_format_ms = Math.round(performance.now() - formatStarted);
timed("hugo_after_ms", () => {
  build("after");
});
const html = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const phase of ["before", "after"]) {
  const report = await html.validateString(
    readFileSync(join(scratch, phase, "index.html"), "utf8"),
  );
  assert.ok(report.valid, JSON.stringify(report.results));
}
assert.equal(
  (await html.validateString('<img src="x">')).valid,
  false,
  "HTML validator must catch missing alt",
);
assert.equal(
  (await stylelint.lint({ code: "a { colro: red; }", configFile: ".stylelintrc.json" })).errored,
  true,
  "CSS validator must catch unknown properties",
);

put(
  "timings.json",
  JSON.stringify(
    { node: process.version, hugo: command("hugo", ["version"]).trim(), timings },
    null,
    2,
  ) + "\n",
);
console.log(
  "Toolchain probes passed. Hugo/formatter output is ready for three-engine browser comparison.",
);
console.log(timings);
