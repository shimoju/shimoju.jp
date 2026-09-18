import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText(text: string) {
          document.documentElement.dataset.copied = text;
          if (document.documentElement.dataset.failCopy) return Promise.reject(new Error("Denied"));
          return Promise.resolve();
        },
      },
    });
  });
});

test("copy preserves code with Japanese, inline/table numbers, unknown language and no label", async ({
  page,
}) => {
  await page.goto("/specimen/?copy=failure");
  const expected = [
    '# 日本語コメント\nputs "Hello & <world>"',
    '# config.toml — 行番号と強調行の確認\n[tools]\nruby = "3.4"\nnode = "24"',
    "日本語の一行目\nSecond line",
    "言語なし\nABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz",
    "未知の言語 & <sample>",
  ];
  await expect(page.locator(".code-label")).toHaveText([
    "RUBY",
    "TOML · config.toml",
    "TEXT · table.txt",
    "EXAMPLE-UNKNOWN · example.txt",
  ]);
  await expect(page.locator(".code-block").nth(1).locator(".hl")).toHaveCount(1);
  for (const [i, code] of expected.entries()) {
    const block = page.locator(".code-block").nth(i);
    await block.hover();
    await block.getByRole("button").click();
    await expect(page.locator("html")).toHaveAttribute("data-copied", code);
    await expect(block.getByRole("button")).toHaveAccessibleName("Copied");
    await expect(block.getByRole("status")).toHaveText("Code copied.");
  }
});

test("failed copy announces manual fallback, permits retry, and resets success after three seconds", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-17T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-17T00:00:01Z"));
  await page.goto("/specimen/");
  const block = page.locator(".code-block").first();
  await page.evaluate(() => {
    document.documentElement.dataset.failCopy = "true";
  });
  await block.hover();
  await block.getByRole("button").click();
  await expect(block.getByRole("button")).toBeEnabled();
  await expect(block.getByRole("status")).toHaveText(
    "Copy failed. Select the code and copy it manually, or retry.",
  );
  await page.evaluate(() => {
    delete document.documentElement.dataset.failCopy;
  });
  await block.getByRole("button").click();
  await page.clock.fastForward(2999);
  await expect(block.getByRole("button")).toHaveAccessibleName("Copied");
  await page.clock.fastForward(1);
  await expect(block.getByRole("button")).toHaveAccessibleName("Copy code");
  await expect(block.getByRole("status")).toBeEmpty();
});

test("keyboard reveals copy and Escape returns focus to selectable code", async ({
  page,
  browserName,
}) => {
  await page.goto("/specimen/");
  const button = page.locator(".copy").first();
  for (let i = 0; i < 35; i++) {
    if (await button.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  }
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(button).toHaveCSS("opacity", "0");
  await expect(page.locator(".code-block").first().locator("pre")).toBeFocused();
  await page.keyboard.press(browserName === "webkit" ? "Shift+Alt+Tab" : "Shift+Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAccessibleName("Copied");
});

test("touch reveals copy, outside tap and horizontal scroll dismiss it", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 400, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/specimen/");
  const block = page.locator(".code-block").nth(3);
  await block.locator("pre").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "1");
  await block.locator("pre").evaluate((element) => {
    element.scrollLeft = 100;
  });
  await expect(block.getByRole("button")).toHaveCSS("opacity", "0");
  await block.locator("pre").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "1");
  await page.locator("h1").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "0");
  await context.close();
});

test("prose matches mock type and spacing; footnotes, headings, dates and JS-free reading work", async ({
  page,
  context,
  browser,
}) => {
  const mock = await context.newPage();
  const selectors = [
    ".article-header",
    ".article-header h1",
    ".prose",
    ".prose h2",
    ".prose h3",
    ".prose h4",
    ".prose h5",
    ".prose h6",
    ".prose blockquote",
    ".prose ul",
    ".prose th",
    ".prose > .code-block",
    ".prose > .code-block .code-label",
    ".prose > .code-block pre",
    ".footnotes",
  ];
  const styles = async (target: typeof page, selector: string) =>
    target
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.fontSize,
          style.fontFamily,
          style.fontWeight,
          style.lineHeight,
          style.color,
          style.paddingTop,
          style.paddingLeft,
          style.marginBottom,
        ];
      });
  for (const width of [1280, 400]) {
    await page.setViewportSize({ width, height: 900 });
    await mock.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("/specimen/");
      await mock.goto(`http://127.0.0.1:4177/specimen.html?theme=${colorScheme}`);
      for (const selector of selectors)
        expect(await styles(page, selector), selector).toEqual(await styles(mock, selector));
      const viewport = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // Classic scrollbars consume viewport width on Linux and Windows.
      expect(viewport.scrollWidth).toBe(viewport.clientWidth);
      if (width === 400)
        expect(
          await page
            .locator(".table-scroll")
            .nth(1)
            .evaluate((element) => element.scrollWidth > element.clientWidth),
        ).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      for (const violation of result.violations) {
        expect(violation.id).toBe("color-contrast");
        for (const node of violation.nodes)
          for (const target of node.target) {
            expect(
              await page
                .locator(String(target))
                .evaluate((element) => Boolean(element.closest(".chroma"))),
            ).toBe(true);
          }
      }
      await test.info().attach(`prose-axe-${width}-${colorScheme}`, {
        body: JSON.stringify(result.violations),
        contentType: "application/json",
      });
    }
  }
  await expect(page.locator(".article-header .meta")).toHaveText("2026/09/02 Updated 2026/09/03");
  await page.locator('a[href="#fn:1"]').click();
  await expect(page).toHaveURL(/#fn:1$/);
  await page.locator(".footnote-backref").click();
  await expect(page).toHaveURL(/#fnref:1$/);
  await mock.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noJS.newPage();
  await plain.goto("http://127.0.0.1:4174/specimen/");
  await expect(plain.locator(".copy:visible")).toHaveCount(0);
  await expect(plain.locator("pre").first()).toContainText("日本語コメント");
  await noJS.close();
});

test("full real article preserves mock prose layout in both palettes and widths", async ({
  page,
  context,
  browserName,
}) => {
  const mock = await context.newPage();
  const blocks = async (target: typeof page) =>
    target.locator(".prose").evaluate((prose) => {
      const start = prose.getBoundingClientRect().top;
      return Array.from(prose.children).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          top: rect.top - start,
          width: rect.width,
          height: rect.height,
        };
      });
    });
  for (const width of [1280, 400]) {
    await page.setViewportSize({ width, height: 900 });
    await mock.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("http://127.0.0.1:4178/real/");
      await mock.goto(`http://127.0.0.1:4177/article-hugo.html?theme=${colorScheme}`);
      const actual = await blocks(page);
      const expected = await blocks(mock);
      expect(actual.length).toBe(expected.length);
      for (const [i, block] of actual.entries()) {
        expect(block.tag).toBe(expected[i]?.tag);
        for (const dimension of ["top", "width", "height"] as const)
          expect(
            Math.abs(block[dimension] - (expected[i]?.[dimension] ?? 0)),
            `${width}/${colorScheme}/${i}/${dimension}`,
          ).toBeLessThan(0.05);
      }
      if (browserName === "chromium") {
        await page
          .locator(".prose")
          .screenshot({ path: `.cache/prose-images/${width}-${colorScheme}-shsh.png` });
        await mock
          .locator(".prose")
          .screenshot({ path: `.cache/prose-images/${width}-${colorScheme}-mock.png` });
      }
    }
  }
  await mock.close();
});
