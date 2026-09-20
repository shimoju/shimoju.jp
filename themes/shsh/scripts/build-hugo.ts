import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

interface BuildOptions {
  source: string;
  destination?: string;
  environment?: string;
  config?: string;
  baseURL?: string;
  clock?: string;
  minify?: boolean;
  quiet?: boolean;
  // Set false to capture output and return nonzero exits for test assertions.
  check?: boolean;
}

export function buildHugo({ check = true, ...options }: BuildOptions) {
  const args = [
    "--themesDir",
    resolve(".."),
    "--cacheDir",
    resolve(".cache/hugo"),
    "--cleanDestinationDir",
    "--panicOnWarning",
  ];
  for (const [name, value] of Object.entries(options)) {
    if (value === undefined || value === false) continue;
    args.push(`--${name}`);
    if (value !== true) args.push(value);
  }
  const result = spawnSync("hugo", args, {
    encoding: "utf8",
    stdio: check ? "inherit" : "pipe",
  });
  if (result.error) throw result.error;
  if (check && result.status !== 0) {
    throw new Error(`Hugo build failed: ${result.signal ?? result.status}`);
  }
  return result;
}
