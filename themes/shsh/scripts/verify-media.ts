import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { HtmlValidate } from "html-validate";
import "./build-media-fixture.ts";
import { buildHugo } from "./build-hugo.ts";

function chunks(buffer: Buffer) {
  const kinds = [];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    kinds.push(buffer.toString("ascii", offset, offset + 4));
    const size = buffer.readUInt32LE(offset + 4);
    offset += 8 + size + (size % 2);
  }
  return kinds;
}
const imageChunk = (buffer: Buffer) => chunks(buffer).find((kind) => /^VP8[ L]$/.test(kind));
const pathOf = (url: string) => new URL(url, "https://media.invalid").pathname;

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
  for (const [markup] of html.matchAll(/<(?:img|video)\b[^>]*>/g)) {
    const src = markup.match(/\bsrc="([^"]+)"/)?.[1];
    // Candidates live only in the typed source, so browsers without WebP load the original src.
    assert.doesNotMatch(markup, /\b(?:srcset|sizes)=/);
    assert.ok(src);
    const pathname = pathOf(src);
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
  }
  // Check candidate widths, sizes and actual WebP chunk types, not just encoder options.
  const published = new Set<string>();
  const pictures = [
    ...html.matchAll(
      /<picture\s*><source\s+type="image\/webp"\s+srcset="([^"]+)"\s+sizes="[^"]+"\s*\/><img\b([^>]*)><\/picture\s*>/g,
    ),
  ];
  // Every picture must have exactly this shape: one typed WebP source and the original img.
  assert.equal(pictures.length, html.match(/<picture\b/g)?.length);
  for (const [, srcset, img] of pictures) {
    const src = img!.match(/\bsrc="([^"]+)"/)?.[1];
    const width = Number(img!.match(/\bwidth="(\d+)"/)?.[1]);
    assert.ok(src && width);
    const pathname = pathOf(src);
    const original = readFileSync(directory + pathname);
    const extension = pathname.split(".").at(-1)!;
    const expected =
      extension === "webp"
        ? imageChunk(original)
        : ["png", "gif"].includes(extension)
          ? "VP8L"
          : "VP8 ";
    const alpha = chunks(original).includes("ALPH");
    const candidates = srcset!.split(", ").map((candidate) => {
      const [url, descriptor] = candidate.split(" ");
      assert.ok(url && descriptor?.endsWith("w"), candidate);
      const file = pathOf(url);
      return {
        file,
        width: Number(descriptor.slice(0, -1)),
        bytes: readFileSync(directory + file),
      };
    });
    // The native width is always the last candidate, so every display density is covered.
    assert.equal(candidates.at(-1)!.width, width, src);
    for (const [index, candidate] of candidates.entries()) {
      const previous = candidates[index - 1];
      if (previous) {
        assert.ok([360, 720, 1080, 1440].includes(previous.width), previous.file);
        // A narrower candidate must be lighter than every wider one it could be replaced by.
        assert.ok(previous.width < candidate.width, candidate.file);
        assert.ok(previous.bytes.length < candidate.bytes.length, candidate.file);
      }
      // Only a WebP original is reused, at its own width, instead of being re-encoded.
      const reused = candidate.file === pathname;
      assert.equal(reused, extension === "webp" && index === candidates.length - 1, candidate.file);
      if (reused) continue;
      assert.ok(candidate.file.endsWith(".webp"), candidate.file);
      assert.equal(candidate.bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(candidate.bytes.toString("ascii", 8, 12), "WEBP");
      assert.equal(imageChunk(candidate.bytes), expected, candidate.file);
      if (alpha) assert.ok(chunks(candidate.bytes).includes("ALPH"), candidate.file);
      published.add(candidate.file);
    }
  }
  assert.ok(published.size > 10);
  // Candidates dropped for a lighter wider one are generated but never published.
  for (const file of readdirSync(`${directory}/gallery`).filter((f) => f.includes("_hu_")))
    assert.ok(published.has(`/gallery/${file}`), file);
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
