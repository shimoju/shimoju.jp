import { readFileSync } from "node:fs";
import { parse } from "smol-toml";

export type Language = "en" | "ja";
export type Message = string | { one?: string; other: string };

const load = (language: Language) =>
  parse(readFileSync(`i18n/${language}.toml`, "utf8")) as Record<string, Message>;
export const bundled = { en: load("en"), ja: load("ja") };
export const placeholder = /\{\{ \.(\w+) \}\}/g;

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
