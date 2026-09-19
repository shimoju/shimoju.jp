import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";

const input = JSON.parse(readFileSync(".cache/site/inputs.json", "utf8")) as {
  pages: {
    path: string;
    permalink: string;
    title: string;
    section: string;
    kind: string;
    date: string;
  }[];
};
const content = input.pages.filter((p) => p.kind === "page");
const normalize = (value: string) => value.replace(/\s/g, "");
const urlKey = (value: string) => decodeURI(value);
const pathFor = (url: string) => decodeURI(new URL(url).pathname);
const outputPath = (path: string) => (path.endsWith("/") ? path + "index.html" : path);

for (const environment of ["production", "preview"])
  test(`All site outputs: ${environment}`, async ({ page, browserName }) => {
    test.setTimeout(90000);
    const root = `.cache/site/${environment}`;
    const base = environment === "production" ? "https://shimoju.jp" : "https://preview.invalid";
    const files = readdirSync(root, { recursive: true, encoding: "utf8" });
    const html = Object.fromEntries(
      files
        .filter((f) => f.endsWith(".html"))
        .map((f) => ["/" + f, readFileSync(`${root}/${f}`, "utf8")]),
    );
    const feeds = Object.fromEntries(
      files
        .filter((f) => f.endsWith("/index.xml") || f === "index.xml")
        .map((f) => ["/" + f, readFileSync(`${root}/${f}`, "utf8")]),
    );
    const records = await page.evaluate(
      ({ html, base }) =>
        Object.fromEntries(
          Object.entries(html).map(([path, source]) => {
            const doc = new DOMParser().parseFromString(source, "text/html");
            const url = base + path.replace(/index\.html$/, "");
            const absolute = (value: string) => new URL(value, url).href;
            const prose = doc.querySelector(".prose");
            const headings = [...(prose?.querySelectorAll("h1,h2,h3,h4,h5,h6") ?? [])].map((e) => ({
              level: e.tagName.toLowerCase(),
              id: e.id,
              text: e.textContent ?? "",
            }));
            const links = [...(prose?.querySelectorAll("a[href]") ?? [])]
              .filter(
                (e) =>
                  !e.classList.contains("heading-anchor") &&
                  !e.closest('[data-offline-embed="instagram"], [data-offline-embed="youtube"]'),
              )
              .map((e) => absolute(e.getAttribute("href")!));
            const media = [...(prose?.querySelectorAll("img,video") ?? [])].map((e) => ({
              tag: e.tagName.toLowerCase(),
              src: absolute(e.getAttribute("src")!),
              alt: e.getAttribute("alt") ?? "",
            }));
            const clone = prose?.cloneNode(true) as Element | undefined;
            clone
              ?.querySelectorAll(
                'script,style,.copy,.copy-feedback,.code-label,.heading-anchor,[data-offline-embed="instagram"],[data-offline-embed="youtube"]',
              )
              .forEach((e) => e.remove());
            const meta = Object.fromEntries(
              [...doc.querySelectorAll("meta[name],meta[property]")].map((e) => [
                e.getAttribute("name") ?? e.getAttribute("property"),
                e.getAttribute("content"),
              ]),
            );
            const references = [...doc.querySelectorAll("[href],[src],[srcset]")].flatMap((e) =>
              [
                e.getAttribute("href"),
                e.getAttribute("src"),
                ...(e
                  .getAttribute("srcset")
                  ?.split(",")
                  .map((s) => s.trim().split(/\s/)[0]) ?? []),
              ]
                .filter((v): v is string => Boolean(v))
                .map(absolute),
            );
            return [
              path,
              {
                title: doc.title,
                canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
                body: clone?.textContent ?? "",
                code: [...(prose?.querySelectorAll("pre > code") ?? [])].map(
                  (e) => e.textContent ?? "",
                ),
                codeStylesValid: [...(prose?.querySelectorAll("pre") ?? [])].every(
                  (e) =>
                    e.classList.contains("chroma") &&
                    !e.matches("[style]") &&
                    !e.querySelector("[style]"),
                ),
                summaries: [...doc.querySelectorAll(".post-entry")].map((e) => ({
                  url: absolute(e.querySelector(".entry-link")!.getAttribute("href")!),
                  text: e.querySelector(".entry-summary")?.textContent ?? "",
                })),
                headings,
                links,
                media,
                meta,
                references,
                ids: [...doc.querySelectorAll("[id]")].map((e) => e.id),
                redirect: doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content"),
                feed: doc.querySelector('link[type="application/rss+xml"]')?.getAttribute("href"),
                schema: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(
                  (e) => JSON.parse(e.textContent!) as Record<string, unknown>,
                ),
                images: [...doc.querySelectorAll("img")].map((e) => ({
                  src: absolute(e.getAttribute("src")!),
                  width: e.width,
                  height: e.height,
                  alt: e.getAttribute("alt"),
                  srcset: e.getAttribute("srcset"),
                  sizes: e.getAttribute("sizes"),
                })),
                imageCandidates: [...doc.querySelectorAll("img[srcset],source[srcset]")].flatMap(
                  (e) =>
                    e
                      .getAttribute("srcset")!
                      .split(",")
                      .map((value) => {
                        const [src, width] = value.trim().split(/\s+/);
                        return { src: absolute(src!), width: Number(width!.replace("w", "")) };
                      }),
                ),
                share: doc.querySelectorAll(".share-icons a").length,
                stars: doc.querySelectorAll("[data-hatena-star-container]").length,
              },
            ];
          }),
        ),
      { html, base },
    );
    const rss = await page.evaluate(
      (feeds) =>
        Object.fromEntries(
          Object.entries(feeds).map(([path, xml]) => {
            const doc = new DOMParser().parseFromString(xml, "application/xml");
            return [
              path,
              {
                error: doc.querySelector("parsererror")?.textContent,
                descriptionsAreText: [...doc.querySelectorAll("item > description")].every(
                  (e) => e.children.length === 0,
                ),
                items: [...doc.querySelectorAll("item")].map((e) =>
                  Object.fromEntries([...e.children].map((c) => [c.tagName, c.textContent])),
                ),
                self: doc
                  .getElementsByTagNameNS("http://www.w3.org/2005/Atom", "link")[0]
                  ?.getAttribute("href"),
              },
            ];
          }),
        ),
      feeds,
    );
    const issues: unknown[] = [];
    function check(value: boolean, label: string, details?: unknown) {
      if (!value) issues.push({ label, details });
    }
    const sameURL = (value: string) =>
      urlKey(value.replace("https://preview.invalid", "https://shimoju.jp"));
    for (const item of content) {
      const path = outputPath(pathFor(item.permalink));
      const record = records[path];
      check(Boolean(record), `${path}: published content exists`);
      if (!record) continue;
      const schema = record.schema[0];
      check(schema?.headline === item.title, `${path}: title`);
      check(
        schema?.["@type"] === (item.section === "posts" ? "BlogPosting" : "WebPage"),
        `${path}: schema type`,
      );
      check(schema?.url === record.canonical, `${path}: schema URL`);
      check(!schema?.articleBody, `${path}: no duplicated article body`);
      check(
        (record.meta["article:published_time"] ?? "0001-01-01T00:00:00Z") === item.date,
        `${path}: published date`,
      );
    }
    let linksChecked = 0,
      fragmentsChecked = 0,
      imagesChecked = 0;
    for (const [path, record] of Object.entries(records)) {
      check(record.codeStylesValid, `${path}: code uses classes for theme palettes`);
      for (const ref of record.references) {
        const url = new URL(ref);
        if (![base, "https://shimoju.jp"].includes(url.origin)) continue;
        let pathname = decodeURI(url.pathname);
        if (pathname === "/feed.xml") pathname = "/index.xml";
        const target = outputPath(pathname);
        linksChecked++;
        check(existsSync(root + target), `${path}: internal reference`, ref);
        if (url.hash && records[target]) {
          fragmentsChecked++;
          check(
            records[target]!.ids.includes(decodeURIComponent(url.hash.slice(1))),
            `${path}: fragment`,
            ref,
          );
        }
      }
      if (record.redirect) {
        check(record.redirect.endsWith(record.canonical!), `${path}: refresh matches canonical`);
        continue;
      }
      const own = base + path.replace(/index\.html$/, "");
      check(urlKey(record.canonical!) === urlKey(own), `${path}: own canonical`);
      check(record.meta["og:url"] === record.canonical, `${path}: OGP URL`);
      check(
        Boolean(record.title) &&
          Boolean(record.meta["og:title"]) &&
          Boolean(record.meta["twitter:title"]),
        `${path}: social titles`,
      );
      check(
        record.meta["og:description"] === record.meta.description &&
          record.meta["twitter:description"] === record.meta.description,
        `${path}: shared description`,
      );
      check(
        (record.meta.robots?.includes("noindex") ?? false) === (environment === "preview"),
        `${path}: robots mode`,
      );
      for (const image of record.images) {
        imagesChecked++;
        check(
          image.width > 0 && image.height > 0 && image.alt !== null,
          `${path}: image dimensions/alt`,
          image,
        );
        if (image.srcset) check(Boolean(image.sizes), `${path}: responsive sizes`);
      }
      const feedPath = path
        .replace(/page\/\d+\/index\.html$/, "index.html")
        .replace(/index\.html$/, "index.xml");
      if (rss[feedPath])
        check(urlKey(record.feed!) === base + feedPath, `${path}: feed autodiscovery`, record.feed);
      if (environment === "preview")
        check(record.share === 0 && record.stars === 0, `${path}: no preview service actions`);
    }
    for (const [path, feed] of Object.entries(rss)) {
      check(!feed.error, `${path}: valid XML`);
      const identifiers = feed.items.map((item) => sameURL(item.guid!));
      check(new Set(identifiers).size === identifiers.length, `${path}: unique RSS identifiers`);
      for (const item of feed.items) {
        check(sameURL(item.guid!) === sameURL(item.link!), `${path}: RSS GUID matches URL`);
        check(Boolean(records[outputPath(pathFor(item.link!))]), `${path}: RSS target exists`);
      }
      if (path === "/index.xml" || path === "/posts/index.xml")
        check(
          JSON.stringify(feed.items.map((i) => sameURL(i.link!)).sort()) ===
            JSON.stringify(
              content
                .filter((p) => p.section === "posts")
                .map((p) => urlKey(p.permalink))
                .sort(),
            ),
          `${path}: complete article feed`,
        );
      check(urlKey(feed.self!) === base + path, `${path}: RSS self`);
      check(feed.descriptionsAreText, `${path}: RSS summaries are XML text`);
      const articleItems = feed.items.filter((i) =>
        content.some((p) => p.section === "posts" && p.permalink === sameURL(i.link!)),
      );
      check(
        JSON.stringify(articleItems.map((i) => i.link)) ===
          JSON.stringify(
            [...articleItems]
              .sort(
                (a, b) =>
                  Date.parse(b.pubDate!) - Date.parse(a.pubDate!) ||
                  (pathFor(a.link!) < pathFor(b.link!) ? -1 : 1),
              )
              .map((i) => i.link),
          ),
        `${path}: article ordering`,
      );
      for (const item of feed.items) {
        const summary = Object.values(records)
          .flatMap((r) => r.summaries)
          .find((s) => sameURL(s.url) === sameURL(item.link!));
        if (summary)
          check(
            normalize(summary.text) === normalize(item.description ?? ""),
            `${path}: RSS/list summary match`,
            item.link,
          );
        const article = content.find((p) => p.permalink === sameURL(item.link!));
        if (article)
          check(Date.parse(item.pubDate!) === Date.parse(article.date), `${path}: RSS .Date`);
      }
    }
    const sitemap = await page.evaluate(
      (xml) => {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        return {
          error: doc.querySelector("parsererror")?.textContent,
          urls: [...doc.querySelectorAll("loc")].map((e) => e.textContent!),
        };
      },
      readFileSync(`${root}/sitemap.xml`, "utf8"),
    );
    check(!sitemap.error, "Valid sitemap XML");
    for (const item of content)
      check(sitemap.urls.map(sameURL).includes(item.permalink), `${item.path}: sitemap URL`);
    for (const url of sitemap.urls)
      check(
        new URL(url).origin === base && existsSync(root + outputPath(pathFor(url))),
        "Sitemap internal URL",
        url,
      );
    const robots = readFileSync(`${root}/robots.txt`, "utf8");
    check(
      environment === "production"
        ? robots.includes(`Sitemap: ${base}/sitemap.xml`) && !robots.includes("Disallow: /")
        : robots.trim() === "User-agent: *\nDisallow: /",
      "robots publication mode",
    );
    let decodedImages = 0;
    if (environment === "production") {
      await page.route("https://**/*", (route) => route.abort());
      await page.goto("http://127.0.0.1:4196/");
      const candidates = Object.values(records)
        .flatMap((r) => r.imageCandidates)
        .map((i) => ({ ...i, height: 0 }));
      const originals = Object.values(records)
        .flatMap((r) => r.images)
        .map((i) => ({ src: i.src, width: i.width, height: i.height }));
      const unique = [...new Map([...candidates, ...originals].map((i) => [i.src, i])).values()];
      const decoded = await page.evaluate(async (images) => {
        const results = [];
        for (const { src, width, height } of images) {
          const image = new Image();
          image.src = new URL(src).pathname;
          try {
            await image.decode();
            results.push({
              src,
              expected: width,
              expectedHeight: height,
              width: image.naturalWidth,
              height: image.naturalHeight,
            });
          } catch {
            results.push({ src, expected: width, expectedHeight: height, width: 0, height: 0 });
          }
        }
        return results;
      }, unique);
      decodedImages = decoded.length;
      for (const image of decoded)
        check(
          image.width === image.expected &&
            image.height > 0 &&
            (!image.expectedHeight || image.height === image.expectedHeight),
          "Decoded image dimensions",
          image,
        );
    }
    const report = {
      decodedImages,
      environment,
      browserName,
      html: Object.keys(records).length,
      feeds: Object.keys(rss).length,
      content: content.length,
      linksChecked,
      fragmentsChecked,
      imagesChecked,
      issues,
    };
    mkdirSync(".cache/site-results", { recursive: true });
    writeFileSync(
      `.cache/site-results/${environment}-${browserName}.json`,
      JSON.stringify(report, null, 2),
    );
    expect(issues, JSON.stringify({ issues }, null, 2)).toEqual([]);
  });
