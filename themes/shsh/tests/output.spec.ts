import { test, expect, type Page } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { HtmlValidate, type ConfigData } from "html-validate";

const base = new URL("https://example.invalid/blog/");
const variants = ["plain", "minified"] as const;
const config = JSON.parse(readFileSync(".htmlvalidate.json", "utf8")) as ConfigData;
const code = "first line\n  indented & <literal>\n\nlast line";

function output(variant: string) {
  const root = `.cache/output/${variant}/blog`;
  const files = new Set(
    readdirSync(root, { recursive: true, encoding: "utf8" }).filter((file) =>
      statSync(`${root}/${file}`).isFile(),
    ),
  );
  const html = Object.fromEntries(
    [...files]
      .filter((file) => file.endsWith(".html"))
      .map((file) => [file, readFileSync(`${root}/${file}`, "utf8")]),
  );
  return { files, html };
}

async function documents(page: Page, html: Record<string, string>) {
  return page.evaluate((sources) => {
    return Object.fromEntries(
      Object.entries(sources).map(([file, source]) => {
        const doc = new DOMParser().parseFromString(source, "text/html");
        const references = [...doc.querySelectorAll("[href], [src], [srcset]")].flatMap((node) => {
          const values = [node.getAttribute("href"), node.getAttribute("src")];
          // Hugo emits comma-separated URLs with width descriptors for these fixture images.
          for (const candidate of node.getAttribute("srcset")?.split(",") ?? [])
            values.push(candidate.trim().split(/\s+/)[0]!);
          return values.filter((value): value is string => value !== null);
        });
        return [
          file,
          {
            references,
            ids: [...doc.querySelectorAll("[id]")].map((node) => node.id),
            canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
            refresh: doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content"),
          },
        ];
      }),
    );
  }, html);
}

function referenceErrors(docs: Awaited<ReturnType<typeof documents>>, files: Set<string>) {
  const errors: string[] = [];
  for (const [file, doc] of Object.entries(docs)) {
    const pageURL = new URL(file.replace(/index\.html$/, ""), base);
    const references = [...doc.references];
    if (doc.refresh !== undefined && doc.refresh !== null) {
      const target = doc.refresh.match(/^0;\s*url=(.+)$/i)?.[1];
      if (
        !target ||
        !doc.canonical ||
        new URL(target, pageURL).href !== new URL(doc.canonical, pageURL).href
      )
        errors.push(`${file}: redirect differs from canonical`);
      if (target) {
        references.push(target);
        if (new URL(target, pageURL).origin !== base.origin)
          errors.push(`${file}: fixture redirect leaves the site`);
      }
    }
    for (const reference of references) {
      const url = new URL(reference, pageURL);
      if (url.origin !== base.origin) continue;
      if (!url.pathname.startsWith(base.pathname)) {
        errors.push(`${file}: outside baseURL: ${reference}`);
        continue;
      }
      let target = decodeURIComponent(url.pathname.slice(base.pathname.length));
      if (!target || target.endsWith("/")) target += "index.html";
      else if (!files.has(target) && files.has(`${target}/index.html`)) target += "/index.html";
      if (!files.has(target)) {
        errors.push(`${file}: missing file: ${reference}`);
        continue;
      }
      if (url.hash && target.endsWith(".html")) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (!docs[target]?.ids.includes(id)) errors.push(`${file}: missing fragment: ${reference}`);
      }
    }
  }
  return errors;
}

for (const variant of variants) {
  test(`${variant} theme HTML is valid and every internal reference resolves`, async ({ page }) => {
    const { files, html } = output(variant);
    const validator = new HtmlValidate(
      variant === "minified"
        ? {
            ...config,
            rules: {
              ...config.rules,
              "attr-quotes": ["error", { style: "any", unquoted: true }],
              "no-raw-characters": ["error", { relaxed: true }],
            },
          }
        : config,
    );
    for (const [file, source] of Object.entries(html)) {
      const report = await validator.validateString(source);
      expect(report.valid, `${variant}/${file}: ${JSON.stringify(report.results)}`).toBe(true);
    }
    const docs = await documents(page, html);
    expect(referenceErrors(docs, files)).toEqual([]);
    // Keep these cases present so the traversal cannot silently lose coverage.
    expect(files.has("tags/日本語/page/2/index.html")).toBe(true);
    expect(files.has("categories/技術/page/2/index.html")).toBe(true);
    expect(docs["old-output/index.html"]?.refresh).toContain("/blog/output/");
    expect(docs["output/index.html"]?.ids).toContain("日本語見出し");
    expect(docs["output/index.html"]?.references.some((ref) => ref.endsWith(".webp"))).toBe(true);
    expect(docs["index.html"]?.references).toContain(`${base}index.xml`);
  });

  test(`${variant} theme preserves inline spacing, code whitespace and copying`, async ({
    page,
  }) => {
    await page.route("https://**/*", (route) => route.abort());
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText(text: string) {
            document.documentElement.dataset.copied = text;
            return Promise.resolve();
          },
        },
      });
    });
    const port = variant === "plain" ? 4177 : 4178;
    expect((await page.goto(`http://127.0.0.1:${port}/blog/output/`))?.status()).toBe(200);
    const paragraphs = page.locator(".prose > p");
    // Exact rendered strings: whitespace normalization would conceal a minifier regression.
    expect(await paragraphs.nth(0).innerText()).toBe("Before inline emphasis after.");
    expect(await paragraphs.nth(1).innerText()).toBe("OneTwosuffix.");
    expect(await paragraphs.nth(2).innerText()).toBe("前強調後。 A inline code B.");
    await expect(paragraphs.nth(2).locator("strong")).toHaveText("強調");
    const block = page.locator(".code-block");
    expect(await block.locator("pre code").textContent()).toBe(code);
    await expect(block.locator("pre")).toHaveCSS("white-space", "pre");
    await block.hover();
    await block.getByRole("button").click();
    await expect(page.locator("html")).toHaveAttribute("data-copied", code);
    await expect(block.getByRole("status")).toHaveText("Code copied.");
  });
}

test("reference validation detects broken files, fragments, srcset and aliases", async ({
  page,
}) => {
  const { files, html } = output("plain");
  for (const [markup, expected] of [
    ['<a href="/blog/page/0/">Broken pager</a>', "missing file"],
    ['<a href="/blog/output/#missing">Broken heading anchor</a>', "missing fragment"],
    ['<a href="/blog/output#missing">Broken anchor on a directory URL</a>', "missing fragment"],
    ['<img srcset="/blog/missing.webp 360w">', "missing file"],
    ['<a href="/output/">Lost baseURL subpath</a>', "outside baseURL"],
    [
      '<link rel="canonical" href="/blog/output/"><meta http-equiv="refresh" content="0; url=/blog/about/">',
      "redirect differs from canonical",
    ],
    [
      '<link rel="canonical" href="/blog/missing/"><meta http-equiv="refresh" content="0; url=/blog/missing/">',
      "missing file",
    ],
  ] as const) {
    const docs = await documents(page, { ...html, "probe.html": markup });
    expect(referenceErrors(docs, new Set([...files, "probe.html"])).join("\n"), markup).toContain(
      expected,
    );
  }
});

test("minified variant actually transforms the theme HTML", () => {
  const plain = output("plain").html["output/index.html"]!;
  const minified = output("minified").html["output/index.html"]!;
  expect(minified).not.toBe(plain);
  expect(minified.length).toBeLessThan(plain.length);
});
