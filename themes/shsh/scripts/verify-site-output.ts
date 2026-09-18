import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { HtmlValidate } from "html-validate";

const config = JSON.parse(readFileSync(".htmlvalidate.json", "utf8"));
// Minified HTML legitimately omits quotes and uses unambiguous ampersands.
// These are the validator's documented HTML5 options; syntax rules stay enabled.
// https://html-validate.org/rules/attr-quotes.html
// https://html-validate.org/rules/no-raw-characters.html
config.rules["attr-quotes"] = ["error", { style: "any", unquoted: true }];
config.rules["no-raw-characters"] = ["error", { relaxed: true }];
const validator = new HtmlValidate(config);
const baseline = JSON.parse(readFileSync("tests/baseline/migration.json", "utf8")) as {
  content: { title: string }[];
};
// F015: preserve the exact pre-existing long titles, never shorten content for a SEO heuristic.
const preservedTitles = baseline.content
  .map((p) => p.title + " — shimoju.diary")
  .filter((t) => t.length > 70);
assert.equal(preservedTitles.length, 2);
assert.equal((await validator.validateString('<p id=a"b>Broken &invalid;</p>')).valid, false);
assert.equal((await validator.validateString("<img src=missing.png>")).valid, false);
const results: { environment: string; path: string; messages: unknown[] }[] = [];
for (const environment of ["production", "preview"]) {
  const root = `.cache/site/${environment}`;
  for (const path of readdirSync(root, { recursive: true, encoding: "utf8" }).filter((f) =>
    f.endsWith(".html"),
  )) {
    const html = readFileSync(`${root}/${path}`, "utf8");
    const report = await validator.validateString(html);
    const messages = report.results
      .flatMap((r) => r.messages)
      .filter(
        (m) =>
          !(
            m.ruleId === "long-title" &&
            preservedTitles.some((title) => html.includes(`<title>${title}</title>`))
          ),
      );
    results.push({ environment, path, messages });
  }
}
mkdirSync(".cache/migration-results", { recursive: true });
writeFileSync(".cache/migration-results/html.json", JSON.stringify(results, null, 2));
const failures = results.filter((r) => r.messages.length);
assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 3), null, 2));
console.log(
  `All ${results.length} production/preview HTML files valid; F015 exact-title length exception only.`,
);
