import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { HtmlValidate } from "html-validate";
import "./build-media-fixture.ts";
import { buildHugo } from "./build-hugo.ts";

const root = resolve(".cache/media");
const validator = new HtmlValidate(JSON.parse(readFileSync(".htmlvalidate.json", "utf8")));
for (const environment of ["production", "preview"]) {
  const directory = `${root}/${environment}`;
  for (const file of readdirSync(directory, { recursive: true, encoding: "utf8" }).filter((f) =>
    f.endsWith(".html"),
  )) {
    const html = readFileSync(`${directory}/${file}`, "utf8");
    const report = await validator.validateString(html);
    assert.ok(report.valid, `${file}: ${JSON.stringify(report.results.map((r) => r.messages))}`);
  }
  // Neither the build nor media templates fetch the deliberately unreachable external image.
  const html = readFileSync(`${directory}/gallery/index.html`, "utf8");
  assert.match(html, /https:\/\/external.invalid\/image.png/);
  // Check candidate sizes and actual WebP chunk types, not just encoder options.
  assert.doesNotMatch(html, /<picture\b/);
  let webpCandidates = 0;
  for (const [markup] of html.matchAll(/<(?:img|video)\b[^>]*>/g)) {
    const src = markup.match(/\bsrc="([^"]+)"/)?.[1];
    const srcset = markup.match(/\bsrcset="([^"]+)"/)?.[1];
    assert.ok(src);
    const pathname = new URL(src, "https://media.invalid").pathname;
    if (pathname.startsWith("/gallery/") || pathname.startsWith("/images/shared.")) {
      const digest = pathname.match(/\.([a-f0-9]{64})\.[^.]+$/)?.[1];
      assert.ok(digest, src);
      const originalPath = pathname.replace(`.${digest}`, "");
      const input = readFileSync(
        `${root}/source/${pathname.startsWith("/gallery/") ? "content" : "assets"}${originalPath}`,
      );
      assert.equal(digest, createHash("sha256").update(input).digest("hex"));
      assert.deepEqual(readFileSync(directory + pathname), input);
    }
    if (!srcset) continue;
    const original = readFileSync(directory + pathname);
    const width = Number(markup.match(/\bwidth="(\d+)"/)?.[1]);
    const candidates = srcset.split(", ");
    const widths = new Set<number>();
    for (const candidate of candidates) {
      const [url, descriptor] = candidate.split(" ");
      assert.ok(url && descriptor);
      const candidateWidth = Number(descriptor.slice(0, -1));
      assert.ok(!widths.has(candidateWidth), candidate);
      widths.add(candidateWidth);
      if (url === src) {
        assert.equal(candidate, `${src} ${width}w`);
        assert.equal(candidate, candidates.at(-1));
        continue;
      }
      assert.ok(candidateWidth <= Math.min(width, 1440), candidate);
      const buffer: Buffer = readFileSync(
        directory + new URL(url, "https://media.invalid").pathname,
      );
      assert.ok(buffer.length < original.length, candidate);
      if (!/\.(png|jpg|jpeg)$/.test(src)) continue;
      assert.ok(url.endsWith(".webp"), candidate);
      webpCandidates++;
      assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
      let offset = 12;
      const chunks = [];
      while (offset + 8 <= buffer.length) {
        chunks.push(buffer.toString("ascii", offset, offset + 4));
        const size = buffer.readUInt32LE(offset + 4);
        offset += 8 + size + (size % 2);
      }
      assert.ok(chunks.includes(src.endsWith(".png") ? "VP8L" : "VP8 "), candidate);
    }
  }
  assert.ok(webpCandidates > 10);
  assert.match(html, /src="https:\/\/speakerdeck.com\/assets\/embed.js"/);
  for (const file of [
    "animated.gif",
    "animated.png",
    "animated.webp",
    "still.gif",
    "still.webp",
    "diagram.svg",
    "demo.mp4",
  ]) {
    assert.deepEqual(
      readFileSync(`${directory}/gallery/${file}`),
      readFileSync(`${root}/source/content/gallery/${file}`),
    );
  }
  assert.deepEqual(
    readFileSync(`${directory}/images/static.png`),
    readFileSync(`${root}/source/static/images/static.png`),
  );
}
const invalid = `${root}/source/content/invalid.md`;
const cases = [
  ["---\ntitle: Invalid\ncover: false\n---\nText", /cover must be a map/],
  ["---\ntitle: Invalid\ncover:\n  image: 42\n---\nText", /media src must be a string/],
  ["![missing](missing.png)", /unresolved local media/],
  [
    '{{< figure src="https://external.invalid/a.png" width="-1" >}}',
    /image width must be a positive integer/,
  ],
  [
    '{{< figure src="https://external.invalid/a.png" width=0 >}}',
    /image width must be a positive integer/,
  ],
  ['{{< figure src="https://external.invalid/a.png" alt=42 >}}', /image alt must be a string/],
  [
    '{{< video src="https://external.invalid/a.mp4" >}}',
    /video requires positive width and height/,
  ],
  [
    '{{< video src="https://external.invalid/a.mp4" width=100 height=50 muted="yes" >}}',
    /video muted must be boolean/,
  ],
  ['{{< speakerdeck id="bad" ratio=1 >}}', /32-digit hexadecimal id/],
  ['{{< speakerdeck id="457f092496ab4856b7c3cef5bcd2babb" ratio=0 >}}', /ratio must be positive/],
  ["![unsafe](javascript:bad)", /unsupported media URL/],
] as const;
try {
  for (const [body, expected] of cases) {
    writeFileSync(invalid, body.startsWith("---") ? body : `---\ntitle: Invalid\n---\n${body}\n`);
    const result = buildHugo({
      source: `${root}/source`,
      destination: `${root}/invalid`,
      check: false,
    });
    assert.notEqual(result.status, 0, body);
    assert.match(result.stdout + result.stderr, expected, body);
  }
} finally {
  rmSync(invalid, { force: true });
}
console.log(
  "Media: production/preview HTML, unchanged original media, unavailable external URL and invalid inputs passed.",
);
