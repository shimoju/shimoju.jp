import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

/** @type {Record<string, string>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
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
const directories =
  process.env.SHSH_REVIEW_SERVER === "full"
    ? /** @type {[number, string][]} */ ([
        [4210, "docs/verification"],
        [4211, ".cache/site/preview"],
        [4212, ".cache/site-live/preview"],
        [4213, ".cache/r002/proposal"],
        [4214, "../../mock/site"],
      ])
    : process.env.SHSH_REVIEW_SERVER
      ? /** @type {[number, string][]} */ ([
          [4184, "docs/verification"],
          [4185, ".cache/review/production"],
          [4186, ".cache/review/preview"],
          [4187, "../../mock/site"],
        ])
      : /** @type {[number, string][]} */ ([
          [4174, ".cache/representative/production"],
          [4175, ".cache/representative/preview"],
          [4176, ".cache/representative/development"],
          [4177, "../../mock/site"],
          [4178, ".cache/prose/public"],
          [4179, ".cache/media/production"],
          [4180, ".cache/sharing/production"],
          [4181, ".cache/sharing/preview"],
          [4182, ".cache/review/production"],
          [4183, ".cache/review/preview"],
          [4188, ".cache/full-review/pagination/public"],
          [4189, ".cache/full-review/empty/public"],
          [4195, ".cache/full-review/single/public"],
          [4196, ".cache/site/production"],
          [4197, ".cache/site/preview"],
          [4198, ".cache/site-live/production"],
          [4199, ".cache/site-live/preview"],
        ]);
/** @type {ReturnType<typeof createServer>[]} */
const servers = [];
for (const [port, directory] of directories) {
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
        const bytes = await readFile(file);
        const headers = {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Accept-Ranges": "bytes",
        };
        const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
        if (range) {
          const start = Number(range[1]);
          const end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1);
          if (start > end) {
            response.writeHead(416, { "Content-Range": `bytes */${bytes.length}` }).end();
            return;
          }
          response.writeHead(206, {
            ...headers,
            "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
            "Content-Length": end - start + 1,
          });
          response.end(bytes.subarray(start, end + 1));
        } else {
          response.writeHead(200, { ...headers, "Content-Length": bytes.length });
          response.end(bytes);
        }
      } catch {
        response.writeHead(404).end("Not found");
      }
    }
    void serve().catch(() => {
      response.writeHead(500).end();
    });
  });
  server.listen(port, "127.0.0.1");
  servers.push(server);
}

for (const signal of ["SIGTERM", "SIGINT"])
  process.once(signal, () => {
    for (const server of servers) server.close();
  });
