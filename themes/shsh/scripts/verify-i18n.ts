import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildHugo } from "./build-hugo.ts";
import { messages, t, type Language, type Message } from "./i18n.ts";

const bundled = { en: messages("en"), ja: messages("ja") };
const texts = (message: Message) =>
  typeof message === "string" ? [message] : Object.values(message);
const placeholders = (message: Message) =>
  new Set(
    texts(message).flatMap((text) => [...text.matchAll(/\{\{ \.(\w+) \}\}/g)].map((m) => m[1]!)),
  );

// Both bundled languages define the same keys, plural forms and template data.
assert.deepEqual(Object.keys(bundled.ja).sort(), Object.keys(bundled.en).sort());
for (const [key, en] of Object.entries(bundled.en)) {
  const ja = bundled.ja[key]!;
  if (typeof en === "string") assert.equal(typeof ja, "string", `${key}: same form`);
  else {
    assert.ok(en.one && en.other, `${key}: English needs one and other`);
    assert.ok(typeof ja !== "string" && ja.other, `${key}: Japanese needs other`);
  }
  // A translation may leave data out, but cannot use data the templates never pass.
  for (const name of placeholders(ja)) assert.ok(placeholders(en).has(name), `${key}: .${name}`);
  // An identical value would be untranslated English.
  assert.notDeepEqual(ja, en, `${key}: translate the Japanese value`);
}

// Templates use every bundled key and only bundled keys, and hold no English UI literals.
const templates = readdirSync("layouts", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".html"))
  .map((file) => ({ file, source: readFileSync(`layouts/${file}`, "utf8") }));
const used = new Set(
  templates.flatMap(({ source }) => [...source.matchAll(/\bT "(\w+)"/g)].map((m) => m[1]!)),
);
assert.ok(templates.some(({ source }) => source.includes('T (printf "no_terms_%s"')));
for (const key of used) assert.ok(key in bundled.en, `layouts use undefined UI text ${key}`);
for (const key of Object.keys(bundled.en))
  assert.ok(used.has(key) || key.startsWith("no_terms_"), `unused UI text ${key}`);
const names = new Set(["RSS"]);
for (const { file, source } of templates) {
  const literal = source.replace(/\{\{[\s\S]*?\}\}/g, "\0");
  const attributes = literal.matchAll(
    /\s(aria-label|title|alt|data-[\w-]*(?:label|message|notice|failed)[\w-]*)="([^"]*)"/g,
  );
  for (const [, name, value] of attributes)
    assert.ok(
      !/[A-Za-z]{2}/.test(value!) || names.has(value!.replaceAll("\0", "").trim()),
      `${file}: ${name}="${value}"`,
    );
  for (const [, text] of literal.matchAll(/>([^<>]*)</g))
    assert.ok(!/[A-Za-z]{2}/.test(text!), `${file}: text "${text!.trim()}"`);
}

// English output from the same fixture, so the English bundle stays complete and wired.
const english = resolve(".cache/representative-en");
const overlay = resolve(".cache/representative/english.json");
writeFileSync(overlay, JSON.stringify({ locale: "en", defaultContentLanguage: "en" }));
buildHugo({
  source: resolve(".cache/representative/source"),
  config: `hugo.toml,${overlay}`,
  destination: english,
  quiet: true,
});
const page = (path: string) => readFileSync(`${english}/${path}`, "utf8");
const en = (key: string, data = {}) => t(key, data, "en");
for (const [path, expected] of [
  ["index.html", '<html lang="en">'],
  ["index.html", `aria-label="${en("main_navigation")}"`],
  ["index.html", `aria-label="${en("page_of", { Current: 1, Total: 3 })}"`],
  ["index.html", `${en("older")} <span aria-hidden="true">»</span>`],
  ["page/2/index.html", `<span aria-hidden="true">«</span> ${en("newer")}`],
  ["tags/日本語/index.html", `<p>${en("posts_count", { Count: 3 })}</p>`],
  ["specimen/index.html", `aria-label="${en("copy_code")}"`],
  ["specimen/index.html", `aria-label="${en("code_scroll")}"`],
  ["specimen/index.html", `aria-label="${en("table_scroll", { Number: 1 })}"`],
  ["specimen/index.html", `aria-label="${en("heading_link", { Heading: "読みやすさ" })}"`],
  ["404.html", `<h1>${en("not_found")}</h1>`],
] as const)
  assert.ok(page(path).includes(expected), `${path}: ${expected}`);

// Generated pages: language only on <html>, no missing template data, and no label in the
// other bundled language (placeholders match any author text).
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function labels(language: Language) {
  const other = bundled[language === "ja" ? "en" : "ja"];
  return Object.entries(other)
    .filter(([key]) => key !== "archives_month_format")
    .flatMap(([, message]) => texts(message))
    .map(
      (text) =>
        new RegExp(
          `^${text
            .split(/\{\{ \.\w+ \}\}/)
            .map(escape)
            .join(".+")}$`,
        ),
    );
}
const decode = (value: string) =>
  value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
const outputs: [Language, string][] = [
  ["en", ".cache/representative-en"],
  ...["production", "preview", "development"].map((name): [Language, string] => [
    "ja",
    `.cache/representative/${name}`,
  ]),
  ["ja", ".cache/output/plain"],
  ["ja", ".cache/screens/production"],
  ["ja", ".cache/screens/preview"],
  ...["pagination", "empty", "single"].map((name): [Language, string] => [
    "ja",
    `.cache/screen-variants/${name}/public`,
  ]),
  ["ja", ".cache/sharing/production"],
  ["ja", ".cache/sharing/preview"],
  ["ja", ".cache/metadata/production"],
  ["ja", ".cache/prose/public"],
  ["ja", ".cache/media/production"],
];
let pages = 0;
for (const [language, root] of outputs) {
  assert.ok(existsSync(root), `${root} must be built first`);
  const forbidden = labels(language);
  for (const file of readdirSync(root, { recursive: true, encoding: "utf8" }).filter((path) =>
    /\.(html|xml)$/.test(path),
  )) {
    const html = readFileSync(`${root}/${file}`, "utf8");
    pages++;
    assert.doesNotMatch(html, /<no value>/, `${root}/${file}: missing template data`);
    for (const [tag] of html.matchAll(/<(?!html\b)[a-z][\w-]*\b[^>]*\slang=[^>]*>/gi))
      assert.fail(`${root}/${file}: language belongs on <html> only: ${tag}`);
    for (const [, name, value] of html.matchAll(/\s(aria-label|title|data-[\w-]+)="([^"]*)"/g)) {
      const text = decode(value!);
      assert.ok(
        !forbidden.some((pattern) => pattern.test(text)),
        `${root}/${file}: ${name}="${text}" is not ${language}`,
      );
    }
  }
}
console.log(
  `UI text: en/ja keys, plurals, data and template wiring passed; English fixture output and ${pages} generated pages keep one language.`,
);
