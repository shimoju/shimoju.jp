import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

interface BuildOptions {
  source: string;
  destination?: string;
  environment?: string;
  config?: string;
  baseURL?: string;
  minify?: boolean;
  quiet?: boolean;
  // Set false to capture output and return nonzero exits for test assertions.
  check?: boolean;
  // Bound checks that deliberately exercise build failures (milliseconds).
  timeout?: number;
}

// Fixed clock so every fixture and check builds the same output regardless of run time.
const clock = "2026-09-17T12:00:00+09:00";

export function buildHugo({ check = true, timeout, ...options }: BuildOptions) {
  const args = [
    "--themesDir",
    resolve(".."),
    "--cacheDir",
    resolve(".cache/hugo"),
    "--clock",
    clock,
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
    timeout,
  });
  if (result.error) throw result.error;
  if (check && result.status !== 0) {
    throw new Error(`Hugo build failed: ${result.signal ?? result.status}`);
  }
  return result;
}
