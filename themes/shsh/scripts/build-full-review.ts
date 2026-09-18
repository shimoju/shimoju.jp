import assert from "node:assert/strict";
import { HtmlValidate } from "html-validate";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = resolve(".cache/review/source");
const config = JSON.parse(readFileSync(`${base}/hugo.json`, "utf8")) as Record<string, unknown>;
for (const variant of ["pagination", "empty", "single"]) {
  const source = resolve(`.cache/full-review/${variant}/source`);
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
      resolve(`.cache/full-review/${variant}/public`),
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
const manifest = JSON.parse(readFileSync("../../mock/site/manifest.json", "utf8")) as {
  pages: { file: string; title: string; review: boolean }[];
};
const articles: Record<string, string> = {
  article: "/2026/09/01/development-environment-2026/",
  "article-hugo": "/2023/06/22/hugo-and-cloudflare-pages/",
  "article-diary": "/2016/08/17/shakai-fukki/",
  "article-bgm": "/2016/08/14/hikikomori/",
  "article-pasmo": "/2016/08/13/pasmo-autocharge/",
};
const cases = manifest.pages
  .filter((p) => !p.review && p.file !== "specimen.html")
  .map(({ file, title }) => {
    const name = file.replace(/\.html$/, "");
    let path: string;
    let port = 4182;
    if (articles[name]) path = articles[name];
    else if (name === "404") path = "/404.html";
    else if (name === "empty" || name === "single-item") {
      port = name === "empty" ? 4189 : 4195;
      path = "/posts/";
    } else if (name.endsWith("-empty")) {
      port = 4189;
      path = `/${name.replace("-empty", "")}/`;
    } else if (/^(tag|category)-/.test(name)) {
      const kind = name.startsWith("tag-") ? "tags" : "categories";
      const match = name.match(/^(?:tag|category)-(?:\d+|pagination)(?:-(\d+))?$/);
      assert.ok(match, name);
      if (name.includes("pagination")) port = 4188;
      path = `/${kind}/${title.toLowerCase().replaceAll(" ", "-")}/${match[1] ? `page/${match[1]}/` : ""}`;
    } else {
      const match = name.match(/^(home|posts)(?:-(\d+))?$/);
      path = match
        ? `${match[1] === "home" ? "/" : "/posts/"}${match[2] ? `page/${match[2]}/` : ""}`
        : `/${name}/`;
    }
    return { name, title, mock: file, url: `http://127.0.0.1:${port}${path}` };
  });
assert.equal(cases.length, 40);
writeFileSync(".cache/full-review/cases.json", JSON.stringify(cases, null, 2));
console.log(
  `Full review: ${cases.length} frozen product screens mapped; specimen stays in representative suite.`,
);

const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const directory of [
  ".cache/review/production",
  ".cache/review/preview",
  ...["pagination", "empty", "single"].map((name) => `.cache/full-review/${name}/public`),
]) {
  for (const file of readdirSync(directory, { recursive: true, encoding: "utf8" }).filter((file) =>
    file.endsWith(".html"),
  )) {
    const report = await validator.validateString(readFileSync(`${directory}/${file}`, "utf8"));
    const messages = report.results.flatMap((result) => result.messages);
    // Preserve the real article title (Q2/Q20). This SEO length heuristic is not HTML invalidity.
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
console.log("Full review HTML: all production, preview and boundary fixture pages valid.");
