import { readFileSync } from "node:fs";
import { parse } from "smol-toml";

export type Language = "en" | "ja";
export type Message = string | { one?: string; other: string };

export function messages(language: Language) {
  return parse(readFileSync(`i18n/${language}.toml`, "utf8")) as Record<string, Message>;
}

const loaded = { en: messages("en"), ja: messages("ja") };

// Resolve bundled UI text as Hugo's T would, so checks follow wording changes in i18n/.
export function t(
  key: string,
  data: Record<string, string | number> = {},
  language: Language = "ja",
) {
  const message = loaded[language][key];
  if (message === undefined) throw new Error(`Missing ${language} UI text: ${key}`);
  const text =
    typeof message === "string" ? message : (data.Count === 1 && message.one) || message.other;
  return text.replace(/\{\{ \.(\w+) \}\}/g, (_, name: string) => {
    if (!(name in data)) throw new Error(`Missing ${name} for ${language} UI text: ${key}`);
    return String(data[name]);
  });
}
