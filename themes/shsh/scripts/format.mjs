import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { formatTemplate } from "./format-template.mjs";

const write = process.argv.includes("--write");
const general = [
  "scripts",
  "tests",
  "assets",
  "theme.toml",
  "README.md",
  "docs/verification",
  "package.json",
  "tsconfig.json",
  "playwright.config.ts",
  ".oxfmtrc.json",
  ".oxlintrc.json",
  ".prettierrc.json",
  ".stylelintrc.json",
  ".htmlvalidate.json",
].filter((path) => existsSync(path));
execFileSync("pnpm", ["exec", "oxfmt", write ? "--write" : "--check", ...general], {
  stdio: "inherit",
});
// The site-wide progress file stays with the migration requirements. Format via
// stdin because Oxfmt's project path arguments cannot traverse above this root.
const progressPath = "../../docs/06-theme-implementation-progress.json";
const progress = readFileSync(progressPath, "utf8");
const formattedProgress = execFileSync(
  "pnpm",
  ["exec", "oxfmt", "--stdin-filepath", "progress.json"],
  { input: progress, encoding: "utf8" },
);
if (progress !== formattedProgress) {
  if (write) writeFileSync(progressPath, formattedProgress);
  else {
    console.error(`Formatting differs: ${progressPath}`);
    process.exitCode = 1;
  }
}
/** @param {string} directory @returns {string[]} */
function templates(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return templates(path);
    return (path.startsWith("layouts/") || path.includes("/layouts/")) && path.endsWith(".html")
      ? [path]
      : [];
  });
}
const html = [...templates("layouts"), ...templates("tests/fixtures")];
let changed = 0;
for (const path of html) {
  const source = readFileSync(path, "utf8");
  const formatted = await formatTemplate(source);
  if (formatted !== source) {
    changed++;
    if (write) writeFileSync(path, formatted);
    else console.error(`Go template format differs: ${path}`);
  }
}
if (!write && changed) process.exitCode = 1;
console.log(`Go templates: ${html.length} checked, ${changed} ${write ? "formatted" : "differ"}.`);
