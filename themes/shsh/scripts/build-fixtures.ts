import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const source = resolve(".cache/representative/source");
rmSync(source, { recursive: true, force: true });
mkdirSync(source, { recursive: true });
cpSync("tests/fixtures/representative", source, { recursive: true });
for (const environment of ["production", "preview", "development"]) {
  execFileSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve(".."),
      "--destination",
      resolve(`.cache/representative/${environment}`),
      "--environment",
      environment,
      "--cleanDestinationDir",
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--panicOnWarning",
    ],
    { stdio: "inherit" },
  );
}

// The same theme output, with and without HTML minification, under a URL subpath.
for (const variant of ["plain", "minified"]) {
  execFileSync(
    "hugo",
    [
      "--source",
      source,
      "--themesDir",
      resolve(".."),
      "--destination",
      resolve(`.cache/output/${variant}/blog`),
      "--baseURL",
      "https://example.invalid/blog/",
      "--environment",
      "production",
      "--clock",
      "2026-09-17T12:00:00+09:00",
      "--cleanDestinationDir",
      "--panicOnWarning",
      ...(variant === "minified" ? ["--minify"] : []),
    ],
    { stdio: "inherit" },
  );
}
