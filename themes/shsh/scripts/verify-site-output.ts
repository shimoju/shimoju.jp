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
// Keep the two existing long titles; the SEO length heuristic is not invalid HTML.
const preservedTitles = [
  "2026年、開発環境を一新した。Ghostty、herdr、Neovim、mise、そして自作Zshプロンプト — shimoju.diary",
  "Sidekiq + Heroku RedisでERROR: ERR max number of clients reachedと言われたら — shimoju.diary",
];
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
mkdirSync(".cache/site-results", { recursive: true });
writeFileSync(".cache/site-results/html.json", JSON.stringify(results, null, 2));
const failures = results.filter((r) => r.messages.length);
assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 3), null, 2));
console.log(
  `All ${results.length} production/preview HTML files valid; exact-title length exception only.`,
);
