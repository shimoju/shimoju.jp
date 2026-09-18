import assert from "node:assert/strict";
import { HtmlValidate } from "html-validate";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = resolve(".cache/screens/source");
const config = JSON.parse(readFileSync(`${base}/hugo.json`, "utf8")) as Record<string, unknown>;
for (const variant of ["pagination", "empty", "single"]) {
  const source = resolve(`.cache/screen-variants/${variant}/source`);
  rmSync(source, { recursive: true, force: true });
  cpSync(base, source, { recursive: true });
  if (variant === "pagination") {
    for (const file of readdirSync(`${source}/content/posts`, {
      recursive: true,
      encoding: "utf8",
    })) {
      if (!file.endsWith("index.md")) continue;
      const path = `${source}/content/posts/${file}`;
      // TOML/JSON-free isolated YAML inputs: replace only the taxonomy fields.
      const input = readFileSync(path, "utf8").replace(
        /^(tags|categories):[^\n]*(?:\n[ \t]+[^\n]*)*/gm,
        (_, key: string) => `${key}: [Sample ${key === "tags" ? "tag" : "category"}]`,
      );
      writeFileSync(path, input);
    }
  } else {
    rmSync(`${source}/content/posts`, { recursive: true, force: true });
    mkdirSync(`${source}/content/posts`, { recursive: true });
    writeFileSync(
      `${source}/content/posts/_index.md`,
      `---\ntitle: Posts\n---\n${variant === "empty" ? "Empty list preview" : "Single post preview · No summary"}\n`,
    );
    if (variant === "single") {
      writeFileSync(
        `${source}/content/posts/only.md`,
        '---\ntitle: 社会復帰するぞ\ndate: 2016-08-17T22:42:23+09:00\nsummary: ""\n---\nOnly article.\n',
      );
    }
  }
  writeFileSync(`${source}/hugo.json`, JSON.stringify(config));
  execFileSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve(".."),
      "--destination",
      resolve(`.cache/screen-variants/${variant}/public`),
      "--cacheDir",
      resolve(".cache/hugo"),
      "--environment",
      "production",
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--panicOnWarning",
      "--cleanDestinationDir",
    ],
    { stdio: "inherit" },
  );
}
const screens = JSON.parse(readFileSync("tests/fixtures/screens/pages.json", "utf8")) as {
  name: string;
  title: string;
  variant: "standard" | "pagination" | "empty" | "single";
  path: string;
}[];
const ports = { standard: 4182, pagination: 4188, empty: 4189, single: 4195 };
const cases = screens.map(({ name, title, variant, path }) => ({
  name,
  title,
  url: `http://127.0.0.1:${ports[variant]}${path}`,
}));
writeFileSync(".cache/screen-variants/cases.json", JSON.stringify(cases, null, 2));
console.log(`Screen fixtures: ${cases.length} pages; specimen stays in representative suite.`);

const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const directory of [
  ".cache/screens/production",
  ".cache/screens/preview",
  ...["pagination", "empty", "single"].map((name) => `.cache/screen-variants/${name}/public`),
]) {
  for (const file of readdirSync(directory, { recursive: true, encoding: "utf8" }).filter((file) =>
    file.endsWith(".html"),
  )) {
    const report = await validator.validateString(readFileSync(`${directory}/${file}`, "utf8"));
    const messages = report.results.flatMap((result) => result.messages);
    // Preserve the real article title. This SEO length heuristic is not HTML invalidity.
    // Only this exact title is exempt; all other generated markup rules still apply.
    const longTitle =
      cases.find((screen) => screen.name === "article")!.title + " — " + String(config.title);
    const html = readFileSync(`${directory}/${file}`, "utf8");
    assert.ok(
      messages.every(
        (message) =>
          message.ruleId === "long-title" && html.includes(`<title>${longTitle}</title>`),
      ),
      `${directory}/${file}: ${JSON.stringify(messages)}`,
    );
  }
}
console.log("Screen fixture HTML: all production, preview and boundary fixture pages valid.");
