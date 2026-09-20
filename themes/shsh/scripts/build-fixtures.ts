import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { buildHugo } from "./build-hugo.ts";

const source = resolve(".cache/representative/source");
rmSync(source, { recursive: true, force: true });
mkdirSync(source, { recursive: true });
cpSync("tests/fixtures/representative", source, { recursive: true });
for (const environment of ["production", "preview", "development"]) {
  buildHugo({
    source,
    destination: resolve(`.cache/representative/${environment}`),
    environment,
  });
}

// The same theme output, with and without HTML minification, under a URL subpath.
for (const variant of ["plain", "minified"]) {
  buildHugo({
    source,
    destination: resolve(`.cache/output/${variant}/blog`),
    baseURL: "https://example.invalid/blog/",
    environment: "production",
    minify: variant === "minified",
  });
}
