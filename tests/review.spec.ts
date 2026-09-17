import { test, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const review = "http://127.0.0.1:4182";
const mockBase = "http://127.0.0.1:4177";
const article = "/2026/09/01/development-environment-2026/";
async function ready(page: Page) {
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
}
async function accessibility(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  for (const violation of result.violations) {
    expect(violation.id).toBe("color-contrast");
    for (const node of violation.nodes)
      for (const target of node.target)
        expect(
          await page
            .locator(String(target))
            .evaluate((element) => Boolean(element.closest(".chroma"))),
        ).toBe(true);
  }
  return result.violations;
}
function blocks(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const r = element.getBoundingClientRect();
      return {
        width: r.width,
        height: r.height,
        x: r.x,
        y: r.y,
        tag: element.tagName,
        text: element.textContent?.slice(0, 60),
        image: element.querySelector("img")?.outerHTML,
      };
    }),
  );
}
function sameGeometry(
  actual: Awaited<ReturnType<typeof blocks>>,
  expected: Awaited<ReturnType<typeof blocks>>,
) {
  expect(actual).toHaveLength(expected.length);
  for (const [i, block] of actual.entries())
    for (const key of ["width", "height", "x", "y"] as const)
      expect(Math.abs(block[key] - expected[i]![key]), `block ${i} ${key}`).toBeLessThan(0.06);
}

test.beforeEach(async ({ page }) => {
  // Normal CI never connects to live widgets. An empty response preserves the unloaded mount.
  await page.route("https://**/*", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
});

for (const [name, path, mock] of [
  ["home", "/", "home.html"],
  ["posts", "/posts/", "posts.html"],
  ["article", article, "article.html"],
  ["specimen", "/specimen/", "specimen.html"],
] as const)
  test(`R001 ${name} comparison, both widths/colors and text enlargement`, async ({
    page,
    browserName,
  }) => {
    test.setTimeout(90000);
    const evidence: unknown[] = [];
    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
    ] as const)
      for (const colorScheme of ["light", "dark"] as const) {
        await page.setViewportSize({ width, height });
        await page.emulateMedia({ colorScheme });
        await page.goto(review + path);
        await ready(page);
        const violations = await accessibility(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const selector =
          name === "home" || name === "posts"
            ? ".site-header, main, .post-entry, .pager, .site-footer"
            : ".site-header, .article-header, .prose > *";
        const actual = await blocks(page, selector);
        if (browserName === "chromium") {
          mkdirSync(".cache/review-images", { recursive: true });
          await page.screenshot({
            path: `.cache/review-images/${name}-${width}-${colorScheme}-shsh.png`,
            fullPage: true,
          });
        }
        for (const scale of [1.25, 2]) {
          await page.addStyleTag({ content: `:root { font-size: ${62.5 * scale}%; }` });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            `${name} ${width}px ${scale}x`,
          ).toBe(true);
          const fontSize = await page
            .locator(".site-name")
            .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
          expect(Math.abs(fontSize - 32.827 * scale)).toBeLessThan(0.06);
        }
        await page.goto(`${mockBase}/${mock}?theme=${colorScheme}`);
        await ready(page);
        const expected = await blocks(page, selector);
        // Specimen deliberately omits mock-only padding/font diagnostics and converts raw HTML inputs.
        // Full article comparison ends at prose: tags/adjacent posts are T010, after approval.
        mkdirSync(".cache/review-metrics", { recursive: true });
        writeFileSync(
          `.cache/review-metrics/${name}-${browserName}-${width}-${colorScheme}.json`,
          JSON.stringify({ actual, expected }, null, 2),
        );
        if (name !== "specimen") sameGeometry(actual, expected);
        if (browserName === "chromium")
          await page.screenshot({
            path: `.cache/review-images/${name}-${width}-${colorScheme}-mock.png`,
            fullPage: true,
          });
        evidence.push({ name, width, height, colorScheme, blocks: actual.length, violations });
      }
    if (browserName === "chromium")
      writeFileSync(
        `.cache/review-images/${name}-evidence.json`,
        JSON.stringify(evidence, null, 2),
      );
  });
