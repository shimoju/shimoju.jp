import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { readFileSync } from "node:fs";

type Screen = { name: string; title: string; url: string };
const cases = JSON.parse(readFileSync(".cache/screen-variants/cases.json", "utf8")) as Screen[];
for (const screen of cases)
  test(`Screen ${screen.name}: layout and accessibility`, async ({ browser, browserName }) => {
    test.setTimeout(90000);
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390,
      });
      const page = await context.newPage();
      if (browserName === "chromium")
        expect(await page.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(width !== 390);
      await page.route("https://**/*", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
      );
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        expect((await page.goto(screen.url))?.status()).toBe(200);
        if (screen.name === "about")
          await expect(page.locator(".prose table").first().locator("th")).toHaveText([
            "業務経験",
            "技術",
            "経験年数",
          ]);
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images].map(async (img) => {
              img.loading = "eager";
              await img.decode();
            }),
          );
        });
        const video = page.locator("video");
        if (await video.count())
          await expect
            .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
            .toBeGreaterThanOrEqual(1);
        const result = await new AxeBuilder({ page }).analyze();
        for (const violation of result.violations) {
          expect
            .soft(
              violation.id,
              `${screen.name}: ${JSON.stringify(violation.nodes.map((n) => n.target))}`,
            )
            .toBe("color-contrast");
          for (const node of violation.nodes)
            for (const target of node.target)
              expect
                .soft(
                  await page.locator(String(target)).evaluate((e) => Boolean(e.closest(".chroma"))),
                )
                .toBe(true);
        }
        await expect(page.locator(".site-nav [aria-current=page]")).toHaveCount(
          /^(tags|tag-|categories|category-|about|archives)/.test(screen.name) ? 1 : 0,
        );
        for (const scale of [1, 1.25, 2]) {
          await page.addStyleTag({ content: `:root { font-size: ${62.5 * scale}%; }` });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
            ),
            `${screen.name} ${width}px text ${scale}x`,
          ).toBe(true);
          const fontSize = await page
            .locator(".site-name")
            .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
          expect(Math.abs(fontSize - 32.827 * scale)).toBeLessThan(0.06);
        }
      }
      await context.close();
    }
  });

test("prose specimen preserves Japanese and English emphasis, nesting and inline code", async ({
  page,
}) => {
  await page.route("https://**/*", (route) => route.fulfill({ body: "" }));
  await page.goto("http://127.0.0.1:4182/specimen/");
  const sample = page
    .locator(".prose > p")
    .filter({ hasText: "通常の日本語とEnglish 0123に対して" });
  await expect(sample).not.toContainText("**");
  await expect(sample.locator("strong")).toHaveText([
    "重要な日本語とEnglish 0123（strong）",
    "注目する日本語とEnglish 0123（b）",
    "強調の中の入れ子の太字",
    "inline_code",
  ]);
  await expect(sample.locator("strong > code")).toHaveText("inline_code");
  for (const emphasis of await sample.locator("strong, strong > code").all())
    await expect(emphasis).toHaveCSS("font-weight", "700");
});

test("link hover underlines require hover support while keyboard focus stays visible", async ({
  browser,
  browserName,
}) => {
  const cases = [
    { url: "http://127.0.0.1:4182/", link: ".site-nav a", decoration: ".site-nav a" },
    { url: "http://127.0.0.1:4182/", link: ".entry-link", decoration: ".entry-title" },
    {
      url: "http://127.0.0.1:4188/tags/sample-tag/",
      link: ".pager a",
      decoration: ".pager a",
    },
    { url: "http://127.0.0.1:4182/tags/", link: ".terms a", decoration: ".term-name" },
    {
      url: "http://127.0.0.1:4182/archives/",
      link: ".archive-month a",
      decoration: ".archive-title",
    },
    {
      url: "http://127.0.0.1:4182/404.html",
      link: ".recovery-nav a",
      decoration: ".recovery-nav a",
    },
    {
      url: "http://127.0.0.1:4182/2026/09/01/development-environment-2026/",
      link: ".article-tags a",
      decoration: ".article-tags a",
    },
    {
      url: "http://127.0.0.1:4182/2026/09/01/development-environment-2026/",
      link: ".post-nav a",
      decoration: ".post-nav-title",
    },
  ];
  for (const hasTouch of [false, true]) {
    const context = await browser.newContext({ hasTouch });
    const page = await context.newPage();
    await page.route("https://**/*", (route) => route.fulfill({ body: "" }));
    for (const target of cases) {
      await page.goto(target.url);
      const link = page.locator(target.link).first();
      const decoration = page.locator(target.decoration).first();
      await expect(decoration).toHaveCSS("text-decoration-line", "none");
      await link.hover();
      const supportsHover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
      if (browserName === "chromium") expect(supportsHover).toBe(!hasTouch);
      await expect(decoration).toHaveCSS(
        "text-decoration-line",
        supportsHover ? "underline" : "none",
      );
      if (hasTouch) {
        await page.keyboard.press("Tab");
        await link.focus();
        expect(await link.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
        await expect(decoration).toHaveCSS("text-decoration-line", "underline");
      }
    }
    await context.close();
  }
});

test("discovery semantics, keyboard, fixed pages and JavaScript-disabled navigation", async ({
  browser,
}) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled });
    const page = await context.newPage();
    await page.route("https://**/*", (route) => route.fulfill({ body: "" }));
    await page.goto("http://127.0.0.1:4182/archives/");
    await expect(page.locator(".archive-year h2")).toHaveText(["2026", "2023", "2016"]);
    await expect(page.locator(".archive-month h3")).toHaveText(["Sep", "Jun", "Aug"]);
    await expect(page.locator(".archive-month a")).toHaveCount(5);
    const paths = await page
      .locator(".archive-month a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    for (const [index, path] of paths.entries()) {
      await page.goto(`http://127.0.0.1:4182${path}`);
      await expect(page.locator('.post-nav a[rel="prev"]')).toHaveCount(index ? 1 : 0);
      await expect(page.locator('.post-nav a[rel="next"]')).toHaveCount(
        index < paths.length - 1 ? 1 : 0,
      );
      if (index)
        await expect(page.locator('.post-nav a[rel="prev"]')).toHaveAttribute(
          "href",
          paths[index - 1]!,
        );
      if (index < paths.length - 1) {
        const next = page.locator('.post-nav a[rel="next"]');
        await expect(next).toHaveAttribute("href", paths[index + 1]!);
        await next.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(`http://127.0.0.1:4182${paths[index + 1]}`);
      }
    }
    for (const path of ["about", "hidden-dates", "undated"]) {
      await page.goto(`http://127.0.0.1:4182/${path}/`);
      await expect(page.locator(".article-tags, .post-nav")).toHaveCount(0);
      if (path !== "about") await expect(page.locator(".article-header .meta")).toHaveCount(0);
    }
    await page.goto("http://127.0.0.1:4195/posts/");
    await expect(page.locator(".entry-summary, .pager")).toHaveCount(0);
    await page.locator(".entry-link").click();
    await expect(page.locator(".post-nav, .article-tags")).toHaveCount(0);
    for (const kind of ["tags", "categories"]) {
      await page.goto(
        `http://127.0.0.1:4188/${kind}/sample-${kind === "tags" ? "tag" : "category"}/`,
      );
      await expect(page.locator(".page-heading p")).toHaveText("5 posts");
      await page.locator(".next-page").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".page-number")).toHaveText("2 / 3");
      await page.locator(".next-page").click();
      await expect(page.locator(".post-entry")).toHaveCount(1);
      await expect(page.locator(".next-page")).toHaveCount(0);
    }
    await page.goto("http://127.0.0.1:4182/404.html");
    await page.getByRole("link", { name: "Browse Archives" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:4182/archives/");
    await context.close();
  }
});
