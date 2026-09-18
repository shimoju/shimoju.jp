import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("../..");
const baseline = JSON.parse(readFileSync("tests/baseline/migration.json", "utf8")) as {
  source_ref: string;
  content: { path: string; permalink: string }[];
  source_files: { path: string; sha256: string; source?: string }[];
};
const changes = new Map([
  ["content/posts/2016/08/01/tiritiri-curry/index.md", "{{< instagram BEaM_1qskRu >}}"],
  ["content/posts/2016/08/05/tiritiri/index.md", "{{< instagram BIuwZ9qDkvY >}}"],
  ["content/posts/2016/08/29/shin-godzilla-imax/index.md", "{{< instagram BJsevddDihX >}}"],
  [
    "content/posts/2017/10/30/classroom-learning-for-new-engineers/index.md",
    '{{< speakerdeck id="22ab654b18c94eb9bb92314459d122f7" ratio="1.77777777777778" >}}',
  ],
  [
    "content/posts/2017/11/11/twelve-factor-app-on-heroku/index.md",
    '{{< speakerdeck id="457f092496ab4856b7c3cef5bcd2babb" ratio="1.77777777777778" >}}',
  ],
  [
    "content/posts/2026/09/01/development-environment-2026/index.md",
    '{{< video src="zsh-prompt-demo.mp4" width="1440" height="1076" title="Zsh prompt demo" >}}',
  ],
]);
const evidence: unknown[] = [];
for (const file of baseline.source_files) {
  const bytes = readFileSync(`${root}/${file.path}`);
  const replacement = changes.get(file.path);
  if (!replacement) {
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      file.sha256,
      `${file.path}: unexpected edit`,
    );
    continue;
  }
  assert.ok(file.source);
  const old = replacement.includes("instagram")
    ? file.source.match(
        /<blockquote class="instagram-media"[^]*?<\/blockquote>\n<script[^]*?<\/script>/,
      )?.[0]
    : replacement.includes("speakerdeck")
      ? file.source.match(/<script async class="speakerdeck-embed"[^]*?<\/script>/)?.[0]
      : '{{< video src="zsh-prompt-demo.mp4" >}}';
  assert.ok(old, file.path);
  const id = replacement.match(/instagram ([^ ]+)/)?.[1] ?? replacement.match(/id="([^"]+)"/)?.[1];
  if (id) assert.ok(old.includes(id), `${file.path}: original embed ID`);
  assert.equal(
    bytes.toString("utf8"),
    file.source.replace(old, replacement),
    `${file.path}: only the authorized embed input may change`,
  );
  evidence.push({
    path: file.path,
    before: old,
    after: replacement,
    beforeSha256: file.sha256,
    afterSha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
const oldConfig = execFileSync("git", ["show", `${baseline.source_ref}:hugo.yml`], {
  cwd: root,
  encoding: "utf8",
});
const originalIntro = oldConfig.match(/^    content: (.+)$/m)?.[1];
assert.ok(originalIntro);
assert.equal(
  readFileSync(`${root}/content/_index.md`, "utf8"),
  `---\ntitle: Home\n---\n${originalIntro}\n`,
);
const config = JSON.parse(
  execFileSync("hugo", ["config", "--format", "json"], { cwd: root, encoding: "utf8" }),
) as {
  theme: string[];
  mainsections: string[];
  timezone: string;
  markup: {
    goldmark: {
      renderer?: { unsafe?: boolean };
      parser: { wrapstandaloneimagewithinparagraph: boolean };
    };
    highlight: { noclasses: boolean };
  };
  params: {
    author: { name: string };
    shareservices: string[];
    hatenaStar?: unknown;
    hatenastar: { enabled: boolean; author: string };
    sociallinks: { name: string; url: string }[];
  };
  pagination: { pagersize: number };
  enablerobotstxt: boolean;
};
assert.deepEqual(config.theme, ["shsh"]);
assert.deepEqual(config.mainsections, ["posts"]);
assert.equal(config.timezone, "Asia/Tokyo");
assert.equal(config.markup.goldmark.renderer?.unsafe ?? false, false);
assert.equal(config.markup.goldmark.parser.wrapstandaloneimagewithinparagraph ?? false, false);
assert.equal(config.markup.highlight.noclasses ?? false, false);
assert.equal(config.enablerobotstxt, true);
assert.equal(config.pagination.pagersize, 10);
assert.equal(config.params.author.name, "Hiroshi Shimoju");
assert.deepEqual(config.params.shareservices, ["x", "facebook", "bluesky", "hatena"]);
assert.deepEqual(
  config.params.sociallinks.map((item) => item.name),
  ["x", "bluesky", "github"],
);
assert.deepEqual(config.params.hatenastar, { enabled: true, author: "Shimoju" });
assert.equal(
  readFileSync(`${root}/static/_redirects`, "utf8"),
  execFileSync("git", ["show", `${baseline.source_ref}:static/_redirects`], {
    cwd: root,
    encoding: "utf8",
  }),
);
assert.equal(
  readFileSync(`${root}/static/_headers`, "utf8"),
  execFileSync("git", ["show", `${baseline.source_ref}:static/_headers`], {
    cwd: root,
    encoding: "utf8",
  }),
);
const embeds: { path: string; service: string; input: string }[] = [];
const markdown = readdirSync(`${root}/content`, { recursive: true, encoding: "utf8" }).filter(
  (file) => file.endsWith(".md"),
);
for (const file of markdown) {
  const text = readFileSync(`${root}/content/${file}`, "utf8");
  for (const match of text.matchAll(/\{\{< (x|instagram|youtube|speakerdeck|video) ([^]*?) >\}\}/g))
    embeds.push({ path: `content/${file}`, service: match[1]!, input: match[2]! });
  assert.doesNotMatch(
    text,
    /<(?:blockquote class="instagram-media"|script async|iframe|video)\b/,
    file,
  );
}
for (const mode of ["production", "preview"]) {
  const destination = `.cache/site/${mode}`;
  const output = (path: string) => readFileSync(`${destination}/${path}`, "utf8");
  assert.ok(existsSync(`${destination}/robots.txt`));
  assert.ok(existsSync(`${destination}/404.html`));
  assert.ok(!existsSync(`${destination}/specimen/index.html`));
  assert.ok(!existsSync(`${destination}/undated/index.html`));
  for (const [service, count] of [
    ["x", embeds.filter((e) => e.service === "x").length],
    ["instagram", 3],
    ["youtube", 5],
  ] as const) {
    let found = 0;
    for (const file of readdirSync(destination, { recursive: true, encoding: "utf8" }).filter((f) =>
      f.endsWith(".html"),
    ))
      found += (
        output(file).match(new RegExp(`data-offline-embed=["']?${service}["' >]`, "g")) ?? []
      ).length;
    assert.equal(found, count, `${mode}/${service}`);
  }
  const article = output("2026/09/01/development-environment-2026/index.html");
  assert.match(article, /<video[^>]+width=["']?1440["' ]/);
  assert.match(article, /<video[^>]+height=["']?1076["' ]/);
  assert.match(article, /<video[^>]+controls/);
  assert.doesNotMatch(article, /<video[^>]+(?:autoplay|loop|muted)/);
  assert.ok(
    !readdirSync(destination, { recursive: true, encoding: "utf8" }).some((f) =>
      f.endsWith(".map"),
    ),
  );
  if (mode === "preview") {
    assert.match(output("index.html"), /noindex/);
    assert.doesNotMatch(article, /data-hatena-star-container|https:\/\/s\.hatena\.ne\.jp/);
    assert.match(article, /unavailable in preview/);
    assert.ok(article.includes("https://preview.invalid/2026/09/01/development-environment-2026/"));
  } else assert.ok(article.includes("https://shimoju.jp/2026/09/01/development-environment-2026/"));
}
writeFileSync(
  ".cache/site/input-migration.json",
  JSON.stringify(
    {
      baseline: baseline.source_ref,
      unchangedSourceFiles: baseline.source_files.length - changes.size,
      changedInputs: evidence,
      addedIntroduction: "content/_index.md",
      pages: baseline.content,
      markdownFiles: markdown.length,
      embeds,
    },
    null,
    2,
  ),
);
console.log(
  `Site inputs: ${baseline.source_files.length} original source/assets, ${changes.size} authorized changes, ${markdown.length} Markdown files and ${embeds.length} embeds verified. Offline production/preview passed.`,
);
