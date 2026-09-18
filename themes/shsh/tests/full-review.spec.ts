import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Screen = { name: string; title: string; mock: string; url: string };
const cases = JSON.parse(readFileSync(".cache/full-review/cases.json", "utf8")) as Screen[];
for (const screen of cases)
  test(`Full screen ${screen.name}`, async ({ browser, browserName }) => {
    test.setTimeout(90000);
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390,
      });
      const page = await context.newPage();
      await page.route("https://**/*", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
      );
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        const selector =
          ".site-header, main, .site-footer, .page-heading, .post-entry, .pager, .terms, .terms li, .archive-year, .archive-month, .archive-month li, .article-header, .prose > *, .article-end, .article-tags, .post-nav, .post-nav a, .recovery-nav, .empty";
        const evidence = [];
        for (const [kind, url] of [
          ["shsh", screen.url],
          ["mock", `http://127.0.0.1:4177/${screen.mock}?theme=${colorScheme}`],
        ]) {
          const response = await page.goto(url!);
          expect(response?.status()).toBe(200);
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
          if (kind === "shsh") {
            const result = await new AxeBuilder({ page }).analyze();
            mkdirSync(".cache/full-review/axe", { recursive: true });
            writeFileSync(
              `.cache/full-review/axe/${screen.name}-${browserName}-${width}-${colorScheme}.json`,
              JSON.stringify(result.violations, null, 2),
            );
            for (const violation of result.violations) {
              expect
                .soft(
                  violation.id,
                  `${screen.name} ${width} ${colorScheme}: ${JSON.stringify(violation.nodes.map((n) => n.target))}`,
                )
                .toBe("color-contrast");
              if (violation.id === "color-contrast")
                for (const node of violation.nodes)
                  for (const target of node.target)
                    expect
                      .soft(
                        await page
                          .locator(String(target))
                          .evaluate((e) => Boolean(e.closest(".chroma"))),
                      )
                      .toBe(true);
            }
            await expect(page.locator(".site-nav [aria-current=page]")).toHaveCount(
              /^(tags|tag-|categories|category-|about|archives)/.test(screen.name) ? 1 : 0,
            );
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
            ),
          ).toBe(true);
          evidence.push(
            await page.locator(selector).evaluateAll((elements) =>
              elements
                .filter((e) => e.getBoundingClientRect().height > 0)
                .map((e) => {
                  const r = e.getBoundingClientRect();
                  return { class: e.className, x: r.x, y: r.y, width: r.width, height: r.height };
                }),
            ),
          );
          if (browserName === "chromium") {
            mkdirSync(".cache/full-review/images", { recursive: true });
            await page.screenshot({
              path: `.cache/full-review/images/${screen.name}-${width}-${colorScheme}-${kind}.png`,
              fullPage: true,
            });
          }
          if (kind === "shsh")
            for (const scale of [1.25, 2]) {
              await page.addStyleTag({ content: `:root { font-size: ${62.5 * scale}%; }` });
              expect(
                await page.evaluate(
                  () =>
                    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
                ),
                `${screen.name} ${width}px text ${scale}x`,
              ).toBe(true);
            }
        }
        mkdirSync(".cache/full-review/metrics", { recursive: true });
        writeFileSync(
          `.cache/full-review/metrics/${screen.name}-${browserName}-${width}-${colorScheme}.json`,
          JSON.stringify(evidence, null, 2),
        );
        const [actual, expected] = evidence;
        expect(actual).toHaveLength(expected!.length);
        for (const [i, block] of actual!.entries())
          for (const key of ["x", "y", "width", "height"] as const)
            expect(
              Math.abs(block[key] - expected![i]![key]),
              `${screen.name} ${width} ${colorScheme} ${block.class} ${key}`,
            ).toBeLessThan(0.06);
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
