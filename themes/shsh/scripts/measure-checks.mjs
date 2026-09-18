import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const commands = [
  ["format", "pnpm", ["format:check"]],
  ["lint-and-types", "pnpm", ["lint"]],
  ["css-lint", "pnpm", ["lint:css"]],
  ["progress", "pnpm", ["check:progress"]],
  ["hugo-and-format-semantics", "pnpm", ["check:tooling"]],
  ["browser", "pnpm", ["test"]],
];
/** @type {{ name: string, milliseconds: number, output: string }[]} */
const results = [];
for (const [name, binary, args] of /** @type {[string, string, string[]][]} */ (commands)) {
  const started = performance.now();
  const output = execFileSync(binary, args, { encoding: "utf8" });
  const milliseconds = Math.round(performance.now() - started);
  results.push({ name, milliseconds, output });
  console.log(`${name}: ${milliseconds} ms`);
}
mkdirSync(".cache", { recursive: true });
writeFileSync(
  ".cache/check-timings.json",
  JSON.stringify(
    {
      recorded_at: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      results,
    },
    null,
    2,
  ) + "\n",
);
