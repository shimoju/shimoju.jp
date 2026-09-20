import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildHugo } from "./build-hugo.ts";

const source = resolve(".cache/screens/source");
rmSync(source, { recursive: true, force: true });
cpSync("tests/fixtures/screens/content", `${source}/content`, { recursive: true });
cpSync("tests/fixtures/articles", `${source}/content/posts`, { recursive: true });
cpSync("tests/fixtures/screens/hugo.json", `${source}/hugo.json`);
writeFileSync(`${source}/content/undated.md`, "---\ntitle: Undated\n---\nNo date.\n");
writeFileSync(
  `${source}/content/hidden-dates.md`,
  "---\ntitle: Hidden dates\ndate: 2026-01-01\nlastmod: 2026-02-01\nshowDates: false\n---\nDates remain in metadata.\n",
);
cpSync("tests/fixtures/screens/layouts", `${source}/layouts`, { recursive: true });
mkdirSync(`${source}/assets/images`, { recursive: true });
for (const image of ["zsh-prompt-cover.png", "neovim-cheatsheet.png"])
  cpSync(
    `tests/fixtures/articles/2026/09/01/development-environment-2026/${image}`,
    `${source}/assets/images/${image}`,
  );
for (const environment of ["production", "preview"])
  buildHugo({
    source,
    destination: resolve(`.cache/screens/${environment}`),
    environment,
    clock: "2026-09-17T12:00:00+09:00",
  });
