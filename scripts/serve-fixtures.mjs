import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

/** @type {Record<string, string>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".json": "application/json",
  ".xml": "application/xml",
};
for (const [port, directory] of /** @type {[number, string][]} */ ([
  [4174, ".cache/representative/production"],
  [4175, ".cache/representative/preview"],
  [4176, ".cache/representative/development"],
  [4177, "mock/site"],
  [4178, ".cache/prose/public"],
  [4179, ".cache/media/production"],
])) {
  const root = resolve(directory);
  const server = createServer((request, response) => {
    async function serve() {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) {
        response.writeHead(403).end();
        return;
      }
      try {
        if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
        response.writeHead(200, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
        });
        response.end(await readFile(file));
      } catch {
        response.writeHead(404).end("Not found");
      }
    }
    void serve().catch(() => {
      response.writeHead(500).end();
    });
  });
  server.listen(port, "127.0.0.1");
  process.once("SIGTERM", () => server.close());
  process.once("SIGINT", () => server.close());
}
