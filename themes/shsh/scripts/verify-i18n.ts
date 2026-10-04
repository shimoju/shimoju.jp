import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildHugo } from "./build-hugo.ts";
import { bundled, placeholder, t, texts, type Message } from "./i18n.ts";

const placeholders = (message: Message) =>
  new Set(texts(message).flatMap((text) => [...text.matchAll(placeholder)].map((m) => m[1]!)));

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
  assert.notDeepEqual(ja, en, `${key}: translate the Japanese value`);
}

const templates = readdirSync("layouts", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".html"))
  .map((file) => ({ file, source: readFileSync(`layouts/${file}`, "utf8") }));
const used = new Set(
  templates.flatMap(({ source }) => [...source.matchAll(/\bT "(\w+)"/g)].map((m) => m[1]!)),
);
const prefixes = templates.flatMap(({ source }) =>
  [...source.matchAll(/\bT \(printf "(\w+)%s"/g)].map((m) => m[1]!),
);
for (const key of used) assert.ok(key in bundled.en, `layouts use undefined UI text ${key}`);
for (const key of Object.keys(bundled.en))
  assert.ok(
    used.has(key) || prefixes.some((prefix) => key.startsWith(prefix)),
    `unused UI text ${key}`,
  );
for (const { file, source } of templates) {
  const literal = source.replace(/\{\{[\s\S]*?\}\}/g, "\0");
  const attributes = literal.matchAll(
    /\s(aria-label|title|alt|data-[\w-]*(?:label|message|notice|failed)[\w-]*)="([^"]*)"/g,
  );
  // "RSS" names the format and reads the same in every language.
  for (const [, name, value] of attributes)
    assert.ok(
      !/[A-Za-z]{2}/.test(value!) || value!.replaceAll("\0", "").trim() === "RSS",
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

console.log(
  "UI text: en/ja keys, plurals, data, template wiring and English fixture output passed.",
);
