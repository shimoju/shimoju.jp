import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildHugo } from "./build-hugo.ts";

const root = resolve(".cache/media");
rmSync(`${root}/source`, { recursive: true, force: true });
cpSync("tests/fixtures/media", `${root}/source`, { recursive: true });
mkdirSync(`${root}/source/assets/images`, { recursive: true });
mkdirSync(`${root}/source/static/images`, { recursive: true });
const gallery = `${root}/source/content/gallery`;
const original = "tests/fixtures/articles/2026/09/01/development-environment-2026";
cpSync(`${original}/zsh-prompt-cover.png`, `${gallery}/screenshot.png`);
cpSync(`${original}/neovim-cheatsheet.png`, `${gallery}/tall.png`);
for (const image of ["photo.jpg", "palette-screenshot.png", "grayscale.png"])
  cpSync(`tests/fixtures/media/assets/${image}`, `${gallery}/${image}`);
cpSync(`${original}/zsh-prompt-demo.mp4`, `${gallery}/demo.mp4`);
cpSync(`${gallery}/screenshot.png`, `${root}/source/assets/images/shared.png`);
cpSync(`${gallery}/screenshot.png`, `${root}/source/static/images/static.png`);
// Test assets are generated once in the fixture authoring step; site generation remains Hugo-only.
cpSync("tests/fixtures/media/assets/small.png", `${gallery}/small.png`);
cpSync("tests/fixtures/media/assets/still.gif", `${gallery}/still.gif`);
cpSync("tests/fixtures/media/assets/still.webp", `${gallery}/still.webp`);
cpSync("tests/fixtures/media/assets/palette.png", `${gallery}/palette.png`);
cpSync("tests/fixtures/media/assets/optimized.jpg", `${gallery}/optimized.jpg`);
for (const extension of ["gif", "png", "webp"]) {
  cpSync(`tests/fixtures/media/assets/animated.${extension}`, `${gallery}/animated.${extension}`);
  cpSync(
    `tests/fixtures/media/assets/animated.${extension}`,
    `${root}/source/static/images/animated.${extension}`,
  );
}
for (const [index, cover] of [
  [1, "screenshot.png"],
  [2, "small.png"],
  [3, "screenshot.png"],
] as const) {
  const directory = `${root}/source/content/posts/post-${index}`;
  mkdirSync(directory, { recursive: true });
  cpSync(`${gallery}/${cover}`, `${directory}/${cover}`);
  writeFileSync(
    `${directory}/index.md`,
    `---\ntitle: 記事 ${index}\ndate: 2026-09-0${4 - index}\ncover:\n  image: ${cover}\n  alt: カバー ${index}\n---\n本文と要約。\n`,
  );
}
// Exercise the same image as a cover and a captioned figure.
writeFileSync(
  `${root}/source/content/cover.md`,
  readFileSync(`${gallery}/index.md`, "utf8").split("\n\n")[0] +
    '\n\n{{< figure src="images/shared.png" alt="ターミナル" caption="説明文" >}}\n',
);
// A root fixed page cannot refer to a sibling bundle: use the global asset for its cover.
const coverPage = `${root}/source/content/cover.md`;
writeFileSync(
  coverPage,
  readFileSync(coverPage, "utf8").replace("image: screenshot.png", "image: images/shared.png"),
);
for (const environment of ["production", "preview"]) {
  buildHugo({
    source: `${root}/source`,
    destination: `${root}/${environment}`,
    environment,
  });
}
