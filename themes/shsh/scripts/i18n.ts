import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "smol-toml";

export type Language = "en" | "ja";
export type Message = string | { one?: string; other: string };

const load = (language: Language) =>
  parse(readFileSync(`i18n/${language}.toml`, "utf8")) as Record<string, Message>;
export const bundled = { en: load("en"), ja: load("ja") };
export const placeholder = /\{\{ \.(\w+) \}\}/g;
export const texts = (message: Message) =>
  typeof message === "string" ? [message] : Object.values(message);

export function t(
  key: string,
  data: Record<string, string | number> = {},
  language: Language = "ja",
) {
  const message = bundled[language][key];
  if (message === undefined) throw new Error(`Missing ${language} UI text: ${key}`);
  const text =
    typeof message === "string" ? message : (data.Count === 1 && message.one) || message.other;
  return text.replace(placeholder, (_, name: string) => {
    if (!(name in data)) throw new Error(`Missing ${name} for ${language} UI text: ${key}`);
    return String(data[name]);
  });
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const labels = (language: Language) =>
  Object.entries(bundled[language])
    .filter(([key]) => key !== "archives_month_format")
    .flatMap(([, message]) => texts(message))
    .map(
      (text) => new RegExp(`^${escape(text.replace(placeholder, "\0")).replaceAll("\0", ".+")}$`),
    );
const foreign: Record<string, RegExp[]> = { en: labels("ja"), ja: labels("en") };
// Go escapes quotes and some symbols as numeric references, such as &#34; and &#43;.
const decode = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

export function assertOneLanguage(root: string) {
  for (const file of readdirSync(root, { recursive: true, encoding: "utf8" }).filter((path) =>
    /\.(html|xml)$/.test(path),
  )) {
    const html = readFileSync(`${root}/${file}`, "utf8");
    assert.doesNotMatch(
      html,
      /<no value>|&lt;no value&gt;/,
      `${root}/${file}: missing template data`,
    );
    const tag = /<(?!html\b)[a-z][^>]*\slang=[^>]*>/i.exec(html)?.[0];
    assert.equal(tag, undefined, `${root}/${file}: language belongs on <html> only: ${tag}`);
    const language = /(?:<html lang="|<language>)(\w+)/.exec(html)?.[1] ?? "";
    const patterns = foreign[language];
    if (!patterns) continue;
    for (const [, name, value] of html.matchAll(/\s(aria-label|title|data-[\w-]+)="([^"]*)"/g)) {
      const text = decode(value!);
      assert.ok(
        !patterns.some((pattern) => pattern.test(text)),
        `${root}/${file}: ${name}="${text}" is not ${language}`,
      );
    }
  }
}
