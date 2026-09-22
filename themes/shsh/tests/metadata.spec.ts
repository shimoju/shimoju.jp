import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

const root = ".cache/metadata";
const base = "https://metadata.invalid/blog/";
async function head(page: Page, variant: string, path = "index.html") {
  return page.evaluate(
    (html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const meta = Object.fromEntries(
        [...doc.querySelectorAll("meta[name],meta[property]")].map((node) => [
          node.getAttribute("name") ?? node.getAttribute("property"),
          node.getAttribute("content"),
        ]),
      );
      return {
        title: doc.title,
        canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        feed: doc.querySelector('link[type="application/rss+xml"]')?.getAttribute("href"),
        subscribe: doc.querySelector('.site-footer a[aria-label="RSS"]')?.getAttribute("href"),
        meta,
        schema: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(
          (node) => JSON.parse(node.textContent ?? "") as Record<string, unknown>,
        ),
        dates: doc.querySelectorAll("time").length,
      };
    },
    readFileSync(`${root}/${variant}/${path}`, "utf8"),
  );
}
async function feed(page: Page, variant: string, path = "index.xml") {
  return page.evaluate(
    (xml) => {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      return {
        error: doc.querySelector("parsererror")?.textContent,
        title: doc.querySelector("channel > title")?.textContent,
        link: doc.querySelector("channel > link")?.textContent,
        description: doc.querySelector("channel > description")?.textContent,
        built: doc.querySelector("channel > lastBuildDate")?.textContent,
        items: [...doc.querySelectorAll("item")].map((item) => {
          const field = (name: string) => item.querySelector(`:scope > ${name}`)?.textContent;
          // Readers render the description as HTML; expose what they would show.
          const body = new DOMParser().parseFromString(
            field("description") ?? "",
            "text/html",
          ).body;
          return {
            title: field("title"),
            link: field("link"),
            guid: field("guid"),
            pubDate: field("pubDate"),
            html: body.innerHTML,
            text: body.textContent,
          };
        }),
        dates: [...doc.querySelectorAll("pubDate")].map((node) => node.textContent),
        self: doc
          .getElementsByTagNameNS("http://www.w3.org/2005/Atom", "link")[0]
          ?.getAttribute("href"),
      };
    },
    readFileSync(`${root}/${variant}/${path}`, "utf8"),
  );
}

test("RSS uses all ordered articles, HTML summaries, stable document GUIDs and the newest lastmod", async ({
  page,
}) => {
  const rss = await feed(page, "production");
  expect(rss.error).toBeUndefined();
  expect(rss.built).toBe("Wed, 02 Sep 2026 12:00:00 +0900");
  expect(rss.items).toHaveLength(15);
  expect(rss.items.slice(0, 3).map((i) => i.link)).toEqual([
    `${base}posts/a/`,
    `${base}posts/b/`,
    `${base}notes/c/`,
  ]);
  expect(rss.items[0]).toMatchObject({
    title: '日 & <x> "引" </script>',
    html: '<strong>要約</strong> &amp; <a href="https://example.org/">link</a> &lt;記号&gt;',
    text: "要約 & link <記号>",
    guid: `${base}posts/a/`,
    pubDate: "Tue, 01 Sep 2026 10:00:00 +0900",
  });
  expect(rss.items[1]).toMatchObject({
    html: "<p><strong>手動要約</strong> &amp; &lt;記号&gt;</p>",
    text: "手動要約 & <記号>",
  });
  expect(rss.items[2]?.html).toBe("");
  expect(rss.items[3]?.html).toBe(
    '<p>導入。</p>\n\n<h2 id="組み立て">組み立て</h2>\n<p>組み立てには #tag を使う。</p>',
  );
  const coded = rss.items[4]!;
  expect(coded.title).toBe("コード");
  expect(coded.html).toContain("<code>&lt;ul&gt;</code>");
  expect(coded.text).toMatch(/^<ul> を入れ子にする。内部\s+設定\s+config\.yml\s+box: ruby\s*$/);
  expect(coded.html).toContain('<span class="code-label" lang="en">config.yml</span>');
  expect(coded.html).toContain('<a href="https://metadata.invalid/posts/b/">内部</a>');
  expect(coded.html).toMatch(
    /<figure><img src="https:\/\/metadata\.invalid\/blog\/default\.png" alt="本文画像" width="200" height="100"><\/figure>$/,
  );
  for (const gone of ["<button", "copy-feedback", "heading-anchor", "srcset", "loading", "style="])
    expect(coded.html).not.toContain(gone);
  expect(rss.self).toBe(`${base}index.xml`);
  for (const item of rss.items) expect(item.guid).toBe(item.link);
  expect((await feed(page, "production", "posts/index.xml")).items).toHaveLength(14);
  expect((await feed(page, "production", "notes/index.xml")).items).toHaveLength(1);
  const preview = await feed(page, "preview");
  expect(preview.items[0]?.guid).toBe("https://preview.invalid/posts/a/");
});

test("taxonomy feeds contain term pages, term feeds filter posts, empty feeds have no fake dates", async ({
  page,
}) => {
  const terms = await feed(page, "production", "tags/index.xml");
  expect(terms.error).toBeUndefined();
  expect(terms.items.map((i) => i.title)).toEqual(["A & B", "Empty & none", "Quiet", "空"]);
  expect(terms.items[0]).toMatchObject({
    html: "分類要約 &amp; <strong>説明</strong>",
    text: "分類要約 & 説明",
  });
  expect(terms.items.find((i) => i.title === "Empty & none")?.pubDate).toBeUndefined();
  expect((await feed(page, "production", "tags/a--b/index.xml")).items).toHaveLength(14);
  expect((await feed(page, "production", "categories/index.xml")).items[0]?.title).toBe(
    "技術 & 日記",
  );
  const categoryPath = readdirSync(`${root}/production/categories`, { withFileTypes: true }).find(
    (f) => f.isDirectory(),
  )!.name;
  expect(
    (await feed(page, "production", `categories/${categoryPath}/index.xml`)).items,
  ).toHaveLength(14);
  for (const [variant, path] of [
    ["empty", "index.xml"],
    ["empty", "tags/index.xml"],
    ["production", "tags/empty/index.xml"],
  ]) {
    const rss = await feed(page, variant!, path);
    expect(rss.error).toBeUndefined();
    expect(rss.items).toEqual([]);
    expect(rss.dates).toEqual([]);
    expect(rss.built).toBeUndefined();
  }
});

test("canonical and discovery URLs follow the active pager and build baseURL", async ({ page }) => {
  for (const [variant, origin] of [
    ["production", base],
    ["preview", "https://preview.invalid/"],
  ]) {
    for (const path of [
      "",
      "page/2/",
      "posts/",
      "posts/page/2/",
      "tags/",
      "tags/a--b/",
      "tags/a--b/page/2/",
      "about/",
    ]) {
      const data = await head(page, variant!, `${path}index.html`);
      expect(data.canonical).toBe(origin! + path);
      expect(data.meta["og:url"]).toBe(data.canonical);
      expect(data.subscribe).toBe(variant === "production" ? "/blog/index.xml" : "/index.xml");
      expect(data.meta.robots).toBe(variant === "preview" ? "noindex,nofollow" : undefined);
      if (path === "about/") expect(data.feed).toBeUndefined();
      else expect(data.feed).toBe(origin! + path.replace(/page\/2\/$/, "") + "index.xml");
    }
  }
});

test("description, dates and JSON-LD preserve page roles and safe text", async ({ page }) => {
  const article = await head(page, "production", "posts/a/index.html");
  expect(article.meta.description).toBe("SEO & 説明");
  expect(article.meta["og:description"]).toBe(article.meta.description);
  expect(article.meta["twitter:description"]).toBe(article.meta.description);
  expect(article.schema[0]).toMatchObject({
    "@type": "BlogPosting",
    headline: '日 & <x> "引" </script>',
    datePublished: "2026-09-01T10:00:00+09:00",
    dateModified: "2026-09-02T12:00:00+09:00",
    url: article.canonical,
  });
  expect(article.meta["article:published_time"]).toBe(article.schema[0]?.datePublished);
  expect(article.schema[0]).not.toHaveProperty("articleBody");
  const fixed = await head(page, "production", "about/index.html");
  expect(fixed.dates).toBe(0);
  expect(fixed.schema[0]?.["@type"]).toBe("WebPage");
  expect(fixed.schema[0]?.datePublished).toBeTruthy();
  const undated = await head(page, "production", "undated/index.html");
  expect(undated.schema[0]).not.toHaveProperty("datePublished");
  expect(undated.schema[0]).not.toHaveProperty("dateModified");
  expect(undated.meta["article:published_time"]).toBeUndefined();
  expect((await head(page, "production", "posts/b/index.html")).meta.description).toBe(
    "手動要約 & <記号>",
  );
  // Heading anchors never leak "#" into automatic summaries; hashtags in the body stay.
  const headed = await head(page, "production", "posts/headed/index.html");
  expect(headed.meta.description).toBe("導入。\n組み立て 組み立てには #tag を使う。");
  expect(headed.meta["og:description"]).toBe(headed.meta.description);
  expect(headed.schema[0]?.description).toBe(headed.meta.description);
  const coded = await head(page, "production", "posts/coded/index.html");
  expect(coded.meta.description).toBe("<ul> を入れ子にする。内部\n設定 config.yml box: ruby");
  expect(coded.schema[0]?.description).toBe(coded.meta.description);
  const home = await head(page, "production");
  expect(home.meta.description).toBe("サイト & 説明");
  expect((await feed(page, "production")).description).toBe("サイト & 説明");
  expect(home.schema[0]?.["@graph"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ "@type": "WebSite", url: base }),
      expect.objectContaining({ "@type": "Person", name: '別著者 & "引用"' }),
    ]),
  );
});

test("lists without their own text fall back to the site description; explicit text is final", async ({
  page,
}) => {
  for (const path of [
    "posts/index.html",
    "posts/page/2/index.html",
    "tags/index.html",
    "tags/empty/index.html",
  ]) {
    const list = await head(page, "production", path);
    expect(list.meta.description, path).toBe("サイト & 説明");
    expect(list.meta["og:description"], path).toBe("サイト & 説明");
    expect(list.meta["twitter:description"], path).toBe("サイト & 説明");
  }
  for (const path of ["posts/index.xml", "tags/index.xml", "tags/empty/index.xml"]) {
    expect((await feed(page, "production", path)).description, path).toBe("サイト & 説明");
  }
  const explicit = await head(page, "production", "tags/a--b/index.html");
  expect(explicit.meta.description).toBe("分類説明 & <記号>");
  expect((await feed(page, "production", "tags/a--b/index.xml")).description).toBe(
    "分類説明 & <記号>",
  );
  // An explicit empty summary means "nothing to say" on lists and articles alike.
  for (const path of ["tags/quiet/index.html", "notes/c/index.html"]) {
    const quiet = await head(page, "production", path);
    expect(quiet.meta.description, path).toBeUndefined();
    expect(quiet.meta["og:description"], path).toBeUndefined();
    expect(quiet.meta["twitter:description"], path).toBeUndefined();
  }
  expect((await feed(page, "production", "tags/quiet/index.xml")).description).toBe("");
});

test("SNS images use cover, global assets/static/external defaults or none, never body images", async ({
  page,
}) => {
  const digest = createHash("sha256")
    .update(readFileSync("tests/fixtures/media/assets/small.png"))
    .digest("hex");
  for (const [variant, expected] of [
    ["production", undefined],
    ["assets", `${base}default.${digest}.png`],
    ["static", `${base}default.png?v=1&x=2`],
    ["external", "https://images.invalid/image.png?a=1&b=2"],
    ["protocol", "https://images.invalid/image.png"],
  ] as const) {
    const home = await head(page, variant);
    expect(home.meta["og:image"]).toBe(expected);
    expect(home.meta["twitter:image"]).toBe(expected);
    expect(home.meta["twitter:card"]).toBe(expected ? "summary_large_image" : "summary");
    const article = await head(page, variant, "posts/a/index.html");
    expect(article.meta["og:image"]).toBe(`${base}posts/a/cover.${digest}.png`);
    expect(article.schema[0]?.image).toBe(article.meta["og:image"]);
  }
  expect(
    (await head(page, "production", "first-image/index.html")).meta["og:image"],
  ).toBeUndefined();
});

test("all XML parses, sitemap and robots follow production and preview", async ({ page }) => {
  for (const variant of ["production", "preview", "empty"]) {
    for (const file of readdirSync(`${root}/${variant}`, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith(".xml"))) {
      const error = await page.evaluate(
        (xml) =>
          new DOMParser().parseFromString(xml, "application/xml").querySelector("parsererror")
            ?.textContent,
        readFileSync(`${root}/${variant}/${file}`, "utf8"),
      );
      expect(error, `${variant}/${file}`).toBeUndefined();
    }
  }
  const sitemap = readFileSync(`${root}/production/sitemap.xml`, "utf8");
  expect(sitemap).toContain(`${base}posts/a/`);
  expect(sitemap).not.toMatch(/posts\/(?:draft|future|expired|scheduled)\//);
  expect(readFileSync(`${root}/production/robots.txt`, "utf8")).toContain(
    `Sitemap: ${base}sitemap.xml`,
  );
  expect(readFileSync(`${root}/preview/robots.txt`, "utf8")).toContain("Disallow: /");
});
