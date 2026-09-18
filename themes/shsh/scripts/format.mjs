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
// These repository-level files belong to the migration/CI. Format only the
// explicit files via stdin, keeping content, mock and PaperMod out of scope.
for (const path of [
  "../../docs/06-theme-implementation-progress.json",
  "../../.github/workflows/shsh.yml",
].filter(existsSync)) {
  const source = readFileSync(path, "utf8");
  const formatted = execFileSync(
    "pnpm",
    [
      "exec",
      "oxfmt",
      "--stdin-filepath",
      path.endsWith(".json") ? "progress.json" : "workflow.yml",
    ],
    { input: source, encoding: "utf8" },
  );
  if (source !== formatted) {
    if (write) writeFileSync(path, formatted);
    else {
      console.error(`Formatting differs: ${path}`);
      process.exitCode = 1;
    }
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
