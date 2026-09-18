import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const live = process.argv.includes("--live");
const root = resolve(live ? ".cache/site-live" : ".cache/site");
const source = live ? resolve("../..") : `${root}/source`;
mkdirSync(root, { recursive: true });
if (!live) {
  rmSync(source, { recursive: true, force: true });
  mkdirSync(source, { recursive: true });
  for (const path of ["hugo.yml", "content", "static"])
    cpSync(`../../${path}`, `${source}/${path}`, { recursive: true });
  cpSync("tests/fixtures/offline/layouts", `${source}/layouts`, { recursive: true });
}
const environments = process.argv.includes("--production-only")
  ? ["production"]
  : ["production", "preview"];
let failed = false;
for (const environment of environments) {
  const args = [
    "--source",
    source,
    "--themesDir",
    resolve(".."),
    "--destination",
    `${root}/${environment}`,
    "--cacheDir",
    `${root}/hugo-cache`,
    "--environment",
    environment,
    "--clock",
    "2026-09-17T12:00:00+09:00",
    "--cleanDestinationDir",
  ];
  if (!live) args.push("--panicOnWarning");
  if (environment === "preview") args.push("--baseURL", "https://preview.invalid/");
  const start = performance.now();
  const result = spawnSync("hugo", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const record = {
    command: ["hugo", ...args],
    live,
    environment,
    exitCode: result.status,
    error: result.error?.message,
    seconds: (performance.now() - start) / 1000,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  writeFileSync(`${root}/${environment}-build.json`, JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
  if (result.status !== 0) failed = true;
}
if (failed) process.exitCode = 1;
